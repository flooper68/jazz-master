import ReactMarkdown, { type Components } from 'react-markdown'

/**
 * The teacher writes in markdown — a bold word, a short list, a tune title in
 * italics — and so does its summary of a lesson. One renderer, one set of
 * classes, used by the conversation and by the practice log alike, so a
 * summary reads like the conversation it came from.
 *
 * Only the inline and block forms a teacher would actually use are styled;
 * anything else falls through to the browser's defaults inside the same type.
 */

const components: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-fg">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <h3 className="mb-1 mt-3 font-display text-base font-semibold tracking-tight first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-1 mt-3 font-display text-base font-semibold tracking-tight first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1 mt-3 text-sm font-semibold first:mt-0">{children}</h4>,
  code: ({ children }) => <code className="rounded bg-panel-2 px-1 py-0.5 font-mono text-[0.9em]">{children}</code>,
  a: ({ children, href }) => (
    <a href={href} className="underline underline-offset-4 hover:text-fg" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-line pl-3 text-fg-2">{children}</blockquote>,
  hr: () => <hr className="my-3 border-line" />,
}

export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`text-sm leading-relaxed text-fg ${className}`}>
      <ReactMarkdown components={components}>{text}</ReactMarkdown>
    </div>
  )
}
