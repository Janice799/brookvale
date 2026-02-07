'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import './acorn-archive.css';

// ==================== TYPES ====================
interface Acorn {
    id: string;
    content: string;
    date: string;
    category: 'achievement' | 'gratitude' | 'memory' | 'growth';
    emoji: string;
    pinned?: boolean;
    mood?: string;
}

interface ArchiveStats {
    streak: number;
    bestStreak: number;
    lastDate: string;
    weeklyHistory: Record<string, number>;
}

// ==================== CONSTANTS ====================
const CATEGORY_EMOJIS: Record<string, string> = {
    achievement: '🏆',
    gratitude: '🙏',
    memory: '📸',
    growth: '🌱',
};

const CATEGORY_COLORS: Record<string, string> = {
    achievement: '#FFD700',
    gratitude: '#E91E63',
    memory: '#2196F3',
    growth: '#4CAF50',
};

const MOOD_OPTIONS = [
    { id: 'happy', emoji: '😊' },
    { id: 'proud', emoji: '💪' },
    { id: 'grateful', emoji: '🥰' },
    { id: 'peaceful', emoji: '😌' },
    { id: 'excited', emoji: '🤩' },
    { id: 'reflective', emoji: '🤔' },
];

// Oak tree stages
const OAK_STAGES = [
    { emoji: '🌱', name: 'Seed', nameKo: '씨앗', min: 0 },
    { emoji: '🌿', name: 'Sprout', nameKo: '새싹', min: 5 },
    { emoji: '🪴', name: 'Sapling', nameKo: '묘목', min: 15 },
    { emoji: '🌲', name: 'Young Tree', nameKo: '어린 나무', min: 30 },
    { emoji: '🌳', name: 'Oak Tree', nameKo: '참나무', min: 50 },
    { emoji: '🏔️', name: 'Ancient Oak', nameKo: '고목', min: 100 },
];

const SQUIRREL_MESSAGES = {
    en: [
        'Great collection! Keep storing those wins!',
        'Every acorn is a step towards your mighty oak!',
        'I\'m so proud of your achievements!',
        'Remember: small wins add up to big victories!',
        'Your gratitude garden is growing beautifully!',
        'What a wonderful memory to cherish!',
    ],
    ko: [
        '멋진 컬렉션이에요! 계속 모아보세요!',
        '모든 도토리는 거대한 참나무를 향한 한 걸음!',
        '당신의 성취가 정말 자랑스러워요!',
        '작은 성공이 모여 큰 승리가 됩니다!',
        '감사의 정원이 아름답게 자라고 있어요!',
        '소중히 간직할 멋진 추억이네요!',
    ],
};

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        title: 'Acorn Archive',
        back: '← Brookvale',
        addAcorn: '+ Store an Acorn',
        myAcorns: 'My Acorn Collection',
        total: 'Total',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        streak: 'Streak',
        empty: 'No acorns stored yet. Start collecting your achievements!',
        categories: {
            achievement: '🏆 Achievement',
            gratitude: '🙏 Gratitude',
            memory: '📸 Memory',
            growth: '🌱 Growth',
        },
        placeholder: 'What small win do you want to remember?',
        save: 'Store Acorn',
        cancel: 'Cancel',
        delete: 'Remove',
        motivation: '🐿️ Little by little, acorns become mighty oaks',
        questComplete: 'Acorn Stored!',
        acornsEarned: '+5 Acorns',
        oakProgress: 'Oak Tree Progress',
        acornsToOak: 'acorns until next stage',
        level: 'Level',
        days: 'days',
        pinned: '📌 Pinned',
        searchPlaceholder: 'Search your acorns...',
        weeklyChart: 'This Week',
        categoryBreakdown: 'Categories',
        howFeel: 'How are you feeling?',
        all: 'All',
        viewDetail: 'View',
        close: 'Close',
        totalStored: 'Stored',
    },
    ko: {
        title: '도토리 창고',
        back: '← 브룩베일',
        addAcorn: '+ 도토리 저장하기',
        myAcorns: '나의 도토리 컬렉션',
        total: '전체',
        thisWeek: '이번 주',
        thisMonth: '이번 달',
        streak: '연속',
        empty: '아직 저장된 도토리가 없어요. 작은 성취를 모아보세요!',
        categories: {
            achievement: '🏆 성취',
            gratitude: '🙏 감사',
            memory: '📸 추억',
            growth: '🌱 성장',
        },
        placeholder: '기억하고 싶은 작은 성공이 있나요?',
        save: '도토리 저장',
        cancel: '취소',
        delete: '삭제',
        motivation: '🐿️ 작은 도토리가 모여 큰 참나무가 됩니다',
        questComplete: '도토리 저장됨!',
        acornsEarned: '+5 도토리',
        oakProgress: '참나무 성장 진행',
        acornsToOak: '개 더 필요',
        level: '레벨',
        days: '일',
        pinned: '📌 고정됨',
        searchPlaceholder: '도토리 검색...',
        weeklyChart: '이번 주',
        categoryBreakdown: '카테고리',
        howFeel: '지금 기분은?',
        all: '전체',
        viewDetail: '보기',
        close: '닫기',
        totalStored: '저장됨',
    },
};

// ==================== COMPONENT ====================
export default function AcornArchivePage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [acorns, setAcorns] = useState<Acorn[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState<Acorn['category']>('achievement');
    const [newMood, setNewMood] = useState('happy');
    const [showReward, setShowReward] = useState(false);
    const [filterCategory, setFilterCategory] = useState<Acorn['category'] | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<ArchiveStats>({
        streak: 0, bestStreak: 0, lastDate: '', weeklyHistory: {},
    });
    const [selectedAcorn, setSelectedAcorn] = useState<Acorn | null>(null);
    const [tipIndex, setTipIndex] = useState(0);

    const { balance: totalAcorns, earn: earnAcorns } = useAcornStore(language);
    const t = translations[language];

    // Load language
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLang = localStorage.getItem('brookvale-language') as Language;
            if (savedLang) setLanguage(savedLang);
        }
    }, []);

    // Load data
    useEffect(() => {
        const saved = localStorage.getItem('acornArchiveV3');
        if (saved) {
            const data = JSON.parse(saved);
            setAcorns(data.acorns || []);
            setStats(data.stats || { streak: 0, bestStreak: 0, lastDate: '', weeklyHistory: {} });
        }
    }, []);

    // Save data
    useEffect(() => {
        localStorage.setItem('acornArchiveV3', JSON.stringify({ acorns, stats }));
    }, [acorns, stats]);

    // Rotate squirrel messages
    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % SQUIRREL_MESSAGES.en.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Weekly chart data
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
            const count = acorns.filter(a => a.date.startsWith(dateStr)).length;
            days.push({
                label: dayNames[d.getDay()],
                count,
                isToday: i === 0,
            });
        }
        return days;
    }, [acorns, language]);

    const maxWeeklyCount = Math.max(1, ...weeklyChartData.map(d => d.count));

    // Category stats
    const categoryStats = useMemo(() => {
        const counts: Record<string, number> = {};
        acorns.forEach(a => {
            counts[a.category] = (counts[a.category] || 0) + 1;
        });
        return counts;
    }, [acorns]);

    const maxCategoryCount = Math.max(1, ...Object.values(categoryStats));

    // Statistics
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const weeklyCount = acorns.filter(a => new Date(a.date) >= startOfWeek).length;
    const monthlyCount = acorns.filter(a => new Date(a.date) >= startOfMonth).length;

    // Oak tree progress
    const getOakStage = useCallback((count: number) => {
        for (let i = OAK_STAGES.length - 1; i >= 0; i--) {
            if (count >= OAK_STAGES[i].min) return { current: OAK_STAGES[i], next: OAK_STAGES[i + 1] || null, index: i };
        }
        return { current: OAK_STAGES[0], next: OAK_STAGES[1], index: 0 };
    }, []);

    const oakInfo = getOakStage(acorns.length);
    const oakProgress = oakInfo.next
        ? ((acorns.length - oakInfo.current.min) / (oakInfo.next.min - oakInfo.current.min)) * 100
        : 100;
    const acornsToNext = oakInfo.next ? oakInfo.next.min - acorns.length : 0;

    // Filtered & searched acorns
    const filteredAcorns = useMemo(() => {
        let result = acorns;
        if (filterCategory !== 'all') {
            result = result.filter(a => a.category === filterCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(a => a.content.toLowerCase().includes(q));
        }
        // Sort: pinned first, then by date
        return result.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    }, [acorns, filterCategory, searchQuery]);

    // Add acorn
    const addAcorn = useCallback(() => {
        if (!newContent.trim()) return;

        const newAcorn: Acorn = {
            id: Date.now().toString(),
            content: newContent.trim(),
            date: new Date().toISOString(),
            category: newCategory,
            emoji: CATEGORY_EMOJIS[newCategory],
            mood: newMood,
        };

        setAcorns(prev => [newAcorn, ...prev]);

        // Update streak
        const today = new Date().toISOString().split('T')[0];
        setStats(prev => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            let newStreak = prev.streak;

            if (prev.lastDate !== today) {
                if (prev.lastDate === yesterdayStr || !prev.lastDate) {
                    newStreak = prev.streak + 1;
                } else {
                    newStreak = 1;
                }
            }

            return {
                ...prev,
                streak: newStreak,
                bestStreak: Math.max(prev.bestStreak, newStreak),
                lastDate: today,
            };
        });

        earnAcorns(5, 'Acorn Archive');
        setNewContent('');
        setNewMood('happy');
        setShowAddModal(false);
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2500);
    }, [newContent, newCategory, newMood, earnAcorns]);

    // Toggle pin
    const togglePin = useCallback((id: string) => {
        setAcorns(prev => prev.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a));
    }, []);

    // Delete acorn
    const deleteAcorn = useCallback((id: string) => {
        setAcorns(prev => prev.filter(a => a.id !== id));
        setSelectedAcorn(null);
    }, []);

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return language === 'ko'
            ? `${date.getMonth() + 1}월 ${date.getDate()}일`
            : date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="acorn-archive-app">
            {/* Reward Toast */}
            {showReward && (
                <div className="reward-toast">
                    <span className="toast-icon">🌰</span>
                    <div className="toast-content">
                        <div className="toast-title">{t.questComplete}</div>
                        <div className="toast-acorns">{t.acornsEarned}</div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedAcorn && (
                <div className="modal-overlay" onClick={() => setSelectedAcorn(null)}>
                    <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="detail-emoji">{selectedAcorn.emoji}</div>
                        <p className="detail-content">{selectedAcorn.content}</p>
                        <div className="detail-meta">
                            <span className="detail-date">{formatDate(selectedAcorn.date)}</span>
                            <span className="category-tag" style={{ backgroundColor: CATEGORY_COLORS[selectedAcorn.category] }}>
                                {t.categories[selectedAcorn.category]}
                            </span>
                        </div>
                        {selectedAcorn.mood && (
                            <div className="detail-mood">
                                {MOOD_OPTIONS.find(m => m.id === selectedAcorn.mood)?.emoji}
                            </div>
                        )}
                        <div className="detail-actions">
                            <button className="pin-btn" onClick={() => { togglePin(selectedAcorn.id); setSelectedAcorn(null); }}>
                                {selectedAcorn.pinned ? '📌 Unpin' : '📌 Pin'}
                            </button>
                            <button className="del-btn" onClick={() => deleteAcorn(selectedAcorn.id)}>
                                🗑️ {t.delete}
                            </button>
                            <button className="close-btn" onClick={() => setSelectedAcorn(null)}>
                                {t.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <a href="/" className="back-link">{t.back}</a>
                <h1>🌰 {t.title}</h1>
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

            {/* Stats Overview */}
            <section className="stats-section">
                <div className="stat-card">
                    <span className="stat-icon">🌰</span>
                    <span className="stat-value">{acorns.length}</span>
                    <span className="stat-label">{t.total}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">📅</span>
                    <span className="stat-value">{weeklyCount}</span>
                    <span className="stat-label">{t.thisWeek}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">🔥</span>
                    <span className="stat-value">{stats.streak}</span>
                    <span className="stat-label">{t.streak}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">📆</span>
                    <span className="stat-value">{monthlyCount}</span>
                    <span className="stat-label">{t.thisMonth}</span>
                </div>
            </section>

            {/* Oak Tree Progress */}
            <section className="oak-progress-section">
                <h3>{t.oakProgress}</h3>
                <div className="oak-visual">
                    <div className="oak-stage">
                        <span className="oak-emoji-main">{oakInfo.current.emoji}</span>
                        <span className="oak-name">{language === 'ko' ? oakInfo.current.nameKo : oakInfo.current.name}</span>
                    </div>
                    <div className="oak-info">
                        <div className="oak-bar">
                            <div className="oak-fill" style={{ width: `${oakProgress}%` }} />
                        </div>
                        {oakInfo.next && (
                            <div className="oak-need">
                                {acornsToNext} {t.acornsToOak} → {oakInfo.next.emoji}
                            </div>
                        )}
                    </div>
                </div>
                {/* All stages */}
                <div className="oak-stages-row">
                    {OAK_STAGES.map((stage, i) => (
                        <div key={i} className={`oak-stage-dot ${i <= oakInfo.index ? 'reached' : ''}`}>
                            <span>{stage.emoji}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Weekly Chart */}
            <section className="week-chart">
                <h3>{t.weeklyChart}</h3>
                <div className="week-bars">
                    {weeklyChartData.map((day, i) => (
                        <div key={i} className={`week-day ${day.isToday ? 'today' : ''}`}>
                            <div className="wd-bar-container">
                                <div
                                    className="wd-bar"
                                    style={{ height: `${day.count > 0 ? (day.count / maxWeeklyCount) * 100 : 4}%` }}
                                />
                            </div>
                            <span className="wd-count">{day.count > 0 ? day.count : ''}</span>
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
                        {Object.entries(categoryStats).map(([cat, count]) => (
                            <div key={cat} className="cb-item">
                                <span className="cb-emoji">{CATEGORY_EMOJIS[cat]}</span>
                                <div className="cb-bar">
                                    <div
                                        className="cb-fill"
                                        style={{
                                            width: `${(count / maxCategoryCount) * 100}%`,
                                            backgroundColor: CATEGORY_COLORS[cat],
                                        }}
                                    />
                                </div>
                                <span className="cb-count">{count}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Squirrel Companion */}
            <section className="squirrel-section">
                <div className="squirrel-avatar">🐿️</div>
                <p className="squirrel-message" key={tipIndex}>
                    {language === 'ko' ? SQUIRREL_MESSAGES.ko[tipIndex] : SQUIRREL_MESSAGES.en[tipIndex]}
                </p>
            </section>

            {/* Search + Filter */}
            <section className="search-filter-section">
                <div className="search-bar">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholder}
                    />
                </div>
                <div className="filter-pills">
                    <button
                        className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterCategory('all')}
                    >
                        {t.all}
                    </button>
                    {(Object.keys(CATEGORY_EMOJIS) as Acorn['category'][]).map(cat => (
                        <button
                            key={cat}
                            className={`filter-btn ${filterCategory === cat ? 'active' : ''}`}
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

            {/* Acorn Collection */}
            <section className="collection-section">
                <div className="collection-header">
                    <h2>{t.myAcorns} <span className="count-badge">{filteredAcorns.length}</span></h2>
                    <button className="add-btn" onClick={() => setShowAddModal(true)}>
                        {t.addAcorn}
                    </button>
                </div>

                {filteredAcorns.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🌰</span>
                        <p>{searchQuery ? (language === 'ko' ? '검색 결과가 없어요' : 'No results found') : t.empty}</p>
                    </div>
                ) : (
                    <div className="acorn-grid">
                        {filteredAcorns.map(acorn => (
                            <div
                                key={acorn.id}
                                className={`acorn-card ${acorn.pinned ? 'pinned' : ''}`}
                                style={{ borderLeftColor: CATEGORY_COLORS[acorn.category] }}
                                onClick={() => setSelectedAcorn(acorn)}
                            >
                                {acorn.pinned && <span className="pin-indicator">📌</span>}
                                <div className="acorn-header">
                                    <span className="acorn-emoji">{acorn.emoji}</span>
                                    <span className="acorn-date">{formatDate(acorn.date)}</span>
                                </div>
                                <p className="acorn-content">{acorn.content}</p>
                                <div className="acorn-footer">
                                    <span
                                        className="category-tag"
                                        style={{ backgroundColor: CATEGORY_COLORS[acorn.category] }}
                                    >
                                        {t.categories[acorn.category]}
                                    </span>
                                    {acorn.mood && (
                                        <span className="mood-emoji">
                                            {MOOD_OPTIONS.find(m => m.id === acorn.mood)?.emoji}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Motivation */}
            <section className="motivation-section">
                <p>{t.motivation}</p>
            </section>

            {/* Add Acorn Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{t.addAcorn}</h2>

                        <div className="category-picker">
                            {(Object.keys(t.categories) as Acorn['category'][]).map(cat => (
                                <button
                                    key={cat}
                                    className={`category-option ${newCategory === cat ? 'active' : ''}`}
                                    onClick={() => setNewCategory(cat)}
                                    style={{
                                        borderColor: newCategory === cat ? CATEGORY_COLORS[cat] : 'transparent',
                                        backgroundColor: newCategory === cat ? `${CATEGORY_COLORS[cat]}20` : undefined,
                                    }}
                                >
                                    <span className="option-emoji">{CATEGORY_EMOJIS[cat]}</span>
                                    <span className="option-label">
                                        {t.categories[cat].split(' ')[1]}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder={t.placeholder}
                            rows={4}
                            autoFocus
                        />

                        {/* Mood Selector */}
                        <div className="mood-picker">
                            <span className="mood-label">{t.howFeel}</span>
                            <div className="mood-options">
                                {MOOD_OPTIONS.map(m => (
                                    <button
                                        key={m.id}
                                        className={`mood-btn ${newMood === m.id ? 'active' : ''}`}
                                        onClick={() => setNewMood(m.id)}
                                    >
                                        {m.emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                                {t.cancel}
                            </button>
                            <button className="save-btn" onClick={addAcorn}>
                                {t.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
