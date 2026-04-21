// src/utils/notifSound.ts

// ── Singleton AudioContext ─────────────────────────────────────────
// Dibuat sekali, di-resume setiap kali mau play (handle browser autoplay policy)
let _ac: AudioContext | null = null

const getAC = (): AudioContext => {
  if (!_ac) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext
    _ac = new Ctor() as AudioContext
  }
  return _ac
}

// Pastikan AudioContext tidak suspended sebelum play
const resumeAC = async (): Promise<AudioContext> => {
  const ac = getAC()
  if (ac.state === 'suspended') await ac.resume()
  return ac
}

// ── Unlock AudioContext on first user interaction ─────────────────
// Dipanggil sekali saat app mount — memastikan AC aktif setelah tap/klik
let _unlocked = false
export const unlockAudio = () => {
  if (_unlocked) return
  _unlocked = true
  const unlock = async () => {
    await resumeAC()
    document.removeEventListener('touchstart', unlock)
    document.removeEventListener('touchend',   unlock)
    document.removeEventListener('click',      unlock)
    document.removeEventListener('keydown',    unlock)
  }
  document.addEventListener('touchstart', unlock, { once: true })
  document.addEventListener('touchend',   unlock, { once: true })
  document.addEventListener('click',      unlock, { once: true })
  document.addEventListener('keydown',    unlock, { once: true })
}

// ── Helper: buat satu nada ────────────────────────────────────────
const playTone = (
  ac:       AudioContext,
  type:     OscillatorType,
  freq:     number,
  freqEnd:  number,
  volume:   number,
  startAt:  number,
  duration: number,
) => {
  const osc  = ac.createOscillator()
  const gain = ac.createGain()

  osc.connect(gain)
  gain.connect(ac.destination)

  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime + startAt)
  if (freqEnd !== freq) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, ac.currentTime + startAt + duration)
  }

  gain.gain.setValueAtTime(volume, ac.currentTime + startAt)
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + startAt + duration)

  osc.start(ac.currentTime + startAt)
  osc.stop(ac.currentTime + startAt + duration + 0.05)
}

// ── Suara notifikasi umum (ding pendek) ──────────────────────────
export const playNotifSound = async () => {
  try {
    const ac = await resumeAC()
    playTone(ac, 'sine', 880, 660, 0.4, 0,    0.15)
    playTone(ac, 'sine', 660, 660, 0.2, 0.15, 0.25)
  } catch (_) { /* silent */ }
}

// ── Suara sukses (3 nada naik — C5 E5 G5) ───────────────────────
export const playSuccessSound = async () => {
  try {
    const ac = await resumeAC()
    playTone(ac, 'sine', 523.25, 523.25, 0.35, 0,    0.14)
    playTone(ac, 'sine', 659.25, 659.25, 0.35, 0.16, 0.14)
    playTone(ac, 'sine', 783.99, 783.99, 0.40, 0.32, 0.28)
  } catch (_) { /* silent */ }
}

// ── Suara pending (2 tik netral — A4) ────────────────────────────
export const playPendingSound = async () => {
  try {
    const ac = await resumeAC()
    playTone(ac, 'sine', 440, 440, 0.25, 0,    0.12)
    playTone(ac, 'sine', 440, 440, 0.20, 0.22, 0.12)
  } catch (_) { /* silent */ }
}

// ── Suara error (nada turun — sawtooth) ──────────────────────────
export const playErrorSound = async () => {
  try {
    const ac = await resumeAC()
    playTone(ac, 'sawtooth', 300, 150, 0.25, 0, 0.35)
  } catch (_) { /* silent */ }
}
