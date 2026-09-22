// Web Audio Synthesizer sound effect helper & Web Haptic Feedback

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/**
 * Web Vibration API Haptic Feedback
 */
export function triggerHapticFeedback(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch (e) {
    // Ignore vibration errors
  }
}

/**
 * Âm thanh Click phím bấm tactile dịu nhẹ + Rung Haptic Feedback
 */
export function playClickSound() {
  triggerHapticFeedback(12)
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.03)

    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.03)
  } catch (e) {
    // Ignore audio errors
  }
}

/**
 * Âm thanh Hoàn thành xuất file (Success Chime) + Rung Haptic Đội 2 Nhịp
 */
export function playSuccessChime() {
  triggerHapticFeedback([20, 60, 20])
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6 pleasant arpeggio
    const now = ctx.currentTime

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      const startTime = now + idx * 0.07

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.08, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.3)
    })
  } catch (e) {
    // Ignore audio errors
  }
}
