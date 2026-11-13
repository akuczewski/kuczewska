import { type Auth, connectAuthEmulator, getAuth } from 'firebase/auth'
import { type Firestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { type FirebaseStorage, connectStorageEmulator, getStorage } from 'firebase/storage'
import { type Functions, connectFunctionsEmulator, getFunctions } from 'firebase/functions'

import { getFirebaseApp, usesEmulators } from './firebaseApp'

export { getFirebaseApp, usesEmulators }

const useEmulators = usesEmulators

let auth: Auth | undefined
let db: Firestore | undefined
let storage: FirebaseStorage | undefined
let functions: Functions | undefined

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
    if (useEmulators) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    }
  }
  return auth
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp())
    if (useEmulators) {
      connectFirestoreEmulator(db, '127.0.0.1', 8080)
    }
  }
  return db
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp())
    if (useEmulators) {
      connectStorageEmulator(storage, '127.0.0.1', 9199)
    }
  }
  return storage
}

export function getFirebaseFunctions(): Functions {
  if (!functions) {
    functions = getFunctions(getFirebaseApp(), 'europe-west1')
    if (useEmulators) {
      connectFunctionsEmulator(functions, '127.0.0.1', 5001)
    }
  }
  return functions
}
