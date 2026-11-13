/**
 * Google Analytics (GA4, through Firebase) for the public site.
 *
 * Nothing is loaded and no cookie is set until the visitor agrees — analytics
 * cookies need consent in the EU. The portal and the CRM are never tracked.
 */
import { getFirebaseApp, usesEmulators } from './firebase'

export type Consent = 'granted' | 'denied' | null
export type EventParams = Record<string, string | number | boolean | undefined>

const CONSENT_KEY = 'analytics-consent'

type ReadableStorage = Pick<Storage, 'getItem'>
type WritableStorage = Pick<Storage, 'setItem'>

export function getConsent(storage: ReadableStorage = localStorage): Consent {
  try {
    const value = storage.getItem(CONSENT_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function saveConsent(value: Exclude<Consent, null>, storage: WritableStorage = localStorage): void {
  try {
    storage.setItem(CONSENT_KEY, value)
  } catch {
    // Private mode: the choice simply lasts for this visit.
  }
}

type Sender = (name: string, params?: EventParams) => void

let senderPromise: Promise<Sender | null> | null = null

/** Loads GA lazily; resolves to null where it cannot run (emulators, unsupported browser). */
function loadSender(): Promise<Sender | null> {
  if (!senderPromise) {
    senderPromise = (async (): Promise<Sender | null> => {
      if (usesEmulators) {
        return (name, params) => console.debug('[analytics]', name, params ?? {})
      }
      const { getAnalytics, isSupported, logEvent } = await import('firebase/analytics')
      if (!(await isSupported())) return null
      const analytics = getAnalytics(getFirebaseApp())
      return (name, params) => logEvent(analytics, name, params)
    })().catch(() => null)
  }
  return senderPromise
}

/** Starts collection (first page view included) if the visitor has agreed. */
export function startAnalyticsIfConsented(): void {
  if (getConsent() === 'granted') void loadSender()
}

export function track(name: string, params?: EventParams): void {
  if (getConsent() !== 'granted') return
  void loadSender().then((send) => send?.(name, params))
}

/** Maps a click on the public site to an event worth watching; null = not interesting. */
export function describeClick(target: Element | null): { name: string; params: EventParams } | null {
  const link = target?.closest('a')
  if (!link) return null
  const href = link.getAttribute('href') ?? ''

  const place =
    link.closest('.site-header') ? 'header'
    : link.closest('.mobile-cta') ? 'mobile_bar'
    : link.closest('.modal') ? 'project_gallery'
    : link.closest('.site-footer') ? 'footer'
    : link.closest('section')?.id || 'page'

  if (href === '#contact') return { name: 'book_cta_click', params: { place } }
  if (href.startsWith('tel:')) return { name: 'phone_click', params: { place } }
  if (href.startsWith('mailto:')) return { name: 'email_click', params: { place } }
  if (href.includes('instagram.com')) return { name: 'instagram_click', params: { place } }
  if (href.startsWith('#project/')) {
    return { name: 'select_content', params: { content_type: 'project', item_id: decodeURIComponent(href.slice(9)) } }
  }
  return null
}
