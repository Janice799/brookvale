'use client';

import { useState, useEffect, useCallback } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import './tiny-wins.css';

// ==================== TYPES ====================
interface Habit {
    id: string;
    text: string;
    emoji: string;
    category: string;
    streak: number;
    bestStreak: number;
    completedToday: boolean;
    lastCompleted?: string;
    createdAt: string;
    completionHistory: string[]; // Array of date strings
}

interface WeeklyStats {
    totalCompleted: number;
    perfectDays: number; // Days where all habits were completed
    avgCompletion: number; // Average completion rate
}

// ==================== CONSTANTS ====================
interface TreeStage {
    emoji: string;
    nameEn: string;
    nameKo: string;
    tasksRequired: number;
}

const TREE_STAGES: TreeStage[] = [
    { emoji: '🌱', nameEn: 'Seed', nameKo: '씨앗', tasksRequired: 0 },
    { emoji: '🌿', nameEn: 'Sprout', nameKo: '새싹', tasksRequired: 3 },
    { emoji: '🪴', nameEn: 'Seedling', nameKo: '모종', tasksRequired: 7 },
    { emoji: '🌳', nameEn: 'Tree', nameKo: '나무', tasksRequired: 14 },
    { emoji: '🌲', nameEn: 'Big Tree', nameKo: '큰 나무', tasksRequired: 30 },
    { emoji: '🎄', nameEn: 'Golden Tree', nameKo: '황금 나무', tasksRequired: 60 },
    { emoji: '🏔️', nameEn: 'Forest', nameKo: '숲', tasksRequired: 100 },
    { emoji: '🌍', nameEn: 'World Tree', nameKo: '세계수', tasksRequired: 200 },
];

const CATEGORIES = [
    { id: 'health', emoji: '💪', nameEn: 'Health', nameKo: '건강' },
    { id: 'learning', emoji: '📚', nameEn: 'Learning', nameKo: '학습' },
    { id: 'mindfulness', emoji: '🧘', nameEn: 'Mindfulness', nameKo: '마음챙김' },
    { id: 'productivity', emoji: '⚡', nameEn: 'Productivity', nameKo: '생산성' },
    { id: 'social', emoji: '💬', nameEn: 'Social', nameKo: '사회' },
    { id: 'creativity', emoji: '🎨', nameEn: 'Creativity', nameKo: '창의성' },
    { id: 'other', emoji: '✨', nameEn: 'Other', nameKo: '기타' },
];

const HABIT_EMOJIS = ['🏃', '📚', '💧', '🧘', '✍️', '🎨', '🎵', '💪', '🌅', '💤', '🥗', '📱', '🧠', '🌻', '🍎', '☀️'];

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        title: 'Tiny Wins Garden',
        back: '← Brookvale',
        celebration: 'Tiny Win!',
        totalCompleted: 'Total Done',
        currentStreak: 'Best Streak',
        todayProgress: 'Today',
        untilNext: 'until',
        remaining: 'habits left',
        addHabit: 'Add a tiny habit...',
        add: '+ Add',
        habits: 'My Habits',
        noHabits: 'Start by adding your first habit! 🌱',
        completed: 'Done Today',
        days: 'days',
        streak: 'streak',
        motivation: '💚 Small habits grow into a big forest',
        questComplete: 'Quest Complete!',
        acornsEarned: '+5 Acorns',
        plantHabit: 'Plant a Habit Seed',
        habitAdded: 'New habit planted!',
        // New translations
        stats: '📊 Weekly Report',
        settings: '⚙️',
        category: 'Category',
        allCategories: 'All',
        weeklyStats: 'This Week',
        completedHabits: 'Completed',
        perfectDays: 'Perfect Days',
        avgRate: 'Avg Rate',
        weeklyChart: 'Weekly Progress',
        reminder: '🔔 Reminder',
        reminderOn: 'On',
        reminderOff: 'Off',
        close: 'Close',
        edit: 'Edit',
        save: 'Save',
        cancel: 'Cancel',
        habitDetails: 'Habit Details',
        bestStreakLabel: 'Best Streak',
        currentStreakLabel: 'Current',
        created: 'Created',
        completions: 'Total Completions',
        streakBonus: '🔥 Streak Bonus!',
        bonusAcorns: '+3 Bonus Acorns',
        allDone: '🎉 All habits done today!',
        dailyGoal: 'Daily Goal',
        filterBy: 'Filter by',
    },
    ko: {
        title: '타이니 윈즈 가든',
        back: '← 브룩베일',
        celebration: '작은 승리!',
        totalCompleted: '총 완료',
        currentStreak: '최고 연속',
        todayProgress: '오늘',
        untilNext: '까지',
        remaining: '개 남음',
        addHabit: '작은 습관을 적어보세요...',
        add: '+ 추가',
        habits: '나의 습관',
        noHabits: '첫 번째 습관을 추가해보세요! 🌱',
        completed: '오늘 완료',
        days: '일',
        streak: '연속',
        motivation: '💚 작은 습관이 모여 큰 숲이 됩니다',
        questComplete: '퀘스트 완료!',
        acornsEarned: '+5 도토리',
        plantHabit: '습관 씨앗 심기',
        habitAdded: '새 습관이 심어졌어요!',
        // New translations
        stats: '📊 주간 리포트',
        settings: '⚙️',
        category: '카테고리',
        allCategories: '전체',
        weeklyStats: '이번 주',
        completedHabits: '완료',
        perfectDays: '완벽한 날',
        avgRate: '평균 달성률',
        weeklyChart: '주간 진행률',
        reminder: '🔔 알림',
        reminderOn: '켜기',
        reminderOff: '끄기',
        close: '닫기',
        edit: '수정',
        save: '저장',
        cancel: '취소',
        habitDetails: '습관 상세',
        bestStreakLabel: '최고 연속',
        currentStreakLabel: '현재',
        created: '생성일',
        completions: '총 완료 횟수',
        streakBonus: '🔥 연속 보너스!',
        bonusAcorns: '+3 보너스 도토리',
        allDone: '🎉 오늘 모든 습관 완료!',
        dailyGoal: '일일 목표',
        filterBy: '필터',
    },
};

// ==================== STORAGE KEYS ====================
const STORAGE_KEY = 'tinyWinsV3';

export default function TinyWinsPage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [newHabit, setNewHabit] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('🌱');
    const [selectedCategory, setSelectedCategory] = useState('other');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [totalCompleted, setTotalCompleted] = useState(0);
    const [showCelebration, setShowCelebration] = useState(false);
    const [showQuestReward, setShowQuestReward] = useState(false);
    const [showStreakBonus, setShowStreakBonus] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showHabitDetail, setShowHabitDetail] = useState<Habit | null>(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({ totalCompleted: 0, perfectDays: 0, avgCompletion: 0 });

    // Use global acorn system
    const { balance: totalAcorns, earn: earnAcorns } = useAcornStore(language);

    const t = translations[language];

    // Load from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            const savedLang = localStorage.getItem('brookvale-language') as Language;

            if (savedLang) setLanguage(savedLang);

            if (saved) {
                const data = JSON.parse(saved);
                setHabits(data.habits || []);
                setTotalCompleted(data.totalCompleted || 0);
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, totalCompleted }));
        }
    }, [habits, totalCompleted]);

    // Reset daily completions at midnight
    useEffect(() => {
        const checkDate = () => {
            const today = new Date().toDateString();
            const lastCheck = localStorage.getItem('tinyWinsLastCheck');
            if (lastCheck !== today) {
                setHabits(prev => prev.map(h => {
                    // Check if streak should be reset (missed yesterday)
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const wasCompletedYesterday = h.lastCompleted === yesterday.toDateString();

                    return {
                        ...h,
                        completedToday: false,
                        streak: wasCompletedYesterday ? h.streak : 0, // Reset streak if missed
                    };
                }));
                localStorage.setItem('tinyWinsLastCheck', today);
            }
        };
        checkDate();
    }, []);

    // Calculate weekly stats
    const calculateWeeklyStats = useCallback(() => {
        const today = new Date();
        const weekDates = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (6 - i));
            return date.toDateString();
        });

        let totalWeekCompletions = 0;
        let perfectDays = 0;

        weekDates.forEach(date => {
            const completedOnDate = habits.filter(h =>
                h.completionHistory?.includes(date)
            ).length;
            totalWeekCompletions += completedOnDate;

            if (completedOnDate === habits.length && habits.length > 0) {
                perfectDays++;
            }
        });

        const avgCompletion = habits.length > 0
            ? Math.round((totalWeekCompletions / (habits.length * 7)) * 100)
            : 0;

        setWeeklyStats({
            totalCompleted: totalWeekCompletions,
            perfectDays,
            avgCompletion,
        });
    }, [habits]);

    useEffect(() => {
        calculateWeeklyStats();
    }, [calculateWeeklyStats]);

    // Get current tree stage
    const getCurrentTree = (): TreeStage => {
        for (let i = TREE_STAGES.length - 1; i >= 0; i--) {
            if (totalCompleted >= TREE_STAGES[i].tasksRequired) {
                return TREE_STAGES[i];
            }
        }
        return TREE_STAGES[0];
    };

    // Get next tree stage
    const getNextTree = (): TreeStage | null => {
        const currentIndex = TREE_STAGES.findIndex(s => s === getCurrentTree());
        return currentIndex < TREE_STAGES.length - 1 ? TREE_STAGES[currentIndex + 1] : null;
    };

    // Add new habit
    const addHabit = () => {
        if (!newHabit.trim()) return;

        const habit: Habit = {
            id: Date.now().toString(),
            text: newHabit.trim(),
            emoji: selectedEmoji,
            category: selectedCategory,
            streak: 0,
            bestStreak: 0,
            completedToday: false,
            createdAt: new Date().toDateString(),
            completionHistory: [],
        };

        setHabits([habit, ...habits]);
        setNewHabit('');
        setSelectedEmoji('🌱');
        setShowCategoryPicker(false);

        // Quest: Plant a habit = earn acorns
        earnAcorns(5, 'Tiny Wins');
        setShowQuestReward(true);
        setTimeout(() => setShowQuestReward(false), 2500);
    };

    // Toggle habit completion
    const toggleHabit = (id: string) => {
        const today = new Date().toDateString();

        setHabits(prev => {
            const updated = prev.map(habit => {
                if (habit.id === id && !habit.completedToday) {
                    const newStreak = habit.streak + 1;
                    const newBestStreak = Math.max(habit.bestStreak, newStreak);

                    // Check for streak bonus (every 7 days)
                    if (newStreak > 0 && newStreak % 7 === 0) {
                        earnAcorns(3, 'Tiny Wins Streak');
                        setShowStreakBonus(true);
                        setTimeout(() => setShowStreakBonus(false), 2500);
                    }

                    return {
                        ...habit,
                        completedToday: true,
                        streak: newStreak,
                        bestStreak: newBestStreak,
                        lastCompleted: today,
                        completionHistory: [...(habit.completionHistory || []), today],
                    };
                }
                return habit;
            });

            // Check if all habits completed
            const allDone = updated.every(h => h.completedToday);
            if (allDone && updated.length > 0) {
                // Bonus for completing all habits
                earnAcorns(5, 'Tiny Wins All Complete');
            }

            return updated;
        });

        setTotalCompleted(prev => prev + 1);
        triggerCelebration();
    };

    // Delete habit
    const deleteHabit = (id: string) => {
        setHabits(habits.filter(habit => habit.id !== id));
        if (showHabitDetail?.id === id) setShowHabitDetail(null);
    };

    // Show celebration animation
    const triggerCelebration = () => {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
    };

    // Filter habits by category
    const filteredHabits = filterCategory === 'all'
        ? habits
        : habits.filter(h => h.category === filterCategory);

    const currentTree = getCurrentTree();
    const nextTree = getNextTree();
    const progressToNext = nextTree
        ? ((totalCompleted - currentTree.tasksRequired) / (nextTree.tasksRequired - currentTree.tasksRequired)) * 100
        : 100;

    const todayCompleted = habits.filter(h => h.completedToday).length;
    const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.bestStreak)) : 0;
    const allDoneToday = habits.length > 0 && habits.every(h => h.completedToday);

    // Get weekly chart data
    const getWeeklyChartData = () => {
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toDateString();
            const completed = habits.filter(h => h.completionHistory?.includes(dateStr)).length;
            return {
                day: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()],
                completed,
                total: habits.length,
                isToday: i === 6,
            };
        });
    };

    return (
        <div className="tiny-wins-app">
            {/* Celebration overlay */}
            {showCelebration && (
                <div className="celebration">
                    <span className="celebration-emoji">🎉</span>
                    <span className="celebration-text">{t.celebration}</span>
                </div>
            )}

            {/* Quest Reward Toast */}
            {showQuestReward && (
                <div className="quest-reward-toast">
                    <span className="toast-icon">🌱</span>
                    <div className="toast-content">
                        <div className="toast-title">{t.habitAdded}</div>
                        <div className="toast-reward">{t.acornsEarned}</div>
                    </div>
                </div>
            )}

            {/* Streak Bonus Toast */}
            {showStreakBonus && (
                <div className="quest-reward-toast streak-bonus">
                    <span className="toast-icon">🔥</span>
                    <div className="toast-content">
                        <div className="toast-title">{t.streakBonus}</div>
                        <div className="toast-reward">{t.bonusAcorns}</div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <a href="/" className="back-link">{t.back}</a>
                <h1>🌱 {t.title}</h1>
                <div className="header-right">
                    <button className="icon-btn" onClick={() => setShowStats(true)}>📊</button>
                    <span className="acorn-badge">🌰 {totalAcorns}</span>
                </div>
            </header>

            {/* All Done Banner */}
            {allDoneToday && (
                <div className="all-done-banner">
                    {t.allDone}
                </div>
            )}

            {/* Garden Display */}
            <section className="garden-display">
                <div className="tree-container">
                    <div className={`tree ${showCelebration ? 'growing' : ''}`}>
                        {currentTree.emoji}
                    </div>
                    <div className="tree-name">
                        {language === 'en' ? currentTree.nameEn : currentTree.nameKo}
                    </div>
                </div>

                {/* Growth Stages Visual */}
                <div className="growth-stages">
                    {TREE_STAGES.map((stage, index) => {
                        const isCompleted = totalCompleted >= stage.tasksRequired;
                        const isCurrent = stage === currentTree;
                        return (
                            <div
                                key={stage.tasksRequired}
                                className={`growth-stage ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                            >
                                <div className="stage-icon">{stage.emoji}</div>
                                <div className="stage-line">
                                    {index < TREE_STAGES.length - 1 && (
                                        <div
                                            className="stage-progress"
                                            style={{
                                                width: isCompleted ? '100%' :
                                                    isCurrent && nextTree ? `${progressToNext}%` : '0%'
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Progress to next stage */}
                {nextTree && (
                    <div className="progress-section">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${Math.min(progressToNext, 100)}%` }}
                            />
                        </div>
                        <div className="progress-text">
                            {nextTree.emoji} {language === 'en' ? nextTree.nameEn : nextTree.nameKo} {t.untilNext} {nextTree.tasksRequired - totalCompleted} {t.remaining}
                        </div>
                    </div>
                )}

                <div className="stats">
                    <div className="stat">
                        <span className="stat-number">{totalCompleted}</span>
                        <span className="stat-label">{t.totalCompleted}</span>
                    </div>
                    <div className="stat highlight">
                        <span className="stat-number">🔥 {bestStreak}</span>
                        <span className="stat-label">{t.currentStreak}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-number">{todayCompleted}/{habits.length}</span>
                        <span className="stat-label">{t.todayProgress}</span>
                    </div>
                </div>
            </section>

            {/* Add Habit */}
            <section className="add-habit-section">
                <div className="add-habit-form">
                    <button
                        className="emoji-picker-btn"
                        onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowCategoryPicker(false); }}
                    >
                        {selectedEmoji}
                    </button>
                    <input
                        type="text"
                        placeholder={t.addHabit}
                        value={newHabit}
                        onChange={(e) => setNewHabit(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                    />
                    <button
                        className="category-btn"
                        onClick={() => { setShowCategoryPicker(!showCategoryPicker); setShowEmojiPicker(false); }}
                    >
                        {CATEGORIES.find(c => c.id === selectedCategory)?.emoji}
                    </button>
                    <button className="add-btn" onClick={addHabit}>{t.add}</button>
                </div>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div className="emoji-picker">
                        {HABIT_EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                className={`emoji-option ${selectedEmoji === emoji ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedEmoji(emoji);
                                    setShowEmojiPicker(false);
                                }}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                {/* Category Picker */}
                {showCategoryPicker && (
                    <div className="category-picker">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-option ${selectedCategory === cat.id ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedCategory(cat.id);
                                    setShowCategoryPicker(false);
                                }}
                            >
                                <span>{cat.emoji}</span>
                                <span>{language === 'en' ? cat.nameEn : cat.nameKo}</span>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Category Filter */}
            <div className="category-filter">
                <span className="filter-label">{t.filterBy}:</span>
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterCategory('all')}
                    >
                        {t.allCategories}
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`filter-btn ${filterCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setFilterCategory(cat.id)}
                        >
                            {cat.emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* Habit Cards */}
            <section className="habits-section">
                <h2>{t.habits} ({filteredHabits.length})</h2>

                {filteredHabits.length === 0 ? (
                    <p className="empty-message">{t.noHabits}</p>
                ) : (
                    <div className="habit-grid">
                        {filteredHabits.map(habit => (
                            <div
                                key={habit.id}
                                className={`habit-card ${habit.completedToday ? 'completed' : ''}`}
                            >
                                <div
                                    className="habit-main"
                                    onClick={() => !habit.completedToday && toggleHabit(habit.id)}
                                >
                                    <div className="habit-emoji">{habit.emoji}</div>
                                    <div className="habit-info">
                                        <div className="habit-text">{habit.text}</div>
                                        <div className="habit-meta">
                                            <span className="habit-category">
                                                {CATEGORIES.find(c => c.id === habit.category)?.emoji}
                                            </span>
                                            <span className="habit-streak">
                                                🔥 {habit.streak} {t.days}
                                            </span>
                                        </div>
                                    </div>
                                    {habit.completedToday && (
                                        <div className="habit-done-badge">✓</div>
                                    )}
                                </div>
                                <div className="habit-actions">
                                    <button
                                        className="habit-detail-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowHabitDetail(habit);
                                        }}
                                    >
                                        ℹ️
                                    </button>
                                    <button
                                        className="habit-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteHabit(habit.id);
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Motivation */}
            <section className="motivation">
                <p>{t.motivation}</p>
            </section>

            {/* Stats Modal */}
            {showStats && (
                <div className="modal-overlay" onClick={() => setShowStats(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{t.stats}</h2>

                        {/* Weekly Stats Cards */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-icon">✅</span>
                                <span className="stat-number">{weeklyStats.totalCompleted}</span>
                                <span className="stat-label">{t.completedHabits}</span>
                            </div>
                            <div className="stat-card highlight">
                                <span className="stat-icon">⭐</span>
                                <span className="stat-number">{weeklyStats.perfectDays}</span>
                                <span className="stat-label">{t.perfectDays}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon">📈</span>
                                <span className="stat-number">{weeklyStats.avgCompletion}%</span>
                                <span className="stat-label">{t.avgRate}</span>
                            </div>
                        </div>

                        {/* Weekly Chart */}
                        <div className="weekly-chart-section">
                            <h3>{t.weeklyChart}</h3>
                            <div className="weekly-chart">
                                {getWeeklyChartData().map((day, i) => (
                                    <div key={i} className={`chart-bar-container ${day.isToday ? 'today' : ''}`}>
                                        <div className="bar-wrapper">
                                            <div
                                                className={`chart-bar ${day.completed > 0 ? 'active' : ''}`}
                                                style={{
                                                    height: day.total > 0
                                                        ? `${(day.completed / day.total) * 100}%`
                                                        : '5%'
                                                }}
                                            />
                                        </div>
                                        <span className="chart-day">{day.day}</span>
                                        <span className="chart-count">{day.completed}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className="category-breakdown">
                            <h3>{t.category}</h3>
                            <div className="category-list">
                                {CATEGORIES.map(cat => {
                                    const catHabits = habits.filter(h => h.category === cat.id);
                                    if (catHabits.length === 0) return null;
                                    const completed = catHabits.filter(h => h.completedToday).length;
                                    return (
                                        <div key={cat.id} className="category-item">
                                            <span className="cat-emoji">{cat.emoji}</span>
                                            <span className="cat-name">{language === 'en' ? cat.nameEn : cat.nameKo}</span>
                                            <span className="cat-progress">{completed}/{catHabits.length}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button className="close-btn" onClick={() => setShowStats(false)}>×</button>
                    </div>
                </div>
            )}

            {/* Habit Detail Modal */}
            {showHabitDetail && (
                <div className="modal-overlay" onClick={() => setShowHabitDetail(null)}>
                    <div className="modal-content habit-detail-modal" onClick={e => e.stopPropagation()}>
                        <h2>{t.habitDetails}</h2>

                        <div className="detail-header">
                            <span className="detail-emoji">{showHabitDetail.emoji}</span>
                            <div className="detail-info">
                                <span className="detail-text">{showHabitDetail.text}</span>
                                <span className="detail-category">
                                    {CATEGORIES.find(c => c.id === showHabitDetail.category)?.emoji}
                                    {' '}
                                    {language === 'en'
                                        ? CATEGORIES.find(c => c.id === showHabitDetail.category)?.nameEn
                                        : CATEGORIES.find(c => c.id === showHabitDetail.category)?.nameKo
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="detail-stats">
                            <div className="detail-stat">
                                <span className="value">🔥 {showHabitDetail.streak}</span>
                                <span className="label">{t.currentStreakLabel}</span>
                            </div>
                            <div className="detail-stat highlight">
                                <span className="value">⭐ {showHabitDetail.bestStreak}</span>
                                <span className="label">{t.bestStreakLabel}</span>
                            </div>
                            <div className="detail-stat">
                                <span className="value">✅ {showHabitDetail.completionHistory?.length || 0}</span>
                                <span className="label">{t.completions}</span>
                            </div>
                        </div>

                        <div className="detail-created">
                            {t.created}: {showHabitDetail.createdAt}
                        </div>

                        <div className="detail-actions">
                            <button
                                className="delete-btn"
                                onClick={() => deleteHabit(showHabitDetail.id)}
                            >
                                🗑️ Delete
                            </button>
                        </div>

                        <button className="close-btn" onClick={() => setShowHabitDetail(null)}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
}
