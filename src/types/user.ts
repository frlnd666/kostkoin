export type UserRole = 'penyewa' | 'pemilik' | 'admin'

export interface User {
  uid:        string
  email:      string
  nama:       string
  noHp:       string
  role:       UserRole
  fotoUrl?:   string
  createdAt:  Date
  isVerified: boolean
}
 
