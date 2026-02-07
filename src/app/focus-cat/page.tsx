'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import { BackLink } from '@/components/BackLink';
import './focus-cat.css';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
type CatLevel = 'kitten' | 'young' | 'adult' | 'master' | 'legend';

// Customizable timer presets
const TIMER_PRESETS = {
    focus: [15, 20, 25, 30, 45, 60],
    shortBreak: [3, 5, 10],
    longBreak: [10, 15, 20, 30],
};

const DEFAULT_SETTINGS = {
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
};

const CAT_STATES = {
    idle: '😺',
    focus: '😼',
    break: '😸',
    sleeping: '😴',
    happy: '😻',
    legendary: '🐱‍👤',
};

const CAT_LEVELS: { level: CatLevel; minMinutes: number; emoji: string; title: { en: string; ko: string } }[] = [
    { level: 'kitten', minMinutes: 0, emoji: '🐱', title: { en: 'Kitten', ko: '아기냥이' } },
    { level: 'young', minMinutes: 60, emoji: '😺', title: { en: 'Young Cat', ko: '청소년냥이' } },
    { level: 'adult', minMinutes: 300, emoji: '😼', title: { en: 'Adult Cat', ko: '성인냥이' } },
    { level: 'master', minMinutes: 1000, emoji: '😻', title: { en: 'Master Cat', ko: '마스터냥이' } },
    { level: 'legend', minMinutes: 3000, emoji: '🦁', title: { en: 'Legend Cat', ko: '전설의냥이' } },
];

// Extended translations for Focus Cat
const focusCatTranslations = {
    en: {
        title: 'Focus Cat',
        back: '← Brookvale',
        sessions: 'sessions',
        focus: 'Focus',
        shortBreak: 'Short Break',
        longBreak: 'Long Break',
        focusTime: 'Focus Time',
        start: '▶ Start',
        pause: '⏸ Pause',
        reset: '↺ Reset',
        skip: '⏭ Skip',
        todayFocus: "Today's Focus",
        noSessions: 'No sessions completed yet',
        tips: '💡 Focus Tips',
        tip1: 'Put your phone in another room',
        tip2: 'Stay hydrated with water',
        tip3: 'Stretch during break time',
        catIdle: 'Press start to begin!',
        catFocus: 'Focusing... Do not disturb 🔥',
        catBreak: 'Break time~ Stretch a bit!',
        catSleeping: 'zzZ... Timer complete!',
        catHappy: 'Great job! Quest completed! 🎉',
        questComplete: 'Quest Complete!',
        acornsEarned: 'Acorns earned',
        xpEarned: 'XP earned',
        // New translations
        stats: '📊 Statistics',
        today: 'Today',
        week: 'This Week',
        total: 'Total',
        minutes: 'min',
        hours: 'h',
        streak: '🔥 Streak',
        days: 'days',
        settings: '⚙️ Settings',
        customTime: 'Custom Time',
        focusDuration: 'Focus Duration',
        breakDuration: 'Break Duration',
        longBreakDuration: 'Long Break Duration',
        save: 'Save',
        cancel: 'Cancel',
        catLevel: 'Cat Level',
        levelUp: 'Level Up!',
        nextLevel: 'Next Level',
        minutesToGo: 'min to go',
        sound: '🔔 Sound',
        soundOn: 'On',
        soundOff: 'Off',
    },
    ko: {
        title: '포커스 캣',
        back: '← 브룩베일',
        sessions: '세션',
        focus: '집중',
        shortBreak: '짧은 휴식',
        longBreak: '긴 휴식',
        focusTime: '집중 시간',
        start: '▶ 시작',
        pause: '⏸ 일시정지',
        reset: '↺ 리셋',
        skip: '⏭ 스킵',
        todayFocus: '오늘의 집중',
        noSessions: '아직 완료한 세션이 없어요',
        tips: '💡 집중 팁',
        tip1: '휴대폰은 다른 방에 두세요',
        tip2: '물을 마시며 수분을 유지하세요',
        tip3: '휴식 시간에는 스트레칭을 하세요',
        catIdle: '시작 버튼을 눌러주세요!',
        catFocus: '집중 중... 방해하지 마세요 🔥',
        catBreak: '휴식 시간이에요~ 스트레칭 하세요!',
        catSleeping: 'zzZ... 타이머 완료!',
        catHappy: '잘했어요! 퀘스트 완료! 🎉',
        questComplete: '퀘스트 완료!',
        acornsEarned: '도토리 획득',
        xpEarned: '경험치 획득',
        // New translations
        stats: '📊 통계',
        today: '오늘',
        week: '이번 주',
        total: '전체',
        minutes: '분',
        hours: '시간',
        streak: '🔥 연속',
        days: '일',
        settings: '⚙️ 설정',
        customTime: '시간 설정',
        focusDuration: '집중 시간',
        breakDuration: '휴식 시간',
        longBreakDuration: '긴 휴식 시간',
        save: '저장',
        cancel: '취소',
        catLevel: '고양이 레벨',
        levelUp: '레벨 업!',
        nextLevel: '다음 레벨',
        minutesToGo: '분 남음',
        sound: '🔔 알림',
        soundOn: '켜기',
        soundOff: '끄기',
    },
};

// Storage keys
const STORAGE_KEYS = {
    stats: 'focusCatStats',
    settings: 'focusCatSettings',
};

interface FocusStats {
    todayMinutes: number;
    todaySessions: number;
    weekMinutes: number;
    weekSessions: number;
    totalMinutes: number;
    totalSessions: number;
    streak: number;
    lastSessionDate: string;
    dailyHistory: { date: string; minutes: number }[];
}

interface FocusSettings {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    soundEnabled: boolean;
}

const getDefaultStats = (): FocusStats => ({
    todayMinutes: 0,
    todaySessions: 0,
    weekMinutes: 0,
    weekSessions: 0,
    totalMinutes: 0,
    totalSessions: 0,
    streak: 0,
    lastSessionDate: '',
    dailyHistory: [],
});

const getDefaultSettings = (): FocusSettings => ({
    focusDuration: DEFAULT_SETTINGS.focus,
    shortBreakDuration: DEFAULT_SETTINGS.shortBreak,
    longBreakDuration: DEFAULT_SETTINGS.longBreak,
    soundEnabled: true,
});

export default function FocusCatPage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [mode, setMode] = useState<TimerMode>('focus');
    const [isRunning, setIsRunning] = useState(false);
    const [catState, setCatState] = useState<keyof typeof CAT_STATES>('idle');
    const [showReward, setShowReward] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);

    // Stats and settings from localStorage
    const [stats, setStats] = useState<FocusStats>(getDefaultStats());
    const [settings, setSettings] = useState<FocusSettings>(getDefaultSettings());
    const [tempSettings, setTempSettings] = useState<FocusSettings>(getDefaultSettings());

    // Timer state
    const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Use global acorn system
    const { balance: totalAcorns, earn: earnAcorns } = useAcornStore(language);

    const t = focusCatTranslations[language];

    // Load stats and settings from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedStats = localStorage.getItem(STORAGE_KEYS.stats);
            const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);
            const savedLang = localStorage.getItem('brookvale-language') as Language;

            if (savedLang) setLanguage(savedLang);

            if (savedStats) {
                const parsed = JSON.parse(savedStats) as FocusStats;
                // Check if it's a new day and reset daily stats
                const today = new Date().toDateString();
                if (parsed.lastSessionDate !== today) {
                    // Check streak
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const wasYesterday = parsed.lastSessionDate === yesterday.toDateString();

                    parsed.todayMinutes = 0;
                    parsed.todaySessions = 0;
                    if (!wasYesterday && parsed.lastSessionDate !== '') {
                        parsed.streak = 0;
                    }
                }
                setStats(parsed);
            }

            if (savedSettings) {
                const parsed = JSON.parse(savedSettings) as FocusSettings;
                setSettings(parsed);
                setTempSettings(parsed);
                setTimeLeft(parsed.focusDuration * 60);
            }
        }
    }, []);

    // Save stats to localStorage
    const saveStats = useCallback((newStats: FocusStats) => {
        setStats(newStats);
        localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(newStats));
    }, []);

    // Save settings to localStorage
    const saveSettings = useCallback((newSettings: FocusSettings) => {
        setSettings(newSettings);
        setTempSettings(newSettings);
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(newSettings));
    }, []);

    // Get current cat level
    const getCatLevel = useCallback(() => {
        const totalMinutes = stats.totalMinutes;
        for (let i = CAT_LEVELS.length - 1; i >= 0; i--) {
            if (totalMinutes >= CAT_LEVELS[i].minMinutes) {
                return CAT_LEVELS[i];
            }
        }
        return CAT_LEVELS[0];
    }, [stats.totalMinutes]);

    // Get next cat level
    const getNextLevel = useCallback(() => {
        const currentLevel = getCatLevel();
        const currentIndex = CAT_LEVELS.findIndex(l => l.level === currentLevel.level);
        if (currentIndex < CAT_LEVELS.length - 1) {
            return CAT_LEVELS[currentIndex + 1];
        }
        return null;
    }, [getCatLevel]);

    // Get timer duration based on mode
    const getTimerDuration = useCallback((timerMode: TimerMode) => {
        switch (timerMode) {
            case 'focus': return settings.focusDuration * 60;
            case 'shortBreak': return settings.shortBreakDuration * 60;
            case 'longBreak': return settings.longBreakDuration * 60;
        }
    }, [settings]);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Play completion sound
    const playSound = useCallback(() => {
        if (settings.soundEnabled) {
            try {
                const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 880;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.3;

                oscillator.start();
                setTimeout(() => {
                    oscillator.frequency.value = 1100;
                    setTimeout(() => {
                        oscillator.frequency.value = 1320;
                        setTimeout(() => oscillator.stop(), 200);
                    }, 200);
                }, 200);
            } catch {
                console.log('Audio not supported');
            }
        }
    }, [settings.soundEnabled]);

    // Ref to prevent double-completion (e.g., skip button + timer reaching 0)
    const completionLock = useRef(false);

    // Handle timer completion
    const handleTimerComplete = useCallback(() => {
        // Guard: prevent double-completion race condition
        if (completionLock.current) return;
        completionLock.current = true;

        setIsRunning(false);
        playSound();

        if (mode === 'focus') {
            const focusMinutes = settings.focusDuration;
            const today = new Date().toDateString();
            const previousLevel = getCatLevel();

            // Update stats
            const newStats = { ...stats };
            newStats.todayMinutes += focusMinutes;
            newStats.todaySessions += 1;
            newStats.weekMinutes += focusMinutes;
            newStats.weekSessions += 1;
            newStats.totalMinutes += focusMinutes;
            newStats.totalSessions += 1;

            // Update streak
            if (newStats.lastSessionDate !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (newStats.lastSessionDate === yesterday.toDateString() || newStats.lastSessionDate === '') {
                    newStats.streak += 1;
                } else {
                    newStats.streak = 1;
                }
            }
            newStats.lastSessionDate = today;

            // Update daily history
            const historyIndex = newStats.dailyHistory.findIndex(h => h.date === today);
            if (historyIndex >= 0) {
                newStats.dailyHistory[historyIndex].minutes += focusMinutes;
            } else {
                newStats.dailyHistory.push({ date: today, minutes: focusMinutes });
                // Keep only last 7 days
                if (newStats.dailyHistory.length > 7) {
                    newStats.dailyHistory = newStats.dailyHistory.slice(-7);
                }
            }

            saveStats(newStats);

            // Check for level up using newStats directly (not stale React state)
            const checkLevel = (totalMinutes: number) => {
                for (let i = CAT_LEVELS.length - 1; i >= 0; i--) {
                    if (totalMinutes >= CAT_LEVELS[i].minMinutes) return CAT_LEVELS[i];
                }
                return CAT_LEVELS[0];
            };
            const newLevel = checkLevel(newStats.totalMinutes);
            if (newLevel.level !== previousLevel.level) {
                setShowLevelUp(true);
                setTimeout(() => setShowLevelUp(false), 3000);
            }

            setCatState('happy');
            setShowReward(true);
            earnAcorns(10, 'Focus Cat');

            setTimeout(() => {
                setShowReward(false);
                setCatState('sleeping');
            }, 3000);

            // After 4 focus sessions, take a long break
            if ((newStats.todaySessions) % 4 === 0) {
                setTimeout(() => {
                    setMode('longBreak');
                    setTimeLeft(getTimerDuration('longBreak'));
                    completionLock.current = false;
                }, 3000);
            } else {
                setTimeout(() => {
                    setMode('shortBreak');
                    setTimeLeft(getTimerDuration('shortBreak'));
                    completionLock.current = false;
                }, 3000);
            }
        } else {
            setCatState('sleeping');
            setMode('focus');
            setTimeLeft(getTimerDuration('focus'));
            completionLock.current = false;
        }
    }, [mode, stats, settings.focusDuration, earnAcorns, saveStats, getCatLevel, getTimerDuration, playSound]);

    // Store handleTimerComplete in a ref to avoid re-creating the interval
    const handleTimerCompleteRef = useRef(handleTimerComplete);
    handleTimerCompleteRef.current = handleTimerComplete;

    // Handle timer — uses ref to avoid interval recreation on every dependency change
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Timer reaching 0 — complete in the next tick
                        setTimeout(() => handleTimerCompleteRef.current(), 0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, timeLeft]);

    // Update cat state based on mode and running (removed catState from deps to prevent loops)
    useEffect(() => {
        if (isRunning && mode === 'focus') {
            setCatState('focus');
        } else if (isRunning) {
            setCatState('break');
        } else {
            // Only reset to idle if not in a temporary celebration/sleep state
            setCatState(prev => (prev === 'happy' || prev === 'sleeping') ? prev : 'idle');
        }
    }, [isRunning, mode]);

    const toggleTimer = () => {
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(getTimerDuration(mode));
        setCatState('idle');
    };

    const changeMode = (newMode: TimerMode) => {
        setIsRunning(false);
        setMode(newMode);
        setTimeLeft(getTimerDuration(newMode));
        setCatState('idle');
    };

    // Calculate progress percentage
    const progress = ((getTimerDuration(mode) - timeLeft) / getTimerDuration(mode)) * 100;

    // Get cat message based on state
    const getCatMessage = () => {
        switch (catState) {
            case 'idle': return t.catIdle;
            case 'focus': return t.catFocus;
            case 'break': return t.catBreak;
            case 'sleeping': return t.catSleeping;
            case 'happy': return t.catHappy;
            default: return '';
        }
    };

    const currentLevel = getCatLevel();
    const nextLevel = getNextLevel();
    const levelProgress = nextLevel
        ? ((stats.totalMinutes - currentLevel.minMinutes) / (nextLevel.minMinutes - currentLevel.minMinutes)) * 100
        : 100;

    return (
        <div className="focus-cat-app">
            {/* Header */}
            <header className="app-header">
                <BackLink>{t.back}</BackLink>
                <h1>🐱 {t.title}</h1>
                <div className="header-right">
                    <button className="icon-btn" onClick={() => setShowStats(!showStats)}>📊</button>
                    <button className="icon-btn" onClick={() => { setTempSettings(settings); setShowSettings(!showSettings); }}>⚙️</button>
                    <span className="acorn-count">🌰 {totalAcorns}</span>
                </div>
            </header>

            {/* Cat Level Badge */}
            <div className="cat-level-badge">
                <span className="level-emoji">{currentLevel.emoji}</span>
                <span className="level-title">{currentLevel.title[language]}</span>
                {nextLevel && (
                    <div className="level-progress-mini">
                        <div className="level-bar" style={{ width: `${levelProgress}%` }} />
                    </div>
                )}
            </div>

            {/* Main Timer Area */}
            <main className="timer-container">
                {/* Mode Selector */}
                <div className="mode-selector">
                    <button
                        className={`mode-btn ${mode === 'focus' ? 'active' : ''}`}
                        onClick={() => changeMode('focus')}
                    >
                        {t.focus} ({settings.focusDuration}m)
                    </button>
                    <button
                        className={`mode-btn ${mode === 'shortBreak' ? 'active' : ''}`}
                        onClick={() => changeMode('shortBreak')}
                    >
                        {t.shortBreak} ({settings.shortBreakDuration}m)
                    </button>
                    <button
                        className={`mode-btn ${mode === 'longBreak' ? 'active' : ''}`}
                        onClick={() => changeMode('longBreak')}
                    >
                        {t.longBreak} ({settings.longBreakDuration}m)
                    </button>
                </div>

                {/* Cat Display */}
                <div className={`cat-display ${isRunning ? 'working' : ''} ${catState}`}>
                    <div className="cat-emoji">{CAT_STATES[catState]}</div>
                    <div className="cat-message">{getCatMessage()}</div>
                </div>

                {/* Timer Circle */}
                <div className="timer-circle">
                    <svg className="progress-ring" viewBox="0 0 200 200">
                        <circle
                            className="progress-bg"
                            cx="100"
                            cy="100"
                            r="90"
                        />
                        <circle
                            className="progress-bar"
                            cx="100"
                            cy="100"
                            r="90"
                            style={{
                                strokeDashoffset: 565 - (565 * progress) / 100,
                            }}
                        />
                    </svg>
                    <div className="timer-display">
                        <span className="time">{formatTime(timeLeft)}</span>
                        <span className="mode-label">
                            {mode === 'focus' ? t.focusTime : mode === 'shortBreak' ? t.shortBreak : t.longBreak}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="timer-controls">
                    <button className="control-btn reset" onClick={resetTimer}>
                        {t.reset}
                    </button>
                    <button
                        className={`control-btn main ${isRunning ? 'pause' : 'start'}`}
                        onClick={toggleTimer}
                    >
                        {isRunning ? t.pause : t.start}
                    </button>
                    <button className="control-btn skip" onClick={handleTimerComplete}>
                        {t.skip}
                    </button>
                </div>
            </main>

            {/* Quick Stats Bar */}
            <div className="quick-stats">
                <div className="stat-item">
                    <span className="stat-value">{stats.todayMinutes}</span>
                    <span className="stat-label">{t.today} ({t.minutes})</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.todaySessions}</span>
                    <span className="stat-label">🍅 {t.sessions}</span>
                </div>
                <div className="stat-item highlight">
                    <span className="stat-value">{stats.streak}</span>
                    <span className="stat-label">{t.streak} {t.days}</span>
                </div>
            </div>

            {/* Session History */}
            <section className="session-history">
                <h2>{t.todayFocus}</h2>
                <div className="tomatoes">
                    {[...Array(stats.todaySessions)].map((_, i) => (
                        <span key={i} className="tomato">🍅</span>
                    ))}
                    {stats.todaySessions === 0 && <span className="empty">{t.noSessions}</span>}
                </div>
            </section>

            {/* Tips */}
            <section className="tips">
                <h3>{t.tips}</h3>
                <ul>
                    <li>{t.tip1}</li>
                    <li>{t.tip2}</li>
                    <li>{t.tip3}</li>
                </ul>
            </section>

            {/* Stats Panel */}
            {showStats && (
                <div className="modal-overlay" onClick={() => setShowStats(false)}>
                    <div className="modal-content stats-modal" onClick={e => e.stopPropagation()}>
                        <h2>{t.stats}</h2>

                        {/* Cat Level Section */}
                        <div className="level-section">
                            <h3>{t.catLevel}</h3>
                            <div className="level-display">
                                <span className="big-emoji">{currentLevel.emoji}</span>
                                <div className="level-info">
                                    <span className="level-name">{currentLevel.title[language]}</span>
                                    {nextLevel && (
                                        <div className="next-level-info">
                                            <span>{t.nextLevel}: {nextLevel.title[language]}</span>
                                            <span className="to-go">{nextLevel.minMinutes - stats.totalMinutes} {t.minutesToGo}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="level-progress-bar">
                                <div className="level-fill" style={{ width: `${levelProgress}%` }} />
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-title">{t.today}</span>
                                <span className="stat-number">{stats.todayMinutes} {t.minutes}</span>
                                <span className="stat-sub">{stats.todaySessions} {t.sessions}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-title">{t.week}</span>
                                <span className="stat-number">{stats.weekMinutes} {t.minutes}</span>
                                <span className="stat-sub">{stats.weekSessions} {t.sessions}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-title">{t.total}</span>
                                <span className="stat-number">{Math.floor(stats.totalMinutes / 60)}{t.hours} {stats.totalMinutes % 60}{t.minutes}</span>
                                <span className="stat-sub">{stats.totalSessions} {t.sessions}</span>
                            </div>
                            <div className="stat-card highlight">
                                <span className="stat-title">{t.streak}</span>
                                <span className="stat-number">🔥 {stats.streak}</span>
                                <span className="stat-sub">{t.days}</span>
                            </div>
                        </div>

                        {/* Weekly Chart */}
                        <div className="weekly-chart">
                            <h4>{t.week}</h4>
                            <div className="chart-bars">
                                {Array.from({ length: 7 }).map((_, i) => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - (6 - i));
                                    const dateStr = date.toDateString();
                                    const dayData = stats.dailyHistory.find(h => h.date === dateStr);
                                    const minutes = dayData?.minutes || 0;
                                    const maxMinutes = Math.max(...stats.dailyHistory.map(h => h.minutes), 30);
                                    const height = minutes > 0 ? Math.max((minutes / maxMinutes) * 100, 10) : 5;

                                    return (
                                        <div key={i} className="chart-bar-container">
                                            <div
                                                className={`chart-bar ${minutes > 0 ? 'active' : ''}`}
                                                style={{ height: `${height}%` }}
                                            />
                                            <span className="chart-day">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button className="close-btn" onClick={() => setShowStats(false)}>×</button>
                    </div>
                </div>
            )}

            {/* Settings Panel */}
            {showSettings && (
                <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
                        <h2>{t.settings}</h2>

                        <div className="setting-group">
                            <label>{t.focusDuration}</label>
                            <div className="preset-buttons">
                                {TIMER_PRESETS.focus.map(min => (
                                    <button
                                        key={min}
                                        className={`preset-btn ${tempSettings.focusDuration === min ? 'active' : ''}`}
                                        onClick={() => setTempSettings({ ...tempSettings, focusDuration: min })}
                                    >
                                        {min}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="setting-group">
                            <label>{t.breakDuration}</label>
                            <div className="preset-buttons">
                                {TIMER_PRESETS.shortBreak.map(min => (
                                    <button
                                        key={min}
                                        className={`preset-btn ${tempSettings.shortBreakDuration === min ? 'active' : ''}`}
                                        onClick={() => setTempSettings({ ...tempSettings, shortBreakDuration: min })}
                                    >
                                        {min}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="setting-group">
                            <label>{t.longBreakDuration}</label>
                            <div className="preset-buttons">
                                {TIMER_PRESETS.longBreak.map(min => (
                                    <button
                                        key={min}
                                        className={`preset-btn ${tempSettings.longBreakDuration === min ? 'active' : ''}`}
                                        onClick={() => setTempSettings({ ...tempSettings, longBreakDuration: min })}
                                    >
                                        {min}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="setting-group sound-toggle">
                            <label>{t.sound}</label>
                            <button
                                className={`toggle-btn ${tempSettings.soundEnabled ? 'on' : 'off'}`}
                                onClick={() => setTempSettings({ ...tempSettings, soundEnabled: !tempSettings.soundEnabled })}
                            >
                                {tempSettings.soundEnabled ? t.soundOn : t.soundOff}
                            </button>
                        </div>

                        <div className="modal-actions">
                            <button className="action-btn cancel" onClick={() => setShowSettings(false)}>
                                {t.cancel}
                            </button>
                            <button
                                className="action-btn save"
                                onClick={() => {
                                    saveSettings(tempSettings);
                                    setTimeLeft(tempSettings.focusDuration * 60);
                                    setShowSettings(false);
                                }}
                            >
                                {t.save}
                            </button>
                        </div>

                        <button className="close-btn" onClick={() => setShowSettings(false)}>×</button>
                    </div>
                </div>
            )}

            {/* Reward Popup */}
            {showReward && (
                <div className="reward-popup">
                    <div className="reward-content">
                        <div className="reward-icon">🎉</div>
                        <h2>{t.questComplete}</h2>
                        <div className="reward-details">
                            <div className="reward-item">
                                <span>🌰</span>
                                <span>+10 {t.acornsEarned}</span>
                            </div>
                            <div className="reward-item">
                                <span>⭐</span>
                                <span>+25 {t.xpEarned}</span>
                            </div>
                        </div>
                    </div>
                    {/* Confetti */}
                    <div className="confetti-container">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="confetti-piece"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 0.5}s`,
                                    backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'][i % 5],
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Level Up Popup */}
            {showLevelUp && (
                <div className="level-up-popup">
                    <div className="level-up-content">
                        <div className="sparkles">✨</div>
                        <div className="new-level-emoji">{currentLevel.emoji}</div>
                        <h2>{t.levelUp}</h2>
                        <p>{currentLevel.title[language]}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
