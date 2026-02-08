'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import { BackLink } from '@/components/BackLink';
import { getAmbientSoundEngine, SoundType } from '@/lib/ambient-sounds';
import './mind-cloud.css';

// ==================== TYPES ====================
interface MeditationSession {
    id: string;
    name: string;
    nameKo: string;
    emoji: string;
    duration: number;
    category: 'calm' | 'focus' | 'energy' | 'sleep';
    prompts: { en: string[]; ko: string[] };
    description: { en: string; ko: string };
}

interface SessionHistory {
    id: string;
    sessionId: string;
    sessionName: string;
    date: string;
    duration: number;
    completed: boolean;
    ambientSound?: string;
}

interface MindStats {
    todaySessions: number;
    totalMinutes: number;
    mindfulDays: number;
    bestStreak: number;
    streak: number;
    lastDate: string;
    favoriteSession?: string;
    sessionCounts: Record<string, number>;
}

// ==================== CONSTANTS ====================
const MEDITATION_SESSIONS: MeditationSession[] = [
    {
        id: 'quick', name: 'Quick Reset', nameKo: '빠른 리셋', emoji: '⚡', duration: 60, category: 'focus',
        description: { en: 'A fast mental refresh for busy moments', ko: '바쁜 순간을 위한 빠른 정신 리프레시' },
        prompts: {
            en: ['Close your eyes...', 'Take a deep breath', 'Let your thoughts drift away like clouds', 'Feel the stillness', 'You are at peace'],
            ko: ['눈을 감으세요...', '깊게 숨을 쉬세요', '생각을 구름처럼 흘려보내세요', '고요함을 느끼세요', '평화롭습니다'],
        },
    },
    {
        id: 'calm', name: 'Calm Mind', nameKo: '마음 진정', emoji: '🌸', duration: 120, category: 'calm',
        description: { en: 'Find inner peace and tranquility', ko: '내면의 평화와 고요함을 찾으세요' },
        prompts: {
            en: ['Find a comfortable position...', 'Notice your breathing', 'Each breath brings peace', 'Let go of tension', 'Your mind is clear like the sky', 'Embrace this moment'],
            ko: ['편안한 자세를 찾으세요...', '호흡을 느껴보세요', '숨 쉴 때마다 평화가 옵니다', '긴장을 내려놓으세요', '마음이 하늘처럼 맑아집니다', '이 순간을 받아들이세요'],
        },
    },
    {
        id: 'focus', name: 'Deep Focus', nameKo: '깊은 집중', emoji: '🎯', duration: 180, category: 'focus',
        description: { en: 'Sharpen your concentration and clarity', ko: '집중력과 명료함을 날카롭게 하세요' },
        prompts: {
            en: ['Center yourself...', 'Ground your energy', 'Focus on the present moment', 'Let distractions fade', 'Your attention is sharp', 'You are ready for anything', 'Carry this clarity with you'],
            ko: ['중심을 잡으세요...', '에너지를 모으세요', '지금 이 순간에 집중하세요', '방해물을 흘려보내세요', '집중력이 날카로워집니다', '무엇이든 준비되었습니다', '이 명료함을 가지고 가세요'],
        },
    },
    {
        id: 'gratitude', name: 'Gratitude', nameKo: '감사', emoji: '💝', duration: 150, category: 'calm',
        description: { en: 'Cultivate appreciation and warmth', ko: '감사와 따뜻함을 키우세요' },
        prompts: {
            en: ['Think of something you\'re grateful for...', 'Feel the warmth in your heart', 'Send love to yourself', 'Think of someone who helped you', 'Appreciate this moment', 'You are blessed'],
            ko: ['감사한 것을 떠올려보세요...', '가슴에 따뜻함을 느끼세요', '자신에게 사랑을 보내세요', '도움을 준 사람을 생각하세요', '이 순간에 감사하세요', '축복받은 존재입니다'],
        },
    },
    {
        id: 'energy', name: 'Energy Boost', nameKo: '에너지 충전', emoji: '🔥', duration: 90, category: 'energy',
        description: { en: 'Recharge your mental energy', ko: '정신 에너지를 충전하세요' },
        prompts: {
            en: ['Stand or sit tall...', 'Feel energy flowing in', 'With each breath, you grow stronger', 'Visualize golden light filling you', 'You are vibrant and alive', 'Carry this energy forward'],
            ko: ['바로 서거나 앉으세요...', '에너지가 흘러들어오는 것을 느끼세요', '숨 쉴 때마다 강해집니다', '황금빛이 당신을 채우는 것을 상상하세요', '활기차고 생동감 있습니다', '이 에너지를 가지고 가세요'],
        },
    },
    {
        id: 'sleep', name: 'Sleep Prep', nameKo: '수면 준비', emoji: '🌙', duration: 240, category: 'sleep',
        description: { en: 'Prepare your mind for restful sleep', ko: '편안한 수면을 위해 마음을 준비하세요' },
        prompts: {
            en: ['Lie down comfortably...', 'Let your body sink into relaxation', 'Release the day\'s stress', 'Your eyelids grow heavy', 'Drift toward peaceful dreams', 'You deserve this rest', 'Sleep is coming naturally'],
            ko: ['편안하게 누우세요...', '몸이 이완되는 것을 느끼세요', '오늘의 스트레스를 놓아주세요', '눈꺼풀이 무거워집니다', '평화로운 꿈으로 떠나가세요', '이 휴식을 받을 자격이 있습니다', '잠이 자연스럽게 찾아옵니다'],
        },
    },
    {
        id: 'bodyscan', name: 'Body Scan', nameKo: '바디 스캔', emoji: '🫧', duration: 180, category: 'calm',
        description: { en: 'Scan and release tension from head to toe', ko: '머리부터 발끝까지 긴장을 풀어보세요' },
        prompts: {
            en: ['Start from the top of your head...', 'Let your face relax', 'Release your shoulders', 'Soften your hands', 'Let your legs become heavy', 'Feel your entire body at ease'],
            ko: ['머리 꼭대기부터 시작하세요...', '얼굴의 긴장을 풀어주세요', '어깨를 내려놓으세요', '손을 부드럽게 하세요', '다리가 무거워지는 것을 느끼세요', '온몸이 편안해집니다'],
        },
    },
    {
        id: 'creative', name: 'Creative Flow', nameKo: '창의력 흐름', emoji: '🎨', duration: 120, category: 'energy',
        description: { en: 'Unlock your creative potential', ko: '창의적 잠재력을 열어보세요' },
        prompts: {
            en: ['Let your mind wander freely...', 'Imagine a blank canvas', 'Colors and shapes begin to appear', 'Ideas flow like water', 'Your creativity is limitless', 'Capture this inspiration'],
            ko: ['마음을 자유롭게 떠돌게 하세요...', '빈 캔버스를 상상하세요', '색상과 형태가 나타나기 시작합니다', '아이디어가 물처럼 흐릅니다', '창의력에 한계가 없습니다', '이 영감을 잡으세요'],
        },
    },
];

const CATEGORY_COLORS: Record<string, string> = {
    calm: '#87CEEB', focus: '#FFD700', energy: '#FF6B6B', sleep: '#9B59B6',
};

const AMBIENT_SOUNDS = [
    { id: 'none', emoji: '🔇', en: 'None', ko: '없음' },
    { id: 'rain', emoji: '🌧️', en: 'Rain', ko: '비' },
    { id: 'wind', emoji: '🍃', en: 'Wind', ko: '바람' },
    { id: 'bells', emoji: '🔔', en: 'Bells', ko: '종소리' },
    { id: 'bowl', emoji: '🥣', en: 'Singing Bowl', ko: '싱잉볼' },
    { id: 'stream', emoji: '💧', en: 'Stream', ko: '시냇물' },
];

const MIND_RANKS = [
    { min: 0, name: 'Beginner', nameKo: '입문자', emoji: '🌱' },
    { min: 10, name: 'Seeker', nameKo: '탐구자', emoji: '🌿' },
    { min: 30, name: 'Practitioner', nameKo: '수행자', emoji: '🌳' },
    { min: 60, name: 'Mindful One', nameKo: '마음챙김인', emoji: '✨' },
    { min: 100, name: 'Sage', nameKo: '현자', emoji: '🧙' },
    { min: 200, name: 'Enlightened', nameKo: '깨달은 자', emoji: '🌟' },
];

const MINDFUL_TIPS = {
    en: [
        'Even 1 minute of mindfulness can reduce stress',
        'Focus on your breath when feeling overwhelmed',
        'Meditation is not about emptying the mind, but observing it',
        'Consistency matters more than duration',
        'Be kind to your wandering thoughts',
    ],
    ko: [
        '1분 마음챙김으로도 스트레스를 줄일 수 있어요',
        '압도당할 때 호흡에 집중하세요',
        '명상은 마음을 비우는 것이 아니라 관찰하는 것입니다',
        '시간보다 꾸준함이 중요합니다',
        '떠도는 생각에 친절하세요',
    ],
};

const STORAGE_KEY = 'mindCloudV3';

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        title: 'Mind Cloud',
        back: '← Brookvale',
        start: 'Begin Session',
        stop: 'End Early',
        sessions: 'Choose Session',
        ready: 'Ready to begin',
        complete: 'Session Complete',
        sessionDone: 'Mind Cleared!',
        acornsEarned: '+8 Acorns',
        todaySessions: 'Today',
        totalMinutes: 'Minutes',
        mindfulDays: 'Days',
        duration: 'min',
        motivation: '☁️ A clear mind is a peaceful mind.',
        stats: '📊 Statistics',
        history: '📜 History',
        streak: 'Streak',
        bestStreak: 'Best Streak',
        favoriteSession: 'Favorite',
        sessionBreakdown: 'Breakdown',
        recentHistory: 'Recent Sessions',
        noHistory: 'No sessions yet',
        viewDetail: 'Details',
        close: 'Close',
        categories: { calm: '🌸 Calm', focus: '🎯 Focus', energy: '🔥 Energy', sleep: '🌙 Sleep' },
        all: 'All',
        days: 'days',
        ambientSound: 'Ambient Sound',
        weeklyChart: 'This Week',
        rank: 'Rank',
        tip: '💡 Tip',
    },
    ko: {
        title: '마인드 클라우드',
        back: '← 브룩베일',
        start: '세션 시작',
        stop: '일찍 종료',
        sessions: '세션 선택',
        ready: '시작할 준비가 되었습니다',
        complete: '세션 완료',
        sessionDone: '마음이 맑아졌어요!',
        acornsEarned: '+8 도토리',
        todaySessions: '오늘',
        totalMinutes: '분',
        mindfulDays: '일수',
        duration: '분',
        motivation: '☁️ 맑은 마음은 평화로운 마음입니다.',
        stats: '📊 통계',
        history: '📜 기록',
        streak: '연속',
        bestStreak: '최고 연속',
        favoriteSession: '즐겨찾기',
        sessionBreakdown: '분석',
        recentHistory: '최근 세션',
        noHistory: '아직 세션이 없어요',
        viewDetail: '상세',
        close: '닫기',
        categories: { calm: '🌸 차분함', focus: '🎯 집중', energy: '🔥 에너지', sleep: '🌙 수면' },
        all: '전체',
        days: '일',
        ambientSound: '배경음',
        weeklyChart: '이번 주',
        rank: '등급',
        tip: '💡 팁',
    },
};

export default function MindCloudPage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [selectedSession, setSelectedSession] = useState<MeditationSession>(MEDITATION_SESSIONS[0]);
    const [isRunning, setIsRunning] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState<MeditationSession | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [history, setHistory] = useState<SessionHistory[]>([]);
    const [selectedSound, setSelectedSound] = useState('none');
    const [tipIndex, setTipIndex] = useState(0);
    const [stats, setStats] = useState<MindStats>({
        todaySessions: 0, totalMinutes: 0, mindfulDays: 0,
        bestStreak: 0, streak: 0, lastDate: '', sessionCounts: {},
    });

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const soundEngineRef = useRef<ReturnType<typeof getAmbientSoundEngine> | null>(null);
    const { balance: totalAcorns, earn, isLoaded } = useAcornStore(language);
    const t = translations[language];

    // Ambient sound engine
    useEffect(() => {
        soundEngineRef.current = getAmbientSoundEngine();
        return () => {
            soundEngineRef.current?.dispose();
            soundEngineRef.current = null;
        };
    }, []);

    // Play ambient sound directly (must be called from click handler for mobile)
    const handleSoundSelect = useCallback((soundId: string) => {
        setSelectedSound(soundId);
        if (soundEngineRef.current) {
            soundEngineRef.current.play(soundId as SoundType);
        }
    }, []);

    // Load data
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            const savedLang = localStorage.getItem('brookvale-language') as Language;
            if (savedLang) setLanguage(savedLang);

            if (saved) {
                const data = JSON.parse(saved);
                const today = new Date().toDateString();
                let streak = data.streak || 0;
                if (data.lastDate && data.lastDate !== today) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (data.lastDate !== yesterday.toDateString()) streak = 0;
                }
                setStats({ ...data, todaySessions: data.lastDate === today ? data.todaySessions : 0, streak });
                setHistory(data.history || []);
            }
        }
    }, []);

    // Rotate tips
    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % MINDFUL_TIPS.en.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    // Save data
    const saveData = useCallback((newStats: MindStats, newHistory: SessionHistory[]) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...newStats, history: newHistory.slice(0, 50) }));
        }
        setStats(newStats);
        setHistory(newHistory);
    }, []);

    // Weekly chart
    const weeklyChartData = useMemo(() => {
        const days = [];
        const dayNames = language === 'ko' ? ['일', '월', '화', '수', '목', '금', '토'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayHistory = history.filter(h => h.date.startsWith(dateStr));
            const minutes = dayHistory.reduce((sum, h) => sum + Math.ceil(h.duration / 60), 0);
            days.push({ label: dayNames[d.getDay()], minutes, isToday: i === 0 });
        }
        return days;
    }, [history, language]);

    const maxWeeklyMinutes = Math.max(1, ...weeklyChartData.map(d => d.minutes));

    // Rank
    const getRank = useCallback((totalMin: number) => {
        for (let i = MIND_RANKS.length - 1; i >= 0; i--) {
            if (totalMin >= MIND_RANKS[i].min) return MIND_RANKS[i];
        }
        return MIND_RANKS[0];
    }, []);

    const currentRank = getRank(stats.totalMinutes);

    // Category breakdown
    const categoryMinutes = useMemo(() => {
        const result: Record<string, number> = {};
        history.forEach(h => {
            const session = MEDITATION_SESSIONS.find(s => s.id === h.sessionId);
            if (session) {
                result[session.category] = (result[session.category] || 0) + Math.ceil(h.duration / 60);
            }
        });
        return result;
    }, [history]);

    const maxCategoryMinutes = Math.max(1, ...Object.values(categoryMinutes));

    // Start session
    const startSession = useCallback(() => {
        setIsRunning(true);
        setTimeRemaining(selectedSession.duration);
        setCurrentPromptIndex(0);
    }, [selectedSession]);

    // Stop session
    const stopSession = useCallback(() => {
        setIsRunning(false);
        setTimeRemaining(0);
        setCurrentPromptIndex(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    // Timer logic
    useEffect(() => {
        if (!isRunning) return;
        const prompts = selectedSession.prompts[language];
        const promptInterval = selectedSession.duration / prompts.length;

        intervalRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    setIsRunning(false);
                    earn(8, language === 'ko' ? '마인드 클라우드' : 'Mind Cloud');

                    const today = new Date().toDateString();
                    const minutesCompleted = Math.ceil(selectedSession.duration / 60);
                    const isNewDay = stats.lastDate !== today;
                    const newStreak = isNewDay ? stats.streak + 1 : stats.streak;

                    const newStats: MindStats = {
                        todaySessions: isNewDay ? 1 : stats.todaySessions + 1,
                        totalMinutes: stats.totalMinutes + minutesCompleted,
                        mindfulDays: isNewDay ? stats.mindfulDays + 1 : stats.mindfulDays,
                        streak: newStreak, bestStreak: Math.max(stats.bestStreak, newStreak),
                        lastDate: today, favoriteSession: selectedSession.id,
                        sessionCounts: { ...stats.sessionCounts, [selectedSession.id]: (stats.sessionCounts[selectedSession.id] || 0) + 1 },
                    };

                    const newHistoryEntry: SessionHistory = {
                        id: Date.now().toString(), sessionId: selectedSession.id,
                        sessionName: language === 'ko' ? selectedSession.nameKo : selectedSession.name,
                        date: new Date().toISOString(), duration: selectedSession.duration,
                        completed: true, ambientSound: selectedSound,
                    };

                    saveData(newStats, [newHistoryEntry, ...history]);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                    return 0;
                }

                const elapsed = selectedSession.duration - prev + 1;
                const newPromptIndex = Math.min(Math.floor(elapsed / promptInterval), prompts.length - 1);
                setCurrentPromptIndex(newPromptIndex);
                return prev - 1;
            });
        }, 1000);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, selectedSession, language, earn, stats, history, saveData, selectedSound]);

    const getCurrentPrompt = () => {
        if (!isRunning && timeRemaining === 0) return showToast ? t.complete : t.ready;
        const prompts = selectedSession.prompts[language];
        return prompts[currentPromptIndex] || prompts[0];
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgress = () => {
        if (!isRunning || selectedSession.duration === 0) return 0;
        return ((selectedSession.duration - timeRemaining) / selectedSession.duration) * 100;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return language === 'ko'
            ? `${date.getMonth() + 1}월 ${date.getDate()}일`
            : date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    const filteredSessions = filterCategory === 'all'
        ? MEDITATION_SESSIONS
        : MEDITATION_SESSIONS.filter(s => s.category === filterCategory);

    const mostUsedSession = Object.entries(stats.sessionCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
    const favoriteSessionData = MEDITATION_SESSIONS.find(s => s.id === mostUsedSession);

    if (!isLoaded) return <div className="mind-cloud-app">Loading...</div>;

    return (
        <div className="mind-cloud-app">
            {/* Toast */}
            {showToast && (
                <div className="session-toast">
                    <span className="toast-icon">🧘</span>
                    <div>
                        <div className="toast-text">{t.sessionDone}</div>
                        <div>{t.acornsEarned}</div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <BackLink>{t.back}</BackLink>
                <h1>🧘 {t.title}</h1>
                <div className="header-right">
                    <button className="lang-toggle" onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}>
                        {language === 'en' ? '한국어' : 'EN'}
                    </button>
                    <button className="icon-btn" onClick={() => setShowStatsModal(true)}>📊</button>
                    <span className="acorn-badge">🌰 {totalAcorns}</span>
                </div>
            </header>

            {/* Rank Card */}
            <section className="rank-card">
                <span className="rank-emoji">{currentRank.emoji}</span>
                <div className="rank-info">
                    <span className="rank-name">{language === 'ko' ? currentRank.nameKo : currentRank.name}</span>
                    <span className="rank-minutes">{stats.totalMinutes} {t.totalMinutes}</span>
                </div>
            </section>

            {/* Meditation Area */}
            <section className="meditation-section">
                <div className="meditation-cloud" />
                <div className="meditation-text">
                    <div className="main-text">{getCurrentPrompt()}</div>
                    {isRunning && (
                        <div className="sub-text">
                            {selectedSession.emoji} {language === 'ko' ? selectedSession.nameKo : selectedSession.name}
                        </div>
                    )}
                </div>

                {isRunning && (
                    <>
                        <div className="meditation-timer">{formatTime(timeRemaining)}</div>
                        <div className="meditation-progress">
                            <div className="fill" style={{ width: `${getProgress()}%`, backgroundColor: CATEGORY_COLORS[selectedSession.category] }} />
                        </div>
                    </>
                )}

                <div className="meditation-controls">
                    {!isRunning ? (
                        <button className="control-btn start-btn" onClick={startSession}>{t.start}</button>
                    ) : (
                        <button className="control-btn stop-btn" onClick={stopSession}>{t.stop}</button>
                    )}
                </div>
            </section>

            {/* Stats Overview */}
            <section className="stats-section">
                <div className="stat-card">
                    <div className="stat-icon">🧘</div>
                    <div className="stat-value">{stats.todaySessions}</div>
                    <div className="stat-label">{t.todaySessions}</div>
                </div>
                <div className="stat-card highlight">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-value">{stats.streak}</div>
                    <div className="stat-label">{t.streak}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🌟</div>
                    <div className="stat-value">{stats.mindfulDays}</div>
                    <div className="stat-label">{t.mindfulDays}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-value">{stats.totalMinutes}</div>
                    <div className="stat-label">{t.totalMinutes}</div>
                </div>
            </section>

            {/* Weekly Chart */}
            <section className="week-chart">
                <h3>{t.weeklyChart}</h3>
                <div className="week-bars">
                    {weeklyChartData.map((day, i) => (
                        <div key={i} className={`week-day ${day.isToday ? 'today' : ''}`}>
                            <div className="wd-bar-container">
                                <div className="wd-bar" style={{ height: `${day.minutes > 0 ? (day.minutes / maxWeeklyMinutes) * 100 : 4}%` }} />
                            </div>
                            <span className="wd-count">{day.minutes > 0 ? `${day.minutes}m` : ''}</span>
                            <span className="wd-label">{day.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Category Breakdown */}
            {Object.keys(categoryMinutes).length > 0 && (
                <section className="category-breakdown">
                    <h3>{t.sessionBreakdown}</h3>
                    <div className="cb-grid">
                        {Object.entries(categoryMinutes).map(([cat, mins]) => (
                            <div key={cat} className="cb-item">
                                <span className="cb-emoji">{t.categories[cat as keyof typeof t.categories]?.split(' ')[0]}</span>
                                <div className="cb-bar">
                                    <div className="cb-fill" style={{ width: `${(mins / maxCategoryMinutes) * 100}%`, backgroundColor: CATEGORY_COLORS[cat] }} />
                                </div>
                                <span className="cb-count">{mins}m</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Ambient Sound */}
            <section className="ambient-section">
                <h3>{t.ambientSound}</h3>
                <div className="ambient-grid">
                    {AMBIENT_SOUNDS.map(s => (
                        <button
                            key={s.id}
                            className={`ambient-btn ${selectedSound === s.id ? 'active' : ''}`}
                            onClick={() => handleSoundSelect(s.id)}
                        >
                            <span className="ambient-emoji">{s.emoji}</span>
                            <span className="ambient-name">{language === 'ko' ? s.ko : s.en}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Category Filter */}
            <section className="filter-section">
                <div className="filter-chips">
                    <button className={`filter-chip ${filterCategory === 'all' ? 'active' : ''}`} onClick={() => setFilterCategory('all')}>{t.all}</button>
                    {(Object.keys(t.categories) as (keyof typeof t.categories)[]).map(cat => (
                        <button
                            key={cat}
                            className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                            onClick={() => setFilterCategory(cat)}
                            style={{ borderColor: filterCategory === cat ? CATEGORY_COLORS[cat] : undefined }}
                        >
                            {t.categories[cat]}
                        </button>
                    ))}
                </div>
            </section>

            {/* Session Selection */}
            <section className="sessions-section">
                <h2>{t.sessions} ({filteredSessions.length})</h2>
                <div className="session-grid">
                    {filteredSessions.map(session => (
                        <div
                            key={session.id}
                            className={`session-card ${selectedSession.id === session.id ? 'active' : ''}`}
                            onClick={() => !isRunning && setSelectedSession(session)}
                            style={{ borderColor: selectedSession.id === session.id ? CATEGORY_COLORS[session.category] : undefined }}
                        >
                            <div className="session-emoji">{session.emoji}</div>
                            <div className="session-title">{language === 'ko' ? session.nameKo : session.name}</div>
                            <div className="session-duration">{Math.ceil(session.duration / 60)} {t.duration}</div>
                            {stats.sessionCounts[session.id] > 0 && (
                                <span className="session-count">{stats.sessionCounts[session.id]}x</span>
                            )}
                            <button className="session-info-btn" onClick={(e) => { e.stopPropagation(); setShowDetailModal(session); }}>ℹ️</button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mindful Tip */}
            <section className="mindful-tip">
                <p className="tip-label">{t.tip}</p>
                <p className="tip-text" key={tipIndex}>
                    {language === 'ko' ? MINDFUL_TIPS.ko[tipIndex] : MINDFUL_TIPS.en[tipIndex]}
                </p>
            </section>

            {/* Motivation */}
            <section className="motivation-section">
                <p>{t.motivation}</p>
            </section>

            {/* Stats Modal */}
            {showStatsModal && (
                <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{t.stats}</h2>

                        <div className="stats-overview">
                            <div className="overview-card">
                                <span className="ov-icon">🧘</span>
                                <span className="ov-number">{stats.todaySessions}</span>
                                <span className="ov-label">{t.todaySessions}</span>
                            </div>
                            <div className="overview-card">
                                <span className="ov-icon">🌟</span>
                                <span className="ov-number">{stats.mindfulDays}</span>
                                <span className="ov-label">{t.mindfulDays}</span>
                            </div>
                            <div className="overview-card highlight">
                                <span className="ov-icon">🔥</span>
                                <span className="ov-number">{stats.streak}</span>
                                <span className="ov-label">{t.streak}</span>
                            </div>
                            <div className="overview-card">
                                <span className="ov-icon">🏆</span>
                                <span className="ov-number">{stats.bestStreak}</span>
                                <span className="ov-label">{t.bestStreak}</span>
                            </div>
                        </div>

                        {favoriteSessionData && (
                            <div className="favorite-session">
                                <h3>{t.favoriteSession}</h3>
                                <div className="favorite-card">
                                    <span className="fav-emoji">{favoriteSessionData.emoji}</span>
                                    <span className="fav-name">{language === 'ko' ? favoriteSessionData.nameKo : favoriteSessionData.name}</span>
                                    <span className="fav-count">{stats.sessionCounts[favoriteSessionData.id] || 0}x</span>
                                </div>
                            </div>
                        )}

                        <div className="history-section">
                            <h3>{t.recentHistory}</h3>
                            {history.length === 0 ? (
                                <p className="empty-text">{t.noHistory}</p>
                            ) : (
                                <div className="history-list">
                                    {history.slice(0, 8).map(h => {
                                        const session = MEDITATION_SESSIONS.find(s => s.id === h.sessionId);
                                        return (
                                            <div key={h.id} className="history-item">
                                                <span className="hist-emoji">{session?.emoji || '🧘'}</span>
                                                <span className="hist-name">{h.sessionName}</span>
                                                <span className="hist-date">{formatDate(h.date)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <button className="close-btn" onClick={() => setShowStatsModal(false)}>×</button>
                    </div>
                </div>
            )}

            {/* Session Detail Modal */}
            {showDetailModal && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
                    <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="detail-emoji">{showDetailModal.emoji}</div>
                        <h2>{language === 'ko' ? showDetailModal.nameKo : showDetailModal.name}</h2>
                        <div className="detail-category" style={{ color: CATEGORY_COLORS[showDetailModal.category] }}>
                            {t.categories[showDetailModal.category]}
                        </div>
                        <div className="detail-duration">⏱️ {Math.ceil(showDetailModal.duration / 60)} {t.duration}</div>
                        <p className="detail-description">{showDetailModal.description[language]}</p>
                        <button className="select-session-btn" onClick={() => { setSelectedSession(showDetailModal); setShowDetailModal(null); }}>{t.start}</button>
                        <button className="close-btn" onClick={() => setShowDetailModal(null)}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
}
