import { describe, expect, it } from 'vitest'
import { computeOverallStage } from './zlecenie'
import type { Lead } from './leads'
import type { Offer } from './offers'
import type { Contract } from './contracts'

const baseLead: Lead = {
  id: 'lead-1',
  name: 'Jan',
  email: 'jan@example.com',
  phone: null,
  message: null,
  source: 'manual',
  status: 'new',
}

function offer(status: Offer['status']): Offer {
  return { id: 'o1', leadId: 'lead-1', lines: [], totalPriceGrosze: 0, status, publicToken: null, pdfStoragePath: null }
}

function contract(status: Contract['status']): Contract {
  return { id: 'c1', offerId: 'o1', leadId: 'lead-1', status, pdfStoragePath: null }
}

describe('computeOverallStage', () => {
  it('returns "nowe_zapytanie" when there is nothing else yet', () => {
    expect(computeOverallStage(baseLead, [], [], [])).toBe('nowe_zapytanie')
  })

  it('returns "oferta_wyslana" when an offer was sent', () => {
    expect(computeOverallStage(baseLead, [offer('sent')], [], [])).toBe('oferta_wyslana')
  })

  it('returns "oferta_odrzucona" when all offers are rejected/expired', () => {
    expect(computeOverallStage(baseLead, [offer('rejected')], [], [])).toBe('oferta_odrzucona')
  })

  it('returns "oferta_zaakceptowana" when an offer is accepted but no contract yet', () => {
    expect(computeOverallStage(baseLead, [offer('accepted')], [], [])).toBe('oferta_zaakceptowana')
  })

  it('returns "umowa_do_podpisu" when a contract is pending', () => {
    expect(computeOverallStage(baseLead, [offer('accepted')], [contract('pending')], [])).toBe(
      'umowa_do_podpisu',
    )
  })

  it('returns "umowa_podpisana" when a contract is signed but no booking yet', () => {
    expect(computeOverallStage(baseLead, [offer('accepted')], [contract('signed')], [])).toBe(
      'umowa_podpisana',
    )
  })

  it('returns "sesja_zarezerwowana" when a booking exists and the session is still raw', () => {
    expect(
      computeOverallStage(baseLead, [offer('accepted')], [contract('signed')], [
        { date: '2026-09-01', sessionId: 's1', sessionStatus: 'raw' },
      ]),
    ).toBe('sesja_zarezerwowana')
  })

  it('returns "zdjecia_do_wyboru" when the session status is selection_done', () => {
    expect(
      computeOverallStage(baseLead, [offer('accepted')], [contract('signed')], [
        { date: '2026-09-01', sessionId: 's1', sessionStatus: 'selection_done' },
      ]),
    ).toBe('zdjecia_do_wyboru')
  })

  it('returns "zdjecia_gotowe" when the session status is finished', () => {
    expect(
      computeOverallStage(baseLead, [offer('accepted')], [contract('signed')], [
        { date: '2026-09-01', sessionId: 's1', sessionStatus: 'finished' },
      ]),
    ).toBe('zdjecia_gotowe')
  })

  it('returns "zarchiwizowane" for an archived lead with no offers', () => {
    expect(computeOverallStage({ ...baseLead, status: 'archived' }, [], [], [])).toBe('zarchiwizowane')
  })
})
