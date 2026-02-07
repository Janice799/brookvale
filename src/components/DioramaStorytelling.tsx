'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ==================== DIORAMA STORYTELLING ELEMENTS ====================
// Adds life and narrative to the Brookvale miniature world

// ==================== ANIMATED SQUIRREL ====================
// Little 3D squirrel that scurries around islands
export function AnimatedSquirrel({
    position,
    pathRadius = 3,
    speed = 0.8,
}: {
    position: [number, number, number];
    pathRadius?: number;
    speed?: number;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const tailRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime * speed;

        // Scurry in a figure-8 path
        const x = Math.sin(t) * pathRadius;
        const z = Math.sin(t * 2) * pathRadius * 0.5;
        groupRef.current.position.x = position[0] + x;
        groupRef.current.position.z = position[2] + z;
        groupRef.current.position.y = position[1] + Math.abs(Math.sin(t * 4)) * 0.15; // tiny hop

        // Face movement direction
        const nextX = Math.sin(t + 0.05) * pathRadius;
        const nextZ = Math.sin((t + 0.05) * 2) * pathRadius * 0.5;
        groupRef.current.lookAt(
            position[0] + nextX,
            position[1],
            position[2] + nextZ
        );

        // Wag tail
        if (tailRef.current) {
            tailRef.current.rotation.z = Math.sin(t * 8) * 0.3;
        }
    });

    return (
        <group ref={groupRef} position={position} scale={0.4}>
            {/* Body */}
            <mesh>
                <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
                <meshStandardMaterial color="#8B6914" roughness={0.8} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.15, 0.35]}>
                <sphereGeometry args={[0.22, 8, 8]} />
                <meshStandardMaterial color="#A0772B" roughness={0.8} />
            </mesh>
            {/* Eyes */}
            <mesh position={[0.08, 0.22, 0.5]}>
                <sphereGeometry args={[0.04, 6, 6]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[-0.08, 0.22, 0.5]}>
                <sphereGeometry args={[0.04, 6, 6]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            {/* Nose */}
            <mesh position={[0, 0.16, 0.56]}>
                <sphereGeometry args={[0.03, 6, 6]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Ears */}
            <mesh position={[0.12, 0.35, 0.3]}>
                <sphereGeometry args={[0.06, 6, 6]} />
                <meshStandardMaterial color="#B8860B" roughness={0.8} />
            </mesh>
            <mesh position={[-0.12, 0.35, 0.3]}>
                <sphereGeometry args={[0.06, 6, 6]} />
                <meshStandardMaterial color="#B8860B" roughness={0.8} />
            </mesh>
            {/* Fluffy Tail */}
            <mesh ref={tailRef} position={[0, 0.3, -0.4]} rotation={[0.5, 0, 0]}>
                <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
                <meshStandardMaterial color="#A0772B" roughness={0.9} />
            </mesh>
            {/* Acorn in paws (it's Brookvale after all!) */}
            <mesh position={[0, -0.1, 0.3]}>
                <sphereGeometry args={[0.08, 6, 6]} />
                <meshStandardMaterial color="#8B4513" roughness={0.7} />
            </mesh>
        </group>
    );
}

// ==================== ANIMATED BUNNY ====================
// Cute bunny that hops around
export function AnimatedBunny({
    position,
    hopRadius = 2.5,
    speed = 0.5,
}: {
    position: [number, number, number];
    hopRadius?: number;
    speed?: number;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const earLeftRef = useRef<THREE.Mesh>(null);
    const earRightRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime * speed;

        // Hopping circular path
        const hopPhase = t * 3;
        const hop = Math.max(0, Math.sin(hopPhase)) * 0.5;
        groupRef.current.position.x = position[0] + Math.cos(t) * hopRadius;
        groupRef.current.position.z = position[2] + Math.sin(t) * hopRadius;
        groupRef.current.position.y = position[1] + hop;

        // Face direction
        groupRef.current.rotation.y = -t + Math.PI / 2;

        // Ear flop
        if (earLeftRef.current) earLeftRef.current.rotation.x = Math.sin(hopPhase * 2) * 0.15;
        if (earRightRef.current) earRightRef.current.rotation.x = Math.sin(hopPhase * 2 + 0.5) * 0.15;
    });

    return (
        <group ref={groupRef} position={position} scale={0.35}>
            {/* Body */}
            <mesh>
                <sphereGeometry args={[0.35, 8, 8]} />
                <meshStandardMaterial color="#F5F5DC" roughness={0.9} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.25, 0.25]}>
                <sphereGeometry args={[0.25, 8, 8]} />
                <meshStandardMaterial color="#FFFAF0" roughness={0.9} />
            </mesh>
            {/* Eyes */}
            <mesh position={[0.08, 0.3, 0.45]}>
                <sphereGeometry args={[0.04, 6, 6]} />
                <meshStandardMaterial color="#C71585" />
            </mesh>
            <mesh position={[-0.08, 0.3, 0.45]}>
                <sphereGeometry args={[0.04, 6, 6]} />
                <meshStandardMaterial color="#C71585" />
            </mesh>
            {/* Nose */}
            <mesh position={[0, 0.24, 0.49]}>
                <sphereGeometry args={[0.025, 6, 6]} />
                <meshStandardMaterial color="#FF69B4" />
            </mesh>
            {/* Ears */}
            <mesh ref={earLeftRef} position={[-0.1, 0.55, 0.15]}>
                <capsuleGeometry args={[0.05, 0.4, 4, 8]} />
                <meshStandardMaterial color="#FFE4E1" roughness={0.9} />
            </mesh>
            <mesh ref={earRightRef} position={[0.1, 0.55, 0.15]}>
                <capsuleGeometry args={[0.05, 0.4, 4, 8]} />
                <meshStandardMaterial color="#FFE4E1" roughness={0.9} />
            </mesh>
            {/* Tail puff */}
            <mesh position={[0, 0.1, -0.35]}>
                <sphereGeometry args={[0.1, 6, 6]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
            </mesh>
        </group>
    );
}

// ==================== ANIMATED BIRD ====================
// A bird that circles above the islands
export function AnimatedBird({
    position,
    radius = 15,
    height = 12,
    speed = 0.3,
    color = '#4A90D9',
}: {
    position: [number, number, number];
    radius?: number;
    height?: number;
    speed?: number;
    color?: string;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const wingLeftRef = useRef<THREE.Mesh>(null);
    const wingRightRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime * speed;

        // Circular flight path with altitude variation
        groupRef.current.position.x = position[0] + Math.cos(t) * radius;
        groupRef.current.position.z = position[2] + Math.sin(t) * radius;
        groupRef.current.position.y = height + Math.sin(t * 2) * 1.5;

        // Bank into turns
        groupRef.current.rotation.y = -t + Math.PI / 2;
        groupRef.current.rotation.z = Math.sin(t) * 0.15;

        // Wing flapping
        const wingFlap = Math.sin(state.clock.elapsedTime * 6) * 0.4;
        if (wingLeftRef.current) wingLeftRef.current.rotation.z = wingFlap;
        if (wingRightRef.current) wingRightRef.current.rotation.z = -wingFlap;
    });

    return (
        <group ref={groupRef} position={[position[0], height, position[2]]} scale={0.6}>
            {/* Body */}
            <mesh>
                <capsuleGeometry args={[0.12, 0.4, 4, 8]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.05, 0.3]}>
                <sphereGeometry args={[0.1, 6, 6]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            {/* Beak */}
            <mesh position={[0, 0, 0.42]} rotation={[0.3, 0, 0]}>
                <coneGeometry args={[0.04, 0.12, 4]} />
                <meshStandardMaterial color="#FFA500" />
            </mesh>
            {/* Left Wing */}
            <mesh ref={wingLeftRef} position={[0.25, 0.05, 0]}>
                <boxGeometry args={[0.5, 0.02, 0.3]} />
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            {/* Right Wing */}
            <mesh ref={wingRightRef} position={[-0.25, 0.05, 0]}>
                <boxGeometry args={[0.5, 0.02, 0.3]} />
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            {/* Tail */}
            <mesh position={[0, 0.05, -0.3]} rotation={[0.2, 0, 0]}>
                <boxGeometry args={[0.15, 0.02, 0.2]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
        </group>
    );
}

// ==================== WIND-BLOWN GRASS PATCHES ====================
// Animated grass that sways in the wind
export function GrassPatch({
    position,
    count = 30,
    radius = 2,
    color = '#4CAF50',
}: {
    position: [number, number, number];
    count?: number;
    radius?: number;
    color?: string;
}) {
    const grassRef = useRef<THREE.InstancedMesh>(null);

    const { matrices, phases } = useMemo(() => {
        const m: THREE.Matrix4[] = [];
        const p: number[] = [];
        const matrix = new THREE.Matrix4();

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * radius;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            const bladeHeight = 0.3 + Math.random() * 0.4;

            matrix.makeTranslation(x, bladeHeight / 2, z);
            matrix.multiply(new THREE.Matrix4().makeScale(0.03, bladeHeight, 0.03));
            matrix.multiply(new THREE.Matrix4().makeRotationY(Math.random() * Math.PI));
            m.push(matrix.clone());
            p.push(Math.random() * Math.PI * 2);
        }
        return { matrices: m, phases: p };
    }, [count, radius]);

    useFrame((state) => {
        if (!grassRef.current) return;
        const time = state.clock.elapsedTime;
        const matrix = new THREE.Matrix4();
        const tempMatrix = new THREE.Matrix4();

        for (let i = 0; i < count; i++) {
            matrix.copy(matrices[i]);
            // Wind sway
            const sway = Math.sin(time * 2 + phases[i]) * 0.15;
            tempMatrix.makeRotationZ(sway);
            matrix.multiply(tempMatrix);
            grassRef.current.setMatrixAt(i, matrix);
        }
        grassRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group position={position}>
            <instancedMesh ref={grassRef} args={[undefined, undefined, count]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
            </instancedMesh>
        </group>
    );
}

// ==================== 3D FLOATING CLOUDS ====================
// Puffy volumetric-style clouds that drift slowly
export function FloatingCloud({
    position,
    scale = 1,
    speed = 0.1,
    driftRange = 10,
}: {
    position: [number, number, number];
    scale?: number;
    speed?: number;
    driftRange?: number;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const startX = position[0];

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime * speed;
        // Slow horizontal drift
        groupRef.current.position.x = startX + Math.sin(t) * driftRange;
        // Gentle vertical bob
        groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.3;
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            {/* Cloud puffs — cluster of spheres */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[1.5, 12, 12]} />
                <meshStandardMaterial color="#FFFFFF" roughness={1} transparent opacity={0.85} />
            </mesh>
            <mesh position={[1.2, 0.2, 0.3]}>
                <sphereGeometry args={[1.2, 10, 10]} />
                <meshStandardMaterial color="#F8F8FF" roughness={1} transparent opacity={0.8} />
            </mesh>
            <mesh position={[-1.0, 0.1, -0.2]}>
                <sphereGeometry args={[1.3, 10, 10]} />
                <meshStandardMaterial color="#F0F0FF" roughness={1} transparent opacity={0.82} />
            </mesh>
            <mesh position={[0.5, -0.3, 0.5]}>
                <sphereGeometry args={[1.0, 10, 10]} />
                <meshStandardMaterial color="#FFFFFF" roughness={1} transparent opacity={0.75} />
            </mesh>
            <mesh position={[-0.5, 0.4, 0.3]}>
                <sphereGeometry args={[0.9, 8, 8]} />
                <meshStandardMaterial color="#FEFEFE" roughness={1} transparent opacity={0.78} />
            </mesh>
        </group>
    );
}

// ==================== ISLAND SIGNPOST ====================
// Directional signpost showing island names
export function Signpost({
    position,
    signs,
}: {
    position: [number, number, number];
    signs: { text: string; direction: number }[]; // direction in radians
}) {
    return (
        <group position={position}>
            {/* Post */}
            <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[0.06, 0.08, 1.6, 6]} />
                <meshStandardMaterial color="#5D4037" roughness={0.9} />
            </mesh>
            {/* Top cap */}
            <mesh position={[0, 1.65, 0]}>
                <sphereGeometry args={[0.08, 6, 6]} />
                <meshStandardMaterial color="#795548" roughness={0.8} />
            </mesh>
            {/* Sign boards */}
            {signs.map((sign, i) => (
                <group key={i} position={[0, 1.3 - i * 0.3, 0]} rotation={[0, sign.direction, 0]}>
                    <mesh position={[0.4, 0, 0]}>
                        <boxGeometry args={[0.7, 0.18, 0.03]} />
                        <meshStandardMaterial color="#DEB887" roughness={0.85} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// ==================== RAINBOW ARC ====================
// Beautiful rainbow spanning across the sky
export function RainbowArc({
    position = [0, 0, 0] as [number, number, number],
    radius = 30,
    opacity = 0.3,
}: {
    position?: [number, number, number];
    radius?: number;
    opacity?: number;
}) {
    const RAINBOW_COLORS = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8B00FF'];
    const bandWidth = 0.8;

    return (
        <group position={position} rotation={[0, 0.5, 0]}>
            {RAINBOW_COLORS.map((color, i) => {
                const innerR = radius - i * bandWidth;
                const outerR = innerR + bandWidth * 0.8;
                return (
                    <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                        <ringGeometry args={[innerR, outerR, 64, 1, 0, Math.PI]} />
                        <meshBasicMaterial
                            color={color}
                            transparent
                            opacity={opacity}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

// ==================== MUSHROOM CLUSTER ====================
// Cute fairy-tale mushrooms for decoration
export function MushroomCluster({
    position,
    count = 3,
}: {
    position: [number, number, number];
    count?: number;
}) {
    const mushrooms = useMemo(() => {
        const colors = ['#FF6B6B', '#FFB347', '#DDA0DD', '#FF69B4', '#E74C3C'];
        return Array.from({ length: count }, (_, i) => ({
            x: (Math.random() - 0.5) * 1.5,
            z: (Math.random() - 0.5) * 1.5,
            scale: 0.15 + Math.random() * 0.2,
            capColor: colors[i % colors.length],
            lean: (Math.random() - 0.5) * 0.2,
        }));
    }, [count]);

    return (
        <group position={position}>
            {mushrooms.map((m, i) => (
                <group key={i} position={[m.x, 0, m.z]} rotation={[m.lean, 0, m.lean]}>
                    {/* Stem */}
                    <mesh position={[0, m.scale * 1.2, 0]}>
                        <cylinderGeometry args={[m.scale * 0.25, m.scale * 0.35, m.scale * 2.5, 8]} />
                        <meshStandardMaterial color="#FAEBD7" roughness={0.9} />
                    </mesh>
                    {/* Cap */}
                    <mesh position={[0, m.scale * 2.6, 0]}>
                        <sphereGeometry args={[m.scale * 0.8, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color={m.capColor} roughness={0.7} />
                    </mesh>
                    {/* Spots on cap */}
                    {[0, 1, 2].map((j) => {
                        const spotAngle = (j / 3) * Math.PI * 2 + i;
                        const spotR = m.scale * 0.5;
                        return (
                            <mesh
                                key={j}
                                position={[
                                    Math.cos(spotAngle) * spotR,
                                    m.scale * 2.75,
                                    Math.sin(spotAngle) * spotR,
                                ]}
                            >
                                <sphereGeometry args={[m.scale * 0.12, 6, 6]} />
                                <meshStandardMaterial color="#FFFFFF" />
                            </mesh>
                        );
                    })}
                </group>
            ))}
        </group>
    );
}

// ==================== TREASURE CHEST ====================
// Decorative treasure chest for quest areas
export function TreasureChest({
    position,
    isOpen = false,
    glowColor = '#FFD700',
}: {
    position: [number, number, number];
    isOpen?: boolean;
    glowColor?: string;
}) {
    const lidRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!lidRef.current || !isOpen) return;
        // Gentle lid bobbing when open
        lidRef.current.rotation.x = -0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    });

    return (
        <group position={position} scale={0.5}>
            {/* Box base */}
            <mesh position={[0, 0.2, 0]}>
                <boxGeometry args={[0.8, 0.4, 0.5]} />
                <meshStandardMaterial color="#8B4513" roughness={0.8} />
            </mesh>
            {/* Metal bands */}
            <mesh position={[0, 0.2, 0.251]}>
                <boxGeometry args={[0.85, 0.06, 0.01]} />
                <meshStandardMaterial color="#B8860B" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.2, -0.251]}>
                <boxGeometry args={[0.85, 0.06, 0.01]} />
                <meshStandardMaterial color="#B8860B" metalness={0.5} roughness={0.4} />
            </mesh>
            {/* Lid */}
            <mesh
                ref={lidRef}
                position={[0, 0.42, -0.22]}
                rotation={[isOpen ? -0.6 : 0, 0, 0]}
            >
                <boxGeometry args={[0.82, 0.08, 0.52]} />
                <meshStandardMaterial color="#A0522D" roughness={0.7} />
            </mesh>
            {/* Lock */}
            <mesh position={[0, 0.3, 0.26]}>
                <boxGeometry args={[0.1, 0.1, 0.02]} />
                <meshStandardMaterial color="#DAA520" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Glow when open */}
            {isOpen && (
                <pointLight
                    position={[0, 0.5, 0]}
                    color={glowColor}
                    intensity={2}
                    distance={3}
                />
            )}
        </group>
    );
}

// ==================== DIORAMA STORYTELLING MANAGER ====================
// Orchestrates all storytelling elements in the scene
export function DioramaStorytelling({
    enableCreatures = true,
    enableClouds = true,
    enableDetails = true,
    performanceLevel = 'high',
}: {
    enableCreatures?: boolean;
    enableClouds?: boolean;
    enableDetails?: boolean;
    performanceLevel?: string;
}) {
    // Skip on low-end devices
    if (performanceLevel === 'low') return null;

    return (
        <>
            {/* ===== CREATURES ===== */}
            {enableCreatures && (
                <>
                    {/* Squirrels near forest islands */}
                    <AnimatedSquirrel position={[10, 3.5, -15]} pathRadius={3} speed={0.6} />
                    <AnimatedSquirrel position={[-18, 3.5, -10]} pathRadius={2} speed={0.9} />

                    {/* Bunny near Tiny Wins garden */}
                    <AnimatedBunny position={[20, 3.5, -5]} hopRadius={2} speed={0.4} />

                    {/* Birds circling overhead */}
                    <AnimatedBird position={[0, 15, 0]} radius={25} speed={0.2} color="#4A90D9" />
                    {performanceLevel === 'high' && (
                        <>
                            <AnimatedBird position={[5, 18, 5]} radius={30} speed={0.15} color="#E67E22" />
                            <AnimatedBird position={[-10, 20, 0]} radius={20} speed={0.25} color="#27AE60" />
                        </>
                    )}
                </>
            )}

            {/* ===== FLOATING CLOUDS ===== */}
            {enableClouds && (
                <>
                    <FloatingCloud position={[20, 25, -20]} scale={1.2} speed={0.08} driftRange={12} />
                    <FloatingCloud position={[-25, 22, 15]} scale={0.9} speed={0.12} driftRange={8} />
                    <FloatingCloud position={[0, 28, 25]} scale={1.5} speed={0.06} driftRange={15} />
                    {performanceLevel === 'high' && (
                        <>
                            <FloatingCloud position={[30, 20, 0]} scale={0.7} speed={0.1} driftRange={10} />
                            <FloatingCloud position={[-15, 26, -25]} scale={1.1} speed={0.09} driftRange={12} />
                        </>
                    )}
                </>
            )}

            {/* ===== DECORATIVE DETAILS ===== */}
            {enableDetails && (
                <>
                    {/* Mushroom clusters near forest areas */}
                    <MushroomCluster position={[12, 3.2, -18]} count={4} />
                    <MushroomCluster position={[-22, 3.2, -12]} count={3} />

                    {/* Grass patches around islands */}
                    <GrassPatch position={[15, 3.2, -10]} count={25} radius={2} color="#66BB6A" />
                    <GrassPatch position={[-15, 3.2, -15]} count={20} radius={1.5} color="#4CAF50" />
                    <GrassPatch position={[0, 3.2, 20]} count={15} radius={2} color="#81C784" />

                    {/* Signposts at key junctions */}
                    <Signpost
                        position={[0, 3.2, 0]}
                        signs={[
                            { text: 'Forest', direction: -Math.PI / 4 },
                            { text: 'Town', direction: Math.PI / 4 },
                            { text: 'Lake', direction: Math.PI * 0.75 },
                        ]}
                    />

                    {/* Treasure chests near quest areas */}
                    <TreasureChest position={[8, 3.5, -20]} isOpen={false} />
                    <TreasureChest position={[-5, 3.5, 18]} isOpen={true} glowColor="#FFD700" />

                    {/* Rainbow arc in the sky */}
                    {performanceLevel === 'high' && (
                        <RainbowArc position={[0, 15, -30]} radius={35} opacity={0.15} />
                    )}
                </>
            )}
        </>
    );
}
