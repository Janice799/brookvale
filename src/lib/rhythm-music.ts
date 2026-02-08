/**
 * 🎵 Rhythm Surfer Music Engine
 *
 * Procedurally generated music using Web Audio API.
 * Each song gets a unique melodic pattern, bass line, and percussion.
 */

type NoteFrequency = number;

// Musical scale frequencies (A minor pentatonic variants)
const SCALES = {
    'morning-dew': [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33], // C major
    'ocean-waves': [246.94, 293.66, 329.63, 369.99, 440.00, 493.88, 587.33], // B minor
    'forest-walk': [329.63, 369.99, 415.30, 493.88, 554.37, 659.25, 739.99], // E major
    'starlight-dance': [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 659.25], // D mixolydian
    'cosmic-beat': [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // A minor
    'neon-city': [233.08, 277.18, 311.13, 369.99, 415.30, 466.16, 554.37], // Bb minor
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
    private activeNodes: (AudioNode | AudioBufferSourceNode | OscillatorNode)[] = [];
    private scheduledTimeouts: number[] = [];
    private isPlaying = false;
    private currentSongId = '';

    private getContext(): AudioContext {
        if (!this.audioCtx) {
            this.audioCtx = new AudioContext();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 0;
            this.masterGain.connect(this.audioCtx.destination);
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    /** Create a soft synth tone */
    private createTone(
        ctx: AudioContext,
        freq: NoteFrequency,
        startTime: number,
        duration: number,
        volume: number = 0.12,
        type: OscillatorType = 'sine'
    ): void {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        gain.gain.setValueAtTime(volume, startTime + duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);

        this.activeNodes.push(osc, gain);
    }

    /** Create a pad chord (warm sustained chord) */
    private createPad(
        ctx: AudioContext,
        frequencies: number[],
        startTime: number,
        duration: number,
        volume: number = 0.04
    ): void {
        frequencies.forEach(freq => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            // Add gentle vibrato
            const vibrato = ctx.createOscillator();
            vibrato.type = 'sine';
            vibrato.frequency.value = 4 + Math.random() * 2;
            const vibratoGain = ctx.createGain();
            vibratoGain.gain.value = freq * 0.003;
            vibrato.connect(vibratoGain);
            vibratoGain.connect(osc.frequency);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.3);
            gain.gain.setValueAtTime(volume, startTime + duration * 0.8);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.1);
            vibrato.start(startTime);
            vibrato.stop(startTime + duration + 0.1);

            this.activeNodes.push(osc, gain, vibrato, vibratoGain);
        });
    }

    /** Create percussion hit (kick / snare / hi-hat) */
    private createPercussion(
        ctx: AudioContext,
        type: 'kick' | 'snare' | 'hihat',
        startTime: number,
        volume: number = 0.15
    ): void {
        if (type === 'kick') {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, startTime);
            osc.frequency.exponentialRampToValueAtTime(50, startTime + 0.1);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(startTime);
            osc.stop(startTime + 0.35);

            this.activeNodes.push(osc, gain);
        } else if (type === 'snare') {
            // Noise burst
            const bufferSize = ctx.sampleRate * 0.15;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 2000;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(volume * 0.5, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain!);
            noise.start(startTime);

            this.activeNodes.push(noise, filter, gain);
        } else if (type === 'hihat') {
            const bufferSize = ctx.sampleRate * 0.05;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 8000;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(volume * 0.2, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain!);
            noise.start(startTime);

            this.activeNodes.push(noise, filter, gain);
        }
    }

    /** Create bass line */
    private createBass(
        ctx: AudioContext,
        freq: number,
        startTime: number,
        duration: number,
        volume: number = 0.1
    ): void {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        gain.gain.setValueAtTime(volume, startTime + duration * 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);

        this.activeNodes.push(osc, filter, gain);
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
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    /** Schedule a full song */
    play(songId: string, bpm: number, duration: number): void {
        this.stop();

        const ctx = this.getContext();
        this.isPlaying = true;
        this.currentSongId = songId;

        const scale = SCALES[songId as keyof typeof SCALES] || SCALES['morning-dew'];
        const bassNotes = BASS_NOTES[songId as keyof typeof BASS_NOTES] || BASS_NOTES['morning-dew'];
        const beatDuration = 60 / bpm;
        const totalBeats = Math.ceil(duration / beatDuration);
        const startTime = ctx.currentTime + 0.1;

        // Fade in master
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(0, startTime);
            this.masterGain.gain.linearRampToValueAtTime(0.8, startTime + 1.5);
        }

        // Schedule all the music
        for (let beat = 0; beat < totalBeats; beat++) {
            const t = startTime + beat * beatDuration;

            // --- PERCUSSION ---
            // Kick on beats 1, 3
            if (beat % 4 === 0 || beat % 4 === 2) {
                this.createPercussion(ctx, 'kick', t, 0.15);
            }
            // Snare on beats 2, 4
            if (beat % 4 === 1 || beat % 4 === 3) {
                this.createPercussion(ctx, 'snare', t, 0.1);
            }
            // Hi-hat on every beat (and offbeats for faster songs)
            this.createPercussion(ctx, 'hihat', t, 0.08);
            if (bpm >= 120) {
                this.createPercussion(ctx, 'hihat', t + beatDuration * 0.5, 0.05);
            }

            // --- BASS ---
            if (beat % 4 === 0) {
                const bassNote = bassNotes[Math.floor(beat / 4) % bassNotes.length];
                this.createBass(ctx, bassNote, t, beatDuration * 2, 0.1);
            }

            // --- MELODY ---
            if (beat % 2 === 0) {
                // Main melody note
                const noteIdx = (beat * 3 + Math.floor(beat / 4) * 2) % scale.length;
                this.createTone(ctx, scale[noteIdx], t, beatDuration * 1.5, 0.08, 'sine');

                // Harmony (5th above, quieter)
                if (beat % 4 === 0) {
                    const harmIdx = (noteIdx + 4) % scale.length;
                    this.createTone(ctx, scale[harmIdx], t + beatDuration * 0.5, beatDuration, 0.04, 'triangle');
                }
            }

            // --- PAD CHORDS (every 4 beats) ---
            if (beat % 8 === 0) {
                const root = scale[0];
                const third = scale[2];
                const fifth = scale[4];
                this.createPad(ctx, [root * 0.5, third * 0.5, fifth * 0.5], t, beatDuration * 8, 0.03);
            }

            // --- ARPEGGIOS (for faster songs) ---
            if (bpm >= 120 && beat % 4 === 0) {
                for (let i = 0; i < 4; i++) {
                    const arpNote = scale[(i * 2) % scale.length];
                    this.createTone(
                        ctx,
                        arpNote * 2, // Octave up
                        t + i * beatDuration * 0.25,
                        beatDuration * 0.2,
                        0.03,
                        'sine'
                    );
                }
            }

            // --- FILLS (every 16 beats) ---
            if (beat > 0 && beat % 16 === 15) {
                for (let i = 0; i < 4; i++) {
                    this.createPercussion(ctx, 'snare', t + i * beatDuration * 0.25, 0.12);
                }
            }
        }

        // Schedule fade out near the end
        if (this.masterGain) {
            const fadeStart = startTime + (totalBeats - 4) * beatDuration;
            this.masterGain.gain.setValueAtTime(0.8, fadeStart);
            this.masterGain.gain.linearRampToValueAtTime(0, fadeStart + 4 * beatDuration);
        }
    }

    /** Stop all music */
    stop(): void {
        this.isPlaying = false;
        this.currentSongId = '';

        // Fade out quickly
        if (this.masterGain && this.audioCtx) {
            const now = this.audioCtx.currentTime;
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(0, now + 0.3);
        }

        // Clear scheduled timeouts
        this.scheduledTimeouts.forEach(id => clearTimeout(id));
        this.scheduledTimeouts = [];

        // Stop and disconnect after fade
        setTimeout(() => {
            this.activeNodes.forEach(node => {
                try {
                    if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
                        node.stop();
                    }
                    node.disconnect();
                } catch {
                    // Already stopped/disconnected
                }
            });
            this.activeNodes = [];
        }, 400);
    }

    /** Clean up everything */
    dispose(): void {
        this.stop();
        setTimeout(() => {
            if (this.audioCtx) {
                this.audioCtx.close();
                this.audioCtx = null;
                this.masterGain = null;
            }
        }, 500);
    }

    getIsPlaying(): boolean {
        return this.isPlaying;
    }

    getCurrentSong(): string {
        return this.currentSongId;
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
