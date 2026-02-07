'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

// ==================== 17 APP ISLAND HOTSPOT DATA ====================
// Positions are percentages relative to the map image (top-left = 0,0)
// Calibrated for 1:1 aspect ratio circular archipelago layout
// Each island sits on the circle at ~21° intervals (360/17 ≈ 21.18°)

interface IslandHotspot {
    id: string;
    emoji: string;
    name: string;
    nameKo: string;
    x: number; // 0-100 percent
    y: number; // 0-100 percent
    size: number; // base diameter in percentage
    zone: 'forest' | 'town' | 'lake' | 'hill' | 'cloud';
    description: string;
}

// ==================== HAND-CALIBRATED ISLAND POSITIONS ====================
// Manually matched to world-map.png pixel coordinates → percentage
// Image is 1024x1024 square. Positions target the center of each island.
// Layout: clockwise from 12 o'clock, matching the isometric 3D map image.

const ISLAND_HOTSPOTS: IslandHotspot[] = [
    // ===== TOP (12 o'clock) =====
    // Focus Cat — the cat-shaped café at top center
    { id: 'focus-cat', emoji: '🐱', name: 'Focus Cat', nameKo: '포커스 캣', x: 50, y: 10, size: 12, zone: 'forest', description: 'Pomodoro Timer' },

    // ===== UPPER RIGHT =====
    // Tiny Wins — greenhouse with plants, upper right
    { id: 'tiny-wins', emoji: '🌱', name: 'Tiny Wins', nameKo: '작은 승리', x: 72, y: 15, size: 12, zone: 'forest', description: 'Habit Tracker' },
    // Stretch Timer — Japanese-style temple, right side
    { id: 'stretch-timer', emoji: '🧘', name: 'Stretch Timer', nameKo: '스트레칭', x: 82, y: 30, size: 12, zone: 'forest', description: 'Break Reminder' },

    // ===== RIGHT SIDE =====
    // Daily Quest — flagged sandy outpost
    { id: 'daily-quest', emoji: '⚔️', name: 'Daily Quest', nameKo: '데일리 퀘스트', x: 78, y: 46, size: 12, zone: 'town', description: 'Daily Missions' },
    // Goal Tycoon — yellow island with crane
    { id: 'goal-tycoon', emoji: '🏗️', name: 'Goal Tycoon', nameKo: '골 타이쿤', x: 86, y: 58, size: 12, zone: 'town', description: 'Goal Planner' },

    // ===== LOWER RIGHT =====
    // Acorn Archive — autumn library island with red trees
    { id: 'acorn-archive', emoji: '📚', name: 'Acorn Archive', nameKo: '도토리 서재', x: 72, y: 60, size: 12, zone: 'town', description: 'Note Archive' },
    // Acorn Bank — golden bank with coin stacks
    { id: 'acorn-bank', emoji: '🏦', name: 'Acorn Bank', nameKo: '도토리 은행', x: 82, y: 74, size: 12, zone: 'town', description: 'Point Bank' },

    // ===== BOTTOM RIGHT =====
    // Karma Ripple — brown tent / campsite
    { id: 'karma-ripple', emoji: '💧', name: 'Karma Ripple', nameKo: '카르마 리플', x: 72, y: 82, size: 12, zone: 'lake', description: 'Good Deeds' },

    // ===== BOTTOM CENTER =====
    // Vibe Painter — pink easel island
    { id: 'vibe-painter', emoji: '🎨', name: 'Vibe Painter', nameKo: '분위기 화가', x: 55, y: 90, size: 12, zone: 'lake', description: 'Mood Painter' },
    // Menu Oracle — purple fortune teller with crystal ball
    { id: 'menu-oracle', emoji: '🔮', name: 'Menu Oracle', nameKo: '메뉴 오라클', x: 40, y: 86, size: 12, zone: 'lake', description: 'Food Oracle' },

    // ===== BOTTOM LEFT =====
    // Rhythm Surfer — neon DJ booth with purple lights
    { id: 'rhythm-surfer', emoji: '🎵', name: 'Rhythm Surfer', nameKo: '리듬 서퍼', x: 28, y: 78, size: 12, zone: 'hill', description: 'Music Player' },
    // Vibe Pond / Karma Ripple pond — teal pond island with lily pads
    { id: 'dream-catcher', emoji: '🌙', name: 'Dream Catcher', nameKo: '드림 캐처', x: 38, y: 68, size: 12, zone: 'hill', description: 'Dream Journal' },

    // ===== LEFT SIDE =====
    // Star Note — dome observatory, left center
    { id: 'star-note', emoji: '⭐', name: 'Star Note', nameKo: '별 노트', x: 14, y: 60, size: 12, zone: 'hill', description: 'Gratitude Diary' },
    // Sleep Nest — dark purple Japanese shrine with moons
    { id: 'sleep-nest', emoji: '😴', name: 'Sleep Nest', nameKo: '잠의 둥지', x: 26, y: 55, size: 12, zone: 'cloud', description: 'Sleep Aid' },

    // ===== UPPER LEFT =====
    // Mind Cloud — white cloud islands, upper left
    { id: 'mind-cloud', emoji: '☁️', name: 'Mind Cloud', nameKo: '마음 구름', x: 12, y: 40, size: 12, zone: 'cloud', description: 'Mind Map' },
    // Breath Bubble — misty cloud platform
    { id: 'breath-bubble', emoji: '🫧', name: 'Breath Bubble', nameKo: '숨결 방울', x: 22, y: 28, size: 12, zone: 'cloud', description: 'Breathing Guide' },
    // Character — vanity mirror island, upper center-left
    { id: 'character-settings', emoji: '🎭', name: 'Character', nameKo: '캐릭터', x: 35, y: 20, size: 12, zone: 'cloud', description: 'My Avatar' },
];

// Zone colors for visual grouping
const ZONE_COLORS: Record<string, { bg: string; glow: string; border: string }> = {
    forest: { bg: 'rgba(76, 175, 80, 0.25)', glow: 'rgba(76, 175, 80, 0.5)', border: 'rgba(129, 199, 132, 0.6)' },
    town: { bg: 'rgba(255, 193, 7, 0.25)', glow: 'rgba(255, 193, 7, 0.5)', border: 'rgba(255, 213, 79, 0.6)' },
    lake: { bg: 'rgba(156, 39, 176, 0.25)', glow: 'rgba(156, 39, 176, 0.5)', border: 'rgba(206, 147, 216, 0.6)' },
    hill: { bg: 'rgba(63, 81, 181, 0.25)', glow: 'rgba(63, 81, 181, 0.5)', border: 'rgba(121, 134, 203, 0.6)' },
    cloud: { bg: 'rgba(224, 224, 224, 0.2)', glow: 'rgba(255, 255, 255, 0.4)', border: 'rgba(255, 255, 255, 0.5)' },
};

interface MobileWorldMapProps {
    onAppClick: (appId: string) => void;
    questApps?: string[];
    language?: 'en' | 'ko';
}

export default function MobileWorldMap({ onAppClick, questApps = [], language = 'ko' }: MobileWorldMapProps) {
    const [hoveredIsland, setHoveredIsland] = useState<string | null>(null);
    const [selectedIsland, setSelectedIsland] = useState<string | null>(null);
    const [touchActive, setTouchActive] = useState<string | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    // Touch feedback — brief highlight before navigation
    const handleTouch = useCallback((island: IslandHotspot) => {
        setTouchActive(island.id);
        setSelectedIsland(island.id);

        // Haptic feedback (if supported)
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(10);
        }

        // Small delay for visual feedback, then navigate
        setTimeout(() => {
            onAppClick(island.id);
            setTouchActive(null);
        }, 150);
    }, [onAppClick]);

    // Prevent scroll/bounce when touching the map
    useEffect(() => {
        const el = mapRef.current;
        if (!el) return;

        const preventScroll = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                e.preventDefault();
            }
        };
        el.addEventListener('touchmove', preventScroll, { passive: false });
        return () => el.removeEventListener('touchmove', preventScroll);
    }, []);

    return (
        <div className="mobile-world-map-v2" ref={mapRef}>
            <style jsx>{`
                .mobile-world-map-v2 {
                    position: relative;
                    width: 100%;
                    max-width: 100vw;
                    aspect-ratio: 1 / 1;
                    background: radial-gradient(ellipse at center, #1A2B5A 0%, #0D1B3E 70%);
                    overflow: hidden;
                    touch-action: manipulation;
                    user-select: none;
                    -webkit-user-select: none;
                }

                .map-image-container {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .map-image-container img {
                    object-fit: contain;
                    animation: map-breathe 8s ease-in-out infinite;
                }

                @keyframes map-breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.005); }
                }

                /* ===== HOTSPOT BASE ===== */
                .hotspot-v2 {
                    position: absolute;
                    transform: translate(-50%, -50%);
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                    background: transparent;
                    border: 2px solid transparent;
                    z-index: 1;
                    animation: island-bob var(--bob-dur, 3s) ease-in-out infinite;
                    animation-delay: var(--bob-delay, 0s);
                    /* Larger touch target for mobile */
                    min-width: 44px;
                    min-height: 44px;
                }

                @keyframes island-bob {
                    0%, 100% { transform: translate(-50%, -50%) translateY(0); }
                    50% { transform: translate(-50%, -50%) translateY(-3px); }
                }

                /* ===== TOUCH ACTIVE STATE ===== */
                .hotspot-v2.touch-active {
                    transform: translate(-50%, -50%) scale(1.35);
                    z-index: 20;
                    animation: none;
                }

                /* ===== HOVER / FOCUS ===== */
                .hotspot-v2:hover,
                .hotspot-v2.hovered {
                    transform: translate(-50%, -50%) scale(1.2);
                    z-index: 15;
                    animation: none;
                }

                /* ===== QUEST INDICATOR ===== */
                .hotspot-v2.has-quest::after {
                    content: '❗';
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    font-size: 0.85rem;
                    animation: quest-bounce 1s ease-in-out infinite;
                    filter: drop-shadow(0 1px 3px rgba(255, 50, 50, 0.8));
                }

                @keyframes quest-bounce {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-5px) scale(1.1); }
                }

                /* ===== EMOJI ===== */
                .hotspot-emoji-v2 {
                    font-size: 1.6rem;
                    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6));
                    transition: transform 0.2s ease;
                    line-height: 1;
                }

                .hotspot-v2:hover .hotspot-emoji-v2,
                .hotspot-v2.hovered .hotspot-emoji-v2,
                .hotspot-v2.touch-active .hotspot-emoji-v2 {
                    transform: scale(1.15);
                }

                /* ===== APP NAME TOOLTIP ===== */
                .hotspot-label-v2 {
                    position: absolute;
                    bottom: -24px;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    color: white;
                    padding: 3px 10px;
                    border-radius: 6px;
                    font-size: 0.65rem;
                    font-weight: 600;
                    white-space: nowrap;
                    opacity: 0;
                    transform: translateY(4px);
                    transition: all 0.2s ease;
                    pointer-events: none;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    letter-spacing: 0.02em;
                }

                .hotspot-v2:hover .hotspot-label-v2,
                .hotspot-v2.hovered .hotspot-label-v2,
                .hotspot-v2.touch-active .hotspot-label-v2 {
                    opacity: 1;
                    transform: translateY(0);
                }

                /* ===== SELECTED STATE ===== */
                .hotspot-v2.selected {
                    border-color: rgba(255, 215, 0, 0.8);
                    box-shadow: 0 0 16px rgba(255, 215, 0, 0.4);
                }

                /* ===== ZONE RING (subtle background circle showing zone grouping) ===== */
                .zone-ring {
                    position: absolute;
                    background: transparent;
                    border-radius: 50%;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .hotspot-v2:hover ~ .zone-ring,
                .hotspot-v2.hovered ~ .zone-ring {
                    opacity: 0.3;
                }

                /* ===== AMBIENT PARTICLES ===== */
                .particle {
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                    opacity: 0.3;
                    animation: particle-drift var(--p-dur, 10s) linear infinite;
                    animation-delay: var(--p-delay, 0s);
                }

                @keyframes particle-drift {
                    0% {
                        transform: translate(0, 0) scale(1);
                        opacity: 0;
                    }
                    10% { opacity: 0.3; }
                    90% { opacity: 0.3; }
                    100% {
                        transform: translate(var(--p-dx, 50px), var(--p-dy, -80px)) scale(0.5);
                        opacity: 0;
                    }
                }

                /* ===== FLYING BIRD ===== */
                .bird-v2 {
                    position: absolute;
                    font-size: 0.9rem;
                    pointer-events: none;
                    opacity: 0.5;
                    animation: fly-v2 var(--fly-dur, 18s) linear infinite;
                    animation-delay: var(--fly-delay, 0s);
                }

                @keyframes fly-v2 {
                    0% { transform: translateX(-30px) translateY(0); opacity: 0; }
                    5% { opacity: 0.5; }
                    95% { opacity: 0.5; }
                    100% { transform: translateX(calc(100vw + 30px)) translateY(var(--fly-sway, -15px)); opacity: 0; }
                }

                /* ===== CENTER BRANDING ===== */
                .center-brand {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    text-align: center;
                }

                .center-brand .title {
                    font-family: 'Fredoka One', 'Outfit', sans-serif;
                    font-size: 1rem;
                    font-weight: 700;
                    color: rgba(255, 213, 79, 0.6);
                    text-shadow: 0 1px 4px rgba(0,0,0,0.5);
                    letter-spacing: 0.15em;
                }

                .center-brand .subtitle {
                    font-size: 0.6rem;
                    color: rgba(255, 255, 255, 0.35);
                    margin-top: 4px;
                    letter-spacing: 0.05em;
                }

                /* ===== RESPONSIVE ===== */
                @media (max-width: 480px) {
                    .hotspot-emoji-v2 { font-size: 1.3rem; }
                    .hotspot-label-v2 { font-size: 0.6rem; padding: 2px 8px; }
                    .center-brand .title { font-size: 0.85rem; }
                }

                @media (min-width: 769px) {
                    .hotspot-emoji-v2 { font-size: 2rem; }
                    .hotspot-label-v2 { font-size: 0.75rem; }
                }
            `}</style>

            {/* Background Map Image */}
            <div className="map-image-container">
                <Image
                    src="/world-map.png"
                    alt="Brookvale World Map"
                    fill
                    className="map-image"
                    priority
                    sizes="100vw"
                    style={{ objectFit: 'contain' }}
                />
            </div>

            {/* Ambient Particles */}
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={`particle-${i}`}
                    className="particle"
                    style={{
                        left: `${10 + Math.random() * 80}%`,
                        top: `${10 + Math.random() * 80}%`,
                        width: `${2 + Math.random() * 3}px`,
                        height: `${2 + Math.random() * 3}px`,
                        background: ['#FFD54F', '#CE93D8', '#81D4FA', '#A5D6A7', '#FFB74D'][i % 5],
                        '--p-dur': `${8 + Math.random() * 12}s`,
                        '--p-delay': `${Math.random() * 8}s`,
                        '--p-dx': `${-30 + Math.random() * 60}px`,
                        '--p-dy': `${-60 - Math.random() * 40}px`,
                    } as React.CSSProperties}
                />
            ))}

            {/* Clickable Island Hotspots */}
            {ISLAND_HOTSPOTS.map((island, index) => {
                const zoneColor = ZONE_COLORS[island.zone];
                const isHovered = hoveredIsland === island.id;
                const isSelected = selectedIsland === island.id;
                const isTouchActive = touchActive === island.id;
                const hasQuest = questApps.includes(island.id);

                return (
                    <div
                        key={island.id}
                        className={[
                            'hotspot-v2',
                            isHovered ? 'hovered' : '',
                            isSelected ? 'selected' : '',
                            isTouchActive ? 'touch-active' : '',
                            hasQuest ? 'has-quest' : '',
                        ].filter(Boolean).join(' ')}
                        style={{
                            left: `${island.x}%`,
                            top: `${island.y}%`,
                            width: `${island.size}%`,
                            height: `${island.size}%`,
                            '--bob-dur': `${2.5 + (index % 5) * 0.4}s`,
                            '--bob-delay': `${index * 0.15}s`,
                            // Zone-specific glow on hover/active
                            ...(isHovered || isTouchActive
                                ? {
                                    background: zoneColor.bg,
                                    borderColor: zoneColor.border,
                                    boxShadow: `0 0 20px ${zoneColor.glow}, 0 0 40px ${zoneColor.glow.replace('0.5', '0.2')}`,
                                }
                                : {}),
                        } as React.CSSProperties}
                        onClick={() => handleTouch(island)}
                        onMouseEnter={() => setHoveredIsland(island.id)}
                        onMouseLeave={() => setHoveredIsland(null)}
                        onTouchStart={(e) => {
                            e.preventDefault();
                            setHoveredIsland(island.id);
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            handleTouch(island);
                            setHoveredIsland(null);
                        }}
                    >
                        <span className="hotspot-emoji-v2">{island.emoji}</span>
                        <span className="hotspot-label-v2">
                            {language === 'ko' ? island.nameKo : island.name}
                        </span>
                    </div>
                );
            })}

            {/* Flying Birds */}
            <div className="bird-v2" style={{ top: '12%', '--fly-dur': '16s', '--fly-delay': '0s', '--fly-sway': '-12px' } as React.CSSProperties}>🐦</div>
            <div className="bird-v2" style={{ top: '38%', '--fly-dur': '22s', '--fly-delay': '6s', '--fly-sway': '8px' } as React.CSSProperties}>🕊️</div>
            <div className="bird-v2" style={{ top: '60%', '--fly-dur': '19s', '--fly-delay': '12s', '--fly-sway': '-10px' } as React.CSSProperties}>🐦</div>

            {/* Center Branding */}
            <div className="center-brand">
                <div className="title">BROOKVALE</div>
                <div className="subtitle">
                    {language === 'ko' ? '🌰 탭하여 앱 열기' : '🌰 Tap to open apps'}
                </div>
            </div>
        </div>
    );
}
