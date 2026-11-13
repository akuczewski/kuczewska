import { type FirebaseApp, initializeApp } from 'firebase/app'
import { type Auth, connectAuthEmulator, getAuth } from 'firebase/auth'
import { type Firestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { type FirebaseStorage, connectStorageEmulator, getStorage } from 'firebase/storage'
import { type Functions, connectFunctionsEmulator, getFunctions } from 'firebase/functions'

const useEmulators = import.meta.env.DEV || import.meta.env.MODE === 'test'

// Local development and tests talk only to the emulators, under a throwaway
// project id, so nothing done locally can touch real client data.
const emulatorConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'kuczewska-dev.firebaseapp.com',
  projectId: 'kuczewska-dev',
  storageBucket: 'kuczewska-dev.appspot.com',
}

// Production build. These values identify the project to the browser and are
// public by design — access is guarded by firestore.rules / storage.rules.
const productionConfig = {
  apiKey: 'AIzaSyAOCzlBFUajiLVpYu4CXKDe_2ovsDeFzjc',
  authDomain: 'kuczewska-ee655.firebaseapp.com',
  projectId: 'kuczewska-ee655',
  storageBucket: 'kuczewska-ee655.firebasestorage.app',
  messagingSenderId: '1046822170248',
  appId: '1:1046822170248:web:02dc88cb720eff40e2793d',
}

const firebaseConfig = useEmulators ? emulatorConfig : productionConfig

let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let storage: FirebaseStorage | undefined
let functions: Functions | undefined

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig)
  }
  return app
}

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
