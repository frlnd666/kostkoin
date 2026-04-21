// src/utils/notifSound.ts
// Strategi: buat AudioContext baru tiap panggilan — paling kompatibel,
// tidak bergantung pada gesture lifecycle atau singleton state.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AC = (): typeof AudioContext => window.AudioContext ?? (window as any).webkitAudioContext

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

const play = async (fn: (ac: AudioContext) => void) => {
  try {
    const ac = new (AC())()
    if (ac.state === 'suspended') await ac.resume()
    fn(ac)
    // Tutup AC setelah selesai agar tidak memory leak
    setTimeout(() => { ac.close().catch(() => {}) }, 2000)
  } catch (_) {}
}

export const playNotifSound = () => play(ac => {
  tone(ac, 'sine', 880, 660, 0.4, 0,    0.15)
  tone(ac, 'sine', 660, 660, 0.2, 0.15, 0.25)
})

export const playSuccessSound = () => play(ac => {
  tone(ac, 'sine', 523.25, 523.25, 0.35, 0,    0.14)
  tone(ac, 'sine', 659.25, 659.25, 0.35, 0.16, 0.14)
  tone(ac, 'sine', 783.99, 783.99, 0.40, 0.32, 0.28)
})

export const playPendingSound = () => play(ac => {
  tone(ac, 'sine', 440, 440, 0.25, 0,    0.12)
  tone(ac, 'sine', 440, 440, 0.20, 0.22, 0.12)
})

export const playErrorSound = () => play(ac => {
  tone(ac, 'sawtooth', 300, 150, 0.25, 0, 0.35)
})

// Tetap export unlockAudio agar tidak perlu ubah App.tsx,
// tapi sekarang tidak diperlukan lagi
export const unlockAudio = () => {}
