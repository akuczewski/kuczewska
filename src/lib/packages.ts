import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'
import { getFirestoreDb } from './firebase'

export type Package = {
  id: string
  name: string
  description: string
  priceGrosze: number
  active: boolean
}

export type NewPackage = {
  name: string
  description: string
  priceGrosze: number
}

export async function createPackage(input: NewPackage): Promise<string> {
  const ref = await addDoc(collection(getFirestoreDb(), 'packages'), {
    name: input.name,
    description: input.description,
    priceGrosze: input.priceGrosze,
    active: true,
  })
  return ref.id
}

export async function listPackages(): Promise<Package[]> {
  const snapshot = await getDocs(collection(getFirestoreDb(), 'packages'))
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Package, 'id'>),
  }))
}

export async function setPackageActive(packageId: string, active: boolean): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), `packages/${packageId}`), { active })
}

export async function updatePackageDetails(packageId: string, input: NewPackage): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), `packages/${packageId}`), {
    name: input.name,
    description: input.description,
    priceGrosze: input.priceGrosze,
  })
}

export async function deletePackageById(packageId: string): Promise<void> {
  await deleteDoc(doc(getFirestoreDb(), `packages/${packageId}`))
}
