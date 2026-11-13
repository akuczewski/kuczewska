import { describe, expect, it } from 'vitest'
import { getFirebaseApp, getFirebaseAuth, getFirebaseFunctions, getFirestoreDb, getFirebaseStorage } from './firebase'

describe('firebase init', () => {
  it('initializes a single shared FirebaseApp instance', () => {
    const app1 = getFirebaseApp()
    const app2 = getFirebaseApp()
    expect(app1).toBe(app2)
    expect(app1.options.projectId).toBe('kuczewska-dev')
  })

  it('exposes auth, firestore, storage and functions bound to the same app', () => {
    const auth = getFirebaseAuth()
    const db = getFirestoreDb()
    const storage = getFirebaseStorage()
    const functions = getFirebaseFunctions()

    expect(auth.app).toBe(getFirebaseApp())
    expect(db.app).toBe(getFirebaseApp())
    expect(storage.app).toBe(getFirebaseApp())
    expect(functions.app).toBe(getFirebaseApp())
  })
})
