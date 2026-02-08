/**
 * 🎵 Rhythm Surfer Music Engine v2
 *
 * Uses a lookahead scheduler to avoid overloading Web Audio API.
 * Only schedules a few beats ahead at a time.
 */

// Musical scales per song
const SCALES: Record<string, number[]> = {
    'morning-dew': [261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
    'ocean-waves': [246.94, 293.66, 329.63, 369.99, 440.00, 493.88],
    'forest-walk': [329.63, 369.99, 415.30, 493.88, 554.37, 659.25],
    'starlight-dance': [293.66, 349.23, 392.00, 440.00, 523.25, 587.33],
    'cosmic-beat': [220.00, 261.63, 293.66, 329.63, 392.00, 440.00],
    'neon-city': [233.08, 277.18, 311.13, 369.99, 415.30, 466.16],
};

const BASS_NOTES: Record<string, number[]> = {
    'morning-dew': [130.81, 146.83, 164.81, 130.81],
    'ocean-waves': [123.47, 146.83, 164.81, 146.83],
    'forest-walk': [164.81, 196.00, 220.00, 196.00],
    'starlight-dance': [146.83, 174.61, 196.00, 164.81],
    'cosmic-beat': [110.00, 130.81, 146.83, 130.81],
    'neon-city': [116.54, 138.59, 155.56, 138.59],
};

class RhythmMusicEngine {
    private audioCtx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isPlaying = false;
    private schedulerTimer: ReturnType<typeof setInterval> | null = null;
    private currentBeat = 0;
    private nextBeatTime = 0;
    private beatDuration = 0;
    private totalBeats = 0;
    private songId = '';
    private bpm = 120;

    private getContext(): AudioContext {
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
            this.audioCtx = new AudioContext();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 0.7;
            this.masterGain.connect(this.audioCtx.destination);
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    /** Play a note with envelope */
    private playNote(
        freq: number,
        time: number,
        duration: number,
        volume: number,
        type: OscillatorType = 'sine'
    ): void {
        const ctx = this.audioCtx!;
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        const attack = Math.min(0.03, duration * 0.1);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(volume, time + attack);
        gain.gain.setValueAtTime(volume, time + duration * 0.6);
        gain.gain.linearRampToValueAtTime(0, time + duration);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(time);
        osc.stop(time + duration + 0.01);
    }

    /** Play kick drum */
    private playKick(time: number, volume: number = 0.25): void {
        const ctx = this.audioCtx!;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(time);
        osc.stop(time + 0.3);
    }

    /** Play snare */
    private playSnare(time: number, volume: number = 0.12): void {
        const ctx = this.audioCtx!;
        const len = ctx.sampleRate * 0.1;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);

        const src = ctx.createBufferSource();
        src.buffer = buf;

        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        src.connect(hp);
        hp.connect(gain);
        gain.connect(this.masterGain!);
        src.start(time);
    }

    /** Play hi-hat */
    private playHiHat(time: number, volume: number = 0.06): void {
        const ctx = this.audioCtx!;
        const len = ctx.sampleRate * 0.03;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);

        const src = ctx.createBufferSource();
        src.buffer = buf;

        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 7000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        src.connect(hp);
        hp.connect(gain);
        gain.connect(this.masterGain!);
        src.start(time);
    }

    /** Schedule a single beat's worth of music */
    private scheduleBeat(beat: number, time: number): void {
        const scale = SCALES[this.songId] || SCALES['morning-dew'];
        const bass = BASS_NOTES[this.songId] || BASS_NOTES['morning-dew'];
        const bd = this.beatDuration;

        // === DRUMS ===
        // Kick on 1, 3
        if (beat % 4 === 0 || beat % 4 === 2) {
            this.playKick(time);
        }
        // Snare on 2, 4
        if (beat % 4 === 1 || beat % 4 === 3) {
            this.playSnare(time);
        }
        // Hi-hat every beat
        this.playHiHat(time);
        // Offbeat hi-hat for fast songs
        if (this.bpm >= 120) {
            this.playHiHat(time + bd * 0.5, 0.03);
        }

        // === BASS (every 2 beats) ===
        if (beat % 2 === 0) {
            const bassNote = bass[Math.floor(beat / 4) % bass.length];
            this.playNote(bassNote, time, bd * 1.8, 0.15, 'triangle');
        }

        // === MELODY (every beat, alternating) ===
        const noteIdx = (beat * 3 + Math.floor(beat / 4) * 2) % scale.length;
        if (beat % 2 === 0) {
            this.playNote(scale[noteIdx], time, bd * 1.2, 0.1, 'sine');
        } else {
            // Lighter passing note on odd beats
            this.playNote(scale[(noteIdx + 2) % scale.length], time, bd * 0.6, 0.05, 'sine');
        }

        // === HARMONY (every 4 beats) ===
        if (beat % 4 === 0) {
            const root = scale[0] * 0.5;
            const fifth = scale[4] * 0.5;
            this.playNote(root, time, bd * 3.5, 0.04, 'sine');
            this.playNote(fifth, time, bd * 3.5, 0.03, 'sine');
        }

        // === ARPEGGIO for fast songs ===
        if (this.bpm >= 120 && beat % 4 === 0) {
            for (let i = 0; i < 3; i++) {
                const arpNote = scale[(i * 2) % scale.length] * 2;
                this.playNote(arpNote, time + i * bd * 0.33, bd * 0.25, 0.04, 'sine');
            }
        }

        // === FILL every 16 beats ===
        if (beat > 0 && beat % 16 === 15) {
            this.playSnare(time + bd * 0.25, 0.1);
            this.playSnare(time + bd * 0.5, 0.12);
            this.playSnare(time + bd * 0.75, 0.14);
        }
    }

    /** Lookahead scheduler - called every 25ms, schedules ~100ms ahead */
    private scheduler(): void {
        const ctx = this.audioCtx;
        if (!ctx || !this.isPlaying) return;

        const lookahead = 0.1; // Schedule 100ms ahead

        while (this.nextBeatTime < ctx.currentTime + lookahead) {
            if (this.currentBeat >= this.totalBeats) {
                this.stop();
                return;
            }
            this.scheduleBeat(this.currentBeat, this.nextBeatTime);
            this.nextBeatTime += this.beatDuration;
            this.currentBeat++;
        }
    }

    /** Play a beat click sound (for tap feedback) */
    playBeatClick(): void {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    /** Start playing a song */
    play(songId: string, bpm: number, duration: number): void {
        this.stop();

        const ctx = this.getContext();
        this.isPlaying = true;
        this.songId = songId;
        this.bpm = bpm;
        this.beatDuration = 60 / bpm;
        this.totalBeats = Math.ceil(duration / this.beatDuration);
        this.currentBeat = 0;
        this.nextBeatTime = ctx.currentTime + 0.05;

        // Set master volume
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(0.7, ctx.currentTime);
        }

        // Start scheduler loop (runs every 25ms)
        this.schedulerTimer = setInterval(() => this.scheduler(), 25);
    }

    /** Stop all music */
    stop(): void {
        this.isPlaying = false;

        if (this.schedulerTimer) {
            clearInterval(this.schedulerTimer);
            this.schedulerTimer = null;
        }

        // Quick fade out
        if (this.masterGain && this.audioCtx) {
            const now = this.audioCtx.currentTime;
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(0, now + 0.2);
            // Restore volume after fade for next play
            this.masterGain.gain.setValueAtTime(0.7, now + 0.25);
        }
    }

    /** Clean up everything */
    dispose(): void {
        this.stop();
        setTimeout(() => {
            if (this.audioCtx && this.audioCtx.state !== 'closed') {
                this.audioCtx.close();
            }
            this.audioCtx = null;
            this.masterGain = null;
        }, 300);
    }
}

// Singleton
let instance: RhythmMusicEngine | null = null;

export function getRhythmMusicEngine(): RhythmMusicEngine {
    if (!instance) {
        instance = new RhythmMusicEngine();
    }
    return instance;
}
