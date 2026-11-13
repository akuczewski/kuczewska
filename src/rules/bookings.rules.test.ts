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
    await setDoc(doc(context.firestore(), 'bookings/2026-08-15'), {
      contractId: 'contract-1',
      leadId: 'lead-1',
      sessionId: 'session-1',
    })
  })
})

describe('firestore rules: bookings (admin-only, no public path)', () => {
  it('denies reading bookings when signed out', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'bookings/2026-08-15')))
  })

  it('denies a regular client from reading or writing bookings', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(getDocs(collection(db, 'bookings')))
    await assertFails(
      setDoc(doc(db, 'bookings/2026-09-01'), { contractId: 'x', leadId: 'y', sessionId: 'z' }),
    )
  })

  it('allows the admin full access', async () => {
    const db = testEnv.authenticatedContext('anna', { admin: true }).firestore()
    await assertSucceeds(getDoc(doc(db, 'bookings/2026-08-15')))
  })
})
