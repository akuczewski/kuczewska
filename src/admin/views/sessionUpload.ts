import { type SessionStatus, sessionStatusLabel } from '../../lib/sessions'

export type UploadProgress = (done: number, total: number) => void

export type SessionUploadDeps = {
  sessionTitle: string
  sessionStatus: SessionStatus
  /** May return a promise; the view shows progress until it settles. */
  onUploadRaw: (files: FileList, onProgress: UploadProgress) => void | Promise<void>
  onUploadFinished: (files: FileList, onProgress: UploadProgress) => void | Promise<void>
  onMarkFinished: () => void
  /** Lets the client change their picks again after they confirmed. */
  onReopenSelection?: () => void
  rawCount?: number
  finishedCount?: number
}

function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
  ))
}

export function renderSessionUploadView(container: HTMLElement, deps: SessionUploadDeps): void {
  const canReopen = deps.sessionStatus === 'selection_done' && typeof deps.onReopenSelection === 'function'

  container.innerHTML = `
    <section class="admin-session-upload">
      <h1>${esc(deps.sessionTitle)}</h1>
      <p class="admin-session-status">
        <span class="status-badge status-badge--${deps.sessionStatus}">${sessionStatusLabel(deps.sessionStatus)}</span>
        ${deps.rawCount !== undefined ? `<span>Do wyboru: ${deps.rawCount}</span>` : ''}
        ${deps.finishedCount !== undefined ? `<span>Gotowe: ${deps.finishedCount}</span>` : ''}
      </p>

      <label>
        Wgraj zdjęcia do wyboru — znak wodny dodaje się automatycznie
        <input type="file" class="admin-upload-raw" accept="image/*" multiple />
      </label>

      <label>
        Wgraj gotowe zdjęcia
        <input type="file" class="admin-upload-finished" accept="image/*" multiple />
      </label>

      <p class="admin-upload-progress" role="status"></p>

      <div class="admin-session-actions">
        <button type="button" class="admin-mark-finished">Oznacz sesję jako gotową</button>
        ${canReopen ? '<button type="button" class="admin-reopen-selection">Odblokuj wybór klienta</button>' : ''}
      </div>
    </section>
  `

  const progress = container.querySelector<HTMLElement>('.admin-upload-progress')!

  const wire = (
    selector: string,
    handler: SessionUploadDeps['onUploadRaw'],
  ) => {
    const input = container.querySelector<HTMLInputElement>(selector)!
    input.addEventListener('change', () => {
      if (!input.files || input.files.length === 0) return
      const total = input.files.length
      progress.textContent = `Wgrywanie 0 z ${total}…`
      const result = handler(input.files, (done, of) => {
        progress.textContent = done < of ? `Wgrywanie ${done} z ${of}…` : `Wgrano ${of} z ${of}.`
      })
      Promise.resolve(result).catch(() => {
        progress.textContent = 'Część zdjęć nie została wgrana. Odśwież stronę i wgraj brakujące ponownie.'
      })
    })
  }

  wire('.admin-upload-raw', deps.onUploadRaw)
  wire('.admin-upload-finished', deps.onUploadFinished)

  container.querySelector<HTMLButtonElement>('.admin-mark-finished')!.addEventListener('click', () => {
    deps.onMarkFinished()
  })

  container.querySelector<HTMLButtonElement>('.admin-reopen-selection')?.addEventListener('click', () => {
    deps.onReopenSelection!()
  })
}
