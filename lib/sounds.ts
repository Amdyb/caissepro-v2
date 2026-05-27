// Single shared AudioContext - creating a new one per call exhausts browser limits.
// All new contexts start suspended due to autoplay policy.
let _ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return _ctx
}

export function resumeContext(): void {
  const ac = getCtx()
  if (ac && ac.state === 'suspended') ac.resume().catch(() => {})
}

function isEnabled(): boolean {
  try {
    return localStorage.getItem('caissepro-sounds-enabled') !== '0'
  } catch {
    return true
  }
}

function play(fn: (ac: AudioContext) => void): void {
  if (!isEnabled()) return
  const ac = getCtx()
  if (!ac) return
  if (ac.state === 'suspended') {
    ac.resume().then(() => fn(ac)).catch(() => {})
    return
  }
  fn(ac)
}

// Cash register cha-ching: ascending C6 -> E6 -> G6
export function playSale(): void {
  play((ac) => {
    const now = ac.currentTime
    const notes: [number, number][] = [
      [1047, 0],
      [1319, 0.1],
      [1568, 0.2],
    ]
    notes.forEach(([freq, delay]) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.28, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.28)
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.28)
    })
  })
}

// Descending sawtooth buzz
export function playError(): void {
  play((ac) => {
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.3)
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  })
}

// Short sine tap
export function playClick(): void {
  play((ac) => {
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = 1200
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.03)
  })
}

// Ascending chime: C5 -> E5 -> G5 -> C6
export function playSuccess(): void {
  play((ac) => {
    const now = ac.currentTime
    const notes: [number, number][] = [
      [523, 0],
      [659, 0.12],
      [784, 0.24],
      [1047, 0.36],
    ]
    notes.forEach(([freq, delay]) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.2, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.28)
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.28)
    })
  })
}
