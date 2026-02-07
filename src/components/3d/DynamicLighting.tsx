'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
    getCurrentTimeOfDay,
    getDemoTimeController,
    LIGHTING_PRESETS,
    type LightingConfig,
    type TimeOfDay,
} from '@/lib/lightingSystem';

interface DynamicLightingProps {
    mode?: 'realtime' | 'demo' | 'fixed';
    fixedTime?: TimeOfDay;
    transitionSpeed?: number;
}

/**
 * Dynamic Lighting Component
 * 
 * Manages scene lighting based on time of day.
 * Supports real-time sync, demo mode (fast cycle), or fixed time.
 */
export function DynamicLighting({
    mode = 'demo',
    fixedTime = 'noon',
    transitionSpeed = 1,
}: DynamicLightingProps) {
    const { scene } = useThree();
    const directionalRef = useRef<THREE.DirectionalLight>(null);
    const ambientRef = useRef<THREE.AmbientLight>(null);

    const [currentConfig, setCurrentConfig] = useState<LightingConfig>(
        LIGHTING_PRESETS[fixedTime]
    );

    // Demo time controller
    const demoController = useMemo(() => getDemoTimeController(), []);

    // Update lighting each frame
    useFrame(() => {
        let config: LightingConfig;

        if (mode === 'demo') {
            config = demoController.getLighting();
        } else if (mode === 'fixed') {
            config = LIGHTING_PRESETS[fixedTime];
        } else {
            // Realtime mode
            config = LIGHTING_PRESETS[getCurrentTimeOfDay()];
        }

        // Update directional light
        if (directionalRef.current) {
            directionalRef.current.color.set(config.directionalColor);
            directionalRef.current.intensity = config.directionalIntensity;
            directionalRef.current.position.set(
                config.sunPosition[0],
                config.sunPosition[1],
                config.sunPosition[2]
            );
        }

        // Update ambient light
        if (ambientRef.current) {
            ambientRef.current.color.set(config.ambientColor);
            ambientRef.current.intensity = config.ambientIntensity;
        }

        // Update fog
        if (scene.fog) {
            (scene.fog as THREE.Fog).color.set(config.fogColor);
            (scene.fog as THREE.Fog).near = config.fogNear;
            (scene.fog as THREE.Fog).far = config.fogFar;
        }

        setCurrentConfig(config);
    });

    // Initialize fog
    useEffect(() => {
        const config = mode === 'fixed'
            ? LIGHTING_PRESETS[fixedTime]
            : LIGHTING_PRESETS['noon'];

        scene.fog = new THREE.Fog(config.fogColor, config.fogNear, config.fogFar);

        return () => {
            scene.fog = null;
        };
    }, [scene, mode, fixedTime]);

    return (
        <>
            {/* Main directional light (sun/moon) */}
            <directionalLight
                ref={directionalRef}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={100}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
            />

            {/* Ambient light for fill */}
            <ambientLight ref={ambientRef} />

            {/* Hemisphere light for sky/ground color blending */}
            <hemisphereLight
                args={[currentConfig.skyTop, currentConfig.skyBottom, 0.4]}
            />
        </>
    );
}

/**
 * Dynamic Sky Background
 * 
 * Creates a gradient background that changes with time of day.
 */
export function DynamicSky({ mode = 'demo', fixedTime = 'noon' }: { mode?: 'realtime' | 'demo' | 'fixed'; fixedTime?: TimeOfDay }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const demoController = useMemo(() => getDemoTimeController(), []);

    useFrame(() => {
        if (!meshRef.current) return;

        let config: LightingConfig;

        if (mode === 'demo') {
            config = demoController.getLighting();
        } else if (mode === 'fixed') {
            config = LIGHTING_PRESETS[fixedTime];
        } else {
            config = LIGHTING_PRESETS[getCurrentTimeOfDay()];
        }

        // Update gradient colors
        const material = meshRef.current.material as THREE.ShaderMaterial;
        if (material.uniforms) {
            material.uniforms.topColor.value.set(config.skyTop);
            material.uniforms.bottomColor.value.set(config.skyBottom);
        }
    });

    // Custom shader for smooth gradient
    const skyMaterial = useMemo(() => {
        const config = LIGHTING_PRESETS['noon'];

        return new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(config.skyTop) },
                bottomColor: { value: new THREE.Color(config.skyBottom) },
                offset: { value: 0.4 },
                exponent: { value: 0.6 },
            },
            vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y + offset;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
            side: THREE.BackSide,
        });
    }, []);

    return (
        <mesh ref={meshRef} material={skyMaterial}>
            <sphereGeometry args={[500, 32, 15]} />
        </mesh>
    );
}

/**
 * Twinkling Stars
 * 
 * Particle system for night sky stars.
 */
export function Stars({ mode = 'demo', fixedTime = 'noon' }: { mode?: 'realtime' | 'demo' | 'fixed'; fixedTime?: TimeOfDay }) {
    const pointsRef = useRef<THREE.Points>(null);
    const demoController = useMemo(() => getDemoTimeController(), []);

    // Generate star positions
    const [positions, sizes] = useMemo(() => {
        const count = 500;
        const pos = new Float32Array(count * 3);
        const size = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // Distribute on upper hemisphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.4; // Only upper part
            const r = 400 + Math.random() * 50;

            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.cos(phi);
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

            size[i] = Math.random() * 2 + 0.5;
        }

        return [pos, size];
    }, []);

    useFrame((state) => {
        if (!pointsRef.current) return;

        let config: LightingConfig;

        if (mode === 'demo') {
            config = demoController.getLighting();
        } else if (mode === 'fixed') {
            config = LIGHTING_PRESETS[fixedTime];
        } else {
            config = LIGHTING_PRESETS[getCurrentTimeOfDay()];
        }

        // Update star visibility
        const material = pointsRef.current.material as THREE.PointsMaterial;
        material.opacity = config.starVisibility;

        // Twinkling effect
        const time = state.clock.elapsedTime;
        const positionArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < positionArray.length / 3; i++) {
            // Subtle position wobble for twinkling
            const originalY = positions[i * 3 + 1];
            positionArray[i * 3 + 1] = originalY + Math.sin(time * 2 + i) * 0.5;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-size"
                    args={[sizes, 1]}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#ffffff"
                size={3}
                transparent
                opacity={0}
                sizeAttenuation
            />
        </points>
    );
}

/**
 * Sun/Moon Object
 * 
 * Visual representation of sun or moon.
 */
export function CelestialBody({ mode = 'demo', fixedTime = 'noon' }: { mode?: 'realtime' | 'demo' | 'fixed'; fixedTime?: TimeOfDay }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const demoController = useMemo(() => getDemoTimeController(), []);

    useFrame(() => {
        if (!meshRef.current) return;

        let config: LightingConfig;

        if (mode === 'demo') {
            config = demoController.getLighting();
        } else if (mode === 'fixed') {
            config = LIGHTING_PRESETS[fixedTime];
        } else {
            config = LIGHTING_PRESETS[getCurrentTimeOfDay()];
        }

        // Position sun/moon
        meshRef.current.position.set(
            config.sunPosition[0] * 3,
            config.sunPosition[1] * 3,
            config.sunPosition[2] * 3
        );

        // Update color
        const material = meshRef.current.material as THREE.MeshBasicMaterial;
        material.color.set(config.sunColor);

        // Glow follows
        if (glowRef.current) {
            glowRef.current.position.copy(meshRef.current.position);
            const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
            glowMat.color.set(config.sunColor);
            glowMat.opacity = config.sunIntensity * 0.5;
        }
    });

    return (
        <>
            {/* Sun/Moon sphere */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[8, 32, 32]} />
                <meshBasicMaterial color="#fff5e6" />
            </mesh>

            {/* Glow effect */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[12, 32, 32]} />
                <meshBasicMaterial color="#fff5e6" transparent opacity={0.3} />
            </mesh>
        </>
    );
}

/**
 * Time Display HUD
 * 
 * Shows current simulated time.
 */
export function TimeDisplay({ mode = 'demo' }: { mode?: 'realtime' | 'demo' }) {
    const [time, setTime] = useState('12:00');
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('noon');
    const demoController = useMemo(() => getDemoTimeController(), []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (mode === 'demo') {
                const { hour, minute } = demoController.getSimulatedTime();
                setTime(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
                setTimeOfDay(demoController.getTimeOfDay());
            } else {
                const now = new Date();
                setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
                setTimeOfDay(getCurrentTimeOfDay());
            }
        }, 100);

        return () => clearInterval(interval);
    }, [mode, demoController]);

    const getEmoji = (tod: TimeOfDay) => {
        switch (tod) {
            case 'dawn': return '🌅';
            case 'morning': return '☀️';
            case 'noon': return '🌞';
            case 'afternoon': return '⛅';
            case 'evening': return '🌇';
            case 'night': return '🌙';
        }
    };

    const getLabel = (tod: TimeOfDay) => {
        switch (tod) {
            case 'dawn': return 'Dawn';
            case 'morning': return 'Morning';
            case 'noon': return 'Noon';
            case 'afternoon': return 'Afternoon';
            case 'evening': return 'Evening';
            case 'night': return 'Night';
        }
    };

    return (
        <div className="time-display" style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: '10px 16px',
            borderRadius: '12px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 100,
        }}>
            <span style={{ fontSize: '20px' }}>{getEmoji(timeOfDay)}</span>
            <span>{time}</span>
            <span style={{ opacity: 0.7, fontSize: '12px' }}>{getLabel(timeOfDay)}</span>
        </div>
    );
}
