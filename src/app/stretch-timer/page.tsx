'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import { BackLink } from '@/components/BackLink';
import './stretch-timer.css';

// ==================== TYPES ====================
interface StretchExercise {
    id: string;
    nameEn: string;
    nameKo: string;
    duration: number;
    emoji: string;
    instructionEn: string;
    instructionKo: string;
    bodyPart: 'neck' | 'shoulders' | 'arms' | 'back' | 'core' | 'legs' | 'full';
}

interface StretchRoutine {
    id: string;
    nameEn: string;
    nameKo: string;
    duration: number;
    exercises: StretchExercise[];
    acornReward: number;
    emoji: string;
    color: string;
}

interface StretchStats {
    totalSessions: number;
    totalMinutes: number;
    streak: number;
    bestStreak: number;
    lastDate: string;
    weeklyHistory: Record<string, number>; // date -> sessions count
    favoriteRoutine: string;
    bodyPartsStretched: Record<string, number>;
}

interface DailyGoal {
    target: number; // sessions per day
    completed: number;
}

// ==================== EXERCISES ====================
const EXERCISES: StretchExercise[] = [
    { id: 'neck-roll', nameEn: 'Neck Roll', nameKo: '목 돌리기', duration: 20, emoji: '🙆', instructionEn: 'Slowly roll your head in circles', instructionKo: '천천히 머리를 돌려주세요', bodyPart: 'neck' },
    { id: 'shoulder-shrug', nameEn: 'Shoulder Shrug', nameKo: '어깨 으쓱', duration: 15, emoji: '💪', instructionEn: 'Raise shoulders to ears, hold, release', instructionKo: '어깨를 귀까지 올렸다 내려주세요', bodyPart: 'shoulders' },
    { id: 'arm-stretch', nameEn: 'Arm Stretch', nameKo: '팔 스트레칭', duration: 20, emoji: '🙌', instructionEn: 'Stretch arms overhead and hold', instructionKo: '팔을 위로 뻗어 스트레칭', bodyPart: 'arms' },
    { id: 'side-bend', nameEn: 'Side Bend', nameKo: '옆구리 늘리기', duration: 20, emoji: '🌙', instructionEn: 'Lean to each side slowly', instructionKo: '양 옆으로 천천히 기울이기', bodyPart: 'core' },
    { id: 'wrist-rotate', nameEn: 'Wrist Rotation', nameKo: '손목 돌리기', duration: 15, emoji: '🤲', instructionEn: 'Rotate wrists in circles', instructionKo: '손목을 원을 그리며 돌려주세요', bodyPart: 'arms' },
    { id: 'back-twist', nameEn: 'Back Twist', nameKo: '등 비틀기', duration: 25, emoji: '🔄', instructionEn: 'Twist your torso left and right', instructionKo: '상체를 좌우로 비틀어주세요', bodyPart: 'back' },
    { id: 'forward-bend', nameEn: 'Forward Bend', nameKo: '앞으로 숙이기', duration: 20, emoji: '🙇', instructionEn: 'Bend forward and touch your toes', instructionKo: '앞으로 숙여 발끝 터치', bodyPart: 'legs' },
    { id: 'hip-circles', nameEn: 'Hip Circles', nameKo: '골반 돌리기', duration: 20, emoji: '💃', instructionEn: 'Make circles with your hips', instructionKo: '골반으로 원을 그려주세요', bodyPart: 'core' },
    { id: 'cat-cow', nameEn: 'Cat-Cow Stretch', nameKo: '고양이-소 자세', duration: 30, emoji: '🐱', instructionEn: 'Arch and round your back', instructionKo: '등을 둥글게, 오목하게 반복', bodyPart: 'back' },
    { id: 'child-pose', nameEn: "Child's Pose", nameKo: '아이 자세', duration: 30, emoji: '🧒', instructionEn: 'Kneel and stretch forward', instructionKo: '무릎 꿇고 앞으로 뻗기', bodyPart: 'full' },
    { id: 'deep-breath', nameEn: 'Deep Breathing', nameKo: '깊은 호흡', duration: 20, emoji: '🌬️', instructionEn: 'Breathe deeply in and out', instructionKo: '깊게 들이쉬고 내쉬기', bodyPart: 'full' },
    { id: 'quad-stretch', nameEn: 'Quad Stretch', nameKo: '허벅지 스트레칭', duration: 20, emoji: '🦵', instructionEn: 'Hold your foot behind you', instructionKo: '뒤에서 발을 잡아주세요', bodyPart: 'legs' },
    { id: 'calf-raise', nameEn: 'Calf Raise', nameKo: '종아리 들기', duration: 15, emoji: '🦶', instructionEn: 'Rise on your toes and lower', instructionKo: '발끝으로 올라갔다 내려오기', bodyPart: 'legs' },
];

// ==================== ROUTINES ====================
const ROUTINES: StretchRoutine[] = [
    {
        id: 'quick',
        nameEn: 'Quick Break',
        nameKo: '빠른 휴식',
        duration: 1,
        acornReward: 3,
        emoji: '⚡',
        color: '#FFC107',
        exercises: [EXERCISES[0], EXERCISES[1], EXERCISES[4]],
    },
    {
        id: 'desk',
        nameEn: 'Desk Stretch',
        nameKo: '책상 스트레칭',
        duration: 2,
        acornReward: 5,
        emoji: '💻',
        color: '#2196F3',
        exercises: [EXERCISES[0], EXERCISES[1], EXERCISES[2], EXERCISES[3], EXERCISES[4], EXERCISES[10]],
    },
    {
        id: 'full',
        nameEn: 'Full Body',
        nameKo: '전신 스트레칭',
        duration: 5,
        acornReward: 10,
        emoji: '🧘',
        color: '#9C27B0',
        exercises: EXERCISES.slice(0, 11),
    },
    {
        id: 'morning',
        nameEn: 'Morning Wake Up',
        nameKo: '아침 기상',
        duration: 3,
        acornReward: 7,
        emoji: '🌅',
        color: '#FF9800',
        exercises: [EXERCISES[2], EXERCISES[3], EXERCISES[5], EXERCISES[6], EXERCISES[7], EXERCISES[10]],
    },
    {
        id: 'legs',
        nameEn: 'Leg Day',
        nameKo: '다리 스트레칭',
        duration: 3,
        acornReward: 6,
        emoji: '🦵',
        color: '#4CAF50',
        exercises: [EXERCISES[6], EXERCISES[7], EXERCISES[11], EXERCISES[12], EXERCISES[9], EXERCISES[10]],
    },
    {
        id: 'back',
        nameEn: 'Back Relief',
        nameKo: '허리 풀기',
        duration: 3,
        acornReward: 6,
        emoji: '🔄',
        color: '#E91E63',
        exercises: [EXERCISES[5], EXERCISES[8], EXERCISES[3], EXERCISES[9], EXERCISES[10]],
    },
];

// ==================== BODY PARTS MAP ====================
const BODY_PARTS = {
    neck: { labelEn: 'Neck', labelKo: '목', emoji: '🙆', color: '#FF5722' },
    shoulders: { labelEn: 'Shoulders', labelKo: '어깨', emoji: '💪', color: '#FF9800' },
    arms: { labelEn: 'Arms', labelKo: '팔', emoji: '🤲', color: '#FFC107' },
    back: { labelEn: 'Back', labelKo: '등', emoji: '🔄', color: '#4CAF50' },
    core: { labelEn: 'Core', labelKo: '코어', emoji: '💃', color: '#2196F3' },
    legs: { labelEn: 'Legs', labelKo: '다리', emoji: '🦵', color: '#9C27B0' },
    full: { labelEn: 'Full Body', labelKo: '전신', emoji: '🧘', color: '#E91E63' },
};

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        title: 'Stretch Timer',
        back: '← Brookvale',
        selectRoutine: 'Select a Routine',
        minutes: 'min',
        start: 'Start',
        pause: 'Pause',
        resume: 'Resume',
        skip: 'Skip',
        quit: 'Quit',
        complete: '🎉 Routine Complete!',
        acornsEarned: 'Acorns earned',
        nextUp: 'Next up',
        getReady: 'Get Ready!',
        stats: '📊 Your Progress',
        totalSessions: 'Sessions',
        totalMinutes: 'Minutes',
        streak: 'Streak',
        bestStreak: 'Best Streak',
        close: 'Close',
        motivation: '🧘 Take a moment to stretch and relax',
        exercisesCount: 'exercises',
        bodyMap: 'Body Focus',
        weekOverview: 'This Week',
        dailyGoal: 'Daily Goal',
        goalComplete: 'Goal reached!',
        sessionsToday: 'sessions today',
        bodyPartStats: 'Body Parts Stretched',
        times: 'times',
        reminder: '⏰ Time for a stretch break!',
        noData: 'No data yet',
        recentRoutines: 'Recent Activity',
        favoriteRoutine: 'Favorite',
        tips: [
            '🧘 Regular stretching improves flexibility',
            '💡 Try stretching every 2 hours',
            '🌟 Even 1 minute helps your body!',
            '🔥 Keep your streak going!',
            '💪 Your body will thank you',
        ],
    },
    ko: {
        title: '스트레칭 타이머',
        back: '← 브룩베일',
        selectRoutine: '루틴을 선택하세요',
        minutes: '분',
        start: '시작',
        pause: '일시정지',
        resume: '계속',
        skip: '건너뛰기',
        quit: '종료',
        complete: '🎉 루틴 완료!',
        acornsEarned: '도토리 획득',
        nextUp: '다음 동작',
        getReady: '준비하세요!',
        stats: '📊 나의 진행상황',
        totalSessions: '세션',
        totalMinutes: '총 시간(분)',
        streak: '연속',
        bestStreak: '최고 연속',
        close: '닫기',
        motivation: '🧘 잠시 멈추고 스트레칭으로 몸을 풀어보세요',
        exercisesCount: '개 동작',
        bodyMap: '부위별 포커스',
        weekOverview: '이번 주',
        dailyGoal: '일일 목표',
        goalComplete: '목표 달성!',
        sessionsToday: '세션 오늘',
        bodyPartStats: '스트레칭한 부위',
        times: '회',
        reminder: '⏰ 스트레칭 시간이에요!',
        noData: '아직 데이터가 없어요',
        recentRoutines: '최근 활동',
        favoriteRoutine: '즐겨찾기',
        tips: [
            '🧘 꾸준한 스트레칭은 유연성을 높여요',
            '💡 2시간마다 스트레칭을 해보세요',
            '🌟 1분만이라도 몸에 도움이 돼요!',
            '🔥 연속 기록을 이어가세요!',
            '💪 당신의 몸이 고마워할 거예요',
        ],
    },
};

const STORAGE_KEY = 'stretchTimerV2';

export default function StretchTimerPage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [selectedRoutine, setSelectedRoutine] = useState<StretchRoutine | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [showComplete, setShowComplete] = useState(false);
    const [stats, setStats] = useState<StretchStats>({
        totalSessions: 0,
        totalMinutes: 0,
        streak: 0,
        bestStreak: 0,
        lastDate: '',
        weeklyHistory: {},
        favoriteRoutine: '',
        bodyPartsStretched: {},
    });
    const [dailyGoal] = useState<DailyGoal>({ target: 3, completed: 0 });
    const [tipIndex, setTipIndex] = useState(0);
    const [showBodyMap, setShowBodyMap] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const { balance: totalAcorns, earn: earnAcorns, isLoaded } = useAcornStore(language);
    const t = translations[language];

    // Load settings
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLang = localStorage.getItem('brookvale-language') as Language;
            if (savedLang) setLanguage(savedLang);

            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                setStats(prev => ({ ...prev, ...data.stats }));
            }
        }
    }, []);

    // Rotate tips
    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % t.tips.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [t.tips.length]);

    // Save stats
    const saveStats = useCallback((newStats: StretchStats) => {
        setStats(newStats);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats: newStats }));
    }, []);

    // Timer logic
    useEffect(() => {
        if (isRunning && !isPaused && timeRemaining > 0) {
            timerRef.current = setTimeout(() => {
                setTimeRemaining(prev => prev - 1);
            }, 1000);
        } else if (isRunning && !isPaused && timeRemaining === 0 && selectedRoutine) {
            if (currentExerciseIndex < selectedRoutine.exercises.length - 1) {
                setCurrentExerciseIndex(prev => prev + 1);
                setTimeRemaining(selectedRoutine.exercises[currentExerciseIndex + 1].duration);
            } else {
                completeRoutine();
            }
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isRunning, isPaused, timeRemaining, currentExerciseIndex, selectedRoutine]);

    // Start routine
    const startRoutine = (routine: StretchRoutine) => {
        setSelectedRoutine(routine);
        setCurrentExerciseIndex(0);
        setTimeRemaining(routine.exercises[0].duration);
        setIsRunning(true);
        setIsPaused(false);
        setShowComplete(false);
    };

    // Complete routine
    const completeRoutine = () => {
        if (!selectedRoutine) return;

        setIsRunning(false);
        setShowComplete(true);

        const today = new Date().toDateString();
        const isNewDay = stats.lastDate !== today;
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const isConsecutive = stats.lastDate === yesterdayDate.toDateString() || stats.lastDate === today;
        const newStreak = isNewDay ? (isConsecutive ? stats.streak + 1 : 1) : stats.streak;

        // Update body parts stretched
        const newBodyParts = { ...stats.bodyPartsStretched };
        selectedRoutine.exercises.forEach(ex => {
            newBodyParts[ex.bodyPart] = (newBodyParts[ex.bodyPart] || 0) + 1;
        });

        // Update weekly history
        const todayKey = new Date().toISOString().split('T')[0];
        const newWeeklyHistory = { ...stats.weeklyHistory };
        newWeeklyHistory[todayKey] = (newWeeklyHistory[todayKey] || 0) + 1;

        const newStats: StretchStats = {
            totalSessions: stats.totalSessions + 1,
            totalMinutes: stats.totalMinutes + selectedRoutine.duration,
            streak: newStreak,
            bestStreak: Math.max(stats.bestStreak, newStreak),
            lastDate: today,
            weeklyHistory: newWeeklyHistory,
            favoriteRoutine: selectedRoutine.id,
            bodyPartsStretched: newBodyParts,
        };
        saveStats(newStats);

        earnAcorns(selectedRoutine.acornReward, 'Stretch Timer');
    };

    // Skip exercise
    const skipExercise = () => {
        if (!selectedRoutine) return;

        if (currentExerciseIndex < selectedRoutine.exercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
            setTimeRemaining(selectedRoutine.exercises[currentExerciseIndex + 1].duration);
        } else {
            completeRoutine();
        }
    };

    // Quit routine
    const quitRoutine = () => {
        setIsRunning(false);
        setSelectedRoutine(null);
        setShowComplete(false);
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    // Back to selection
    const backToSelection = () => {
        setSelectedRoutine(null);
        setShowComplete(false);
    };

    // Current exercise
    const currentExercise = selectedRoutine?.exercises[currentExerciseIndex];
    const nextExercise = selectedRoutine?.exercises[currentExerciseIndex + 1];

    // Progress
    const exerciseProgress = currentExercise
        ? ((currentExercise.duration - timeRemaining) / currentExercise.duration) * 100
        : 0;
    const routineProgress = selectedRoutine
        ? ((currentExerciseIndex + (1 - timeRemaining / (currentExercise?.duration || 1))) / selectedRoutine.exercises.length) * 100
        : 0;

    // Weekly data
    const weekData = useMemo(() => {
        const days = [];
        const dayNames = language === 'ko'
            ? ['월', '화', '수', '목', '금', '토', '일']
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const dayOfWeek = d.getDay();
            const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            days.push({
                label: dayNames[dayIndex],
                count: stats.weeklyHistory[key] || 0,
                isToday: i === 0,
            });
        }
        return days;
    }, [stats.weeklyHistory, language]);

    // Today's sessions
    const todaySessions = useMemo(() => {
        const todayKey = new Date().toISOString().split('T')[0];
        return stats.weeklyHistory[todayKey] || 0;
    }, [stats.weeklyHistory]);

    // Body part stats (sorted)
    const bodyPartData = useMemo(() => {
        return Object.entries(stats.bodyPartsStretched)
            .map(([key, count]) => ({
                part: key as keyof typeof BODY_PARTS,
                count,
                ...BODY_PARTS[key as keyof typeof BODY_PARTS],
            }))
            .sort((a, b) => b.count - a.count);
    }, [stats.bodyPartsStretched]);

    const maxBodyPartCount = bodyPartData.length > 0
        ? Math.max(...bodyPartData.map(d => d.count))
        : 1;

    if (!isLoaded) {
        return <div className="stretch-timer-app">Loading...</div>;
    }

    return (
        <div className="stretch-timer-app">
            {/* Header */}
            <header className="app-header">
                <BackLink>{t.back}</BackLink>
                <h1>🧘 {t.title}</h1>
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

            {/* Routine Selection */}
            {!selectedRoutine && !showComplete && (
                <>
                    {/* Stats Overview */}
                    <section className="stats-overview">
                        <div className="so-grid">
                            <div className="so-stat">
                                <span className="so-icon">🧘</span>
                                <span className="so-value">{stats.totalSessions}</span>
                                <span className="so-label">{t.totalSessions}</span>
                            </div>
                            <div className="so-stat">
                                <span className="so-icon">⏱️</span>
                                <span className="so-value">{stats.totalMinutes}</span>
                                <span className="so-label">{t.totalMinutes}</span>
                            </div>
                            <div className="so-stat highlight">
                                <span className="so-icon">🔥</span>
                                <span className="so-value">{stats.streak}</span>
                                <span className="so-label">{t.streak}</span>
                            </div>
                            <div className="so-stat">
                                <span className="so-icon">🏆</span>
                                <span className="so-value">{stats.bestStreak}</span>
                                <span className="so-label">{t.bestStreak}</span>
                            </div>
                        </div>
                    </section>

                    {/* Daily Goal */}
                    <section className="daily-goal-section">
                        <div className="dg-header">
                            <h3>{t.dailyGoal}</h3>
                            <span className="dg-count">
                                {todaySessions}/{dailyGoal.target} {t.sessionsToday}
                            </span>
                        </div>
                        <div className="dg-bar">
                            <div
                                className="dg-fill"
                                style={{ width: `${Math.min(100, (todaySessions / dailyGoal.target) * 100)}%` }}
                            />
                        </div>
                        {todaySessions >= dailyGoal.target && (
                            <span className="dg-complete">✅ {t.goalComplete}</span>
                        )}
                    </section>

                    {/* Weekly Overview */}
                    <section className="week-overview">
                        <h3>{t.weekOverview}</h3>
                        <div className="week-bars">
                            {weekData.map((day, i) => (
                                <div key={i} className={`week-day ${day.isToday ? 'today' : ''}`}>
                                    <div className="wd-bar-container">
                                        <div
                                            className="wd-bar"
                                            style={{ height: `${day.count > 0 ? Math.max(15, (day.count / 5) * 100) : 0}%` }}
                                        />
                                    </div>
                                    <span className="wd-count">{day.count > 0 ? day.count : ''}</span>
                                    <span className="wd-label">{day.label}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Body Map Toggle */}
                    <section className="body-map-section">
                        <button
                            className="body-map-toggle"
                            onClick={() => setShowBodyMap(!showBodyMap)}
                        >
                            {showBodyMap ? '▲' : '▼'} {t.bodyPartStats}
                        </button>

                        {showBodyMap && (
                            <div className="body-map-content">
                                {bodyPartData.length === 0 ? (
                                    <p className="no-data">{t.noData}</p>
                                ) : (
                                    bodyPartData.map(bp => (
                                        <div key={bp.part} className="bp-item">
                                            <span className="bp-emoji">{bp.emoji}</span>
                                            <span className="bp-name">
                                                {language === 'ko' ? bp.labelKo : bp.labelEn}
                                            </span>
                                            <div className="bp-bar">
                                                <div
                                                    className="bp-fill"
                                                    style={{
                                                        width: `${(bp.count / maxBodyPartCount) * 100}%`,
                                                        backgroundColor: bp.color,
                                                    }}
                                                />
                                            </div>
                                            <span className="bp-count">{bp.count} {t.times}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </section>

                    {/* Routine Selection */}
                    <section className="routine-selection">
                        <h2>{t.selectRoutine}</h2>
                        <div className="routine-grid">
                            {ROUTINES.map(routine => (
                                <button
                                    key={routine.id}
                                    className="routine-card"
                                    onClick={() => startRoutine(routine)}
                                    style={{ '--routine-color': routine.color } as React.CSSProperties}
                                >
                                    <div className="routine-header">
                                        <span className="routine-emoji">{routine.emoji}</span>
                                        <span className="routine-reward">🌰 +{routine.acornReward}</span>
                                    </div>
                                    <h3>{language === 'en' ? routine.nameEn : routine.nameKo}</h3>
                                    <div className="routine-meta">
                                        <span className="routine-duration">{routine.duration} {t.minutes}</span>
                                        <span className="routine-exercises-count">
                                            {routine.exercises.length} {t.exercisesCount}
                                        </span>
                                    </div>
                                    <div className="routine-body-parts">
                                        {[...new Set(routine.exercises.map(e => e.bodyPart))].map(part => (
                                            <span key={part} className="body-tag" style={{ backgroundColor: BODY_PARTS[part].color }}>
                                                {BODY_PARTS[part].emoji}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Motivation Tip */}
                    <section className="motivation">
                        <p>{t.tips[tipIndex]}</p>
                    </section>
                </>
            )}

            {/* Active Exercise */}
            {selectedRoutine && isRunning && currentExercise && (
                <section className="active-exercise">
                    {/* Routine Progress */}
                    <div className="routine-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${routineProgress}%` }}
                            />
                        </div>
                        <span className="progress-text">
                            {currentExerciseIndex + 1} / {selectedRoutine.exercises.length}
                        </span>
                    </div>

                    {/* Exercise Display */}
                    <div className="exercise-display">
                        <div className="exercise-emoji">{currentExercise.emoji}</div>
                        <h2 className="exercise-name">
                            {language === 'en' ? currentExercise.nameEn : currentExercise.nameKo}
                        </h2>
                        <p className="exercise-instruction">
                            {language === 'en' ? currentExercise.instructionEn : currentExercise.instructionKo}
                        </p>
                        <span className="exercise-body-part" style={{ backgroundColor: BODY_PARTS[currentExercise.bodyPart].color }}>
                            {BODY_PARTS[currentExercise.bodyPart].emoji}{' '}
                            {language === 'ko'
                                ? BODY_PARTS[currentExercise.bodyPart].labelKo
                                : BODY_PARTS[currentExercise.bodyPart].labelEn
                            }
                        </span>
                    </div>

                    {/* Timer Circle */}
                    <div className="timer-circle">
                        <svg viewBox="0 0 100 100">
                            <circle className="timer-bg" cx="50" cy="50" r="45" />
                            <circle
                                className="timer-fill"
                                cx="50" cy="50" r="45"
                                style={{
                                    strokeDashoffset: 283 - (283 * exerciseProgress / 100)
                                }}
                            />
                        </svg>
                        <div className="timer-text">{timeRemaining}</div>
                    </div>

                    {/* Next Up */}
                    {nextExercise && (
                        <div className="next-up">
                            <span className="next-label">{t.nextUp}:</span>
                            <span className="next-exercise">
                                {nextExercise.emoji} {language === 'en' ? nextExercise.nameEn : nextExercise.nameKo}
                            </span>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="exercise-controls">
                        <button className="control-btn secondary" onClick={quitRoutine}>
                            {t.quit}
                        </button>
                        <button
                            className="control-btn primary"
                            onClick={() => setIsPaused(!isPaused)}
                        >
                            {isPaused ? t.resume : t.pause}
                        </button>
                        <button className="control-btn secondary" onClick={skipExercise}>
                            {t.skip}
                        </button>
                    </div>
                </section>
            )}

            {/* Complete Screen */}
            {showComplete && selectedRoutine && (
                <section className="complete-screen">
                    <div className="complete-content">
                        <div className="complete-emoji">🎉</div>
                        <h2>{t.complete}</h2>
                        <div className="complete-reward">
                            <span className="reward-icon">🌰</span>
                            <span className="reward-text">+{selectedRoutine.acornReward}</span>
                            <span className="reward-label">{t.acornsEarned}</span>
                        </div>

                        {/* Body parts exercised */}
                        <div className="complete-body-parts">
                            {[...new Set(selectedRoutine.exercises.map(e => e.bodyPart))].map(part => (
                                <span key={part} className="complete-bp" style={{ borderColor: BODY_PARTS[part].color }}>
                                    {BODY_PARTS[part].emoji} {language === 'ko' ? BODY_PARTS[part].labelKo : BODY_PARTS[part].labelEn}
                                </span>
                            ))}
                        </div>

                        <div className="complete-stats">
                            <div className="cs-item">
                                <span className="cs-label">{t.streak}</span>
                                <span className="cs-value">🔥 {stats.streak}</span>
                            </div>
                            <div className="cs-item">
                                <span className="cs-label">{t.totalSessions}</span>
                                <span className="cs-value">🧘 {stats.totalSessions}</span>
                            </div>
                        </div>

                        <button className="back-btn" onClick={backToSelection}>
                            {t.selectRoutine}
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}
