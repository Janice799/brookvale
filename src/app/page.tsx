'use client';

import { useState, useRef, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, RoundedBox, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';
import { Language, getTranslation, defaultLanguage } from '@/lib/i18n';
import { questDefinitions, defaultPlayerProfile, PlayerProfile, timeUntilDailyReset } from '@/lib/questData';
import { SoundControls, useBrookvaleSound } from '@/components/SoundControls';
import { playUISound, startZoneAmbient, initializeAudio } from '@/lib/soundManager';
import type { ZoneAmbient } from '@/lib/soundManager';
import { DynamicLighting, DynamicSky } from '@/components/3d/DynamicLighting';
import { ParticleEffectManager, triggerParticleEffect } from '@/components/3d/ParticleEffects';
import { WeatherManager, WeatherControl } from '@/components/3d/WeatherSystem';
import { Lake, Pond, WaterSurface } from '@/components/3d/WaterSystem';
import { LoadingScreen, TouchJoystick, usePerformanceLevel, getQualitySettings, PerformanceIndicator } from '@/components/3d/PerformanceOptimization';
import { IslandWorld, APP_ISLANDS, getCircularPosition } from '@/components/3d/AppIslands';
import { WoodenBridge, generateBridgeConnections } from '@/components/3d/WorldElements';
import { PostProcessingEffects, PRESET_CINEMATIC } from '@/components/3d/PostProcessing';
import { DioramaStorytelling } from '@/components/3d/DioramaStorytelling';
import { usePageTransition } from '@/components/PageTransition';

// ==================== MOBILE DETECTION HOOK ====================
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'mobile'];
            const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword));
            const isSmallScreen = window.innerWidth <= 768;
            setIsMobile(isMobileDevice || isSmallScreen);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
}

// ==================== KEYBOARD INPUT HOOK ====================
function useKeyboard() {
    const [keys, setKeys] = useState({
        forward: false,
        backward: false,
        left: false,
        right: false,
        shift: false,
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            setKeys(prev => ({
                ...prev,
                forward: key === 'w' || key === 'arrowup' ? true : prev.forward,
                backward: key === 's' || key === 'arrowdown' ? true : prev.backward,
                left: key === 'a' || key === 'arrowleft' ? true : prev.left,
                right: key === 'd' || key === 'arrowright' ? true : prev.right,
                shift: e.shiftKey,
            }));
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            setKeys(prev => ({
                ...prev,
                forward: key === 'w' || key === 'arrowup' ? false : prev.forward,
                backward: key === 's' || key === 'arrowdown' ? false : prev.backward,
                left: key === 'a' || key === 'arrowleft' ? false : prev.left,
                right: key === 'd' || key === 'arrowright' ? false : prev.right,
                shift: e.shiftKey,
            }));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return keys;
}

// ==================== ZONE COLORS (3D Mini World Style - Bright & Colorful) ====================
const ZONE_COLORS = {
    forest: {
        ground: '#7DD87D',  // Bright green
        accent: '#5BC85B',  // Fresh green
        building: '#98E698', // Light green
        base: '#4CAF50',    // Base green
    },
    town: {
        ground: '#FFD966',  // Bright yellow
        accent: '#FFCC33',  // Sunny yellow
        building: '#FFE699', // Light yellow
        base: '#FFC107',    // Base yellow
    },
    lake: {
        ground: '#B388FF',  // Bright purple
        accent: '#9C6FE4',  // Soft purple
        building: '#D1B3FF', // Light lavender
        base: '#7C4DFF',    // Base purple
    },
    hill: {
        ground: '#64B5F6',  // Bright blue
        accent: '#42A5F5',  // Sky blue
        building: '#90CAF9', // Light blue
        base: '#2196F3',    // Base blue
    },
    cloud: {
        ground: '#F5F5F5',  // White
        accent: '#E8F5E9',  // Mint white
        building: '#FFFFFF', // Pure white
        base: '#E0E0E0',    // Light gray
    },
};

// ==================== LANDMARK DATA ====================
// All 17 apps - positions are now determined by circular layout in IslandWorld
const landmarks = [
    // Wellness & Focus
    { id: 'focus-cat', emoji: '🐱', zone: 'forest', position: [0, 0, 0] },
    { id: 'tiny-wins', emoji: '🌱', zone: 'forest', position: [0, 0, 0] },
    { id: 'stretch-timer', emoji: '🧘', zone: 'forest', position: [0, 0, 0] },

    // Productivity
    { id: 'goal-tycoon', emoji: '🏗️', zone: 'town', position: [0, 0, 0] },
    { id: 'daily-quest', emoji: '⚔️', zone: 'town', position: [0, 0, 0] },
    { id: 'acorn-archive', emoji: '📚', zone: 'town', position: [0, 0, 0] },
    { id: 'acorn-bank', emoji: '🏦', zone: 'town', position: [0, 0, 0] },

    // Creativity & Fun
    { id: 'vibe-painter', emoji: '🎨', zone: 'lake', position: [0, 0, 0] },
    { id: 'menu-oracle', emoji: '🔮', zone: 'lake', position: [0, 0, 0] },
    { id: 'karma-ripple', emoji: '💧', zone: 'lake', position: [0, 0, 0] },
    { id: 'rhythm-surfer', emoji: '🎵', zone: 'hill', position: [0, 0, 0] },

    // Sleep & Dreams
    { id: 'dream-catcher', emoji: '🌙', zone: 'hill', position: [0, 0, 0] },
    { id: 'star-note', emoji: '⭐', zone: 'hill', position: [0, 0, 0] },

    // Mindfulness
    { id: 'breath-bubble', emoji: '🫧', zone: 'cloud', position: [0, 0, 0] },
    { id: 'mind-cloud', emoji: '☁️', zone: 'cloud', position: [0, 0, 0] },
    { id: 'sleep-nest', emoji: '😴', zone: 'cloud', position: [0, 0, 0] },

    // Character
    { id: 'character-settings', emoji: '🎭', zone: 'cloud', position: [0, 0, 0] },
];

// ==================== MINI WORLD BUILDING (Zone-Specific Styles) ====================
function MiniWorldBuilding({
    landmark,
    zone,
    onClick,
    isSelected,
    hasQuest,
    t,
}: {
    landmark: typeof landmarks[0],
    zone: 'forest' | 'town' | 'lake' | 'hill' | 'cloud',
    onClick: () => void,
    isSelected: boolean,
    hasQuest: boolean,
    t: ReturnType<typeof getTranslation>
}) {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const landmarkId = landmark.id as keyof typeof t.landmarks;
    const landmarkInfo = t.landmarks[landmarkId];

    useFrame((state) => {
        if (groupRef.current) {
            // Gentle floating animation
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5 + landmark.position[0]) * 0.1;
            if (hovered) {
                groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 3) * 0.08;
                groupRef.current.scale.setScalar(1.08);
            } else {
                groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + landmark.position[2]) * 0.02;
                groupRef.current.scale.setScalar(1);
            }
        }
    });

    // Zone-specific building renderer
    const renderBuilding = () => {
        switch (zone) {
            case 'forest':
                // 🍄 Mushroom House Style
                return (
                    <group>
                        {/* Mushroom stem (house body) */}
                        <mesh position={[0, 0.6, 0]} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} castShadow>
                            <cylinderGeometry args={[0.6, 0.8, 1.2, 16]} />
                            <meshStandardMaterial color="#F5DEB3" roughness={0.9} emissive={hovered ? "#F5DEB3" : "#000"} emissiveIntensity={hovered ? 0.2 : 0} />
                        </mesh>
                        {/* Mushroom cap (roof) */}
                        <mesh position={[0, 1.6, 0]} castShadow>
                            <sphereGeometry args={[1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                            <meshStandardMaterial color="#E63946" roughness={0.8} />
                        </mesh>
                        {/* White dots on cap */}
                        {[0, 1.2, 2.4, 3.6, 4.8].map((angle, i) => (
                            <mesh key={i} position={[Math.cos(angle) * 0.7, 1.9, Math.sin(angle) * 0.7]}>
                                <sphereGeometry args={[0.15, 8, 8]} />
                                <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
                            </mesh>
                        ))}
                        {/* Door */}
                        <RoundedBox args={[0.4, 0.6, 0.1]} radius={0.1} position={[0, 0.35, 0.75]}>
                            <meshStandardMaterial color="#5D4037" roughness={0.9} />
                        </RoundedBox>
                        {/* Window */}
                        <mesh position={[0.45, 0.8, 0.51]}>
                            <circleGeometry args={[0.15, 16]} />
                            <meshStandardMaterial color="#FFF8DC" emissive="#FFE4B5" emissiveIntensity={0.4} />
                        </mesh>
                    </group>
                );

            case 'town':
                // 🏪 Pastel Shop Style
                return (
                    <group>
                        {/* Main shop building */}
                        <RoundedBox args={[2, 1.8, 1.8]} radius={0.15} position={[0, 0.9, 0]} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} castShadow>
                            <meshStandardMaterial color="#FFE4E1" roughness={0.85} emissive={hovered ? "#FFE4E1" : "#000"} emissiveIntensity={hovered ? 0.15 : 0} />
                        </RoundedBox>
                        {/* Awning */}
                        <RoundedBox args={[2.4, 0.25, 0.8]} radius={0.08} position={[0, 1.95, 0.7]}>
                            <meshStandardMaterial color="#FF6B6B" roughness={0.9} />
                        </RoundedBox>
                        {/* Roof */}
                        <RoundedBox args={[2.2, 0.4, 2]} radius={0.1} position={[0, 2.1, 0]} castShadow>
                            <meshStandardMaterial color="#FFB347" roughness={0.9} />
                        </RoundedBox>
                        {/* Shop window */}
                        <RoundedBox args={[1.2, 0.8, 0.05]} radius={0.05} position={[0, 1.1, 0.9]}>
                            <meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={0.3} transparent opacity={0.8} />
                        </RoundedBox>
                        {/* Door */}
                        <RoundedBox args={[0.5, 0.9, 0.1]} radius={0.08} position={[0, 0.5, 0.86]}>
                            <meshStandardMaterial color="#8B4513" roughness={0.9} />
                        </RoundedBox>
                        {/* Flower box */}
                        <RoundedBox args={[0.8, 0.2, 0.25]} radius={0.05} position={[0.65, 0.7, 0.9]}>
                            <meshStandardMaterial color="#5D4037" roughness={0.9} />
                        </RoundedBox>
                    </group>
                );

            case 'lake':
                // 💎 Crystal Tower Style
                return (
                    <group>
                        {/* Crystal base */}
                        <mesh position={[0, 0.3, 0]} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} castShadow>
                            <cylinderGeometry args={[0.8, 1, 0.6, 6]} />
                            <meshStandardMaterial color="#E1BEE7" roughness={0.3} metalness={0.2} emissive={hovered ? "#CE93D8" : "#000"} emissiveIntensity={hovered ? 0.3 : 0} />
                        </mesh>
                        {/* Main crystal body */}
                        <mesh position={[0, 1.3, 0]} castShadow>
                            <cylinderGeometry args={[0.6, 0.8, 1.6, 6]} />
                            <meshStandardMaterial color="#B388FF" roughness={0.2} metalness={0.4} transparent opacity={0.9} />
                        </mesh>
                        {/* Crystal peak */}
                        <mesh position={[0, 2.5, 0]} castShadow>
                            <coneGeometry args={[0.6, 1, 6]} />
                            <meshStandardMaterial color="#D1C4E9" roughness={0.1} metalness={0.5} emissive="#B388FF" emissiveIntensity={0.2} />
                        </mesh>
                        {/* Small floating crystals */}
                        {[0, 2, 4].map((angle, i) => (
                            <mesh key={i} position={[Math.cos(angle) * 0.9, 1 + i * 0.3, Math.sin(angle) * 0.9]} rotation={[0.2, angle, 0.1]}>
                                <octahedronGeometry args={[0.2]} />
                                <meshStandardMaterial color="#E1BEE7" emissive="#CE93D8" emissiveIntensity={0.4} transparent opacity={0.8} />
                            </mesh>
                        ))}
                    </group>
                );

            case 'hill':
                // ⭐ Starlight Observatory Style
                return (
                    <group>
                        {/* Observatory base */}
                        <mesh position={[0, 0.5, 0]} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} castShadow>
                            <cylinderGeometry args={[0.9, 1.1, 1, 8]} />
                            <meshStandardMaterial color="#5C6BC0" roughness={0.7} emissive={hovered ? "#7986CB" : "#000"} emissiveIntensity={hovered ? 0.2 : 0} />
                        </mesh>
                        {/* Dome roof */}
                        <mesh position={[0, 1.3, 0]} castShadow>
                            <sphereGeometry args={[1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                            <meshStandardMaterial color="#3F51B5" roughness={0.6} metalness={0.3} />
                        </mesh>
                        {/* Telescope opening */}
                        <mesh position={[0.4, 1.6, 0.4]} rotation={[0.3, 0.5, 0]}>
                            <cylinderGeometry args={[0.15, 0.2, 0.8, 8]} />
                            <meshStandardMaterial color="#1A237E" roughness={0.5} />
                        </mesh>
                        {/* Star decorations */}
                        {[0, 1.5, 3, 4.5].map((angle, i) => (
                            <mesh key={i} position={[Math.cos(angle) * 0.6, 1.5, Math.sin(angle) * 0.6]}>
                                <octahedronGeometry args={[0.12]} />
                                <meshStandardMaterial color="#FFD54F" emissive="#FFD54F" emissiveIntensity={0.8} />
                            </mesh>
                        ))}
                        {/* Window band */}
                        <mesh position={[0, 0.7, 0]} rotation={[0, 0, 0]}>
                            <torusGeometry args={[0.95, 0.08, 8, 32]} />
                            <meshStandardMaterial color="#FFF8E1" emissive="#FFE082" emissiveIntensity={0.4} />
                        </mesh>
                    </group>
                );

            case 'cloud':
                // ☁️ Cloud Palace Style
                return (
                    <group>
                        {/* Fluffy cloud base */}
                        <group position={[0, 0.4, 0]} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
                            <mesh position={[0, 0, 0]} castShadow>
                                <sphereGeometry args={[0.8, 16, 16]} />
                                <meshStandardMaterial color="#FFFFFF" roughness={1} emissive={hovered ? "#F5F5F5" : "#000"} emissiveIntensity={hovered ? 0.2 : 0} />
                            </mesh>
                            <mesh position={[-0.5, -0.1, 0.3]} castShadow>
                                <sphereGeometry args={[0.5, 16, 16]} />
                                <meshStandardMaterial color="#F8F8FF" roughness={1} />
                            </mesh>
                            <mesh position={[0.5, -0.1, 0.2]} castShadow>
                                <sphereGeometry args={[0.55, 16, 16]} />
                                <meshStandardMaterial color="#FFFFFF" roughness={1} />
                            </mesh>
                        </group>
                        {/* Pastel tower on cloud */}
                        <RoundedBox args={[0.9, 1.4, 0.9]} radius={0.15} position={[0, 1.5, 0]} castShadow>
                            <meshStandardMaterial color="#E8F5E9" roughness={0.9} />
                        </RoundedBox>
                        {/* Pointed roof */}
                        <mesh position={[0, 2.5, 0]} castShadow>
                            <coneGeometry args={[0.7, 0.8, 8]} />
                            <meshStandardMaterial color="#F8BBD9" roughness={0.8} />
                        </mesh>
                        {/* Rainbow accent */}
                        <mesh position={[0, 2.95, 0]}>
                            <sphereGeometry args={[0.15, 16, 16]} />
                            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
                        </mesh>
                        {/* Small windows */}
                        <mesh position={[0.46, 1.4, 0]}>
                            <circleGeometry args={[0.12, 16]} />
                            <meshStandardMaterial color="#E1F5FE" emissive="#B3E5FC" emissiveIntensity={0.3} />
                        </mesh>
                    </group>
                );

            default:
                return null;
        }
    };

    return (
        <group
            ref={groupRef}
            position={[landmark.position[0], landmark.position[1], landmark.position[2]]}
        >
            {renderBuilding()}

            {hasQuest && hovered && (
                <Html position={[0, 3.5, 0]} center zIndexRange={[0, 50]}>
                    <div className="mini-quest-marker">❗</div>
                </Html>
            )}

            {/* Building Emoji - ALWAYS visible above the building */}
            <Html position={[0, 3.5, 0]} center zIndexRange={[0, 50]}>
                <div
                    className="building-emoji-always"
                    style={{
                        fontSize: hovered ? '2rem' : '1.5rem',
                        transition: 'all 0.2s ease',
                        textShadow: '0 2px 6px rgba(0,0,0,0.6), 0 0 12px rgba(255,255,255,0.4)',
                        transform: hovered ? 'scale(1.2) translateY(-5px)' : 'scale(1)',
                        cursor: 'pointer',
                    }}
                    onClick={onClick}
                >
                    {landmark.emoji}
                </div>
            </Html>

            {/* Name label on hover */}
            {hovered && landmarkInfo && (
                <Html position={[0, 4.2, 0]} center zIndexRange={[0, 50]}>
                    <div className="building-label">
                        {landmarkInfo.name}
                    </div>
                </Html>
            )}
        </group>
    );
}

// ==================== FLOATING ISLAND (Diorama Block) ====================
function FloatingIsland({
    zone,
    position,
    buildings,
    onBuildingClick,
    selectedLandmark,
    questLandmarks,
    t,
}: {
    zone: 'forest' | 'town' | 'lake' | 'hill' | 'cloud',
    position: [number, number, number],
    buildings: typeof landmarks,
    onBuildingClick: (landmark: typeof landmarks[0]) => void,
    selectedLandmark: typeof landmarks[0] | null,
    questLandmarks: string[],
    t: ReturnType<typeof getTranslation>
}) {
    const groupRef = useRef<THREE.Group>(null);

    // MINI WORLD color scheme - distinct layers
    const ISLAND_COLORS = {
        forest: { grass: '#7CB342', dirt: '#8D6E63', stone: '#6D4C41' },
        town: { grass: '#9CCC65', dirt: '#A1887F', stone: '#8D6E63' },
        lake: { grass: '#81C784', dirt: '#7B5E57', stone: '#5D4037' },
        hill: { grass: '#4DB6AC', dirt: '#78909C', stone: '#546E7A' },
        cloud: { grass: '#E3F2FD', dirt: '#B0BEC5', stone: '#90A4AE' },
    };
    const colors = ISLAND_COLORS[zone];

    useFrame((state) => {
        if (groupRef.current) {
            // Very gentle floating - MINI WORLD style
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.4 + position[0]) * 0.08;
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* ===== MINI WORLD STYLE ISLAND LAYERS ===== */}

            {/* TOP: Grass/Surface Layer - Chunky Block */}
            <RoundedBox
                args={[20, 2, 16]}
                radius={0.3}
                smoothness={2}
                position={[0, 0, 0]}
                receiveShadow
                castShadow
            >
                <meshStandardMaterial
                    color={colors.grass}
                    roughness={0.95}
                    metalness={0}
                />
            </RoundedBox>

            {/* MIDDLE: Dirt Layer - Slightly smaller */}
            <RoundedBox
                args={[19, 3, 15]}
                radius={0.2}
                smoothness={2}
                position={[0, -2.5, 0]}
                castShadow
            >
                <meshStandardMaterial
                    color={colors.dirt}
                    roughness={1}
                    metalness={0}
                />
            </RoundedBox>

            {/* BOTTOM: Stone/Rock Layer - Even smaller, rougher */}
            <RoundedBox
                args={[17, 2.5, 13]}
                radius={0.15}
                smoothness={2}
                position={[0, -5, 0]}
                castShadow
            >
                <meshStandardMaterial
                    color={colors.stone}
                    roughness={1}
                    metalness={0}
                />
            </RoundedBox>

            {/* Hanging rocks underneath */}
            <mesh position={[-6, -6.5, -4]} castShadow>
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial color={colors.stone} roughness={1} />
            </mesh>
            <mesh position={[5, -7, 3]} castShadow>
                <boxGeometry args={[1.5, 2.5, 1.5]} />
                <meshStandardMaterial color={colors.stone} roughness={1} />
            </mesh>
            <mesh position={[0, -6.8, -5]} castShadow>
                <boxGeometry args={[1, 1.5, 1]} />
                <meshStandardMaterial color={colors.stone} roughness={1} />
            </mesh>

            {/* Walking path - center line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0.02, 2]} receiveShadow>
                <planeGeometry args={[10, 2]} />
                <meshStandardMaterial
                    color={zone === 'cloud' ? '#D0E8F5' : '#D4C5A9'}
                    roughness={1}
                    transparent
                    opacity={0.6}
                />
            </mesh>

            {/* Decorative elements based on zone - MINI WORLD STYLE */}
            {zone === 'forest' && (
                <>
                    {/* MINI WORLD: Large chunky pine trees */}
                    <group position={[-7, 1, -5]}>
                        <mesh position={[0, 0, 0]} castShadow>
                            <cylinderGeometry args={[0.4, 0.6, 2, 8]} />
                            <meshStandardMaterial color="#5D4037" roughness={0.9} />
                        </mesh>
                        <mesh position={[0, 2, 0]} castShadow>
                            <coneGeometry args={[2, 3, 8]} />
                            <meshStandardMaterial color="#2E7D32" roughness={0.9} />
                        </mesh>
                        <mesh position={[0, 3.5, 0]} castShadow>
                            <coneGeometry args={[1.5, 2.5, 8]} />
                            <meshStandardMaterial color="#388E3C" roughness={0.9} />
                        </mesh>
                        <mesh position={[0, 4.8, 0]} castShadow>
                            <coneGeometry args={[1, 2, 8]} />
                            <meshStandardMaterial color="#43A047" roughness={0.9} />
                        </mesh>
                    </group>
                    <group position={[7, 1, -4]} scale={0.8}>
                        <mesh position={[0, 0, 0]} castShadow>
                            <cylinderGeometry args={[0.4, 0.6, 2, 8]} />
                            <meshStandardMaterial color="#5D4037" roughness={0.9} />
                        </mesh>
                        <mesh position={[0, 2, 0]} castShadow>
                            <coneGeometry args={[2, 3, 8]} />
                            <meshStandardMaterial color="#1B5E20" roughness={0.9} />
                        </mesh>
                        <mesh position={[0, 3.5, 0]} castShadow>
                            <coneGeometry args={[1.5, 2.5, 8]} />
                            <meshStandardMaterial color="#2E7D32" roughness={0.9} />
                        </mesh>
                    </group>
                    <group position={[-6, 1, 5]} scale={0.7}>
                        <mesh position={[0, 0, 0]} castShadow>
                            <cylinderGeometry args={[0.3, 0.5, 1.5, 8]} />
                            <meshStandardMaterial color="#4E342E" roughness={0.9} />
                        </mesh>
                        <mesh position={[0, 1.8, 0]} castShadow>
                            <coneGeometry args={[1.8, 2.5, 8]} />
                            <meshStandardMaterial color="#388E3C" roughness={0.9} />
                        </mesh>
                    </group>

                    {/* MINI WORLD: Cave/Rock Formation */}
                    <group position={[6, 1, 4]}>
                        <mesh position={[0, 0.8, 0]} castShadow>
                            <sphereGeometry args={[2, 8, 8]} />
                            <meshStandardMaterial color="#8D6E63" roughness={1} />
                        </mesh>
                        <mesh position={[-0.5, 0.5, 1.2]}>
                            <sphereGeometry args={[0.8, 8, 8]} />
                            <meshStandardMaterial color="#3E2723" roughness={1} />
                        </mesh>
                    </group>

                    {/* MINI WORLD: Large Rocks */}
                    <mesh position={[-3, 1, 0]} castShadow>
                        <dodecahedronGeometry args={[1.2, 0]} />
                        <meshStandardMaterial color="#9E9E9E" roughness={1} />
                    </mesh>
                    <mesh position={[4, 1, -4]} castShadow>
                        <dodecahedronGeometry args={[0.8, 0]} />
                        <meshStandardMaterial color="#757575" roughness={1} />
                    </mesh>

                    {/* Wooden fence along edge */}
                    {[-5, -3, -1, 1, 3].map((x, i) => (
                        <group key={i} position={[x, 1, -6]}>
                            <mesh position={[0, 0.4, 0]} castShadow>
                                <boxGeometry args={[0.15, 1.2, 0.15]} />
                                <meshStandardMaterial color="#5D4037" roughness={0.9} />
                            </mesh>
                            <mesh position={[0, 0.8, 0]} castShadow>
                                <boxGeometry args={[0.1, 0.15, 0.1]} />
                                <meshStandardMaterial color="#4E342E" roughness={0.9} />
                            </mesh>
                        </group>
                    ))}
                    {/* Fence horizontal bars */}
                    <mesh position={[-3, 1.3, -6]} castShadow>
                        <boxGeometry args={[5, 0.1, 0.1]} />
                        <meshStandardMaterial color="#6D4C41" roughness={0.9} />
                    </mesh>
                    <mesh position={[2, 1.3, -6]} castShadow>
                        <boxGeometry args={[3, 0.1, 0.1]} />
                        <meshStandardMaterial color="#6D4C41" roughness={0.9} />
                    </mesh>

                    {/* Small flowers */}
                    {[[-2, 1, 2], [0, 1, 3], [3, 1, 2], [-4, 1, 3]].map((pos, i) => (
                        <group key={i} position={pos as [number, number, number]}>
                            <mesh position={[0, 0.2, 0]}>
                                <sphereGeometry args={[0.15, 8, 8]} />
                                <meshStandardMaterial color={['#FF6B6B', '#FFE66D', '#FF69B4', '#87CEEB'][i]} roughness={0.9} />
                            </mesh>
                            <mesh position={[0, 0, 0]}>
                                <cylinderGeometry args={[0.03, 0.03, 0.3, 6]} />
                                <meshStandardMaterial color="#4CAF50" roughness={0.9} />
                            </mesh>
                        </group>
                    ))}
                </>
            )}

            {zone === 'town' && (
                <>
                    {/* Decorative buildings */}
                    <SmallHouse position={[-4, 0, 4]} color="#FFB5A7" />
                    <SmallHouse position={[8, 0, 4]} color="#B5E2A8" scale={0.8} />
                    <SmallHouse position={[-3, 0, -2]} color="#FCD5CE" scale={0.7} />
                    {/* Fences */}
                    <Fence position={[-3, 0, 1]} />
                    <Fence position={[7, 0, 1]} />
                    <Fence position={[1, 0, 6]} />
                    {/* NEW: Garden benches for town square */}
                    <GardenBench position={[1, 0, 3]} rotation={0} />
                    <GardenBench position={[3, 0, 3]} rotation={Math.PI} />
                    {/* NEW: Path stones through town */}
                    <PathStones position={[0, 0, 0]} count={6} />
                    {/* NEW: Flower beds */}
                    <FlowerBed position={[-1, 0, 5]} scale={0.8} />
                    <FlowerBed position={[6, 0, 0]} scale={0.7} />
                    {/* Lamp posts with glowing tops */}
                    <group position={[0, 0, 2]}>
                        <mesh position={[0, 1.2, 0]}>
                            <cylinderGeometry args={[0.06, 0.08, 2.4, 8]} />
                            <meshStandardMaterial color="#4A4A4A" />
                        </mesh>
                        <mesh position={[0, 2.5, 0]}>
                            <sphereGeometry args={[0.15, 16, 16]} />
                            <meshStandardMaterial color="#FFE4B5" emissive="#FFE4B5" emissiveIntensity={0.5} />
                        </mesh>
                    </group>
                    <group position={[4, 0, 2]}>
                        <mesh position={[0, 1.2, 0]}>
                            <cylinderGeometry args={[0.06, 0.08, 2.4, 8]} />
                            <meshStandardMaterial color="#4A4A4A" />
                        </mesh>
                        <mesh position={[0, 2.5, 0]}>
                            <sphereGeometry args={[0.15, 16, 16]} />
                            <meshStandardMaterial color="#FFE4B5" emissive="#FFE4B5" emissiveIntensity={0.5} />
                        </mesh>
                    </group>
                </>
            )}

            {zone === 'lake' && (
                <>
                    {/* Magical water puddles */}
                    <WaterPuddle position={[-3, 0, 4]} scale={1.3} />
                    <WaterPuddle position={[7, 0, 4]} scale={1.1} />
                    <WaterPuddle position={[2, 0, -2]} scale={0.8} />
                    {/* Crystals */}
                    <Crystal position={[-4, 0, -1]} />
                    <Crystal position={[8, 0, 0]} scale={0.7} />
                    <Crystal position={[0, 0, 6]} scale={0.5} />
                    <Crystal position={[4, 0, 7]} scale={0.6} />
                    {/* NEW: Lily pads with flowers */}
                    <LilyPad position={[-2.5, 0.05, 4.2]} hasFlower={true} />
                    <LilyPad position={[-3.3, 0.05, 3.6]} hasFlower={false} scale={0.7} />
                    <LilyPad position={[7.3, 0.05, 4.4]} hasFlower={true} scale={0.9} />
                    <LilyPad position={[6.6, 0.05, 3.8]} hasFlower={false} scale={0.6} />
                    {/* NEW: Magical flowers */}
                    <FlowerBed position={[-1, 0, 0]} scale={0.8} />
                    <FlowerBed position={[6, 0, 6]} scale={0.7} />
                    {/* NEW: Butterflies */}
                    <Butterfly position={[2, 1.5, 3]} color="#DDA0DD" />
                </>
            )}

            {zone === 'hill' && (
                <>
                    {/* Stars/sparkles */}
                    <StarDecor position={[-3, 1.5, 1]} />
                    <StarDecor position={[7, 1.2, 3]} scale={0.8} />
                    <StarDecor position={[2, 1.8, 6]} scale={0.6} />
                    <StarDecor position={[-2, 1, 5]} scale={0.5} />
                    <StarDecor position={[5, 1.4, -1]} scale={0.7} />
                    {/* Moon rocks */}
                    <MoonRock position={[8, 0, -1]} />
                    <MoonRock position={[-4, 0, 5]} />
                    <MoonRock position={[0, 0, 7]} />
                    {/* NEW: Telescope for stargazing */}
                    <Telescope position={[5, 0, 4]} />
                    {/* NEW: Magical flower bed */}
                    <FlowerBed position={[-2, 0, 2]} scale={0.8} />
                    {/* Glowing orbs */}
                    <mesh position={[2, 0.5, 2]}>
                        <sphereGeometry args={[0.4, 16, 16]} />
                        <meshStandardMaterial
                            color="#E0AAFF"
                            emissive="#E0AAFF"
                            emissiveIntensity={0.5}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>
                    <mesh position={[-3, 0.3, 3]}>
                        <sphereGeometry args={[0.25, 16, 16]} />
                        <meshStandardMaterial
                            color="#87CEEB"
                            emissive="#87CEEB"
                            emissiveIntensity={0.4}
                            transparent
                            opacity={0.7}
                        />
                    </mesh>
                </>
            )}

            {zone === 'cloud' && (
                <>
                    {/* Cloud puffs */}
                    <CloudPuff position={[-4, 0.5, 1]} />
                    <CloudPuff position={[8, 0.4, 3]} scale={0.8} />
                    <CloudPuff position={[-2, 0.3, 6]} scale={0.7} />
                    <CloudPuff position={[6, 0.6, -1]} scale={0.6} />
                    <CloudPuff position={[2, 0.5, 7]} scale={0.9} />
                    {/* Floating bubbles */}
                    <FloatingBubble position={[-3, 1.5, 4]} />
                    <FloatingBubble position={[7, 1.3, 5]} scale={0.8} />
                    <FloatingBubble position={[2, 2, 7]} scale={0.6} />
                    <FloatingBubble position={[0, 1.8, 0]} scale={0.5} />
                    {/* NEW: Rainbow */}
                    <Rainbow position={[2, 2, 0]} />
                    {/* NEW: Flowers */}
                    <FlowerBed position={[-1, 0, 3]} scale={0.8} />
                    <FlowerBed position={[5, 0, 5]} scale={0.7} />
                    {/* NEW: Butterfly */}
                    <Butterfly position={[0, 2, 3]} color="#FFE4E1" />
                </>
            )}

            {/* Buildings on island */}
            {buildings.map((building) => (
                <MiniWorldBuilding
                    key={building.id}
                    landmark={building}
                    zone={zone}
                    onClick={() => onBuildingClick(building)}
                    isSelected={selectedLandmark?.id === building.id}
                    hasQuest={questLandmarks.includes(building.id)}
                    t={t}
                />
            ))}

            {/* Zone signpost - embedded on island surface */}
            <group position={[zone === 'cloud' ? -3 : -4, 0, zone === 'cloud' ? 4 : 5]}>
                {/* Wooden post */}
                <mesh position={[0, 0.6, 0]}>
                    <cylinderGeometry args={[0.08, 0.1, 1.2, 8]} />
                    <meshStandardMaterial color="#5D4037" roughness={0.9} />
                </mesh>
                {/* Wooden sign board */}
                <RoundedBox args={[2.2, 0.7, 0.12]} radius={0.05} position={[0, 1.3, 0]}>
                    <meshStandardMaterial color="#8B5A2B" roughness={0.8} />
                </RoundedBox>
                {/* Sign text */}
                <Html
                    position={[0, 1.3, 0.08]}
                    center
                    transform
                    scale={0.4}
                    zIndexRange={[0, 50]}
                    style={{ pointerEvents: 'none' }}
                >
                    <div style={{
                        color: '#FFF8E1',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
                        whiteSpace: 'nowrap',
                    }}>
                        {zone === 'forest' && '🌲'}{zone === 'town' && '🏘️'}{zone === 'lake' && '💧'}{zone === 'hill' && '🌙'}{zone === 'cloud' && '☁️'}
                        {' '}{t.zones[zone]}
                    </div>
                </Html>
            </group>
        </group>
    );
}

// ==================== DECORATIVE ELEMENTS ====================
function ChunkyTree({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    return (
        <group position={position} scale={scale}>
            {/* Trunk */}
            <RoundedBox args={[0.4, 1.2, 0.4]} radius={0.1} position={[0, 0.6, 0]}>
                <meshStandardMaterial color="#7F5539" roughness={0.9} />
            </RoundedBox>
            {/* Foliage - cloud-like clusters */}
            <mesh position={[0, 1.5, 0]}>
                <sphereGeometry args={[0.7, 16, 16]} />
                <meshStandardMaterial color="#2D6A4F" roughness={0.95} />
            </mesh>
            <mesh position={[-0.3, 1.8, 0.2]}>
                <sphereGeometry args={[0.5, 16, 16]} />
                <meshStandardMaterial color="#40916C" roughness={0.95} />
            </mesh>
            <mesh position={[0.3, 2, -0.1]}>
                <sphereGeometry args={[0.45, 16, 16]} />
                <meshStandardMaterial color="#52B788" roughness={0.95} />
            </mesh>
        </group>
    );
}

function Mushroom({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    return (
        <group position={position} scale={scale}>
            <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 0.3, 8]} />
                <meshStandardMaterial color="#F5F5DC" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.35, 0]}>
                <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#E63946" roughness={0.9} />
            </mesh>
        </group>
    );
}

function SmallHouse({ position, color, scale = 1 }: { position: [number, number, number], color: string, scale?: number }) {
    return (
        <group position={position} scale={scale}>
            <RoundedBox args={[0.8, 0.6, 0.8]} radius={0.1} position={[0, 0.3, 0]}>
                <meshStandardMaterial color={color} roughness={0.9} />
            </RoundedBox>
            <mesh position={[0, 0.75, 0]}>
                <coneGeometry args={[0.6, 0.5, 4]} />
                <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
        </group>
    );
}

function Fence({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {[0, 0.4, 0.8].map((x, i) => (
                <RoundedBox key={i} args={[0.1, 0.4, 0.1]} radius={0.02} position={[x, 0.2, 0]}>
                    <meshStandardMaterial color="#8B4513" roughness={0.9} />
                </RoundedBox>
            ))}
            <RoundedBox args={[1, 0.08, 0.05]} radius={0.02} position={[0.4, 0.3, 0]}>
                <meshStandardMaterial color="#A0522D" roughness={0.9} />
            </RoundedBox>
        </group>
    );
}

function WaterPuddle({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ref.current) {
            const mat = ref.current.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });
    return (
        <mesh ref={ref} position={[position[0], 0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
            <circleGeometry args={[0.5, 16]} />
            <meshStandardMaterial color="#48CAE4" emissive="#48CAE4" emissiveIntensity={0.2} transparent opacity={0.8} />
        </mesh>
    );
}

function Crystal({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.elapsedTime * 0.5;
        }
    });
    return (
        <mesh ref={ref} position={[position[0], 0.4 * scale, position[2]]} scale={scale}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color="#E0AAFF" emissive="#E0AAFF" emissiveIntensity={0.3} transparent opacity={0.9} />
        </mesh>
    );
}

function StarDecor({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.elapsedTime;
            ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });
    return (
        <mesh ref={ref} position={position} scale={scale}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#FFE066" emissive="#FFE066" emissiveIntensity={0.5} />
        </mesh>
    );
}

function MoonRock({ position }: { position: [number, number, number] }) {
    return (
        <mesh position={[position[0], 0.25, position[2]]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#4A4E69" roughness={1} />
        </mesh>
    );
}

// ==================== CLOUD HAVEN DECORATIONS ====================
function CloudPuff({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Gentle floating animation
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.15;
        }
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            {/* Soft cloud puff - multiple overlapping spheres */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshStandardMaterial color="#FFFFFF" roughness={1} transparent opacity={0.85} />
            </mesh>
            <mesh position={[-0.25, -0.1, 0]}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#F8FBFF" roughness={1} transparent opacity={0.8} />
            </mesh>
            <mesh position={[0.25, -0.05, 0]}>
                <sphereGeometry args={[0.35, 16, 16]} />
                <meshStandardMaterial color="#FFFFFF" roughness={1} transparent opacity={0.8} />
            </mesh>
        </group>
    );
}

function FloatingBubble({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const startY = position[1];

    useFrame((state) => {
        if (meshRef.current) {
            // Float up and down gently
            meshRef.current.position.y = startY + Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.3;
            // Subtle scale pulsing
            const s = scale * (1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
            meshRef.current.scale.setScalar(s);
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[0.25, 32, 32]} />
            <meshStandardMaterial
                color="#87CEEB"
                emissive="#87CEEB"
                emissiveIntensity={0.2}
                transparent
                opacity={0.6}
                roughness={0.1}
                metalness={0.3}
            />
        </mesh>
    );
}

// ==================== NEW GARDEN DECORATIONS ====================
// Colorful Flower
function Flower({ position, color = '#FF69B4', scale = 1 }: { position: [number, number, number], color?: string, scale?: number }) {
    return (
        <group position={position} scale={scale}>
            {/* Stem */}
            <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.02, 0.03, 0.3, 6]} />
                <meshStandardMaterial color="#228B22" roughness={0.9} />
            </mesh>
            {/* Petals */}
            {[0, 1, 2, 3, 4].map((i) => (
                <mesh key={i} position={[Math.cos(i * 1.26) * 0.08, 0.35, Math.sin(i * 1.26) * 0.08]} rotation={[0.3, i * 1.26, 0]}>
                    <sphereGeometry args={[0.06, 8, 8]} />
                    <meshStandardMaterial color={color} roughness={0.8} />
                </mesh>
            ))}
            {/* Center */}
            <mesh position={[0, 0.35, 0]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#FFD700" roughness={0.8} />
            </mesh>
        </group>
    );
}

// Flower Bed (cluster of flowers)
function FlowerBed({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    const colors = ['#FF69B4', '#FF6B6B', '#FFE66D', '#4ECDC4', '#A78BFA', '#F472B6'];
    return (
        <group position={position} scale={scale}>
            {[...Array(6)].map((_, i) => (
                <Flower
                    key={i}
                    position={[
                        (Math.random() - 0.5) * 0.8,
                        0,
                        (Math.random() - 0.5) * 0.8
                    ]}
                    color={colors[i % colors.length]}
                    scale={0.7 + Math.random() * 0.5}
                />
            ))}
        </group>
    );
}

// Animated Butterfly
function Butterfly({ position, color = '#FFB6C1' }: { position: [number, number, number], color?: string }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Flying pattern
            const time = state.clock.elapsedTime;
            groupRef.current.position.x = position[0] + Math.sin(time * 0.7) * 1.5;
            groupRef.current.position.y = position[1] + Math.sin(time * 1.2) * 0.3;
            groupRef.current.position.z = position[2] + Math.cos(time * 0.5) * 1.5;
            // Wing flap rotation
            groupRef.current.rotation.z = Math.sin(time * 8) * 0.4;
        }
    });

    return (
        <group ref={groupRef} position={position} scale={0.3}>
            {/* Body */}
            <mesh>
                <capsuleGeometry args={[0.05, 0.3, 4, 8]} />
                <meshStandardMaterial color="#2C2C2C" />
            </mesh>
            {/* Wings */}
            <mesh position={[0.15, 0, 0]} rotation={[0, 0, 0.3]}>
                <circleGeometry args={[0.2, 16]} />
                <meshStandardMaterial color={color} side={2} transparent opacity={0.8} />
            </mesh>
            <mesh position={[-0.15, 0, 0]} rotation={[0, 0, -0.3]}>
                <circleGeometry args={[0.2, 16]} />
                <meshStandardMaterial color={color} side={2} transparent opacity={0.8} />
            </mesh>
        </group>
    );
}

// Lily Pad with Flower
function LilyPad({ position, hasFlower = true, scale = 1 }: { position: [number, number, number], hasFlower?: boolean, scale?: number }) {
    return (
        <group position={position} scale={scale}>
            {/* Pad */}
            <mesh rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}>
                <circleGeometry args={[0.4, 16]} />
                <meshStandardMaterial color="#228B22" roughness={0.9} />
            </mesh>
            {/* Flower */}
            {hasFlower && (
                <group position={[0, 0.1, 0]}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <mesh key={i} position={[Math.cos(i * 1.05) * 0.1, 0.05, Math.sin(i * 1.05) * 0.1]} rotation={[0.5, i * 1.05, 0]}>
                            <sphereGeometry args={[0.08, 8, 8]} />
                            <meshStandardMaterial color="#FF69B4" roughness={0.8} />
                        </mesh>
                    ))}
                    <mesh position={[0, 0.08, 0]}>
                        <sphereGeometry args={[0.05, 8, 8]} />
                        <meshStandardMaterial color="#FFD700" roughness={0.8} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

// Telescope
function Telescope({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Tripod */}
            {[0, 1, 2].map((i) => (
                <mesh key={i} position={[Math.cos(i * 2.09) * 0.2, 0.4, Math.sin(i * 2.09) * 0.2]} rotation={[0.3, i * 2.09, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
                    <meshStandardMaterial color="#8B4513" roughness={0.9} />
                </mesh>
            ))}
            {/* Telescope body */}
            <mesh position={[0, 0.9, 0]} rotation={[0.5, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.12, 0.6, 12]} />
                <meshStandardMaterial color="#4A4A4A" metalness={0.3} roughness={0.5} />
            </mesh>
            {/* Lens */}
            <mesh position={[0, 1.1, 0.2]} rotation={[0.5, 0, 0]}>
                <circleGeometry args={[0.08, 16]} />
                <meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={0.3} />
            </mesh>
        </group>
    );
}

// Mini Rainbow
function Rainbow({ position }: { position: [number, number, number] }) {
    const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#A78BFA', '#F472B6'];
    return (
        <group position={position} rotation={[0, 0, 0]}>
            {colors.map((color, i) => (
                <mesh key={i} position={[0, 0.3 + i * 0.08, 0]} rotation={[0, 0, 0]}>
                    <torusGeometry args={[1.5 - i * 0.1, 0.04, 8, 32, Math.PI]} />
                    <meshStandardMaterial color={color} transparent opacity={0.7} />
                </mesh>
            ))}
        </group>
    );
}

// Garden Bench
function GardenBench({ position, rotation = 0 }: { position: [number, number, number], rotation?: number }) {
    return (
        <group position={position} rotation={[0, rotation, 0]}>
            {/* Seat */}
            <RoundedBox args={[0.8, 0.08, 0.3]} radius={0.02} position={[0, 0.35, 0]}>
                <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </RoundedBox>
            {/* Back */}
            <RoundedBox args={[0.8, 0.4, 0.06]} radius={0.02} position={[0, 0.6, -0.12]}>
                <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </RoundedBox>
            {/* Legs */}
            {[-0.3, 0.3].map((x, i) => (
                <mesh key={i} position={[x, 0.17, 0]}>
                    <boxGeometry args={[0.06, 0.34, 0.25]} />
                    <meshStandardMaterial color="#5D4037" roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
}

// Garden Path Stones
function PathStones({ position, count = 5 }: { position: [number, number, number], count?: number }) {
    return (
        <group position={position}>
            {[...Array(count)].map((_, i) => (
                <mesh key={i} position={[i * 0.6, 0.02, (Math.random() - 0.5) * 0.3]} rotation={[-Math.PI / 2, 0, Math.random()]}>
                    <circleGeometry args={[0.15 + Math.random() * 0.1, 8]} />
                    <meshStandardMaterial color="#9E9E9E" roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// ==================== 3D PLAYER CHARACTER ====================
// Character color palettes for different character types
const CHARACTER_PALETTES: { [key: string]: { body: string; accent: string; ears?: string } } = {
    bunny: { body: '#F5E6D3', accent: '#FFB6C1', ears: '#FFD4DC' },
    fox: { body: '#E07A5F', accent: '#FFFFFF', ears: '#C46847' },
    bear: { body: '#8B6914', accent: '#A67548', ears: '#6B4F12' },
    cat: { body: '#808080', accent: '#4A4A4A', ears: '#696969' },
    dog: { body: '#D2691E', accent: '#FFFFFF', ears: '#B8550D' },
    penguin: { body: '#2C3E50', accent: '#FFFFFF' },
    panda: { body: '#FFFFFF', accent: '#2C3E50', ears: '#2C3E50' },
    unicorn: { body: '#FFFFFF', accent: '#E0AAFF', ears: '#DDA0DD' },
    dragon: { body: '#228B22', accent: '#FFD700', ears: '#1B6B1B' },
};

// Movement speed constants
const MOVE_SPEED = 8;
const RUN_SPEED = 14;

interface PlayerCharacterProps {
    characterId: string;
    name?: string;
    keys: {
        forward: boolean;
        backward: boolean;
        left: boolean;
        right: boolean;
        shift: boolean;
    };
    onPositionChange: (position: [number, number, number]) => void;
    initialPosition: [number, number, number];
}

function PlayerCharacter3D({ characterId, name, keys, onPositionChange, initialPosition }: PlayerCharacterProps) {
    const groupRef = useRef<THREE.Group>(null);
    const palette = CHARACTER_PALETTES[characterId] || CHARACTER_PALETTES.bunny;
    const positionRef = useRef<THREE.Vector3>(new THREE.Vector3(...initialPosition));
    const rotationRef = useRef<number>(0);
    const isMoving = keys.forward || keys.backward || keys.left || keys.right;
    const isRunning = isMoving && keys.shift;

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        const speed = isRunning ? RUN_SPEED : MOVE_SPEED;
        const moveAmount = speed * delta;

        // Calculate movement direction
        let moveX = 0;
        let moveZ = 0;

        if (keys.forward) moveZ -= moveAmount;
        if (keys.backward) moveZ += moveAmount;
        if (keys.left) moveX -= moveAmount;
        if (keys.right) moveX += moveAmount;

        // Normalize diagonal movement
        if (moveX !== 0 && moveZ !== 0) {
            const normalize = 1 / Math.sqrt(2);
            moveX *= normalize;
            moveZ *= normalize;
        }

        // Island boundary collision detection
        const newX = positionRef.current.x + moveX;
        const newZ = positionRef.current.z + moveZ;

        // Define island boundaries (center, radius for each island)
        const islands = [
            { cx: -18, cz: -18, radius: 15, name: 'forest' },    // Forest island
            { cx: 22, cz: -18, radius: 15, name: 'town' },       // Town island
            { cx: -18, cz: 22, radius: 15, name: 'lake' },       // Lake island
            { cx: 22, cz: 22, radius: 15, name: 'hill' },        // Hill island
            { cx: 2, cz: 2, radius: 10, name: 'cloud' },         // Cloud island (elevated)
        ];

        // Define bridges (start, end, width)
        const bridges = [
            { x1: -18, z1: -3, x2: -18, z2: 7, width: 4 },   // Forest to Lake
            { x1: 7, z1: -18, x2: 7, z2: -18, width: 35, isHorizontal: true }, // Forest to Town (horizontal)
            { x1: 7, z1: 22, x2: 7, z2: 22, width: 35, isHorizontal: true },   // Lake to Hill (horizontal)
            { x1: 22, z1: -3, x2: 22, z2: 7, width: 4 },     // Town to Hill
        ];

        // Check if position is on any island
        const isOnIsland = islands.some(island => {
            const dx = newX - island.cx;
            const dz = newZ - island.cz;
            return Math.sqrt(dx * dx + dz * dz) <= island.radius;
        });

        // Check if position is on any bridge
        const isOnBridge = bridges.some(bridge => {
            if (bridge.isHorizontal) {
                // Horizontal bridge (connects left-right islands)
                const minX = Math.min(-18, 22) + 15 - 2;
                const maxX = Math.max(-18, 22) - 15 + 2;
                return newX >= minX && newX <= maxX &&
                    Math.abs(newZ - bridge.z1) <= bridge.width / 2;
            } else {
                // Vertical bridge (connects top-bottom islands)
                const minZ = Math.min(bridge.z1, bridge.z2);
                const maxZ = Math.max(bridge.z1, bridge.z2);
                return newZ >= minZ && newZ <= maxZ &&
                    Math.abs(newX - bridge.x1) <= bridge.width / 2;
            }
        });

        // Only allow movement if staying on valid terrain
        const canMove = isOnIsland || isOnBridge;

        // Update position only if valid
        if ((moveX !== 0 || moveZ !== 0) && canMove) {
            positionRef.current.x = newX;
            positionRef.current.z = newZ;

            // Update rotation to face movement direction
            rotationRef.current = Math.atan2(moveX, moveZ);

            // Report position change
            onPositionChange([positionRef.current.x, positionRef.current.y, positionRef.current.z]);
        } else if (moveX !== 0 || moveZ !== 0) {
            // Still update rotation even if can't move (for visual feedback)
            rotationRef.current = Math.atan2(moveX, moveZ);
        }

        // Apply position and rotation
        groupRef.current.position.copy(positionRef.current);
        groupRef.current.rotation.y = rotationRef.current;

        // Walking/Running animation - leg movement and bounce
        if (isMoving) {
            const bounceSpeed = isRunning ? 12 : 8;
            const bounceHeight = isRunning ? 0.15 : 0.08;
            groupRef.current.position.y = positionRef.current.y + Math.abs(Math.sin(state.clock.elapsedTime * bounceSpeed)) * bounceHeight;
        } else {
            // Idle breathing animation
            groupRef.current.position.y = positionRef.current.y + Math.sin(state.clock.elapsedTime * 2) * 0.05;
            const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
            groupRef.current.scale.set(breathe, breathe, breathe);
        }
    });

    const hasEars = ['bunny', 'fox', 'bear', 'cat', 'dog', 'panda', 'unicorn', 'dragon'].includes(characterId);
    const isPenguin = characterId === 'penguin';
    const isUnicorn = characterId === 'unicorn';

    return (
        <group ref={groupRef} position={initialPosition}>
            {/* Body - round and chunky */}
            <RoundedBox args={[0.8, 1, 0.6]} radius={0.2} position={[0, 0.5, 0]}>
                <meshStandardMaterial color={palette.body} roughness={0.8} />
            </RoundedBox>

            {/* Head - large and cute */}
            <mesh position={[0, 1.4, 0]}>
                <sphereGeometry args={[0.5, 16, 16]} />
                <meshStandardMaterial color={palette.body} roughness={0.8} />
            </mesh>

            {/* Face details */}
            {/* Eyes */}
            <mesh position={[-0.15, 1.5, 0.4]}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshStandardMaterial color="#2C3E50" />
            </mesh>
            <mesh position={[0.15, 1.5, 0.4]}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshStandardMaterial color="#2C3E50" />
            </mesh>
            {/* Eye shine */}
            <mesh position={[-0.12, 1.53, 0.46]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[0.18, 1.53, 0.46]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshStandardMaterial color="#FFFFFF" />
            </mesh>

            {/* Nose */}
            <mesh position={[0, 1.35, 0.48]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color={palette.accent === '#FFFFFF' ? '#FF69B4' : palette.accent} />
            </mesh>

            {/* Blush cheeks */}
            <mesh position={[-0.3, 1.35, 0.35]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshStandardMaterial color="#FFB6C1" transparent opacity={0.5} />
            </mesh>
            <mesh position={[0.3, 1.35, 0.35]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshStandardMaterial color="#FFB6C1" transparent opacity={0.5} />
            </mesh>

            {/* Ears (for most characters) */}
            {hasEars && (
                <>
                    <mesh position={[-0.25, 1.85, 0]} rotation={[0, 0, -0.3]}>
                        <capsuleGeometry args={[0.1, 0.25, 8, 8]} />
                        <meshStandardMaterial color={palette.ears || palette.body} roughness={0.8} />
                    </mesh>
                    <mesh position={[0.25, 1.85, 0]} rotation={[0, 0, 0.3]}>
                        <capsuleGeometry args={[0.1, 0.25, 8, 8]} />
                        <meshStandardMaterial color={palette.ears || palette.body} roughness={0.8} />
                    </mesh>
                </>
            )}

            {/* Unicorn horn */}
            {isUnicorn && (
                <mesh position={[0, 2, 0]} rotation={[0.3, 0, 0]}>
                    <coneGeometry args={[0.08, 0.4, 8]} />
                    <meshStandardMaterial
                        color="#FFD700"
                        emissive="#FFD700"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            )}

            {/* Penguin wings */}
            {isPenguin && (
                <>
                    <RoundedBox args={[0.15, 0.5, 0.3]} radius={0.05} position={[-0.5, 0.5, 0]} rotation={[0, 0, 0.3]}>
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </RoundedBox>
                    <RoundedBox args={[0.15, 0.5, 0.3]} radius={0.05} position={[0.5, 0.5, 0]} rotation={[0, 0, -0.3]}>
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </RoundedBox>
                    {/* White belly */}
                    <mesh position={[0, 0.5, 0.25]}>
                        <sphereGeometry args={[0.35, 16, 16]} />
                        <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
                    </mesh>
                </>
            )}

            {/* Legs */}
            <mesh position={[-0.2, -0.1, 0]}>
                <cylinderGeometry args={[0.12, 0.15, 0.4]} />
                <meshStandardMaterial color={palette.body} roughness={0.8} />
            </mesh>
            <mesh position={[0.2, -0.1, 0]}>
                <cylinderGeometry args={[0.12, 0.15, 0.4]} />
                <meshStandardMaterial color={palette.body} roughness={0.8} />
            </mesh>

            {name && (
                <Html position={[0, 2.2, 0]} center zIndexRange={[0, 50]}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#2D6A4F',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}>
                        {name}
                    </div>
                </Html>
            )}
        </group>
    );
}

// ==================== NPC CHARACTERS ====================
interface NPCProps {
    position: [number, number, number];
    type: 'squirrel' | 'catMerchant' | 'turtle' | 'owl' | 'cloudBunny';
    name: string;
    message?: string;
}

const NPC_PALETTES: Record<string, Record<string, string>> = {
    squirrel: { body: '#A0522D', belly: '#DEB887', tail: '#8B4513', accent: '#FFD700' },
    catMerchant: { body: '#E6A756', belly: '#FFF8DC', stripes: '#CD853F', accent: '#FF6B6B' },
    turtle: { shell: '#2E7D32', body: '#8FBC8F', accent: '#4FC3F7' },
    owl: { body: '#8D6E63', belly: '#D7CCC8', wings: '#5D4037', accent: '#9C27B0' },
    cloudBunny: { body: '#E8F4F8', ears: '#FFB6C1', accent: '#87CEEB' },
};

function NPC({ position, type, name, message }: NPCProps) {
    const groupRef = useRef<THREE.Group>(null);
    const palette = NPC_PALETTES[type];
    const [showMessage, setShowMessage] = useState(false);

    useFrame((state) => {
        if (groupRef.current) {
            // Idle animation - gentle bobbing
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;

            // Look around occasionally
            const lookTime = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
            groupRef.current.rotation.y = lookTime;
        }
    });

    return (
        <group
            ref={groupRef}
            position={position}
            onPointerEnter={() => setShowMessage(true)}
            onPointerLeave={() => setShowMessage(false)}
        >
            {/* Body variations based on type */}
            {type === 'squirrel' && (
                <>
                    {/* Body */}
                    <RoundedBox args={[0.5, 0.6, 0.4]} radius={0.15} position={[0, 0.3, 0]}>
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </RoundedBox>
                    {/* Head */}
                    <mesh position={[0, 0.8, 0]}>
                        <sphereGeometry args={[0.3, 16, 16]} />
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </mesh>
                    {/* Big fluffy tail */}
                    <mesh position={[0, 0.4, -0.35]} rotation={[0.5, 0, 0]}>
                        <capsuleGeometry args={[0.15, 0.5, 8, 8]} />
                        <meshStandardMaterial color={palette.tail} roughness={0.9} />
                    </mesh>
                    {/* Ears */}
                    <mesh position={[-0.15, 1.05, 0]}>
                        <coneGeometry args={[0.08, 0.15, 8]} />
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </mesh>
                    <mesh position={[0.15, 1.05, 0]}>
                        <coneGeometry args={[0.08, 0.15, 8]} />
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </mesh>
                    {/* Acorn accessory */}
                    <mesh position={[0.25, 0.3, 0.2]}>
                        <sphereGeometry args={[0.1, 8, 8]} />
                        <meshStandardMaterial color="#8B4513" />
                    </mesh>
                </>
            )}

            {type === 'catMerchant' && (
                <>
                    {/* Body with apron */}
                    <RoundedBox args={[0.6, 0.7, 0.5]} radius={0.15} position={[0, 0.35, 0]}>
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </RoundedBox>
                    {/* Apron */}
                    <RoundedBox args={[0.55, 0.5, 0.1]} radius={0.05} position={[0, 0.3, 0.25]}>
                        <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
                    </RoundedBox>
                    {/* Head */}
                    <mesh position={[0, 0.95, 0]}>
                        <sphereGeometry args={[0.35, 16, 16]} />
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </mesh>
                    {/* Cat ears */}
                    <mesh position={[-0.2, 1.25, 0]} rotation={[0, 0, -0.3]}>
                        <coneGeometry args={[0.1, 0.2, 4]} />
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </mesh>
                    <mesh position={[0.2, 1.25, 0]} rotation={[0, 0, 0.3]}>
                        <coneGeometry args={[0.1, 0.2, 4]} />
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </mesh>
                    {/* Merchant hat */}
                    <mesh position={[0, 1.3, 0]}>
                        <cylinderGeometry args={[0.25, 0.3, 0.15, 16]} />
                        <meshStandardMaterial color="#8B0000" roughness={0.8} />
                    </mesh>
                </>
            )}

            {type === 'turtle' && (
                <>
                    {/* Shell */}
                    <mesh position={[0, 0.35, 0]}>
                        <sphereGeometry args={[0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                        <meshStandardMaterial color={palette.shell} roughness={0.7} />
                    </mesh>
                    {/* Shell pattern */}
                    <mesh position={[0, 0.45, 0]}>
                        <sphereGeometry args={[0.35, 6, 6, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                        <meshStandardMaterial color="#1B5E20" roughness={0.8} wireframe />
                    </mesh>
                    {/* Head */}
                    <mesh position={[0, 0.3, 0.35]}>
                        <sphereGeometry args={[0.2, 16, 16]} />
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </mesh>
                    {/* Wise eyes */}
                    <mesh position={[-0.08, 0.35, 0.5]}>
                        <sphereGeometry args={[0.04, 8, 8]} />
                        <meshStandardMaterial color="#2C3E50" />
                    </mesh>
                    <mesh position={[0.08, 0.35, 0.5]}>
                        <sphereGeometry args={[0.04, 8, 8]} />
                        <meshStandardMaterial color="#2C3E50" />
                    </mesh>
                </>
            )}

            {type === 'owl' && (
                <>
                    {/* Body */}
                    <RoundedBox args={[0.5, 0.7, 0.4]} radius={0.15} position={[0, 0.35, 0]}>
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </RoundedBox>
                    {/* Belly */}
                    <mesh position={[0, 0.35, 0.18]}>
                        <sphereGeometry args={[0.2, 16, 16]} />
                        <meshStandardMaterial color={palette.belly} roughness={0.8} />
                    </mesh>
                    {/* Big head */}
                    <mesh position={[0, 0.85, 0]}>
                        <sphereGeometry args={[0.35, 16, 16]} />
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </mesh>
                    {/* Big owl eyes */}
                    <mesh position={[-0.12, 0.9, 0.3]}>
                        <sphereGeometry args={[0.12, 16, 16]} />
                        <meshStandardMaterial color="#FFF8DC" />
                    </mesh>
                    <mesh position={[0.12, 0.9, 0.3]}>
                        <sphereGeometry args={[0.12, 16, 16]} />
                        <meshStandardMaterial color="#FFF8DC" />
                    </mesh>
                    <mesh position={[-0.12, 0.9, 0.38]}>
                        <sphereGeometry args={[0.06, 8, 8]} />
                        <meshStandardMaterial color="#2C3E50" />
                    </mesh>
                    <mesh position={[0.12, 0.9, 0.38]}>
                        <sphereGeometry args={[0.06, 8, 8]} />
                        <meshStandardMaterial color="#2C3E50" />
                    </mesh>
                    {/* Ear tufts */}
                    <mesh position={[-0.2, 1.15, 0]} rotation={[0, 0, -0.3]}>
                        <coneGeometry args={[0.08, 0.2, 4]} />
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </mesh>
                    <mesh position={[0.2, 1.15, 0]} rotation={[0, 0, 0.3]}>
                        <coneGeometry args={[0.08, 0.2, 4]} />
                        <meshStandardMaterial color={palette.body} roughness={0.8} />
                    </mesh>
                    {/* Wings */}
                    <RoundedBox args={[0.1, 0.5, 0.25]} radius={0.03} position={[-0.32, 0.35, 0]} rotation={[0, 0, 0.2]}>
                        <meshStandardMaterial color={palette.wings} roughness={0.8} />
                    </RoundedBox>
                    <RoundedBox args={[0.1, 0.5, 0.25]} radius={0.03} position={[0.32, 0.35, 0]} rotation={[0, 0, -0.2]}>
                        <meshStandardMaterial color={palette.wings} roughness={0.8} />
                    </RoundedBox>
                </>
            )}

            {type === 'cloudBunny' && (
                <>
                    {/* Fluffy cloud-like body */}
                    <mesh position={[0, 0.35, 0]}>
                        <sphereGeometry args={[0.35, 16, 16]} />
                        <meshStandardMaterial color={palette.body} roughness={1} transparent opacity={0.95} />
                    </mesh>
                    <mesh position={[-0.2, 0.35, 0.1]}>
                        <sphereGeometry args={[0.2, 16, 16]} />
                        <meshStandardMaterial color={palette.body} roughness={1} transparent opacity={0.95} />
                    </mesh>
                    <mesh position={[0.2, 0.35, 0.1]}>
                        <sphereGeometry args={[0.2, 16, 16]} />
                        <meshStandardMaterial color={palette.body} roughness={1} transparent opacity={0.95} />
                    </mesh>
                    {/* Head */}
                    <mesh position={[0, 0.75, 0]}>
                        <sphereGeometry args={[0.3, 16, 16]} />
                        <meshStandardMaterial color={palette.body} roughness={1} />
                    </mesh>
                    {/* Long floppy ears */}
                    <mesh position={[-0.15, 1.1, 0]} rotation={[0.3, 0, -0.2]}>
                        <capsuleGeometry args={[0.08, 0.35, 8, 8]} />
                        <meshStandardMaterial color={palette.ears} roughness={0.8} />
                    </mesh>
                    <mesh position={[0.15, 1.1, 0]} rotation={[0.3, 0, 0.2]}>
                        <capsuleGeometry args={[0.08, 0.35, 8, 8]} />
                        <meshStandardMaterial color={palette.ears} roughness={0.8} />
                    </mesh>
                    {/* Dreamy eyes */}
                    <mesh position={[-0.1, 0.8, 0.25]}>
                        <sphereGeometry args={[0.05, 8, 8]} />
                        <meshStandardMaterial color="#87CEEB" />
                    </mesh>
                    <mesh position={[0.1, 0.8, 0.25]}>
                        <sphereGeometry args={[0.05, 8, 8]} />
                        <meshStandardMaterial color="#87CEEB" />
                    </mesh>
                    {/* Sparkle */}
                    <mesh position={[0.3, 1, 0]}>
                        <octahedronGeometry args={[0.08, 0]} />
                        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
                    </mesh>
                </>
            )}

            {/* Common elements: Eyes and blush for all */}
            {(type === 'squirrel' || type === 'catMerchant') && (
                <>
                    <mesh position={[-0.1, type === 'squirrel' ? 0.85 : 1, 0.25]}>
                        <sphereGeometry args={[0.05, 8, 8]} />
                        <meshStandardMaterial color="#2C3E50" />
                    </mesh>
                    <mesh position={[0.1, type === 'squirrel' ? 0.85 : 1, 0.25]}>
                        <sphereGeometry args={[0.05, 8, 8]} />
                        <meshStandardMaterial color="#2C3E50" />
                    </mesh>
                </>
            )}

            {/* Name tag - only shown on hover */}
            {showMessage && (
                <Html position={[0, type === 'turtle' ? 1.3 : 1.8, 0]} center zIndexRange={[0, 50]}>
                    <div style={{
                        background: 'linear-gradient(135deg, #FFF8E1 0%, #FFFFFF 100%)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#795548',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                        border: '1.5px solid #FFCC80',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}>
                        <span style={{ fontSize: '8px' }}>🐾</span>
                        {name}
                    </div>
                </Html>
            )}

            {/* Speech bubble when hovered */}
            {showMessage && message && (
                <Html position={[0, type === 'turtle' ? 1.4 : 2, 0]} center zIndexRange={[0, 50]}>
                    <div style={{
                        background: 'white',
                        padding: '8px 14px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#2D3748',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                        animation: 'fadeIn 0.3s ease',
                    }}>
                        💬 {message}
                    </div>
                </Html>
            )}
        </group>
    );
}

// NPC Placement data for each zone
const NPCs = [
    { position: [-17, 0.5, -15] as [number, number, number], type: 'squirrel' as const, name: '🐿️ Nutkin', message: 'Welcome to the forest!' },
    { position: [22, 0.5, -17] as [number, number, number], type: 'catMerchant' as const, name: '🐱 Whiskers', message: 'I have acorns for sale!' },
    { position: [-17, 0.5, 22] as [number, number, number], type: 'turtle' as const, name: '🐢 Shelby', message: 'Take a deep breath...' },
    { position: [23, 0.5, 22] as [number, number, number], type: 'owl' as const, name: '🦉 Oliver', message: 'The stars are beautiful tonight.' },
    { position: [-4, 0.5, 47] as [number, number, number], type: 'cloudBunny' as const, name: '☁️ Fluffy', message: 'Rest here among the clouds~' },
];


function Ocean() {
    const meshRef = useRef<THREE.Mesh>(null);
    const geometryRef = useRef<THREE.PlaneGeometry>(null);

    useFrame((state) => {
        if (meshRef.current && geometryRef.current) {
            // Animate material
            const mat = meshRef.current.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = 0.15 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;

            // Animate vertices for wave effect
            const positions = geometryRef.current.attributes.position;
            const time = state.clock.elapsedTime;

            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                // Create flowing wave pattern
                const waveX = Math.sin(x * 0.05 + time * 0.8) * 0.5;
                const waveY = Math.sin(y * 0.05 + time * 0.6) * 0.5;
                const wave = Math.sin(x * 0.03 + y * 0.03 + time) * 0.3;
                positions.setZ(i, waveX + waveY + wave);
            }
            positions.needsUpdate = true;
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]} receiveShadow>
            <planeGeometry ref={geometryRef} args={[300, 300, 80, 80]} />
            <meshStandardMaterial
                color="#4FC3F7"
                emissive="#29B6F6"
                emissiveIntensity={0.25}
                transparent
                opacity={0.9}
                roughness={0.15}
                metalness={0.2}
            />
        </mesh>
    );
}

// ==================== ANIMATED WAVES ====================
function WaveRing({ delay = 0 }: { delay?: number }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            const t = (state.clock.elapsedTime + delay) % 4;
            meshRef.current.scale.setScalar(1 + t * 8);
            const mat = meshRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = Math.max(0, 0.4 - t * 0.1);
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -7.8, 0]}>
            <ringGeometry args={[0.5, 0.8, 32]} />
            <meshBasicMaterial color="#64B5F6" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
    );
}

// ==================== FLOATING CLOUDS ====================
function Cloud({ position, scale = 1, speed = 0.5 }: { position: [number, number, number], scale?: number, speed?: number }) {
    const groupRef = useRef<THREE.Group>(null);
    const originalX = position[0];

    useFrame((state) => {
        if (groupRef.current) {
            // Slow horizontal drift
            groupRef.current.position.x = originalX + Math.sin(state.clock.elapsedTime * speed * 0.3) * 3;
            // Gentle vertical bob
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.5;
        }
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            {/* Main cloud body - multiple spheres */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[1.5, 16, 16]} />
                <meshStandardMaterial color="#FFFFFF" roughness={1} transparent opacity={0.9} />
            </mesh>
            <mesh position={[-1.2, -0.2, 0]}>
                <sphereGeometry args={[1.1, 16, 16]} />
                <meshStandardMaterial color="#FFFFFF" roughness={1} transparent opacity={0.9} />
            </mesh>
            <mesh position={[1.3, -0.1, 0]}>
                <sphereGeometry args={[1.2, 16, 16]} />
                <meshStandardMaterial color="#FFFFFF" roughness={1} transparent opacity={0.9} />
            </mesh>
            <mesh position={[0.5, 0.5, 0]}>
                <sphereGeometry args={[0.8, 16, 16]} />
                <meshStandardMaterial color="#FFFFFF" roughness={1} transparent opacity={0.9} />
            </mesh>
            <mesh position={[-0.5, 0.3, 0.3]}>
                <sphereGeometry args={[0.7, 16, 16]} />
                <meshStandardMaterial color="#FFFFFF" roughness={1} transparent opacity={0.9} />
            </mesh>
        </group>
    );
}

// ==================== SPARKLE PARTICLES ====================
function SparkleParticle({ position, color = "#FFD700" }: { position: [number, number, number], color?: string }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const startY = position[1];
    const randomOffset = Math.random() * Math.PI * 2;

    useFrame((state) => {
        if (meshRef.current) {
            const t = state.clock.elapsedTime + randomOffset;
            meshRef.current.position.y = startY + Math.sin(t * 2) * 0.5;
            meshRef.current.rotation.y = t * 2;
            meshRef.current.rotation.z = t * 1.5;
            const scale = 0.8 + Math.sin(t * 3) * 0.2;
            meshRef.current.scale.setScalar(scale);
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <octahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
    );
}

function ParticleField() {
    const particles: { pos: [number, number, number], color: string }[] = [];

    // Generate random particles around the islands
    const colors = ["#FFD700", "#FF69B4", "#00CED1", "#7B68EE", "#98FB98"];

    for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        const radius = 20 + Math.random() * 15;
        particles.push({
            pos: [
                Math.cos(angle) * radius,
                5 + Math.random() * 10,
                Math.sin(angle) * radius
            ],
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    return (
        <>
            {particles.map((p, i) => (
                <SparkleParticle key={i} position={p.pos} color={p.color} />
            ))}
        </>
    );
}

// ==================== WATERFALL (Between Islands) ====================
function Waterfall({ start, end }: { start: [number, number, number], end: [number, number, number] }) {
    const groupRef = useRef<THREE.Group>(null);
    const particlesCount = 20;

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.children.forEach((child, i) => {
                const mesh = child as THREE.Mesh;
                const t = ((state.clock.elapsedTime * 0.5) + i * 0.1) % 1;
                mesh.position.x = start[0] + (end[0] - start[0]) * t;
                mesh.position.y = start[1] + (end[1] - start[1]) * t - (t * t * 2);
                mesh.position.z = start[2] + (end[2] - start[2]) * t;
                const mat = mesh.material as THREE.MeshStandardMaterial;
                mat.opacity = 0.6 - t * 0.5;
            });
        }
    });

    return (
        <group ref={groupRef}>
            {Array.from({ length: particlesCount }).map((_, i) => (
                <mesh key={i}>
                    <sphereGeometry args={[0.15, 8, 8]} />
                    <meshStandardMaterial
                        color="#87CEEB"
                        emissive="#64B5F6"
                        emissiveIntensity={0.3}
                        transparent
                        opacity={0.6}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ==================== RAINBOW BRIDGE ====================
function RainbowBridge({ start, end }: { start: [number, number, number], end: [number, number, number] }) {
    const colors = ["#FF6B6B", "#FFE66D", "#4ECDC4", "#45B7D1", "#96CEB4", "#9B59B6"];

    const midX = (start[0] + end[0]) / 2;
    const midZ = (start[2] + end[2]) / 2;
    const midY = Math.max(start[1], end[1]) + 6;

    return (
        <group>
            {colors.map((color, i) => {
                const offset = i * 0.3;
                return (
                    <mesh key={i} position={[midX, midY + offset, midZ]} rotation={[0, Math.atan2(end[2] - start[2], end[0] - start[0]), 0]}>
                        <torusGeometry args={[8 - i * 0.2, 0.15, 8, 32, Math.PI]} />
                        <meshStandardMaterial
                            color={color}
                            emissive={color}
                            emissiveIntensity={0.3}
                            transparent
                            opacity={0.7}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

// ==================== FLOATING ACORNS (Collectibles) ====================
function FloatingAcorn({ position }: { position: [number, number, number] }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 2;
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.3;
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* Acorn body */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
                <meshStandardMaterial color="#8B4513" roughness={0.8} />
            </mesh>
            {/* Acorn cap */}
            <mesh position={[0, 0.15, 0]}>
                <sphereGeometry args={[0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                <meshStandardMaterial color="#5D4037" roughness={0.9} />
            </mesh>
            {/* Stem */}
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
                <meshStandardMaterial color="#3E2723" roughness={0.9} />
            </mesh>
            {/* Glow ring */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.3, 0.5, 32]} />
                <meshBasicMaterial color="#FFD700" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

// ==================== 3D WOODEN LOGO ====================
function WoodenLogo({ position = [0, 7, 0] }: { position?: [number, number, number] }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Gentle floating animation
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
            // Subtle rotation
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* 3D Logo using HTML overlay for compatibility */}
            <Html
                center
                transform
                occlude={false}
                zIndexRange={[0, 50]}
                style={{
                    pointerEvents: 'none',
                }}
            >
                <div className="logo-3d-container">
                    <div className="logo-3d-text">
                        <span className="logo-letter" style={{ animationDelay: '0s' }}>B</span>
                        <span className="logo-letter" style={{ animationDelay: '0.05s' }}>R</span>
                        <span className="logo-letter" style={{ animationDelay: '0.1s' }}>O</span>
                        <span className="logo-letter" style={{ animationDelay: '0.15s' }}>O</span>
                        <span className="logo-letter" style={{ animationDelay: '0.2s' }}>K</span>
                        <span className="logo-letter" style={{ animationDelay: '0.25s' }}>V</span>
                        <span className="logo-letter" style={{ animationDelay: '0.3s' }}>A</span>
                        <span className="logo-letter" style={{ animationDelay: '0.35s' }}>L</span>
                        <span className="logo-letter" style={{ animationDelay: '0.4s' }}>E</span>
                    </div>
                    <div className="logo-3d-subtitle">🌰 Healing Village 🌲</div>
                </div>
            </Html>

            {/* Decorative elements around logo */}
            {/* Left acorn */}
            <group position={[-8, 0, 0]} scale={0.8}>
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
                    <meshStandardMaterial color="#8B4513" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.3, 0]}>
                    <sphereGeometry args={[0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                    <meshStandardMaterial color="#5D4037" roughness={0.9} />
                </mesh>
            </group>

            {/* Right acorn */}
            <group position={[8, 0, 0]} scale={0.8}>
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
                    <meshStandardMaterial color="#8B4513" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.3, 0]}>
                    <sphereGeometry args={[0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                    <meshStandardMaterial color="#5D4037" roughness={0.9} />
                </mesh>
            </group>

            {/* Sparkles around logo */}
            <SparkleParticle position={[-6, 1, 0]} color="#FFD700" />
            <SparkleParticle position={[6, 1, 0]} color="#FFD700" />
            <SparkleParticle position={[-4, -0.5, 0]} color="#52B788" />
            <SparkleParticle position={[4, -0.5, 0]} color="#52B788" />
        </group>
    );
}

// ==================== FIREFLIES (Night Ambient) ====================
function Firefly({ position }: { position: [number, number, number] }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const randomOffset = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 0.5;

    useFrame((state) => {
        if (meshRef.current) {
            const t = state.clock.elapsedTime * speed + randomOffset;
            meshRef.current.position.x = position[0] + Math.sin(t) * 2;
            meshRef.current.position.y = position[1] + Math.sin(t * 1.5) * 1;
            meshRef.current.position.z = position[2] + Math.cos(t) * 2;

            const scale = 0.6 + Math.sin(t * 4) * 0.4;
            meshRef.current.scale.setScalar(scale);
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial
                color="#FFEB3B"
                emissive="#FFEB3B"
                emissiveIntensity={2}
                transparent
                opacity={0.8}
            />
        </mesh>
    );
}

function FireflySwarm() {
    const fireflies: [number, number, number][] = [];

    // Generate fireflies around the world
    for (let i = 0; i < 25; i++) {
        fireflies.push([
            (Math.random() - 0.5) * 50,
            3 + Math.random() * 8,
            (Math.random() - 0.5) * 50
        ]);
    }

    return (
        <>
            {fireflies.map((pos, i) => (
                <Firefly key={i} position={pos} />
            ))}
        </>
    );
}

// ==================== CAMERA CONTROLLER (Follow Player) ====================
function FollowCamera({ target, isMoving }: { target: [number, number, number]; isMoving: boolean }) {
    const { camera } = useThree();
    const controlsRef = useRef<any>(null);
    const targetVec = useRef(new THREE.Vector3(...target));
    const lastTarget = useRef(new THREE.Vector3(...target));

    // World boundary constants (archipelago is ~50 units radius circle)
    const WORLD_BOUNDS = 70;
    const CAM_Y_MIN = 3;
    const CAM_Y_MAX = 100;

    useFrame(() => {
        // Update target vector from props
        targetVec.current.set(target[0], target[1], target[2]);

        // Only follow player when they're moving
        if (isMoving && controlsRef.current) {
            // Smoothly move OrbitControls target to follow player
            controlsRef.current.target.lerp(targetVec.current, 0.05);

            // Calculate camera offset relative to current camera position
            const offset = camera.position.clone().sub(lastTarget.current);
            const desiredCameraPos = targetVec.current.clone().add(offset);

            // Smoothly move camera to maintain relative position
            camera.position.lerp(desiredCameraPos, 0.05);

            controlsRef.current.update();
        }

        // Clamp camera position within world bounds to prevent flying into void
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -WORLD_BOUNDS, WORLD_BOUNDS);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -WORLD_BOUNDS, WORLD_BOUNDS);
        camera.position.y = THREE.MathUtils.clamp(camera.position.y, CAM_Y_MIN, CAM_Y_MAX);

        // Clamp orbit target too so it doesn't drift outside world
        if (controlsRef.current) {
            const t = controlsRef.current.target;
            t.x = THREE.MathUtils.clamp(t.x, -WORLD_BOUNDS, WORLD_BOUNDS);
            t.z = THREE.MathUtils.clamp(t.z, -WORLD_BOUNDS, WORLD_BOUNDS);
            t.y = THREE.MathUtils.clamp(t.y, -2, 20);
        }

        // Update last target for next frame
        lastTarget.current.copy(controlsRef.current?.target || targetVec.current);
    });

    return (
        <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.4}
            minDistance={10}
            maxDistance={120}
            target={target}
        />
    );
}

// ==================== WORLD SCENE ====================
function MiniWorldScene({
    onLandmarkClick,
    selectedLandmark,
    questLandmarks,
    t,
    characterData,
    playerPosition,
    onPlayerPositionChange,
    keys,
    isMoving,
    qualitySettings,
}: {
    onLandmarkClick: (landmark: typeof landmarks[0]) => void,
    selectedLandmark: typeof landmarks[0] | null,
    questLandmarks: string[],
    t: ReturnType<typeof getTranslation>,
    characterData: { characterId: string; name: string } | null,
    playerPosition: [number, number, number],
    onPlayerPositionChange: (position: [number, number, number]) => void,
    keys: ReturnType<typeof useKeyboard>,
    isMoving: boolean,
    qualitySettings: ReturnType<typeof getQualitySettings>,
}) {
    const forestBuildings = landmarks.filter(l => l.zone === 'forest');
    const townBuildings = landmarks.filter(l => l.zone === 'town');
    const lakeBuildings = landmarks.filter(l => l.zone === 'lake');
    const hillBuildings = landmarks.filter(l => l.zone === 'hill');
    const cloudBuildings = landmarks.filter(l => l.zone === 'cloud');

    return (
        <>
            {/* Fixed Bright Lighting for MINI WORLD style */}
            <DynamicLighting mode="fixed" fixedTime="noon" />

            {/* MINI WORLD: Dark Navy Background - No Sky, No Weather */}
            <color attach="background" args={['#0D1B3E']} />
            <fog attach="fog" args={['#0D1B3E', 100, 250]} />

            {/* ===== NEW: 17 APP-SPECIFIC ISLANDS IN CIRCULAR LAYOUT ===== */}
            <IslandWorld
                onAppClick={(appId) => {
                    // Find the landmark data for this app
                    const landmark = landmarks.find(l => l.id === appId);
                    if (landmark) {
                        onLandmarkClick(landmark);
                    }
                }}
                selectedApp={selectedLandmark?.id || null}
                questApps={questLandmarks}
                getAppName={(appId) => {
                    const landmarkId = appId as keyof typeof t.landmarks;
                    const landmarkInfo = t.landmarks[landmarkId];
                    return landmarkInfo?.name || appId;
                }}
            />

            {/* ===== WOODEN BRIDGES CONNECTING ISLANDS ===== */}
            {generateBridgeConnections(APP_ISLANDS.length, 35).map((bridge, i) => (
                <WoodenBridge key={`bridge-${i}`} start={bridge.start} end={bridge.end} />
            ))}


            {/* ========== ATMOSPHERIC ELEMENTS ========== */}

            {/* Ocean beneath islands */}
            <Ocean />

            {/* Animated wave rings - reduced on low quality */}
            {qualitySettings.waterWaves && (
                <>
                    <WaveRing delay={0} />
                    <WaveRing delay={1} />
                    {qualitySettings.animationDetail === 'full' && (
                        <>
                            <WaveRing delay={2} />
                            <WaveRing delay={3} />
                        </>
                    )}
                </>
            )}

            {/* Floating clouds - hidden on low quality */}
            {qualitySettings.cloudsEnabled && (
                <>
                    <Cloud position={[-25, 18, -20]} scale={1.2} speed={0.4} />
                    <Cloud position={[30, 20, -15]} scale={0.9} speed={0.6} />
                    {qualitySettings.animationDetail === 'full' && (
                        <>
                            <Cloud position={[-20, 22, 25]} scale={1.0} speed={0.5} />
                            <Cloud position={[25, 16, 20]} scale={0.8} speed={0.7} />
                            <Cloud position={[0, 24, -30]} scale={1.3} speed={0.3} />
                            <Cloud position={[-30, 19, 0]} scale={0.7} speed={0.8} />
                        </>
                    )}
                </>
            )}

            {/* Sparkle particles around islands - reduced on low quality */}
            {qualitySettings.animationDetail === 'full' && <ParticleField />}

            {/* Fireflies for magical ambiance - only on high quality */}
            {qualitySettings.animationDetail === 'full' && <FireflySwarm />}

            {/* Rainbow bridge connecting Forest and Town */}
            <RainbowBridge start={[-6, 2, -12]} end={[6, 2, -12]} />

            {/* Waterfalls from islands */}
            <Waterfall start={[-10, -1, -10]} end={[-10, -7, -10]} />
            <Waterfall start={[14, -1, 14]} end={[14, -7, 14]} />

            {/* Floating collectible acorns */}
            <FloatingAcorn position={[0, 5, 0]} />
            <FloatingAcorn position={[-5, 6, 8]} />
            <FloatingAcorn position={[8, 4, -5]} />
            <FloatingAcorn position={[-8, 5, -8]} />
            <FloatingAcorn position={[5, 7, 5]} />

            {/* NPC Characters - One per zone! */}
            {NPCs.map((npc, index) => (
                <NPC
                    key={index}
                    position={npc.position}
                    type={npc.type}
                    name={npc.name}
                    message={npc.message}
                />
            ))}

            {/* Player Character - Now with WASD Movement! */}
            {characterData && (
                <PlayerCharacter3D
                    characterId={characterData.characterId}
                    name={characterData.name || undefined}
                    keys={keys}
                    onPositionChange={onPlayerPositionChange}
                    initialPosition={playerPosition}
                />
            )}


            {/* Camera follows player when moving */}
            <FollowCamera target={playerPosition} isMoving={isMoving} />

            {/* ===== DIORAMA STORYTELLING: Creatures, Clouds, Details ===== */}
            <DioramaStorytelling
                enableCreatures={qualitySettings.animationDetail === 'full'}
                enableClouds={qualitySettings.cloudsEnabled}
                enableDetails={true}
                performanceLevel={qualitySettings.animationDetail === 'full' ? 'high' : 'medium'}
            />

            {/* ===== POST-PROCESSING EFFECTS ===== */}
            {/* Bloom + Tilt-Shift + Vignette + Chromatic Aberration */}
            {/* Creates the premium "miniature diorama" visual feel */}
            <PostProcessingEffects
                performanceLevel={qualitySettings.animationDetail === 'full' ? 'high' : 'medium'}
                {...PRESET_CINEMATIC}
            />
        </>
    );
}

// ==================== QUEST PANEL ====================
function QuestPanel({
    profile,
    t,
    onQuestClick,
    isOpen,
    onToggle,
}: {
    profile: PlayerProfile;
    t: ReturnType<typeof getTranslation>;
    onQuestClick: (questId: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}) {
    const completedCount = profile.questProgress.filter(q => q.status === 'completed' || q.status === 'claimed').length;
    const totalCount = profile.questProgress.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);
    const resetTime = timeUntilDailyReset();

    if (!isOpen) {
        return (
            <button className="quest-toggle-btn" onClick={onToggle}>
                📋
                {completedCount < totalCount && (
                    <span className="badge">{totalCount - completedCount}</span>
                )}
            </button>
        );
    }

    return (
        <div className="quest-panel">
            <div className="quest-panel-header">
                <div className="quest-panel-title">
                    <span className="quest-panel-title-icon">📋</span>
                    <span>{t.quest.todayMissions}</span>
                </div>
                <div className="quest-progress-ring" style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}>
                    <div className="quest-progress-ring-bg"></div>
                    <div className="quest-progress-ring-fill"></div>
                    <div className="quest-progress-ring-center">{completedCount}/{totalCount}</div>
                </div>
            </div>

            <div className="quest-list">
                {questDefinitions.map((quest, index) => {
                    const progress = profile.questProgress[index];
                    const questInfo = t.quests[quest.translationKey as keyof typeof t.quests];

                    return (
                        <div
                            key={quest.id}
                            className={`quest-card ${progress.status}`}
                            onClick={() => progress.status !== 'locked' && onQuestClick(quest.id)}
                        >
                            <div className="quest-icon">{quest.icon}</div>
                            <div className="quest-content">
                                <div className="quest-title">{questInfo?.title || quest.translationKey}</div>
                                <div className="quest-desc">{questInfo?.desc || ''}</div>
                            </div>
                            <div className="quest-reward">
                                <span className="quest-reward-acorns">🌰 {quest.acornReward}</span>
                                <span className="quest-reward-xp">+{quest.xpReward} {t.quest.xp}</span>
                            </div>
                            {progress.status === 'in_progress' && (
                                <div className="quest-progress-bar">
                                    <div className="quest-progress-fill" style={{ width: `${progress.progress}%` }}></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="quest-stats">
                <div className="quest-stat">
                    <span className="quest-stat-icon">⭐</span>
                    <span className="quest-stat-value">{profile.level}</span>
                    <span className="quest-stat-label">{t.ui.level}</span>
                </div>
                <div className="quest-stat">
                    <span className="quest-stat-icon">🌰</span>
                    <span className="quest-stat-value">{profile.totalAcorns}</span>
                    <span className="quest-stat-label">{t.quest.acorns}</span>
                </div>
                <div className="quest-stat">
                    <span className="quest-stat-icon">⏰</span>
                    <span className="quest-stat-value">{resetTime.hours}{t.quest.hours} {resetTime.minutes}{t.quest.minutes}</span>
                    <span className="quest-stat-label">{t.quest.dailyReset}</span>
                </div>
            </div>

            <button onClick={onToggle} className="quest-close-btn">×</button>
        </div>
    );
}

// ==================== MAIN COMPONENT ====================
export default function BrookvaleWorld() {
    const router = useRouter();
    const isMobile = useIsMobile();
    const { navigateWithTransition } = usePageTransition();

    // Mobile redirect state
    const [mobileRedirectDismissed, setMobileRedirectDismissed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('brookvale-view-mode') === '3d';
        }
        return false;
    });

    // Start with null to avoid SSR/client hydration mismatch
    // Will be set in useEffect after client-side localStorage check
    const [showHero, setShowHero] = useState<boolean | null>(null);
    const [selectedLandmark, setSelectedLandmark] = useState<typeof landmarks[0] | null>(null);
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [profile, setProfile] = useState<PlayerProfile>(defaultPlayerProfile);
    const [questPanelOpen, setQuestPanelOpen] = useState(true);
    const [toast, setToast] = useState<{ show: boolean; title: string; reward: string } | null>(null);
    const [characterData, setCharacterData] = useState<{ characterId: string; name: string } | null>(null);
    const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0.5, 0]);

    // Performance optimization
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const performanceLevel = usePerformanceLevel();
    const qualitySettings = getQualitySettings(performanceLevel);

    // Keyboard input (desktop)
    const keys = useKeyboard();

    // Touch joystick input (mobile)
    const [touchKeys, setTouchKeys] = useState({
        forward: false,
        backward: false,
        left: false,
        right: false,
    });
    const [touchRun, setTouchRun] = useState(false);

    // Combine keyboard and touch inputs
    const combinedKeys = {
        forward: keys.forward || touchKeys.forward,
        backward: keys.backward || touchKeys.backward,
        left: keys.left || touchKeys.left,
        right: keys.right || touchKeys.right,
        shift: keys.shift || touchRun,
    };

    const t = getTranslation(language);

    // Initialize showHero and load character data from localStorage on client
    useEffect(() => {
        // Simulate progressive loading
        let progress = 0;
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadingInterval);
                setTimeout(() => setIsLoading(false), 300);
            }
            setLoadingProgress(progress);
        }, 200);

        // Determine if we should show hero screen
        // If user has previously entered the world (saved in localStorage), skip hero
        const hasEnteredWorld = localStorage.getItem('brookvaleWorldEntered') === 'true';
        setShowHero(!hasEnteredWorld);

        // Load character data
        const saved = localStorage.getItem('brookvaleCharacter');
        if (saved) {
            const parsed = JSON.parse(saved);
            setCharacterData({
                characterId: parsed.characterId || 'bunny',
                name: parsed.name || '',
            });
        } else {
            // Default character if none saved
            setCharacterData({ characterId: 'bunny', name: '' });
        }

        return () => clearInterval(loadingInterval);
    }, []);

    const questLandmarks = questDefinitions
        .filter((q, i) => profile.questProgress[i]?.status === 'available' || profile.questProgress[i]?.status === 'in_progress')
        .map(q => q.targetLandmark);

    const handleEnterWorld = () => {
        setShowHero(false);
        // Save state so user returns to world when coming back from apps
        localStorage.setItem('brookvaleWorldEntered', 'true');
    };
    const handleLandmarkClick = (landmark: typeof landmarks[0]) => setSelectedLandmark(landmark);

    const handleQuestClick = useCallback((questId: string) => {
        setProfile(prev => {
            const newProgress = [...prev.questProgress];
            const index = questDefinitions.findIndex(q => q.id === questId);
            if (index !== -1) {
                const current = newProgress[index];
                if (current.status === 'available') {
                    newProgress[index] = { ...current, status: 'in_progress', progress: 50 };
                    // Play quest start sound
                    playUISound('quest');
                } else if (current.status === 'in_progress') {
                    newProgress[index] = { ...current, status: 'completed', progress: 100 };
                    const quest = questDefinitions[index];
                    // Play success sound!
                    playUISound('success');
                    setTimeout(() => playUISound('reward'), 300);

                    // Trigger celebration particle effects at player position!
                    triggerParticleEffect('quest_complete', playerPosition);
                    setTimeout(() => triggerParticleEffect('confetti', playerPosition), 200);
                    setTimeout(() => triggerParticleEffect('acorn_burst', playerPosition), 400);

                    setToast({
                        show: true,
                        title: t.quest.questComplete,
                        reward: `🌰 +${quest.acornReward} | ⭐ +${quest.xpReward} ${t.quest.xp}`,
                    });
                    setTimeout(() => setToast(null), 3000);
                    return {
                        ...prev,
                        questProgress: newProgress,
                        totalAcorns: prev.totalAcorns + quest.acornReward,
                        xp: prev.xp + quest.xpReward,
                    };
                }
            }
            return { ...prev, questProgress: newProgress };
        });
    }, [t, playerPosition]);

    // Determine current zone based on player position for ambient sound
    // NOTE: This hook MUST be before any conditional returns to follow React's rules of hooks
    const getCurrentZone = useCallback((): ZoneAmbient => {
        const x = playerPosition[0];
        const z = playerPosition[2];

        // Check which island the player is closest to
        if (x < 0 && z < 0) return 'forest';
        if (x > 0 && z < 0) return 'town';
        if (x < 0 && z > 0) return 'lake';
        if (x > 0 && z > 0) return 'hill';
        return 'cloud'; // Center area
    }, [playerPosition]);

    const currentZone = getCurrentZone();

    // ==================== MOBILE REDIRECT BANNER ====================
    // Show mobile optimization banner on mobile devices (respects saved preference)
    const MobileBanner = () => (
        isMobile && !mobileRedirectDismissed ? (
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(13, 27, 62, 0.98), rgba(30, 50, 100, 0.98))',
                backdropFilter: 'blur(10px)',
                borderTop: '1px solid rgba(255, 215, 0, 0.3)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
            }}>
                <div style={{ color: 'white', fontSize: '0.95rem', textAlign: 'center' }}>
                    📱 {language === 'ko' ? '모바일에 최적화된 2D 버전이 있어요!' : 'A mobile-optimized 2D version is available!'}
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                        onClick={() => {
                            localStorage.setItem('brookvale-view-mode', '2d');
                            navigateWithTransition('/mobile');
                        }}
                        style={{
                            padding: '10px 24px',
                            background: 'linear-gradient(135deg, #FFD54F, #FFA726)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#1a1a2e',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                        }}
                    >
                        🗺️ {language === 'ko' ? '2D 맵으로 이동' : 'Switch to 2D Map'}
                    </button>
                    <button
                        onClick={() => {
                            setMobileRedirectDismissed(true);
                            localStorage.setItem('brookvale-view-mode', '3d');
                        }}
                        style={{
                            padding: '10px 16px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                        }}
                    >
                        {language === 'ko' ? '3D로 계속하기' : 'Continue in 3D'}
                    </button>
                </div>
            </div>
        ) : null
    );

    // ==================== LOADING STATE (SSR/Hydration) ====================
    // Show minimal loading while determining if we should show hero or world
    if (showHero === null) {
        return (
            <main className="mini-world" style={{
                background: 'linear-gradient(135deg, #87CEEB 0%, #4a90d9 50%, #2d5a87 100%)',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ fontSize: '3rem', animation: 'pulse 1s ease-in-out infinite' }}>🌿</div>
            </main>
        );
    }

    // ==================== HERO SCREEN ====================
    if (showHero) {
        return (
            <main className="hero-screen mini-world">
                <div className="hero-gradient-bg"></div>
                <div className="hero-particles"></div>

                {/* Sound Controls */}
                <SoundControls compact={true} />

                <div className="hero-content">
                    <div className="hero-logo">🏝️</div>
                    <h1 className="hero-title">{t.hero.title}</h1>
                    <h2 className="hero-subtitle-ko">{t.hero.subtitle}</h2>
                    <p className="hero-description" style={{ whiteSpace: 'pre-line' }}>
                        {t.hero.description}
                    </p>

                    <div className="hero-language-toggle">
                        <button
                            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                            onClick={() => setLanguage('en')}
                        >
                            EN
                        </button>
                        <button
                            className={`lang-btn ${language === 'ko' ? 'active' : ''}`}
                            onClick={() => setLanguage('ko')}
                        >
                            한국어
                        </button>
                    </div>

                    <button className="cta-button" onClick={handleEnterWorld}>
                        <span className="cta-icon">🚀</span>
                        <span>{t.hero.enterButton}</span>
                    </button>

                    <div className="hero-hint">
                        ✨ {language === 'ko' ? '4개의 떠있는 섬을 탐험하세요!' : 'Explore 4 floating islands!'} ✨
                    </div>
                </div>
            </main>
        );
    }

    // ==================== LOADING SCREEN ====================
    if (isLoading) {
        return <LoadingScreen progress={loadingProgress} message={language === 'ko' ? '마을 준비 중...' : 'Preparing village...'} />;
    }

    // ==================== GAME WORLD ====================
    return (
        <main className="game-world-3d mini-world">
            {/* Mobile Optimization Banner */}
            <MobileBanner />

            {/* Sound Controls with Zone Awareness */}
            <SoundControls currentZone={currentZone} compact={true} />

            <Canvas
                shadows={qualitySettings.shadowQuality !== 'none'}
                camera={{ position: [0, 45, 50], fov: 50 }}
                dpr={[1, 2]}
                style={{ background: 'linear-gradient(180deg, #0D1B3E 0%, #1A2B5A 50%, #0F1E3A 100%)' }}
            >
                <Suspense fallback={null}>
                    <MiniWorldScene
                        onLandmarkClick={handleLandmarkClick}
                        selectedLandmark={selectedLandmark}
                        questLandmarks={questLandmarks}
                        t={t}
                        characterData={characterData}
                        playerPosition={playerPosition}
                        onPlayerPositionChange={setPlayerPosition}
                        keys={combinedKeys}
                        isMoving={combinedKeys.forward || combinedKeys.backward || combinedKeys.left || combinedKeys.right}
                        qualitySettings={qualitySettings}
                    />
                </Suspense>
            </Canvas>

            {/* Mobile Touch Joystick */}
            <TouchJoystick
                onMove={setTouchKeys}
                onRun={setTouchRun}
            />

            {/* Weather Control - Manual weather selection */}
            <WeatherControl />

            {/* Performance Indicator - Shows current quality level */}
            <PerformanceIndicator level={performanceLevel} />

            {/* UI Overlay */}
            <div className="game-ui mini-world-ui">
                <div className="language-toggle">
                    <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
                    <button className={`lang-btn ${language === 'ko' ? 'active' : ''}`} onClick={() => setLanguage('ko')}>한국어</button>
                </div>

                {/* Character Settings Button */}
                <a
                    href="/character-settings"
                    className="character-settings-btn"
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        padding: '10px 16px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        color: '#2D6A4F',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                        zIndex: 1000,
                    }}
                >
                    <span style={{ fontSize: '20px' }}>
                        {characterData?.characterId === 'bunny' && '🐰'}
                        {characterData?.characterId === 'fox' && '🦊'}
                        {characterData?.characterId === 'bear' && '🐻'}
                        {characterData?.characterId === 'cat' && '🐱'}
                        {characterData?.characterId === 'dog' && '🐶'}
                        {characterData?.characterId === 'penguin' && '🐧'}
                        {characterData?.characterId === 'panda' && '🐼'}
                        {characterData?.characterId === 'unicorn' && '🦄'}
                        {characterData?.characterId === 'dragon' && '🐲'}
                        {!characterData && '🎭'}
                    </span>
                    <span>{characterData?.name || (language === 'ko' ? '캐릭터 설정' : 'My Character')}</span>
                </a>

                <div className="controls-hint mini">
                    🎮 WASD to move • Shift to run • 🖱️ Drag to rotate • Scroll to zoom
                </div>

                {/* 2D/3D View Toggle */}
                <button
                    onClick={() => {
                        localStorage.setItem('brookvale-view-mode', '2d');
                        navigateWithTransition('/mobile');
                    }}
                    title={language === 'ko' ? '2D 맵으로 전환' : 'Switch to 2D Map'}
                    style={{
                        position: 'fixed',
                        bottom: '240px',
                        left: '20px',
                        width: '150px',
                        padding: '8px 0',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#2D6A4F',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                        zIndex: 100,
                    }}
                >
                    <span style={{ fontSize: '1rem' }}>🗺️</span>
                    <span>{language === 'ko' ? '2D 맵 보기' : '2D Map View'}</span>
                </button>

                {/* Minimap */}
                <div style={{
                    position: 'fixed',
                    bottom: '80px',
                    left: '20px',
                    width: '150px',
                    height: '150px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    padding: '10px',
                    zIndex: 100,
                }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        background: 'linear-gradient(180deg, #87CEEB 0%, #B3E5FC 100%)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                    }}>
                        {/* Forest Island (top-left) */}
                        <div style={{
                            position: 'absolute',
                            left: '10%',
                            top: '10%',
                            width: '30%',
                            height: '30%',
                            background: '#2D6A4F',
                            borderRadius: '50%',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                        }} title="Northern Forest" />

                        {/* Town Island (top-right) */}
                        <div style={{
                            position: 'absolute',
                            right: '10%',
                            top: '10%',
                            width: '30%',
                            height: '30%',
                            background: '#E6A756',
                            borderRadius: '50%',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                        }} title="Brookvale Town" />

                        {/* Lake Island (bottom-left) */}
                        <div style={{
                            position: 'absolute',
                            left: '10%',
                            bottom: '10%',
                            width: '30%',
                            height: '30%',
                            background: '#7B68EE',
                            borderRadius: '50%',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                        }} title="Mystic Lake" />

                        {/* Hill Island (bottom-right) */}
                        <div style={{
                            position: 'absolute',
                            right: '10%',
                            bottom: '10%',
                            width: '30%',
                            height: '30%',
                            background: '#B8860B',
                            borderRadius: '50%',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                        }} title="Starlight Hill" />

                        {/* Cloud Island (center) */}
                        <div style={{
                            position: 'absolute',
                            left: '35%',
                            top: '35%',
                            width: '30%',
                            height: '30%',
                            background: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '50%',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        }} title="Cloud Haven" />

                        {/* Player Position Indicator */}
                        <div style={{
                            position: 'absolute',
                            left: `${((playerPosition[0] + 35) / 70) * 100}%`,
                            top: `${((playerPosition[2] + 35) / 70) * 100}%`,
                            width: '10px',
                            height: '10px',
                            background: '#FF4757',
                            borderRadius: '50%',
                            border: '2px solid white',
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 0 8px rgba(255, 71, 87, 0.6)',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            zIndex: 10,
                        }} />

                        {/* Minimap Label */}
                        <div style={{
                            position: 'absolute',
                            bottom: '2px',
                            right: '4px',
                            fontSize: '8px',
                            color: 'rgba(0,0,0,0.4)',
                            fontWeight: 'bold',
                        }}>
                            🗺️ MAP
                        </div>
                    </div>
                </div>
            </div>

            <QuestPanel
                profile={profile}
                t={t}
                onQuestClick={handleQuestClick}
                isOpen={questPanelOpen}
                onToggle={() => setQuestPanelOpen(!questPanelOpen)}
            />

            {toast?.show && (
                <div className="quest-toast">
                    <span className="quest-toast-icon">🎉</span>
                    <div className="quest-toast-content">
                        <div className="quest-toast-title">{toast.title}</div>
                        <div className="quest-toast-reward">{toast.reward}</div>
                    </div>
                </div>
            )}

            {selectedLandmark && (
                <div className="landmark-modal-overlay" onClick={() => setSelectedLandmark(null)}>
                    <div className="landmark-modal mini-world-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedLandmark(null)}>×</button>
                        <div className="modal-emoji">{selectedLandmark.emoji}</div>
                        <h2 className="modal-title">
                            {t.landmarks[selectedLandmark.id as keyof typeof t.landmarks]?.name || selectedLandmark.id}
                        </h2>
                        <p className="modal-description">
                            {t.landmarks[selectedLandmark.id as keyof typeof t.landmarks]?.desc || ''}
                        </p>
                        <button
                            className="modal-launch-btn"
                            onClick={() => navigateWithTransition(`/${selectedLandmark.id}`)}
                        >
                            {t.ui.launchApp}
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
