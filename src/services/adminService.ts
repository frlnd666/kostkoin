import {
  collection, getDocs, query, orderBy,
  doc, updateDoc, serverTimestamp, getCountFromServer,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Listing } from '../types/listing'
import type { User } from '../types/user'

export const getAllListings = async (): Promise<Listing[]> => {
  const q    = query(collection(db, 'listings'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Listing[]
}

export const getAllUsers = async (): Promise<User[]> => {
  const q    = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ ...d.data() })) as User[]
}

export const approveListing = async (id: string): Promise<void> => {
  await updateDoc(doc(db, 'listings', id), {
    status:    'approved',
    updatedAt: serverTimestamp(),
  })
}

export const rejectListing = async (id: string): Promise<void> => {
  await updateDoc(doc(db, 'listings', id), {
    status:    'rejected',
    updatedAt: serverTimestamp(),
  })
}

export const deactivateListing = async (id: string): Promise<void> => {
  await updateDoc(doc(db, 'listings', id), {
    status:    'inactive',
    updatedAt: serverTimestamp(),
  })
}

export const getStats = async () => {
  const [users, listings] = await Promise.all([
    getCountFromServer(collection(db, 'users')),
    getCountFromServer(collection(db, 'listings')),
  ])
  return {
    totalUsers:    users.data().count,
    totalListings: listings.data().count,
  }
}
 
