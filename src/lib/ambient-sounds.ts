/**
 * 🎵 Brookvale Ambient Sound Engine
 * 
 * Procedurally generated ambient sounds using Web Audio API.
 * No external audio files needed — all sounds are synthesized.
 */

type SoundType = 'rain' | 'ocean' | 'forest' | 'wind' | 'none';

class AmbientSoundEngine {
    private audioCtx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private activeNodes: AudioNode[] = [];
    private currentSound: SoundType = 'none';
    private isPlaying = false;

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

    /** Create white noise buffer */
    private createNoiseBuffer(ctx: AudioContext, duration = 2): AudioBuffer {
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        }
        return buffer;
    }

    /** Create brown noise (darker, warmer) */
    private createBrownNoiseBuffer(ctx: AudioContext, duration = 2): AudioBuffer {
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            let lastOut = 0;
            for (let i = 0; i < length; i++) {
                const white = Math.random() * 2 - 1;
                lastOut = (lastOut + (0.02 * white)) / 1.02;
                data[i] = lastOut * 3.5;
            }
        }
        return buffer;
    }

    /** 🌧️ Rain sound: filtered white noise with drip variations */
    private createRain(ctx: AudioContext): void {
        // Main rain layer - broadband noise
        const noiseBuffer = this.createNoiseBuffer(ctx, 4);
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const hiPass = ctx.createBiquadFilter();
        hiPass.type = 'highpass';
        hiPass.frequency.value = 4000;
        hiPass.Q.value = 0.5;

        const loPass = ctx.createBiquadFilter();
        loPass.type = 'lowpass';
        loPass.frequency.value = 12000;

        const rainGain = ctx.createGain();
        rainGain.gain.value = 0.15;

        noise.connect(hiPass);
        hiPass.connect(loPass);
        loPass.connect(rainGain);
        rainGain.connect(this.masterGain!);
        noise.start();

        this.activeNodes.push(noise, hiPass, loPass, rainGain);

        // Heavy rain layer - lower frequency
        const heavyBuffer = this.createBrownNoiseBuffer(ctx, 3);
        const heavy = ctx.createBufferSource();
        heavy.buffer = heavyBuffer;
        heavy.loop = true;

        const heavyFilter = ctx.createBiquadFilter();
        heavyFilter.type = 'bandpass';
        heavyFilter.frequency.value = 800;
        heavyFilter.Q.value = 0.3;

        const heavyGain = ctx.createGain();
        heavyGain.gain.value = 0.08;

        heavy.connect(heavyFilter);
        heavyFilter.connect(heavyGain);
        heavyGain.connect(this.masterGain!);
        heavy.start();

        this.activeNodes.push(heavy, heavyFilter, heavyGain);

        // Drip texture layer
        const dripBuffer = this.createNoiseBuffer(ctx, 2);
        const drip = ctx.createBufferSource();
        drip.buffer = dripBuffer;
        drip.loop = true;

        const dripBand = ctx.createBiquadFilter();
        dripBand.type = 'bandpass';
        dripBand.frequency.value = 6000;
        dripBand.Q.value = 2;

        // LFO to modulate drips
        const dripLFO = ctx.createOscillator();
        dripLFO.type = 'sine';
        dripLFO.frequency.value = 3;
        const dripLFOGain = ctx.createGain();
        dripLFOGain.gain.value = 0.04;

        dripLFO.connect(dripLFOGain);
        drip.connect(dripBand);
        dripBand.connect(dripLFOGain);
        dripLFOGain.connect(this.masterGain!);
        drip.start();
        dripLFO.start();

        this.activeNodes.push(drip, dripBand, dripLFO, dripLFOGain);
    }

    /** 🌊 Ocean waves: slow modulated noise */
    private createOcean(ctx: AudioContext): void {
        // Wave base
        const noiseBuffer = this.createBrownNoiseBuffer(ctx, 4);
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const waveFilter = ctx.createBiquadFilter();
        waveFilter.type = 'lowpass';
        waveFilter.frequency.value = 600;
        waveFilter.Q.value = 1;

        const waveGain = ctx.createGain();
        waveGain.gain.value = 0.25;

        // Slow LFO for wave rhythm (0.08 Hz ≈ one wave every 12 seconds)
        const waveLFO = ctx.createOscillator();
        waveLFO.type = 'sine';
        waveLFO.frequency.value = 0.08;

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.15;

        waveLFO.connect(lfoGain);
        lfoGain.connect(waveGain.gain);

        noise.connect(waveFilter);
        waveFilter.connect(waveGain);
        waveGain.connect(this.masterGain!);
        noise.start();
        waveLFO.start();

        this.activeNodes.push(noise, waveFilter, waveGain, waveLFO, lfoGain);

        // Surf/foam layer - higher frequency swoosh
        const foamBuffer = this.createNoiseBuffer(ctx, 3);
        const foam = ctx.createBufferSource();
        foam.buffer = foamBuffer;
        foam.loop = true;

        const foamFilter = ctx.createBiquadFilter();
        foamFilter.type = 'bandpass';
        foamFilter.frequency.value = 3000;
        foamFilter.Q.value = 0.5;

        const foamGain = ctx.createGain();
        foamGain.gain.value = 0.06;

        // Faster LFO for foam
        const foamLFO = ctx.createOscillator();
        foamLFO.type = 'sine';
        foamLFO.frequency.value = 0.12;

        const foamLFOGain = ctx.createGain();
        foamLFOGain.gain.value = 0.04;

        foamLFO.connect(foamLFOGain);
        foamLFOGain.connect(foamGain.gain);

        foam.connect(foamFilter);
        foamFilter.connect(foamGain);
        foamGain.connect(this.masterGain!);
        foam.start();
        foamLFO.start();

        this.activeNodes.push(foam, foamFilter, foamGain, foamLFO, foamLFOGain);
    }

    /** 🌲 Forest: gentle noise with bird-like chirps */
    private createForest(ctx: AudioContext): void {
        // Ambient rustling
        const rustleBuffer = this.createNoiseBuffer(ctx, 4);
        const rustle = ctx.createBufferSource();
        rustle.buffer = rustleBuffer;
        rustle.loop = true;

        const rustleFilter = ctx.createBiquadFilter();
        rustleFilter.type = 'bandpass';
        rustleFilter.frequency.value = 2000;
        rustleFilter.Q.value = 0.3;

        const rustleGain = ctx.createGain();
        rustleGain.gain.value = 0.04;

        // Slow modulation for wind through trees
        const treeLFO = ctx.createOscillator();
        treeLFO.type = 'sine';
        treeLFO.frequency.value = 0.15;
        const treeLFOGain = ctx.createGain();
        treeLFOGain.gain.value = 0.02;

        treeLFO.connect(treeLFOGain);
        treeLFOGain.connect(rustleGain.gain);

        rustle.connect(rustleFilter);
        rustleFilter.connect(rustleGain);
        rustleGain.connect(this.masterGain!);
        rustle.start();
        treeLFO.start();

        this.activeNodes.push(rustle, rustleFilter, rustleGain, treeLFO, treeLFOGain);

        // Bird chirps using oscillators
        const createBirdChirp = (baseFreq: number, delay: number, interval: number) => {
            const chirpOsc = ctx.createOscillator();
            chirpOsc.type = 'sine';
            chirpOsc.frequency.value = baseFreq;

            // Vibrato for natural bird sound
            const vibrato = ctx.createOscillator();
            vibrato.type = 'sine';
            vibrato.frequency.value = 8 + Math.random() * 4;
            const vibratoGain = ctx.createGain();
            vibratoGain.gain.value = baseFreq * 0.05;
            vibrato.connect(vibratoGain);
            vibratoGain.connect(chirpOsc.frequency);

            // Amplitude modulation for chirp pattern
            const ampLFO = ctx.createOscillator();
            ampLFO.type = 'square';
            ampLFO.frequency.value = 1.5 + Math.random();

            const ampGain = ctx.createGain();
            ampGain.gain.value = 0.012;

            const chirpGain = ctx.createGain();
            chirpGain.gain.value = 0;

            ampLFO.connect(ampGain);
            ampGain.connect(chirpGain.gain);

            chirpOsc.connect(chirpGain);
            chirpGain.connect(this.masterGain!);

            // Schedule chirps at intervals
            const now = ctx.currentTime;
            chirpOsc.start(now + delay);
            vibrato.start(now + delay);
            ampLFO.start(now + delay);

            // Create intermittent chirping pattern
            const scheduleChirps = () => {
                if (!this.isPlaying) return;
                const t = ctx.currentTime;
                chirpGain.gain.setValueAtTime(0, t);
                chirpGain.gain.linearRampToValueAtTime(0.015, t + 0.05);
                chirpGain.gain.setValueAtTime(0.015, t + 0.3 + Math.random() * 0.5);
                chirpGain.gain.linearRampToValueAtTime(0, t + 0.5 + Math.random() * 0.3);
                setTimeout(scheduleChirps, interval * 1000);
            };
            setTimeout(scheduleChirps, delay * 1000);

            this.activeNodes.push(chirpOsc, vibrato, vibratoGain, ampLFO, ampGain, chirpGain);
        };

        // Multiple birds at different frequencies and timings
        createBirdChirp(2400, 0.5, 3 + Math.random() * 4);
        createBirdChirp(3200, 1.5, 5 + Math.random() * 5);
        createBirdChirp(1800, 3, 7 + Math.random() * 6);

        // Gentle stream layer
        const streamBuffer = this.createNoiseBuffer(ctx, 2);
        const stream = ctx.createBufferSource();
        stream.buffer = streamBuffer;
        stream.loop = true;

        const streamFilter = ctx.createBiquadFilter();
        streamFilter.type = 'bandpass';
        streamFilter.frequency.value = 4000;
        streamFilter.Q.value = 1;

        const streamGain = ctx.createGain();
        streamGain.gain.value = 0.02;

        stream.connect(streamFilter);
        streamFilter.connect(streamGain);
        streamGain.connect(this.masterGain!);
        stream.start();

        this.activeNodes.push(stream, streamFilter, streamGain);
    }

    /** 💨 Wind: slowly modulated filtered noise */
    private createWind(ctx: AudioContext): void {
        // Main wind
        const windBuffer = this.createBrownNoiseBuffer(ctx, 4);
        const wind = ctx.createBufferSource();
        wind.buffer = windBuffer;
        wind.loop = true;

        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.value = 400;
        windFilter.Q.value = 2;

        // Slow sweeping LFO for wind gusts
        const windLFO = ctx.createOscillator();
        windLFO.type = 'sine';
        windLFO.frequency.value = 0.05;
        const windLFOGain = ctx.createGain();
        windLFOGain.gain.value = 300;
        windLFO.connect(windLFOGain);
        windLFOGain.connect(windFilter.frequency);

        const windGain = ctx.createGain();
        windGain.gain.value = 0.2;

        // Volume modulation for gusts
        const gustLFO = ctx.createOscillator();
        gustLFO.type = 'sine';
        gustLFO.frequency.value = 0.03;
        const gustLFOGain = ctx.createGain();
        gustLFOGain.gain.value = 0.1;
        gustLFO.connect(gustLFOGain);
        gustLFOGain.connect(windGain.gain);

        wind.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(this.masterGain!);
        wind.start();
        windLFO.start();
        gustLFO.start();

        this.activeNodes.push(wind, windFilter, windGain, windLFO, windLFOGain, gustLFO, gustLFOGain);

        // Higher whistling layer
        const whistleBuffer = this.createNoiseBuffer(ctx, 3);
        const whistle = ctx.createBufferSource();
        whistle.buffer = whistleBuffer;
        whistle.loop = true;

        const whistleFilter = ctx.createBiquadFilter();
        whistleFilter.type = 'bandpass';
        whistleFilter.frequency.value = 1200;
        whistleFilter.Q.value = 3;

        // Sweep the whistle frequency
        const whistleLFO = ctx.createOscillator();
        whistleLFO.type = 'sine';
        whistleLFO.frequency.value = 0.07;
        const whistleLFOGain = ctx.createGain();
        whistleLFOGain.gain.value = 500;
        whistleLFO.connect(whistleLFOGain);
        whistleLFOGain.connect(whistleFilter.frequency);

        const whistleGain = ctx.createGain();
        whistleGain.gain.value = 0.02;

        whistle.connect(whistleFilter);
        whistleFilter.connect(whistleGain);
        whistleGain.connect(this.masterGain!);
        whistle.start();
        whistleLFO.start();

        this.activeNodes.push(whistle, whistleFilter, whistleGain, whistleLFO, whistleLFOGain);
    }

    /** Stop all currently playing sounds */
    private stopAll(): void {
        this.isPlaying = false;

        // Fade out
        if (this.masterGain && this.audioCtx) {
            const now = this.audioCtx.currentTime;
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
        }

        // Stop and disconnect after fade
        setTimeout(() => {
            this.activeNodes.forEach(node => {
                try {
                    if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
                        node.stop();
                    }
                    node.disconnect();
                } catch {
                    // Already stopped
                }
            });
            this.activeNodes = [];
        }, 600);
    }

    /** Play the specified ambient sound */
    play(sound: SoundType): void {
        // Stop current sound first
        if (this.currentSound !== 'none') {
            this.stopAll();
        }

        this.currentSound = sound;

        if (sound === 'none') return;

        // Small delay to let fade-out complete
        setTimeout(() => {
            if (this.currentSound !== sound) return; // User changed sound during delay

            const ctx = this.getContext();
            this.isPlaying = true;

            switch (sound) {
                case 'rain': this.createRain(ctx); break;
                case 'ocean': this.createOcean(ctx); break;
                case 'forest': this.createForest(ctx); break;
                case 'wind': this.createWind(ctx); break;
            }

            // Fade in
            if (this.masterGain) {
                const now = ctx.currentTime;
                this.masterGain.gain.setValueAtTime(0, now);
                this.masterGain.gain.linearRampToValueAtTime(1, now + 1.5);
            }
        }, this.activeNodes.length > 0 ? 700 : 0);
    }

    /** Clean up all resources */
    dispose(): void {
        this.stopAll();
        setTimeout(() => {
            if (this.audioCtx) {
                this.audioCtx.close();
                this.audioCtx = null;
                this.masterGain = null;
            }
        }, 700);
    }

    /** Get currently playing sound */
    getCurrent(): SoundType {
        return this.currentSound;
    }
}

// Singleton instance
let engineInstance: AmbientSoundEngine | null = null;

export function getAmbientSoundEngine(): AmbientSoundEngine {
    if (!engineInstance) {
        engineInstance = new AmbientSoundEngine();
    }
    return engineInstance;
}

export type { SoundType };
