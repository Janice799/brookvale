'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';
import { IslandTree, FlowerPatch, RockCluster, WoodenFence, Lantern } from './WorldElements';
import {
    AnimatedWindmill,
    PulsingCrystal,
    FloatingBubbles,
    SpinningDiscoBall,
    TwinklingStars,
    FloatingLeaves,
    WaterRipples,
    GlowingLanternFlame,
    SleepingZzz
} from './AnimatedElements';
import {
    Window,
    RoundWindow,
    Door,
    Signboard,
    HangingSign,
    Chimney,
    Awning,
    FlowerBox,
    Mailbox,
    Bench,
    StreetLamp,
    Well
} from './ArchitecturalDetails';

// ==================== 17 APP ISLAND DEFINITIONS ====================
// Each app has its own unique themed island in a circular layout

export interface AppIslandData {
    id: string;
    emoji: string;
    theme: {
        grass: string;
        dirt: string;
        stone: string;
        accent: string;
    };
    // Position will be calculated based on circular layout
}

export const APP_ISLANDS: AppIslandData[] = [
    // 1. Focus Cat - Cat Cafe (Orange/Cream)
    {
        id: 'focus-cat',
        emoji: '🐱',
        theme: { grass: '#FFE4C4', dirt: '#DEB887', stone: '#8B7355', accent: '#FF6B6B' }
    },
    // 2. Tiny Wins - Urban Garden (Green)
    {
        id: 'tiny-wins',
        emoji: '🌱',
        theme: { grass: '#7CB342', dirt: '#8D6E63', stone: '#5D4037', accent: '#AED581' }
    },
    // 3. Stretch Timer - Yoga Terrace (Mint)
    {
        id: 'stretch-timer',
        emoji: '🧘',
        theme: { grass: '#B2DFDB', dirt: '#A1887F', stone: '#6D4C41', accent: '#80CBC4' }
    },
    // 4. Goal Tycoon - Construction (Yellow/Orange)
    {
        id: 'goal-tycoon',
        emoji: '🏗️',
        theme: { grass: '#FFD54F', dirt: '#A1887F', stone: '#6D4C41', accent: '#FF9800' }
    },
    // 5. Daily Side-Quest - Knight Outpost (Brown/Gold)
    {
        id: 'daily-quest',
        emoji: '⚔️',
        theme: { grass: '#A5D6A7', dirt: '#8D6E63', stone: '#5D4037', accent: '#FFD700' }
    },
    // 6. Acorn Archive - Oak Library (Autumn Orange)
    {
        id: 'acorn-archive',
        emoji: '📚',
        theme: { grass: '#FFAB40', dirt: '#8D6E63', stone: '#5D4037', accent: '#FF6D00' }
    },
    // 7. Acorn Bank - Golden Vault (Gold)
    {
        id: 'acorn-bank',
        emoji: '🏦',
        theme: { grass: '#FFD700', dirt: '#CD853F', stone: '#8B4513', accent: '#FFC107' }
    },
    // 8. Vibe Painter - Abstract Studio (Rainbow/Pink)
    {
        id: 'vibe-painter',
        emoji: '🎨',
        theme: { grass: '#F8BBD9', dirt: '#CE93D8', stone: '#9C27B0', accent: '#E91E63' }
    },
    // 9. Menu Oracle - Mystic Tent (Purple)
    {
        id: 'menu-oracle',
        emoji: '🔮',
        theme: { grass: '#B388FF', dirt: '#7E57C2', stone: '#512DA8', accent: '#7C4DFF' }
    },
    // 10. Karma Ripple - Zen Pond (Teal)
    {
        id: 'karma-ripple',
        emoji: '💧',
        theme: { grass: '#4DD0E1', dirt: '#0097A7', stone: '#006064', accent: '#00BCD4' }
    },
    // 11. Rhythm Surfer - Neon Wave (Cyan/Neon)
    {
        id: 'rhythm-surfer',
        emoji: '🎵',
        theme: { grass: '#00E5FF', dirt: '#006064', stone: '#004D40', accent: '#FF4081' }
    },
    // 12. Dream Catcher - Moonlit Haven (Indigo/Purple)
    {
        id: 'dream-catcher',
        emoji: '🌙',
        theme: { grass: '#7986CB', dirt: '#5C6BC0', stone: '#3949AB', accent: '#B388FF' }
    },
    // 13. Star Note - Observatory (Navy/Gold)
    {
        id: 'star-note',
        emoji: '⭐',
        theme: { grass: '#3F51B5', dirt: '#303F9F', stone: '#1A237E', accent: '#FFD700' }
    },
    // 14. Breath Bubble - Cloud Terrace (White/Mint)
    {
        id: 'breath-bubble',
        emoji: '🫧',
        theme: { grass: '#E8F5E9', dirt: '#B2DFDB', stone: '#80CBC4', accent: '#A7FFEB' }
    },
    // 15. Mind Cloud - Zen Sanctuary (White/Pink)
    {
        id: 'mind-cloud',
        emoji: '☁️',
        theme: { grass: '#FFFFFF', dirt: '#FCE4EC', stone: '#F8BBD9', accent: '#F48FB1' }
    },
    // 16. Sleep Nest - Cozy Treehouse (Lavender)
    {
        id: 'sleep-nest',
        emoji: '😴',
        theme: { grass: '#D1C4E9', dirt: '#B39DDB', stone: '#7E57C2', accent: '#9575CD' }
    },
    // 17. Character Settings - Mirror Stage (Silver)
    {
        id: 'character-settings',
        emoji: '🎭',
        theme: { grass: '#ECEFF1', dirt: '#B0BEC5', stone: '#607D8B', accent: '#78909C' }
    },
];

// ==================== APP-SPECIFIC BUILDINGS ====================
interface AppBuildingProps {
    appId: string;
    theme: { grass: string; dirt: string; stone: string; accent: string };
    hovered: boolean;
}

function AppBuilding({ appId, theme, hovered }: AppBuildingProps) {
    const emissive = hovered ? theme.accent : '#000000';
    const emissiveIntensity = hovered ? 0.2 : 0;

    switch (appId) {
        case 'focus-cat':
            // Cat Cafe with cat ear arches + enhanced details
            return (
                <group>
                    <RoundedBox args={[2.5, 1.8, 2]} radius={0.15} position={[0, 0.9, 0]} castShadow>
                        <meshStandardMaterial color="#FFE4C4" roughness={0.9} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </RoundedBox>
                    {/* Cat ears */}
                    <mesh position={[-0.7, 2.2, 0]} castShadow>
                        <coneGeometry args={[0.4, 0.8, 4]} />
                        <meshStandardMaterial color="#FF6B6B" roughness={0.9} />
                    </mesh>
                    <mesh position={[0.7, 2.2, 0]} castShadow>
                        <coneGeometry args={[0.4, 0.8, 4]} />
                        <meshStandardMaterial color="#FF6B6B" roughness={0.9} />
                    </mesh>
                    {/* Main window */}
                    <RoundWindow position={[0, 1.1, 1.01]} radius={0.35} glowing={true} frameColor="#DEB887" />
                    {/* Side windows */}
                    <Window position={[-0.8, 1.1, 1.01]} size={[0.3, 0.4, 0.05]} glowing={true} frameColor="#DEB887" />
                    <Window position={[0.8, 1.1, 1.01]} size={[0.3, 0.4, 0.05]} glowing={true} frameColor="#DEB887" />
                    {/* Door */}
                    <Door position={[0, 0.4, 1.01]} size={[0.5, 0.7, 0.08]} doorColor="#8B4513" hasWindow={true} />
                    {/* Hanging sign */}
                    <HangingSign position={[1.3, 1.8, 0.8]} text="🐱" backgroundColor="#FF6B6B" />
                    {/* Flower box under window */}
                    <FlowerBox position={[0, 0.15, 1.15]} width={1.2} flowerColors={['#FF69B4', '#FFB6C1', '#FF6B6B']} />
                    {/* Chimney */}
                    <Chimney position={[0.8, 2.0, -0.5]} color="#CD5C5C" hasSmoke={true} />
                    {/* Awning over door */}
                    <Awning position={[0, 1.5, 1.3]} width={1.2} color="#FF6B6B" stripeColor="#FFE4C4" />
                </group>
            );

        case 'tiny-wins':
            // Greenhouse with glass dome + architectural details
            return (
                <group>
                    <RoundedBox args={[2.2, 1.2, 2.2]} radius={0.1} position={[0, 0.6, 0]} castShadow>
                        <meshStandardMaterial color="#8D6E63" roughness={0.9} />
                    </RoundedBox>
                    <mesh position={[0, 1.8, 0]} castShadow>
                        <sphereGeometry args={[1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color="#81C784" roughness={0.3} transparent opacity={0.7} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                    {/* Plants */}
                    <mesh position={[-0.5, 1.5, 0]}>
                        <sphereGeometry args={[0.3, 8, 8]} />
                        <meshStandardMaterial color="#4CAF50" roughness={0.9} />
                    </mesh>
                    <mesh position={[0.5, 1.6, 0.3]}>
                        <sphereGeometry args={[0.25, 8, 8]} />
                        <meshStandardMaterial color="#66BB6A" roughness={0.9} />
                    </mesh>
                    {/* Greenhouse windows */}
                    <Window position={[-0.6, 0.6, 1.11]} size={[0.35, 0.4, 0.05]} glowing={true} frameColor="#5D4037" glassColor="#A5D6A7" />
                    <Window position={[0.6, 0.6, 1.11]} size={[0.35, 0.4, 0.05]} glowing={true} frameColor="#5D4037" glassColor="#A5D6A7" />
                    {/* Door */}
                    <Door position={[0, 0.4, 1.11]} size={[0.45, 0.7, 0.08]} doorColor="#6D4C41" hasWindow={true} />
                    {/* Signboard */}
                    <Signboard position={[0, 1.35, 1.2]} text="🌱 GARDEN" backgroundColor="#5D4037" textColor="#AED581" size={[1.3, 0.3, 0.08]} />
                    {/* Flower boxes */}
                    <FlowerBox position={[-0.6, 0.15, 1.25]} width={0.6} flowerColors={['#81C784', '#AED581', '#C5E1A5']} />
                    <FlowerBox position={[0.6, 0.15, 1.25]} width={0.6} flowerColors={['#66BB6A', '#81C784', '#A5D6A7']} />
                </group>
            );

        case 'stretch-timer':
            // Yoga pagoda with zen feel + architectural details
            return (
                <group>
                    <mesh position={[0, 0.5, 0]} castShadow>
                        <cylinderGeometry args={[1.2, 1.4, 1, 8]} />
                        <meshStandardMaterial color="#B2DFDB" roughness={0.9} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                    <mesh position={[0, 1.3, 0]} castShadow>
                        <cylinderGeometry args={[1.6, 0.2, 0.4, 8]} />
                        <meshStandardMaterial color="#80CBC4" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 1.8, 0]} castShadow>
                        <sphereGeometry args={[0.3, 16, 16]} />
                        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />
                    </mesh>
                    {/* Zen windows (round style) */}
                    <RoundWindow position={[0.9, 0.5, 0.7]} radius={0.18} glowing={true} frameColor="#4DB6AC" glassColor="#E0F2F1" />
                    <RoundWindow position={[-0.9, 0.5, 0.7]} radius={0.18} glowing={true} frameColor="#4DB6AC" glassColor="#E0F2F1" />
                    {/* Entrance opening */}
                    <mesh position={[0, 0.35, 1.15]}>
                        <boxGeometry args={[0.5, 0.6, 0.1]} />
                        <meshStandardMaterial color="#004D40" />
                    </mesh>
                    {/* Hanging sign */}
                    <HangingSign position={[1.4, 1.2, 0.5]} text="🧘" backgroundColor="#80CBC4" />
                    {/* Yoga mat */}
                    <mesh position={[0, 0.02, 1.8]} rotation={[-Math.PI / 2, 0, 0]}>
                        <boxGeometry args={[0.8, 1.2, 0.03]} />
                        <meshStandardMaterial color="#E91E63" roughness={0.9} />
                    </mesh>
                </group>
            );

        case 'goal-tycoon':
            // Construction crane + site office with details
            return (
                <group>
                    {/* Crane tower */}
                    <mesh position={[0, 1.5, 0]} castShadow>
                        <boxGeometry args={[0.3, 3, 0.3]} />
                        <meshStandardMaterial color="#FF9800" roughness={0.8} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                    <mesh position={[0.8, 2.8, 0]} castShadow>
                        <boxGeometry args={[1.8, 0.2, 0.2]} />
                        <meshStandardMaterial color="#FFB74D" roughness={0.8} />
                    </mesh>
                    {/* Hook */}
                    <mesh position={[1.5, 2.2, 0]}>
                        <boxGeometry args={[0.05, 0.8, 0.05]} />
                        <meshStandardMaterial color="#424242" />
                    </mesh>
                    {/* Site Office */}
                    <RoundedBox args={[1.8, 1.0, 1.2]} radius={0.08} position={[-1.2, 0.5, 0.8]} castShadow>
                        <meshStandardMaterial color="#FFD54F" roughness={0.9} />
                    </RoundedBox>
                    {/* Office windows */}
                    <Window position={[-1.5, 0.55, 1.41]} size={[0.3, 0.35, 0.05]} glowing={true} frameColor="#FF9800" glassColor="#FFF8E1" />
                    <Window position={[-0.9, 0.55, 1.41]} size={[0.3, 0.35, 0.05]} glowing={true} frameColor="#FF9800" glassColor="#FFF8E1" />
                    {/* Office door */}
                    <Door position={[-1.2, 0.35, 1.41]} size={[0.35, 0.6, 0.06]} doorColor="#E65100" />
                    {/* Construction sign */}
                    <Signboard position={[-1.2, 1.15, 0.8]} text="🏗️ BUILD" backgroundColor="#FF9800" textColor="#FFFFFF" size={[1.2, 0.28, 0.06]} />
                    {/* Warning light */}
                    <mesh position={[0, 3.1, 0]}>
                        <sphereGeometry args={[0.12, 8, 8]} />
                        <meshStandardMaterial color="#FF5722" emissive="#FF5722" emissiveIntensity={0.8} />
                    </mesh>
                    {/* Safety barriers */}
                    <mesh position={[1.2, 0.3, 1.2]}>
                        <boxGeometry args={[0.15, 0.5, 0.15]} />
                        <meshStandardMaterial color="#FF9800" />
                    </mesh>
                    <mesh position={[1.2, 0.3, -1.2]}>
                        <boxGeometry args={[0.15, 0.5, 0.15]} />
                        <meshStandardMaterial color="#FF9800" />
                    </mesh>
                </group>
            );

        case 'daily-quest':
            // Knight tent with flag + adventure details
            return (
                <group>
                    {/* Main tent */}
                    <mesh position={[0, 1.2, 0]} castShadow>
                        <coneGeometry args={[1.8, 2, 6]} />
                        <meshStandardMaterial color="#C8E6C9" roughness={0.9} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                    {/* Tent stripes */}
                    <mesh position={[0, 1.2, 0.01]} castShadow>
                        <coneGeometry args={[1.75, 1.95, 6]} />
                        <meshStandardMaterial color="#A5D6A7" roughness={0.9} wireframe />
                    </mesh>
                    {/* Flag pole */}
                    <mesh position={[0, 2.8, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
                        <meshStandardMaterial color="#5D4037" />
                    </mesh>
                    {/* Flag */}
                    <mesh position={[0.3, 3.2, 0]}>
                        <boxGeometry args={[0.5, 0.35, 0.02]} />
                        <meshStandardMaterial color="#FFD700" />
                    </mesh>
                    {/* Tent entrance */}
                    <mesh position={[0, 0.5, 1.2]}>
                        <boxGeometry args={[0.6, 0.9, 0.05]} />
                        <meshStandardMaterial color="#4E342E" />
                    </mesh>
                    {/* Quest board */}
                    <Signboard position={[1.5, 1.0, 0]} text="⚔️ QUESTS" backgroundColor="#5D4037" textColor="#FFD700" size={[1.0, 0.35, 0.08]} />
                    {/* Shield decorations */}
                    <mesh position={[-1.6, 1.0, 0.5]} rotation={[0, 0.3, 0]}>
                        <circleGeometry args={[0.28, 8]} />
                        <meshStandardMaterial color="#B71C1C" roughness={0.6} metalness={0.3} />
                    </mesh>
                    {/* Sword cross */}
                    <mesh position={[-1.6, 1.0, 0.52]}>
                        <boxGeometry args={[0.35, 0.06, 0.02]} />
                        <meshStandardMaterial color="#FFD700" metalness={0.6} />
                    </mesh>
                    <mesh position={[-1.6, 1.0, 0.52]}>
                        <boxGeometry args={[0.06, 0.35, 0.02]} />
                        <meshStandardMaterial color="#FFD700" metalness={0.6} />
                    </mesh>
                    {/* Lantern */}
                    <StreetLamp position={[1.8, 0, -0.8]} height={1.5} lightColor="#FFCC80" />
                </group>
            );

        case 'acorn-archive':
            // Giant tree stump library + architectural details
            return (
                <group>
                    {/* Tree trunk base */}
                    <mesh position={[0, 1, 0]} castShadow>
                        <cylinderGeometry args={[1.2, 1.5, 2, 12]} />
                        <meshStandardMaterial color="#8D6E63" roughness={1} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                    {/* Library door */}
                    <Door position={[0, 0.45, 1.25]} size={[0.5, 0.8, 0.1]} doorColor="#5D4037" frameColor="#4E342E" hasWindow={true} />
                    {/* Arched window frames */}
                    <RoundWindow position={[0.85, 1.2, 0.9]} radius={0.22} glowing={true} frameColor="#5D4037" glassColor="#FFCC80" />
                    <RoundWindow position={[-0.85, 1.2, 0.9]} radius={0.22} glowing={true} frameColor="#5D4037" glassColor="#FFCC80" />
                    {/* Bookshelf visible through main window */}
                    <mesh position={[0, 1.3, 1.21]}>
                        <boxGeometry args={[0.7, 0.5, 0.08]} />
                        <meshStandardMaterial color="#FFAB40" emissive="#FF6D00" emissiveIntensity={0.3} />
                    </mesh>
                    {/* Canopy (autumn leaves) */}
                    <mesh position={[0, 2.5, 0]} castShadow>
                        <sphereGeometry args={[1.4, 16, 16]} />
                        <meshStandardMaterial color="#FF6D00" roughness={0.9} />
                    </mesh>
                    {/* Library sign */}
                    <HangingSign position={[1.3, 1.6, 0.6]} text="📚" backgroundColor="#6D4C41" />
                    {/* Welcome mat */}
                    <mesh position={[0, 0.02, 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
                        <boxGeometry args={[0.7, 0.5, 0.02]} />
                        <meshStandardMaterial color="#4E342E" />
                    </mesh>
                    {/* Chimney */}
                    <Chimney position={[0.6, 2.2, -0.5]} color="#795548" hasSmoke={true} />
                </group>
            );

        case 'acorn-bank':
            // Golden vault with enhanced details
            return (
                <group>
                    <RoundedBox args={[2.2, 2, 2]} radius={0.2} position={[0, 1, 0]} castShadow>
                        <meshStandardMaterial color="#FFD700" roughness={0.4} metalness={0.6} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </RoundedBox>
                    {/* Vault door with frame */}
                    <mesh position={[0, 0.9, 1.01]}>
                        <circleGeometry args={[0.6, 16]} />
                        <meshStandardMaterial color="#FFC107" roughness={0.3} metalness={0.7} />
                    </mesh>
                    {/* Door handle */}
                    <mesh position={[0, 0.9, 1.15]}>
                        <torusGeometry args={[0.15, 0.03, 8, 16]} />
                        <meshStandardMaterial color="#B8860B" roughness={0.3} metalness={0.8} />
                    </mesh>
                    {/* Gold coins stacks */}
                    <mesh position={[1.3, 0.3, 0.5]}>
                        <cylinderGeometry args={[0.25, 0.25, 0.4, 16]} />
                        <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.6} />
                    </mesh>
                    <mesh position={[1.3, 0.5, 0.2]}>
                        <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} />
                        <meshStandardMaterial color="#FFC107" roughness={0.3} metalness={0.6} />
                    </mesh>
                    {/* Bank sign */}
                    <Signboard position={[0, 2.3, 0.5]} text="🏦 BANK" backgroundColor="#B8860B" textColor="#FFD700" size={[1.5, 0.35, 0.08]} />
                    {/* Entry columns */}
                    <mesh position={[-0.9, 1, 1.1]} castShadow>
                        <cylinderGeometry args={[0.12, 0.15, 2, 8]} />
                        <meshStandardMaterial color="#DAA520" roughness={0.4} metalness={0.5} />
                    </mesh>
                    <mesh position={[0.9, 1, 1.1]} castShadow>
                        <cylinderGeometry args={[0.12, 0.15, 2, 8]} />
                        <meshStandardMaterial color="#DAA520" roughness={0.4} metalness={0.5} />
                    </mesh>
                    {/* Windows */}
                    <Window position={[-0.7, 1.5, 1.01]} size={[0.35, 0.45, 0.05]} glowing={true} frameColor="#B8860B" glassColor="#FFF8DC" />
                    <Window position={[0.7, 1.5, 1.01]} size={[0.35, 0.45, 0.05]} glowing={true} frameColor="#B8860B" glassColor="#FFF8DC" />
                </group>
            );

        case 'vibe-painter':
            // Art studio with paint splashes + architectural details
            return (
                <group>
                    <RoundedBox args={[2, 2, 1.8]} radius={0.15} position={[0, 1, 0]} castShadow>
                        <meshStandardMaterial color="#F8BBD9" roughness={0.9} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </RoundedBox>
                    {/* Easel */}
                    <mesh position={[1.2, 1.2, 0]} rotation={[0, 0, 0.2]}>
                        <boxGeometry args={[0.8, 1.2, 0.1]} />
                        <meshStandardMaterial color="#E91E63" />
                    </mesh>
                    {/* Paint splashes on roof */}
                    <mesh position={[-0.8, 2.2, 0.5]}>
                        <sphereGeometry args={[0.25, 8, 8]} />
                        <meshStandardMaterial color="#00BCD4" />
                    </mesh>
                    <mesh position={[0.3, 2.4, -0.5]}>
                        <sphereGeometry args={[0.2, 8, 8]} />
                        <meshStandardMaterial color="#FFEB3B" />
                    </mesh>
                    {/* Studio windows (large glass panels) */}
                    <Window position={[-0.55, 1.2, 0.91]} size={[0.5, 0.7, 0.05]} glowing={true} frameColor="#9C27B0" glassColor="#FCE4EC" />
                    <Window position={[0.35, 1.2, 0.91]} size={[0.4, 0.5, 0.05]} glowing={true} frameColor="#9C27B0" glassColor="#F8BBD9" />
                    {/* Door */}
                    <Door position={[0, 0.4, 0.91]} size={[0.45, 0.7, 0.08]} doorColor="#7B1FA2" hasWindow={true} />
                    {/* Artist's signboard */}
                    <Signboard position={[0, 2.15, 0.5]} text="🎨 STUDIO" backgroundColor="#9C27B0" textColor="#FFFFFF" size={[1.3, 0.28, 0.06]} />
                    {/* Awning with stripes */}
                    <Awning position={[0, 1.65, 1.1]} width={1.6} color="#E91E63" stripeColor="#F8BBD9" />
                    {/* Palette decoration */}
                    <mesh position={[-1.1, 1.4, 0.85]} rotation={[0.1, 0.3, 0.1]}>
                        <cylinderGeometry args={[0.25, 0.22, 0.06, 12]} />
                        <meshStandardMaterial color="#8D6E63" />
                    </mesh>
                    {/* Paint dots on palette */}
                    <mesh position={[-1.2, 1.45, 0.82]}>
                        <sphereGeometry args={[0.06, 8, 8]} />
                        <meshStandardMaterial color="#FF5722" />
                    </mesh>
                    <mesh position={[-1.0, 1.47, 0.88]}>
                        <sphereGeometry args={[0.05, 8, 8]} />
                        <meshStandardMaterial color="#4CAF50" />
                    </mesh>
                </group>
            );

        case 'menu-oracle':
            // Mystic fortune teller tent + architectural details
            return (
                <group>
                    {/* Main tent */}
                    <mesh position={[0, 1.3, 0]} castShadow>
                        <coneGeometry args={[1.8, 2.2, 8]} />
                        <meshStandardMaterial color="#B388FF" roughness={0.8} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                    {/* Tent decoration - mystical symbols */}
                    <mesh position={[0, 1.3, 1.2]}>
                        <circleGeometry args={[0.2, 16]} />
                        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />
                    </mesh>
                    {/* Crystal ball on pedestal */}
                    <mesh position={[0, 0.35, 0]}>
                        <cylinderGeometry args={[0.3, 0.35, 0.25, 8]} />
                        <meshStandardMaterial color="#512DA8" roughness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.7, 0]}>
                        <sphereGeometry args={[0.4, 16, 16]} />
                        <meshStandardMaterial color="#E1BEE7" transparent opacity={0.8} emissive="#CE93D8" emissiveIntensity={0.5} />
                    </mesh>
                    {/* Moon decoration on top */}
                    <mesh position={[0, 2.6, 0]}>
                        <torusGeometry args={[0.2, 0.08, 8, 16, Math.PI]} />
                        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} />
                    </mesh>
                    {/* Entrance curtain */}
                    <mesh position={[0, 0.6, 1.35]}>
                        <boxGeometry args={[0.7, 1.0, 0.05]} />
                        <meshStandardMaterial color="#7C4DFF" />
                    </mesh>
                    {/* Mystical sign */}
                    <HangingSign position={[1.5, 1.4, 0.5]} text="🔮" backgroundColor="#512DA8" />
                    {/* Candle holders on sides */}
                    <mesh position={[-1.3, 0.5, 0.8]}>
                        <cylinderGeometry args={[0.08, 0.1, 0.3, 8]} />
                        <meshStandardMaterial color="#5D4037" />
                    </mesh>
                    <mesh position={[-1.3, 0.72, 0.8]}>
                        <sphereGeometry args={[0.06, 8, 8]} />
                        <meshStandardMaterial color="#FFEB3B" emissive="#FFCC00" emissiveIntensity={0.8} />
                    </mesh>
                    <mesh position={[1.3, 0.5, 0.8]}>
                        <cylinderGeometry args={[0.08, 0.1, 0.3, 8]} />
                        <meshStandardMaterial color="#5D4037" />
                    </mesh>
                    <mesh position={[1.3, 0.72, 0.8]}>
                        <sphereGeometry args={[0.06, 8, 8]} />
                        <meshStandardMaterial color="#FFEB3B" emissive="#FFCC00" emissiveIntensity={0.8} />
                    </mesh>
                </group>
            );

        case 'karma-ripple':
            // Zen pond with lotus + architectural details
            return (
                <group>
                    {/* Stone border around pond */}
                    <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[1.85, 0.12, 8, 24]} />
                        <meshStandardMaterial color="#78909C" roughness={0.9} />
                    </mesh>
                    {/* Pond water */}
                    <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[1.8, 24]} />
                        <meshStandardMaterial color="#4DD0E1" transparent opacity={0.8} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                    {/* Lotus flower with more petals */}
                    <mesh position={[0, 0.25, 0]}>
                        <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
                        <meshStandardMaterial color="#81C784" />
                    </mesh>
                    <mesh position={[0, 0.38, 0]}>
                        <sphereGeometry args={[0.2, 8, 8]} />
                        <meshStandardMaterial color="#F8BBD9" />
                    </mesh>
                    {/* Lily pads */}
                    <mesh position={[-0.8, 0.12, 0.5]} rotation={[-Math.PI / 2, 0, 0.3]}>
                        <circleGeometry args={[0.25, 12]} />
                        <meshStandardMaterial color="#4CAF50" side={2} />
                    </mesh>
                    <mesh position={[0.9, 0.12, -0.4]} rotation={[-Math.PI / 2, 0, -0.2]}>
                        <circleGeometry args={[0.2, 12]} />
                        <meshStandardMaterial color="#66BB6A" side={2} />
                    </mesh>
                    {/* Bamboo grove */}
                    <mesh position={[1.5, 1, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
                        <meshStandardMaterial color="#81C784" />
                    </mesh>
                    <mesh position={[1.3, 0.8, 0.3]}>
                        <cylinderGeometry args={[0.06, 0.06, 1.6, 8]} />
                        <meshStandardMaterial color="#A5D6A7" />
                    </mesh>
                    <mesh position={[1.65, 0.6, -0.2]}>
                        <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
                        <meshStandardMaterial color="#81C784" />
                    </mesh>
                    {/* Wooden bridge */}
                    <mesh position={[-1.6, 0.25, 0]} rotation={[0, Math.PI / 2, 0]}>
                        <boxGeometry args={[0.8, 0.08, 0.7]} />
                        <meshStandardMaterial color="#8D6E63" />
                    </mesh>
                    {/* Bridge railings */}
                    <mesh position={[-1.6, 0.45, 0.3]}>
                        <boxGeometry args={[0.04, 0.3, 0.7]} />
                        <meshStandardMaterial color="#6D4C41" />
                    </mesh>
                    <mesh position={[-1.6, 0.45, -0.3]}>
                        <boxGeometry args={[0.04, 0.3, 0.7]} />
                        <meshStandardMaterial color="#6D4C41" />
                    </mesh>
                    {/* Zen sign */}
                    <HangingSign position={[1.8, 1.3, 0.5]} text="💧" backgroundColor="#00838F" />
                </group>
            );

        case 'rhythm-surfer':
            // Neon DJ booth + architectural details
            return (
                <group>
                    {/* Main booth */}
                    <RoundedBox args={[2.5, 1.2, 1.5]} radius={0.15} position={[0, 0.6, 0]} castShadow>
                        <meshStandardMaterial color="#006064" roughness={0.6} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </RoundedBox>
                    {/* Neon strip lights */}
                    <mesh position={[0, 1.25, 0.76]}>
                        <boxGeometry args={[2.4, 0.06, 0.04]} />
                        <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={0.8} />
                    </mesh>
                    <mesh position={[0, 0.1, 0.76]}>
                        <boxGeometry args={[2.4, 0.06, 0.04]} />
                        <meshStandardMaterial color="#FF4081" emissive="#FF4081" emissiveIntensity={0.8} />
                    </mesh>
                    {/* Speakers with details */}
                    <mesh position={[-1.5, 1.2, 0]} castShadow>
                        <boxGeometry args={[0.6, 1, 0.5]} />
                        <meshStandardMaterial color="#212121" />
                    </mesh>
                    <mesh position={[-1.5, 1.35, 0.26]}>
                        <circleGeometry args={[0.15, 12]} />
                        <meshStandardMaterial color="#424242" />
                    </mesh>
                    <mesh position={[-1.5, 1.0, 0.26]}>
                        <circleGeometry args={[0.2, 12]} />
                        <meshStandardMaterial color="#424242" />
                    </mesh>
                    <mesh position={[1.5, 1.2, 0]} castShadow>
                        <boxGeometry args={[0.6, 1, 0.5]} />
                        <meshStandardMaterial color="#212121" />
                    </mesh>
                    <mesh position={[1.5, 1.35, 0.26]}>
                        <circleGeometry args={[0.15, 12]} />
                        <meshStandardMaterial color="#424242" />
                    </mesh>
                    <mesh position={[1.5, 1.0, 0.26]}>
                        <circleGeometry args={[0.2, 12]} />
                        <meshStandardMaterial color="#424242" />
                    </mesh>
                    {/* Disco ball with chain */}
                    <mesh position={[0, 2.6, 0]}>
                        <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
                        <meshStandardMaterial color="#9E9E9E" />
                    </mesh>
                    <mesh position={[0, 2.2, 0]}>
                        <sphereGeometry args={[0.35, 12, 12]} />
                        <meshStandardMaterial color="#E0E0E0" roughness={0.2} metalness={0.8} emissive="#00E5FF" emissiveIntensity={0.3} />
                    </mesh>
                    {/* DJ signboard */}
                    <Signboard position={[0, 1.85, 0]} text="🎵 BEATS" backgroundColor="#212121" textColor="#00E5FF" size={[1.4, 0.28, 0.06]} />
                    {/* Vinyl record decoration */}
                    <mesh position={[0, 0.7, 0.78]} rotation={[0, 0, 0]}>
                        <cylinderGeometry args={[0.3, 0.3, 0.02, 24]} />
                        <meshStandardMaterial color="#1A1A1A" roughness={0.5} />
                    </mesh>
                    <mesh position={[0, 0.7, 0.79]}>
                        <circleGeometry args={[0.08, 16]} />
                        <meshStandardMaterial color="#FF4081" />
                    </mesh>
                </group>
            );

        case 'dream-catcher':
            // Crescent moon pavilion + architectural details
            return (
                <group>
                    {/* Moon arch with gradient effect */}
                    <mesh position={[0, 1.8, 0]} rotation={[0, 0, Math.PI / 6]}>
                        <torusGeometry args={[1.2, 0.25, 8, 24, Math.PI]} />
                        <meshStandardMaterial color="#7986CB" emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                    {/* Moon surface details */}
                    <mesh position={[-0.5, 2.3, 0.1]}>
                        <sphereGeometry args={[0.06, 8, 8]} />
                        <meshStandardMaterial color="#5C6BC0" />
                    </mesh>
                    <mesh position={[0.3, 2.0, 0.15]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshStandardMaterial color="#5C6BC0" />
                    </mesh>
                    {/* Decorative platform */}
                    <mesh position={[0, 0.15, 0]} castShadow>
                        <cylinderGeometry args={[1.5, 1.5, 0.3, 16]} />
                        <meshStandardMaterial color="#5C6BC0" roughness={0.9} />
                    </mesh>
                    {/* Platform edge detail */}
                    <mesh position={[0, 0.32, 0]}>
                        <torusGeometry args={[1.52, 0.04, 8, 24]} />
                        <meshStandardMaterial color="#7986CB" />
                    </mesh>
                    {/* Dream catcher web structure */}
                    <mesh position={[0, 1.2, 0.3]}>
                        <torusGeometry args={[0.35, 0.02, 6, 12]} />
                        <meshStandardMaterial color="#B388FF" />
                    </mesh>
                    {/* Hanging feathers */}
                    <mesh position={[-0.2, 0.7, 0.35]}>
                        <boxGeometry args={[0.04, 0.3, 0.01]} />
                        <meshStandardMaterial color="#CE93D8" />
                    </mesh>
                    <mesh position={[0.2, 0.65, 0.35]}>
                        <boxGeometry args={[0.04, 0.35, 0.01]} />
                        <meshStandardMaterial color="#B39DDB" />
                    </mesh>
                    <mesh position={[0, 0.6, 0.35]}>
                        <boxGeometry args={[0.04, 0.4, 0.01]} />
                        <meshStandardMaterial color="#9FA8DA" />
                    </mesh>
                    {/* Stars cluster */}
                    <mesh position={[0.8, 2.5, 0]}>
                        <octahedronGeometry args={[0.15]} />
                        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} />
                    </mesh>
                    <mesh position={[-0.9, 2.2, 0.2]}>
                        <octahedronGeometry args={[0.1]} />
                        <meshStandardMaterial color="#FFC107" emissive="#FFC107" emissiveIntensity={0.6} />
                    </mesh>
                    <mesh position={[0.2, 2.7, -0.1]}>
                        <octahedronGeometry args={[0.08]} />
                        <meshStandardMaterial color="#FFEB3B" emissive="#FFEB3B" emissiveIntensity={0.5} />
                    </mesh>
                    {/* Hanging sign */}
                    <HangingSign position={[1.6, 1.3, 0]} text="🌙" backgroundColor="#3949AB" />
                </group>
            );

        case 'star-note':
            // Observatory dome + architectural details
            return (
                <group>
                    {/* Main building cylinder */}
                    <mesh position={[0, 0.6, 0]} castShadow>
                        <cylinderGeometry args={[1.3, 1.5, 1.2, 8]} />
                        <meshStandardMaterial color="#3F51B5" roughness={0.8} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                    {/* Observatory dome with opening */}
                    <mesh position={[0, 1.6, 0]} castShadow>
                        <sphereGeometry args={[1.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color="#303F9F" roughness={0.6} metalness={0.3} />
                    </mesh>
                    {/* Dome opening slot */}
                    <mesh position={[0.4, 1.9, 0.5]} rotation={[0.3, 0, 0]}>
                        <boxGeometry args={[0.5, 0.6, 0.05]} />
                        <meshStandardMaterial color="#1A237E" />
                    </mesh>
                    {/* Telescope with mount */}
                    <mesh position={[0, 1.3, 0]}>
                        <cylinderGeometry args={[0.15, 0.15, 0.4, 8]} />
                        <meshStandardMaterial color="#5D4037" />
                    </mesh>
                    <mesh position={[0.5, 2, 0.5]} rotation={[0.4, 0.5, 0]}>
                        <cylinderGeometry args={[0.12, 0.18, 0.8, 8]} />
                        <meshStandardMaterial color="#FFD700" roughness={0.4} metalness={0.6} />
                    </mesh>
                    {/* Windows around base */}
                    <RoundWindow position={[0.9, 0.6, 0.9]} radius={0.18} glowing={true} frameColor="#283593" glassColor="#C5CAE9" />
                    <RoundWindow position={[-0.9, 0.6, 0.9]} radius={0.18} glowing={true} frameColor="#283593" glassColor="#C5CAE9" />
                    {/* Door */}
                    <Door position={[0, 0.35, 1.3]} size={[0.45, 0.6, 0.08]} doorColor="#1A237E" hasWindow={true} />
                    {/* Observatory sign */}
                    <Signboard position={[0, 1.35, 1.1]} text="⭐ STARS" backgroundColor="#1A237E" textColor="#FFD700" size={[1.1, 0.25, 0.06]} />
                    {/* Star decorations */}
                    <mesh position={[1.4, 1.8, 0.3]}>
                        <octahedronGeometry args={[0.1]} />
                        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.6} />
                    </mesh>
                    <mesh position={[-1.3, 2.0, -0.2]}>
                        <octahedronGeometry args={[0.08]} />
                        <meshStandardMaterial color="#FFC107" emissive="#FFC107" emissiveIntensity={0.5} />
                    </mesh>
                </group>
            );

        case 'breath-bubble':
            // Cloud terrace with bubbles + architectural details
            return (
                <group>
                    {/* Main cloud base */}
                    <mesh position={[0, 0.5, 0]} castShadow>
                        <sphereGeometry args={[1.2, 16, 16]} />
                        <meshStandardMaterial color="#FFFFFF" roughness={1} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                    {/* Cloud extensions */}
                    <mesh position={[-0.8, 0.3, 0.4]}>
                        <sphereGeometry args={[0.7, 16, 16]} />
                        <meshStandardMaterial color="#E8F5E9" roughness={1} />
                    </mesh>
                    <mesh position={[0.9, 0.35, 0.3]}>
                        <sphereGeometry args={[0.6, 16, 16]} />
                        <meshStandardMaterial color="#F1F8E9" roughness={1} />
                    </mesh>
                    <mesh position={[0.5, 0.2, -0.6]}>
                        <sphereGeometry args={[0.55, 16, 16]} />
                        <meshStandardMaterial color="#E8F5E9" roughness={1} />
                    </mesh>
                    {/* Bubbles with variety */}
                    <mesh position={[0.5, 1.5, 0]}>
                        <sphereGeometry args={[0.35, 16, 16]} />
                        <meshStandardMaterial color="#A7FFEB" transparent opacity={0.6} />
                    </mesh>
                    <mesh position={[-0.3, 1.8, 0.3]}>
                        <sphereGeometry args={[0.25, 16, 16]} />
                        <meshStandardMaterial color="#B2DFDB" transparent opacity={0.5} />
                    </mesh>
                    <mesh position={[0.8, 2.0, -0.2]}>
                        <sphereGeometry args={[0.18, 16, 16]} />
                        <meshStandardMaterial color="#80DEEA" transparent opacity={0.5} />
                    </mesh>
                    {/* Meditation cushion */}
                    <mesh position={[0, 0.95, 0.3]}>
                        <cylinderGeometry args={[0.35, 0.38, 0.12, 16]} />
                        <meshStandardMaterial color="#80CBC4" roughness={0.9} />
                    </mesh>
                    {/* Zen hanging wind chime */}
                    <mesh position={[-1.0, 1.6, 0.5]}>
                        <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
                        <meshStandardMaterial color="#B0BEC5" metalness={0.7} />
                    </mesh>
                    <mesh position={[-1.0, 1.35, 0.5]}>
                        <cylinderGeometry args={[0.06, 0.04, 0.12, 8]} />
                        <meshStandardMaterial color="#90A4AE" metalness={0.7} />
                    </mesh>
                    {/* Breath sign */}
                    <HangingSign position={[1.2, 1.4, 0.2]} text="🫧" backgroundColor="#80CBC4" />
                </group>
            );

        case 'mind-cloud':
            // Zen torii gate + architectural details
            return (
                <group>
                    {/* Torii posts with bases */}
                    <mesh position={[-0.8, 0.1, 0]}>
                        <boxGeometry args={[0.25, 0.2, 0.25]} />
                        <meshStandardMaterial color="#424242" roughness={0.9} />
                    </mesh>
                    <mesh position={[-0.8, 1, 0]} castShadow>
                        <cylinderGeometry args={[0.12, 0.15, 2, 8]} />
                        <meshStandardMaterial color="#E53935" roughness={0.9} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                    <mesh position={[0.8, 0.1, 0]}>
                        <boxGeometry args={[0.25, 0.2, 0.25]} />
                        <meshStandardMaterial color="#424242" roughness={0.9} />
                    </mesh>
                    <mesh position={[0.8, 1, 0]} castShadow>
                        <cylinderGeometry args={[0.12, 0.15, 2, 8]} />
                        <meshStandardMaterial color="#E53935" roughness={0.9} />
                    </mesh>
                    {/* Top beams (kasagi and nuki) */}
                    <mesh position={[0, 2.1, 0]} castShadow>
                        <boxGeometry args={[2.4, 0.15, 0.3]} />
                        <meshStandardMaterial color="#B71C1C" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 2, 0]} castShadow>
                        <boxGeometry args={[2.2, 0.2, 0.25]} />
                        <meshStandardMaterial color="#C62828" roughness={0.9} />
                    </mesh>
                    {/* Secondary horizontal beam */}
                    <mesh position={[0, 1.5, 0]}>
                        <boxGeometry args={[1.4, 0.1, 0.12]} />
                        <meshStandardMaterial color="#D32F2F" />
                    </mesh>
                    {/* Cherry blossom tree */}
                    <mesh position={[1.5, 0.6, 0.3]}>
                        <cylinderGeometry args={[0.1, 0.12, 1.2, 8]} />
                        <meshStandardMaterial color="#5D4037" />
                    </mesh>
                    <mesh position={[1.5, 1.4, 0.3]}>
                        <sphereGeometry args={[0.55, 8, 8]} />
                        <meshStandardMaterial color="#F8BBD9" roughness={0.9} />
                    </mesh>
                    {/* Smaller blossom cluster */}
                    <mesh position={[1.8, 1.2, 0]}>
                        <sphereGeometry args={[0.3, 8, 8]} />
                        <meshStandardMaterial color="#FCE4EC" roughness={0.9} />
                    </mesh>
                    {/* Stone path */}
                    <mesh position={[0, 0.02, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.2, 8]} />
                        <meshStandardMaterial color="#9E9E9E" roughness={1} />
                    </mesh>
                    <mesh position={[0, 0.02, 1.3]} rotation={[-Math.PI / 2, 0, 0.2]}>
                        <circleGeometry args={[0.22, 8]} />
                        <meshStandardMaterial color="#BDBDBD" roughness={1} />
                    </mesh>
                    {/* Paper lantern */}
                    <mesh position={[-1.4, 1.0, 0.3]}>
                        <capsuleGeometry args={[0.12, 0.2, 4, 8]} />
                        <meshStandardMaterial color="#FFF8E1" emissive="#FFCC00" emissiveIntensity={0.3} />
                    </mesh>
                    {/* Zen sign */}
                    <HangingSign position={[0, 2.4, 0]} text="☁️" backgroundColor="#C62828" />
                </group>
            );

        case 'sleep-nest':
            // Cozy treehouse nest + architectural details
            return (
                <group>
                    {/* Tree trunk with texture rings */}
                    <mesh position={[0, 0.8, 0]} castShadow>
                        <cylinderGeometry args={[0.5, 0.7, 1.6, 8]} />
                        <meshStandardMaterial color="#8D6E63" roughness={1} />
                    </mesh>
                    {/* Trunk ring decorations */}
                    <mesh position={[0, 0.5, 0.55]}>
                        <torusGeometry args={[0.55, 0.04, 8, 16]} />
                        <meshStandardMaterial color="#6D4C41" />
                    </mesh>
                    {/* Nest basket with woven texture */}
                    <mesh position={[0, 1.8, 0]} castShadow>
                        <sphereGeometry args={[1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                        <meshStandardMaterial color="#D7CCC8" roughness={1} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                    {/* Nest rim */}
                    <mesh position={[0, 1.4, 0]}>
                        <torusGeometry args={[1.15, 0.08, 8, 24]} />
                        <meshStandardMaterial color="#BCAAA4" />
                    </mesh>
                    {/* Cozy pillows inside */}
                    <mesh position={[-0.3, 1.5, 0.2]}>
                        <sphereGeometry args={[0.25, 8, 8]} />
                        <meshStandardMaterial color="#CE93D8" roughness={0.9} />
                    </mesh>
                    <mesh position={[0.25, 1.45, -0.15]}>
                        <sphereGeometry args={[0.22, 8, 8]} />
                        <meshStandardMaterial color="#B39DDB" roughness={0.9} />
                    </mesh>
                    {/* Leaf roof with layers */}
                    <mesh position={[0, 2.8, 0]} castShadow>
                        <coneGeometry args={[1.5, 1, 8]} />
                        <meshStandardMaterial color="#81C784" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 2.55, 0]}>
                        <coneGeometry args={[1.3, 0.4, 8]} />
                        <meshStandardMaterial color="#A5D6A7" roughness={0.9} />
                    </mesh>
                    {/* Ladder */}
                    <mesh position={[0.9, 1.0, 0.6]} rotation={[0.3, -0.2, 0]}>
                        <boxGeometry args={[0.08, 1.4, 0.08]} />
                        <meshStandardMaterial color="#5D4037" />
                    </mesh>
                    <mesh position={[1.1, 1.0, 0.5]} rotation={[0.3, -0.2, 0]}>
                        <boxGeometry args={[0.08, 1.4, 0.08]} />
                        <meshStandardMaterial color="#5D4037" />
                    </mesh>
                    {/* Ladder rungs */}
                    <mesh position={[1.0, 0.6, 0.55]}>
                        <boxGeometry args={[0.3, 0.04, 0.06]} />
                        <meshStandardMaterial color="#6D4C41" />
                    </mesh>
                    <mesh position={[1.0, 0.9, 0.55]}>
                        <boxGeometry args={[0.3, 0.04, 0.06]} />
                        <meshStandardMaterial color="#6D4C41" />
                    </mesh>
                    <mesh position={[1.0, 1.2, 0.55]}>
                        <boxGeometry args={[0.3, 0.04, 0.06]} />
                        <meshStandardMaterial color="#6D4C41" />
                    </mesh>
                    {/* Moon with glow */}
                    <mesh position={[1.5, 3, 0]}>
                        <sphereGeometry args={[0.3, 16, 16]} />
                        <meshStandardMaterial color="#FFF9C4" emissive="#FFF59D" emissiveIntensity={0.5} />
                    </mesh>
                    {/* Sleep sign */}
                    <HangingSign position={[-1.3, 1.8, 0.3]} text="😴" backgroundColor="#7E57C2" />
                    {/* Small window in nest */}
                    <RoundWindow position={[0.8, 1.6, 0.7]} radius={0.15} glowing={true} frameColor="#A1887F" glassColor="#FFF8E1" />
                </group>
            );

        case 'character-settings':
            // Mirror stage with spotlight + dressing room details
            return (
                <group>
                    {/* Stage platform with edge lights */}
                    <mesh position={[0, 0.15, 0]} castShadow>
                        <cylinderGeometry args={[1.5, 1.5, 0.3, 16]} />
                        <meshStandardMaterial color="#ECEFF1" roughness={0.5} metalness={0.3} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </mesh>
                    {/* Stage edge trim */}
                    <mesh position={[0, 0.02, 0]}>
                        <torusGeometry args={[1.52, 0.04, 8, 24]} />
                        <meshStandardMaterial color="#FFD700" metalness={0.6} />
                    </mesh>
                    {/* Mirror frame (ornate) */}
                    <mesh position={[0, 1.5, -0.8]} castShadow>
                        <boxGeometry args={[1.7, 2.1, 0.12]} />
                        <meshStandardMaterial color="#78909C" roughness={0.4} metalness={0.5} />
                    </mesh>
                    {/* Frame decorative corners */}
                    <mesh position={[-0.75, 2.4, -0.74]}>
                        <sphereGeometry args={[0.1, 8, 8]} />
                        <meshStandardMaterial color="#FFD700" metalness={0.7} />
                    </mesh>
                    <mesh position={[0.75, 2.4, -0.74]}>
                        <sphereGeometry args={[0.1, 8, 8]} />
                        <meshStandardMaterial color="#FFD700" metalness={0.7} />
                    </mesh>
                    <mesh position={[-0.75, 0.5, -0.74]}>
                        <sphereGeometry args={[0.1, 8, 8]} />
                        <meshStandardMaterial color="#FFD700" metalness={0.7} />
                    </mesh>
                    <mesh position={[0.75, 0.5, -0.74]}>
                        <sphereGeometry args={[0.1, 8, 8]} />
                        <meshStandardMaterial color="#FFD700" metalness={0.7} />
                    </mesh>
                    {/* Mirror surface */}
                    <mesh position={[0, 1.5, -0.7]}>
                        <boxGeometry args={[1.4, 1.8, 0.05]} />
                        <meshStandardMaterial color="#E0E0E0" roughness={0.1} metalness={0.9} />
                    </mesh>
                    {/* Vanity lights around mirror */}
                    <mesh position={[-0.8, 2.2, -0.6]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshStandardMaterial color="#FFFDE7" emissive="#FFECB3" emissiveIntensity={0.6} />
                    </mesh>
                    <mesh position={[0, 2.5, -0.6]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshStandardMaterial color="#FFFDE7" emissive="#FFECB3" emissiveIntensity={0.6} />
                    </mesh>
                    <mesh position={[0.8, 2.2, -0.6]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshStandardMaterial color="#FFFDE7" emissive="#FFECB3" emissiveIntensity={0.6} />
                    </mesh>
                    {/* Spotlight with beam */}
                    <mesh position={[0, 3, 0]}>
                        <coneGeometry args={[0.3, 0.5, 8]} />
                        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} />
                    </mesh>
                    <mesh position={[0, 2.6, 0]}>
                        <cylinderGeometry args={[0.02, 0.25, 0.3, 8]} />
                        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.15} />
                    </mesh>
                    {/* Costume rack */}
                    <mesh position={[1.3, 0.6, 0]}>
                        <cylinderGeometry args={[0.04, 0.04, 1.0, 8]} />
                        <meshStandardMaterial color="#455A64" metalness={0.6} />
                    </mesh>
                    <mesh position={[1.3, 1.1, 0]}>
                        <boxGeometry args={[0.6, 0.04, 0.04]} />
                        <meshStandardMaterial color="#455A64" metalness={0.6} />
                    </mesh>
                    {/* Hanging clothes */}
                    <mesh position={[1.1, 0.85, 0]}>
                        <boxGeometry args={[0.18, 0.4, 0.06]} />
                        <meshStandardMaterial color="#E91E63" />
                    </mesh>
                    <mesh position={[1.4, 0.8, 0]}>
                        <boxGeometry args={[0.15, 0.35, 0.06]} />
                        <meshStandardMaterial color="#2196F3" />
                    </mesh>
                    {/* Character sign */}
                    <Signboard position={[0, 2.8, -0.3]} text="🎭 STYLE" backgroundColor="#455A64" textColor="#FFFFFF" size={[1.0, 0.25, 0.06]} />
                </group>
            );

        default:
            // Default simple building
            return (
                <group>
                    <RoundedBox args={[2, 2, 2]} radius={0.2} position={[0, 1, 0]} castShadow>
                        <meshStandardMaterial color={theme.accent} roughness={0.8} emissive={emissive} emissiveIntensity={emissiveIntensity} />
                    </RoundedBox>
                </group>
            );
    }
}

// ==================== ISLAND DECORATIONS ====================
function IslandDecorations({ appId }: { appId: string }) {
    switch (appId) {
        case 'focus-cat':
            // Cat cafe - cozy decorations
            return (
                <group position={[0, 0.75, 0]}>
                    <IslandTree position={[-3, 0, 2]} treeType="round" scale={0.7} />
                    <FlowerPatch position={[3, 0, 2.5]} color="#FF69B4" />
                    <WoodenFence position={[-3.5, 0, -2]} length={4} />
                    <GlowingLanternFlame position={[2.5, 0, -2]} />
                </group>
            );
        case 'tiny-wins':
            // Garden - lots of plants with floating leaves
            return (
                <group position={[0, 0.75, 0]}>
                    <IslandTree position={[-3, 0, 1]} treeType="round" scale={0.8} />
                    <IslandTree position={[3, 0, -1]} treeType="round" scale={0.6} />
                    <FlowerPatch position={[-2, 0, 3]} color="#66BB6A" />
                    <FlowerPatch position={[2, 0, 3]} color="#AED581" />
                    <FloatingLeaves position={[0, 2, 0]} count={8} color="#81C784" />
                </group>
            );
        case 'stretch-timer':
            // Zen garden - minimal
            return (
                <group position={[0, 0.75, 0]}>
                    <IslandTree position={[-3, 0, -2]} treeType="cherry" scale={0.8} />
                    <RockCluster position={[3, 0, 2]} scale={0.8} />
                    <FloatingLeaves position={[0, 2, 0]} count={5} color="#F8BBD9" />
                </group>
            );
        case 'goal-tycoon':
            // Construction site with animated windmill
            return (
                <group position={[0, 0.75, 0]}>
                    <RockCluster position={[-3, 0, 2]} scale={1} />
                    <WoodenFence position={[2, 0, -3]} length={3} />
                    <AnimatedWindmill position={[3, 0, 1.5]} scale={0.8} />
                </group>
            );
        case 'daily-quest':
            // Knight outpost
            return (
                <group position={[0, 0.75, 0]}>
                    <IslandTree position={[-3.5, 0, 0]} treeType="pine" scale={0.9} />
                    <IslandTree position={[3.5, 0, 0]} treeType="pine" scale={0.7} />
                    <WoodenFence position={[-2, 0, 3]} length={5} />
                    <GlowingLanternFlame position={[-3, 0, 2.5]} />
                </group>
            );
        case 'acorn-archive':
            // Library - autumn trees with falling leaves
            return (
                <group position={[0, 0.75, 0]}>
                    <IslandTree position={[-3, 0, -2]} treeType="round" scale={0.9} />
                    <IslandTree position={[3, 0, -2]} treeType="round" scale={0.7} />
                    <GlowingLanternFlame position={[-2, 0, 3]} />
                    <GlowingLanternFlame position={[2, 0, 3]} />
                    <FloatingLeaves position={[0, 3, 0]} count={6} color="#FFAB40" />
                </group>
            );
        case 'acorn-bank':
            // Golden vault - fancy with glowing lanterns
            return (
                <group position={[0, 0.75, 0]}>
                    <GlowingLanternFlame position={[-2.5, 0, 2.5]} />
                    <GlowingLanternFlame position={[2.5, 0, 2.5]} />
                    <WoodenFence position={[-3, 0, -2.5]} length={4} />
                    <TwinklingStars position={[0, 3, 0]} count={3} />
                </group>
            );
        case 'vibe-painter':
            // Art studio - colorful
            return (
                <group position={[0, 0.75, 0]}>
                    <FlowerPatch position={[-3, 0, 2]} color="#E91E63" />
                    <FlowerPatch position={[3, 0, 2]} color="#00BCD4" />
                    <FlowerPatch position={[0, 0, 3]} color="#FFEB3B" />
                    <FloatingBubbles position={[0, 2, 0]} count={5} />
                </group>
            );
        case 'menu-oracle':
            // Mystic tent - mysterious with pulsing crystals
            return (
                <group position={[0, 0.75, 0]}>
                    <IslandTree position={[-3.5, 0, 0]} treeType="pine" scale={0.8} />
                    <RockCluster position={[3, 0, 2]} scale={0.7} />
                    <PulsingCrystal position={[-2, 1.5, 2]} color="#B388FF" scale={0.8} />
                    <PulsingCrystal position={[2.5, 1.2, -1]} color="#7C4DFF" scale={0.6} />
                    <PulsingCrystal position={[-1, 1.8, -2]} color="#E040FB" scale={0.5} />
                </group>
            );
        case 'karma-ripple':
            // Zen pond - bamboo with water ripples
            return (
                <group position={[0, 0.75, 0]}>
                    <IslandTree position={[-3, 0, -2]} treeType="cherry" scale={0.9} />
                    <RockCluster position={[3, 0, -2]} scale={0.6} />
                    <WaterRipples position={[0, 0.5, 0]} scale={1.5} />
                </group>
            );
        case 'rhythm-surfer':
            // Neon DJ - urban with spinning disco ball
            return (
                <group position={[0, 0.75, 0]}>
                    <GlowingLanternFlame position={[-3, 0, 2]} />
                    <GlowingLanternFlame position={[3, 0, 2]} />
                    <SpinningDiscoBall position={[0, 3.5, 0]} scale={1.2} />
                </group>
            );
        case 'dream-catcher':
            // Moon pavilion - ethereal with twinkling stars
            return (
                <group position={[0, 0.75, 0]}>
                    <IslandTree position={[-3, 0, -1]} treeType="cherry" scale={0.8} />
                    <FlowerPatch position={[3, 0, 2]} color="#B388FF" />
                    <TwinklingStars position={[0, 3, 0]} count={7} />
                </group>
            );
        case 'star-note':
            // Observatory with many twinkling stars
            return (
                <group position={[0, 0.75, 0]}>
                    <IslandTree position={[-3.5, 0, 0]} treeType="pine" scale={0.9} />
                    <RockCluster position={[3, 0, 2]} scale={0.8} />
                    <TwinklingStars position={[0, 4, 0]} count={10} />
                </group>
            );
        case 'breath-bubble':
            // Cloud terrace - fluffy with floating bubbles
            return (
                <group position={[0, 0.75, 0]}>
                    <FlowerPatch position={[-3, 0, 2]} color="#A7FFEB" />
                    <FlowerPatch position={[3, 0, 2]} color="#B2DFDB" />
                    <FloatingBubbles position={[0, 1.5, 0]} count={12} />
                </group>
            );
        case 'mind-cloud':
            // Torii gate - zen with cherry blossom petals
            return (
                <group position={[0, 0.75, 0]}>
                    <IslandTree position={[-3, 0, -2]} treeType="cherry" scale={0.9} />
                    <IslandTree position={[3, 0, -2]} treeType="cherry" scale={0.7} />
                    <FloatingLeaves position={[0, 2.5, 0]} count={10} color="#F8BBD9" />
                </group>
            );
        case 'sleep-nest':
            // Treehouse with sleeping Zzz
            return (
                <group position={[0, 0.75, 0]}>
                    <IslandTree position={[-3, 0, 1]} treeType="round" scale={0.8} />
                    <FlowerPatch position={[3, 0, 2.5]} color="#D1C4E9" />
                    <SleepingZzz position={[0.5, 3, 0.5]} />
                    <TwinklingStars position={[0, 4, 0]} count={4} />
                </group>
            );
        case 'character-settings':
            // Mirror stage - elegant
            return (
                <group position={[0, 0.75, 0]}>
                    <GlowingLanternFlame position={[-3, 0, 1]} />
                    <GlowingLanternFlame position={[3, 0, 1]} />
                    <RockCluster position={[0, 0, 3]} scale={0.6} />
                </group>
            );
        default:
            return null;
    }
}

// ==================== CIRCULAR LAYOUT CALCULATOR ====================
export function getCircularPosition(index: number, totalCount: number, radius: number): [number, number, number] {
    // Start from top (negative Z) and go clockwise
    const angle = (index / totalCount) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    return [x, 0, z];
}

// ==================== SINGLE APP ISLAND COMPONENT ====================
interface AppIslandProps {
    island: AppIslandData;
    position: [number, number, number];
    onClick: () => void;
    isSelected: boolean;
    hasQuest: boolean;
    appName: string;
}

export function AppIsland({
    island,
    position,
    onClick,
    isSelected,
    hasQuest,
    appName,
}: AppIslandProps) {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const { theme } = island;

    useFrame((state) => {
        if (groupRef.current) {
            // Gentle floating animation
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0] * 0.1) * 0.1;
        }
    });

    // Island size - smaller for individual app islands
    const islandSize: [number, number, number] = [8, 1.5, 8];

    return (
        <group ref={groupRef} position={position}>
            {/* ===== VOXEL CAKE TERRAIN LAYERS ===== */}

            {/* TOP: Grass Layer */}
            <RoundedBox
                args={islandSize}
                radius={0.3}
                smoothness={2}
                position={[0, 0, 0]}
                onClick={onClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                receiveShadow
                castShadow
            >
                <meshStandardMaterial
                    color={theme.grass}
                    roughness={0.95}
                    metalness={0}
                    emissive={hovered ? theme.accent : '#000000'}
                    emissiveIntensity={hovered ? 0.15 : 0}
                />
            </RoundedBox>

            {/* MIDDLE: Dirt Layer */}
            <RoundedBox
                args={[islandSize[0] - 0.5, 2, islandSize[2] - 0.5]}
                radius={0.2}
                smoothness={2}
                position={[0, -1.75, 0]}
                castShadow
            >
                <meshStandardMaterial color={theme.dirt} roughness={1} metalness={0} />
            </RoundedBox>

            {/* BOTTOM: Stone Layer */}
            <RoundedBox
                args={[islandSize[0] - 1, 1.5, islandSize[2] - 1]}
                radius={0.15}
                smoothness={2}
                position={[0, -3.5, 0]}
                castShadow
            >
                <meshStandardMaterial color={theme.stone} roughness={1} metalness={0} />
            </RoundedBox>

            {/* Hanging rocks underneath */}
            <mesh position={[-2, -4.5, -2]} castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={theme.stone} roughness={1} />
            </mesh>
            <mesh position={[2, -5, 1.5]} castShadow>
                <boxGeometry args={[0.8, 1.5, 0.8]} />
                <meshStandardMaterial color={theme.stone} roughness={1} />
            </mesh>

            {/* ===== APP-SPECIFIC BUILDINGS ===== */}
            <group position={[0, 0.75, 0]}>
                <AppBuilding appId={island.id} theme={theme} hovered={hovered} />
            </group>

            {/* ===== ISLAND DECORATIONS ===== */}
            <IslandDecorations appId={island.id} />

            {/* ===== EMOJI MARKER ===== */}
            <Html position={[0, 4, 0]} center zIndexRange={[0, 50]}>
                <div
                    style={{
                        fontSize: hovered ? '2.5rem' : '2rem',
                        transition: 'all 0.2s ease',
                        textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 15px rgba(255,255,255,0.5)',
                        transform: hovered ? 'scale(1.2) translateY(-5px)' : 'scale(1)',
                        cursor: 'pointer',
                        filter: isSelected ? 'drop-shadow(0 0 10px white)' : 'none',
                    }}
                    onClick={onClick}
                >
                    {island.emoji}
                </div>
            </Html>

            {/* Quest indicator */}
            {hasQuest && (
                <Html position={[1.5, 4.5, 0]} center zIndexRange={[0, 50]}>
                    <div style={{
                        fontSize: '1.2rem',
                        animation: 'bounce 1s infinite',
                    }}>
                        ❗
                    </div>
                </Html>
            )}

            {/* App name on hover */}
            {hovered && (
                <Html position={[0, 5, 0]} center zIndexRange={[0, 50]}>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    }}>
                        {appName}
                    </div>
                </Html>
            )}
        </group>
    );
}

// ==================== 17 ISLANDS CIRCULAR LAYOUT ====================
interface IslandWorldProps {
    onAppClick: (appId: string) => void;
    selectedApp: string | null;
    questApps: string[];
    getAppName: (appId: string) => string;
}

export function IslandWorld({
    onAppClick,
    selectedApp,
    questApps,
    getAppName,
}: IslandWorldProps) {
    const LAYOUT_RADIUS = 35; // Distance from center

    return (
        <group>
            {APP_ISLANDS.map((island, index) => {
                const pos = getCircularPosition(index, APP_ISLANDS.length, LAYOUT_RADIUS);

                return (
                    <AppIsland
                        key={island.id}
                        island={island}
                        position={pos}
                        onClick={() => onAppClick(island.id)}
                        isSelected={selectedApp === island.id}
                        hasQuest={questApps.includes(island.id)}
                        appName={getAppName(island.id)}
                    />
                );
            })}
        </group>
    );
}

export default IslandWorld;
