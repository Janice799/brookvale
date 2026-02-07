'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ==================== ANIMATED WINDMILL ====================
// For Goal Tycoon construction site
export function AnimatedWindmill({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    const bladeRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (bladeRef.current) {
            bladeRef.current.rotation.z = state.clock.elapsedTime * 1.5;
        }
    });

    return (
        <group position={position} scale={scale}>
            {/* Tower */}
            <mesh position={[0, 1.2, 0]} castShadow>
                <coneGeometry args={[0.4, 2.4, 8]} />
                <meshStandardMaterial color="#8D6E63" roughness={0.9} />
            </mesh>

            {/* Hub */}
            <mesh position={[0, 2.4, 0.3]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshStandardMaterial color="#5D4037" roughness={0.8} />
            </mesh>

            {/* Rotating blades */}
            <group ref={bladeRef} position={[0, 2.4, 0.4]}>
                {[0, 1, 2, 3].map((i) => (
                    <mesh key={i} rotation={[0, 0, (Math.PI / 2) * i]} castShadow>
                        <boxGeometry args={[0.15, 1.2, 0.05]} />
                        <meshStandardMaterial color="#FFD54F" roughness={0.7} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// ==================== PULSING CRYSTAL ====================
// For Menu Oracle mystic tent
export function PulsingCrystal({ position, color = '#B388FF', scale = 1 }: {
    position: [number, number, number],
    color?: string,
    scale?: number
}) {
    const crystalRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (crystalRef.current) {
            // Gentle floating motion
            crystalRef.current.position.y = position[1] + Math.sin(t * 2) * 0.1;
            crystalRef.current.rotation.y = t * 0.5;

            // Pulsing scale
            const pulseScale = 1 + Math.sin(t * 3) * 0.1;
            crystalRef.current.scale.setScalar(pulseScale * scale);
        }
        if (glowRef.current) {
            // Pulsing glow intensity
            const material = glowRef.current.material as THREE.MeshStandardMaterial;
            material.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.3;
        }
    });

    return (
        <group position={position}>
            {/* Main crystal */}
            <mesh ref={crystalRef} castShadow>
                <octahedronGeometry args={[0.4, 0]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={0.9}
                    emissive={color}
                    emissiveIntensity={0.5}
                    roughness={0.2}
                />
            </mesh>

            {/* Glow sphere */}
            <mesh ref={glowRef} scale={1.3}>
                <sphereGeometry args={[0.35, 16, 16]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={0.3}
                    emissive={color}
                    emissiveIntensity={0.5}
                />
            </mesh>
        </group>
    );
}

// ==================== FLOATING BUBBLES ====================
// For Breath Bubble cloud terrace
export function FloatingBubbles({ position, count = 8 }: { position: [number, number, number], count?: number }) {
    const bubblesRef = useRef<THREE.Group>(null);

    const bubbleData = useMemo(() => {
        return Array.from({ length: count }, (_, i) => ({
            offset: [
                (Math.random() - 0.5) * 3,
                Math.random() * 2,
                (Math.random() - 0.5) * 3
            ] as [number, number, number],
            size: 0.15 + Math.random() * 0.2,
            speed: 0.5 + Math.random() * 0.5,
            delay: Math.random() * Math.PI * 2,
        }));
    }, [count]);

    useFrame((state) => {
        if (bubblesRef.current) {
            bubblesRef.current.children.forEach((bubble, i) => {
                const data = bubbleData[i];
                const t = state.clock.elapsedTime * data.speed + data.delay;

                // Floating motion
                bubble.position.y = data.offset[1] + Math.sin(t) * 0.5 + ((t * 0.3) % 3);
                bubble.position.x = data.offset[0] + Math.sin(t * 0.7) * 0.3;
                bubble.position.z = data.offset[2] + Math.cos(t * 0.5) * 0.3;

                // Reset when too high
                if (bubble.position.y > 4) {
                    bubble.position.y = data.offset[1];
                }

                // Subtle scale pulsing
                const scale = data.size * (1 + Math.sin(t * 2) * 0.1);
                bubble.scale.setScalar(scale);
            });
        }
    });

    return (
        <group ref={bubblesRef} position={position}>
            {bubbleData.map((data, i) => (
                <mesh key={i} position={data.offset}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshStandardMaterial
                        color="#A7FFEB"
                        transparent
                        opacity={0.4}
                        emissive="#80CBC4"
                        emissiveIntensity={0.3}
                        roughness={0.1}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ==================== SPINNING DISCO BALL ====================
// For Rhythm Surfer neon DJ booth
export function SpinningDiscoBall({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    const ballRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (ballRef.current) {
            ballRef.current.rotation.y = t * 2;
        }
        if (lightRef.current) {
            lightRef.current.rotation.y = t * 3;
        }
    });

    return (
        <group position={position} scale={scale}>
            {/* Disco ball */}
            <mesh ref={ballRef}>
                <icosahedronGeometry args={[0.4, 1]} />
                <meshStandardMaterial
                    color="#E0E0E0"
                    roughness={0.1}
                    metalness={0.9}
                    emissive="#00E5FF"
                    emissiveIntensity={0.2}
                />
            </mesh>

            {/* Rotating light beams (simplified) */}
            <group ref={lightRef}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <mesh
                        key={i}
                        position={[
                            Math.cos((i / 6) * Math.PI * 2) * 0.8,
                            -0.5,
                            Math.sin((i / 6) * Math.PI * 2) * 0.8
                        ]}
                        rotation={[Math.PI / 4, 0, (i / 6) * Math.PI * 2]}
                    >
                        <coneGeometry args={[0.1, 1.5, 8]} />
                        <meshStandardMaterial
                            color={i % 2 === 0 ? '#FF4081' : '#00E5FF'}
                            transparent
                            opacity={0.3}
                            emissive={i % 2 === 0 ? '#FF4081' : '#00E5FF'}
                            emissiveIntensity={0.5}
                        />
                    </mesh>
                ))}
            </group>

            {/* Hanging string */}
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
                <meshStandardMaterial color="#424242" />
            </mesh>
        </group>
    );
}

// ==================== TWINKLING STARS ====================
// For Star Note and Dream Catcher
export function TwinklingStars({ position, count = 5 }: { position: [number, number, number], count?: number }) {
    const starsRef = useRef<THREE.Group>(null);

    const starData = useMemo(() => {
        return Array.from({ length: count }, (_, i) => ({
            offset: [
                (Math.random() - 0.5) * 4,
                Math.random() * 2 + 1,
                (Math.random() - 0.5) * 4
            ] as [number, number, number],
            size: 0.1 + Math.random() * 0.15,
            speed: 1 + Math.random() * 2,
            delay: Math.random() * Math.PI * 2,
        }));
    }, [count]);

    useFrame((state) => {
        if (starsRef.current) {
            starsRef.current.children.forEach((star, i) => {
                const data = starData[i];
                const t = state.clock.elapsedTime * data.speed + data.delay;

                // Twinkling effect
                const material = (star as THREE.Mesh).material as THREE.MeshStandardMaterial;
                material.emissiveIntensity = 0.5 + Math.sin(t) * 0.5;

                // Gentle floating
                star.position.y = data.offset[1] + Math.sin(t * 0.5) * 0.2;
                star.rotation.y = t;
                star.rotation.z = t * 0.5;
            });
        }
    });

    return (
        <group ref={starsRef} position={position}>
            {starData.map((data, i) => (
                <mesh key={i} position={data.offset} scale={data.size}>
                    <octahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial
                        color="#FFD700"
                        emissive="#FFD700"
                        emissiveIntensity={0.8}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ==================== FLOATING LEAVES ====================
// For Tiny Wins garden and cherry trees
export function FloatingLeaves({ position, count = 6, color = '#81C784' }: {
    position: [number, number, number],
    count?: number,
    color?: string
}) {
    const leavesRef = useRef<THREE.Group>(null);

    const leafData = useMemo(() => {
        return Array.from({ length: count }, (_, i) => ({
            offset: [
                (Math.random() - 0.5) * 4,
                Math.random() * 3,
                (Math.random() - 0.5) * 4
            ] as [number, number, number],
            rotationSpeed: (Math.random() - 0.5) * 2,
            fallSpeed: 0.3 + Math.random() * 0.3,
            swayAmount: 0.5 + Math.random() * 0.5,
            delay: Math.random() * Math.PI * 2,
        }));
    }, [count]);

    useFrame((state) => {
        if (leavesRef.current) {
            leavesRef.current.children.forEach((leaf, i) => {
                const data = leafData[i];
                const t = state.clock.elapsedTime + data.delay;

                // Falling and swaying motion
                leaf.position.y = data.offset[1] - ((t * data.fallSpeed) % 4);
                leaf.position.x = data.offset[0] + Math.sin(t * 2) * data.swayAmount;
                leaf.position.z = data.offset[2] + Math.cos(t * 1.5) * data.swayAmount * 0.5;

                // Tumbling rotation
                leaf.rotation.x = t * data.rotationSpeed;
                leaf.rotation.y = t * data.rotationSpeed * 0.7;
                leaf.rotation.z = t * data.rotationSpeed * 0.5;

                // Reset when fallen
                if (leaf.position.y < -1) {
                    leaf.position.y = data.offset[1] + 3;
                }
            });
        }
    });

    return (
        <group ref={leavesRef} position={position}>
            {leafData.map((data, i) => (
                <mesh key={i} position={data.offset} scale={0.15}>
                    <planeGeometry args={[1, 0.6]} />
                    <meshStandardMaterial
                        color={color}
                        side={THREE.DoubleSide}
                        roughness={0.9}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ==================== WATER RIPPLES ====================
// For Karma Ripple zen pond
export function WaterRipples({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    const ripplesRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (ripplesRef.current) {
            ripplesRef.current.children.forEach((ring, i) => {
                const t = (state.clock.elapsedTime + i * 0.5) % 3;
                const scale = 0.3 + t * 0.8;
                const opacity = 1 - (t / 3);

                ring.scale.set(scale, 1, scale);
                (ring as THREE.Mesh).material = new THREE.MeshStandardMaterial({
                    color: '#4DD0E1',
                    transparent: true,
                    opacity: opacity * 0.5,
                    emissive: '#00BCD4',
                    emissiveIntensity: opacity * 0.3,
                });
            });
        }
    });

    return (
        <group ref={ripplesRef} position={position} scale={scale}>
            {[0, 1, 2].map((i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                    <ringGeometry args={[0.8, 1, 32]} />
                    <meshStandardMaterial
                        color="#4DD0E1"
                        transparent
                        opacity={0.5}
                        emissive="#00BCD4"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ==================== GLOWING LANTERN FLAME ====================
// Enhanced lantern with flickering flame
export function GlowingLanternFlame({ position }: { position: [number, number, number] }) {
    const flameRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (flameRef.current) {
            const t = state.clock.elapsedTime;

            // Flickering scale
            const scaleX = 1 + Math.sin(t * 8) * 0.1 + Math.sin(t * 12) * 0.05;
            const scaleY = 1 + Math.cos(t * 10) * 0.15;
            flameRef.current.scale.set(scaleX, scaleY, scaleX);

            // Flickering intensity
            const material = flameRef.current.material as THREE.MeshStandardMaterial;
            material.emissiveIntensity = 0.8 + Math.sin(t * 15) * 0.2;
        }
    });

    return (
        <group position={position}>
            {/* Lantern post */}
            <mesh position={[0, 1, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.07, 2, 8]} />
                <meshStandardMaterial color="#424242" roughness={0.8} />
            </mesh>

            {/* Lantern head */}
            <mesh position={[0, 2.1, 0]}>
                <boxGeometry args={[0.25, 0.3, 0.25]} />
                <meshStandardMaterial color="#3E2723" roughness={0.8} />
            </mesh>

            {/* Animated flame */}
            <mesh ref={flameRef} position={[0, 2.1, 0]}>
                <sphereGeometry args={[0.12, 12, 12]} />
                <meshStandardMaterial
                    color="#FF9800"
                    emissive="#FF6F00"
                    emissiveIntensity={0.8}
                />
            </mesh>

            {/* Outer glow */}
            <mesh position={[0, 2.1, 0]}>
                <sphereGeometry args={[0.2, 12, 12]} />
                <meshStandardMaterial
                    color="#FFE082"
                    transparent
                    opacity={0.3}
                    emissive="#FFE082"
                    emissiveIntensity={0.5}
                />
            </mesh>
        </group>
    );
}

// ==================== SLEEPING ZZZ ====================
// For Sleep Nest treehouse
export function SleepingZzz({ position }: { position: [number, number, number] }) {
    const zzzRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (zzzRef.current) {
            const t = state.clock.elapsedTime;

            zzzRef.current.children.forEach((z, i) => {
                const offset = i * 0.4;
                const zTime = (t + i * 0.5) % 3;

                // Float up and fade
                z.position.y = 0.5 + zTime * 0.8;
                z.position.x = Math.sin(zTime * 2) * 0.3;

                const scale = 0.3 + i * 0.15;
                z.scale.setScalar(scale * (1 - zTime / 4));

                const material = (z as THREE.Mesh).material as THREE.MeshStandardMaterial;
                material.opacity = 1 - (zTime / 3);
            });
        }
    });

    return (
        <group ref={zzzRef} position={position}>
            {[0, 1, 2].map((i) => (
                <mesh key={i} position={[0, i * 0.5, 0]}>
                    <boxGeometry args={[0.3, 0.15, 0.05]} />
                    <meshStandardMaterial
                        color="#9575CD"
                        transparent
                        opacity={0.8}
                        emissive="#7E57C2"
                        emissiveIntensity={0.5}
                    />
                </mesh>
            ))}
        </group>
    );
}
