import Anthropic from '@anthropic-ai/sdk'
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { createGoalRepository } from '../db/goals'
import { createPlayerRepository } from '../db/player'
import { createRunRepository } from '../db/runs'
import { createUserExerciseRepository } from '../db/userExercises'
import { LESSON_KINDS, runLessonTurn, type LessonKind, type LessonTurn } from './lesson'

/**
 * `POST /api/lesson` — one turn of a conversation with the teacher, streamed.
 *
 * Server-sent events rather than a single JSON answer: a lesson turn can run
 * several tool calls, and the player should see it reading their history rather
 * than a spinner. The practice is untouched by any of this; if the key is
 * missing the app is exactly as usable as it was before.
 */

/** The whole conversation comes up each turn: the Worker keeps no state, as the MCP server does not. */
const MOST_TURNS = 60
const LONGEST_TURN = 8000

function sse(event: unknown): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

function badRequest(message: string): Response {
  return new Response(JSON.stringify({ status: 'invalid', message }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  })
}

function readKey(): string | null {
  const fromWorker = (env as Record<string, unknown>).ANTHROPIC_API_KEY
  if (typeof fromWorker === 'string' && fromWorker.length > 0) return fromWorker
  const fromProcess = typeof process === 'undefined' ? undefined : process.env?.ANTHROPIC_API_KEY
  return typeof fromProcess === 'string' && fromProcess.length > 0 ? fromProcess : null
}

function readTurns(input: unknown): LessonTurn[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MOST_TURNS) return null
  const turns: LessonTurn[] = []
  for (const entry of input) {
    if (typeof entry !== 'object' || entry === null) return null
    const { role, content } = entry as { role?: unknown; content?: unknown }
    if (role !== 'user' && role !== 'assistant') return null
    if (typeof content !== 'string' || content.trim().length === 0 || content.length > LONGEST_TURN) return null
    turns.push({ role, content })
  }
  // A conversation the model can answer has to end with the player.
  return turns[turns.length - 1].role === 'user' ? turns : null
}

export const lessonEndpoint: APIRoute = async ({ request, locals }) => {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } })

  const auth = (locals as { auth?: () => { userId: string | null } }).auth
  const clerkUserId = typeof auth === 'function' ? auth().userId : null
  if (!clerkUserId) {
    return new Response(JSON.stringify({ status: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest('Send JSON.')
  }

  const { kind, turns: rawTurns } = (body ?? {}) as { kind?: unknown; turns?: unknown }
  if (!LESSON_KINDS.includes(kind as LessonKind)) return badRequest('kind: one of first_lesson, check_in, after_session')
  const turns = readTurns(rawTurns)
  if (!turns) return badRequest('turns: the conversation so far, ending with the player.')

  const key = readKey()
  const client = key ? new Anthropic({ apiKey: key }) : null

  const hyperdrive = env.HYPERDRIVE
  const events = runLessonTurn(
    {
      client,
      kind: kind as LessonKind,
      tools: {
        clerkUserId,
        userExercises: createUserExerciseRepository({ hyperdrive }),
        runs: createRunRepository({ hyperdrive }),
        goals: createGoalRepository({ hyperdrive }),
        player: createPlayerRepository({ hyperdrive }),
      },
    },
    turns,
  )

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const event of events) controller.enqueue(encoder.encode(sse(event)))
      } catch {
        controller.enqueue(encoder.encode(sse({ type: 'error', message: 'The lesson stopped unexpectedly.' })))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    },
  })
}
