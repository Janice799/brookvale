'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import { BackLink } from '@/components/BackLink';
import './goal-tycoon.css';

// Types
interface Milestone {
    id: string;
    note: string;
    completedAt: string;
}

interface Goal {
    id: string;
    title: string;
    category: 'health' | 'career' | 'learning' | 'finance' | 'hobby';
    progress: number; // 0-100
    milestones: number; // Number of completed milestones
    totalMilestones: number;
    startDate: string;
    deadline?: string;
    buildingLevel: number; // 1-5 (foundation → roof)
    milestoneNotes: Milestone[];
}

// Building visuals by type and level
const BUILDING_VISUALS = {
    health: ['🏋️', '🏥', '🏛️', '🏰', '🌟'],
    career: ['🏗️', '🏢', '🏬', '🗼', '⭐'],
    learning: ['📚', '🏫', '🎓', '🏛️', '💫'],
    finance: ['💰', '🏦', '💎', '🏆', '✨'],
    hobby: ['🎨', '🎭', '🎪', '🗽', '🌈'],
};

const CATEGORY_COLORS = {
    health: '#4CAF50',
    career: '#2196F3',
    learning: '#9C27B0',
    finance: '#FF9800',
    hobby: '#E91E63',
};

const CATEGORY_EMOJIS = {
    health: '💪',
    career: '💼',
    learning: '📖',
    finance: '💰',
    hobby: '🎨',
};

// City Level System
const CITY_LEVELS = [
    { name: 'Village', nameKo: '마을', emoji: '🏘️', minBuildings: 0, minAvgLevel: 0 },
    { name: 'Town', nameKo: '소도시', emoji: '🏙️', minBuildings: 2, minAvgLevel: 1.5 },
    { name: 'City', nameKo: '도시', emoji: '🌆', minBuildings: 4, minAvgLevel: 2 },
    { name: 'Metropolis', nameKo: '대도시', emoji: '🌇', minBuildings: 6, minAvgLevel: 3 },
    { name: 'Megacity', nameKo: '메가시티', emoji: '🌃', minBuildings: 8, minAvgLevel: 4 },
];

// Motivational tips
const CONSTRUCTION_TIPS_EN = [
    '💡 Complete milestones to level up buildings!',
    '🏗️ Add notes to milestones to track your journey',
    '📊 Filter by category to focus on specific goals',
    '🌟 Reach Megacity status by completing 8+ goals!',
    '🔥 Set deadlines to keep yourself accountable',
];

const CONSTRUCTION_TIPS_KO = [
    '💡 마일스톤을 완료하면 건물이 레벨업해요!',
    '🏗️ 마일스톤에 메모를 추가해 여정을 기록하세요',
    '📊 카테고리별 필터로 목표에 집중하세요',
    '🌟 8개 이상의 목표를 달성해 메가시티를 만드세요!',
    '🔥 마감일을 설정해 책임감을 높이세요',
];

const translations = {
    en: {
        title: 'Goal Tycoon',
        back: '← Brookvale',
        myCity: 'My Goal City',
        addGoal: '+ New Goal',
        goals: 'Goals',
        buildings: 'buildings',
        progress: 'Progress',
        milestone: 'Milestone',
        complete: 'Complete!',
        deadline: 'Deadline',
        noGoals: 'No goals yet. Start building your city!',
        categories: {
            health: '💪 Health',
            career: '💼 Career',
            learning: '📖 Learning',
            finance: '💰 Finance',
            hobby: '🎨 Hobby',
        },
        levels: ['Foundation', 'Walls', 'Floors', 'Roof', 'Complete!'],
        addMilestone: '+ Add Progress',
        goalTitle: 'Goal Title',
        selectCategory: 'Select Category',
        create: 'Create Goal',
        cancel: 'Cancel',
        delete: 'Delete',
        questComplete: 'Building Upgraded!',
        acornsEarned: '+12 Acorns',
        cityStats: 'City Dashboard',
        totalBuildings: 'Buildings',
        avgProgress: 'Avg Progress',
        all: 'All',
        filterBy: 'Filter',
        weeklyProgress: 'This Week',
        milestonesThisWeek: 'milestones',
        goalsCompleted: 'goals done',
        cityLevel: 'City Level',
        addNote: 'Add a note...',
        milestoneHistory: 'Milestone Log',
        noMilestones: 'No milestones yet',
        daysLeft: 'days left',
        overdue: 'Overdue',
        started: 'Started',
        setDeadline: 'Set Deadline',
        viewDetails: 'View Details',
        categoryBreakdown: 'Category Breakdown',
        tips: CONSTRUCTION_TIPS_EN,
        highlight: 'This Week\'s Highlight',
        noActivity: 'No activity this week yet',
        recentMilestones: 'Recent Achievements',
    },
    ko: {
        title: '목표 타이쿤',
        back: '← 브룩베일',
        myCity: '나의 목표 도시',
        addGoal: '+ 새 목표',
        goals: '목표',
        buildings: '건물',
        progress: '진행률',
        milestone: '마일스톤',
        complete: '완료!',
        deadline: '마감일',
        noGoals: '아직 목표가 없어요. 도시를 건설해보세요!',
        categories: {
            health: '💪 건강',
            career: '💼 커리어',
            learning: '📖 학습',
            finance: '💰 재정',
            hobby: '🎨 취미',
        },
        levels: ['기초', '벽', '층', '지붕', '완성!'],
        addMilestone: '+ 진행도 추가',
        goalTitle: '목표 제목',
        selectCategory: '카테고리 선택',
        create: '목표 생성',
        cancel: '취소',
        delete: '삭제',
        questComplete: '건물 업그레이드!',
        acornsEarned: '+12 도토리',
        cityStats: '도시 대시보드',
        totalBuildings: '건물',
        avgProgress: '평균 진행률',
        all: '전체',
        filterBy: '필터',
        weeklyProgress: '이번 주',
        milestonesThisWeek: '마일스톤',
        goalsCompleted: '목표 완료',
        cityLevel: '도시 레벨',
        addNote: '메모 추가...',
        milestoneHistory: '마일스톤 기록',
        noMilestones: '마일스톤이 아직 없어요',
        daysLeft: '일 남음',
        overdue: '기한 초과',
        started: '시작일',
        setDeadline: '마감일 설정',
        viewDetails: '상세 보기',
        categoryBreakdown: '카테고리 분석',
        tips: CONSTRUCTION_TIPS_KO,
        highlight: '이번 주 하이라이트',
        noActivity: '이번 주 활동이 아직 없어요',
        recentMilestones: '최근 성취',
    },
};

export default function GoalTycoonPage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalCategory, setNewGoalCategory] = useState<Goal['category']>('career');
    const [newGoalDeadline, setNewGoalDeadline] = useState('');
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [showQuestReward, setShowQuestReward] = useState(false);
    const [cranePosition, setCranePosition] = useState(0);
    const [filterCategory, setFilterCategory] = useState<Goal['category'] | 'all'>('all');
    const [milestoneNote, setMilestoneNote] = useState('');
    const [tipIndex, setTipIndex] = useState(0);
    const [upgradeAnimation, setUpgradeAnimation] = useState<string | null>(null);

    // Use global acorn system
    const { balance: totalAcorns, earn: earnAcorns } = useAcornStore(language);

    const t = translations[language];

    // Load saved language
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLang = localStorage.getItem('brookvale-language') as Language;
            if (savedLang) setLanguage(savedLang);
        }
    }, []);

    // Crane animation
    useEffect(() => {
        const interval = setInterval(() => {
            setCranePosition(prev => (prev + 1) % 100);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Rotate tips
    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % t.tips.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [t.tips.length]);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('goalTycoonData');
        if (saved) {
            const data = JSON.parse(saved);
            setGoals((data.goals || []).map((g: Goal) => ({
                ...g,
                milestoneNotes: g.milestoneNotes || [],
            })));
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('goalTycoonData', JSON.stringify({ goals }));
    }, [goals]);

    // Calculate city level
    const cityLevel = useMemo(() => {
        if (goals.length === 0) return CITY_LEVELS[0];
        const avgLevel = goals.reduce((acc, g) => acc + g.buildingLevel, 0) / goals.length;
        let level = CITY_LEVELS[0];
        for (const cl of CITY_LEVELS) {
            if (goals.length >= cl.minBuildings && avgLevel >= cl.minAvgLevel) {
                level = cl;
            }
        }
        return level;
    }, [goals]);

    // Weekly stats
    const weeklyStats = useMemo(() => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        let milestonesThisWeek = 0;
        let goalsCompletedThisWeek = 0;
        const recentNotes: (Milestone & { goalTitle: string; category: Goal['category'] })[] = [];

        goals.forEach(goal => {
            goal.milestoneNotes.forEach(mn => {
                if (new Date(mn.completedAt) >= weekAgo) {
                    milestonesThisWeek++;
                    recentNotes.push({ ...mn, goalTitle: goal.title, category: goal.category });
                }
            });
            if (goal.progress >= 100) {
                const lastMilestone = goal.milestoneNotes[goal.milestoneNotes.length - 1];
                if (lastMilestone && new Date(lastMilestone.completedAt) >= weekAgo) {
                    goalsCompletedThisWeek++;
                }
            }
        });

        recentNotes.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

        return { milestonesThisWeek, goalsCompletedThisWeek, recentNotes: recentNotes.slice(0, 5) };
    }, [goals]);

    // Category breakdown
    const categoryBreakdown = useMemo(() => {
        const breakdown: Record<string, { count: number; avgProgress: number }> = {};
        const categories: Goal['category'][] = ['health', 'career', 'learning', 'finance', 'hobby'];

        categories.forEach(cat => {
            const catGoals = goals.filter(g => g.category === cat);
            breakdown[cat] = {
                count: catGoals.length,
                avgProgress: catGoals.length > 0
                    ? Math.round(catGoals.reduce((acc, g) => acc + g.progress, 0) / catGoals.length)
                    : 0,
            };
        });

        return breakdown;
    }, [goals]);

    // Filtered goals
    const filteredGoals = useMemo(() => {
        if (filterCategory === 'all') return goals;
        return goals.filter(g => g.category === filterCategory);
    }, [goals, filterCategory]);

    // Create new goal
    const createGoal = () => {
        if (!newGoalTitle.trim()) return;

        const newGoal: Goal = {
            id: Date.now().toString(),
            title: newGoalTitle,
            category: newGoalCategory,
            progress: 0,
            milestones: 0,
            totalMilestones: 5,
            startDate: new Date().toISOString(),
            deadline: newGoalDeadline || undefined,
            buildingLevel: 1,
            milestoneNotes: [],
        };

        setGoals([...goals, newGoal]);
        setNewGoalTitle('');
        setNewGoalDeadline('');
        setShowAddModal(false);
    };

    // Add milestone progress with note
    const addMilestone = useCallback((goalId: string) => {
        setGoals(prevGoals => {
            return prevGoals.map(goal => {
                if (goal.id === goalId && goal.milestones < goal.totalMilestones) {
                    const newMilestones = goal.milestones + 1;
                    const newProgress = (newMilestones / goal.totalMilestones) * 100;
                    const newLevel = Math.min(5, Math.ceil(newMilestones / (goal.totalMilestones / 5)));

                    const newNote: Milestone = {
                        id: Date.now().toString(),
                        note: milestoneNote || `Milestone ${newMilestones} completed`,
                        completedAt: new Date().toISOString(),
                    };

                    // Show reward if leveled up
                    if (newLevel > goal.buildingLevel) {
                        earnAcorns(12, 'Goal Tycoon');
                        setShowQuestReward(true);
                        setUpgradeAnimation(goalId);
                        setTimeout(() => {
                            setShowQuestReward(false);
                            setUpgradeAnimation(null);
                        }, 2500);
                    }

                    return {
                        ...goal,
                        milestones: newMilestones,
                        progress: newProgress,
                        buildingLevel: newLevel,
                        milestoneNotes: [...goal.milestoneNotes, newNote],
                    };
                }
                return goal;
            });
        });
        setMilestoneNote('');
    }, [milestoneNote, earnAcorns]);

    // Delete goal
    const deleteGoal = (goalId: string) => {
        setGoals(goals.filter(g => g.id !== goalId));
        setSelectedGoal(null);
    };

    // Calculate stats
    const avgProgress = goals.length > 0
        ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
        : 0;

    // Days left helper
    const getDaysLeft = (deadline?: string) => {
        if (!deadline) return null;
        const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    // Format date
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return language === 'ko'
            ? `${d.getMonth() + 1}/${d.getDate()}`
            : d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="goal-tycoon-app">
            {/* Quest Reward Toast */}
            {showQuestReward && (
                <div className="quest-reward-toast">
                    <span className="toast-icon">🏗️</span>
                    <div className="toast-content">
                        <div className="toast-title">{t.questComplete}</div>
                        <div className="toast-reward">{t.acornsEarned}</div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <BackLink>{t.back}</BackLink>
                <h1>🏗️ {t.title}</h1>
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

            {/* City Level Banner */}
            <section className="city-level-banner">
                <div className="city-level-info">
                    <span className="city-emoji">{cityLevel.emoji}</span>
                    <div className="city-level-text">
                        <span className="city-level-label">{t.cityLevel}</span>
                        <span className="city-level-name">
                            {language === 'ko' ? cityLevel.nameKo : cityLevel.name}
                        </span>
                    </div>
                </div>
                <div className="city-level-stats">
                    <div className="cl-stat">
                        <span className="cl-stat-value">{goals.length}</span>
                        <span className="cl-stat-label">{t.totalBuildings}</span>
                    </div>
                    <div className="cl-stat">
                        <span className="cl-stat-value">{avgProgress}%</span>
                        <span className="cl-stat-label">{t.avgProgress}</span>
                    </div>
                </div>
            </section>

            {/* City Skyline View */}
            <section className="city-skyline">
                <h2>{t.myCity}</h2>
                <div className="skyline-container">
                    {/* Animated Crane */}
                    <div
                        className="animated-crane"
                        style={{ left: `${cranePosition}%` }}
                    >
                        🏗️
                    </div>

                    {/* Ground */}
                    <div className="ground" />

                    {/* Buildings */}
                    <div className="buildings-row">
                        {goals.length === 0 ? (
                            <div className="empty-city">
                                <span className="empty-icon">🌆</span>
                                <p>{t.noGoals}</p>
                            </div>
                        ) : (
                            goals.map((goal, index) => (
                                <div
                                    key={goal.id}
                                    className={`building level-${goal.buildingLevel} ${upgradeAnimation === goal.id ? 'upgrading' : ''}`}
                                    onClick={() => setSelectedGoal(goal)}
                                    style={{
                                        '--building-color': CATEGORY_COLORS[goal.category],
                                        animationDelay: `${index * 0.1}s`,
                                    } as React.CSSProperties}
                                >
                                    <div className="building-icon">
                                        {BUILDING_VISUALS[goal.category][goal.buildingLevel - 1]}
                                    </div>
                                    <div className="building-base">
                                        {[...Array(goal.buildingLevel)].map((_, i) => (
                                            <div key={i} className="building-floor" />
                                        ))}
                                    </div>
                                    <div className="building-label">{goal.title}</div>
                                    <div className="building-progress">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${goal.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Clouds */}
                    <div className="cloud cloud-1">☁️</div>
                    <div className="cloud cloud-2">☁️</div>
                    <div className="cloud cloud-3">⛅</div>
                </div>
            </section>

            {/* Weekly Highlight */}
            <section className="weekly-highlight">
                <h2>{t.highlight}</h2>
                <div className="highlight-cards">
                    <div className="highlight-card">
                        <span className="hl-emoji">⚡</span>
                        <span className="hl-value">{weeklyStats.milestonesThisWeek}</span>
                        <span className="hl-label">{t.milestonesThisWeek}</span>
                    </div>
                    <div className="highlight-card">
                        <span className="hl-emoji">🏆</span>
                        <span className="hl-value">{weeklyStats.goalsCompletedThisWeek}</span>
                        <span className="hl-label">{t.goalsCompleted}</span>
                    </div>
                </div>

                {weeklyStats.recentNotes.length > 0 && (
                    <div className="recent-milestones">
                        <h3>{t.recentMilestones}</h3>
                        {weeklyStats.recentNotes.map(note => (
                            <div key={note.id} className="recent-note">
                                <span className="rn-emoji">{CATEGORY_EMOJIS[note.category]}</span>
                                <div className="rn-info">
                                    <span className="rn-goal">{note.goalTitle}</span>
                                    <span className="rn-text">{note.note}</span>
                                </div>
                                <span className="rn-date">{formatDate(note.completedAt)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {weeklyStats.recentNotes.length === 0 && (
                    <p className="no-activity">{t.noActivity}</p>
                )}
            </section>

            {/* Category Breakdown */}
            <section className="category-breakdown">
                <h2>{t.categoryBreakdown}</h2>
                <div className="breakdown-bars">
                    {(['health', 'career', 'learning', 'finance', 'hobby'] as const).map(cat => (
                        <div key={cat} className="breakdown-item">
                            <div className="breakdown-label">
                                <span>{t.categories[cat]}</span>
                                <span className="breakdown-count">
                                    {categoryBreakdown[cat].count} • {categoryBreakdown[cat].avgProgress}%
                                </span>
                            </div>
                            <div className="breakdown-bar">
                                <div
                                    className="breakdown-fill"
                                    style={{
                                        width: `${categoryBreakdown[cat].avgProgress}%`,
                                        backgroundColor: CATEGORY_COLORS[cat],
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Category Filter */}
            <section className="filter-section">
                <div className="filter-pills">
                    <button
                        className={`filter-pill ${filterCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterCategory('all')}
                    >
                        {t.all}
                    </button>
                    {(['health', 'career', 'learning', 'finance', 'hobby'] as const).map(cat => (
                        <button
                            key={cat}
                            className={`filter-pill ${filterCategory === cat ? 'active' : ''}`}
                            onClick={() => setFilterCategory(cat)}
                            style={{
                                borderColor: filterCategory === cat ? CATEGORY_COLORS[cat] : undefined,
                                backgroundColor: filterCategory === cat ? `${CATEGORY_COLORS[cat]}20` : undefined,
                            }}
                        >
                            {CATEGORY_EMOJIS[cat]}
                        </button>
                    ))}
                </div>
            </section>

            {/* Goals List */}
            <section className="goals-list">
                <div className="list-header">
                    <h2>{t.goals} ({filteredGoals.length})</h2>
                    <button className="add-btn" onClick={() => setShowAddModal(true)}>
                        {t.addGoal}
                    </button>
                </div>

                {filteredGoals.map(goal => {
                    const daysLeft = getDaysLeft(goal.deadline);
                    return (
                        <div
                            key={goal.id}
                            className={`goal-card ${goal.progress >= 100 ? 'complete' : ''} ${upgradeAnimation === goal.id ? 'upgrading' : ''}`}
                            onClick={() => setSelectedGoal(goal)}
                        >
                            <div className="goal-icon">
                                {BUILDING_VISUALS[goal.category][goal.buildingLevel - 1]}
                            </div>
                            <div className="goal-info">
                                <h3>{goal.title}</h3>
                                <div className="goal-meta">
                                    <span
                                        className="category-tag"
                                        style={{ backgroundColor: CATEGORY_COLORS[goal.category] }}
                                    >
                                        {t.categories[goal.category]}
                                    </span>
                                    <span className="level-tag">
                                        Lv.{goal.buildingLevel} - {t.levels[goal.buildingLevel - 1]}
                                    </span>
                                    {daysLeft !== null && (
                                        <span className={`deadline-tag ${daysLeft < 0 ? 'overdue' : daysLeft <= 3 ? 'urgent' : ''}`}>
                                            {daysLeft < 0 ? t.overdue : `${daysLeft} ${t.daysLeft}`}
                                        </span>
                                    )}
                                </div>
                                <div className="goal-progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${goal.progress}%`,
                                            backgroundColor: CATEGORY_COLORS[goal.category],
                                        }}
                                    />
                                </div>
                                <div className="milestone-info">
                                    {t.milestone}: {goal.milestones}/{goal.totalMilestones}
                                </div>
                            </div>
                            <button
                                className="milestone-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addMilestone(goal.id);
                                }}
                                disabled={goal.milestones >= goal.totalMilestones}
                            >
                                {goal.milestones >= goal.totalMilestones ? '✓' : '+'}
                            </button>
                        </div>
                    );
                })}
            </section>

            {/* Construction Tip */}
            <section className="construction-tip">
                <p>{t.tips[tipIndex]}</p>
            </section>

            {/* Add Goal Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{t.addGoal}</h2>

                        <div className="form-group">
                            <label>{t.goalTitle}</label>
                            <input
                                type="text"
                                value={newGoalTitle}
                                onChange={(e) => setNewGoalTitle(e.target.value)}
                                placeholder={language === 'ko' ? '목표를 입력하세요...' : 'Enter your goal...'}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>{t.selectCategory}</label>
                            <div className="category-grid">
                                {(Object.keys(t.categories) as Goal['category'][]).map(cat => (
                                    <button
                                        key={cat}
                                        className={`category-btn ${newGoalCategory === cat ? 'active' : ''}`}
                                        onClick={() => setNewGoalCategory(cat)}
                                        style={{
                                            borderColor: newGoalCategory === cat ? CATEGORY_COLORS[cat] : 'transparent',
                                            backgroundColor: newGoalCategory === cat ? `${CATEGORY_COLORS[cat]}20` : undefined,
                                        }}
                                    >
                                        {t.categories[cat]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t.setDeadline}</label>
                            <input
                                type="date"
                                value={newGoalDeadline}
                                onChange={(e) => setNewGoalDeadline(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                                {t.cancel}
                            </button>
                            <button className="create-btn" onClick={createGoal}>
                                {t.create}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Goal Detail Modal */}
            {selectedGoal && (
                <div className="modal-overlay" onClick={() => setSelectedGoal(null)}>
                    <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="detail-header">
                            <span className="detail-icon">
                                {BUILDING_VISUALS[selectedGoal.category][selectedGoal.buildingLevel - 1]}
                            </span>
                            <h2>{selectedGoal.title}</h2>
                        </div>

                        <div className="detail-stats">
                            <div className="stat">
                                <span className="stat-label">{t.progress}</span>
                                <span className="stat-value">{Math.round(selectedGoal.progress)}%</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Level</span>
                                <span className="stat-value">{selectedGoal.buildingLevel}/5</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">{t.milestone}</span>
                                <span className="stat-value">{selectedGoal.milestones}/{selectedGoal.totalMilestones}</span>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="detail-dates">
                            <span className="date-info">
                                📅 {t.started}: {formatDate(selectedGoal.startDate)}
                            </span>
                            {selectedGoal.deadline && (
                                <span className={`date-info ${getDaysLeft(selectedGoal.deadline)! < 0 ? 'overdue' : ''}`}>
                                    ⏰ {t.deadline}: {formatDate(selectedGoal.deadline)}
                                    {getDaysLeft(selectedGoal.deadline)! >= 0
                                        ? ` (${getDaysLeft(selectedGoal.deadline)} ${t.daysLeft})`
                                        : ` (${t.overdue})`
                                    }
                                </span>
                            )}
                        </div>

                        {/* Building Preview */}
                        <div className="building-preview">
                            <div
                                className={`preview-building level-${selectedGoal.buildingLevel}`}
                                style={{ '--building-color': CATEGORY_COLORS[selectedGoal.category] } as React.CSSProperties}
                            >
                                {[...Array(selectedGoal.buildingLevel)].map((_, i) => (
                                    <div key={i} className="preview-floor" />
                                ))}
                                <div className="preview-icon">
                                    {BUILDING_VISUALS[selectedGoal.category][selectedGoal.buildingLevel - 1]}
                                </div>
                            </div>
                            <div className="level-label">
                                {t.levels[selectedGoal.buildingLevel - 1]}
                            </div>
                        </div>

                        {/* Milestone Note Input */}
                        {selectedGoal.milestones < selectedGoal.totalMilestones && (
                            <div className="milestone-note-input">
                                <input
                                    type="text"
                                    value={milestoneNote}
                                    onChange={(e) => setMilestoneNote(e.target.value)}
                                    placeholder={t.addNote}
                                />
                            </div>
                        )}

                        {/* Milestone History */}
                        <div className="milestone-history">
                            <h3>{t.milestoneHistory}</h3>
                            {selectedGoal.milestoneNotes.length === 0 ? (
                                <p className="no-milestones">{t.noMilestones}</p>
                            ) : (
                                <div className="milestone-list">
                                    {[...selectedGoal.milestoneNotes].reverse().map((mn, index) => (
                                        <div key={mn.id} className="milestone-entry">
                                            <div className="me-number">{selectedGoal.milestoneNotes.length - index}</div>
                                            <div className="me-info">
                                                <span className="me-note">{mn.note}</span>
                                                <span className="me-date">{formatDate(mn.completedAt)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="detail-actions">
                            <button
                                className="add-progress-btn"
                                onClick={() => {
                                    addMilestone(selectedGoal.id);
                                    // Update selectedGoal to reflect changes
                                    setSelectedGoal(prev => {
                                        if (!prev) return null;
                                        const updated = goals.find(g => g.id === prev.id);
                                        return updated || prev;
                                    });
                                }}
                                disabled={selectedGoal.milestones >= selectedGoal.totalMilestones}
                            >
                                {selectedGoal.milestones >= selectedGoal.totalMilestones
                                    ? t.complete
                                    : t.addMilestone}
                            </button>
                            <button
                                className="delete-btn"
                                onClick={() => deleteGoal(selectedGoal.id)}
                            >
                                {t.delete}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
