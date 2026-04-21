// src/utils/notifSound.ts

// AudioContext dibuat HANYA setelah gesture pertama user
let _ac: AudioContext | null = null
let _unlocked = false

// Dipanggil dari App.tsx saat mount
export const unlockAudio = () => {
  if (_unlocked) return
  _unlocked = true

  const createAndResume = () => {
    if (_ac) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext
    if (!Ctor) return
    _ac = new Ctor() as AudioContext
    // resume() tidak perlu dipanggil di sini karena AC baru di dalam gesture
    // sudah langsung running di semua browser modern
  }

  document.addEventListener('touchstart', createAndResume, { once: true, passive: true })
  document.addEventListener('touchend',   createAndResume, { once: true, passive: true })
  document.addEventListener('click',      createAndResume, { once: true, passive: true })
  document.addEventListener('keydown',    createAndResume, { once: true, passive: true })
}

// Pastikan AC ada dan running sebelum play
const getReadyAC = async (): Promise<AudioContext | null> => {
  if (!_ac) return null
  if (_ac.state === 'suspended') {
    try { await _ac.resume() } catch (_) { return null }
  }
  return _ac.state === 'running' ? _ac : null
}

// Helper buat satu nada
const tone = (
  ac:      AudioContext,
  type:    OscillatorType,
  freq:    number,
  freqEnd: number,
  vol:     number,
  t:       number,
  dur:     number,
) => {
  const osc  = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime + t)
  if (freqEnd !== freq) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, ac.currentTime + t + dur)
  }
  gain.gain.setValueAtTime(vol, ac.currentTime + t)
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + dur)
  osc.start(ac.currentTime + t)
  osc.stop(ac.currentTime + t + dur + 0.05)
}

// ── Notif umum (ding) ─────────────────────────────────────────
export const playNotifSound = async () => {
  const ac = await getReadyAC()
  if (!ac) return
  try {
    tone(ac, 'sine', 880, 660, 0.4, 0,    0.15)
    tone(ac, 'sine', 660, 660, 0.2, 0.15, 0.25)
  } catch (_) {}
}

// ── Sukses (C5 → E5 → G5) ────────────────────────────────────
export const playSuccessSound = async () => {
  const ac = await getReadyAC()
  if (!ac) return
  try {
    tone(ac, 'sine', 523.25, 523.25, 0.35, 0,    0.14)
    tone(ac, 'sine', 659.25, 659.25, 0.35, 0.16, 0.14)
    tone(ac, 'sine', 783.99, 783.99, 0.40, 0.32, 0.28)
  } catch (_) {}
}

// ── Pending (2 tik A4) ────────────────────────────────────────
export const playPendingSound = async () => {
  const ac = await getReadyAC()
  if (!ac) return
  try {
    tone(ac, 'sine', 440, 440, 0.25, 0,    0.12)
    tone(ac, 'sine', 440, 440, 0.20, 0.22, 0.12)
  } catch (_) {}
}

// ── Error (nada turun sawtooth) ───────────────────────────────
export const playErrorSound = async () => {
  const ac = await getReadyAC()
  if (!ac) return
  try {
    tone(ac, 'sawtooth', 300, 150, 0.25, 0, 0.35)
  } catch (_) {}
}
