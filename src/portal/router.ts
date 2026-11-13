import { getCurrentUser, signIn } from '../lib/auth'
import { saveBlobAs } from '../lib/download'
import { submitSelection } from '../lib/functionsClient'
import { getPhotoBlob, getPhotoDownloadUrl, listSessionPhotos, setPhotoNote, setPhotoSelection } from '../lib/photos'
import { photoDisplayName, sortPhotosByName } from '../lib/selectionList'
import { getSession, listSessionsForClient, sessionStatusLabel } from '../lib/sessions'
import { requireClient } from './guard'
import { renderFinishedAlbumView } from './views/finishedAlbum'
import { renderLoginView } from './views/login'
import { renderSessionAlbumView } from './views/sessionAlbum'

export async function renderPortalRoute(path: string, container: HTMLElement): Promise<void> {
  if (path === '#/portal/login') {
    renderLoginView(container, {
      signIn: (email, password) => signIn(email, password),
      onSuccess: () => {
        window.location.hash = '#/portal'
      },
    })
    return
  }

  const user = await requireClient(getCurrentUser, () => {
    window.location.hash = '#/portal/login'
  })
  if (!user) return

  const sessionMatch = path.match(/^#\/portal\/session\/(.+)$/)
  if (sessionMatch) {
    const sessionId = sessionMatch[1]!
    const session = await getSession(sessionId)
    if (!session || session.clientUid !== user.uid) {
      container.innerHTML = '<p>Nie znaleziono sesji.</p>'
      return
    }

    if (session.status === 'finished') {
      const finishedPhotos = sortPhotosByName(await listSessionPhotos(sessionId, 'finished'))
      const photos = await Promise.all(
        finishedPhotos.map(async (photo) => ({
          id: photo.id,
          url: await getPhotoDownloadUrl(photo.storagePath),
          name: photoDisplayName(photo),
          storagePath: photo.storagePath,
        })),
      )
      renderFinishedAlbumView(container, {
        title: session.title,
        photos,
        onDownload: async (photo) => {
          const source = photos.find((p) => p.id === photo.id)!
          saveBlobAs(await getPhotoBlob(source.storagePath), source.name)
        },
      })
      return
    }

    const rawPhotos = sortPhotosByName(await listSessionPhotos(sessionId, 'raw'))
    const photos = await Promise.all(
      rawPhotos.map(async (photo) => ({
        id: photo.id,
        url: await getPhotoDownloadUrl(photo.storagePath),
        name: photoDisplayName(photo),
        selectedByClient: photo.selectedByClient,
        note: photo.clientNote ?? '',
      })),
    )
    renderSessionAlbumView(container, {
      title: session.title,
      photos,
      selectionLimit: session.selectionLimit ?? null,
      locked: session.status !== 'raw',
      onToggleSelection: (photoId, selected) => {
        void setPhotoSelection(sessionId, photoId, selected)
      },
      onSaveNote: (photoId, note) => {
        void setPhotoNote(sessionId, photoId, note)
      },
      onSubmit: async () => {
        await submitSelection(sessionId)
      },
    })
    return
  }

  const sessions = await listSessionsForClient(user.uid)
  container.innerHTML = `
    <section class="portal-sessions">
      <h1>Twoje sesje</h1>
      ${
        sessions.length === 0
          ? '<p>Nie masz jeszcze żadnych sesji.</p>'
          : `<ul class="portal-sessions-list">${sessions
              .map((s) => `<li><a href="#/portal/session/${s.id}">${s.title}</a> <span class="status-badge status-badge--${s.status}">${sessionStatusLabel(s.status)}</span></li>`)
              .join('')}</ul>`
      }
    </section>
  `
}
