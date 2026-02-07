/**
 * Brookvale Sound Manager
 * 
 * Manages ambient ASMR sounds and UI sound effects for the healing experience.
 * Uses Web Audio API for advanced control and smooth transitions.
 */

// Sound types
export type AmbientSound = 'stream' | 'birds' | 'wind' | 'rain' | 'night';
export type UISound = 'click' | 'success' | 'reward' | 'levelUp' | 'quest' | 'pop' | 'whoosh';
export type ZoneAmbient = 'forest' | 'town' | 'lake' | 'hill' | 'cloud';

interface AudioState {
    context: AudioContext | null;
    masterGain: GainNode | null;
    ambientGain: GainNode | null;
    uiGain: GainNode | null;
    ambientSources: Map<string, { source: AudioBufferSourceNode; gain: GainNode }>;
    audioBuffers: Map<string, AudioBuffer>;
    isInitialized: boolean;
    isMuted: boolean;
    masterVolume: number;
    ambientVolume: number;
    uiVolume: number;
}

// Singleton state
const audioState: AudioState = {
    context: null,
    masterGain: null,
    ambientGain: null,
    uiGain: null,
    ambientSources: new Map(),
    audioBuffers: new Map(),
    isInitialized: false,
    isMuted: false,
    masterVolume: 0.7,
    ambientVolume: 0.5,
    uiVolume: 0.8,
};

// Zone ambient configurations
const ZONE_AMBIENT_CONFIG: Record<ZoneAmbient, { sounds: AmbientSound[]; volumes: number[] }> = {
    forest: { sounds: ['stream', 'birds'], volumes: [0.6, 0.4] },
    town: { sounds: ['birds', 'wind'], volumes: [0.3, 0.3] },
    lake: { sounds: ['stream', 'wind'], volumes: [0.7, 0.3] },
    hill: { sounds: ['night', 'wind'], volumes: [0.5, 0.2] },
    cloud: { sounds: ['wind'], volumes: [0.4] },
};

/**
 * Initialize the audio context (must be called from user interaction)
 */
export async function initializeAudio(): Promise<boolean> {
    if (audioState.isInitialized) return true;

    try {
        // Create audio context
        audioState.context = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        // Create gain nodes for mixing
        audioState.masterGain = audioState.context.createGain();
        audioState.ambientGain = audioState.context.createGain();
        audioState.uiGain = audioState.context.createGain();

        // Connect nodes: source -> specific gain -> master gain -> destination
        audioState.ambientGain.connect(audioState.masterGain);
        audioState.uiGain.connect(audioState.masterGain);
        audioState.masterGain.connect(audioState.context.destination);

        // Set initial volumes
        audioState.masterGain.gain.value = audioState.masterVolume;
        audioState.ambientGain.gain.value = audioState.ambientVolume;
        audioState.uiGain.gain.value = audioState.uiVolume;

        // Preload commonly used sounds
        await preloadSounds(['click', 'success', 'pop']);

        audioState.isInitialized = true;
        console.log('🎵 Brookvale Sound System initialized');
        return true;
    } catch (error) {
        console.error('Failed to initialize audio:', error);
        return false;
    }
}

/**
 * Generate procedural ambient sounds using Web Audio API
 */
function generateProceduralSound(type: AmbientSound, duration: number = 10): AudioBuffer | null {
    if (!audioState.context) return null;

    const sampleRate = audioState.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = audioState.context.createBuffer(2, length, sampleRate);

    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    switch (type) {
        case 'stream': {
            // Water stream - pink noise with modulation
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                // Pink noise approximation with water-like modulation
                const noise = (Math.random() * 2 - 1) * 0.3;
                const modulation = Math.sin(t * 0.5) * 0.3 + Math.sin(t * 1.3) * 0.2;
                const value = noise * (0.5 + modulation * 0.5) * 0.4;
                leftChannel[i] = value * (0.9 + Math.random() * 0.2);
                rightChannel[i] = value * (0.9 + Math.random() * 0.2);
            }
            break;
        }

        case 'birds': {
            // Bird chirps - occasional sine wave chirps
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                let value = 0;

                // Random chirps
                const chirpInterval = 2 + Math.random() * 3;
                const chirpPhase = (t % chirpInterval) / chirpInterval;

                if (chirpPhase < 0.05 && Math.random() > 0.98) {
                    const freq = 2000 + Math.random() * 2000;
                    const envelope = Math.sin(chirpPhase * Math.PI / 0.05);
                    value = Math.sin(t * freq * Math.PI * 2) * envelope * 0.15;
                }

                leftChannel[i] = value * (0.7 + Math.sin(t * 2) * 0.3);
                rightChannel[i] = value * (0.8 + Math.cos(t * 2.3) * 0.2);
            }
            break;
        }

        case 'wind': {
            // Wind - filtered noise with slow modulation
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0;
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const white = Math.random() * 2 - 1;

                // Brown noise filter
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;

                const brownNoise = (b0 + b1 + b2 + b3 + b4) * 0.05;
                const modulation = Math.sin(t * 0.3) * 0.4 + 0.6;

                leftChannel[i] = brownNoise * modulation * 0.3;
                rightChannel[i] = brownNoise * modulation * 0.3 * (1 + Math.sin(t * 0.1) * 0.2);
            }
            break;
        }

        case 'night': {
            // Night ambience - crickets and subtle wind
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                let value = 0;

                // Cricket chirps
                const cricketFreq = 4000;
                const cricketMod = Math.sin(t * 20) > 0.9 ? 1 : 0;
                value += Math.sin(t * cricketFreq * Math.PI * 2) * cricketMod * 0.05;

                // Subtle background  
                value += (Math.random() * 2 - 1) * 0.02;

                leftChannel[i] = value;
                rightChannel[i] = value * 0.95;
            }
            break;
        }

        case 'rain': {
            // Rain - white noise with drops
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                let value = (Math.random() * 2 - 1) * 0.15;

                // Occasional drops
                if (Math.random() > 0.9999) {
                    value += Math.sin(t * 5000) * 0.3 * Math.exp(-((i % 100) / 20));
                }

                leftChannel[i] = value;
                rightChannel[i] = value * (0.9 + Math.random() * 0.2);
            }
            break;
        }
    }

    return buffer;
}

/**
 * Generate UI sound effects
 */
function generateUISound(type: UISound): AudioBuffer | null {
    if (!audioState.context) return null;

    const sampleRate = audioState.context.sampleRate;
    let duration = 0.3;

    switch (type) {
        case 'levelUp': duration = 1.0; break;
        case 'quest': duration = 0.8; break;
        case 'reward': duration = 0.6; break;
        default: duration = 0.2;
    }

    const length = Math.floor(sampleRate * duration);
    const buffer = audioState.context.createBuffer(2, length, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    switch (type) {
        case 'click': {
            // Soft click - short sine wave
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-t * 30);
                const value = Math.sin(t * 800 * Math.PI * 2) * envelope * 0.3;
                leftChannel[i] = value;
                rightChannel[i] = value;
            }
            break;
        }

        case 'success': {
            // Success chime - ascending notes
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const note1 = t < 0.1 ? Math.sin(t * 523 * Math.PI * 2) * Math.exp(-t * 15) : 0;
                const note2 = t > 0.08 && t < 0.2 ? Math.sin((t - 0.08) * 659 * Math.PI * 2) * Math.exp(-(t - 0.08) * 12) : 0;
                const note3 = t > 0.15 ? Math.sin((t - 0.15) * 784 * Math.PI * 2) * Math.exp(-(t - 0.15) * 8) : 0;
                const value = (note1 + note2 + note3) * 0.25;
                leftChannel[i] = value;
                rightChannel[i] = value;
            }
            break;
        }

        case 'reward': {
            // Coin/reward sound - bright ping with sparkle
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-t * 8);
                const freq1 = 1400;
                const freq2 = 1800;
                const value = (Math.sin(t * freq1 * Math.PI * 2) + Math.sin(t * freq2 * Math.PI * 2) * 0.5) * envelope * 0.2;
                leftChannel[i] = value;
                rightChannel[i] = value;
            }
            break;
        }

        case 'levelUp': {
            // Level up fanfare
            const notes = [523, 659, 784, 1047]; // C, E, G, C (octave)
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                let value = 0;

                notes.forEach((freq, idx) => {
                    const start = idx * 0.2;
                    const localT = t - start;
                    if (localT > 0 && localT < 0.5) {
                        value += Math.sin(localT * freq * Math.PI * 2) * Math.exp(-localT * 4) * 0.15;
                    }
                });

                leftChannel[i] = value;
                rightChannel[i] = value;
            }
            break;
        }

        case 'quest': {
            // Quest notification - mystical chime
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const envelope = t < 0.1 ? t * 10 : Math.exp(-(t - 0.1) * 3);
                const freq = 880 + Math.sin(t * 10) * 50;
                const value = Math.sin(t * freq * Math.PI * 2) * envelope * 0.2;
                leftChannel[i] = value;
                rightChannel[i] = value;
            }
            break;
        }

        case 'pop': {
            // Soft pop for UI interactions
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-t * 40);
                const value = Math.sin(t * 600 * Math.PI * 2) * envelope * 0.25;
                leftChannel[i] = value;
                rightChannel[i] = value;
            }
            break;
        }

        case 'whoosh': {
            // Whoosh for transitions
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const noise = (Math.random() * 2 - 1);
                const envelope = Math.sin(t / duration * Math.PI);
                const value = noise * envelope * 0.15;
                leftChannel[i] = value;
                rightChannel[i] = value * (1 + Math.sin(t * 50) * 0.3);
            }
            break;
        }
    }

    return buffer;
}

/**
 * Preload sounds into buffer cache
 */
async function preloadSounds(sounds: UISound[]): Promise<void> {
    for (const sound of sounds) {
        if (!audioState.audioBuffers.has(sound)) {
            const buffer = generateUISound(sound);
            if (buffer) {
                audioState.audioBuffers.set(sound, buffer);
            }
        }
    }
}

/**
 * Play a UI sound effect
 */
export function playUISound(type: UISound): void {
    if (!audioState.isInitialized || audioState.isMuted || !audioState.context || !audioState.uiGain) return;

    // Resume context if suspended
    if (audioState.context.state === 'suspended') {
        audioState.context.resume();
    }

    let buffer = audioState.audioBuffers.get(type);
    if (!buffer) {
        buffer = generateUISound(type) || undefined;
        if (buffer) {
            audioState.audioBuffers.set(type, buffer);
        }
    }

    if (buffer) {
        const source = audioState.context.createBufferSource();
        source.buffer = buffer;
        source.connect(audioState.uiGain);
        source.start();
    }
}

/**
 * Start ambient sounds for a zone
 */
export function startZoneAmbient(zone: ZoneAmbient, fadeIn: number = 2): void {
    if (!audioState.isInitialized || !audioState.context || !audioState.ambientGain) return;

    // Resume context if suspended
    if (audioState.context.state === 'suspended') {
        audioState.context.resume();
    }

    const config = ZONE_AMBIENT_CONFIG[zone];

    // Stop existing ambient sounds first
    stopAllAmbient(1);

    // Start new ambient sounds after fade out
    setTimeout(() => {
        config.sounds.forEach((soundType, index) => {
            const buffer = generateProceduralSound(soundType, 10);
            if (buffer && audioState.context && audioState.ambientGain) {
                const source = audioState.context.createBufferSource();
                const gainNode = audioState.context.createGain();

                source.buffer = buffer;
                source.loop = true;
                source.connect(gainNode);
                gainNode.connect(audioState.ambientGain);

                // Fade in
                gainNode.gain.value = 0;
                gainNode.gain.linearRampToValueAtTime(
                    config.volumes[index],
                    audioState.context.currentTime + fadeIn
                );

                source.start();
                audioState.ambientSources.set(`${zone}_${soundType}`, { source, gain: gainNode });
            }
        });

        console.log(`🎵 Zone ambient started: ${zone}`);
    }, 1000);
}

/**
 * Stop all ambient sounds
 */
export function stopAllAmbient(fadeOut: number = 1): void {
    if (!audioState.context) return;

    const currentTime = audioState.context.currentTime;

    audioState.ambientSources.forEach(({ source, gain }) => {
        gain.gain.linearRampToValueAtTime(0, currentTime + fadeOut);
        setTimeout(() => {
            try {
                source.stop();
            } catch {
                // Source might already be stopped
            }
        }, fadeOut * 1000 + 100);
    });

    audioState.ambientSources.clear();
}

/**
 * Set master volume (0-1)
 */
export function setMasterVolume(volume: number): void {
    audioState.masterVolume = Math.max(0, Math.min(1, volume));
    if (audioState.masterGain) {
        audioState.masterGain.gain.value = audioState.masterVolume;
    }
}

/**
 * Set ambient volume (0-1)
 */
export function setAmbientVolume(volume: number): void {
    audioState.ambientVolume = Math.max(0, Math.min(1, volume));
    if (audioState.ambientGain) {
        audioState.ambientGain.gain.value = audioState.ambientVolume;
    }
}

/**
 * Set UI volume (0-1)
 */
export function setUIVolume(volume: number): void {
    audioState.uiVolume = Math.max(0, Math.min(1, volume));
    if (audioState.uiGain) {
        audioState.uiGain.gain.value = audioState.uiVolume;
    }
}

/**
 * Toggle mute
 */
export function toggleMute(): boolean {
    audioState.isMuted = !audioState.isMuted;
    if (audioState.masterGain) {
        audioState.masterGain.gain.value = audioState.isMuted ? 0 : audioState.masterVolume;
    }
    return audioState.isMuted;
}

/**
 * Get current audio state
 */
export function getAudioState() {
    return {
        isInitialized: audioState.isInitialized,
        isMuted: audioState.isMuted,
        masterVolume: audioState.masterVolume,
        ambientVolume: audioState.ambientVolume,
        uiVolume: audioState.uiVolume,
    };
}

/**
 * Cleanup audio resources
 */
export function cleanupAudio(): void {
    stopAllAmbient(0);

    if (audioState.context) {
        audioState.context.close();
    }

    audioState.context = null;
    audioState.masterGain = null;
    audioState.ambientGain = null;
    audioState.uiGain = null;
    audioState.audioBuffers.clear();
    audioState.isInitialized = false;

    console.log('🎵 Brookvale Sound System cleaned up');
}
