import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { onAuthChange, getUserData } from '../services/authService'

export const useAuth = () => {
  const { user, loading, initialized, setUser, setLoading, setInitialized, logout } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setLoading(true)
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser.uid)
        setUser(userData)
      } else {
        setUser(null)
      }
      setLoading(false)
      setInitialized(true)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading, initialized, logout }
}
 
