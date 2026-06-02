// Single shared AudioContext - creating a new one per call exhausts browser limits.
// All new contexts start suspended due to autoplay policy.
let _ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!_ctx || _ctx.state === 'closed') {
      _ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return _ctx
  } catch {
    return null
  }
}

export function resumeContext(): void {
  try {
    const ac = getCtx()
    if (ac && ac.state === 'suspended') ac.resume().catch(() => {})
  } catch {
    // ignore
  }
}

function isEnabled(key?: string): boolean {
  try {
    if (localStorage.getItem('caissepro-sounds-enabled') === '0') return false
    if (key) return localStorage.getItem(key) !== '0'
    return true
  } catch {
    return true
  }
}

function play(fn: (ac: AudioContext) => void): void {
  if (!isEnabled()) return
  const ac = getCtx()
  if (!ac) return
  try {
    if (ac.state === 'suspended') {
      ac.resume().then(() => { try { fn(ac) } catch {} }).catch(() => {})
      return
    }
    fn(ac)
  } catch {
    // ignore audio errors
  }
}

// Cash register cha-ching: ascending C6 → E6 → G6
export function playSale(): void {
  if (!isEnabled('caissepro-sounds-sale')) return
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

// Short buzz: sawtooth 200hz 150ms
export function playError(): void {
  play((ac) => {
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15)
    gain.gain.setValueAtTime(0.22, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.15)
  })
}

// Subtle soft tick: sine 800hz 50ms
export function playClick(): void {
  if (!isEnabled('caissepro-sounds-nav')) return
  play((ac) => {
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = 800
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.05)
  })
}

// Pleasant chime: C5 → E5 → G5 ascending
export function playSuccess(): void {
  play((ac) => {
    const now = ac.currentTime
    const notes: [number, number][] = [
      [523, 0],
      [659, 0.12],
      [784, 0.24],
    ]
    notes.forEach(([freq, delay]) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.18, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.28)
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.28)
    })
  })
}

// Very subtle whoosh: sine sweep 400 → 600hz 80ms
export function playNavigation(): void {
  if (!isEnabled('caissepro-sounds-nav')) return
  play((ac) => {
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.linearRampToValueAtTime(600, now + 0.08)
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.08)
  })
}
