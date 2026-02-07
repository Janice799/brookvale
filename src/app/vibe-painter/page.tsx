'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import { BackLink } from '@/components/BackLink';
import './vibe-painter.css';

// ==================== TYPES ====================
interface Painting {
    id: string;
    date: string;
    emotions: EmotionState;
    colors: string[];
    title: string;
    artStyle: string;
    note?: string;
}

interface EmotionState {
    energy: number;
    mood: number;
    calm: number;
    creativity: number;
}

interface MoodStats {
    avgEnergy: number;
    avgMood: number;
    avgCalm: number;
    avgCreativity: number;
    totalPaintings: number;
    streak: number;
}

// ==================== CONSTANTS ====================
const ART_STYLES = [
    { id: 'abstract', emoji: '🎨', nameEn: 'Abstract', nameKo: '추상화' },
    { id: 'waves', emoji: '🌊', nameEn: 'Waves', nameKo: '파도' },
    { id: 'galaxy', emoji: '🌌', nameEn: 'Galaxy', nameKo: '은하수' },
    { id: 'garden', emoji: '🌸', nameEn: 'Garden', nameKo: '정원' },
    { id: 'geometric', emoji: '◆', nameEn: 'Geometric', nameKo: '기하학' },
];

const MOOD_PRESETS = [
    { id: 'happy', emoji: '😊', nameEn: 'Happy', nameKo: '행복', values: { energy: 80, mood: 90, calm: 60, creativity: 70 } },
    { id: 'calm', emoji: '🧘', nameEn: 'Peaceful', nameKo: '평화', values: { energy: 40, mood: 70, calm: 90, creativity: 50 } },
    { id: 'energetic', emoji: '⚡', nameEn: 'Energetic', nameKo: '활기', values: { energy: 95, mood: 80, calm: 30, creativity: 85 } },
    { id: 'melancholy', emoji: '🌧️', nameEn: 'Melancholy', nameKo: '우울', values: { energy: 30, mood: 25, calm: 50, creativity: 60 } },
    { id: 'inspired', emoji: '✨', nameEn: 'Inspired', nameKo: '영감', values: { energy: 70, mood: 85, calm: 55, creativity: 95 } },
    { id: 'anxious', emoji: '😰', nameEn: 'Anxious', nameKo: '불안', values: { energy: 75, mood: 35, calm: 15, creativity: 40 } },
];

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        title: 'Vibe Painter',
        back: '← Brookvale',
        howAreYou: 'How are you feeling right now?',
        createArt: '🎨 Create Your Vibe Art',
        gallery: 'My Vibe Gallery',
        empty: 'No paintings yet. Express your feelings!',
        sliders: {
            energy: '⚡ Energy',
            mood: '😊 Mood',
            calm: '🧘 Calm',
            creativity: '✨ Creativity',
        },
        low: 'Low',
        high: 'High',
        sad: 'Sad',
        happy: 'Happy',
        anxious: 'Anxious',
        peaceful: 'Peaceful',
        blocked: 'Blocked',
        inspired: 'Inspired',
        generating: 'Painting your emotions...',
        save: 'Save to Gallery',
        delete: '×',
        todayVibe: "Today's Vibe",
        questComplete: 'Art Created!',
        acornsEarned: '+7 Acorns',
        motivation: '🌸 Every feeling deserves to be seen',
        // New translations
        stats: '📊 Mood Insights',
        artStyle: 'Art Style',
        quickMood: 'Quick Mood',
        addNote: 'Add a note...',
        viewDetails: 'View',
        close: 'Close',
        avgEnergy: 'Avg Energy',
        avgMood: 'Avg Mood',
        avgCalm: 'Avg Calm',
        avgCreativity: 'Creativity',
        moodHistory: 'Mood History',
        thisWeek: 'This Week',
        totalArt: 'Total Art',
        artStreak: 'Art Streak',
        days: 'days',
        paintingDetail: 'Painting Details',
        paintedOn: 'Created on',
        emotions: 'Emotions',
        colorPalette: 'Color Palette',
        note: 'Note',
        noNote: 'No note added',
        shareVibe: '📤 Share',
        downloadArt: '💾 Download',
        dailyReminder: 'How are you feeling today?',
        expressNow: 'Express Now',
    },
    ko: {
        title: '바이브 페인터',
        back: '← 브룩베일',
        howAreYou: '지금 기분이 어떠세요?',
        createArt: '🎨 바이브 아트 만들기',
        gallery: '나의 바이브 갤러리',
        empty: '아직 그림이 없어요. 감정을 표현해보세요!',
        sliders: {
            energy: '⚡ 에너지',
            mood: '😊 기분',
            calm: '🧘 평온',
            creativity: '✨ 창의력',
        },
        low: '낮음',
        high: '높음',
        sad: '우울',
        happy: '행복',
        anxious: '불안',
        peaceful: '평화',
        blocked: '막힘',
        inspired: '영감',
        generating: '감정을 그리는 중...',
        save: '갤러리에 저장',
        delete: '×',
        todayVibe: '오늘의 바이브',
        questComplete: '아트 완성!',
        acornsEarned: '+7 도토리',
        motivation: '🌸 모든 감정은 보여질 자격이 있어요',
        // New translations
        stats: '📊 감정 인사이트',
        artStyle: '아트 스타일',
        quickMood: '빠른 기분 선택',
        addNote: '메모를 추가하세요...',
        viewDetails: '보기',
        close: '닫기',
        avgEnergy: '평균 에너지',
        avgMood: '평균 기분',
        avgCalm: '평균 평온',
        avgCreativity: '창의력',
        moodHistory: '기분 히스토리',
        thisWeek: '이번 주',
        totalArt: '총 작품',
        artStreak: '아트 연속',
        days: '일',
        paintingDetail: '작품 상세',
        paintedOn: '생성일',
        emotions: '감정',
        colorPalette: '색상 팔레트',
        note: '메모',
        noNote: '메모 없음',
        shareVibe: '📤 공유',
        downloadArt: '💾 저장',
        dailyReminder: '오늘 기분이 어떠세요?',
        expressNow: '표현하기',
    },
};

// ==================== COLOR GENERATION ====================
const generateColors = (emotions: EmotionState, style: string): string[] => {
    const colors: string[] = [];

    // Base colors from emotions
    if (emotions.energy > 60) {
        colors.push('#FF6B6B', '#FFE66D');
    } else if (emotions.energy > 30) {
        colors.push('#F8B500', '#FFA07A');
    } else {
        colors.push('#6B7280', '#9CA3AF');
    }

    if (emotions.mood > 60) {
        colors.push('#FFD93D', '#6BCB77');
    } else if (emotions.mood > 30) {
        colors.push('#4ECDC4', '#45B7D1');
    } else {
        colors.push('#5D5D8D', '#7B6BA8');
    }

    if (emotions.calm > 60) {
        colors.push('#A8E6CF', '#88D8B0');
    } else if (emotions.calm > 30) {
        colors.push('#DDA0DD', '#E0BBE4');
    } else {
        colors.push('#FF6B6B', '#EE5A24');
    }

    if (emotions.creativity > 60) {
        colors.push('#9B59B6', '#E91E63');
    } else if (emotions.creativity > 30) {
        colors.push('#3498DB', '#2ECC71');
    } else {
        colors.push('#95A5A6', '#BDC3C7');
    }

    // Style-specific adjustments
    if (style === 'galaxy') {
        colors.push('#0F0F23', '#1A1A3E', '#6B5B95');
    } else if (style === 'garden') {
        colors.push('#C9E4C5', '#FFB7B2', '#FFDAC1');
    } else if (style === 'waves') {
        colors.push('#0077B6', '#00B4D8', '#90E0EF');
    }

    return colors.slice(0, 8);
};

// ==================== STORAGE KEY ====================
const STORAGE_KEY = 'vibePainterV2';

export default function VibePainterPage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [emotions, setEmotions] = useState<EmotionState>({
        energy: 50,
        mood: 50,
        calm: 50,
        creativity: 50,
    });
    const [paintings, setPaintings] = useState<Painting[]>([]);
    const [currentColors, setCurrentColors] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState('abstract');
    const [note, setNote] = useState('');
    const [showStats, setShowStats] = useState(false);
    const [showDetail, setShowDetail] = useState<Painting | null>(null);
    const [moodStats, setMoodStats] = useState<MoodStats>({
        avgEnergy: 0, avgMood: 0, avgCalm: 0, avgCreativity: 0, totalPaintings: 0, streak: 0
    });
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { balance: totalAcorns, earn: earnAcorns } = useAcornStore(language);
    const t = translations[language];

    // Load data
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            const savedLang = localStorage.getItem('brookvale-language') as Language;

            if (savedLang) setLanguage(savedLang);

            if (saved) {
                const data = JSON.parse(saved);
                setPaintings(data.paintings || []);
            }
        }
    }, []);

    // Save data
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ paintings }));
        }
    }, [paintings]);

    // Calculate stats
    const calculateStats = useCallback(() => {
        if (paintings.length === 0) {
            setMoodStats({ avgEnergy: 0, avgMood: 0, avgCalm: 0, avgCreativity: 0, totalPaintings: 0, streak: 0 });
            return;
        }

        const totals = paintings.reduce((acc, p) => ({
            energy: acc.energy + p.emotions.energy,
            mood: acc.mood + p.emotions.mood,
            calm: acc.calm + p.emotions.calm,
            creativity: acc.creativity + p.emotions.creativity,
        }), { energy: 0, mood: 0, calm: 0, creativity: 0 });

        // Calculate streak
        let streak = 0;
        const today = new Date().toDateString();
        const sortedPaintings = [...paintings].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        for (let i = 0; i < sortedPaintings.length; i++) {
            const paintingDate = new Date(sortedPaintings[i].date);
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() - i);

            if (paintingDate.toDateString() === expectedDate.toDateString()) {
                streak++;
            } else if (i === 0 && paintingDate.toDateString() !== today) {
                break;
            } else {
                break;
            }
        }

        setMoodStats({
            avgEnergy: Math.round(totals.energy / paintings.length),
            avgMood: Math.round(totals.mood / paintings.length),
            avgCalm: Math.round(totals.calm / paintings.length),
            avgCreativity: Math.round(totals.creativity / paintings.length),
            totalPaintings: paintings.length,
            streak,
        });
    }, [paintings]);

    useEffect(() => {
        calculateStats();
    }, [calculateStats]);

    // Apply mood preset
    const applyPreset = (preset: typeof MOOD_PRESETS[0]) => {
        setEmotions(preset.values);
    };

    // Generate art based on style
    const generateArt = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsGenerating(true);
        const colors = generateColors(emotions, selectedStyle);
        setCurrentColors(colors);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch (selectedStyle) {
            case 'waves':
                drawWaves(ctx, canvas, colors, emotions);
                break;
            case 'galaxy':
                drawGalaxy(ctx, canvas, colors, emotions);
                break;
            case 'garden':
                drawGarden(ctx, canvas, colors, emotions);
                break;
            case 'geometric':
                drawGeometric(ctx, canvas, colors, emotions);
                break;
            default:
                drawAbstract(ctx, canvas, colors, emotions);
        }

        setTimeout(() => {
            setIsGenerating(false);
            setShowResult(true);
        }, 1500);
    };

    // Drawing functions for each style
    const drawAbstract = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, colors: string[], emotions: EmotionState) => {
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(0.5, colors[1]);
        gradient.addColorStop(1, colors[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const shapeCount = Math.floor(emotions.creativity / 10) + 5;
        for (let i = 0; i < shapeCount; i++) {
            ctx.beginPath();
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = (emotions.energy / 100) * 80 + 20;
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)] + '80';

            if (emotions.calm > 50) {
                ctx.arc(x, y, size, 0, Math.PI * 2);
            } else {
                ctx.moveTo(x, y);
                for (let j = 0; j < 6; j++) {
                    const angle = (j / 6) * Math.PI * 2;
                    const r = size * (0.5 + Math.random() * 0.5);
                    ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
                }
                ctx.closePath();
            }
            ctx.fill();
        }
    };

    const drawWaves = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, colors: string[], emotions: EmotionState) => {
        // Ocean background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, colors[0] || '#0077B6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw waves
        const waveCount = Math.floor(emotions.energy / 20) + 3;
        for (let i = 0; i < waveCount; i++) {
            ctx.beginPath();
            ctx.strokeStyle = colors[i % colors.length] + 'AA';
            ctx.lineWidth = 3 + (emotions.calm / 30);

            const y = (canvas.height / waveCount) * i + 50;
            ctx.moveTo(0, y);

            for (let x = 0; x < canvas.width; x += 10) {
                const waveHeight = (emotions.mood / 100) * 30 + 10;
                ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * waveHeight);
            }
            ctx.stroke();
        }
    };

    const drawGalaxy = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, colors: string[], emotions: EmotionState) => {
        // Dark background
        ctx.fillStyle = '#0F0F23';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Stars
        const starCount = Math.floor(emotions.creativity * 2);
        for (let i = 0; i < starCount; i++) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`;
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 2,
                0, Math.PI * 2
            );
            ctx.fill();
        }

        // Nebula clouds
        const cloudCount = Math.floor(emotions.mood / 25) + 2;
        for (let i = 0; i < cloudCount; i++) {
            const gradient = ctx.createRadialGradient(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                0,
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                80 + emotions.energy
            );
            gradient.addColorStop(0, colors[i % colors.length] + '60');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    };

    const drawGarden = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, colors: string[], emotions: EmotionState) => {
        // Sky background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#C9E4C5');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Flowers
        const flowerCount = Math.floor(emotions.mood / 10) + 5;
        for (let i = 0; i < flowerCount; i++) {
            const x = Math.random() * canvas.width;
            const y = canvas.height * 0.5 + Math.random() * canvas.height * 0.5;
            const size = 10 + (emotions.energy / 10);

            // Petals
            ctx.fillStyle = colors[Math.floor(Math.random() * 4)] || '#FFB7B2';
            for (let p = 0; p < 5; p++) {
                ctx.beginPath();
                const angle = (p / 5) * Math.PI * 2;
                ctx.ellipse(
                    x + Math.cos(angle) * size,
                    y + Math.sin(angle) * size,
                    size * 0.6, size * 0.3,
                    angle, 0, Math.PI * 2
                );
                ctx.fill();
            }

            // Center
            ctx.beginPath();
            ctx.fillStyle = '#FFE66D';
            ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const drawGeometric = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, colors: string[], emotions: EmotionState) => {
        // Background
        ctx.fillStyle = colors[0] || '#F5F5F5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Triangles and shapes
        const shapeCount = Math.floor(emotions.creativity / 8) + 8;
        for (let i = 0; i < shapeCount; i++) {
            ctx.beginPath();
            ctx.fillStyle = colors[i % colors.length] + '90';

            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = 30 + (emotions.energy / 2);

            const sides = emotions.calm > 50 ? 4 : 3;
            ctx.moveTo(x + size, y);
            for (let s = 1; s <= sides; s++) {
                const angle = (s / sides) * Math.PI * 2;
                ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
            }
            ctx.closePath();
            ctx.fill();
        }

        // Lines
        ctx.strokeStyle = colors[3] + '60';
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, 0);
            ctx.lineTo(Math.random() * canvas.width, canvas.height);
            ctx.stroke();
        }
    };

    // Save painting
    const savePainting = () => {
        const newPainting: Painting = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            emotions: { ...emotions },
            colors: currentColors,
            title: `Vibe #${paintings.length + 1}`,
            artStyle: selectedStyle,
            note: note.trim() || undefined,
        };

        setPaintings(prev => [newPainting, ...prev]);
        earnAcorns(7, 'Vibe Painter');
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2500);
        setShowResult(false);
        setNote('');
    };

    // Delete painting
    const deletePainting = (id: string) => {
        setPaintings(prev => prev.filter(p => p.id !== id));
        if (showDetail?.id === id) setShowDetail(null);
    };

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return language === 'ko'
            ? `${date.getMonth() + 1}월 ${date.getDate()}일`
            : date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="vibe-painter-app">
            {/* Reward Toast */}
            {showReward && (
                <div className="reward-toast">
                    <span className="toast-icon">🎨</span>
                    <div className="toast-content">
                        <div className="toast-title">{t.questComplete}</div>
                        <div className="toast-reward">{t.acornsEarned}</div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <BackLink>{t.back}</BackLink>
                <h1>🎨 {t.title}</h1>
                <div className="header-right">
                    <button className="icon-btn" onClick={() => setShowStats(true)}>📊</button>
                    <span className="acorn-badge">🌰 {totalAcorns}</span>
                </div>
            </header>

            {/* Quick Mood Presets */}
            <section className="presets-section">
                <h3>{t.quickMood}</h3>
                <div className="preset-grid">
                    {MOOD_PRESETS.map(preset => (
                        <button
                            key={preset.id}
                            className="preset-btn"
                            onClick={() => applyPreset(preset)}
                        >
                            <span className="preset-emoji">{preset.emoji}</span>
                            <span className="preset-name">
                                {language === 'en' ? preset.nameEn : preset.nameKo}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Art Style Selection */}
            <section className="style-section">
                <h3>{t.artStyle}</h3>
                <div className="style-grid">
                    {ART_STYLES.map(style => (
                        <button
                            key={style.id}
                            className={`style-btn ${selectedStyle === style.id ? 'active' : ''}`}
                            onClick={() => setSelectedStyle(style.id)}
                        >
                            <span className="style-emoji">{style.emoji}</span>
                            <span className="style-name">
                                {language === 'en' ? style.nameEn : style.nameKo}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Emotion Sliders */}
            <section className="sliders-section">
                <h2>{t.howAreYou}</h2>

                <div className="slider-group">
                    <div className="slider-header">
                        <span>{t.sliders.energy}</span>
                        <span className="slider-value">{emotions.energy}%</span>
                    </div>
                    <div className="slider-labels">
                        <span>{t.low}</span>
                        <span>{t.high}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={emotions.energy}
                        onChange={(e) => setEmotions(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                        className="emotion-slider energy"
                    />
                </div>

                <div className="slider-group">
                    <div className="slider-header">
                        <span>{t.sliders.mood}</span>
                        <span className="slider-value">{emotions.mood}%</span>
                    </div>
                    <div className="slider-labels">
                        <span>{t.sad}</span>
                        <span>{t.happy}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={emotions.mood}
                        onChange={(e) => setEmotions(prev => ({ ...prev, mood: parseInt(e.target.value) }))}
                        className="emotion-slider mood"
                    />
                </div>

                <div className="slider-group">
                    <div className="slider-header">
                        <span>{t.sliders.calm}</span>
                        <span className="slider-value">{emotions.calm}%</span>
                    </div>
                    <div className="slider-labels">
                        <span>{t.anxious}</span>
                        <span>{t.peaceful}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={emotions.calm}
                        onChange={(e) => setEmotions(prev => ({ ...prev, calm: parseInt(e.target.value) }))}
                        className="emotion-slider calm"
                    />
                </div>

                <div className="slider-group">
                    <div className="slider-header">
                        <span>{t.sliders.creativity}</span>
                        <span className="slider-value">{emotions.creativity}%</span>
                    </div>
                    <div className="slider-labels">
                        <span>{t.blocked}</span>
                        <span>{t.inspired}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={emotions.creativity}
                        onChange={(e) => setEmotions(prev => ({ ...prev, creativity: parseInt(e.target.value) }))}
                        className="emotion-slider creativity"
                    />
                </div>

                <button className="create-btn" onClick={generateArt} disabled={isGenerating}>
                    {isGenerating ? t.generating : t.createArt}
                </button>
            </section>

            {/* Canvas Display */}
            <section className="canvas-section">
                <h2>{t.todayVibe}</h2>
                <div className={`canvas-container ${isGenerating ? 'generating' : ''}`}>
                    <canvas
                        ref={canvasRef}
                        width={300}
                        height={300}
                        className="vibe-canvas"
                    />
                    {isGenerating && (
                        <div className="generating-overlay">
                            <span className="generating-emoji">🎨</span>
                            <span>{t.generating}</span>
                        </div>
                    )}
                </div>

                {showResult && (
                    <>
                        <div className="color-palette">
                            {currentColors.slice(0, 6).map((color, i) => (
                                <div
                                    key={i}
                                    className="color-swatch"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>

                        <input
                            type="text"
                            className="note-input"
                            placeholder={t.addNote}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />

                        <button className="save-btn" onClick={savePainting}>
                            {t.save}
                        </button>
                    </>
                )}
            </section>

            {/* Gallery */}
            <section className="gallery-section">
                <h2>{t.gallery} ({paintings.length})</h2>
                {paintings.length === 0 ? (
                    <div className="empty-gallery">
                        <span className="empty-icon">🖼️</span>
                        <p>{t.empty}</p>
                    </div>
                ) : (
                    <div className="gallery-grid">
                        {paintings.map(painting => (
                            <div key={painting.id} className="gallery-item">
                                <div
                                    className="mini-canvas"
                                    style={{
                                        background: `linear-gradient(135deg, ${painting.colors.slice(0, 3).join(', ')})`,
                                    }}
                                    onClick={() => setShowDetail(painting)}
                                >
                                    <span className="style-badge">
                                        {ART_STYLES.find(s => s.id === painting.artStyle)?.emoji || '🎨'}
                                    </span>
                                </div>
                                <div className="item-info">
                                    <span className="item-title">{painting.title}</span>
                                    <span className="item-date">{formatDate(painting.date)}</span>
                                </div>
                                <button
                                    className="delete-btn"
                                    onClick={() => deletePainting(painting.id)}
                                >
                                    {t.delete}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Motivation */}
            <section className="motivation-section">
                <p>{t.motivation}</p>
            </section>

            {/* Stats Modal */}
            {showStats && (
                <div className="modal-overlay" onClick={() => setShowStats(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{t.stats}</h2>

                        <div className="stats-overview">
                            <div className="stat-card highlight">
                                <span className="stat-icon">🎨</span>
                                <span className="stat-number">{moodStats.totalPaintings}</span>
                                <span className="stat-label">{t.totalArt}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon">🔥</span>
                                <span className="stat-number">{moodStats.streak}</span>
                                <span className="stat-label">{t.artStreak}</span>
                            </div>
                        </div>

                        <div className="avg-emotions">
                            <h3>{t.moodHistory}</h3>
                            <div className="emotion-bars">
                                <div className="emotion-bar-item">
                                    <span className="bar-label">⚡</span>
                                    <div className="bar-track">
                                        <div className="bar-fill energy" style={{ width: `${moodStats.avgEnergy}%` }} />
                                    </div>
                                    <span className="bar-value">{moodStats.avgEnergy}%</span>
                                </div>
                                <div className="emotion-bar-item">
                                    <span className="bar-label">😊</span>
                                    <div className="bar-track">
                                        <div className="bar-fill mood" style={{ width: `${moodStats.avgMood}%` }} />
                                    </div>
                                    <span className="bar-value">{moodStats.avgMood}%</span>
                                </div>
                                <div className="emotion-bar-item">
                                    <span className="bar-label">🧘</span>
                                    <div className="bar-track">
                                        <div className="bar-fill calm" style={{ width: `${moodStats.avgCalm}%` }} />
                                    </div>
                                    <span className="bar-value">{moodStats.avgCalm}%</span>
                                </div>
                                <div className="emotion-bar-item">
                                    <span className="bar-label">✨</span>
                                    <div className="bar-track">
                                        <div className="bar-fill creativity" style={{ width: `${moodStats.avgCreativity}%` }} />
                                    </div>
                                    <span className="bar-value">{moodStats.avgCreativity}%</span>
                                </div>
                            </div>
                        </div>

                        <button className="close-btn" onClick={() => setShowStats(false)}>×</button>
                    </div>
                </div>
            )}

            {/* Painting Detail Modal */}
            {showDetail && (
                <div className="modal-overlay" onClick={() => setShowDetail(null)}>
                    <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
                        <h2>{t.paintingDetail}</h2>

                        <div
                            className="detail-preview"
                            style={{
                                background: `linear-gradient(135deg, ${showDetail.colors.slice(0, 3).join(', ')})`,
                            }}
                        />

                        <div className="detail-title">{showDetail.title}</div>
                        <div className="detail-date">{t.paintedOn}: {formatDate(showDetail.date)}</div>

                        <div className="detail-emotions">
                            <h4>{t.emotions}</h4>
                            <div className="emotion-chips">
                                <span className="chip">⚡ {showDetail.emotions.energy}%</span>
                                <span className="chip">😊 {showDetail.emotions.mood}%</span>
                                <span className="chip">🧘 {showDetail.emotions.calm}%</span>
                                <span className="chip">✨ {showDetail.emotions.creativity}%</span>
                            </div>
                        </div>

                        <div className="detail-palette">
                            <h4>{t.colorPalette}</h4>
                            <div className="palette-row">
                                {showDetail.colors.slice(0, 6).map((color, i) => (
                                    <div key={i} className="palette-swatch" style={{ backgroundColor: color }} />
                                ))}
                            </div>
                        </div>

                        {showDetail.note && (
                            <div className="detail-note">
                                <h4>{t.note}</h4>
                                <p>{showDetail.note}</p>
                            </div>
                        )}

                        <button className="close-btn" onClick={() => setShowDetail(null)}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
}
