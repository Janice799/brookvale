'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

// ==================== CUSTOM WATER SHADER ====================
const WaterMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color('#1a6b8a'),
        uDeepColor: new THREE.Color('#0a3d4d'),
        uFoamColor: new THREE.Color('#ffffff'),
        uOpacity: 0.85,
        uWaveHeight: 0.3,
        uWaveSpeed: 0.5,
        uFresnelPower: 2.0,
        uFoamThreshold: 0.7,
    },
    // Vertex Shader
    `
    uniform float uTime;
    uniform float uWaveHeight;
    uniform float uWaveSpeed;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying float vElevation;
    
    // Simplex noise functions for organic wave patterns
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                          -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
      m = m * m;
      m = m * m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      vUv = uv;
      
      vec3 pos = position;
      
      // Multiple wave layers for realistic effect
      float time = uTime * uWaveSpeed;
      
      // Primary waves
      float wave1 = snoise(vec2(pos.x * 0.5 + time, pos.z * 0.5)) * uWaveHeight;
      // Secondary smaller waves
      float wave2 = snoise(vec2(pos.x * 1.5 - time * 0.5, pos.z * 1.5 + time * 0.3)) * uWaveHeight * 0.3;
      // Tertiary tiny ripples
      float wave3 = snoise(vec2(pos.x * 4.0 + time * 2.0, pos.z * 4.0)) * uWaveHeight * 0.1;
      
      float elevation = wave1 + wave2 + wave3;
      pos.y += elevation;
      
      vElevation = elevation;
      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      vNormal = normalize(normalMatrix * normal);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
    // Fragment Shader
    `
    uniform vec3 uColor;
    uniform vec3 uDeepColor;
    uniform vec3 uFoamColor;
    uniform float uOpacity;
    uniform float uTime;
    uniform float uFresnelPower;
    uniform float uFoamThreshold;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying float vElevation;
    
    void main() {
      // Fresnel effect for edge glow
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), uFresnelPower);
      
      // Color gradient based on depth/elevation
      float depthFactor = smoothstep(-0.2, 0.3, vElevation);
      vec3 waterColor = mix(uDeepColor, uColor, depthFactor);
      
      // Foam on wave peaks
      float foam = smoothstep(uFoamThreshold, 1.0, vElevation / 0.3 + 0.5);
      foam *= 0.5 + 0.5 * sin(vUv.x * 50.0 + uTime * 2.0) * sin(vUv.y * 50.0 - uTime * 1.5);
      
      // Combine colors
      vec3 finalColor = mix(waterColor, uFoamColor, foam * 0.3);
      finalColor += fresnel * 0.2;
      
      // Shimmer effect
      float shimmer = sin(vUv.x * 30.0 + uTime) * sin(vUv.y * 30.0 - uTime * 0.5) * 0.05;
      finalColor += shimmer;
      
      // Edge transparency
      float edgeAlpha = smoothstep(0.0, 0.1, min(vUv.x, min(vUv.y, min(1.0 - vUv.x, 1.0 - vUv.y))));
      
      gl_FragColor = vec4(finalColor, uOpacity * edgeAlpha);
    }
  `
);

// Extend Three.js with our custom material
extend({ WaterMaterial });

// TypeScript module augmentation for @react-three/fiber
declare module '@react-three/fiber' {
    interface ThreeElements {
        waterMaterial: THREE.ShaderMaterialParameters & {
            uTime?: number;
            uColor?: THREE.Color;
            uDeepColor?: THREE.Color;
            uFoamColor?: THREE.Color;
            uOpacity?: number;
            uWaveHeight?: number;
            uWaveSpeed?: number;
            uFresnelPower?: number;
            uFoamThreshold?: number;
            ref?: React.Ref<THREE.ShaderMaterial>;
        };
    }
}

// ==================== WATER SURFACE COMPONENT ====================
interface WaterSurfaceProps {
    position?: [number, number, number];
    size?: [number, number];
    color?: string;
    deepColor?: string;
    opacity?: number;
    waveHeight?: number;
    waveSpeed?: number;
    segments?: number;
}

export function WaterSurface({
    position = [0, 0, 0],
    size = [10, 10],
    color = '#1a6b8a',
    deepColor = '#0a3d4d',
    opacity = 0.85,
    waveHeight = 0.3,
    waveSpeed = 0.5,
    segments = 64,
}: WaterSurfaceProps) {
    const materialRef = useRef<any>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;
        }
    });

    return (
        <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[size[0], size[1], segments, segments]} />
            <waterMaterial
                ref={materialRef}
                uColor={new THREE.Color(color)}
                uDeepColor={new THREE.Color(deepColor)}
                uOpacity={opacity}
                uWaveHeight={waveHeight}
                uWaveSpeed={waveSpeed}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// ==================== LAKE COMPONENT ====================
interface LakeProps {
    position?: [number, number, number];
    radius?: number;
    color?: string;
    deepColor?: string;
}

export function Lake({
    position = [0, 0, 0],
    radius = 8,
    color = '#2d8fba',
    deepColor = '#0d4f6a',
}: LakeProps) {
    const materialRef = useRef<any>(null);
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;
        }
    });

    return (
        <group position={position}>
            {/* Main lake surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[radius, 64]} />
                <waterMaterial
                    ref={materialRef}
                    uColor={new THREE.Color(color)}
                    uDeepColor={new THREE.Color(deepColor)}
                    uOpacity={0.9}
                    uWaveHeight={0.15}
                    uWaveSpeed={0.3}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Lake edge/shore */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                <ringGeometry args={[radius, radius + 0.5, 64]} />
                <meshStandardMaterial
                    color="#8B7355"
                    roughness={0.9}
                />
            </mesh>

            {/* Underwater depth illusion */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                <circleGeometry args={[radius * 0.9, 32]} />
                <meshStandardMaterial
                    color="#051f2c"
                    transparent
                    opacity={0.8}
                />
            </mesh>
        </group>
    );
}

// ==================== STREAM/RIVER COMPONENT ====================
interface StreamProps {
    points: [number, number, number][];
    width?: number;
    color?: string;
}

export function Stream({
    points,
    width = 2,
    color = '#3498db',
}: StreamProps) {
    const materialRef = useRef<any>(null);

    // Create a curved path from points
    const curve = useMemo(() => {
        const vectors = points.map(p => new THREE.Vector3(p[0], p[1], p[2]));
        return new THREE.CatmullRomCurve3(vectors);
    }, [points]);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;
        }
    });

    return (
        <mesh>
            <tubeGeometry args={[curve, 64, width / 2, 8, false]} />
            <waterMaterial
                ref={materialRef}
                uColor={new THREE.Color(color)}
                uDeepColor={new THREE.Color('#1a5276')}
                uOpacity={0.85}
                uWaveHeight={0.1}
                uWaveSpeed={1.0}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// ==================== WATERFALL COMPONENT ====================
interface WaterfallProps {
    position?: [number, number, number];
    height?: number;
    width?: number;
}

export function Waterfall({
    position = [0, 0, 0],
    height = 5,
    width = 3,
}: WaterfallProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<any>(null);

    // Waterfall specific shader
    useFrame((state) => {
        if (meshRef.current && materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;
        }
    });

    return (
        <group position={position}>
            {/* Falling water plane */}
            <mesh ref={meshRef}>
                <planeGeometry args={[width, height, 32, 64]} />
                <waterMaterial
                    ref={materialRef}
                    uColor={new THREE.Color('#87CEEB')}
                    uDeepColor={new THREE.Color('#4682B4')}
                    uOpacity={0.7}
                    uWaveHeight={0.05}
                    uWaveSpeed={3.0}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Splash at bottom */}
            <mesh position={[0, -height / 2 - 0.5, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[width * 0.8, 32]} />
                <meshStandardMaterial
                    color="#a8d8ea"
                    transparent
                    opacity={0.6}
                />
            </mesh>
        </group>
    );
}

// ==================== POND WITH LILY PADS ====================
interface PondProps {
    position?: [number, number, number];
    radius?: number;
    lilyPadCount?: number;
}

export function Pond({
    position = [0, 0, 0],
    radius = 4,
    lilyPadCount = 5,
}: PondProps) {
    const materialRef = useRef<any>(null);

    // Generate random lily pad positions
    const lilyPads = useMemo(() => {
        const pads = [];
        for (let i = 0; i < lilyPadCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * radius * 0.7;
            pads.push({
                position: [
                    Math.cos(angle) * r,
                    0.05,
                    Math.sin(angle) * r,
                ] as [number, number, number],
                rotation: Math.random() * Math.PI * 2,
                scale: 0.3 + Math.random() * 0.3,
            });
        }
        return pads;
    }, [lilyPadCount, radius]);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;
        }
    });

    return (
        <group position={position}>
            {/* Pond water */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[radius, 48]} />
                <waterMaterial
                    ref={materialRef}
                    uColor={new THREE.Color('#2e7d6b')}
                    uDeepColor={new THREE.Color('#1a4d42')}
                    uOpacity={0.9}
                    uWaveHeight={0.08}
                    uWaveSpeed={0.2}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Pond edge stones */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <ringGeometry args={[radius, radius + 0.3, 48]} />
                <meshStandardMaterial color="#6B5344" roughness={0.95} />
            </mesh>

            {/* Lily pads */}
            {lilyPads.map((pad, index) => (
                <group key={index} position={pad.position}>
                    {/* Lily pad leaf */}
                    <mesh rotation={[-Math.PI / 2, pad.rotation, 0]}>
                        <circleGeometry args={[pad.scale, 16]} />
                        <meshStandardMaterial color="#228B22" side={THREE.DoubleSide} />
                    </mesh>
                    {/* Optional flower on some pads */}
                    {index % 2 === 0 && (
                        <mesh position={[0, 0.1, 0]}>
                            <sphereGeometry args={[pad.scale * 0.3, 8, 8]} />
                            <meshStandardMaterial color="#FFB6C1" />
                        </mesh>
                    )}
                </group>
            ))}
        </group>
    );
}

// ==================== OCEAN COMPONENT ====================
interface OceanProps {
    position?: [number, number, number];
    size?: number;
}

export function Ocean({
    position = [0, -2, 0],
    size = 200,
}: OceanProps) {
    const materialRef = useRef<any>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;
        }
    });

    return (
        <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[size, size, 128, 128]} />
            <waterMaterial
                ref={materialRef}
                uColor={new THREE.Color('#006994')}
                uDeepColor={new THREE.Color('#001f3f')}
                uOpacity={0.95}
                uWaveHeight={0.8}
                uWaveSpeed={0.3}
                uFoamThreshold={0.6}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// ==================== RIPPLE EFFECT COMPONENT ====================
interface RippleProps {
    position: [number, number, number];
    maxRadius?: number;
    duration?: number;
    onComplete?: () => void;
}

export function Ripple({
    position,
    maxRadius = 2,
    duration = 1.5,
    onComplete,
}: RippleProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const startTime = useRef(Date.now());
    const [isActive, setIsActive] = useState(true);

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
        const radius = progress * maxRadius;
        meshRef.current.scale.set(radius, radius, 1);

        // Fade out
        const material = meshRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = 1 - progress;
    });

    if (!isActive) return null;

    return (
        <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1.0, 32]} />
            <meshBasicMaterial
                color="#87CEEB"
                transparent
                opacity={1}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// ==================== WATER MANAGER ====================
interface WaterManagerProps {
    showLake?: boolean;
    showPond?: boolean;
    showStream?: boolean;
}

export function WaterManager({
    showLake = true,
    showPond = true,
    showStream = false,
}: WaterManagerProps) {
    return (
        <>
            {showLake && (
                <Lake
                    position={[-20, -1, 20]}
                    radius={12}
                    color="#3498db"
                    deepColor="#1a5276"
                />
            )}

            {showPond && (
                <Pond
                    position={[15, -0.5, 15]}
                    radius={5}
                    lilyPadCount={7}
                />
            )}

            {showStream && (
                <Stream
                    points={[
                        [-30, 0, 0],
                        [-20, 0, 5],
                        [-10, 0, 3],
                        [0, 0, 8],
                        [10, 0, 5],
                    ]}
                    width={1.5}
                />
            )}
        </>
    );
}
