/**
 * Brookvale Dynamic Lighting System
 * 
 * Manages time-of-day lighting transitions for immersive atmosphere.
 * Supports morning, noon, evening, and night cycles with smooth transitions.
 */

export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export interface LightingConfig {
    // Sky colors
    skyTop: string;
    skyBottom: string;

    // Sun/Moon
    sunPosition: [number, number, number];
    sunColor: string;
    sunIntensity: number;

    // Ambient
    ambientColor: string;
    ambientIntensity: number;

    // Directional light (main light source)
    directionalColor: string;
    directionalIntensity: number;

    // Fog
    fogColor: string;
    fogNear: number;
    fogFar: number;

    // Special effects
    starVisibility: number;
    cloudTint: string;
}

// Lighting presets for each time of day
export const LIGHTING_PRESETS: Record<TimeOfDay, LightingConfig> = {
    dawn: {
        skyTop: '#1a1a2e',
        skyBottom: '#ff9a8b',
        sunPosition: [-50, 5, 0],
        sunColor: '#ff6b6b',
        sunIntensity: 0.4,
        ambientColor: '#4a4a6a',
        ambientIntensity: 0.3,
        directionalColor: '#ffa07a',
        directionalIntensity: 0.5,
        fogColor: '#ffb6c1',
        fogNear: 30,
        fogFar: 100,
        starVisibility: 0.3,
        cloudTint: '#ffd4e5',
    },

    morning: {
        skyTop: '#87CEEB',
        skyBottom: '#E0F7FA',
        sunPosition: [-30, 30, 20],
        sunColor: '#fff5e6',
        sunIntensity: 0.8,
        ambientColor: '#b0d4f1',
        ambientIntensity: 0.5,
        directionalColor: '#ffecd2',
        directionalIntensity: 0.9,
        fogColor: '#e8f4f8',
        fogNear: 50,
        fogFar: 150,
        starVisibility: 0,
        cloudTint: '#ffffff',
    },

    noon: {
        skyTop: '#4FC3F7',
        skyBottom: '#B3E5FC',
        sunPosition: [0, 50, 0],
        sunColor: '#ffffff',
        sunIntensity: 1.0,
        ambientColor: '#87ceeb',
        ambientIntensity: 0.6,
        directionalColor: '#ffffff',
        directionalIntensity: 1.2,
        fogColor: '#e0f7fa',
        fogNear: 60,
        fogFar: 200,
        starVisibility: 0,
        cloudTint: '#ffffff',
    },

    afternoon: {
        skyTop: '#64B5F6',
        skyBottom: '#FFF8E1',
        sunPosition: [30, 35, -20],
        sunColor: '#ffdd99',
        sunIntensity: 0.9,
        ambientColor: '#a8d8ea',
        ambientIntensity: 0.5,
        directionalColor: '#ffe4b5',
        directionalIntensity: 1.0,
        fogColor: '#fff8dc',
        fogNear: 50,
        fogFar: 150,
        starVisibility: 0,
        cloudTint: '#fff5e6',
    },

    evening: {
        skyTop: '#2c3e50',
        skyBottom: '#e74c3c',
        sunPosition: [50, 10, -30],
        sunColor: '#ff6b35',
        sunIntensity: 0.7,       // Increased
        ambientColor: '#9070a0', // Brighter purple
        ambientIntensity: 0.55,  // Increased from 0.45
        directionalColor: '#ff7f50',
        directionalIntensity: 0.9, // Increased from 0.8
        fogColor: '#ff9966',
        fogNear: 80,             // Further (was 50)
        fogFar: 300,             // Much further (was 150)
        starVisibility: 0.2,
        cloudTint: '#ffb347',
    },

    night: {
        skyTop: '#1a1a3e',      // Slightly brighter sky
        skyBottom: '#3a3a6e',   // Brighter horizon
        sunPosition: [0, -30, 50],
        sunColor: '#d0e0ff',
        sunIntensity: 0.6,      // Strong moonlight (was 0.4)
        ambientColor: '#6080b0', // Much brighter blue ambient
        ambientIntensity: 0.75,  // Very bright ambient (was 0.5)
        directionalColor: '#c0d0f0',
        directionalIntensity: 0.9, // Strong moon (was 0.6)
        fogColor: '#2a2a4e',    // Brighter fog color
        fogNear: 100,           // Start fog further (was 50)
        fogFar: 400,            // Much further fog (was 150)
        starVisibility: 1.0,
        cloudTint: '#8080b0',   // Brighter clouds
    },
};

// Time mapping (hour to TimeOfDay)
export function getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    return 'night';
}

// Get current time of day based on real time
export function getCurrentTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    return getTimeOfDay(hour);
}

// Linear interpolation helper
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

// Color interpolation (hex to hex)
function lerpColor(colorA: string, colorB: string, t: number): string {
    const parseHex = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        } : { r: 0, g: 0, b: 0 };
    };

    const a = parseHex(colorA);
    const b = parseHex(colorB);

    const r = Math.round(lerp(a.r, b.r, t));
    const g = Math.round(lerp(a.g, b.g, t));
    const bl = Math.round(lerp(a.b, b.b, t));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

// Interpolate between two lighting configs
export function interpolateLighting(
    configA: LightingConfig,
    configB: LightingConfig,
    t: number
): LightingConfig {
    return {
        skyTop: lerpColor(configA.skyTop, configB.skyTop, t),
        skyBottom: lerpColor(configA.skyBottom, configB.skyBottom, t),
        sunPosition: [
            lerp(configA.sunPosition[0], configB.sunPosition[0], t),
            lerp(configA.sunPosition[1], configB.sunPosition[1], t),
            lerp(configA.sunPosition[2], configB.sunPosition[2], t),
        ],
        sunColor: lerpColor(configA.sunColor, configB.sunColor, t),
        sunIntensity: lerp(configA.sunIntensity, configB.sunIntensity, t),
        ambientColor: lerpColor(configA.ambientColor, configB.ambientColor, t),
        ambientIntensity: lerp(configA.ambientIntensity, configB.ambientIntensity, t),
        directionalColor: lerpColor(configA.directionalColor, configB.directionalColor, t),
        directionalIntensity: lerp(configA.directionalIntensity, configB.directionalIntensity, t),
        fogColor: lerpColor(configA.fogColor, configB.fogColor, t),
        fogNear: lerp(configA.fogNear, configB.fogNear, t),
        fogFar: lerp(configA.fogFar, configB.fogFar, t),
        starVisibility: lerp(configA.starVisibility, configB.starVisibility, t),
        cloudTint: lerpColor(configA.cloudTint, configB.cloudTint, t),
    };
}

// Get the next time period for transitions
export function getNextTimeOfDay(current: TimeOfDay): TimeOfDay {
    const order: TimeOfDay[] = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night'];
    const index = order.indexOf(current);
    return order[(index + 1) % order.length];
}

// Calculate transition progress within current time period
export function getTransitionProgress(hour: number, minute: number): { current: TimeOfDay; next: TimeOfDay; progress: number } {
    const totalMinutes = hour * 60 + minute;

    // Define time ranges (in minutes from midnight)
    const ranges: { time: TimeOfDay; start: number; end: number }[] = [
        { time: 'night', start: 0, end: 300 },      // 00:00 - 05:00
        { time: 'dawn', start: 300, end: 420 },     // 05:00 - 07:00
        { time: 'morning', start: 420, end: 660 },  // 07:00 - 11:00
        { time: 'noon', start: 660, end: 840 },     // 11:00 - 14:00
        { time: 'afternoon', start: 840, end: 1020 }, // 14:00 - 17:00
        { time: 'evening', start: 1020, end: 1200 }, // 17:00 - 20:00
        { time: 'night', start: 1200, end: 1440 },  // 20:00 - 24:00
    ];

    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        if (totalMinutes >= range.start && totalMinutes < range.end) {
            const duration = range.end - range.start;
            const elapsed = totalMinutes - range.start;
            const progress = elapsed / duration;

            const nextRange = ranges[(i + 1) % ranges.length];

            return {
                current: range.time,
                next: nextRange.time,
                progress: progress,
            };
        }
    }

    return { current: 'noon', next: 'afternoon', progress: 0 };
}

// Demo mode: accelerated time cycle
export class DemoTimeController {
    private startTime: number;
    private speedMultiplier: number;

    constructor(speedMultiplier: number = 60) {
        // 60x means 1 real minute = 1 game hour
        this.startTime = Date.now();
        this.speedMultiplier = speedMultiplier;
    }

    getSimulatedTime(): { hour: number; minute: number } {
        const elapsed = (Date.now() - this.startTime) / 1000; // seconds
        const simulatedMinutes = (elapsed * this.speedMultiplier) % (24 * 60);

        return {
            hour: Math.floor(simulatedMinutes / 60),
            minute: Math.floor(simulatedMinutes % 60),
        };
    }

    getTimeOfDay(): TimeOfDay {
        const { hour } = this.getSimulatedTime();
        return getTimeOfDay(hour);
    }

    getLighting(): LightingConfig {
        const { hour, minute } = this.getSimulatedTime();
        const { current, next, progress } = getTransitionProgress(hour, minute);

        const currentConfig = LIGHTING_PRESETS[current];
        const nextConfig = LIGHTING_PRESETS[next];

        // Smooth easing for transitions
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        return interpolateLighting(currentConfig, nextConfig, eased);
    }

    setSpeed(multiplier: number): void {
        this.speedMultiplier = multiplier;
    }
}

// Singleton demo controller
let demoController: DemoTimeController | null = null;

export function getDemoTimeController(): DemoTimeController {
    if (!demoController) {
        demoController = new DemoTimeController(30); // 8 minutes = 1 full day cycle (slower)
    }
    return demoController;
}

export function resetDemoTime(): void {
    demoController = new DemoTimeController(30);
}
