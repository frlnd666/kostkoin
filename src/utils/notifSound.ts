// src/utils/notifSound.ts

/**
 * Web Audio API — tidak butuh file audio eksternal.
 * Semua suara di-generate langsung via oscillator.
 */

const ctx = (): AudioContext => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext
  return new AudioCtx()
}

// ── Suara notifikasi umum (ding pendek) ──────────────────────
export const playNotifSound = () => {
  try {
    const ac  = ctx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()

    osc.connect(gain)
    gain.connect(ac.destination)

    osc.type      = 'sine'
    osc.frequency.setValueAtTime(880, ac.currentTime)          // A5
    osc.frequency.exponentialRampToValueAtTime(660, ac.currentTime + 0.15) // E5

    gain.gain.setValueAtTime(0.4, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4)

    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + 0.4)
  } catch (_) { /* silent fail */ }
}

// ── Suara pembayaran sukses (dua nada naik) ──────────────────
export const playSuccessSound = () => {
  try {
    const ac = ctx()

    const notes = [
      { freq: 523.25, start: 0,    dur: 0.15 }, // C5
      { freq: 659.25, start: 0.15, dur: 0.15 }, // E5
      { freq: 783.99, start: 0.30, dur: 0.25 }, // G5
    ]

    notes.forEach(({ freq, start, dur }) => {
      const osc  = ac.createOscillator()
      const gain = ac.createGain()

      osc.connect(gain)
      gain.connect(ac.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ac.currentTime + start)

      gain.gain.setValueAtTime(0.35, ac.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + dur)

      osc.start(ac.currentTime + start)
      osc.stop(ac.currentTime + start + dur)
    })
  } catch (_) { /* silent fail */ }
}

// ── Suara pending/menunggu (nada datar berulang) ─────────────
export const playPendingSound = () => {
  try {
    const ac = ctx()

    // Dua "tik" pendek dengan nada netral
    const ticks = [0, 0.2]

    ticks.forEach(start => {
      const osc  = ac.createOscillator()
      const gain = ac.createGain()

      osc.connect(gain)
      gain.connect(ac.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ac.currentTime + start) // A4 — netral

      gain.gain.setValueAtTime(0.25, ac.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + 0.12)

      osc.start(ac.currentTime + start)
      osc.stop(ac.currentTime + start + 0.12)
    })
  } catch (_) { /* silent fail */ }
}

// ── Suara error/gagal (nada turun) ───────────────────────────
export const playErrorSound = () => {
  try {
    const ac   = ctx()
    const osc  = ac.createOscillator()
    const gain = ac.createGain()

    osc.connect(gain)
    gain.connect(ac.destination)

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(300, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(150, ac.currentTime + 0.3)

    gain.gain.setValueAtTime(0.25, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35)

    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + 0.35)
  } catch (_) { /* silent fail */ }
}
