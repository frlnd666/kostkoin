import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Listing } from '../types/listing'

const COL = 'listings'

export const addListing = async (data: Omit<Listing, 'id' | 'createdAt' | 'status'>, pemilikId: string) => {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    pemilikId,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export const getApprovedListings = async (): Promise<Listing[]> => {
  const q = query(
    collection(db, COL),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing))
}

export const getListingById = async (id: string): Promise<Listing | null> => {
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Listing
}

export const getListingsByPemilik = async (pemilikId: string): Promise<Listing[]> => {
  const q = query(
    collection(db, COL),
    where('pemilikId', '==', pemilikId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing))
}

export const getAllListings = async (): Promise<Listing[]> => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing))
}

export const updateListingStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
  await updateDoc(doc(db, COL, id), { status })
}

export const deleteListing = async (id: string) => {
  await deleteDoc(doc(db, COL, id))
}
