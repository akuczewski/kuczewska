import { readFileSync } from 'node:fs'
import {
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
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
      title: 'Sesja testowa',
      status: 'raw',
    })
    await setDoc(doc(context.firestore(), 'sessions/session-1/photos/photo-1'), {
      type: 'raw',
      storagePath: 'sessions/session-1/raw/photo-1.jpg',
      selectedByClient: false,
    })
    await setDoc(doc(context.firestore(), 'sessions/session-1/photos/photo-2-finished'), {
      type: 'finished',
      storagePath: 'sessions/session-1/finished/photo-2.jpg',
      selectedByClient: false,
    })
  })
})

describe('firestore rules: session photos', () => {
  it("denies another client from reading someone else's session photos", async () => {
    const db = testEnv.authenticatedContext('client-2').firestore()
    await assertFails(getDoc(doc(db, 'sessions/session-1/photos/photo-1')))
  })

  it('allows the assigned client to read their own session photos', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertSucceeds(getDoc(doc(db, 'sessions/session-1/photos/photo-1')))
  })

  it('allows the assigned client to toggle selectedByClient on a raw photo', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'sessions/session-1/photos/photo-1'), { selectedByClient: true }),
    )
  })

  it('allows the assigned client to leave a retouching note on a raw photo', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'sessions/session-1/photos/photo-1'), {
        selectedByClient: true,
        clientNote: 'Usunąć kabel przy lampie',
      }),
    )
    await assertSucceeds(updateDoc(doc(db, 'sessions/session-1/photos/photo-1'), { clientNote: null }))
  })

  it('denies a note that is not a short string', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(
      updateDoc(doc(db, 'sessions/session-1/photos/photo-1'), { clientNote: 'x'.repeat(1001) }),
    )
    await assertFails(updateDoc(doc(db, 'sessions/session-1/photos/photo-1'), { clientNote: 42 }))
  })

  it('denies a selectedByClient value that is not a boolean', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(
      updateDoc(doc(db, 'sessions/session-1/photos/photo-1'), { selectedByClient: 'yes' }),
    )
  })

  it('denies the client from changing picks or notes after the selection is confirmed', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'sessions/session-1'), { status: 'selection_done' })
    })

    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(
      updateDoc(doc(db, 'sessions/session-1/photos/photo-1'), { selectedByClient: true }),
    )
    await assertFails(
      updateDoc(doc(db, 'sessions/session-1/photos/photo-1'), { clientNote: 'Jeszcze jedno' }),
    )
  })

  it('denies the client from changing the original file name', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(
      updateDoc(doc(db, 'sessions/session-1/photos/photo-1'), { originalName: 'inne.jpg' }),
    )
  })

  it("denies the assigned client from changing a photo's storagePath", async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(
      updateDoc(doc(db, 'sessions/session-1/photos/photo-1'), {
        storagePath: 'sessions/session-1/raw/tampered.jpg',
      }),
    )
  })

  it('denies the assigned client from toggling selection on a finished photo', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(
      updateDoc(doc(db, 'sessions/session-1/photos/photo-2-finished'), { selectedByClient: true }),
    )
  })

  it("denies another client from toggling someone else's selection", async () => {
    const db = testEnv.authenticatedContext('client-2').firestore()
    await assertFails(
      updateDoc(doc(db, 'sessions/session-1/photos/photo-1'), { selectedByClient: true }),
    )
  })

  it('denies a client from creating a photo doc', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(
      setDoc(doc(db, 'sessions/session-1/photos/photo-new'), {
        type: 'raw',
        storagePath: 'sessions/session-1/raw/photo-new.jpg',
        selectedByClient: false,
      }),
    )
  })

  it('allows the admin to create, read and update any photo doc', async () => {
    const db = testEnv.authenticatedContext('anna', { admin: true }).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'sessions/session-1/photos/photo-admin'), {
        type: 'raw',
        storagePath: 'sessions/session-1/raw/photo-admin.jpg',
        selectedByClient: false,
      }),
    )
    await assertSucceeds(getDoc(doc(db, 'sessions/session-1/photos/photo-1')))
    await assertSucceeds(
      updateDoc(doc(db, 'sessions/session-1/photos/photo-1'), {
        storagePath: 'sessions/session-1/raw/photo-1-renamed.jpg',
      }),
    )
  })
})
