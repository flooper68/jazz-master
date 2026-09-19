import type Anthropic from '@anthropic-ai/sdk'
import { AGENT_PROMPTS } from '../../agentTools/prompts'
import { MCP_TOOLS, type McpToolContext } from '../mcp/tools'

/**
 * The lesson: a conversation with the teacher, run in the Worker
 * (docs/product/next-session-design.md §10).
 *
 * The model drives, and it drives through *exactly* the call table the MCP
 * server serves — `MCP_TOOLS`, not a copy — so a path written in the app is
 * held to what one written over MCP is, and a descriptor change lands on all
 * three doors at once. The script it follows is `AGENT_PROMPTS`, the same text
 * an outside client fetches with `prompts/get`.
 *
 * The practice never knows a lesson happened. Nothing here writes a run or
 * touches a due date; the model's only reach into the app is the tools, and the
 * tools are the ones the user's own buttons use.
 */

/** Which script this lesson runs. Mirrors the four inputs of §10. */
export const LESSON_KINDS = ['first_lesson', 'check_in', 'after_session'] as const
export type LessonKind = (typeof LESSON_KINDS)[number]

/**
 * A lesson is a conversation, not an agent loop: the model asks, the player
 * answers. This bounds one *turn* — the tool calls it may make before it has to
 * say something — so a confused model cannot spend a budget in silence.
 */
export const MOST_TOOL_ROUNDS = 12

/** What the client sends: the whole conversation so far, as plain turns. */
export interface LessonTurn {
  role: 'user' | 'assistant'
  content: string
}

export type LessonEvent =
  | { type: 'text'; text: string }
  | { type: 'tool'; name: string; ok: boolean }
  | { type: 'done' }
  | { type: 'error'; message: string }

export interface LessonDeps {
  /** Null when no API key is configured — the endpoint then answers `unconfigured`. */
  client: Anthropic | null
  tools: McpToolContext
  kind: LessonKind
  /** Overridable so tests can pin a model without pinning the default. */
  model?: string
}

export const LESSON_MODEL = 'claude-opus-5'

/** The tool definitions the model sees, straight from the shared descriptors. */
export function lessonTools(): Anthropic.Tool[] {
  return MCP_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
  }))
}

/** The script for this kind of lesson, as the system prompt. */
export function lessonSystem(kind: LessonKind): string {
  const prompt = AGENT_PROMPTS.find((candidate) => candidate.name === kind)
  if (!prompt) throw new Error(`no script for lesson kind: ${kind}`)
  return prompt.text
}

/**
 * Run one turn of the lesson, yielding events as they happen.
 *
 * The loop is written by hand rather than on the SDK's tool runner: the runner
 * is beta, and what it saves — the request/execute/loop cycle — is the part we
 * already have a call table for. Everything else here (the round cap, reporting
 * each tool to the page) is ours either way.
 */
export async function* runLessonTurn(
  deps: LessonDeps,
  turns: readonly LessonTurn[],
): AsyncGenerator<LessonEvent> {
  if (!deps.client) {
    yield { type: 'error', message: 'The teacher is not available: this Count-in has no model key configured.' }
    return
  }

  const messages: Anthropic.MessageParam[] = turns.map((turn) => ({ role: turn.role, content: turn.content }))
  const tools = lessonTools()
  const system = lessonSystem(deps.kind)

  for (let round = 0; round < MOST_TOOL_ROUNDS; round += 1) {
    let response: Anthropic.Message
    try {
      response = await deps.client.messages.create({
        model: deps.model ?? LESSON_MODEL,
        max_tokens: 8000,
        system,
        tools,
        messages,
      })
    } catch (error) {
      // The model's own faults are the player's problem only as a sentence.
      console.error(JSON.stringify({ event: 'lesson_model_error', message: error instanceof Error ? error.message : String(error) }))
      yield { type: 'error', message: 'The teacher could not answer just now. Try again in a moment.' }
      return
    }

    for (const block of response.content) {
      if (block.type === 'text' && block.text.length > 0) yield { type: 'text', text: block.text }
    }

    if (response.stop_reason !== 'tool_use') {
      yield { type: 'done' }
      return
    }

    const calls = response.content.filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
    messages.push({ role: 'assistant', content: response.content })

    // Every result goes back in one user message: splitting them teaches the
    // model to stop asking for several at once.
    const results: Anthropic.ToolResultBlockParam[] = []
    for (const call of calls) {
      const tool = MCP_TOOLS.find((candidate) => candidate.name === call.name)
      if (!tool) {
        results.push({ type: 'tool_result', tool_use_id: call.id, content: `No such tool: ${call.name}`, is_error: true })
        yield { type: 'tool', name: call.name, ok: false }
        continue
      }
      try {
        const answer = await tool.call(call.input ?? {}, deps.tools)
        const text = answer.content.map((part) => part.text).join('\n')
        results.push({ type: 'tool_result', tool_use_id: call.id, content: text, is_error: answer.isError === true })
        yield { type: 'tool', name: call.name, ok: answer.isError !== true }
      } catch {
        // A thrown tool is ours, not the model's; it still needs an answer or the turn stalls.
        results.push({ type: 'tool_result', tool_use_id: call.id, content: 'The app could not do that.', is_error: true })
        yield { type: 'tool', name: call.name, ok: false }
      }
    }
    messages.push({ role: 'user', content: results })
  }

  // Out of rounds: say so rather than stopping silently mid-thought.
  yield { type: 'error', message: 'The teacher got stuck working that out. Tell it what you want and it will try again.' }
}
