// src/utils/notifSound.ts

const ctx = (() => {
  try { return new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)() }
  catch { return null }
})()

const playTone = (freq: number, duration: number, gain: number, offset: number) => {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const vol = ctx.createGain()
  osc.connect(vol)
  vol.connect(ctx.destination)
  osc.frequency.value = freq
  osc.type            = 'sine'
  vol.gain.setValueAtTime(0, ctx.currentTime + offset)
  vol.gain.linearRampToValueAtTime(gain, ctx.currentTime + offset + 0.01)
  vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + duration)
  osc.start(ctx.currentTime + offset)
  osc.stop(ctx.currentTime + offset + duration + 0.05)
}

// Suara "ting-ting" lembut untuk notif baru
export const playNotifSound = () => {
  playTone(880, 0.15, 0.3, 0)
  playTone(1100, 0.15, 0.2, 0.18)
}

// Suara sukses (booking/payment berhasil)
export const playSuccessSound = () => {
  playTone(523, 0.1, 0.2, 0)
  playTone(659, 0.1, 0.2, 0.12)
  playTone(784, 0.2, 0.3, 0.24)
}

// Suara error/gagal
export const playErrorSound = () => {
  playTone(300, 0.3, 0.3, 0)
  playTone(250, 0.3, 0.2, 0.2)
}
