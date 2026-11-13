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
    await setDoc(doc(context.firestore(), 'contracts/contract-1'), {
      offerId: 'offer-1',
      leadId: 'lead-1',
      publicToken: 'tok123',
      status: 'pending',
      pdfStoragePath: null,
      contentSnapshot: '{}',
      signedAt: null,
      signedIp: null,
      signedUserAgent: null,
    })
  })
})

describe('firestore rules: contracts (admin-only, no public path)', () => {
  it('denies reading contracts when signed out', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'contracts/contract-1')))
  })

  it('denies a regular client from reading or writing contracts', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(getDocs(collection(db, 'contracts')))
    await assertFails(setDoc(doc(db, 'contracts/contract-1'), { status: 'signed' }))
  })

  it('allows the admin full access', async () => {
    const db = testEnv.authenticatedContext('anna', { admin: true }).firestore()
    await assertSucceeds(getDoc(doc(db, 'contracts/contract-1')))
  })
})
