'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import { BackLink } from '@/components/BackLink';
import './daily-quest.css';

// ==================== TYPES ====================
interface Quest {
    id: string;
    title: string;
    titleKo: string;
    category: 'productivity' | 'health' | 'social' | 'creativity' | 'learning';
    difficulty: 'easy' | 'medium' | 'hard';
    xpReward: number;
    acornReward: number;
    emoji: string;
    completed: boolean;
    completedAt?: string;
}

interface QuestHistory {
    date: string;
    completed: number;
    totalXP: number;
}

// ==================== QUEST POOL ====================
const QUEST_POOL: Quest[] = [
    // Productivity
    { id: 'p1', title: 'Clear your inbox to zero', titleKo: '받은편지함 비우기', category: 'productivity', difficulty: 'medium', xpReward: 30, acornReward: 5, emoji: '📧', completed: false },
    { id: 'p2', title: 'Complete 3 tasks from your to-do list', titleKo: '할일 3개 완료하기', category: 'productivity', difficulty: 'easy', xpReward: 20, acornReward: 3, emoji: '✅', completed: false },
    { id: 'p3', title: 'Plan tomorrow\'s schedule', titleKo: '내일 일정 계획하기', category: 'productivity', difficulty: 'easy', xpReward: 15, acornReward: 2, emoji: '📅', completed: false },
    { id: 'p4', title: 'Organize your desk for 10 minutes', titleKo: '10분간 책상 정리하기', category: 'productivity', difficulty: 'easy', xpReward: 15, acornReward: 2, emoji: '🗂️', completed: false },
    { id: 'p5', title: 'Write a meeting summary', titleKo: '회의 요약 작성하기', category: 'productivity', difficulty: 'medium', xpReward: 25, acornReward: 4, emoji: '📋', completed: false },
    { id: 'p6', title: 'Unsubscribe from 3 newsletters', titleKo: '뉴스레터 3개 구독취소', category: 'productivity', difficulty: 'easy', xpReward: 10, acornReward: 2, emoji: '🗑️', completed: false },

    // Health
    { id: 'h1', title: 'Drink 8 glasses of water', titleKo: '물 8잔 마시기', category: 'health', difficulty: 'medium', xpReward: 25, acornReward: 4, emoji: '💧', completed: false },
    { id: 'h2', title: 'Take a 20-minute walk', titleKo: '20분 산책하기', category: 'health', difficulty: 'easy', xpReward: 20, acornReward: 3, emoji: '🚶', completed: false },
    { id: 'h3', title: 'Do 10 push-ups', titleKo: '팔굽혀펴기 10회', category: 'health', difficulty: 'medium', xpReward: 25, acornReward: 4, emoji: '💪', completed: false },
    { id: 'h4', title: 'Stretch for 5 minutes', titleKo: '5분 스트레칭', category: 'health', difficulty: 'easy', xpReward: 15, acornReward: 2, emoji: '🧘', completed: false },
    { id: 'h5', title: 'Sleep before midnight', titleKo: '자정 전에 잠들기', category: 'health', difficulty: 'hard', xpReward: 40, acornReward: 8, emoji: '😴', completed: false },
    { id: 'h6', title: 'Eat a healthy breakfast', titleKo: '건강한 아침 먹기', category: 'health', difficulty: 'easy', xpReward: 15, acornReward: 2, emoji: '🥗', completed: false },
    { id: 'h7', title: 'Meditate for 10 minutes', titleKo: '10분 명상하기', category: 'health', difficulty: 'medium', xpReward: 30, acornReward: 5, emoji: '🧘‍♂️', completed: false },

    // Social
    { id: 's1', title: 'Send a kind message to someone', titleKo: '누군가에게 따뜻한 메시지 보내기', category: 'social', difficulty: 'easy', xpReward: 20, acornReward: 3, emoji: '💌', completed: false },
    { id: 's2', title: 'Call a friend or family member', titleKo: '친구나 가족에게 전화하기', category: 'social', difficulty: 'medium', xpReward: 30, acornReward: 5, emoji: '📞', completed: false },
    { id: 's3', title: 'Give a genuine compliment', titleKo: '진심 어린 칭찬하기', category: 'social', difficulty: 'easy', xpReward: 15, acornReward: 2, emoji: '🌟', completed: false },
    { id: 's4', title: 'Help a colleague with a task', titleKo: '동료 업무 도와주기', category: 'social', difficulty: 'medium', xpReward: 25, acornReward: 4, emoji: '🤝', completed: false },

    // Creativity
    { id: 'c1', title: 'Doodle or sketch for 10 minutes', titleKo: '10분간 그림 그리기', category: 'creativity', difficulty: 'easy', xpReward: 20, acornReward: 3, emoji: '🎨', completed: false },
    { id: 'c2', title: 'Write 3 sentences about your day', titleKo: '오늘 하루 3문장으로 적기', category: 'creativity', difficulty: 'easy', xpReward: 15, acornReward: 2, emoji: '📝', completed: false },
    { id: 'c3', title: 'Take a photo of something beautiful', titleKo: '아름다운 것 사진 찍기', category: 'creativity', difficulty: 'easy', xpReward: 15, acornReward: 2, emoji: '📸', completed: false },
    { id: 'c4', title: 'Listen to a new song', titleKo: '새로운 노래 듣기', category: 'creativity', difficulty: 'easy', xpReward: 10, acornReward: 1, emoji: '🎵', completed: false },
    { id: 'c5', title: 'Try a new recipe', titleKo: '새로운 레시피 도전하기', category: 'creativity', difficulty: 'hard', xpReward: 35, acornReward: 6, emoji: '👨‍🍳', completed: false },

    // Learning
    { id: 'l1', title: 'Read for 15 minutes', titleKo: '15분 독서하기', category: 'learning', difficulty: 'medium', xpReward: 25, acornReward: 4, emoji: '📚', completed: false },
    { id: 'l2', title: 'Watch an educational video', titleKo: '교육 영상 시청하기', category: 'learning', difficulty: 'easy', xpReward: 20, acornReward: 3, emoji: '🎬', completed: false },
    { id: 'l3', title: 'Learn 3 new words', titleKo: '새 단어 3개 배우기', category: 'learning', difficulty: 'easy', xpReward: 15, acornReward: 2, emoji: '🔤', completed: false },
    { id: 'l4', title: 'Practice a skill for 20 minutes', titleKo: '20분간 스킬 연습하기', category: 'learning', difficulty: 'hard', xpReward: 35, acornReward: 6, emoji: '🎯', completed: false },
    { id: 'l5', title: 'Listen to a podcast episode', titleKo: '팟캐스트 에피소드 듣기', category: 'learning', difficulty: 'easy', xpReward: 15, acornReward: 2, emoji: '🎧', completed: false },
];

const CATEGORY_COLORS: Record<string, string> = {
    productivity: '#FF9800',
    health: '#4CAF50',
    social: '#E91E63',
    creativity: '#9C27B0',
    learning: '#2196F3',
};

const CATEGORY_EMOJIS: Record<string, string> = {
    productivity: '⚡',
    health: '❤️',
    social: '💬',
    creativity: '🎨',
    learning: '📖',
};

const DIFFICULTY_COLORS: Record<string, string> = {
    easy: '#8BC34A',
    medium: '#FFC107',
    hard: '#F44336',
};

// Rank system
const RANKS = [
    { name: 'Novice', nameKo: '초보자', emoji: '🌱', minLevel: 1 },
    { name: 'Apprentice', nameKo: '견습생', emoji: '⚔️', minLevel: 3 },
    { name: 'Adventurer', nameKo: '모험가', emoji: '🛡️', minLevel: 5 },
    { name: 'Warrior', nameKo: '전사', emoji: '⚡', minLevel: 8 },
    { name: 'Champion', nameKo: '챔피언', emoji: '👑', minLevel: 12 },
    { name: 'Legend', nameKo: '전설', emoji: '🌟', minLevel: 20 },
];

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        title: 'Daily Side-Quest',
        back: '← Brookvale',
        todayQuests: "Today's Quests",
        rollDice: '🎲 Roll for New Quest',
        questBoard: 'Quest Board',
        completed: 'Completed',
        xp: 'XP',
        acorns: 'Acorns',
        level: 'Level',
        noQuests: 'Roll the dice to get your first quest!',
        categories: {
            productivity: 'Productivity',
            health: 'Health',
            social: 'Social',
            creativity: 'Creativity',
            learning: 'Learning',
        },
        difficulties: {
            easy: 'Easy',
            medium: 'Medium',
            hard: 'Hard',
        },
        claim: 'Complete & Claim',
        claimed: '✓ Claimed',
        rerollInfo: 'Don\'t like this quest? Roll again!',
        streak: 'Streak',
        days: 'days',
        questComplete: 'Quest Complete!',
        earnedXP: 'XP Earned',
        earnedAcorns: 'Acorns Earned',
        levelUp: 'Level Up!',
        rank: 'Rank',
        weeklyReport: 'This Week',
        categoryBreakdown: 'Category Focus',
        dailyChallenge: '🎯 Daily Challenge',
        completeAll: 'Complete all quests for bonus!',
        bonusClaimed: '🎉 Daily Bonus Claimed!',
        maxQuests: 'Max 5 quests at a time',
        totalCompleted: 'Total Completed',
    },
    ko: {
        title: '오늘의 부업',
        back: '← 브룩베일',
        todayQuests: '오늘의 퀘스트',
        rollDice: '🎲 새 퀘스트 뽑기',
        questBoard: '퀘스트 게시판',
        completed: '완료',
        xp: '경험치',
        acorns: '도토리',
        level: '레벨',
        noQuests: '주사위를 굴려서 첫 퀘스트를 받아보세요!',
        categories: {
            productivity: '생산성',
            health: '건강',
            social: '소셜',
            creativity: '창작',
            learning: '학습',
        },
        difficulties: {
            easy: '쉬움',
            medium: '보통',
            hard: '어려움',
        },
        claim: '완료하고 보상 받기',
        claimed: '✓ 완료됨',
        rerollInfo: '마음에 안 드나요? 다시 굴려보세요!',
        streak: '연속',
        days: '일',
        questComplete: '퀘스트 완료!',
        earnedXP: '획득 경험치',
        earnedAcorns: '획득 도토리',
        levelUp: '레벨 업!',
        rank: '등급',
        weeklyReport: '이번 주',
        categoryBreakdown: '카테고리 분석',
        dailyChallenge: '🎯 일일 도전',
        completeAll: '모든 퀘스트를 완료하면 보너스!',
        bonusClaimed: '🎉 일일 보너스 획득!',
        maxQuests: '최대 5개 퀘스트',
        totalCompleted: '총 완료',
    },
};

// ==================== HELPER FUNCTIONS ====================
const calculateLevel = (xp: number) => Math.floor(xp / 100) + 1;
const calculateXpToNext = (xp: number) => 100 - (xp % 100);

const getRank = (level: number) => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (level >= RANKS[i].minLevel) return RANKS[i];
    }
    return RANKS[0];
};

// ==================== COMPONENT ====================
export default function DailyQuestPage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
    const [totalXP, setTotalXP] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isRolling, setIsRolling] = useState(false);
    const [diceValue, setDiceValue] = useState('🎲');
    const [showReward, setShowReward] = useState<{ xp: number; acorns: number } | null>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [totalCompleted, setTotalCompleted] = useState(0);
    const [questHistory, setQuestHistory] = useState<QuestHistory[]>([]);
    const [showBonusToast, setShowBonusToast] = useState(false);
    const [tipIndex, setTipIndex] = useState(0);

    const { balance: totalAcorns, earn: earnAcorns } = useAcornStore(language);

    const t = translations[language];
    const level = calculateLevel(totalXP);
    const xpToNext = calculateXpToNext(totalXP);
    const rank = getRank(level);

    // Tips
    const tips = language === 'ko'
        ? ['작은 습관이 큰 변화를 만듭니다', '꾸준함이 재능을 이긴다', '오늘 한 걸음이 내일의 도약', '실패는 성장의 씨앗입니다']
        : ['Small habits create big changes', 'Consistency beats talent', 'One step today, a leap tomorrow', 'Failure is the seed of growth'];

    // Load saved language
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLang = localStorage.getItem('brookvale-language') as Language;
            if (savedLang) setLanguage(savedLang);
        }
    }, []);

    // Load data
    useEffect(() => {
        const saved = localStorage.getItem('dailyQuestData');
        if (saved) {
            const data = JSON.parse(saved);
            setActiveQuests(data.activeQuests || []);
            setTotalXP(data.totalXP || 0);
            setStreak(data.streak || 0);
            setTotalCompleted(data.totalCompleted || 0);
            setQuestHistory(data.questHistory || []);
        }
    }, []);

    // Save data
    useEffect(() => {
        localStorage.setItem('dailyQuestData', JSON.stringify({
            activeQuests,
            totalXP,
            streak,
            totalCompleted,
            questHistory,
        }));
    }, [activeQuests, totalXP, streak, totalCompleted, questHistory]);

    // Rotate tips
    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % tips.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [tips.length]);

    // Category completion stats
    const categoryStats = useMemo(() => {
        const stats: Record<string, { total: number; completed: number }> = {};
        activeQuests.forEach(q => {
            if (!stats[q.category]) stats[q.category] = { total: 0, completed: 0 };
            stats[q.category].total++;
            if (q.completed) stats[q.category].completed++;
        });
        return stats;
    }, [activeQuests]);

    // Weekly history for chart
    const weeklyChartData = useMemo(() => {
        const days = [];
        const dayNames = language === 'ko'
            ? ['일', '월', '화', '수', '목', '금', '토']
            : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const entry = questHistory.find(h => h.date === dateStr);
            days.push({
                label: dayNames[d.getDay()],
                completed: entry?.completed || 0,
                xp: entry?.totalXP || 0,
                isToday: i === 0,
            });
        }
        return days;
    }, [questHistory, language]);

    const maxWeeklyCompleted = Math.max(1, ...weeklyChartData.map(d => d.completed));

    // Filtered quests
    const filteredQuests = useMemo(() => {
        if (filterCategory === 'all') return activeQuests;
        return activeQuests.filter(q => q.category === filterCategory);
    }, [activeQuests, filterCategory]);

    const completedCount = activeQuests.filter(q => q.completed).length;

    // Roll for new quest
    const rollDice = useCallback(() => {
        if (activeQuests.length >= 5) return;
        setIsRolling(true);

        const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        let count = 0;
        const interval = setInterval(() => {
            setDiceValue(diceEmojis[count % 6]);
            count++;
            if (count >= 10) {
                clearInterval(interval);
                setIsRolling(false);
                setDiceValue('🎲');

                const availableQuests = QUEST_POOL.filter(
                    q => !activeQuests.find(aq => aq.id === q.id)
                );

                if (availableQuests.length > 0) {
                    const randomQuest = availableQuests[Math.floor(Math.random() * availableQuests.length)];
                    setActiveQuests(prev => [...prev, { ...randomQuest, completed: false }]);
                }
            }
        }, 100);
    }, [activeQuests]);

    // Complete quest
    const completeQuest = useCallback((questId: string) => {
        const quest = activeQuests.find(q => q.id === questId);
        if (!quest || quest.completed) return;

        const prevLevel = level;

        setActiveQuests(prev =>
            prev.map(q => q.id === questId ? { ...q, completed: true, completedAt: new Date().toISOString() } : q)
        );

        setTotalXP(prev => prev + quest.xpReward);
        setTotalCompleted(prev => prev + 1);

        // Update history
        const today = new Date().toISOString().split('T')[0];
        setQuestHistory(prev => {
            const existing = prev.find(h => h.date === today);
            if (existing) {
                return prev.map(h => h.date === today
                    ? { ...h, completed: h.completed + 1, totalXP: h.totalXP + quest.xpReward }
                    : h
                );
            }
            return [...prev, { date: today, completed: 1, totalXP: quest.xpReward }];
        });

        earnAcorns(quest.acornReward, 'Daily Quest');

        setShowReward({ xp: quest.xpReward, acorns: quest.acornReward });
        setTimeout(() => setShowReward(null), 2500);

        const newLevel = calculateLevel(totalXP + quest.xpReward);
        if (newLevel > prevLevel) {
            setTimeout(() => {
                setShowLevelUp(true);
                setTimeout(() => setShowLevelUp(false), 2500);
            }, 500);
        }

        // Check if ALL quests completed -> bonus
        const allCompleted = activeQuests.every(q => q.id === questId || q.completed);
        if (allCompleted && activeQuests.length >= 3) {
            setTimeout(() => {
                earnAcorns(10, 'Daily Quest Bonus');
                setShowBonusToast(true);
                setTimeout(() => setShowBonusToast(false), 3000);
            }, 1000);
        }
    }, [activeQuests, level, totalXP, earnAcorns]);

    // Remove completed quests
    const clearCompletedQuests = () => {
        setActiveQuests(prev => prev.filter(q => !q.completed));
    };

    return (
        <div className="daily-quest-app">
            {/* Reward Popup */}
            {showReward && (
                <div className="reward-popup">
                    <div className="reward-content">
                        <div className="reward-icon">🎉</div>
                        <h2>{t.questComplete}</h2>
                        <div className="reward-details">
                            <div className="reward-item"><span>⭐</span><span>+{showReward.xp} {t.xp}</span></div>
                            <div className="reward-item"><span>🌰</span><span>+{showReward.acorns} {t.acorns}</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Level Up Popup */}
            {showLevelUp && (
                <div className="level-up-popup">
                    <div className="level-up-content">
                        <div className="level-up-icon">🆙</div>
                        <h2>{t.levelUp}</h2>
                        <div className="new-level">{t.level} {level}</div>
                    </div>
                </div>
            )}

            {/* Bonus Toast */}
            {showBonusToast && (
                <div className="bonus-toast">{t.bonusClaimed} +10 🌰</div>
            )}

            {/* Header */}
            <header className="app-header">
                <BackLink>{t.back}</BackLink>
                <h1>⚔️ {t.title}</h1>
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

            {/* Rank Card */}
            <section className="rank-card">
                <div className="rank-left">
                    <span className="rank-emoji">{rank.emoji}</span>
                    <div className="rank-info">
                        <span className="rank-name">{language === 'ko' ? rank.nameKo : rank.name}</span>
                        <span className="rank-level">{t.level} {level}</span>
                    </div>
                </div>
                <div className="rank-right">
                    <div className="xp-bar-wrap">
                        <div className="xp-bar">
                            <div className="xp-fill" style={{ width: `${100 - (xpToNext / 100) * 100}%` }} />
                        </div>
                        <span className="xp-text">{xpToNext} XP</span>
                    </div>
                </div>
            </section>

            {/* Stats Overview */}
            <section className="stats-overview">
                <div className="so-grid">
                    <div className="so-stat">
                        <span className="so-icon">🔥</span>
                        <span className="so-value">{streak}</span>
                        <span className="so-label">{t.streak}</span>
                    </div>
                    <div className="so-stat">
                        <span className="so-icon">✅</span>
                        <span className="so-value">{completedCount}/{activeQuests.length}</span>
                        <span className="so-label">{t.completed}</span>
                    </div>
                    <div className="so-stat">
                        <span className="so-icon">⭐</span>
                        <span className="so-value">{totalXP}</span>
                        <span className="so-label">{t.xp}</span>
                    </div>
                    <div className="so-stat">
                        <span className="so-icon">🏆</span>
                        <span className="so-value">{totalCompleted}</span>
                        <span className="so-label">{t.totalCompleted}</span>
                    </div>
                </div>
            </section>

            {/* Weekly Chart */}
            <section className="week-chart">
                <h3>{t.weeklyReport}</h3>
                <div className="week-bars">
                    {weeklyChartData.map((day, i) => (
                        <div key={i} className={`week-day ${day.isToday ? 'today' : ''}`}>
                            <div className="wd-bar-container">
                                <div
                                    className="wd-bar"
                                    style={{ height: `${day.completed > 0 ? (day.completed / maxWeeklyCompleted) * 100 : 4}%` }}
                                />
                            </div>
                            <span className="wd-count">{day.completed > 0 ? day.completed : ''}</span>
                            <span className="wd-label">{day.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Category Breakdown */}
            {Object.keys(categoryStats).length > 0 && (
                <section className="category-breakdown">
                    <h3>{t.categoryBreakdown}</h3>
                    <div className="cb-grid">
                        {Object.entries(categoryStats).map(([cat, data]) => (
                            <div key={cat} className="cb-item">
                                <span className="cb-emoji">{CATEGORY_EMOJIS[cat]}</span>
                                <div className="cb-bar">
                                    <div
                                        className="cb-fill"
                                        style={{
                                            width: `${data.total > 0 ? (data.completed / data.total) * 100 : 0}%`,
                                            backgroundColor: CATEGORY_COLORS[cat],
                                        }}
                                    />
                                </div>
                                <span className="cb-count">{data.completed}/{data.total}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Dice Roll Section */}
            <section className="dice-section">
                <button
                    className={`dice-btn ${isRolling ? 'rolling' : ''}`}
                    onClick={rollDice}
                    disabled={isRolling || activeQuests.length >= 5}
                >
                    <span className="dice-emoji">{diceValue}</span>
                    <span className="dice-text">{t.rollDice}</span>
                </button>
                <p className="reroll-info">
                    {activeQuests.length >= 5 ? t.maxQuests : t.rerollInfo}
                </p>
            </section>

            {/* Quest Board */}
            <section className="quest-board">
                <div className="board-header">
                    <h2>{t.questBoard}</h2>
                    {completedCount > 0 && (
                        <button className="clear-btn" onClick={clearCompletedQuests}>🗑️</button>
                    )}
                </div>

                {/* Category Filter */}
                {activeQuests.length > 0 && (
                    <div className="quest-filter">
                        <button
                            className={`qf-pill ${filterCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('all')}
                        >
                            {language === 'ko' ? '전체' : 'All'}
                        </button>
                        {Object.keys(categoryStats).map(cat => (
                            <button
                                key={cat}
                                className={`qf-pill ${filterCategory === cat ? 'active' : ''}`}
                                onClick={() => setFilterCategory(cat)}
                                style={{ borderColor: filterCategory === cat ? CATEGORY_COLORS[cat] : undefined }}
                            >
                                {CATEGORY_EMOJIS[cat]} {t.categories[cat as keyof typeof t.categories]}
                            </button>
                        ))}
                    </div>
                )}

                <div className="board-content">
                    {activeQuests.length === 0 ? (
                        <div className="empty-board">
                            <span className="empty-icon">📋</span>
                            <p>{t.noQuests}</p>
                        </div>
                    ) : (
                        <div className="quest-list">
                            {filteredQuests.map(quest => (
                                <div
                                    key={quest.id}
                                    className={`quest-card ${quest.completed ? 'completed' : ''}`}
                                    style={{ borderLeftColor: CATEGORY_COLORS[quest.category] }}
                                >
                                    <div className="quest-emoji">{quest.emoji}</div>
                                    <div className="quest-info">
                                        <h3>{language === 'ko' ? quest.titleKo : quest.title}</h3>
                                        <div className="quest-meta">
                                            <span className="difficulty-tag" style={{ backgroundColor: DIFFICULTY_COLORS[quest.difficulty] }}>
                                                {t.difficulties[quest.difficulty]}
                                            </span>
                                        </div>
                                        <div className="quest-rewards">
                                            <span className="reward">⭐ +{quest.xpReward}</span>
                                            <span className="reward">🌰 +{quest.acornReward}</span>
                                        </div>
                                    </div>
                                    <button
                                        className={`claim-btn ${quest.completed ? 'claimed' : ''}`}
                                        onClick={() => completeQuest(quest.id)}
                                        disabled={quest.completed}
                                    >
                                        {quest.completed ? '✓' : '✓'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Motivation */}
            <div className="motivation">
                <p key={tipIndex}>{tips[tipIndex]}</p>
            </div>
        </div>
    );
}
