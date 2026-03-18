import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, query, where, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Booking, BookingStatus } from '../types/booking'

const COL = 'bookings'

export const createBooking = async (data: Omit<Booking, 'id' | 'createdAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export const getBookingById = async (id: string): Promise<Booking | null> => {
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Booking
}

export const getBookingsByPenyewa = async (penyewaId: string): Promise<Booking[]> => {
  const q = query(
    collection(db, COL),
    where('penyewaId', '==', penyewaId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking))
}

export const getBookingsByPemilik = async (pemilikId: string): Promise<Booking[]> => {
  const q = query(
    collection(db, COL),
    where('pemilikId', '==', pemilikId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking))
}

export const updateBookingStatus = async (id: string, status: BookingStatus, extra?: Partial<Booking>) => {
  await updateDoc(doc(db, COL, id), { status, ...extra })
}
 
