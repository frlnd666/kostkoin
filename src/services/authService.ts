import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import {
  doc, setDoc, getDoc,
  serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { auth, db }    from './firebase'
import { uploadFoto }  from './storageService'
import type { User, UserRole } from '../types/user'

// ── Register ────────────────────────────────────────────────
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

// ── Login ───────────────────────────────────────────────────
export const loginUser = async (
  email:    string,
  password: string
): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const snap = await getDoc(doc(db, 'users', cred.user.uid))

  if (!snap.exists()) throw new Error('Data pengguna tidak ditemukan')

  return snap.data() as User
}

// ── Logout ──────────────────────────────────────────────────
export const logoutUser = async (): Promise<void> => {
  await signOut(auth)
}

// ── Get User Data ───────────────────────────────────────────
export const getUserData = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return snap.data() as User
}

// ── Update Nama ─────────────────────────────────────────────
export const updateUserName = async (nama: string): Promise<void> => {
  const user = auth.currentUser
  if (!user) throw new Error('User tidak ditemukan')

  await updateProfile(user, { displayName: nama })
  await updateDoc(doc(db, 'users', user.uid), { nama })
}

// ── Update Avatar via Cloudinary ─────────────────────────────
export const updateUserAvatar = async (file: File): Promise<string> => {
  const user = auth.currentUser
  if (!user) throw new Error('User tidak ditemukan')

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Ukuran foto maksimal 2MB')
  }

  // Upload ke Cloudinary folder avatars
  const fotoUrl = await uploadFoto(file, `kostkoin/avatars/${user.uid}`)

  // Sync ke Firebase Auth & Firestore
  await updateProfile(user, { photoURL: fotoUrl })
  await updateDoc(doc(db, 'users', user.uid), { fotoUrl })

  return fotoUrl
}

// ── Auth State Listener ──────────────────────────────────────
export const onAuthChange = (
  callback: (user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, callback)
}
