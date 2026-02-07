'use client';

import { useState, useEffect, useCallback } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import { BackLink } from '@/components/BackLink';
import './star-note.css';

// ==================== TYPES ====================
interface Star {
    id: string;
    content: string;
    date: string;
    category: 'gratitude' | 'wish' | 'memory' | 'lesson' | 'love';
    brightness: number;
    mood?: string;
}

interface Constellation {
    id: string;
    name: string;
    stars: string[];
    date: string;
}

interface StarStats {
    totalStars: number;
    weeklyStars: number;
    streak: number;
    bestStreak: number;
    lastDate: string;
    categoryCount: Record<string, number>;
}

// ==================== CONSTANTS ====================
const CATEGORY_EMOJIS = {
    gratitude: '🙏',
    wish: '🌠',
    memory: '💫',
    lesson: '📚',
    love: '💝',
};

const CATEGORY_COLORS = {
    gratitude: '#FFD700',
    wish: '#FF69B4',
    memory: '#87CEEB',
    lesson: '#98FB98',
    love: '#FF6B6B',
};

const MOOD_OPTIONS = [
    { id: 'peaceful', emoji: '😌' },
    { id: 'happy', emoji: '😊' },
    { id: 'grateful', emoji: '🥰' },
    { id: 'hopeful', emoji: '✨' },
    { id: 'reflective', emoji: '🤔' },
    { id: 'nostalgic', emoji: '💭' },
];

const STORAGE_KEY = 'starNoteV2';

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        title: 'Star Note',
        back: '← Brookvale',
        addStar: 'Add a Star',
        whatToRemember: 'What do you want to remember?',
        placeholder: 'Today I felt grateful for...',
        categories: {
            gratitude: '🙏 Gratitude',
            wish: '🌠 Wish',
            memory: '💫 Memory',
            lesson: '📚 Lesson',
            love: '💝 Love',
        },
        brightness: 'How bright?',
        saveStar: '⭐ Add to Sky',
        myStars: 'My Star Sky',
        constellations: 'Constellations',
        createConstellation: '+ Create Constellation',
        empty: 'Your sky is empty. Add some stars!',
        totalStars: 'Total Stars',
        brightestType: 'Brightest Type',
        questComplete: 'Star Added!',
        acornsEarned: '+5 Acorns',
        motivation: '✨ Every memory is a star in your story',
        delete: '×',
        name: 'Name',
        constellationName: 'Constellation Name',
        selectStars: 'Select Stars',
        save: 'Save',
        cancel: 'Cancel',
        // New translations
        stats: '📊 Statistics',
        weeklyStars: 'This Week',
        streak: 'Streak',
        bestStreak: 'Best Streak',
        categoryBreakdown: 'Category Breakdown',
        recentStars: 'Recent Stars',
        howFeel: 'How are you feeling?',
        filterBy: 'Filter',
        all: 'All',
        viewDetail: 'View',
        close: 'Close',
        starDetail: 'Star Detail',
        createdOn: 'Created on',
        noStars: 'No stars yet',
        days: 'days',
        searchPlaceholder: 'Search your stars...',
    },
    ko: {
        title: '스타 노트',
        back: '← 브룩베일',
        addStar: '별 추가하기',
        whatToRemember: '무엇을 기억하고 싶나요?',
        placeholder: '오늘 감사했던 것은...',
        categories: {
            gratitude: '🙏 감사',
            wish: '🌠 소원',
            memory: '💫 추억',
            lesson: '📚 교훈',
            love: '💝 사랑',
        },
        brightness: '얼마나 밝게?',
        saveStar: '⭐ 하늘에 추가',
        myStars: '나의 별 하늘',
        constellations: '별자리',
        createConstellation: '+ 별자리 만들기',
        empty: '하늘이 비어있어요. 별을 추가해보세요!',
        totalStars: '총 별',
        brightestType: '가장 밝은 유형',
        questComplete: '별 추가됨!',
        acornsEarned: '+5 도토리',
        motivation: '✨ 모든 기억은 당신 이야기의 별입니다',
        delete: '×',
        name: '이름',
        constellationName: '별자리 이름',
        selectStars: '별 선택',
        save: '저장',
        cancel: '취소',
        // New translations
        stats: '📊 통계',
        weeklyStars: '이번 주',
        streak: '연속',
        bestStreak: '최고 연속',
        categoryBreakdown: '카테고리 분석',
        recentStars: '최근 별',
        howFeel: '지금 기분은?',
        filterBy: '필터',
        all: '전체',
        viewDetail: '보기',
        close: '닫기',
        starDetail: '별 상세',
        createdOn: '생성일',
        noStars: '아직 별이 없어요',
        days: '일',
        searchPlaceholder: '별 검색...',
    },
};

export default function StarNotePage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [stars, setStars] = useState<Star[]>([]);
    const [constellations, setConstellations] = useState<Constellation[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showConstellationModal, setShowConstellationModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState<Star | null>(null);
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState<Star['category']>('gratitude');
    const [newBrightness, setNewBrightness] = useState(3);
    const [newMood, setNewMood] = useState('grateful');
    const [newConstellationName, setNewConstellationName] = useState('');
    const [selectedStarIds, setSelectedStarIds] = useState<string[]>([]);
    const [showReward, setShowReward] = useState(false);
    const [filterCategory, setFilterCategory] = useState<Star['category'] | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<StarStats>({
        totalStars: 0,
        weeklyStars: 0,
        streak: 0,
        bestStreak: 0,
        lastDate: '',
        categoryCount: {},
    });

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
                setStars(data.stars || []);
                setConstellations(data.constellations || []);
            }
        }
    }, []);

    // Save data
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ stars, constellations }));
        }
    }, [stars, constellations]);

    // Calculate stats
    useEffect(() => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyStars = stars.filter(s => new Date(s.date) >= oneWeekAgo).length;

        const categoryCount = stars.reduce((acc, s) => {
            acc[s.category] = (acc[s.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calculate streak
        let streak = 0;
        const today = new Date().toDateString();
        const sortedDates = [...new Set(stars.map(s => new Date(s.date).toDateString()))]
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        for (let i = 0; i < sortedDates.length; i++) {
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() - i);
            if (sortedDates[i] === expectedDate.toDateString()) {
                streak++;
            } else if (i === 0 && sortedDates[i] !== today) {
                break;
            } else {
                break;
            }
        }

        setStats({
            totalStars: stars.length,
            weeklyStars,
            streak,
            bestStreak: Math.max(stats.bestStreak, streak),
            lastDate: stars[0]?.date || '',
            categoryCount,
        });
    }, [stars, stats.bestStreak]);

    // Add star
    const addStar = useCallback(() => {
        if (!newContent.trim()) return;

        const newStar: Star = {
            id: Date.now().toString(),
            content: newContent,
            date: new Date().toISOString(),
            category: newCategory,
            brightness: newBrightness,
            mood: newMood,
        };

        setStars(prev => [newStar, ...prev]);
        setNewContent('');
        setNewCategory('gratitude');
        setNewBrightness(3);
        setNewMood('grateful');
        setShowAddModal(false);

        earnAcorns(5, 'Star Note');
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2500);
    }, [newContent, newCategory, newBrightness, newMood, earnAcorns]);

    // Delete star
    const deleteStar = useCallback((id: string) => {
        setStars(prev => prev.filter(s => s.id !== id));
        setConstellations(prev =>
            prev.map(c => ({
                ...c,
                stars: c.stars.filter(sId => sId !== id),
            })).filter(c => c.stars.length > 0)
        );
        if (showDetailModal?.id === id) setShowDetailModal(null);
    }, [showDetailModal]);

    // Create constellation
    const createConstellation = useCallback(() => {
        if (!newConstellationName.trim() || selectedStarIds.length < 2) return;

        const newConstellation: Constellation = {
            id: Date.now().toString(),
            name: newConstellationName,
            stars: selectedStarIds,
            date: new Date().toISOString(),
        };

        setConstellations(prev => [newConstellation, ...prev]);
        setNewConstellationName('');
        setSelectedStarIds([]);
        setShowConstellationModal(false);
    }, [newConstellationName, selectedStarIds]);

    // Toggle star selection
    const toggleStarSelection = (starId: string) => {
        setSelectedStarIds(prev =>
            prev.includes(starId)
                ? prev.filter(id => id !== starId)
                : [...prev, starId]
        );
    };

    // Filter stars
    const filteredStars = stars.filter(s => {
        const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
        const matchesSearch = searchQuery === '' ||
            s.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Brightest type
    const categoryBrightness = stars.reduce((acc, star) => {
        acc[star.category] = (acc[star.category] || 0) + star.brightness;
        return acc;
    }, {} as Record<string, number>);

    const brightestType = Object.entries(categoryBrightness)
        .sort(([, a], [, b]) => b - a)[0]?.[0] as Star['category'] || 'gratitude';

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return language === 'ko'
            ? `${date.getMonth() + 1}월 ${date.getDate()}일`
            : date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="star-note-app">
            {/* Reward Toast */}
            {showReward && (
                <div className="reward-toast">
                    <span className="toast-icon">⭐</span>
                    <div className="toast-content">
                        <div className="toast-title">{t.questComplete}</div>
                        <div className="toast-reward">{t.acornsEarned}</div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <BackLink>{t.back}</BackLink>
                <h1>⭐ {t.title}</h1>
                <div className="header-right">
                    <button className="icon-btn" onClick={() => setShowStatsModal(true)}>📊</button>
                    <span className="acorn-badge">🌰 {totalAcorns}</span>
                </div>
            </header>

            {/* Star Sky Visualization */}
            <section className="sky-section">
                <div className="star-sky">
                    {stars.slice(0, 30).map((star, index) => {
                        const left = 5 + (index * 17) % 90;
                        const top = 5 + (index * 23) % 85;
                        const size = 0.4 + star.brightness * 0.12;
                        const delay = index * 0.15;

                        return (
                            <div
                                key={star.id}
                                className="sky-star"
                                style={{
                                    left: `${left}%`,
                                    top: `${top}%`,
                                    transform: `scale(${size})`,
                                    color: CATEGORY_COLORS[star.category],
                                    animationDelay: `${delay}s`,
                                }}
                                onClick={() => setShowDetailModal(star)}
                            >
                                ⭐
                            </div>
                        );
                    })}
                    {stars.length === 0 && (
                        <p className="empty-sky-text">✨</p>
                    )}
                </div>
                <button className="add-star-btn" onClick={() => setShowAddModal(true)}>
                    {t.addStar}
                </button>
            </section>

            {/* Quick Stats */}
            <section className="stats-section">
                <div className="stat-card">
                    <span className="stat-icon">⭐</span>
                    <span className="stat-value">{stars.length}</span>
                    <span className="stat-label">{t.totalStars}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">📅</span>
                    <span className="stat-value">{stats.weeklyStars}</span>
                    <span className="stat-label">{t.weeklyStars}</span>
                </div>
                <div className="stat-card highlight">
                    <span className="stat-icon">🔥</span>
                    <span className="stat-value">{stats.streak}</span>
                    <span className="stat-label">{t.streak}</span>
                </div>
            </section>

            {/* Search and Filter */}
            <section className="filter-section">
                <input
                    type="text"
                    className="search-input"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="filter-chips">
                    <button
                        className={`filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterCategory('all')}
                    >
                        {t.all}
                    </button>
                    {(Object.keys(CATEGORY_EMOJIS) as Star['category'][]).map(cat => (
                        <button
                            key={cat}
                            className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                            onClick={() => setFilterCategory(cat)}
                            style={{
                                borderColor: filterCategory === cat ? CATEGORY_COLORS[cat] : undefined,
                            }}
                        >
                            {CATEGORY_EMOJIS[cat]}
                        </button>
                    ))}
                </div>
            </section>

            {/* Constellations */}
            {constellations.length > 0 && (
                <section className="constellations-section">
                    <h2>{t.constellations}</h2>
                    <div className="constellation-list">
                        {constellations.map(constellation => (
                            <div key={constellation.id} className="constellation-card">
                                <span className="constellation-name">{constellation.name}</span>
                                <span className="constellation-count">
                                    {constellation.stars.length} ⭐
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Star List */}
            <section className="stars-section">
                <div className="section-header">
                    <h2>{t.myStars} ({filteredStars.length})</h2>
                    {stars.length >= 2 && (
                        <button
                            className="create-constellation-btn"
                            onClick={() => setShowConstellationModal(true)}
                        >
                            {t.createConstellation}
                        </button>
                    )}
                </div>

                {filteredStars.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🌌</span>
                        <p>{searchQuery ? t.noStars : t.empty}</p>
                    </div>
                ) : (
                    <div className="star-list">
                        {filteredStars.map(star => (
                            <div
                                key={star.id}
                                className="star-card"
                                style={{ borderColor: CATEGORY_COLORS[star.category] }}
                            >
                                <div className="star-header">
                                    <span className="star-emoji">{CATEGORY_EMOJIS[star.category]}</span>
                                    <div className="star-meta">
                                        <span className="star-date">{formatDate(star.date)}</span>
                                        <span className="brightness">
                                            {'⭐'.repeat(star.brightness)}
                                        </span>
                                    </div>
                                    <div className="star-actions">
                                        <button
                                            className="view-btn"
                                            onClick={() => setShowDetailModal(star)}
                                        >
                                            {t.viewDetail}
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => deleteStar(star.id)}
                                        >
                                            {t.delete}
                                        </button>
                                    </div>
                                </div>
                                <p className="star-content">{star.content}</p>
                                {star.mood && (
                                    <span className="star-mood">
                                        {MOOD_OPTIONS.find(m => m.id === star.mood)?.emoji}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Motivation */}
            <section className="motivation-section">
                <p>{t.motivation}</p>
            </section>

            {/* Add Star Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{t.addStar}</h2>

                        <div className="form-group">
                            <label>{t.whatToRemember}</label>
                            <textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                placeholder={t.placeholder}
                                rows={3}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <div className="category-picker">
                                {(Object.keys(t.categories) as Star['category'][]).map(cat => (
                                    <button
                                        key={cat}
                                        className={`category-btn ${newCategory === cat ? 'active' : ''}`}
                                        onClick={() => setNewCategory(cat)}
                                        style={{
                                            borderColor: newCategory === cat ? CATEGORY_COLORS[cat] : 'transparent',
                                            backgroundColor: newCategory === cat ? `${CATEGORY_COLORS[cat]}30` : undefined,
                                        }}
                                    >
                                        <span>{CATEGORY_EMOJIS[cat]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t.howFeel}</label>
                            <div className="mood-picker">
                                {MOOD_OPTIONS.map(mood => (
                                    <button
                                        key={mood.id}
                                        className={`mood-btn ${newMood === mood.id ? 'active' : ''}`}
                                        onClick={() => setNewMood(mood.id)}
                                    >
                                        {mood.emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t.brightness}</label>
                            <div className="brightness-picker">
                                {[1, 2, 3, 4, 5].map(level => (
                                    <button
                                        key={level}
                                        className={`brightness-btn ${newBrightness >= level ? 'active' : ''}`}
                                        onClick={() => setNewBrightness(level)}
                                    >
                                        ⭐
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                                {t.cancel}
                            </button>
                            <button className="save-btn" onClick={addStar}>
                                {t.saveStar}
                            </button>
                        </div>

                        <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
                    </div>
                </div>
            )}

            {/* Stats Modal */}
            {showStatsModal && (
                <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{t.stats}</h2>

                        <div className="stats-overview">
                            <div className="overview-card">
                                <span className="ov-icon">⭐</span>
                                <span className="ov-number">{stats.totalStars}</span>
                                <span className="ov-label">{t.totalStars}</span>
                            </div>
                            <div className="overview-card">
                                <span className="ov-icon">📅</span>
                                <span className="ov-number">{stats.weeklyStars}</span>
                                <span className="ov-label">{t.weeklyStars}</span>
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

                        <div className="category-breakdown">
                            <h3>{t.categoryBreakdown}</h3>
                            <div className="breakdown-list">
                                {(Object.keys(CATEGORY_EMOJIS) as Star['category'][]).map(cat => (
                                    <div key={cat} className="breakdown-item">
                                        <span className="breakdown-emoji">{CATEGORY_EMOJIS[cat]}</span>
                                        <div className="breakdown-bar">
                                            <div
                                                className="breakdown-fill"
                                                style={{
                                                    width: `${stats.totalStars > 0 ? ((stats.categoryCount[cat] || 0) / stats.totalStars) * 100 : 0}%`,
                                                    backgroundColor: CATEGORY_COLORS[cat],
                                                }}
                                            />
                                        </div>
                                        <span className="breakdown-count">{stats.categoryCount[cat] || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="close-btn" onClick={() => setShowStatsModal(false)}>×</button>
                    </div>
                </div>
            )}

            {/* Star Detail Modal */}
            {showDetailModal && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
                    <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="detail-header">
                            <span className="detail-emoji">{CATEGORY_EMOJIS[showDetailModal.category]}</span>
                            <span
                                className="detail-category"
                                style={{ color: CATEGORY_COLORS[showDetailModal.category] }}
                            >
                                {t.categories[showDetailModal.category]}
                            </span>
                        </div>

                        <div className="detail-brightness">
                            {'⭐'.repeat(showDetailModal.brightness)}
                        </div>

                        <p className="detail-content">{showDetailModal.content}</p>

                        {showDetailModal.mood && (
                            <div className="detail-mood">
                                {MOOD_OPTIONS.find(m => m.id === showDetailModal.mood)?.emoji}
                            </div>
                        )}

                        <div className="detail-date">
                            {t.createdOn}: {formatDate(showDetailModal.date)}
                        </div>

                        <button className="close-btn" onClick={() => setShowDetailModal(null)}>×</button>
                    </div>
                </div>
            )}

            {/* Create Constellation Modal */}
            {showConstellationModal && (
                <div className="modal-overlay" onClick={() => setShowConstellationModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{t.createConstellation}</h2>

                        <div className="form-group">
                            <label>{t.constellationName}</label>
                            <input
                                type="text"
                                value={newConstellationName}
                                onChange={(e) => setNewConstellationName(e.target.value)}
                                placeholder="My First Constellation"
                            />
                        </div>

                        <div className="form-group">
                            <label>{t.selectStars} ({selectedStarIds.length} selected)</label>
                            <div className="constellation-star-picker">
                                {stars.map(star => (
                                    <button
                                        key={star.id}
                                        className={`picker-star ${selectedStarIds.includes(star.id) ? 'selected' : ''}`}
                                        onClick={() => toggleStarSelection(star.id)}
                                        style={{
                                            borderColor: selectedStarIds.includes(star.id)
                                                ? CATEGORY_COLORS[star.category]
                                                : 'transparent'
                                        }}
                                    >
                                        {CATEGORY_EMOJIS[star.category]}
                                        <span className="picker-preview">
                                            {star.content.slice(0, 20)}...
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowConstellationModal(false)}>
                                {t.cancel}
                            </button>
                            <button
                                className="save-btn"
                                onClick={createConstellation}
                                disabled={selectedStarIds.length < 2 || !newConstellationName.trim()}
                            >
                                {t.save}
                            </button>
                        </div>

                        <button className="close-btn" onClick={() => setShowConstellationModal(false)}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
}
