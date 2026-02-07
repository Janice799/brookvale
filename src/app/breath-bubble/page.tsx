'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import { BackLink } from '@/components/BackLink';
import './breath-bubble.css';

// ==================== TYPES ====================
interface BreathPattern {
    id: string;
    name: string;
    nameKo: string;
    description: string;
    descriptionKo: string;
    emoji: string;
    inhale: number;
    hold1: number;
    exhale: number;
    hold2: number;
    cycles: number;
    benefit: string;
    benefitKo: string;
}

interface SessionHistory {
    date: string;
    patternId: string;
    duration: number; // seconds
}

interface BreathStats {
    todaySessions: number;
    totalMinutes: number;
    totalSessions: number;
    streak: number;
    bestStreak: number;
    lastDate: string;
    history: SessionHistory[];
    favoritePattern?: string;
}

// ==================== CONSTANTS ====================
const BREATH_PATTERNS: BreathPattern[] = [
    {
        id: 'calm',
        name: 'Calm Breath',
        nameKo: '차분한 호흡',
        description: '4-4-4-4 Box Breathing',
        descriptionKo: '4-4-4-4 박스 호흡',
        emoji: '🌸',
        inhale: 4,
        hold1: 4,
        exhale: 4,
        hold2: 4,
        cycles: 4,
        benefit: 'Reduces stress and anxiety',
        benefitKo: '스트레스와 불안 완화',
    },
    {
        id: 'relax',
        name: 'Deep Relax',
        nameKo: '깊은 이완',
        description: '4-7-8 Sleep Breathing',
        descriptionKo: '4-7-8 수면 호흡',
        emoji: '🌙',
        inhale: 4,
        hold1: 7,
        exhale: 8,
        hold2: 0,
        cycles: 3,
        benefit: 'Helps you fall asleep',
        benefitKo: '수면에 도움',
    },
    {
        id: 'energy',
        name: 'Energize',
        nameKo: '에너지 충전',
        description: 'Quick Refreshing Breath',
        descriptionKo: '빠른 활력 호흡',
        emoji: '⚡',
        inhale: 3,
        hold1: 0,
        exhale: 3,
        hold2: 0,
        cycles: 6,
        benefit: 'Boosts alertness and energy',
        benefitKo: '각성과 활력 증가',
    },
    {
        id: 'focus',
        name: 'Focus',
        nameKo: '집중',
        description: '5-5 Balanced Breath',
        descriptionKo: '5-5 균형 호흡',
        emoji: '🎯',
        inhale: 5,
        hold1: 2,
        exhale: 5,
        hold2: 2,
        cycles: 5,
        benefit: 'Improves concentration',
        benefitKo: '집중력 향상',
    },
    {
        id: 'anxiety',
        name: 'Anti-Anxiety',
        nameKo: '불안 해소',
        description: '5-2-7 Calming Breath',
        descriptionKo: '5-2-7 진정 호흡',
        emoji: '🦋',
        inhale: 5,
        hold1: 2,
        exhale: 7,
        hold2: 0,
        cycles: 5,
        benefit: 'Activates parasympathetic nervous system',
        benefitKo: '부교감신경 활성화',
    },
    {
        id: 'morning',
        name: 'Morning Boost',
        nameKo: '아침 기상',
        description: '2-0-4-0 Wake Up Breath',
        descriptionKo: '2-0-4-0 기상 호흡',
        emoji: '☀️',
        inhale: 2,
        hold1: 0,
        exhale: 4,
        hold2: 0,
        cycles: 8,
        benefit: 'Gentle way to start the day',
        benefitKo: '부드럽게 하루 시작',
    },
];

const AMBIENT_SOUNDS = [
    { id: 'none', emoji: '🔇', nameEn: 'None', nameKo: '없음' },
    { id: 'rain', emoji: '🌧️', nameEn: 'Rain', nameKo: '비' },
    { id: 'ocean', emoji: '🌊', nameEn: 'Ocean', nameKo: '파도' },
    { id: 'forest', emoji: '🌲', nameEn: 'Forest', nameKo: '숲' },
    { id: 'wind', emoji: '💨', nameEn: 'Wind', nameKo: '바람' },
];

type BreathPhase = 'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'complete';

const STORAGE_KEY = 'breathBubbleV2';

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        title: 'Breath Bubble',
        back: '← Brookvale',
        start: 'Start Breathing',
        stop: 'Stop',
        patterns: 'Choose Pattern',
        inhale: 'Breathe In',
        hold: 'Hold',
        exhale: 'Breathe Out',
        ready: 'Ready',
        complete: 'Complete!',
        sessionDone: 'Session Complete!',
        acornsEarned: '+6 Acorns',
        todaySessions: 'Today',
        totalMinutes: 'Total Min',
        currentStreak: 'Streak',
        motivation: '☁️ Take a moment to breathe. You deserve this peace.',
        // New
        stats: '📊 Stats',
        history: 'Session History',
        benefit: 'Benefits',
        totalSessions: 'Total Sessions',
        bestStreak: 'Best Streak',
        days: 'days',
        favorite: 'Favorite',
        weeklyGoal: 'Weekly Goal',
        sessionsThisWeek: 'sessions this week',
        ambientSound: 'Ambient Sound',
        close: 'Close',
        noHistory: 'No sessions yet. Start breathing!',
        minutes: 'min',
    },
    ko: {
        title: '숨쉬기 버블',
        back: '← 브룩베일',
        start: '호흡 시작',
        stop: '멈추기',
        patterns: '패턴 선택',
        inhale: '들이쉬세요',
        hold: '참으세요',
        exhale: '내쉬세요',
        ready: '준비',
        complete: '완료!',
        sessionDone: '세션 완료!',
        acornsEarned: '+6 도토리',
        todaySessions: '오늘',
        totalMinutes: '총 시간',
        currentStreak: '연속',
        motivation: '☁️ 잠시 숨을 고르세요. 이 평화를 누릴 자격이 있어요.',
        // New
        stats: '📊 통계',
        history: '세션 기록',
        benefit: '효과',
        totalSessions: '총 세션',
        bestStreak: '최고 연속',
        days: '일',
        favorite: '즐겨찾기',
        weeklyGoal: '주간 목표',
        sessionsThisWeek: '이번 주 세션',
        ambientSound: '배경음',
        close: '닫기',
        noHistory: '아직 세션이 없어요. 호흡을 시작하세요!',
        minutes: '분',
    },
};

export default function BreathBubblePage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [selectedPattern, setSelectedPattern] = useState<BreathPattern>(BREATH_PATTERNS[0]);
    const [phase, setPhase] = useState<BreathPhase>('idle');
    const [timer, setTimer] = useState(0);
    const [currentCycle, setCurrentCycle] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showPatternDetail, setShowPatternDetail] = useState<BreathPattern | null>(null);
    const [ambientSound, setAmbientSound] = useState('none');
    const [breathProgress, setBreathProgress] = useState(0);
    const [stats, setStats] = useState<BreathStats>({
        todaySessions: 0,
        totalMinutes: 0,
        totalSessions: 0,
        streak: 0,
        bestStreak: 0,
        lastDate: '',
        history: [],
    });

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const progressRef = useRef<NodeJS.Timeout | null>(null);

    const { balance: totalAcorns, earn, isLoaded } = useAcornStore(language);
    const t = translations[language];

    // Load stats from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            const savedLang = localStorage.getItem('brookvale-language') as Language;

            if (savedLang) setLanguage(savedLang);

            if (saved) {
                const data = JSON.parse(saved) as BreathStats;
                const today = new Date().toDateString();

                if (data.lastDate === today) {
                    setStats(data);
                } else {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const newStreak = data.lastDate === yesterday.toDateString() ? data.streak : 0;

                    setStats({
                        ...data,
                        todaySessions: 0,
                        streak: newStreak,
                        lastDate: today,
                    });
                }
            }
        }
    }, []);

    // Save stats
    const saveStats = useCallback((newStats: BreathStats) => {
        const today = new Date().toDateString();
        const updatedStats = { ...newStats, lastDate: today };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStats));
        setStats(updatedStats);
    }, []);

    // Calculate weekly sessions
    const getWeeklySessions = useCallback(() => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return stats.history.filter(h => new Date(h.date) >= oneWeekAgo).length;
    }, [stats.history]);

    // Get phase duration
    const getPhaseDuration = useCallback((p: BreathPhase): number => {
        switch (p) {
            case 'inhale': return selectedPattern.inhale;
            case 'hold1': return selectedPattern.hold1;
            case 'exhale': return selectedPattern.exhale;
            case 'hold2': return selectedPattern.hold2;
            default: return 0;
        }
    }, [selectedPattern]);

    // Get next phase
    const getNextPhase = useCallback((current: BreathPhase, cycle: number): { phase: BreathPhase; cycle: number } => {
        const phases: BreathPhase[] = ['inhale', 'hold1', 'exhale', 'hold2'];
        const currentIndex = phases.indexOf(current);

        let nextIndex = currentIndex + 1;
        while (nextIndex < phases.length && getPhaseDuration(phases[nextIndex]) === 0) {
            nextIndex++;
        }

        if (nextIndex >= phases.length) {
            if (cycle >= selectedPattern.cycles) {
                return { phase: 'complete', cycle };
            }
            return { phase: 'inhale', cycle: cycle + 1 };
        }

        return { phase: phases[nextIndex], cycle };
    }, [selectedPattern, getPhaseDuration]);

    // Start breathing session
    const startSession = useCallback(() => {
        setIsRunning(true);
        setPhase('inhale');
        setCurrentCycle(1);
        setTimer(selectedPattern.inhale);
        setBreathProgress(0);
    }, [selectedPattern]);

    // Stop session
    const stopSession = useCallback(() => {
        setIsRunning(false);
        setPhase('idle');
        setTimer(0);
        setCurrentCycle(0);
        setBreathProgress(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (progressRef.current) clearInterval(progressRef.current);
    }, []);

    // Progress animation
    useEffect(() => {
        if (!isRunning || phase === 'idle' || phase === 'complete') {
            return;
        }

        const duration = getPhaseDuration(phase);
        if (duration === 0) return;

        let progress = 0;
        const increment = 100 / (duration * 20);

        progressRef.current = setInterval(() => {
            progress += increment;
            setBreathProgress(Math.min(progress, 100));
        }, 50);

        return () => {
            if (progressRef.current) clearInterval(progressRef.current);
        };
    }, [isRunning, phase, getPhaseDuration]);

    // Timer logic
    useEffect(() => {
        if (!isRunning || phase === 'idle' || phase === 'complete') {
            return;
        }

        intervalRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    const next = getNextPhase(phase, currentCycle);

                    if (next.phase === 'complete') {
                        setPhase('complete');
                        setIsRunning(false);

                        earn(6, language === 'ko' ? '숨쉬기 버블' : 'Breath Bubble');

                        const totalTime = selectedPattern.cycles *
                            (selectedPattern.inhale + selectedPattern.hold1 +
                                selectedPattern.exhale + selectedPattern.hold2);

                        const newSession: SessionHistory = {
                            date: new Date().toISOString(),
                            patternId: selectedPattern.id,
                            duration: totalTime,
                        };

                        const newStats: BreathStats = {
                            ...stats,
                            todaySessions: stats.todaySessions + 1,
                            totalSessions: stats.totalSessions + 1,
                            totalMinutes: stats.totalMinutes + Math.ceil(totalTime / 60),
                            streak: stats.todaySessions === 0 ? stats.streak + 1 : stats.streak,
                            bestStreak: Math.max(stats.bestStreak, stats.todaySessions === 0 ? stats.streak + 1 : stats.streak),
                            history: [newSession, ...stats.history.slice(0, 29)],
                        };
                        saveStats(newStats);

                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 3000);

                        return 0;
                    }

                    setPhase(next.phase);
                    setCurrentCycle(next.cycle);
                    setBreathProgress(0);
                    return getPhaseDuration(next.phase);
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, phase, currentCycle, getNextPhase, getPhaseDuration, earn, language, selectedPattern, stats, saveStats]);

    const getPhaseText = () => {
        switch (phase) {
            case 'inhale': return t.inhale;
            case 'hold1':
            case 'hold2': return t.hold;
            case 'exhale': return t.exhale;
            case 'complete': return t.complete;
            default: return t.ready;
        }
    };

    const getBubbleClass = () => {
        if (phase === 'inhale') return 'breath-bubble inhale';
        if (phase === 'hold1') return 'breath-bubble hold';
        if (phase === 'exhale') return 'breath-bubble exhale';
        if (phase === 'hold2') return 'breath-bubble exhale';
        if (phase === 'complete') return 'breath-bubble complete';
        return 'breath-bubble';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return language === 'ko'
            ? `${date.getMonth() + 1}월 ${date.getDate()}일`
            : date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    if (!isLoaded) {
        return <div className="breath-bubble-app">Loading...</div>;
    }

    return (
        <div className="breath-bubble-app">
            {/* Toast */}
            {showToast && (
                <div className="session-toast">
                    <span className="toast-icon">🫧</span>
                    <div>
                        <div className="toast-text">{t.sessionDone}</div>
                        <div className="toast-acorns">{t.acornsEarned}</div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <BackLink>{t.back}</BackLink>
                <h1>🫧 {t.title}</h1>
                <div className="header-right">
                    <button className="icon-btn" onClick={() => setShowStats(true)}>📊</button>
                    <span className="acorn-badge">🌰 {totalAcorns}</span>
                </div>
            </header>

            {/* Ambient Sound Selector */}
            <section className="sound-section">
                <div className="sound-selector">
                    {AMBIENT_SOUNDS.map(sound => (
                        <button
                            key={sound.id}
                            className={`sound-btn ${ambientSound === sound.id ? 'active' : ''}`}
                            onClick={() => setAmbientSound(sound.id)}
                        >
                            {sound.emoji}
                        </button>
                    ))}
                </div>
            </section>

            {/* Main Bubble */}
            <section className="bubble-section">
                <div className={getBubbleClass()}>
                    <div className="bubble-inner">
                        <span className="bubble-text">{getPhaseText()}</span>
                        {isRunning && <span className="bubble-timer">{timer}</span>}
                    </div>
                    {isRunning && (
                        <svg className="progress-ring" viewBox="0 0 200 200">
                            <circle
                                className="progress-ring-bg"
                                cx="100" cy="100" r="90"
                                fill="none"
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="8"
                            />
                            <circle
                                className="progress-ring-fill"
                                cx="100" cy="100" r="90"
                                fill="none"
                                stroke="rgba(255,255,255,0.8)"
                                strokeWidth="8"
                                strokeDasharray={565}
                                strokeDashoffset={565 - (breathProgress / 100) * 565}
                                strokeLinecap="round"
                                transform="rotate(-90 100 100)"
                            />
                        </svg>
                    )}
                </div>

                <div className="pattern-info">
                    <div
                        className="pattern-name clickable"
                        onClick={() => !isRunning && setShowPatternDetail(selectedPattern)}
                    >
                        {selectedPattern.emoji} {language === 'ko' ? selectedPattern.nameKo : selectedPattern.name}
                        {!isRunning && <span className="info-icon">ℹ️</span>}
                    </div>
                    <div className="pattern-sequence">
                        {isRunning && `Cycle ${currentCycle}/${selectedPattern.cycles}`}
                    </div>
                </div>

                <div className="breath-controls">
                    {!isRunning ? (
                        <button className="control-btn start-btn" onClick={startSession}>
                            {t.start}
                        </button>
                    ) : (
                        <button className="control-btn stop-btn" onClick={stopSession}>
                            {t.stop}
                        </button>
                    )}
                </div>
            </section>

            {/* Pattern Selection */}
            <section className="patterns-section">
                <h2>{t.patterns}</h2>
                <div className="pattern-grid">
                    {BREATH_PATTERNS.map(pattern => (
                        <div
                            key={pattern.id}
                            className={`pattern-card ${selectedPattern.id === pattern.id ? 'active' : ''}`}
                            onClick={() => !isRunning && setSelectedPattern(pattern)}
                        >
                            <div className="pattern-emoji">{pattern.emoji}</div>
                            <div className="pattern-title">
                                {language === 'ko' ? pattern.nameKo : pattern.name}
                            </div>
                            <div className="pattern-desc">
                                {language === 'ko' ? pattern.descriptionKo : pattern.description}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Quick Stats */}
            <section className="stats-section">
                <div className="stat-card">
                    <div className="stat-icon">🫧</div>
                    <div className="stat-value">{stats.todaySessions}</div>
                    <div className="stat-label">{t.todaySessions}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-value">{stats.totalMinutes}</div>
                    <div className="stat-label">{t.totalMinutes}</div>
                </div>
                <div className="stat-card highlight">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-value">{stats.streak}</div>
                    <div className="stat-label">{t.currentStreak}</div>
                </div>
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
                            <div className="overview-card">
                                <span className="ov-icon">🫧</span>
                                <span className="ov-number">{stats.totalSessions}</span>
                                <span className="ov-label">{t.totalSessions}</span>
                            </div>
                            <div className="overview-card">
                                <span className="ov-icon">⏱️</span>
                                <span className="ov-number">{stats.totalMinutes}</span>
                                <span className="ov-label">{t.totalMinutes}</span>
                            </div>
                            <div className="overview-card highlight">
                                <span className="ov-icon">🏆</span>
                                <span className="ov-number">{stats.bestStreak}</span>
                                <span className="ov-label">{t.bestStreak}</span>
                            </div>
                            <div className="overview-card">
                                <span className="ov-icon">📅</span>
                                <span className="ov-number">{getWeeklySessions()}</span>
                                <span className="ov-label">{t.sessionsThisWeek}</span>
                            </div>
                        </div>

                        <div className="history-section">
                            <h3>{t.history}</h3>
                            {stats.history.length === 0 ? (
                                <div className="empty-history">{t.noHistory}</div>
                            ) : (
                                <div className="history-list">
                                    {stats.history.slice(0, 10).map((session, i) => {
                                        const pattern = BREATH_PATTERNS.find(p => p.id === session.patternId);
                                        return (
                                            <div key={i} className="history-item">
                                                <span className="history-emoji">{pattern?.emoji || '🫧'}</span>
                                                <span className="history-name">
                                                    {language === 'ko' ? pattern?.nameKo : pattern?.name}
                                                </span>
                                                <span className="history-duration">
                                                    {Math.ceil(session.duration / 60)} {t.minutes}
                                                </span>
                                                <span className="history-date">{formatDate(session.date)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <button className="close-btn" onClick={() => setShowStats(false)}>×</button>
                    </div>
                </div>
            )}

            {/* Pattern Detail Modal */}
            {showPatternDetail && (
                <div className="modal-overlay" onClick={() => setShowPatternDetail(null)}>
                    <div className="modal-content pattern-modal" onClick={e => e.stopPropagation()}>
                        <div className="pattern-detail-emoji">{showPatternDetail.emoji}</div>
                        <h2>{language === 'ko' ? showPatternDetail.nameKo : showPatternDetail.name}</h2>
                        <p className="pattern-detail-desc">
                            {language === 'ko' ? showPatternDetail.descriptionKo : showPatternDetail.description}
                        </p>

                        <div className="pattern-timing">
                            <div className="timing-item">
                                <span className="timing-label">{t.inhale}</span>
                                <span className="timing-value">{showPatternDetail.inhale}s</span>
                            </div>
                            {showPatternDetail.hold1 > 0 && (
                                <div className="timing-item">
                                    <span className="timing-label">{t.hold}</span>
                                    <span className="timing-value">{showPatternDetail.hold1}s</span>
                                </div>
                            )}
                            <div className="timing-item">
                                <span className="timing-label">{t.exhale}</span>
                                <span className="timing-value">{showPatternDetail.exhale}s</span>
                            </div>
                            {showPatternDetail.hold2 > 0 && (
                                <div className="timing-item">
                                    <span className="timing-label">{t.hold}</span>
                                    <span className="timing-value">{showPatternDetail.hold2}s</span>
                                </div>
                            )}
                        </div>

                        <div className="pattern-benefit">
                            <strong>{t.benefit}:</strong>
                            <p>{language === 'ko' ? showPatternDetail.benefitKo : showPatternDetail.benefit}</p>
                        </div>

                        <button
                            className="select-pattern-btn"
                            onClick={() => {
                                setSelectedPattern(showPatternDetail);
                                setShowPatternDetail(null);
                            }}
                        >
                            {t.start}
                        </button>

                        <button className="close-btn" onClick={() => setShowPatternDetail(null)}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
}
