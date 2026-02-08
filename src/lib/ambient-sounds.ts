/**
 * 🎵 Brookvale Ambient Sound Engine v2
 *
 * Procedurally generated ambient sounds using Web Audio API.
 * Simplified and mobile-friendly.
 */

type SoundType = 'rain' | 'ocean' | 'forest' | 'wind' | 'none';

class AmbientSoundEngine {
    private audioCtx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private activeNodes: AudioNode[] = [];
    private currentSound: SoundType = 'none';

    private ensureContext(): AudioContext {
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
            this.audioCtx = new AudioContext();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 0;
            this.masterGain.connect(this.audioCtx.destination);
        }
        // Must be called from user gesture on mobile
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    /** Create looping noise buffer */
    private makeNoise(ctx: AudioContext, seconds: number, brown = false): AudioBuffer {
        const len = ctx.sampleRate * seconds;
        const buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            let last = 0;
            for (let i = 0; i < len; i++) {
                if (brown) {
                    const w = Math.random() * 2 - 1;
                    last = (last + 0.02 * w) / 1.02;
                    d[i] = last * 3.5;
                } else {
                    d[i] = Math.random() * 2 - 1;
                }
            }
        }
        return buf;
    }

    /** Add a filtered noise layer */
    private addNoiseLayer(
        ctx: AudioContext,
        brown: boolean,
        filterType: BiquadFilterType,
        filterFreq: number,
        filterQ: number,
        volume: number,
    ): void {
        const src = ctx.createBufferSource();
        src.buffer = this.makeNoise(ctx, brown ? 3 : 2, brown);
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = filterFreq;
        filter.Q.value = filterQ;

        const gain = ctx.createGain();
        gain.gain.value = volume;

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);
        src.start();

        this.activeNodes.push(src, filter, gain);
    }

    /** Add modulated noise (with LFO on volume or filter) */
    private addModulatedLayer(
        ctx: AudioContext,
        brown: boolean,
        filterType: BiquadFilterType,
        filterFreq: number,
        filterQ: number,
        volume: number,
        lfoRate: number,
        lfoDepth: number,
        modulateFilter = false,
    ): void {
        const src = ctx.createBufferSource();
        src.buffer = this.makeNoise(ctx, brown ? 3 : 2, brown);
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = filterFreq;
        filter.Q.value = filterQ;

        const gain = ctx.createGain();
        gain.gain.value = volume;

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = lfoRate;

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = lfoDepth;

        lfo.connect(lfoGain);
        if (modulateFilter) {
            lfoGain.connect(filter.frequency);
        } else {
            lfoGain.connect(gain.gain);
        }

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);
        src.start();
        lfo.start();

        this.activeNodes.push(src, filter, gain, lfo, lfoGain);
    }

    /** 🌧️ Rain */
    private buildRain(ctx: AudioContext): void {
        // High frequency rain drops
        this.addNoiseLayer(ctx, false, 'highpass', 4000, 0.5, 0.12);
        // Mid rain body
        this.addNoiseLayer(ctx, false, 'bandpass', 2000, 0.3, 0.06);
        // Low rumble
        this.addNoiseLayer(ctx, true, 'lowpass', 400, 0.5, 0.05);
    }

    /** 🌊 Ocean */
    private buildOcean(ctx: AudioContext): void {
        // Deep waves with slow modulation
        this.addModulatedLayer(ctx, true, 'lowpass', 500, 1, 0.2, 0.08, 0.12);
        // Surf foam
        this.addModulatedLayer(ctx, false, 'bandpass', 3000, 0.5, 0.05, 0.12, 0.03);
    }

    /** 🌲 Forest */
    private buildForest(ctx: AudioContext): void {
        // Leaf rustling
        this.addModulatedLayer(ctx, false, 'bandpass', 2500, 0.3, 0.04, 0.15, 0.02);
        // Gentle stream
        this.addNoiseLayer(ctx, false, 'bandpass', 4500, 1, 0.02);
        // Add bird chirps via oscillators
        this.addBirdChirps(ctx);
    }

    /** Bird chirp oscillators */
    private addBirdChirps(ctx: AudioContext): void {
        const frequencies = [2400, 3200, 1800];
        frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            // Tremolo for chirp effect
            const tremolo = ctx.createOscillator();
            tremolo.type = 'square';
            tremolo.frequency.value = 6 + i * 2;

            const tremoloGain = ctx.createGain();
            tremoloGain.gain.value = 0.01;

            const chirpGain = ctx.createGain();
            chirpGain.gain.value = 0;

            tremolo.connect(tremoloGain);
            tremoloGain.connect(chirpGain.gain);

            osc.connect(chirpGain);
            chirpGain.connect(this.masterGain!);
            osc.start();
            tremolo.start();

            this.activeNodes.push(osc, tremolo, tremoloGain, chirpGain);
        });
    }

    /** 💨 Wind */
    private buildWind(ctx: AudioContext): void {
        // Main wind body with frequency sweep
        this.addModulatedLayer(ctx, true, 'lowpass', 400, 2, 0.2, 0.05, 300, true);
        // Gust volume modulation
        this.addModulatedLayer(ctx, true, 'lowpass', 600, 1, 0.1, 0.03, 0.06);
        // High whistle
        this.addModulatedLayer(ctx, false, 'bandpass', 1200, 3, 0.02, 0.07, 500, true);
    }

    /** Stop current sound */
    private stopCurrent(): void {
        if (this.masterGain && this.audioCtx) {
            const now = this.audioCtx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(0, now + 0.3);
        }

        // Disconnect after fade
        const nodes = [...this.activeNodes];
        this.activeNodes = [];
        setTimeout(() => {
            nodes.forEach(node => {
                try {
                    if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
                        node.stop();
                    }
                    node.disconnect();
                } catch { /* already stopped */ }
            });
        }, 400);
    }

    /** Play the specified ambient sound — MUST be called from click handler on mobile */
    play(sound: SoundType): void {
        // Stop current
        if (this.activeNodes.length > 0) {
            this.stopCurrent();
        }

        this.currentSound = sound;
        if (sound === 'none') return;

        // Small delay after stop to let fade complete
        const delay = this.activeNodes.length > 0 ? 500 : 0;

        setTimeout(() => {
            if (this.currentSound !== sound) return;

            const ctx = this.ensureContext();

            switch (sound) {
                case 'rain': this.buildRain(ctx); break;
                case 'ocean': this.buildOcean(ctx); break;
                case 'forest': this.buildForest(ctx); break;
                case 'wind': this.buildWind(ctx); break;
            }

            // Fade in
            if (this.masterGain) {
                const now = ctx.currentTime;
                this.masterGain.gain.cancelScheduledValues(now);
                this.masterGain.gain.setValueAtTime(0, now);
                this.masterGain.gain.linearRampToValueAtTime(1, now + 1.5);
            }
        }, delay);
    }

    /** Clean up all resources */
    dispose(): void {
        this.stopCurrent();
        this.currentSound = 'none';
        setTimeout(() => {
            if (this.audioCtx && this.audioCtx.state !== 'closed') {
                this.audioCtx.close();
            }
            this.audioCtx = null;
            this.masterGain = null;
        }, 500);
    }
}

// Singleton
let engineInstance: AmbientSoundEngine | null = null;

export function getAmbientSoundEngine(): AmbientSoundEngine {
    if (!engineInstance) {
        engineInstance = new AmbientSoundEngine();
    }
    return engineInstance;
}

export type { SoundType };
