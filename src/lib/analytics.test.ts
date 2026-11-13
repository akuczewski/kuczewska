import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./firebaseApp', () => ({ getFirebaseApp: () => ({}), usesEmulators: true }))

const { describeClick, getConsent, saveConsent, track } = await import('./analytics')

describe('consent', () => {
  beforeEach(() => localStorage.clear())

  it('is undecided until the visitor chooses', () => {
    expect(getConsent()).toBeNull()
  })

  it('remembers the choice', () => {
    saveConsent('denied')
    expect(getConsent()).toBe('denied')

    saveConsent('granted')
    expect(getConsent()).toBe('granted')
  })

  it('treats unreadable storage as undecided', () => {
    const broken = { getItem: () => { throw new Error('blocked') } }
    expect(getConsent(broken)).toBeNull()
  })
})

describe('track', () => {
  beforeEach(() => localStorage.clear())

  it('sends nothing without consent', async () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {})

    track('generate_lead')
    saveConsent('denied')
    track('generate_lead')
    await Promise.resolve()

    expect(debug).not.toHaveBeenCalled()
    debug.mockRestore()
  })

  it('sends the event once the visitor agreed', async () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {})
    saveConsent('granted')

    track('generate_lead', { property_type: 'Dom' })

    await vi.waitFor(() =>
      expect(debug).toHaveBeenCalledWith('[analytics]', 'generate_lead', { property_type: 'Dom' }),
    )
    debug.mockRestore()
  })
})

describe('describeClick', () => {
  function click(html: string, selector = 'a'): ReturnType<typeof describeClick> {
    document.body.innerHTML = html
    return describeClick(document.querySelector(selector))
  }

  it('names booking clicks by where they happened', () => {
    expect(click('<header class="site-header"><a href="#contact">Umów</a></header>')).toEqual({
      name: 'book_cta_click',
      params: { place: 'header' },
    })
    expect(click('<section id="about"><a href="#contact"><span>Umów</span></a></section>', 'span')).toEqual({
      name: 'book_cta_click',
      params: { place: 'about' },
    })
  })

  it('recognises phone, e-mail and Instagram links', () => {
    expect(click('<footer class="site-footer"><a href="tel:+48511017427">tel</a></footer>')!.name).toBe('phone_click')
    expect(click('<a href="mailto:anna@kuczewska.com">mail</a>')!.name).toBe('email_click')
    expect(click('<a href="https://instagram.com/wnetrzanka">ig</a>')!.name).toBe('instagram_click')
  })

  it('reports which project was opened', () => {
    expect(click('<a href="#project/hotel-esperanto">x</a>')).toEqual({
      name: 'select_content',
      params: { content_type: 'project', item_id: 'hotel-esperanto' },
    })
  })

  it('ignores other clicks', () => {
    expect(click('<a href="#about">O mnie</a>')).toBeNull()
    expect(click('<p>tekst</p>', 'p')).toBeNull()
  })
})
