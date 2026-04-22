// src/utils/notifSound.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AC = (): typeof AudioContext => window.AudioContext ?? (window as any).webkitAudioContext

const tone = (
  ac: AudioContext, type: OscillatorType,
  freq: number, freqEnd: number,
  vol: number, t: number, dur: number,
) => {
  const osc  = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain); gain.connect(ac.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime + t)
  if (freqEnd !== freq) osc.frequency.exponentialRampToValueAtTime(freqEnd, ac.currentTime + t + dur)
  gain.gain.setValueAtTime(vol, ac.currentTime + t)
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + dur)
  osc.start(ac.currentTime + t)
  osc.stop(ac.currentTime + t + dur + 0.05)
}

// ✅ Terima AudioContext yang sudah ada, atau buat baru jika tidak ada
const play = async (fn: (ac: AudioContext) => void, existingAc?: AudioContext) => {
  try {
    const ac = existingAc ?? new (AC())()
    if (ac.state === 'suspended') await ac.resume()
    fn(ac)
    if (!existingAc) setTimeout(() => { ac.close().catch(() => {}) }, 2000)
  } catch (_) {}
}

export const playSuccessSound = (ac?: AudioContext) => play(ctx => {
  tone(ctx, 'sine', 523.25, 523.25, 0.35, 0,    0.14)
  tone(ctx, 'sine', 659.25, 659.25, 0.35, 0.16, 0.14)
  tone(ctx, 'sine', 783.99, 783.99, 0.40, 0.32, 0.28)
}, ac)

export const playPendingSound = (ac?: AudioContext) => play(ctx => {
  tone(ctx, 'sine', 440, 440, 0.25, 0,    0.12)
  tone(ctx, 'sine', 440, 440, 0.20, 0.22, 0.12)
}, ac)

export const playErrorSound = (ac?: AudioContext) => play(ctx => {
  tone(ctx, 'sawtooth', 300, 150, 0.25, 0, 0.35)
}, ac)

export const playNotifSound = (ac?: AudioContext) => play(ctx => {
  tone(ctx, 'sine', 880, 660, 0.4, 0,    0.15)
  tone(ctx, 'sine', 660, 660, 0.2, 0.15, 0.25)
}, ac)

export const unlockAudio = () => {}
