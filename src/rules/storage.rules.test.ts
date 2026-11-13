import { readFileSync } from 'node:fs'
import {
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'
import { getBytes, ref, uploadBytes } from 'firebase/storage'
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
    storage: {
      rules: readFileSync('storage.rules', 'utf8'),
      host: '127.0.0.1',
      port: 9199,
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
    await uploadBytes(
      ref(context.storage(), 'sessions/session-1/raw/photo-1.jpg'),
      new Uint8Array([1, 2, 3]),
    )
    await uploadBytes(
      ref(context.storage(), 'sessions/session-1/finished/photo-1.jpg'),
      new Uint8Array([9, 9, 9]),
    )
  })
})

describe('storage rules: raw photos', () => {
  it('denies reading a raw photo when signed out', async () => {
    const storage = testEnv.unauthenticatedContext().storage()
    await assertFails(getBytes(ref(storage, 'sessions/session-1/raw/photo-1.jpg')))
  })

  it("denies another client from reading someone else's raw photo", async () => {
    const storage = testEnv.authenticatedContext('client-2').storage()
    await assertFails(getBytes(ref(storage, 'sessions/session-1/raw/photo-1.jpg')))
  })

  it('allows the assigned client to read their raw photo', async () => {
    const storage = testEnv.authenticatedContext('client-1').storage()
    await assertSucceeds(getBytes(ref(storage, 'sessions/session-1/raw/photo-1.jpg')))
  })

  it('allows the admin to read any raw photo', async () => {
    const storage = testEnv.authenticatedContext('anna', { admin: true }).storage()
    await assertSucceeds(getBytes(ref(storage, 'sessions/session-1/raw/photo-1.jpg')))
  })

  it('denies a non-admin from uploading a raw photo', async () => {
    const storage = testEnv.authenticatedContext('client-1').storage()
    await assertFails(
      uploadBytes(ref(storage, 'sessions/session-1/raw/photo-2.jpg'), new Uint8Array([4, 5, 6])),
    )
  })

  it('allows the admin to upload a raw photo', async () => {
    const storage = testEnv.authenticatedContext('anna', { admin: true }).storage()
    await assertSucceeds(
      uploadBytes(ref(storage, 'sessions/session-1/raw/photo-2.jpg'), new Uint8Array([4, 5, 6])),
    )
  })
})

describe('storage rules: finished photos', () => {
  it('denies reading a finished photo when signed out', async () => {
    const storage = testEnv.unauthenticatedContext().storage()
    await assertFails(getBytes(ref(storage, 'sessions/session-1/finished/photo-1.jpg')))
  })

  it("denies another client from reading someone else's finished photo", async () => {
    const storage = testEnv.authenticatedContext('client-2').storage()
    await assertFails(getBytes(ref(storage, 'sessions/session-1/finished/photo-1.jpg')))
  })

  it('allows the assigned client to read their finished photo', async () => {
    const storage = testEnv.authenticatedContext('client-1').storage()
    await assertSucceeds(getBytes(ref(storage, 'sessions/session-1/finished/photo-1.jpg')))
  })

  it('denies a non-admin from uploading a finished photo', async () => {
    const storage = testEnv.authenticatedContext('client-1').storage()
    await assertFails(
      uploadBytes(ref(storage, 'sessions/session-1/finished/photo-2.jpg'), new Uint8Array([4, 5, 6])),
    )
  })

  it('allows the admin to upload a finished photo', async () => {
    const storage = testEnv.authenticatedContext('anna', { admin: true }).storage()
    await assertSucceeds(
      uploadBytes(ref(storage, 'sessions/session-1/finished/photo-2.jpg'), new Uint8Array([4, 5, 6])),
    )
  })
})
