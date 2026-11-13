export type FinishedPhoto = {
  id: string
  url: string
  /** File name the download is saved under. */
  name?: string
}

export type FinishedAlbumDeps = {
  title: string
  photos: FinishedPhoto[]
  /**
   * Saves one photo to the client's device. Without it the view falls back to
   * plain links (which only open the photo in a new tab for cross-origin files).
   */
  onDownload?: (photo: FinishedPhoto) => Promise<void>
}

function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
  ))
}

export function renderFinishedAlbumView(container: HTMLElement, deps: FinishedAlbumDeps): void {
  const canDownload = typeof deps.onDownload === 'function'

  const body =
    deps.photos.length === 0
      ? '<p>Gotowe zdjęcia pojawią się tutaj, gdy fotografka zakończy obróbkę.</p>'
      : `
        ${canDownload ? `
          <div class="finished-actions">
            <button type="button" class="finished-download-all">Pobierz wszystkie (${deps.photos.length})</button>
            <p class="finished-progress" role="status"></p>
          </div>` : ''}
        <ul class="portal-finished-grid">${deps.photos
          .map(
            (photo, index) => `
              <li data-photo-id="${esc(photo.id)}">
                <img src="${esc(photo.url)}" alt="${esc(photo.name || `Gotowe zdjęcie ${index + 1}`)}" loading="lazy" />
                ${canDownload
                  ? '<button type="button" class="finished-download">Pobierz</button>'
                  : `<a href="${esc(photo.url)}" download>Pobierz</a>`}
              </li>
            `,
          )
          .join('')}</ul>`

  container.innerHTML = `
    <section class="portal-finished-album">
      <h1>${esc(deps.title)} — gotowe zdjęcia</h1>
      ${body}
    </section>
  `

  if (!canDownload) return

  const progress = container.querySelector<HTMLElement>('.finished-progress')
  const allBtn = container.querySelector<HTMLButtonElement>('.finished-download-all')

  container.querySelectorAll<HTMLButtonElement>('.finished-download').forEach((button, index) => {
    button.addEventListener('click', () => {
      button.disabled = true
      deps.onDownload!(deps.photos[index]!).then(
        () => { button.disabled = false },
        () => {
          button.disabled = false
          progress!.textContent = 'Nie udało się pobrać zdjęcia. Spróbuj ponownie.'
        },
      )
    })
  })

  allBtn?.addEventListener('click', async () => {
    allBtn.disabled = true
    const total = deps.photos.length
    let failed = 0

    // One at a time: keeps memory flat on phones and gives honest progress.
    for (let i = 0; i < total; i++) {
      progress!.textContent = `Pobieranie ${i + 1} z ${total}…`
      try {
        await deps.onDownload!(deps.photos[i]!)
      } catch {
        failed++
      }
    }

    progress!.textContent = failed === 0
      ? `Pobrano ${total} z ${total}. Jeśli przeglądarka zapyta o zgodę na pobranie wielu plików — zezwól.`
      : `Pobrano ${total - failed} z ${total}. Nie udało się pobrać: ${failed} — spróbuj ponownie.`
    allBtn.disabled = false
  })
}
