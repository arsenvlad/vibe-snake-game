export class AudioManager {
    private ctx!: AudioContext
    private enabled: boolean = true

    constructor() {
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        } catch (e) {
            console.warn('Web Audio API not supported')
            this.enabled = false
        }
    }

    public play(sound: 'eat' | 'die' | 'powerup') {
        if (!this.enabled) return

        // Resume context if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume()
        }

        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        if (sound === 'eat') {
            osc.type = 'sine'
            osc.frequency.setValueAtTime(600, this.ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1)

            gain.gain.setValueAtTime(0.3, this.ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1)

            osc.start()
            osc.stop(this.ctx.currentTime + 0.1)
        } else if (sound === 'die') {
            osc.type = 'sawtooth'
            osc.frequency.setValueAtTime(200, this.ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5)

            gain.gain.setValueAtTime(0.3, this.ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5)

            osc.start()
            osc.stop(this.ctx.currentTime + 0.5)
        } else if (sound === 'powerup') {
            // Multi-tone arpeggio for power-up collection
            osc.type = 'sine'
            osc.frequency.setValueAtTime(523, this.ctx.currentTime) // C5
            osc.frequency.setValueAtTime(659, this.ctx.currentTime + 0.08) // E5
            osc.frequency.setValueAtTime(784, this.ctx.currentTime + 0.16) // G5
            osc.frequency.setValueAtTime(1047, this.ctx.currentTime + 0.24) // C6

            gain.gain.setValueAtTime(0.35, this.ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35)

            osc.start()
            osc.stop(this.ctx.currentTime + 0.35)
        }
    }
}
