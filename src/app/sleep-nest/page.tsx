'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import './sleep-nest.css';

// ==================== TYPES ====================
interface RoutineItem {
    id: string;
    title: string;
    titleKo: string;
    description: string;
    descriptionKo: string;
    emoji: string;
    category: 'prep' | 'relax' | 'mind';
}

interface JournalEntry {
    id: string;
    date: string;
    content: string;
    mood: 'great' | 'good' | 'okay' | 'tired' | 'restless';
    sleepGoal?: string;
    bedtime?: string;
    sleepScore?: number;
}

interface SleepStats {
    sleepyNights: number;
    journalEntries: number;
    streak: number;
    bestStreak: number;
    lastDate: string;
    moodCounts: Record<string, number>;
    avgRoutinesCompleted: number;
    totalRoutinesCompleted: number;
}

// ==================== CONSTANTS ====================
const ROUTINE_ITEMS: RoutineItem[] = [
    { id: 'screens', title: 'Put away screens', titleKo: '화면 멀리하기', description: '30 minutes before bed', descriptionKo: '잠자기 30분 전', emoji: '📵', category: 'prep' },
    { id: 'tea', title: 'Warm drink', titleKo: '따뜻한 음료', description: 'Herbal tea or warm milk', descriptionKo: '허브차 또는 따뜻한 우유', emoji: '🍵', category: 'prep' },
    { id: 'skincare', title: 'Night skincare', titleKo: '저녁 스킨케어', description: 'Self-care ritual', descriptionKo: '셀프케어 루틴', emoji: '🧴', category: 'prep' },
    { id: 'pajamas', title: 'Change to pajamas', titleKo: '잠옷 갈아입기', description: 'Comfy sleepwear', descriptionKo: '편안한 잠옷', emoji: '👕', category: 'prep' },
    { id: 'stretch', title: 'Gentle stretching', titleKo: '가벼운 스트레칭', description: 'Relax your body', descriptionKo: '몸을 이완시키세요', emoji: '🧘', category: 'relax' },
    { id: 'breath', title: 'Deep breaths', titleKo: '깊은 호흡', description: '4-7-8 breathing technique', descriptionKo: '4-7-8 호흡법', emoji: '🌬️', category: 'relax' },
    { id: 'music', title: 'Calming music', titleKo: '잔잔한 음악', description: 'Soft melodies', descriptionKo: '부드러운 멜로디', emoji: '🎵', category: 'relax' },
    { id: 'gratitude', title: 'Gratitude moment', titleKo: '감사 시간', description: 'Think of 3 good things today', descriptionKo: '오늘 좋았던 3가지 생각하기', emoji: '💝', category: 'mind' },
    { id: 'read', title: 'Light reading', titleKo: '가벼운 독서', description: 'A few pages of a calming book', descriptionKo: '마음이 편안해지는 책 몇 페이지', emoji: '📖', category: 'mind' },
    { id: 'journal', title: 'Brain dump', titleKo: '생각 비우기', description: 'Write down worries', descriptionKo: '걱정을 적어 내려놓기', emoji: '✏️', category: 'mind' },
];

const MOOD_EMOJIS: Record<string, string> = {
    great: '😴', good: '😊', okay: '😐', tired: '😫', restless: '😰',
};

const MOOD_COLORS: Record<string, string> = {
    great: '#9B59B6', good: '#3498DB', okay: '#F39C12', tired: '#E74C3C', restless: '#7F8C8D',
};

const SOUNDSCAPES = [
    { id: 'none', emoji: '🔇', en: 'None', ko: '없음' },
    { id: 'rain', emoji: '🌧️', en: 'Rain', ko: '비' },
    { id: 'ocean', emoji: '🌊', en: 'Ocean', ko: '파도' },
    { id: 'forest', emoji: '🌲', en: 'Forest', ko: '숲' },
    { id: 'fireplace', emoji: '🔥', en: 'Fireplace', ko: '벽난로' },
    { id: 'whitenoise', emoji: '📻', en: 'White Noise', ko: '백색소음' },
];

const SLEEP_TIPS = {
    en: [
        'Keep your room cool (65-68°F / 18-20°C)',
        'Avoid caffeine after 2pm',
        'Stick to a consistent sleep schedule',
        'Make your bedroom dark and quiet',
        'Exercise regularly, but not before bed',
        'Avoid large meals before bedtime',
    ],
    ko: [
        '실내 온도를 18-20°C로 유지하세요',
        '오후 2시 이후 카페인을 피하세요',
        '일정한 취침 시간을 유지하세요',
        '침실을 어둡고 조용하게 만드세요',
        '규칙적으로 운동하되 잠자기 전은 피하세요',
        '취침 전 과식을 피하세요',
    ],
};

const STORAGE_KEY = 'sleepNestV3';

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        title: 'Sleep Nest',
        back: '← Brookvale',
        goodNight: 'Good Night',
        routine: 'Sleep Routine',
        journal: 'Dream Journal',
        journalPlaceholder: 'Write about your day or set an intention for tomorrow...',
        save: 'Save Entry',
        saved: 'Saved!',
        acornsEarned: '+5 Acorns',
        routineComplete: 'Routine Complete!',
        sleepyNights: 'Nights',
        journalEntries: 'Entries',
        currentStreak: 'Streak',
        motivation: '🌙 Rest well, tomorrow is a new adventure.',
        stats: '📊 Statistics',
        history: '📜 Journal History',
        bestStreak: 'Best Streak',
        moodBreakdown: 'Sleep Mood',
        howFeeling: 'How are you feeling?',
        sleepGoal: 'Sleep Goal',
        sleepGoalPlaceholder: 'e.g., Wake up at 7am...',
        bedtime: 'Bedtime',
        sleepScore: 'Sleep Score',
        soundscape: 'Soundscape',
        weeklyMood: 'This Week',
        sleepTip: '💡 Sleep Tip',
        moods: { great: 'Great', good: 'Good', okay: 'Okay', tired: 'Tired', restless: 'Restless' },
        categories: { prep: '🛁 Preparation', relax: '🧘 Relaxation', mind: '🧠 Mindfulness' },
        viewAll: 'View All',
        noHistory: 'No journal entries yet',
        close: 'Close',
        days: 'days',
    },
    ko: {
        title: '슬립 네스트',
        back: '← 브룩베일',
        goodNight: '좋은 밤 되세요',
        routine: '수면 루틴',
        journal: '꿈 일기',
        journalPlaceholder: '오늘 하루를 기록하거나 내일의 다짐을 적어보세요...',
        save: '저장하기',
        saved: '저장됨!',
        acornsEarned: '+5 도토리',
        routineComplete: '루틴 완료!',
        sleepyNights: '밤',
        journalEntries: '기록',
        currentStreak: '연속',
        motivation: '🌙 푹 쉬세요, 내일은 새로운 모험입니다.',
        stats: '📊 통계',
        history: '📜 일기 기록',
        bestStreak: '최고 연속',
        moodBreakdown: '수면 기분',
        howFeeling: '기분이 어떠신가요?',
        sleepGoal: '수면 목표',
        sleepGoalPlaceholder: '예: 아침 7시에 일어나기...',
        bedtime: '취침 시간',
        sleepScore: '수면 점수',
        soundscape: '배경음',
        weeklyMood: '이번 주',
        sleepTip: '💡 수면 팁',
        moods: { great: '최고', good: '좋음', okay: '보통', tired: '피곤', restless: '불안' },
        categories: { prep: '🛁 준비', relax: '🧘 이완', mind: '🧠 마음챙김' },
        viewAll: '전체 보기',
        noHistory: '아직 일기가 없어요',
        close: '닫기',
        days: '일',
    },
};

// ==================== COMPONENT ====================
export default function SleepNestPage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [completedRoutines, setCompletedRoutines] = useState<Set<string>>(new Set());
    const [journalEntry, setJournalEntry] = useState('');
    const [sleepGoal, setSleepGoal] = useState('');
    const [bedtime, setBedtime] = useState('');
    const [currentMood, setCurrentMood] = useState<JournalEntry['mood']>('good');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [journalHistory, setJournalHistory] = useState<JournalEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const [selectedSound, setSelectedSound] = useState('none');
    const [tipIndex, setTipIndex] = useState(0);
    const [stats, setStats] = useState<SleepStats>({
        sleepyNights: 0, journalEntries: 0, streak: 0, bestStreak: 0,
        lastDate: '', moodCounts: {}, avgRoutinesCompleted: 0, totalRoutinesCompleted: 0,
    });
    const [savedToday, setSavedToday] = useState(false);

    const { balance: totalAcorns, earn, isLoaded } = useAcornStore(language);
    const t = translations[language];

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

                setStats({ ...data, streak });
                setJournalHistory(data.journalHistory || []);

                if (data.todayRoutines?.date === today) {
                    setCompletedRoutines(new Set(data.todayRoutines.completed));
                }
                if (data.todayJournal?.date === today) {
                    setJournalEntry(data.todayJournal.content);
                    setCurrentMood(data.todayJournal.mood || 'good');
                    setSleepGoal(data.todayJournal.sleepGoal || '');
                    setBedtime(data.todayJournal.bedtime || '');
                    setSavedToday(true);
                }
            }
        }
    }, []);

    // Rotate tips
    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % SLEEP_TIPS.en.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    // Save data
    const saveData = useCallback((
        newStats: SleepStats, newHistory: JournalEntry[],
        todayRoutines: { date: string; completed: string[] },
        todayJournal?: { date: string; content: string; mood: string; sleepGoal: string; bedtime: string }
    ) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                ...newStats, journalHistory: newHistory.slice(0, 30), todayRoutines, todayJournal,
            }));
        }
        setStats(newStats);
        setJournalHistory(newHistory);
    }, []);

    // Weekly mood chart
    const weeklyMoodData = useMemo(() => {
        const days = [];
        const dayNames = language === 'ko'
            ? ['일', '월', '화', '수', '목', '금', '토']
            : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const entry = journalHistory.find(e => e.date.startsWith(dateStr));
            days.push({
                label: dayNames[d.getDay()],
                mood: entry?.mood || null,
                isToday: i === 0,
            });
        }
        return days;
    }, [journalHistory, language]);

    // Sleep score
    const calculateSleepScore = useCallback(() => {
        const routineScore = (completedRoutines.size / ROUTINE_ITEMS.length) * 40;
        const moodScore = currentMood === 'great' ? 30 : currentMood === 'good' ? 25 : currentMood === 'okay' ? 15 : currentMood === 'tired' ? 10 : 5;
        const journalScore = journalEntry.trim() ? 15 : 0;
        const goalScore = sleepGoal.trim() ? 15 : 0;
        return Math.round(routineScore + moodScore + journalScore + goalScore);
    }, [completedRoutines.size, currentMood, journalEntry, sleepGoal]);

    // Toggle routine
    const toggleRoutine = useCallback((id: string) => {
        const newCompleted = new Set(completedRoutines);
        const today = new Date().toDateString();

        if (newCompleted.has(id)) {
            newCompleted.delete(id);
        } else {
            newCompleted.add(id);

            if (newCompleted.size === ROUTINE_ITEMS.length) {
                earn(5, language === 'ko' ? '슬립 네스트' : 'Sleep Nest');
                const isNewDay = stats.lastDate !== today;
                const newStreak = isNewDay ? stats.streak + 1 : stats.streak;

                const newStats: SleepStats = {
                    ...stats,
                    sleepyNights: stats.sleepyNights + 1,
                    streak: newStreak,
                    bestStreak: Math.max(stats.bestStreak, newStreak),
                    lastDate: today,
                    totalRoutinesCompleted: stats.totalRoutinesCompleted + ROUTINE_ITEMS.length,
                    avgRoutinesCompleted: ((stats.avgRoutinesCompleted * stats.sleepyNights) + ROUTINE_ITEMS.length) / (stats.sleepyNights + 1),
                };

                saveData(newStats, journalHistory, { date: today, completed: Array.from(newCompleted) });
                setToastMessage(t.routineComplete);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }
        }

        setCompletedRoutines(newCompleted);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...stats, journalHistory,
            todayRoutines: { date: today, completed: Array.from(newCompleted) },
        }));
    }, [completedRoutines, stats, journalHistory, earn, language, t, saveData]);

    // Save journal
    const saveJournal = useCallback(() => {
        if (!journalEntry.trim()) return;
        const today = new Date().toDateString();
        const score = calculateSleepScore();

        const newEntry: JournalEntry = {
            id: Date.now().toString(), date: new Date().toISOString(),
            content: journalEntry, mood: currentMood, sleepGoal, bedtime, sleepScore: score,
        };

        const newHistory = savedToday ? [newEntry, ...journalHistory.slice(1)] : [newEntry, ...journalHistory];
        const newMoodCounts = { ...stats.moodCounts };
        newMoodCounts[currentMood] = (newMoodCounts[currentMood] || 0) + 1;

        const newStats: SleepStats = {
            ...stats,
            journalEntries: savedToday ? stats.journalEntries : stats.journalEntries + 1,
            moodCounts: newMoodCounts, lastDate: today,
        };

        saveData(newStats, newHistory,
            { date: today, completed: Array.from(completedRoutines) },
            { date: today, content: journalEntry, mood: currentMood, sleepGoal, bedtime }
        );
        setSavedToday(true);
        setToastMessage(t.saved);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    }, [journalEntry, currentMood, sleepGoal, bedtime, savedToday, journalHistory, stats, completedRoutines, t, saveData, calculateSleepScore]);

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return language === 'ko'
            ? `${date.getMonth() + 1}월 ${date.getDate()}일`
            : date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    // Group routines by category
    const routinesByCategory = ROUTINE_ITEMS.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, RoutineItem[]>);

    const sleepScore = calculateSleepScore();

    if (!isLoaded) {
        return <div className="sleep-nest-app">Loading...</div>;
    }

    return (
        <div className="sleep-nest-app">
            {/* Toast */}
            {showToast && (
                <div className="session-toast">
                    <span className="toast-icon">😴</span>
                    <div>
                        <div className="toast-text">{toastMessage}</div>
                        {toastMessage === t.routineComplete && <div>{t.acornsEarned}</div>}
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <a href="/" className="back-link">{t.back}</a>
                <h1>😴 {t.title}</h1>
                <div className="header-right">
                    <button
                        className="lang-toggle"
                        onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
                    >
                        {language === 'en' ? '한국어' : 'EN'}
                    </button>
                    <span className="acorn-badge">🌰 {totalAcorns}</span>
                </div>
            </header>

            {/* Sleep Hero */}
            <section className="sleep-section">
                <div className="sleep-moon" />
                <div className="sleep-message">
                    <div className="main-text">{t.goodNight} ✨</div>
                    <div className="sub-text">
                        {completedRoutines.size}/{ROUTINE_ITEMS.length} {t.routine}
                    </div>
                    <div className="progress-ring">
                        <svg viewBox="0 0 36 36">
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3"
                            />
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke="#9B59B6" strokeWidth="3"
                                strokeDasharray={`${(completedRoutines.size / ROUTINE_ITEMS.length) * 100}, 100`}
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Stats Overview */}
            <section className="stats-section">
                <div className="stat-card">
                    <div className="stat-icon">🌙</div>
                    <div className="stat-value">{stats.sleepyNights}</div>
                    <div className="stat-label">{t.sleepyNights}</div>
                </div>
                <div className="stat-card highlight">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-value">{stats.streak}</div>
                    <div className="stat-label">{t.currentStreak}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-value">{stats.journalEntries}</div>
                    <div className="stat-label">{t.journalEntries}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-value">{sleepScore}</div>
                    <div className="stat-label">{t.sleepScore}</div>
                </div>
            </section>

            {/* Weekly Mood Chart */}
            <section className="weekly-mood-section">
                <h3>{t.weeklyMood}</h3>
                <div className="mood-week-row">
                    {weeklyMoodData.map((day, i) => (
                        <div key={i} className={`mood-day ${day.isToday ? 'today' : ''}`}>
                            <div className="mood-dot-wrap">
                                {day.mood ? (
                                    <span className="mood-dot" style={{ backgroundColor: MOOD_COLORS[day.mood] }}>
                                        {MOOD_EMOJIS[day.mood]}
                                    </span>
                                ) : (
                                    <span className="mood-dot empty">-</span>
                                )}
                            </div>
                            <span className="mood-day-label">{day.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Soundscape */}
            <section className="soundscape-section">
                <h3>{t.soundscape}</h3>
                <div className="sound-grid">
                    {SOUNDSCAPES.map(s => (
                        <button
                            key={s.id}
                            className={`sound-btn ${selectedSound === s.id ? 'active' : ''}`}
                            onClick={() => setSelectedSound(s.id)}
                        >
                            <span className="sound-emoji">{s.emoji}</span>
                            <span className="sound-name">{language === 'ko' ? s.ko : s.en}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Routine Section */}
            <section className="routine-section">
                <h2>🌙 {t.routine}</h2>
                {(['prep', 'relax', 'mind'] as const).map(category => (
                    <div key={category} className="routine-category">
                        <h3>{t.categories[category]}</h3>
                        <div className="routine-list">
                            {routinesByCategory[category]?.map(item => (
                                <div
                                    key={item.id}
                                    className={`routine-item ${completedRoutines.has(item.id) ? 'completed' : ''}`}
                                    onClick={() => toggleRoutine(item.id)}
                                >
                                    <div className="item-check">
                                        {completedRoutines.has(item.id) ? '✓' : ''}
                                    </div>
                                    <div className="item-content">
                                        <div className="item-title">
                                            {language === 'ko' ? item.titleKo : item.title}
                                        </div>
                                        <div className="item-desc">
                                            {language === 'ko' ? item.descriptionKo : item.description}
                                        </div>
                                    </div>
                                    <div className="item-emoji">{item.emoji}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            {/* Journal Section */}
            <section className="journal-section">
                <div className="journal-header">
                    <h2>📝 {t.journal}</h2>
                    <button className="history-btn" onClick={() => setShowHistoryModal(true)}>
                        {t.viewAll}
                    </button>
                </div>

                {/* Mood Picker */}
                <div className="mood-picker">
                    <label>{t.howFeeling}</label>
                    <div className="mood-options">
                        {(Object.keys(MOOD_EMOJIS) as JournalEntry['mood'][]).map(mood => (
                            <button
                                key={mood}
                                className={`mood-btn ${currentMood === mood ? 'active' : ''}`}
                                onClick={() => setCurrentMood(mood)}
                                style={{
                                    borderColor: currentMood === mood ? MOOD_COLORS[mood] : 'transparent',
                                    backgroundColor: currentMood === mood ? `${MOOD_COLORS[mood]}20` : undefined,
                                }}
                            >
                                <span>{MOOD_EMOJIS[mood]}</span>
                                <span className="mood-label">{t.moods[mood]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <textarea
                    className="journal-textarea"
                    placeholder={t.journalPlaceholder}
                    value={journalEntry}
                    onChange={(e) => setJournalEntry(e.target.value)}
                />

                {/* Bedtime & Goal */}
                <div className="journal-extras">
                    <div className="extra-field">
                        <label>🕐 {t.bedtime}</label>
                        <input
                            type="time"
                            value={bedtime}
                            onChange={(e) => setBedtime(e.target.value)}
                        />
                    </div>
                    <div className="extra-field">
                        <label>🎯 {t.sleepGoal}</label>
                        <input
                            type="text"
                            placeholder={t.sleepGoalPlaceholder}
                            value={sleepGoal}
                            onChange={(e) => setSleepGoal(e.target.value)}
                        />
                    </div>
                </div>

                <button className="save-btn" onClick={saveJournal}>
                    {savedToday ? t.saved : t.save}
                </button>
            </section>

            {/* Sleep Tip */}
            <section className="sleep-tip-section">
                <p className="tip-label">{t.sleepTip}</p>
                <p className="tip-text" key={tipIndex}>
                    {language === 'ko' ? SLEEP_TIPS.ko[tipIndex] : SLEEP_TIPS.en[tipIndex]}
                </p>
            </section>

            {/* Motivation */}
            <section className="motivation-section">
                <p>{t.motivation}</p>
            </section>

            {/* History Modal */}
            {showHistoryModal && (
                <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{t.history}</h2>
                        {journalHistory.length === 0 ? (
                            <p className="empty-text">{t.noHistory}</p>
                        ) : (
                            <div className="history-list">
                                {journalHistory.map(entry => (
                                    <div key={entry.id} className="history-item" onClick={() => setSelectedEntry(entry)}>
                                        <span className="hist-emoji">{MOOD_EMOJIS[entry.mood]}</span>
                                        <div className="hist-content">
                                            <span className="hist-date">{formatDate(entry.date)}</span>
                                            <span className="hist-preview">{entry.content.slice(0, 50)}...</span>
                                        </div>
                                        {entry.sleepScore && (
                                            <span className="hist-score">⭐{entry.sleepScore}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <button className="close-btn" onClick={() => setShowHistoryModal(false)}>×</button>
                    </div>
                </div>
            )}

            {/* Entry Detail Modal */}
            {selectedEntry && (
                <div className="modal-overlay" onClick={() => setSelectedEntry(null)}>
                    <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="detail-header">
                            <span className="detail-emoji">{MOOD_EMOJIS[selectedEntry.mood]}</span>
                            <span className="detail-date">{formatDate(selectedEntry.date)}</span>
                        </div>
                        <div className="detail-mood" style={{ color: MOOD_COLORS[selectedEntry.mood] }}>
                            {t.moods[selectedEntry.mood]}
                        </div>
                        {selectedEntry.sleepScore && (
                            <div className="detail-score">⭐ {selectedEntry.sleepScore}/100</div>
                        )}
                        <p className="detail-content">{selectedEntry.content}</p>
                        {selectedEntry.bedtime && (
                            <div className="detail-bedtime">🕐 {selectedEntry.bedtime}</div>
                        )}
                        {selectedEntry.sleepGoal && (
                            <div className="detail-goal">
                                <span className="goal-label">🎯 {t.sleepGoal}:</span>
                                <span className="goal-text">{selectedEntry.sleepGoal}</span>
                            </div>
                        )}
                        <button className="close-btn" onClick={() => setSelectedEntry(null)}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
}
