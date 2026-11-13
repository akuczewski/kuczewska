import { readFileSync } from 'node:fs'
import {
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore'
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
    await setDoc(doc(context.firestore(), 'packages/package-1'), {
      name: 'Sesja mieszkanie',
      description: 'Do 25 zdjęć',
      priceGrosze: 80000,
      active: true,
    })
  })
})

describe('firestore rules: packages', () => {
  it('denies reading packages when signed out', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'packages/package-1')))
  })

  it('denies a regular client from reading packages', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(getDocs(collection(db, 'packages')))
  })

  it('allows the admin to read packages', async () => {
    const db = testEnv.authenticatedContext('anna', { admin: true }).firestore()
    await assertSucceeds(getDocs(collection(db, 'packages')))
  })

  it('denies a regular client from creating a package', async () => {
    const db = testEnv.authenticatedContext('client-1').firestore()
    await assertFails(
      setDoc(doc(db, 'packages/package-2'), {
        name: 'x',
        description: 'y',
        priceGrosze: 1,
        active: true,
      }),
    )
  })

  it('allows the admin to create a package', async () => {
    const db = testEnv.authenticatedContext('anna', { admin: true }).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'packages/package-2'), {
        name: 'x',
        description: 'y',
        priceGrosze: 1,
        active: true,
      }),
    )
  })
})
