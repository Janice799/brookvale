'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==================== WOODEN BRIDGE BETWEEN ISLANDS ====================
interface WoodenBridgeProps {
    start: [number, number, number];
    end: [number, number, number];
}

export function WoodenBridge({ start, end }: WoodenBridgeProps) {
    const midX = (start[0] + end[0]) / 2;
    const midZ = (start[2] + end[2]) / 2;
    const distance = Math.sqrt(
        Math.pow(end[0] - start[0], 2) + Math.pow(end[2] - start[2], 2)
    );
    const angle = Math.atan2(end[2] - start[2], end[0] - start[0]);

    // Number of planks based on distance
    const plankCount = Math.floor(distance / 1.5);

    return (
        <group position={[midX, 0.3, midZ]} rotation={[0, -angle, 0]}>
            {/* Bridge planks */}
            {Array.from({ length: plankCount }).map((_, i) => {
                const offset = (i - plankCount / 2) * 1.5;
                return (
                    <group key={i} position={[offset, 0, 0]}>
                        {/* Wooden plank */}
                        <mesh position={[0, 0, 0]} castShadow>
                            <boxGeometry args={[1.2, 0.15, 1.8]} />
                            <meshStandardMaterial color="#8B5A2B" roughness={0.9} />
                        </mesh>
                    </group>
                );
            })}

            {/* Side rails */}
            <mesh position={[0, 0.4, 0.8]} castShadow>
                <boxGeometry args={[distance, 0.1, 0.1]} />
                <meshStandardMaterial color="#5D4037" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.4, -0.8]} castShadow>
                <boxGeometry args={[distance, 0.1, 0.1]} />
                <meshStandardMaterial color="#5D4037" roughness={0.9} />
            </mesh>

            {/* Rail posts */}
            {Array.from({ length: Math.floor(distance / 4) + 1 }).map((_, i) => {
                const postOffset = (i - Math.floor(distance / 4) / 2) * 4;
                return (
                    <group key={`post-${i}`}>
                        <mesh position={[postOffset, 0.25, 0.8]} castShadow>
                            <boxGeometry args={[0.15, 0.5, 0.15]} />
                            <meshStandardMaterial color="#4E342E" roughness={0.9} />
                        </mesh>
                        <mesh position={[postOffset, 0.25, -0.8]} castShadow>
                            <boxGeometry args={[0.15, 0.5, 0.15]} />
                            <meshStandardMaterial color="#4E342E" roughness={0.9} />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

// ==================== 3D WOODEN BROOKVALE LOGO ====================
export function WoodenBrookvaleLogo({ position = [0, 5, 0] }: { position?: [number, number, number] }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Gentle floating animation
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.3;
            // Subtle rotation
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.03;
        }
    });

    const letters = 'BROOKVALE'.split('');
    const letterSpacing = 2.8;
    const startX = -(letters.length - 1) * letterSpacing / 2;

    return (
        <group ref={groupRef} position={position}>
            {/* Wooden sign board background */}
            <RoundedBox
                args={[28, 5, 1]}
                radius={0.3}
                position={[0, 0, -0.3]}
                castShadow
            >
                <meshStandardMaterial color="#5D4037" roughness={0.9} />
            </RoundedBox>

            {/* Decorative top beam */}
            <RoundedBox args={[30, 0.8, 0.8]} radius={0.2} position={[0, 2.8, 0]} castShadow>
                <meshStandardMaterial color="#4E342E" roughness={0.9} />
            </RoundedBox>

            {/* Letters as 3D blocks */}
            {letters.map((letter, i) => (
                <group key={i} position={[startX + i * letterSpacing, 0, 0.5]}>
                    <Html
                        center
                        transform
                        style={{ pointerEvents: 'none' }}
                    >
                        <div style={{
                            fontFamily: "'Fredoka One', 'Nunito', sans-serif",
                            fontSize: '3rem',
                            fontWeight: '900',
                            color: '#FFD54F',
                            textShadow: `
                                2px 2px 0 #F57C00,
                                4px 4px 0 #E65100,
                                0 0 20px rgba(255, 193, 7, 0.5)
                            `,
                            WebkitTextStroke: '1px #8B4513',
                        }}>
                            {letter}
                        </div>
                    </Html>
                </group>
            ))}

            {/* Subtitle */}
            <Html position={[0, -2.5, 0.5]} center transform style={{ pointerEvents: 'none' }}>
                <div style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: '1rem',
                    color: '#FFF8E1',
                    textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                    letterSpacing: '0.2em',
                }}>
                    🌰 Healing Village 🌲
                </div>
            </Html>

            {/* Decorative acorns on sides */}
            <group position={[-15, 0, 0.5]} scale={0.8}>
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.6, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
                    <meshStandardMaterial color="#8B4513" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.35, 0]}>
                    <sphereGeometry args={[0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                    <meshStandardMaterial color="#5D4037" roughness={0.9} />
                </mesh>
            </group>
            <group position={[15, 0, 0.5]} scale={0.8}>
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.6, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
                    <meshStandardMaterial color="#8B4513" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.35, 0]}>
                    <sphereGeometry args={[0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                    <meshStandardMaterial color="#5D4037" roughness={0.9} />
                </mesh>
            </group>

            {/* Golden sparkles around logo */}
            {[-12, -6, 0, 6, 12].map((x, i) => (
                <FloatingSparkle key={i} position={[x, 3 + (i % 2) * 0.5, 1]} delay={i * 0.3} />
            ))}
        </group>
    );
}

// ==================== FLOATING SPARKLE ====================
function FloatingSparkle({ position, delay = 0 }: { position: [number, number, number], delay?: number }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            const t = state.clock.elapsedTime + delay;
            meshRef.current.position.y = position[1] + Math.sin(t * 2) * 0.3;
            meshRef.current.rotation.y = t * 2;
            meshRef.current.rotation.z = t * 1.5;
            const scale = 0.8 + Math.sin(t * 3) * 0.2;
            meshRef.current.scale.setScalar(scale);
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <octahedronGeometry args={[0.15, 0]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} />
        </mesh>
    );
}

// ==================== ISLAND DECORATIONS ====================
// Trees, flowers, rocks, etc. for each island

export function IslandTree({ position, scale = 1, treeType = 'pine' }: {
    position: [number, number, number],
    scale?: number,
    treeType?: 'pine' | 'round' | 'cherry'
}) {
    if (treeType === 'cherry') {
        return (
            <group position={position} scale={scale}>
                <mesh position={[0, 0.5, 0]} castShadow>
                    <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
                    <meshStandardMaterial color="#5D4037" roughness={0.9} />
                </mesh>
                <mesh position={[0, 1.3, 0]} castShadow>
                    <sphereGeometry args={[0.8, 12, 12]} />
                    <meshStandardMaterial color="#F8BBD9" roughness={0.9} />
                </mesh>
                <mesh position={[-0.4, 1.5, 0.3]} castShadow>
                    <sphereGeometry args={[0.5, 12, 12]} />
                    <meshStandardMaterial color="#FCE4EC" roughness={0.9} />
                </mesh>
            </group>
        );
    }

    if (treeType === 'round') {
        return (
            <group position={position} scale={scale}>
                <mesh position={[0, 0.6, 0]} castShadow>
                    <cylinderGeometry args={[0.2, 0.3, 1.2, 8]} />
                    <meshStandardMaterial color="#6D4C41" roughness={0.9} />
                </mesh>
                <mesh position={[0, 1.5, 0]} castShadow>
                    <sphereGeometry args={[0.9, 12, 12]} />
                    <meshStandardMaterial color="#4CAF50" roughness={0.95} />
                </mesh>
                <mesh position={[-0.4, 1.8, 0.2]} castShadow>
                    <sphereGeometry args={[0.6, 12, 12]} />
                    <meshStandardMaterial color="#66BB6A" roughness={0.95} />
                </mesh>
                <mesh position={[0.3, 2.0, -0.1]} castShadow>
                    <sphereGeometry args={[0.5, 12, 12]} />
                    <meshStandardMaterial color="#81C784" roughness={0.95} />
                </mesh>
            </group>
        );
    }

    // Default: Pine tree
    return (
        <group position={position} scale={scale}>
            <mesh position={[0, 0.5, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.3, 1, 8]} />
                <meshStandardMaterial color="#5D4037" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.5, 0]} castShadow>
                <coneGeometry args={[1.2, 1.5, 8]} />
                <meshStandardMaterial color="#2E7D32" roughness={0.9} />
            </mesh>
            <mesh position={[0, 2.5, 0]} castShadow>
                <coneGeometry args={[0.9, 1.2, 8]} />
                <meshStandardMaterial color="#388E3C" roughness={0.9} />
            </mesh>
            <mesh position={[0, 3.3, 0]} castShadow>
                <coneGeometry args={[0.6, 1, 8]} />
                <meshStandardMaterial color="#43A047" roughness={0.9} />
            </mesh>
        </group>
    );
}

export function FlowerPatch({ position, color = '#FF69B4' }: { position: [number, number, number], color?: string }) {
    return (
        <group position={position}>
            {/* Multiple small flowers */}
            {[[0, 0, 0], [0.3, 0, 0.2], [-0.2, 0, 0.3], [0.1, 0, -0.2]].map((offset, i) => (
                <group key={i} position={offset as [number, number, number]}>
                    <mesh position={[0, 0.15, 0]}>
                        <sphereGeometry args={[0.1, 8, 8]} />
                        <meshStandardMaterial color={color} roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
                        <meshStandardMaterial color="#4CAF50" roughness={0.9} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

export function RockCluster({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    return (
        <group position={position} scale={scale}>
            <mesh position={[0, 0.3, 0]} castShadow>
                <dodecahedronGeometry args={[0.5, 0]} />
                <meshStandardMaterial color="#9E9E9E" roughness={1} />
            </mesh>
            <mesh position={[0.4, 0.2, 0.3]} castShadow>
                <dodecahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial color="#757575" roughness={1} />
            </mesh>
            <mesh position={[-0.3, 0.15, 0.2]} castShadow>
                <dodecahedronGeometry args={[0.25, 0]} />
                <meshStandardMaterial color="#616161" roughness={1} />
            </mesh>
        </group>
    );
}

export function WoodenFence({ position, length = 3 }: { position: [number, number, number], length?: number }) {
    return (
        <group position={position}>
            {/* Fence posts */}
            {Array.from({ length: length }).map((_, i) => (
                <group key={i} position={[i * 1.2, 0, 0]}>
                    <mesh position={[0, 0.4, 0]} castShadow>
                        <boxGeometry args={[0.12, 0.8, 0.12]} />
                        <meshStandardMaterial color="#5D4037" roughness={0.9} />
                    </mesh>
                    {/* Post top */}
                    <mesh position={[0, 0.85, 0]} castShadow>
                        <coneGeometry args={[0.08, 0.15, 4]} />
                        <meshStandardMaterial color="#4E342E" roughness={0.9} />
                    </mesh>
                </group>
            ))}
            {/* Horizontal bars */}
            <mesh position={[(length - 1) * 0.6, 0.55, 0]} castShadow>
                <boxGeometry args={[length * 1.2 - 0.5, 0.08, 0.08]} />
                <meshStandardMaterial color="#6D4C41" roughness={0.9} />
            </mesh>
            <mesh position={[(length - 1) * 0.6, 0.25, 0]} castShadow>
                <boxGeometry args={[length * 1.2 - 0.5, 0.08, 0.08]} />
                <meshStandardMaterial color="#6D4C41" roughness={0.9} />
            </mesh>
        </group>
    );
}

export function Lantern({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Post */}
            <mesh position={[0, 1, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.07, 2, 8]} />
                <meshStandardMaterial color="#424242" roughness={0.8} />
            </mesh>
            {/* Lamp head */}
            <mesh position={[0, 2.1, 0]}>
                <boxGeometry args={[0.25, 0.3, 0.25]} />
                <meshStandardMaterial color="#3E2723" roughness={0.8} />
            </mesh>
            {/* Light */}
            <mesh position={[0, 2.1, 0]}>
                <sphereGeometry args={[0.12, 12, 12]} />
                <meshStandardMaterial color="#FFE082" emissive="#FFE082" emissiveIntensity={0.8} />
            </mesh>
        </group>
    );
}

// ==================== BRIDGE CONNECTIONS GENERATOR ====================
export function generateBridgeConnections(islandCount: number, radius: number): { start: [number, number, number], end: [number, number, number] }[] {
    const bridges: { start: [number, number, number], end: [number, number, number] }[] = [];

    // Connect adjacent islands in the circle
    for (let i = 0; i < islandCount; i++) {
        const nextI = (i + 1) % islandCount;

        const angle1 = (i / islandCount) * Math.PI * 2 - Math.PI / 2;
        const angle2 = (nextI / islandCount) * Math.PI * 2 - Math.PI / 2;

        // Edge positions of islands (not center)
        const edgeOffset = 4; // Island radius

        const start: [number, number, number] = [
            Math.cos(angle1) * radius + Math.cos(angle1 + Math.PI / islandCount) * edgeOffset,
            0,
            Math.sin(angle1) * radius + Math.sin(angle1 + Math.PI / islandCount) * edgeOffset
        ];

        const end: [number, number, number] = [
            Math.cos(angle2) * radius + Math.cos(angle2 - Math.PI / islandCount) * edgeOffset,
            0,
            Math.sin(angle2) * radius + Math.sin(angle2 - Math.PI / islandCount) * edgeOffset
        ];

        bridges.push({ start, end });
    }

    return bridges;
}
