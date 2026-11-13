import { readFileSync } from 'node:fs'
import {
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
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
    await setDoc(doc(context.firestore(), 'sessions/session-1'), {
      clientUid: 'client-1',
      title: 'Sesja mieszkanie Warszawa',
      status: 'raw',
    })
  })
})

describe('firestore rules: sessions', () => {
  it('denies reading a session when signed out', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'sessions/session-1')))
  })

  it("denies a client from reading another client's session", async () => {
    const db = testEnv.authenticatedContext('client-2').firestore()
    await assertFails(getDoc(doc(db, 'sessions/session-1')))
  })

  it('allows the assigned client to read their own session', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertSucceeds(getDoc(doc(db, 'sessions/session-1')))
  })

  it('allows the admin to read any session', async () => {
    const db = testEnv.authenticatedContext('anna', { admin: true }).firestore()
    await assertSucceeds(getDoc(doc(db, 'sessions/session-1')))
  })

  it('denies a non-admin client from creating a session', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(
      setDoc(doc(db, 'sessions/session-2'), {
        clientUid: 'client-1',
        title: 'Nowa sesja',
        status: 'raw',
      }),
    )
  })

  it('allows the admin to create a session', async () => {
    const db = testEnv.authenticatedContext('anna', { admin: true }).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'sessions/session-2'), {
        clientUid: 'client-1',
        title: 'Nowa sesja',
        status: 'raw',
      }),
    )
  })
})
