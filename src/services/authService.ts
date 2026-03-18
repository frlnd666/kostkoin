import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { User, UserRole } from '../types/user'

export const registerUser = async (
  email:    string,
  password: string,
  nama:     string,
  noHp:     string,
  role:     UserRole
): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password)

  const userData: User = {
    uid:        cred.user.uid,
    email,
    nama,
    noHp,
    role,
    isVerified: false,
    createdAt:  new Date(),
  }

  await setDoc(doc(db, 'users', cred.user.uid), {
    ...userData,
    createdAt: serverTimestamp(),
  })

  return userData
}

export const loginUser = async (
  email:    string,
  password: string
): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const snap = await getDoc(doc(db, 'users', cred.user.uid))

  if (!snap.exists()) throw new Error('Data pengguna tidak ditemukan')

  return snap.data() as User
}

export const logoutUser = async (): Promise<void> => {
  await signOut(auth)
}

export const getUserData = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return snap.data() as User
}

export const onAuthChange = (
  callback: (user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, callback)
}
 
