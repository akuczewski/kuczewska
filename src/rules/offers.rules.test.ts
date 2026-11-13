import { readFileSync } from 'node:fs'
import {
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'kuczewska-dev',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'offers/offer-1'), {
      leadId: 'lead-1',
      lines: [{ packageId: 'p1', name: 'A', priceGrosze: 1000 }],
      totalPriceGrosze: 1000,
      status: 'draft',
      publicToken: null,
      pdfStoragePath: null,
    })
  })
})

describe('firestore rules: offers (admin-only, no public path)', () => {
  it('denies reading offers when signed out', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'offers/offer-1')))
  })

  it('denies a regular client from reading or creating offers', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(getDocs(collection(db, 'offers')))
    await assertFails(
      setDoc(doc(db, 'offers/offer-2'), {
        leadId: 'lead-1',
        lines: [],
        totalPriceGrosze: 0,
        status: 'draft',
        publicToken: null,
        pdfStoragePath: null,
      }),
    )
  })

  it('allows the admin full access', async () => {
    const db = testEnv.authenticatedContext('anna', { admin: true }).firestore()
    await assertSucceeds(getDoc(doc(db, 'offers/offer-1')))
    await assertSucceeds(
      setDoc(doc(db, 'offers/offer-2'), {
        leadId: 'lead-1',
        lines: [],
        totalPriceGrosze: 0,
        status: 'draft',
        publicToken: null,
        pdfStoragePath: null,
      }),
    )
  })
})
