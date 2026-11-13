import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore'
import { getFirestoreDb } from './firebase'
import type { Package } from './packages'

export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export type OfferLine = {
  packageId: string
  name: string
  priceGrosze: number
}

export type Offer = {
  id: string
  leadId: string
  lines: OfferLine[]
  totalPriceGrosze: number
  status: OfferStatus
  publicToken: string | null
  pdfStoragePath: string | null
}

export function sumOfferLines(lines: OfferLine[]): number {
  return lines.reduce((total, line) => total + line.priceGrosze, 0)
}

export function packagesToOfferLines(packages: Package[]): OfferLine[] {
  return packages.map((pkg) => ({
    packageId: pkg.id,
    name: pkg.name,
    priceGrosze: pkg.priceGrosze,
  }))
}

export type NewOffer = {
  leadId: string
  packages: Package[]
}

export async function createDraftOffer(input: NewOffer): Promise<string> {
  const lines = packagesToOfferLines(input.packages)
  const ref = await addDoc(collection(getFirestoreDb(), 'offers'), {
    leadId: input.leadId,
    lines,
    totalPriceGrosze: sumOfferLines(lines),
    status: 'draft',
    publicToken: null,
    pdfStoragePath: null,
    createdAt: serverTimestamp(),
    respondedAt: null,
  })
  return ref.id
}

export async function listOffersForLead(leadId: string): Promise<Offer[]> {
  const offersCollection = collection(getFirestoreDb(), 'offers')
  const snapshot = await getDocs(query(offersCollection, where('leadId', '==', leadId)))
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Offer, 'id'>),
  }))
}
