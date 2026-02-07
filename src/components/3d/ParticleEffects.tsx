'use client';

import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ==================== PARTICLE TYPES ====================
export type ParticleEffectType =
    | 'acorn_burst'      // 도토리 획득
    | 'level_up'         // 레벨업 축하
    | 'quest_complete'   // 퀘스트 완료
    | 'magic_sparkle'    // 마법 반짝임
    | 'confetti'         // 축하 컨페티
    | 'heal'             // 힐링 효과
    | 'speed_boost'      // 스피드 부스트
    | 'star_burst';      // 별 터짐

interface ParticleConfig {
    count: number;
    color: THREE.Color | THREE.Color[];
    size: number;
    lifetime: number;
    velocity: THREE.Vector3;
    gravity: number;
    spread: number;
    fade: boolean;
    rotate: boolean;
    texture?: string;
}

// ==================== PARTICLE PRESETS ====================
const PARTICLE_PRESETS: Record<ParticleEffectType, ParticleConfig> = {
    acorn_burst: {
        count: 30,
        color: [new THREE.Color('#8B4513'), new THREE.Color('#D2691E'), new THREE.Color('#F4A460')],
        size: 0.15,
        lifetime: 1.5,
        velocity: new THREE.Vector3(0, 8, 0),
        gravity: -15,
        spread: 3,
        fade: true,
        rotate: true,
    },
    level_up: {
        count: 80,
        color: [new THREE.Color('#FFD700'), new THREE.Color('#FFFF00'), new THREE.Color('#FFA500')],
        size: 0.2,
        lifetime: 2.5,
        velocity: new THREE.Vector3(0, 10, 0),
        gravity: -2,
        spread: 5,
        fade: true,
        rotate: true,
    },
    quest_complete: {
        count: 60,
        color: [new THREE.Color('#00FF00'), new THREE.Color('#32CD32'), new THREE.Color('#7CFC00')],
        size: 0.18,
        lifetime: 2.0,
        velocity: new THREE.Vector3(0, 12, 0),
        gravity: -8,
        spread: 4,
        fade: true,
        rotate: false,
    },
    magic_sparkle: {
        count: 40,
        color: [new THREE.Color('#9370DB'), new THREE.Color('#8A2BE2'), new THREE.Color('#DA70D6')],
        size: 0.12,
        lifetime: 1.0,
        velocity: new THREE.Vector3(0, 3, 0),
        gravity: 0,
        spread: 2,
        fade: true,
        rotate: true,
    },
    confetti: {
        count: 100,
        color: [
            new THREE.Color('#FF6B6B'),
            new THREE.Color('#4ECDC4'),
            new THREE.Color('#FFE66D'),
            new THREE.Color('#95E1D3'),
            new THREE.Color('#F38181'),
            new THREE.Color('#AA96DA'),
        ],
        size: 0.15,
        lifetime: 3.0,
        velocity: new THREE.Vector3(0, 15, 0),
        gravity: -10,
        spread: 8,
        fade: false,
        rotate: true,
    },
    heal: {
        count: 25,
        color: [new THREE.Color('#98FB98'), new THREE.Color('#00FA9A'), new THREE.Color('#7FFFD4')],
        size: 0.2,
        lifetime: 1.5,
        velocity: new THREE.Vector3(0, 5, 0),
        gravity: -1,
        spread: 1.5,
        fade: true,
        rotate: false,
    },
    speed_boost: {
        count: 35,
        color: [new THREE.Color('#00BFFF'), new THREE.Color('#1E90FF'), new THREE.Color('#87CEEB')],
        size: 0.1,
        lifetime: 0.8,
        velocity: new THREE.Vector3(0, 0, -10),
        gravity: 0,
        spread: 1,
        fade: true,
        rotate: false,
    },
    star_burst: {
        count: 50,
        color: [new THREE.Color('#FFD700'), new THREE.Color('#FFFFFF'), new THREE.Color('#FFF8DC')],
        size: 0.25,
        lifetime: 1.2,
        velocity: new THREE.Vector3(0, 6, 0),
        gravity: -3,
        spread: 6,
        fade: true,
        rotate: true,
    },
};

// ==================== SINGLE PARTICLE SYSTEM ====================
interface ParticleSystemProps {
    type: ParticleEffectType;
    position: [number, number, number];
    onComplete?: () => void;
}

export function ParticleSystem({ type, position, onComplete }: ParticleSystemProps) {
    const pointsRef = useRef<THREE.Points>(null);
    const [isActive, setIsActive] = useState(true);
    const startTime = useRef(Date.now());

    const config = PARTICLE_PRESETS[type];

    // Initialize particle data
    const particleData = useMemo(() => {
        const positions = new Float32Array(config.count * 3);
        const velocities = new Float32Array(config.count * 3);
        const colors = new Float32Array(config.count * 3);
        const sizes = new Float32Array(config.count);
        const rotations = new Float32Array(config.count);

        const colorArray = Array.isArray(config.color) ? config.color : [config.color];

        for (let i = 0; i < config.count; i++) {
            // Initial positions (at origin, will be offset by group position)
            positions[i * 3] = (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 1] = Math.random() * 0.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

            // Random velocities with spread
            velocities[i * 3] = (Math.random() - 0.5) * config.spread + config.velocity.x;
            velocities[i * 3 + 1] = Math.random() * config.spread * 0.5 + config.velocity.y;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * config.spread + config.velocity.z;

            // Random color from palette
            const color = colorArray[Math.floor(Math.random() * colorArray.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // Size variation
            sizes[i] = config.size * (0.5 + Math.random() * 0.5);

            // Initial rotation
            rotations[i] = Math.random() * Math.PI * 2;
        }

        return { positions, velocities, colors, sizes, rotations };
    }, [config]);

    useFrame((state, delta) => {
        if (!pointsRef.current || !isActive) return;

        const elapsed = (Date.now() - startTime.current) / 1000;

        // Check if effect is complete
        if (elapsed > config.lifetime) {
            setIsActive(false);
            onComplete?.();
            return;
        }

        const progress = elapsed / config.lifetime;
        const positionArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
        const sizeArray = pointsRef.current.geometry.attributes.size.array as Float32Array;

        for (let i = 0; i < config.count; i++) {
            // Update positions based on velocity and gravity
            positionArray[i * 3] += particleData.velocities[i * 3] * delta;
            positionArray[i * 3 + 1] += particleData.velocities[i * 3 + 1] * delta;
            positionArray[i * 3 + 2] += particleData.velocities[i * 3 + 2] * delta;

            // Apply gravity
            particleData.velocities[i * 3 + 1] += config.gravity * delta;

            // Update sizes if fading
            if (config.fade) {
                sizeArray[i] = particleData.sizes[i] * (1 - progress);
            }

            // Apply rotation
            if (config.rotate) {
                particleData.rotations[i] += delta * 3;
            }
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.geometry.attributes.size.needsUpdate = true;

        // Update material opacity for fading
        if (config.fade) {
            const material = pointsRef.current.material as THREE.PointsMaterial;
            material.opacity = 1 - progress * 0.8;
        }
    });

    if (!isActive) return null;

    return (
        <group position={position}>
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[particleData.positions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        args={[particleData.colors, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-size"
                        args={[particleData.sizes, 1]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={config.size}
                    vertexColors
                    transparent
                    opacity={1}
                    sizeAttenuation
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </group>
    );
}

// ==================== PARTICLE EFFECT MANAGER ====================
interface ActiveEffect {
    id: string;
    type: ParticleEffectType;
    position: [number, number, number];
}

// Global effect queue
let effectQueue: ActiveEffect[] = [];
let effectIdCounter = 0;
let onEffectAddedCallback: (() => void) | null = null;

// Trigger a particle effect from anywhere in the app
export function triggerParticleEffect(
    type: ParticleEffectType,
    position: [number, number, number]
): void {
    effectQueue.push({
        id: `effect_${effectIdCounter++}`,
        type,
        position,
    });
    onEffectAddedCallback?.();
}

// Component that renders all active effects
export function ParticleEffectManager() {
    const [effects, setEffects] = useState<ActiveEffect[]>([]);

    // Subscribe to effect queue
    useEffect(() => {
        const checkQueue = () => {
            if (effectQueue.length > 0) {
                setEffects(prev => [...prev, ...effectQueue]);
                effectQueue = [];
            }
        };

        onEffectAddedCallback = checkQueue;

        // Check periodically for new effects
        const interval = setInterval(checkQueue, 50);

        return () => {
            clearInterval(interval);
            onEffectAddedCallback = null;
        };
    }, []);

    const handleEffectComplete = useCallback((id: string) => {
        setEffects(prev => prev.filter(e => e.id !== id));
    }, []);

    return (
        <>
            {effects.map(effect => (
                <ParticleSystem
                    key={effect.id}
                    type={effect.type}
                    position={effect.position}
                    onComplete={() => handleEffectComplete(effect.id)}
                />
            ))}
        </>
    );
}

// ==================== RING BURST EFFECT ====================
interface RingBurstProps {
    position: [number, number, number];
    color?: string;
    maxRadius?: number;
    duration?: number;
    onComplete?: () => void;
}

export function RingBurst({
    position,
    color = '#FFD700',
    maxRadius = 5,
    duration = 1,
    onComplete,
}: RingBurstProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [isActive, setIsActive] = useState(true);
    const startTime = useRef(Date.now());

    useFrame(() => {
        if (!meshRef.current || !isActive) return;

        const elapsed = (Date.now() - startTime.current) / 1000;
        const progress = elapsed / duration;

        if (progress >= 1) {
            setIsActive(false);
            onComplete?.();
            return;
        }

        // Expand ring
        const scale = progress * maxRadius;
        meshRef.current.scale.set(scale, scale, scale);

        // Fade out
        const material = meshRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = 1 - progress;
    });

    if (!isActive) return null;

    return (
        <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={1}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// ==================== FLOATING TEXT EFFECT ====================
interface FloatingTextProps {
    text: string;
    position: [number, number, number];
    color?: string;
    duration?: number;
    onComplete?: () => void;
}

export function FloatingText({
    text,
    position,
    color = '#FFD700',
    duration = 1.5,
    onComplete,
}: FloatingTextProps) {
    const groupRef = useRef<THREE.Group>(null);
    const [isActive, setIsActive] = useState(true);
    const startTime = useRef(Date.now());

    useFrame(() => {
        if (!groupRef.current || !isActive) return;

        const elapsed = (Date.now() - startTime.current) / 1000;
        const progress = elapsed / duration;

        if (progress >= 1) {
            setIsActive(false);
            onComplete?.();
            return;
        }

        // Float upward
        groupRef.current.position.y = position[1] + progress * 3;

        // Fade out
        groupRef.current.scale.setScalar(1 - progress * 0.5);
    });

    if (!isActive) return null;

    return (
        <group ref={groupRef} position={position}>
            {/* Simple colored sphere as placeholder for text */}
            <mesh>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.8} />
            </mesh>
        </group>
    );
}

// ==================== SPIRAL EFFECT ====================
interface SpiralEffectProps {
    position: [number, number, number];
    color?: string;
    duration?: number;
    onComplete?: () => void;
}

export function SpiralEffect({
    position,
    color = '#9370DB',
    duration = 2,
    onComplete,
}: SpiralEffectProps) {
    const pointsRef = useRef<THREE.Points>(null);
    const [isActive, setIsActive] = useState(true);
    const startTime = useRef(Date.now());

    const particleData = useMemo(() => {
        const count = 100;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const baseColor = new THREE.Color(color);

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 6;
            const radius = (i / count) * 3;
            const height = (i / count) * 5;

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            colors[i * 3] = baseColor.r;
            colors[i * 3 + 1] = baseColor.g;
            colors[i * 3 + 2] = baseColor.b;
        }

        return { positions, colors, count };
    }, [color]);

    useFrame(() => {
        if (!pointsRef.current || !isActive) return;

        const elapsed = (Date.now() - startTime.current) / 1000;
        const progress = elapsed / duration;

        if (progress >= 1) {
            setIsActive(false);
            onComplete?.();
            return;
        }

        // Rotate spiral
        pointsRef.current.rotation.y += 0.05;

        // Fade out
        const material = pointsRef.current.material as THREE.PointsMaterial;
        material.opacity = 1 - progress;
    });

    if (!isActive) return null;

    return (
        <group position={position}>
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[particleData.positions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        args={[particleData.colors, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.15}
                    vertexColors
                    transparent
                    opacity={1}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </group>
    );
}
