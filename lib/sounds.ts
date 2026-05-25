function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  return new (window.AudioContext || (window as any).webkitAudioContext)()
}

function enabled(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem('caissepro_sounds_enabled') === '1'
}

export function playSale() {
  if (!enabled()) return
  const ac = ctx()
  if (!ac) return
  const now = ac.currentTime
  const freqs = [1047, 1319, 1568]
  freqs.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.25, now + i * 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(now + i * 0.1)
    osc.stop(now + i * 0.1 + 0.25)
  })
}

export function playClick() {
  if (!enabled()) return
  const ac = ctx()
  if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'square'
  osc.frequency.value = 1000
  gain.gain.setValueAtTime(0.15, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.025)
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start()
  osc.stop(ac.currentTime + 0.025)
}

export function playSuccess() {
  if (!enabled()) return
  const ac = ctx()
  if (!ac) return
  const now = ac.currentTime
  const freqs = [523, 659, 784]
  freqs.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.2, now + i * 0.12)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(now + i * 0.12)
    osc.stop(now + i * 0.12 + 0.3)
  })
}

export function playError() {
  if (!enabled()) return
  const ac = ctx()
  if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(220, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.3)
  gain.gain.setValueAtTime(0.3, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3)
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start()
  osc.stop(ac.currentTime + 0.3)
}
