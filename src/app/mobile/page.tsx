'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileWorldMap from '@/components/MobileWorldMap';
import { usePageTransition } from '@/components/PageTransition';

// App metadata for preview toast
const APP_META: Record<string, { emoji: string; name: string; nameKo: string; desc: string; descKo: string; color: string }> = {
    'focus-cat': { emoji: '🐱', name: 'Focus Cat', nameKo: '포커스 캣', desc: 'Pomodoro Timer', descKo: '뽀모도로 타이머', color: '#E63946' },
    'tiny-wins': { emoji: '🌱', name: 'Tiny Wins', nameKo: '작은 승리', desc: 'Habit Tracker', descKo: '습관 트래커', color: '#4CAF50' },
    'stretch-timer': { emoji: '🧘', name: 'Stretch Timer', nameKo: '스트레칭 타이머', desc: 'Break Reminder', descKo: '스트레칭 알림', color: '#66BB6A' },
    'goal-tycoon': { emoji: '🏗️', name: 'Goal Tycoon', nameKo: '골 타이쿤', desc: 'Goal Planner', descKo: '목표 관리', color: '#FF9800' },
    'daily-quest': { emoji: '⚔️', name: 'Daily Quest', nameKo: '데일리 퀘스트', desc: 'Daily Missions', descKo: '일일 미션', color: '#FFC107' },
    'acorn-archive': { emoji: '📚', name: 'Acorn Archive', nameKo: '도토리 서재', desc: 'Note Archive', descKo: '노트 보관소', color: '#795548' },
    'acorn-bank': { emoji: '🏦', name: 'Acorn Bank', nameKo: '도토리 은행', desc: 'Point Bank', descKo: '포인트 관리', color: '#FFD54F' },
    'vibe-painter': { emoji: '🎨', name: 'Vibe Painter', nameKo: '분위기 화가', desc: 'Mood Painter', descKo: '감정 기록', color: '#B388FF' },
    'menu-oracle': { emoji: '🔮', name: 'Menu Oracle', nameKo: '메뉴 오라클', desc: 'Food Oracle', descKo: '메뉴 추천', color: '#9C27B0' },
    'karma-ripple': { emoji: '💧', name: 'Karma Ripple', nameKo: '카르마 리플', desc: 'Good Deeds', descKo: '선행 기록', color: '#7C4DFF' },
    'rhythm-surfer': { emoji: '🎵', name: 'Rhythm Surfer', nameKo: '리듬 서퍼', desc: 'Music Player', descKo: '음악 플레이어', color: '#3F51B5' },
    'dream-catcher': { emoji: '🌙', name: 'Dream Catcher', nameKo: '드림 캐처', desc: 'Dream Journal', descKo: '꿈 일기', color: '#5C6BC0' },
    'star-note': { emoji: '⭐', name: 'Star Note', nameKo: '별 노트', desc: 'Gratitude Diary', descKo: '감사 일기', color: '#42A5F5' },
    'breath-bubble': { emoji: '🫧', name: 'Breath Bubble', nameKo: '숨결 방울', desc: 'Breathing Guide', descKo: '호흡 가이드', color: '#E0E0E0' },
    'mind-cloud': { emoji: '☁️', name: 'Mind Cloud', nameKo: '마음 구름', desc: 'Mind Map', descKo: '마인드맵', color: '#F5F5F5' },
    'sleep-nest': { emoji: '😴', name: 'Sleep Nest', nameKo: '잠의 둥지', desc: 'Sleep Aid', descKo: '수면 도우미', color: '#90A4AE' },
    'character-settings': { emoji: '🎭', name: 'Character', nameKo: '캐릭터 설정', desc: 'My Avatar', descKo: '아바타 설정', color: '#F8BBD0' },
};

export default function MobilePage() {
    const router = useRouter();
    const { navigateWithTransition } = usePageTransition();
    const [selectedApp, setSelectedApp] = useState<string | null>(null);
    const [language, setLanguage] = useState<'en' | 'ko'>('ko');
    const [showToast, setShowToast] = useState(false);

    // Quest apps (connect to your actual quest system later)
    const questApps = ['focus-cat', 'tiny-wins', 'daily-quest'];

    // Load language preference
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLang = localStorage.getItem('brookvale-language') as 'en' | 'ko';
            if (savedLang) setLanguage(savedLang);
        }
    }, []);

    const handleAppClick = (appId: string) => {
        setSelectedApp(appId);
        setShowToast(true);

        // Navigate with transition after a brief visual feedback delay
        setTimeout(() => {
            navigateWithTransition(`/${appId}`);
        }, 300);
    };

    // Auto-hide toast
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => setShowToast(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    const appInfo = selectedApp ? APP_META[selectedApp] : null;

    return (
        <main style={{
            minHeight: '100vh',
            background: '#0D1B3E',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Header */}
            <header style={{
                padding: '12px 16px',
                background: 'linear-gradient(180deg, rgba(13, 27, 62, 0.98), rgba(13, 27, 62, 0.85))',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div style={{
                    fontFamily: "'Fredoka One', 'Outfit', sans-serif",
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    color: '#FFD54F',
                    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    🌰 Brookvale
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {/* 3D View Toggle */}
                    <button
                        onClick={() => {
                            localStorage.setItem('brookvale-view-mode', '3d');
                            navigateWithTransition('/');
                        }}
                        style={{
                            background: 'linear-gradient(135deg, rgba(77, 171, 247, 0.3), rgba(102, 126, 234, 0.3))',
                            border: '1px solid rgba(77, 171, 247, 0.4)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: '#81D4FA',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        🎮 3D
                    </button>
                    {/* Language Toggle */}
                    <button
                        onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {language === 'ko' ? 'EN' : '한국어'}
                    </button>
                    <button style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                    }}>
                        🔊
                    </button>
                    <button
                        onClick={() => navigateWithTransition('/character-settings')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: 'white',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                        }}
                    >
                        👤
                    </button>
                </div>
            </header>

            {/* World Map */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MobileWorldMap
                    onAppClick={handleAppClick}
                    questApps={questApps}
                    language={language}
                />
            </div>

            {/* Bottom Navigation */}
            <nav style={{
                padding: '10px 16px',
                paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
                background: 'linear-gradient(0deg, rgba(13, 27, 62, 0.98), rgba(13, 27, 62, 0.85))',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-around',
            }}>
                {[
                    { icon: '🏠', label: language === 'ko' ? '홈' : 'Home', active: true, href: '/mobile' },
                    { icon: '📜', label: language === 'ko' ? '퀘스트' : 'Quests', active: false, href: '/daily-quest' },
                    { icon: '🏦', label: language === 'ko' ? '은행' : 'Bank', active: false, href: '/acorn-bank' },
                    { icon: '⚙️', label: language === 'ko' ? '설정' : 'Settings', active: false, href: '/character-settings' },
                ].map((item, i) => (
                    <button
                        key={i}
                        onClick={() => item.active ? null : navigateWithTransition(item.href)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '3px',
                            cursor: 'pointer',
                            opacity: item.active ? 1 : 0.55,
                            transition: 'opacity 0.2s ease',
                            padding: '4px 12px',
                        }}
                    >
                        <span style={{ fontSize: '1.35rem' }}>{item.icon}</span>
                        <span style={{
                            fontSize: '0.65rem',
                            color: item.active ? '#FFD54F' : 'rgba(255,255,255,0.8)',
                            fontWeight: item.active ? 700 : 400,
                        }}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </nav>

            {/* App Preview Toast */}
            {showToast && appInfo && (
                <div style={{
                    position: 'fixed',
                    bottom: '90px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.92)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    animation: 'toast-slide 0.25s ease-out',
                    border: `1px solid ${appInfo.color}40`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${appInfo.color}20`,
                    zIndex: 100,
                }}>
                    <span style={{
                        fontSize: '2rem',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${appInfo.color}30`,
                        borderRadius: '12px',
                    }}>
                        {appInfo.emoji}
                    </span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            {language === 'ko' ? appInfo.nameKo : appInfo.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                            {language === 'ko' ? appInfo.descKo : appInfo.desc}
                        </div>
                    </div>
                    <span style={{
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.4)',
                        marginLeft: '8px',
                    }}>
                        →
                    </span>
                </div>
            )}

            <style jsx>{`
                @keyframes toast-slide {
                    from { opacity: 0; transform: translateX(-50%) translateY(12px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>
        </main>
    );
}
