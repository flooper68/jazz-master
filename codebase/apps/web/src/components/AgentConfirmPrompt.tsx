import { useEffect, useRef, useSyncExternalStore } from 'react'
import { agentConfirm, type AgentConfirm } from '../webmcp/agentConfirm'
import { Button } from './ui/Primitives'

/**
 * The user's say over what an AI assistant in their browser may change, delete
 * or take them away from: the assistant's call waits while this is up. A modal
 * dialog, because it must show above a fullscreen player too, hold the focus,
 * and give it back. Refuse has the focus and Escape means Refuse, so a stray
 * key never says yes.
 */
export function AgentConfirmPrompt({ confirm = agentConfirm }: { confirm?: AgentConfirm }) {
  const request = useSyncExternalStore(confirm.subscribe, confirm.getSnapshot, confirm.getSnapshot)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const refuseRef = useRef<HTMLButtonElement>(null)
  const requestId = request?.id ?? null
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || requestId === null) return
    // The top layer is what puts it above a fullscreen stage; where there is none, it is at least open.
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    refuseRef.current?.focus()
    return () => {
      if (typeof dialog.close === 'function') dialog.close()
    }
  }, [requestId])
  if (!request) return null
  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby="agent-confirm-question"
      aria-describedby="agent-confirm-consequence"
      onCancel={(event) => {
        event.preventDefault()
        confirm.answer(request.id, false)
      }}
      className="fixed inset-x-4 top-auto bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-line-strong bg-panel p-4 text-left shadow-lg backdrop:bg-fg/20"
    >
      <p id="agent-confirm-question" className="text-sm font-medium text-fg">{request.question}</p>
      <p id="agent-confirm-consequence" className="mt-1 text-sm text-fg-2">{request.consequence}</p>
      <div className="mt-3 flex justify-end gap-2">
        <Button ref={refuseRef} variant="secondary" onClick={() => confirm.answer(request.id, false)}>Refuse</Button>
        <Button onClick={() => confirm.answer(request.id, true)}>Allow</Button>
      </div>
    </dialog>
  )
}
