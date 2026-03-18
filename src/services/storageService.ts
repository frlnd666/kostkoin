const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

export const uploadFoto = async (file: File, folder = 'kostkoin/listings'): Promise<string> => {
  const formData = new FormData()
  formData.append('file',           file)
  formData.append('upload_preset',  UPLOAD_PRESET)
  formData.append('folder',         folder)

  const res  = await fetch(UPLOAD_URL, { method: 'POST', body: formData })
  const data = await res.json()

  if (!res.ok) throw new Error(data.error?.message ?? 'Upload gagal')
  return data.secure_url as string
}

export const uploadFotoListing = async (
  files: { kamar: File; tempat_tidur: File; fasilitas: File },
  pemilikId: string
): Promise<{ kamar: string; tempat_tidur: string; fasilitas: string }> => {
  const folder = `kostkoin/listings/${pemilikId}`

  const [kamar, tempat_tidur, fasilitas] = await Promise.all([
    uploadFoto(files.kamar,        folder),
    uploadFoto(files.tempat_tidur, folder),
    uploadFoto(files.fasilitas,    folder),
  ])

  return { kamar, tempat_tidur, fasilitas }
}
