import '../app.css'
import { createClientAccount, sendOfferEmail } from '../lib/functionsClient'
import { getCurrentUser, isAdmin, signIn } from '../lib/auth'
import { listBookingsForLead } from '../lib/bookings'
import { listContractsForLead } from '../lib/contracts'
import {
  createManualLead,
  getLead,
  listClients,
  listLeads,
  setLeadStatus,
  updateLeadContactInfo,
} from '../lib/leads'
import { createDraftOffer, listOffersForLead } from '../lib/offers'
import { createPackage, listPackages, setPackageActive, updatePackageDetails } from '../lib/packages'
import {
  getPhotoDownloadUrl,
  listSessionPhotos,
  selectPhotosMarkedByClient,
  uploadFinishedPhoto,
  uploadRawPhoto,
} from '../lib/photos'
import { photoDisplayName, sortPhotosByName } from '../lib/selectionList'
import { createSession, getSession, listAllSessions, setSessionStatus } from '../lib/sessions'
import { renderLoginView } from '../portal/views/login'
import { renderClientsListView } from './views/clientsList'
import { renderLeadDetailView } from './views/leadDetail'
import { renderLeadsListView } from './views/leadsList'
import { renderOfferBuilderView } from './views/offerBuilder'
import { renderPackagesCatalogView } from './views/packagesCatalog'
import { renderSelectionsReviewView } from './views/selectionsReview'
import { renderSessionsListView } from './views/sessionsList'
import { renderSessionUploadView } from './views/sessionUpload'

function renderAdminShell(container: HTMLElement): HTMLElement {
  container.innerHTML = `
    <nav class="admin-nav">
      <a href="#/admin/leads">Zapytania</a>
      <a href="#/admin">Sesje</a>
      <a href="#/admin/clients">Klienci</a>
      <a href="#/admin/packages">Pakiety</a>
    </nav>
    <div class="admin-content"></div>
  `
  return container.querySelector<HTMLDivElement>('.admin-content')!
}

export async function renderAdminRoute(path: string, container: HTMLElement): Promise<void> {
  if (path === '#/admin/login') {
    renderLoginView(container, {
      signIn: (email, password) => signIn(email, password),
      onSuccess: () => {
        window.location.hash = '#/admin'
      },
    })
    return
  }

  const user = await getCurrentUser()
  if (!user || !(await isAdmin(user))) {
    window.location.hash = '#/admin/login'
    return
  }

  const content = renderAdminShell(container)

  const sessionMatch = path.match(/^#\/admin\/session\/(.+)$/)
  if (sessionMatch) {
    const sessionId = sessionMatch[1]!
    const session = await getSession(sessionId)
    if (!session) {
      content.innerHTML = '<p>Nie znaleziono sesji.</p>'
      return
    }

    const uploadContainer = document.createElement('div')
    const selectionsContainer = document.createElement('div')
    content.append(uploadContainer, selectionsContainer)

    const allPhotos = await listSessionPhotos(sessionId)
    const rawPhotos = allPhotos.filter((photo) => photo.type === 'raw')
    const rerender = () => renderAdminRoute(path, container)

    // One file at a time: watermarking is heavy, and progress stays honest.
    const uploadAll = async (
      files: FileList,
      onProgress: (done: number, total: number) => void,
      upload: (sessionId: string, file: File) => Promise<string>,
    ) => {
      const list = Array.from(files)
      let failed = 0
      for (let i = 0; i < list.length; i++) {
        try {
          await upload(sessionId, list[i]!)
        } catch {
          failed++
        }
        onProgress(i + 1, list.length)
      }
      if (failed > 0) throw new Error(`${failed} uploads failed`)
      await rerender()
    }

    renderSessionUploadView(uploadContainer, {
      sessionTitle: session.title,
      sessionStatus: session.status,
      rawCount: rawPhotos.length,
      finishedCount: allPhotos.length - rawPhotos.length,
      onUploadRaw: (files, onProgress) => uploadAll(files, onProgress, uploadRawPhoto),
      onUploadFinished: (files, onProgress) => uploadAll(files, onProgress, uploadFinishedPhoto),
      onMarkFinished: () => {
        void setSessionStatus(sessionId, 'finished').then(rerender)
      },
      onReopenSelection: () => {
        void setSessionStatus(sessionId, 'raw').then(rerender)
      },
    })

    const selected = sortPhotosByName(selectPhotosMarkedByClient(rawPhotos))
    const selectedPhotos = await Promise.all(
      selected.map(async (photo) => ({
        id: photo.id,
        url: await getPhotoDownloadUrl(photo.storagePath),
        name: photoDisplayName(photo),
        note: photo.clientNote ?? null,
      })),
    )
    renderSelectionsReviewView(selectionsContainer, {
      sessionTitle: session.title,
      selectedPhotos,
      submitted: session.status !== 'raw',
      selectionLimit: session.selectionLimit ?? null,
    })
    return
  }

  if (path === '#/admin/packages') {
    const packages = await listPackages()
    renderPackagesCatalogView(content, {
      packages,
      createPackage: (input) => createPackage(input),
      onPackageCreated: () => {
        void renderAdminRoute(path, container)
      },
      onToggleActive: (packageId, active) => {
        void setPackageActive(packageId, active).then(() => renderAdminRoute(path, container))
      },
      onUpdatePackage: (packageId, input) => {
        void updatePackageDetails(packageId, input).then(() => renderAdminRoute(path, container))
      },
    })
    return
  }

  if (path === '#/admin/clients') {
    const clients = await listClients()
    renderClientsListView(content, {
      clients,
      createClient: (input) => createClientAccount(input),
      onClientCreated: () => {
        void renderAdminRoute(path, container)
      },
      onCreateSession: (client) => {
        window.location.hash = `#/admin?clientUid=${client.clientUid}`
      },
    })
    return
  }

  if (path === '#/admin/leads') {
    const leads = await listLeads()
    renderLeadsListView(content, {
      leads,
      createManualLead: (input) => createManualLead(input),
      onLeadCreated: () => {
        void renderAdminRoute(path, container)
      },
      onCreateOffer: (leadId) => {
        window.location.hash = `#/admin/leads/${leadId}/offer`
      },
    })
    return
  }

  const offerMatch = path.match(/^#\/admin\/leads\/(.+)\/offer$/)
  if (offerMatch) {
    const leadId = offerMatch[1]!
    const lead = await getLead(leadId)
    if (!lead) {
      content.innerHTML = '<p>Nie znaleziono leada.</p>'
      return
    }

    const allPackages = await listPackages()
    renderOfferBuilderView(content, {
      leadName: lead.name,
      availablePackages: allPackages.filter((pkg) => pkg.active),
      createOffer: (selected) => createDraftOffer({ leadId, packages: selected }),
      onOfferCreated: (offerId) => {
        void sendOfferEmail(offerId).then(() => {
          window.location.hash = `#/admin/leads/${leadId}`
        })
      },
    })
    return
  }

  const leadDetailMatch = path.match(/^#\/admin\/leads\/([^/]+)$/)
  if (leadDetailMatch) {
    const leadId = leadDetailMatch[1]!
    const lead = await getLead(leadId)
    if (!lead) {
      content.innerHTML = '<p>Nie znaleziono leada.</p>'
      return
    }

    const [offers, contracts, rawBookings] = await Promise.all([
      listOffersForLead(leadId),
      listContractsForLead(leadId),
      listBookingsForLead(leadId),
    ])

    const bookings = await Promise.all(
      rawBookings.map(async (booking) => ({
        date: booking.date,
        sessionId: booking.sessionId,
        sessionStatus: (await getSession(booking.sessionId))?.status ?? null,
      })),
    )

    renderLeadDetailView(content, {
      lead,
      offers,
      contracts,
      bookings,
      onSaveContactInfo: (input) => {
        void updateLeadContactInfo(leadId, input).then(() => renderAdminRoute(path, container))
      },
      onArchive: () => {
        void setLeadStatus(leadId, 'archived').then(() => renderAdminRoute(path, container))
      },
      onCreateOffer: () => {
        window.location.hash = `#/admin/leads/${leadId}/offer`
      },
      onSendOffer: (offerId) => {
        void sendOfferEmail(offerId).then(() => renderAdminRoute(path, container))
      },
      onViewSession: (sessionId) => {
        window.location.hash = `#/admin/session/${sessionId}`
      },
    })
    return
  }

  const queryString = path.split('?')[1]
  const preselectedClientUid = new URLSearchParams(queryString ?? '').get('clientUid') ?? undefined

  const [sessions, clients] = await Promise.all([listAllSessions(), listClients()])
  renderSessionsListView(content, {
    sessions,
    clients,
    preselectedClientUid,
    createSession: (input) => createSession(input),
    onSessionCreated: (sessionId) => {
      window.location.hash = `#/admin/session/${sessionId}`
    },
  })
}
