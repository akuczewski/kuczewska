import { readFileSync } from 'node:fs'
import {
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
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
    await setDoc(doc(context.firestore(), 'leads/lead-1'), {
      name: 'Jan Kowalski',
      email: 'jan@example.com',
      phone: null,
      message: null,
      source: 'manual',
      status: 'new',
    })
  })
})

describe('firestore rules: leads (admin access)', () => {
  it('denies reading leads when signed out', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'leads/lead-1')))
  })

  it('denies a regular client from reading leads', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(getDocs(collection(db, 'leads')))
  })

  it('allows the admin to read leads', async () => {
    const db = testEnv.authenticatedContext('anna', { admin: true }).firestore()
    await assertSucceeds(getDocs(collection(db, 'leads')))
  })

  it('allows the admin to update a lead status', async () => {
    const db = testEnv.authenticatedContext('anna', { admin: true }).firestore()
    await assertSucceeds(updateDoc(doc(db, 'leads/lead-1'), { status: 'archived' }))
  })

  it('denies a regular client from updating a lead', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(updateDoc(doc(db, 'leads/lead-1'), { status: 'archived' }))
  })
})

describe('firestore rules: leads (public contact form)', () => {
  const validContactFormLead = {
    name: 'Piotr Wiśniewski',
    email: 'piotr@example.com',
    phone: null,
    message: 'Interesuje mnie sesja domu',
    source: 'contact_form',
    status: 'new',
  }

  it('allows a signed-out visitor to submit a valid contact-form lead', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertSucceeds(setDoc(doc(db, 'leads/lead-public-1'), validContactFormLead))
  })

  it('denies a signed-out visitor from reading back leads after creating one', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'leads/lead-1')))
  })

  it('denies creating a lead with a status other than "new"', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(
      setDoc(doc(db, 'leads/lead-public-2'), { ...validContactFormLead, status: 'accepted' }),
    )
  })

  it('denies faking the source as "manual"', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(
      setDoc(doc(db, 'leads/lead-public-3'), { ...validContactFormLead, source: 'manual' }),
    )
  })

  it('denies creating a lead with extra fields', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(
      setDoc(doc(db, 'leads/lead-public-4'), { ...validContactFormLead, adminNote: 'sneaky' }),
    )
  })

  it('denies updating an existing lead as a signed-out visitor', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(db, 'leads/lead-1'), validContactFormLead))
  })
})
