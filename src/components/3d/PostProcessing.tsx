'use client';

import { useMemo } from 'react';
import {
    EffectComposer,
    Bloom,
    Vignette,
    ChromaticAberration,
    DepthOfField,
    ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, KernelSize } from 'postprocessing';
import * as THREE from 'three';

// ==================== PERFORMANCE-AWARE POST-PROCESSING ====================
// Adapts visual effects based on device tier (high/medium/low)

interface PostProcessingProps {
    /** Performance level: 'high' | 'medium' | 'low' */
    performanceLevel?: string;
    /** Enable/disable bloom glow on emissive objects */
    enableBloom?: boolean;
    /** Enable/disable tilt-shift (depth of field) for miniature effect */
    enableTiltShift?: boolean;
    /** Enable/disable screen edge vignette */
    enableVignette?: boolean;
    /** Enable/disable chromatic aberration at edges */
    enableChromaticAberration?: boolean;
    /** Master intensity multiplier (0.0 - 1.0) */
    intensity?: number;
}

// ==================== HIGH QUALITY COMPOSITOR ====================
// All effects enabled — Bloom + Tilt-Shift + Vignette + Chromatic Aberration + Tone Mapping
function HighQualityCompositor({ intensity = 1.0 }: { intensity: number }) {
    const caOffset = useMemo(
        () => new THREE.Vector2(0.0008 * intensity, 0.0008 * intensity),
        [intensity]
    );

    return (
        <EffectComposer multisampling={4}>
            <Bloom
                intensity={0.8 * intensity}
                luminanceThreshold={0.6}
                luminanceSmoothing={0.4}
                kernelSize={KernelSize.LARGE}
                mipmapBlur={true}
            />
            <DepthOfField
                focusDistance={0.02}
                focalLength={0.035}
                bokehScale={3.5 * intensity}
            />
            <Vignette
                offset={0.25}
                darkness={0.5 * intensity}
                blendFunction={BlendFunction.NORMAL}
            />
            <ChromaticAberration
                offset={caOffset}
                blendFunction={BlendFunction.NORMAL}
                radialModulation={true}
                modulationOffset={0.5}
            />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
    );
}

// ==================== MEDIUM QUALITY COMPOSITOR ====================
// Bloom + Vignette + Tone Mapping (no DOF or CA for performance)
function MediumQualityCompositor({ intensity = 1.0 }: { intensity: number }) {
    return (
        <EffectComposer multisampling={0}>
            <Bloom
                intensity={0.5 * intensity}
                luminanceThreshold={0.7}
                luminanceSmoothing={0.5}
                kernelSize={KernelSize.MEDIUM}
                mipmapBlur={true}
            />
            <Vignette
                offset={0.3}
                darkness={0.4 * intensity}
                blendFunction={BlendFunction.NORMAL}
            />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
    );
}

// ==================== BLOOM ONLY COMPOSITOR ====================
// Minimal — just bloom glow for emissive objects
function BloomOnlyCompositor({ intensity = 1.0 }: { intensity: number }) {
    return (
        <EffectComposer multisampling={0}>
            <Bloom
                intensity={0.4 * intensity}
                luminanceThreshold={0.75}
                luminanceSmoothing={0.6}
                kernelSize={KernelSize.SMALL}
                mipmapBlur={true}
            />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
    );
}

// ==================== MAIN POST-PROCESSING COMPONENT ====================
export function PostProcessingEffects({
    performanceLevel = 'high',
    enableBloom = true,
    enableTiltShift = true,
    enableVignette = true,
    enableChromaticAberration = true,
    intensity = 1.0,
}: PostProcessingProps) {
    // Skip all post-processing on low-end devices for performance
    if (performanceLevel === 'low') {
        return null;
    }

    // Full cinematic experience
    if (performanceLevel === 'high' && enableBloom && enableTiltShift && enableVignette) {
        return <HighQualityCompositor intensity={intensity} />;
    }

    // Medium — bloom + vignette only
    if (performanceLevel === 'medium' || (performanceLevel === 'high' && !enableTiltShift)) {
        if (enableBloom && enableVignette) {
            return <MediumQualityCompositor intensity={intensity} />;
        }
    }

    // Fallback — bloom only
    if (enableBloom) {
        return <BloomOnlyCompositor intensity={intensity} />;
    }

    return null;
}

// ==================== PRESET CONFIGURATIONS ====================
// Ready-made presets for different visual moods

/** Dreamy, soft-focus preset — perfect for healing/wellness apps */
export const PRESET_DREAMY: Partial<PostProcessingProps> = {
    enableBloom: true,
    enableTiltShift: true,
    enableVignette: true,
    enableChromaticAberration: false,
    intensity: 1.2,
};

/** Crisp, clean preset — minimal effects for clarity */
export const PRESET_CLEAN: Partial<PostProcessingProps> = {
    enableBloom: true,
    enableTiltShift: false,
    enableVignette: true,
    enableChromaticAberration: false,
    intensity: 0.6,
};

/** Cinematic preset — full effects for maximum visual impact */
export const PRESET_CINEMATIC: Partial<PostProcessingProps> = {
    enableBloom: true,
    enableTiltShift: true,
    enableVignette: true,
    enableChromaticAberration: true,
    intensity: 1.0,
};

/** Performance-safe preset — only essential effects */
export const PRESET_PERFORMANCE: Partial<PostProcessingProps> = {
    enableBloom: true,
    enableTiltShift: false,
    enableVignette: false,
    enableChromaticAberration: false,
    intensity: 0.4,
};
