'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==================== ARCHITECTURAL DETAILS ====================
// Windows, doors, signs, and decorative elements for buildings

// ==================== WINDOW COMPONENT ====================
export function Window({
    position,
    size = [0.4, 0.5, 0.05],
    frameColor = '#5D4037',
    glassColor = '#87CEEB',
    glowing = false
}: {
    position: [number, number, number],
    size?: [number, number, number],
    frameColor?: string,
    glassColor?: string,
    glowing?: boolean
}) {
    return (
        <group position={position}>
            {/* Window frame */}
            <mesh>
                <boxGeometry args={[size[0] + 0.08, size[1] + 0.08, size[2]]} />
                <meshStandardMaterial color={frameColor} roughness={0.9} />
            </mesh>
            {/* Glass */}
            <mesh position={[0, 0, 0.02]}>
                <boxGeometry args={size} />
                <meshStandardMaterial
                    color={glassColor}
                    transparent
                    opacity={0.6}
                    emissive={glowing ? '#FFF8DC' : '#000000'}
                    emissiveIntensity={glowing ? 0.5 : 0}
                    metalness={0.1}
                    roughness={0.2}
                />
            </mesh>
            {/* Window cross divider */}
            <mesh position={[0, 0, 0.04]}>
                <boxGeometry args={[size[0], 0.03, 0.02]} />
                <meshStandardMaterial color={frameColor} />
            </mesh>
            <mesh position={[0, 0, 0.04]}>
                <boxGeometry args={[0.03, size[1], 0.02]} />
                <meshStandardMaterial color={frameColor} />
            </mesh>
        </group>
    );
}

// ==================== ROUND WINDOW ====================
export function RoundWindow({
    position,
    radius = 0.25,
    frameColor = '#5D4037',
    glassColor = '#87CEEB',
    glowing = false
}: {
    position: [number, number, number],
    radius?: number,
    frameColor?: string,
    glassColor?: string,
    glowing?: boolean
}) {
    return (
        <group position={position}>
            {/* Frame */}
            <mesh>
                <cylinderGeometry args={[radius + 0.04, radius + 0.04, 0.05, 24]} />
                <meshStandardMaterial color={frameColor} roughness={0.9} />
            </mesh>
            {/* Glass */}
            <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[radius, 24]} />
                <meshStandardMaterial
                    color={glassColor}
                    transparent
                    opacity={0.6}
                    emissive={glowing ? '#FFF8DC' : '#000000'}
                    emissiveIntensity={glowing ? 0.5 : 0}
                />
            </mesh>
        </group>
    );
}

// ==================== DOOR COMPONENT ====================
export function Door({
    position,
    size = [0.5, 0.8, 0.08],
    doorColor = '#6D4C41',
    frameColor = '#4E342E',
    hasWindow = false
}: {
    position: [number, number, number],
    size?: [number, number, number],
    doorColor?: string,
    frameColor?: string,
    hasWindow?: boolean
}) {
    return (
        <group position={position}>
            {/* Door frame */}
            <mesh>
                <boxGeometry args={[size[0] + 0.12, size[1] + 0.12, size[2] - 0.02]} />
                <meshStandardMaterial color={frameColor} roughness={0.9} />
            </mesh>
            {/* Door panel */}
            <mesh position={[0, 0, 0.02]}>
                <RoundedBox args={size} radius={0.03}>
                    <meshStandardMaterial color={doorColor} roughness={0.8} />
                </RoundedBox>
            </mesh>
            {/* Door handle */}
            <mesh position={[size[0] * 0.35, 0, 0.06]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.7} />
            </mesh>
            {/* Optional window */}
            {hasWindow && (
                <mesh position={[0, size[1] * 0.25, 0.05]}>
                    <boxGeometry args={[size[0] * 0.5, size[1] * 0.25, 0.02]} />
                    <meshStandardMaterial
                        color="#87CEEB"
                        transparent
                        opacity={0.6}
                    />
                </mesh>
            )}
        </group>
    );
}

// ==================== SIGN/SIGNBOARD ====================
export function Signboard({
    position,
    text = 'SHOP',
    backgroundColor = '#5D4037',
    textColor = '#FFD54F',
    size = [1.2, 0.4, 0.1]
}: {
    position: [number, number, number],
    text?: string,
    backgroundColor?: string,
    textColor?: string,
    size?: [number, number, number]
}) {
    return (
        <group position={position}>
            {/* Sign board */}
            <RoundedBox args={size} radius={0.05} castShadow>
                <meshStandardMaterial color={backgroundColor} roughness={0.8} />
            </RoundedBox>
            {/* Text */}
            <Html position={[0, 0, size[2] / 2 + 0.01]} center transform>
                <div style={{
                    fontFamily: "'Fredoka One', 'Nunito', sans-serif",
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: textColor,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                    whiteSpace: 'nowrap',
                }}>
                    {text}
                </div>
            </Html>
            {/* Sign support posts */}
            <mesh position={[-size[0] * 0.4, -size[1] * 0.7, 0]} castShadow>
                <cylinderGeometry args={[0.03, 0.03, size[1], 8]} />
                <meshStandardMaterial color="#4E342E" roughness={0.9} />
            </mesh>
            <mesh position={[size[0] * 0.4, -size[1] * 0.7, 0]} castShadow>
                <cylinderGeometry args={[0.03, 0.03, size[1], 8]} />
                <meshStandardMaterial color="#4E342E" roughness={0.9} />
            </mesh>
        </group>
    );
}

// ==================== HANGING SIGN ====================
export function HangingSign({
    position,
    text = '☕',
    backgroundColor = '#8B4513'
}: {
    position: [number, number, number],
    text?: string,
    backgroundColor?: string
}) {
    const signRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (signRef.current) {
            // Gentle swinging animation
            signRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
        }
    });

    return (
        <group position={position}>
            {/* Bracket */}
            <mesh position={[-0.3, 0.15, 0]}>
                <boxGeometry args={[0.6, 0.05, 0.05]} />
                <meshStandardMaterial color="#4E342E" roughness={0.9} />
            </mesh>
            {/* Chains */}
            <mesh position={[-0.4, 0, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.3, 6]} />
                <meshStandardMaterial color="#9E9E9E" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[-0.1, 0, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.3, 6]} />
                <meshStandardMaterial color="#9E9E9E" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Sign (animated) */}
            <group ref={signRef} position={[-0.25, -0.25, 0]}>
                <RoundedBox args={[0.5, 0.4, 0.06]} radius={0.03} castShadow>
                    <meshStandardMaterial color={backgroundColor} roughness={0.8} />
                </RoundedBox>
                <Html position={[0, 0, 0.04]} center transform>
                    <div style={{ fontSize: '1.2rem' }}>{text}</div>
                </Html>
            </group>
        </group>
    );
}

// ==================== CHIMNEY ====================
export function Chimney({
    position,
    color = '#8D6E63',
    hasSmoke = true
}: {
    position: [number, number, number],
    color?: string,
    hasSmoke?: boolean
}) {
    return (
        <group position={position}>
            {/* Chimney base */}
            <mesh castShadow>
                <boxGeometry args={[0.35, 0.6, 0.35]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            {/* Chimney top rim */}
            <mesh position={[0, 0.35, 0]} castShadow>
                <boxGeometry args={[0.45, 0.1, 0.45]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            {/* Smoke particles (static representation) */}
            {hasSmoke && (
                <>
                    <mesh position={[0, 0.6, 0]}>
                        <sphereGeometry args={[0.12, 8, 8]} />
                        <meshStandardMaterial
                            color="#E0E0E0"
                            transparent
                            opacity={0.6}
                        />
                    </mesh>
                    <mesh position={[0.1, 0.85, 0.05]}>
                        <sphereGeometry args={[0.1, 8, 8]} />
                        <meshStandardMaterial
                            color="#EEEEEE"
                            transparent
                            opacity={0.4}
                        />
                    </mesh>
                    <mesh position={[-0.05, 1.05, -0.05]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshStandardMaterial
                            color="#F5F5F5"
                            transparent
                            opacity={0.3}
                        />
                    </mesh>
                </>
            )}
        </group>
    );
}

// ==================== AWNING ====================
export function Awning({
    position,
    width = 1.5,
    color = '#E53935',
    stripeColor = '#FFFFFF'
}: {
    position: [number, number, number],
    width?: number,
    color?: string,
    stripeColor?: string
}) {
    return (
        <group position={position}>
            {/* Main awning */}
            <mesh rotation={[Math.PI / 6, 0, 0]} castShadow>
                <boxGeometry args={[width, 0.05, 0.6]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            {/* Stripes */}
            {[-2, -1, 0, 1, 2].map((i) => (
                <mesh
                    key={i}
                    position={[i * width * 0.2, 0, 0]}
                    rotation={[Math.PI / 6, 0, 0]}
                >
                    <boxGeometry args={[width * 0.1, 0.06, 0.62]} />
                    <meshStandardMaterial color={stripeColor} roughness={0.9} />
                </mesh>
            ))}
            {/* Frame */}
            <mesh position={[-width * 0.48, 0.15, -0.3]}>
                <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
                <meshStandardMaterial color="#424242" roughness={0.8} />
            </mesh>
            <mesh position={[width * 0.48, 0.15, -0.3]}>
                <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
                <meshStandardMaterial color="#424242" roughness={0.8} />
            </mesh>
        </group>
    );
}

// ==================== FLOWER BOX ====================
export function FlowerBox({
    position,
    width = 0.8,
    boxColor = '#5D4037',
    flowerColors = ['#FF69B4', '#FFD700', '#FF6B6B']
}: {
    position: [number, number, number],
    width?: number,
    boxColor?: string,
    flowerColors?: string[]
}) {
    return (
        <group position={position}>
            {/* Box */}
            <mesh castShadow>
                <boxGeometry args={[width, 0.2, 0.2]} />
                <meshStandardMaterial color={boxColor} roughness={0.9} />
            </mesh>
            {/* Soil */}
            <mesh position={[0, 0.08, 0]}>
                <boxGeometry args={[width - 0.04, 0.05, 0.16]} />
                <meshStandardMaterial color="#4E342E" roughness={1} />
            </mesh>
            {/* Flowers */}
            {flowerColors.map((color, i) => (
                <group key={i} position={[(i - 1) * (width * 0.3), 0.2, 0]}>
                    {/* Stem */}
                    <mesh>
                        <cylinderGeometry args={[0.015, 0.015, 0.2, 6]} />
                        <meshStandardMaterial color="#4CAF50" />
                    </mesh>
                    {/* Flower head */}
                    <mesh position={[0, 0.12, 0]}>
                        <sphereGeometry args={[0.06, 8, 8]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// ==================== MAILBOX ====================
export function Mailbox({
    position,
    boxColor = '#2196F3'
}: {
    position: [number, number, number],
    boxColor?: string
}) {
    return (
        <group position={position}>
            {/* Post */}
            <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
                <meshStandardMaterial color="#5D4037" roughness={0.9} />
            </mesh>
            {/* Mailbox body */}
            <mesh position={[0, 0.9, 0]} castShadow>
                <RoundedBox args={[0.3, 0.25, 0.2]} radius={0.03}>
                    <meshStandardMaterial color={boxColor} roughness={0.7} />
                </RoundedBox>
            </mesh>
            {/* Flag */}
            <mesh position={[0.18, 0.95, 0]} rotation={[0, 0, -Math.PI / 4]}>
                <boxGeometry args={[0.12, 0.02, 0.02]} />
                <meshStandardMaterial color="#F44336" />
            </mesh>
        </group>
    );
}

// ==================== BENCH ====================
export function Bench({
    position,
    rotation = [0, 0, 0] as [number, number, number],
    woodColor = '#8B4513'
}: {
    position: [number, number, number],
    rotation?: [number, number, number],
    woodColor?: string
}) {
    return (
        <group position={position} rotation={rotation}>
            {/* Seat */}
            <mesh position={[0, 0.35, 0]} castShadow>
                <boxGeometry args={[0.8, 0.08, 0.3]} />
                <meshStandardMaterial color={woodColor} roughness={0.9} />
            </mesh>
            {/* Backrest */}
            <mesh position={[0, 0.55, -0.12]} rotation={[0.2, 0, 0]} castShadow>
                <boxGeometry args={[0.8, 0.3, 0.06]} />
                <meshStandardMaterial color={woodColor} roughness={0.9} />
            </mesh>
            {/* Legs */}
            {[-0.3, 0.3].map((x) => (
                <mesh key={x} position={[x, 0.17, 0]} castShadow>
                    <boxGeometry args={[0.06, 0.34, 0.3]} />
                    <meshStandardMaterial color="#4E342E" roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
}

// ==================== STREET LAMP ====================
export function StreetLamp({
    position,
    height = 2,
    postColor = '#37474F',
    lightColor = '#FFE082'
}: {
    position: [number, number, number],
    height?: number,
    postColor?: string,
    lightColor?: string
}) {
    const glowRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (glowRef.current) {
            const material = glowRef.current.material as THREE.MeshStandardMaterial;
            material.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
        }
    });

    return (
        <group position={position}>
            {/* Post */}
            <mesh position={[0, height / 2, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.08, height, 8]} />
                <meshStandardMaterial color={postColor} roughness={0.7} metalness={0.3} />
            </mesh>
            {/* Lamp head */}
            <mesh position={[0, height + 0.1, 0]}>
                <coneGeometry args={[0.15, 0.2, 8]} />
                <meshStandardMaterial color={postColor} roughness={0.7} metalness={0.3} />
            </mesh>
            {/* Light bulb */}
            <mesh ref={glowRef} position={[0, height - 0.05, 0]}>
                <sphereGeometry args={[0.1, 12, 12]} />
                <meshStandardMaterial
                    color={lightColor}
                    emissive={lightColor}
                    emissiveIntensity={0.8}
                />
            </mesh>
        </group>
    );
}

// ==================== WELL ====================
export function Well({
    position
}: {
    position: [number, number, number]
}) {
    return (
        <group position={position}>
            {/* Well base */}
            <mesh position={[0, 0.25, 0]} castShadow>
                <cylinderGeometry args={[0.5, 0.55, 0.5, 12]} />
                <meshStandardMaterial color="#9E9E9E" roughness={1} />
            </mesh>
            {/* Water inside */}
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 0.1, 12]} />
                <meshStandardMaterial
                    color="#4FC3F7"
                    transparent
                    opacity={0.8}
                    emissive="#00B0FF"
                    emissiveIntensity={0.2}
                />
            </mesh>
            {/* Roof support posts */}
            <mesh position={[-0.4, 0.6, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
                <meshStandardMaterial color="#6D4C41" roughness={0.9} />
            </mesh>
            <mesh position={[0.4, 0.6, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
                <meshStandardMaterial color="#6D4C41" roughness={0.9} />
            </mesh>
            {/* Beam */}
            <mesh position={[0, 0.95, 0]} castShadow>
                <boxGeometry args={[0.9, 0.06, 0.06]} />
                <meshStandardMaterial color="#5D4037" roughness={0.9} />
            </mesh>
            {/* Roof */}
            <mesh position={[0, 1.15, 0]} castShadow>
                <coneGeometry args={[0.6, 0.4, 4]} />
                <meshStandardMaterial color="#8D6E63" roughness={0.9} />
            </mesh>
        </group>
    );
}
