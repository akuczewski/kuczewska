import { type FirebaseApp, initializeApp } from 'firebase/app'

/**
 * Just the Firebase app and its configuration — no Auth / Firestore / Storage
 * SDKs — so code that only needs the app (analytics on the public site) does
 * not pull the whole Firebase bundle onto the home page.
 */

/** True in local dev and tests — nothing leaves the machine. */
export const usesEmulators = import.meta.env.DEV || import.meta.env.MODE === 'test'

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
  measurementId: 'G-9BC1P1LBRZ',
}

let app: FirebaseApp | undefined

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(usesEmulators ? emulatorConfig : productionConfig)
  }
  return app
}
