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
import {
  getStorage, ref,
  uploadBytes, getDownloadURL,
} from 'firebase/storage'
import { auth, db } from './firebase'
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

// ── Upload & Update Avatar ───────────────────────────────────
export const updateUserAvatar = async (file: File): Promise<string> => {
  const user    = auth.currentUser
  const storage = getStorage()
  if (!user) throw new Error('User tidak ditemukan')

  // Validasi ukuran maks 2MB
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Ukuran foto maksimal 2MB')
  }

  const storageRef = ref(storage, `avatars/${user.uid}`)
  await uploadBytes(storageRef, file)
  const photoURL = await getDownloadURL(storageRef)

  await updateProfile(user, { photoURL })
  await updateDoc(doc(db, 'users', user.uid), { fotoUrl: photoURL })

  return photoURL
}

// ── Auth State Listener ──────────────────────────────────────
export const onAuthChange = (
  callback: (user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, callback)
}
