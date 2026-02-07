'use client';

import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// ==================== 17 APP ISLAND 3D POSITIONS ====================
// Positions on the image texture (0-1 normalized coordinates)
interface Island3DData {
    id: string;
    emoji: string;
    name: string;
    // Position on plane (normalized 0-1)
    u: number;
    v: number;
}

const ISLANDS_3D: Island3DData[] = [
    // Top area
    { id: 'focus-cat', emoji: '🐱', name: 'Focus Cat', u: 0.50, v: 0.15 },
    { id: 'character-settings', emoji: '🎭', name: 'Character', u: 0.35, v: 0.12 },
    { id: 'mind-cloud', emoji: '☁️', name: 'Mind Cloud', u: 0.42, v: 0.18 },

    // Upper right
    { id: 'tiny-wins', emoji: '🌱', name: 'Tiny Wins', u: 0.68, v: 0.18 },
    { id: 'stretch-timer', emoji: '🧘', name: 'Stretch Timer', u: 0.80, v: 0.30 },

    // Right side
    { id: 'goal-tycoon', emoji: '🏗️', name: 'Goal Tycoon', u: 0.85, v: 0.50 },
    { id: 'daily-quest', emoji: '⚔️', name: 'Daily Quest', u: 0.82, v: 0.65 },

    // Lower right
    { id: 'acorn-archive', emoji: '📚', name: 'Acorn Archive', u: 0.70, v: 0.75 },
    { id: 'acorn-bank', emoji: '🏦', name: 'Acorn Bank', u: 0.58, v: 0.82 },

    // Bottom
    { id: 'vibe-painter', emoji: '🎨', name: 'Vibe Painter', u: 0.45, v: 0.88 },
    { id: 'menu-oracle', emoji: '🔮', name: 'Menu Oracle', u: 0.32, v: 0.85 },

    // Lower left
    { id: 'karma-ripple', emoji: '💧', name: 'Karma Ripple', u: 0.20, v: 0.75 },
    { id: 'rhythm-surfer', emoji: '🎵', name: 'Rhythm Surfer', u: 0.12, v: 0.62 },

    // Left side
    { id: 'dream-catcher', emoji: '🌙', name: 'Dream Catcher', u: 0.12, v: 0.48 },
    { id: 'star-note', emoji: '⭐', name: 'Star Note', u: 0.15, v: 0.35 },

    // Upper left
    { id: 'breath-bubble', emoji: '🫧', name: 'Breath Bubble', u: 0.22, v: 0.22 },
    { id: 'sleep-nest', emoji: '😴', name: 'Sleep Nest', u: 0.30, v: 0.35 },
];

// ==================== WORLD MAP PLANE ====================
function WorldMapPlane({ onIslandClick, questApps }: { onIslandClick: (id: string) => void; questApps: string[] }) {
    const texture = useTexture('/world-map.png');
    const planeRef = useRef<THREE.Mesh>(null);
    const [hoveredIsland, setHoveredIsland] = useState<string | null>(null);

    // Make texture crisp
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // Plane dimensions (16:9 aspect or 1:1)
    const planeWidth = 40;
    const planeHeight = 40;

    // Convert UV to 3D position on plane
    const uvTo3D = (u: number, v: number): [number, number, number] => {
        const x = (u - 0.5) * planeWidth;
        const y = 0.5; // Slightly above plane
        const z = (v - 0.5) * planeHeight;
        return [x, y, z];
    };

    return (
        <group>
            {/* The main map plane */}
            <mesh
                ref={planeRef}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[planeWidth, planeHeight]} />
                <meshStandardMaterial
                    map={texture}
                    transparent={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Island Markers */}
            {ISLANDS_3D.map((island) => {
                const pos = uvTo3D(island.u, island.v);
                const isHovered = hoveredIsland === island.id;
                const hasQuest = questApps.includes(island.id);

                return (
                    <group key={island.id} position={pos}>
                        {/* Invisible click sphere */}
                        <mesh
                            onClick={() => onIslandClick(island.id)}
                            onPointerOver={() => setHoveredIsland(island.id)}
                            onPointerOut={() => setHoveredIsland(null)}
                        >
                            <sphereGeometry args={[1.5, 16, 16]} />
                            <meshBasicMaterial transparent opacity={0} />
                        </mesh>

                        {/* Emoji Marker */}
                        <Html
                            center
                            position={[0, 1, 0]}
                            style={{
                                pointerEvents: 'none',
                                userSelect: 'none',
                            }}
                        >
                            <div style={{
                                fontSize: isHovered ? '2.5rem' : '2rem',
                                transition: 'all 0.3s ease',
                                transform: isHovered ? 'translateY(-5px)' : 'none',
                                filter: `drop-shadow(0 2px 8px rgba(0,0,0,0.6)) ${isHovered ? 'drop-shadow(0 0 15px gold)' : ''}`,
                                animation: hasQuest ? 'bounce 0.6s infinite' : 'none',
                            }}>
                                {island.emoji}
                                {hasQuest && <span style={{ position: 'absolute', top: -10, right: -10, fontSize: '1rem' }}>❗</span>}
                            </div>
                        </Html>

                        {/* Name label on hover */}
                        {isHovered && (
                            <Html center position={[0, 2.5, 0]}>
                                <div style={{
                                    background: 'rgba(0,0,0,0.85)',
                                    color: 'white',
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    border: '1px solid rgba(255,215,0,0.5)',
                                }}>
                                    {island.name}
                                </div>
                            </Html>
                        )}

                        {/* Glow ring for quests */}
                        {hasQuest && (
                            <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[1.2, 1.8, 32]} />
                                <meshBasicMaterial
                                    color="#ff6b6b"
                                    transparent
                                    opacity={0.5}
                                    side={THREE.DoubleSide}
                                />
                            </mesh>
                        )}
                    </group>
                );
            })}
        </group>
    );
}

// ==================== AMBIENT SCENE ELEMENTS ====================
function AmbientElements() {
    const birdsRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (birdsRef.current) {
            // Animate birds flying
            birdsRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.3) * 15;
            birdsRef.current.position.z = Math.cos(state.clock.elapsedTime * 0.2) * 10;
        }
    });

    return (
        <group ref={birdsRef} position={[0, 10, 0]}>
            <Html center>
                <div style={{ fontSize: '1.5rem', opacity: 0.7 }}>🐦</div>
            </Html>
        </group>
    );
}

// ==================== MAIN 3D WORLD MAP COMPONENT ====================
interface World3DMapProps {
    onAppClick: (appId: string) => void;
    questApps?: string[];
}

export default function World3DMap({ onAppClick, questApps = [] }: World3DMapProps) {
    return (
        <div style={{
            width: '100%',
            height: '100vh',
            background: '#0D1B3E',
        }}>
            <Canvas
                camera={{ position: [0, 35, 25], fov: 50 }}
                shadows
                style={{ background: 'linear-gradient(180deg, #0D1B3E 0%, #1A2B5A 50%, #0F1E3A 100%)' }}
            >
                {/* Lighting */}
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
                <pointLight position={[-10, 15, -10]} intensity={0.5} color="#89CFF0" />

                {/* Fog for depth */}
                <fog attach="fog" args={['#0D1B3E', 50, 120]} />

                {/* World Map */}
                <Suspense fallback={null}>
                    <WorldMapPlane onIslandClick={onAppClick} questApps={questApps} />
                </Suspense>

                {/* Ambient birds */}
                <AmbientElements />

                {/* Camera Controls */}
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI / 2.5}
                    minDistance={15}
                    maxDistance={60}
                    target={[0, 0, 0]}
                />
            </Canvas>

            {/* UI Overlay */}
            <div style={{
                position: 'absolute',
                top: 16,
                left: 16,
                zIndex: 10,
            }}>
                <div style={{
                    fontFamily: "'Fredoka One', sans-serif",
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    color: '#FFD54F',
                    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                }}>
                    🌰 Brookvale
                </div>
                <div style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.8rem',
                    marginTop: 4,
                }}>
                    드래그로 회전 • 스크롤로 줌
                </div>
            </div>

            {/* CSS for animations */}
            <style jsx global>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>
        </div>
    );
}
