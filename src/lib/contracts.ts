import { collection, getDocs, query, where } from 'firebase/firestore'
import { getFirestoreDb } from './firebase'

export type ContractStatus = 'pending' | 'signed'

export type Contract = {
  id: string
  offerId: string
  leadId: string
  status: ContractStatus
  pdfStoragePath: string | null
}

export async function listContractsForLead(leadId: string): Promise<Contract[]> {
  const contractsCollection = collection(getFirestoreDb(), 'contracts')
  const snapshot = await getDocs(query(contractsCollection, where('leadId', '==', leadId)))
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Contract, 'id'>),
  }))
}
