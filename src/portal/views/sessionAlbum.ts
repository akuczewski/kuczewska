export type AlbumPhoto = {
  id: string
  url: string
  selectedByClient: boolean
  /** File name shown in the enlarged view, so client and photographer can refer to the same frame. */
  name?: string
  note?: string | null
}

export type SessionAlbumDeps = {
  title: string
  photos: AlbumPhoto[]
  /** Number of retouched photos included in the package; null/undefined = no stated limit. */
  selectionLimit?: number | null
  /** True once the client has confirmed — the album becomes read-only. */
  locked?: boolean
  onToggleSelection: (photoId: string, selected: boolean) => void
  onSaveNote?: (photoId: string, note: string) => void
  onSubmit?: () => Promise<void>
}

const HEART_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`

function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
  ))
}

/** Polish plural: 1 zdjęcie, 2–4 zdjęcia, 5–21 zdjęć, 22–24 zdjęcia… */
function photoWord(count: number): string {
  if (count === 1) return 'zdjęcie'
  const lastTwo = count % 100
  const last = count % 10
  return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? 'zdjęcia' : 'zdjęć'
}

export function renderSessionAlbumView(container: HTMLElement, deps: SessionAlbumDeps): void {
  const photos = deps.photos.map((photo) => ({ ...photo, note: photo.note ?? '' }))
  const locked = deps.locked === true
  const limit = deps.selectionLimit ?? null
  let openIndex = -1

  const items = photos
    .map((photo, index) => {
      const label = esc(photo.name || `Zdjęcie ${index + 1}`)
      return `
        <li data-photo-id="${esc(photo.id)}" class="${photo.selectedByClient ? 'is-selected' : ''}">
          <button type="button" class="album-open" aria-label="Powiększ: ${label}">
            <img src="${esc(photo.url)}" alt="${label}" loading="lazy" />
          </button>
          <button type="button" class="album-heart" aria-pressed="${photo.selectedByClient}"
            aria-label="Wybieram do obróbki: ${label}" ${locked ? 'disabled' : ''}>${HEART_ICON}</button>
          <span class="album-note-flag" ${photo.note ? '' : 'hidden'}>Uwaga</span>
        </li>
      `
    })
    .join('')

  const intro = locked
    ? 'Wybór jest zatwierdzony i trafił do fotografki. Gotowe zdjęcia pojawią się tutaj po obróbce. Jeśli chcesz coś zmienić, napisz do niej — może odblokować wybór.'
    : 'Kliknij serce przy zdjęciach, które mają trafić do obróbki. Kliknięcie w zdjęcie powiększa je — tam możesz też dopisać uwagę. Na koniec zatwierdź wybór.'

  container.innerHTML = `
    <section class="portal-album${locked ? ' portal-album--locked' : ''}">
      <h1>${esc(deps.title)}</h1>
      <p class="album-intro">${intro}</p>
      ${photos.length === 0 ? '<p class="album-empty">Zdjęcia z sesji pojawią się tutaj, gdy fotografka je wgra.</p>' : ''}
      <ul class="portal-album-grid">${items}</ul>

      <div class="album-bar">
        <p class="album-count" aria-live="polite"></p>
        ${locked || !deps.onSubmit ? '' : `
          <button type="button" class="album-submit">Zatwierdzam wybór</button>
          <div class="album-confirm" hidden>
            <p class="album-confirm-text"></p>
            <button type="button" class="album-confirm-yes">Tak, zatwierdzam</button>
            <button type="button" class="album-confirm-no">Wróć do wyboru</button>
          </div>
          <p class="album-error" role="alert" hidden></p>
        `}
      </div>

      <div class="album-lightbox" role="dialog" aria-modal="true" aria-label="Powiększone zdjęcie" tabindex="-1" hidden>
        <button type="button" class="lightbox-close" aria-label="Zamknij">&times;</button>
        <button type="button" class="lightbox-prev" aria-label="Poprzednie zdjęcie">&larr;</button>
        <img class="lightbox-img" alt="" />
        <button type="button" class="lightbox-next" aria-label="Następne zdjęcie">&rarr;</button>
        <div class="lightbox-panel">
          <p class="lightbox-name"></p>
          <button type="button" class="lightbox-heart" aria-pressed="false" ${locked ? 'disabled' : ''}>
            ${HEART_ICON}<span class="lightbox-heart-text"></span>
          </button>
          <label class="lightbox-note">
            <span>Uwaga do obróbki (opcjonalnie)</span>
            <textarea rows="2" maxlength="800" placeholder="Np. usunąć kabel przy lampie" ${locked ? 'readonly' : ''}></textarea>
          </label>
        </div>
      </div>
    </section>
  `

  const grid = container.querySelector<HTMLUListElement>('.portal-album-grid')!
  const itemEls = Array.from(grid.querySelectorAll<HTMLLIElement>('li'))
  const countEl = container.querySelector<HTMLElement>('.album-count')!
  const submitBtn = container.querySelector<HTMLButtonElement>('.album-submit')
  const confirmBox = container.querySelector<HTMLElement>('.album-confirm')
  const confirmText = container.querySelector<HTMLElement>('.album-confirm-text')
  const errorBox = container.querySelector<HTMLElement>('.album-error')
  const lightbox = container.querySelector<HTMLElement>('.album-lightbox')!
  const lightboxImg = lightbox.querySelector<HTMLImageElement>('.lightbox-img')!
  const lightboxName = lightbox.querySelector<HTMLElement>('.lightbox-name')!
  const lightboxHeart = lightbox.querySelector<HTMLButtonElement>('.lightbox-heart')!
  const lightboxHeartText = lightbox.querySelector<HTMLElement>('.lightbox-heart-text')!
  const noteLabel = lightbox.querySelector<HTMLElement>('.lightbox-note')!
  const noteField = lightbox.querySelector<HTMLTextAreaElement>('textarea')!

  const selectedCount = () => photos.filter((photo) => photo.selectedByClient).length

  function refreshCount() {
    const count = selectedCount()
    if (limit === null) {
      countEl.innerHTML = `Wybrano: <strong>${count}</strong>`
    } else {
      const over = count - limit
      countEl.innerHTML = `Wybrano <strong>${count}</strong> z ${limit} w pakiecie` +
        (over > 0 ? ` <span class="album-over">· ${over} ponad pakiet</span>` : '')
    }
    if (submitBtn) submitBtn.disabled = count === 0
  }

  function refreshItem(index: number) {
    const photo = photos[index]!
    const item = itemEls[index]!
    item.classList.toggle('is-selected', photo.selectedByClient)
    item.querySelector('.album-heart')!.setAttribute('aria-pressed', String(photo.selectedByClient))
    item.querySelector<HTMLElement>('.album-note-flag')!.hidden = !photo.note
  }

  function refreshLightbox() {
    if (openIndex < 0) return
    const photo = photos[openIndex]!
    lightboxImg.src = photo.url
    lightboxImg.alt = photo.name || `Zdjęcie ${openIndex + 1}`
    lightboxName.textContent = `${photo.name || `Zdjęcie ${openIndex + 1}`} · ${openIndex + 1} z ${photos.length}`
    lightboxHeart.setAttribute('aria-pressed', String(photo.selectedByClient))
    lightboxHeartText.textContent = photo.selectedByClient ? 'Wybrane do obróbki' : 'Wybieram do obróbki'
    // A note only makes sense on a frame that will be retouched.
    noteLabel.hidden = !photo.selectedByClient || (locked && !photo.note)
    noteField.value = photo.note
  }

  function toggle(index: number) {
    if (locked) return
    const photo = photos[index]!
    photo.selectedByClient = !photo.selectedByClient
    deps.onToggleSelection(photo.id, photo.selectedByClient)
    refreshItem(index)
    refreshCount()
    refreshLightbox()
    hideConfirm()
  }

  function saveNote() {
    if (locked || openIndex < 0) return
    const photo = photos[openIndex]!
    const value = noteField.value.trim()
    if (value === photo.note) return
    photo.note = value
    deps.onSaveNote?.(photo.id, value)
    refreshItem(openIndex)
  }

  function openLightbox(index: number) {
    openIndex = index
    lightbox.hidden = false
    refreshLightbox()
    lightbox.focus()
  }

  function closeLightbox() {
    saveNote()
    const returnTo = openIndex
    openIndex = -1
    lightbox.hidden = true
    if (returnTo >= 0) itemEls[returnTo]?.querySelector<HTMLButtonElement>('.album-open')?.focus()
  }

  function step(delta: number) {
    if (openIndex < 0 || photos.length === 0) return
    saveNote()
    openIndex = (openIndex + delta + photos.length) % photos.length
    refreshLightbox()
  }

  function hideConfirm() {
    if (confirmBox) confirmBox.hidden = true
    if (submitBtn) submitBtn.hidden = false
  }

  itemEls.forEach((item, index) => {
    item.querySelector('.album-open')!.addEventListener('click', () => openLightbox(index))
    item.querySelector('.album-heart')!.addEventListener('click', () => toggle(index))
  })

  lightbox.querySelector('.lightbox-close')!.addEventListener('click', closeLightbox)
  lightbox.querySelector('.lightbox-prev')!.addEventListener('click', () => step(-1))
  lightbox.querySelector('.lightbox-next')!.addEventListener('click', () => step(1))
  lightboxHeart.addEventListener('click', () => {
    if (openIndex >= 0) toggle(openIndex)
  })
  noteField.addEventListener('change', saveNote)
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox()
  })
  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLightbox()
    // Arrow keys move the caret while the client is typing a note.
    if (event.target === noteField) return
    if (event.key === 'ArrowLeft') step(-1)
    if (event.key === 'ArrowRight') step(1)
  })

  submitBtn?.addEventListener('click', () => {
    const count = selectedCount()
    confirmText!.textContent =
      `Zatwierdzić ${count} ${photoWord(count)} do obróbki? Po zatwierdzeniu nie zmienisz już wyboru samodzielnie.`
    confirmBox!.hidden = false
    submitBtn.hidden = true
    errorBox!.hidden = true
  })

  container.querySelector('.album-confirm-no')?.addEventListener('click', hideConfirm)

  const confirmYes = container.querySelector<HTMLButtonElement>('.album-confirm-yes')
  confirmYes?.addEventListener('click', () => {
    confirmYes.disabled = true
    confirmYes.textContent = 'Wysyłanie…'
    deps.onSubmit!().then(
      () => renderSessionAlbumView(container, { ...deps, photos, locked: true }),
      () => {
        confirmYes.disabled = false
        confirmYes.textContent = 'Tak, zatwierdzam'
        errorBox!.textContent = 'Nie udało się zatwierdzić wyboru. Twoje serduszka są zapisane — spróbuj ponownie za chwilę.'
        errorBox!.hidden = false
      },
    )
  })

  refreshCount()
}
