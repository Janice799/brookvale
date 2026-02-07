'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import './karma-ripple.css';

// ==================== TYPES ====================
interface KindAct {
    id: string;
    text: string;
    date: string;
    ripples: number;
    category: 'help' | 'gift' | 'kindness' | 'environment' | 'gratitude';
}

interface KarmaStats {
    currentStreak: number;
    longestStreak: number;
    lastDate: string;
    karmaLevel: number;
    totalKarmaPoints: number;
}

// ==================== CONSTANTS ====================
const CATEGORY_EMOJIS = {
    help: '🤝',
    gift: '🎁',
    kindness: '💝',
    environment: '🌍',
    gratitude: '🙏',
};

const CATEGORY_COLORS = {
    help: '#3498DB',
    gift: '#E91E63',
    kindness: '#FF6B6B',
    environment: '#4CAF50',
    gratitude: '#9B59B6',
};

// Karma Levels
interface KarmaLevel {
    level: number;
    emoji: string;
    nameEn: string;
    nameKo: string;
    minPoints: number;
}

const KARMA_LEVELS: KarmaLevel[] = [
    { level: 1, emoji: '🌱', nameEn: 'Seedling', nameKo: '씨앗', minPoints: 0 },
    { level: 2, emoji: '🌿', nameEn: 'Sprout', nameKo: '새싹', minPoints: 10 },
    { level: 3, emoji: '🌻', nameEn: 'Bloom', nameKo: '꽃봉오리', minPoints: 25 },
    { level: 4, emoji: '🌳', nameEn: 'Tree', nameKo: '나무', minPoints: 50 },
    { level: 5, emoji: '🌟', nameEn: 'Star', nameKo: '별', minPoints: 100 },
    { level: 6, emoji: '💎', nameEn: 'Diamond', nameKo: '다이아몬드', minPoints: 200 },
    { level: 7, emoji: '👼', nameEn: 'Angel', nameKo: '천사', minPoints: 500 },
    { level: 8, emoji: '🌈', nameEn: 'Rainbow', nameKo: '무지개', minPoints: 1000 },
];

// Inspiration quotes
const INSPIRATION_QUOTES = {
    en: [
        { text: "No act of kindness, no matter how small, is ever wasted.", author: "Aesop" },
        { text: "Be the change you wish to see in the world.", author: "Gandhi" },
        { text: "Kindness is a language the deaf can hear and the blind can see.", author: "Mark Twain" },
        { text: "In a world where you can be anything, be kind.", author: "Unknown" },
        { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Gandhi" },
        { text: "A single act of kindness throws out roots in all directions.", author: "Amelia Earhart" },
        { text: "Carry out a random act of kindness today.", author: "Princess Diana" },
        { text: "Kindness is the sunshine in which virtue grows.", author: "Robert Green Ingersoll" },
    ],
    ko: [
        { text: "아무리 작은 친절이라도 결코 헛되지 않습니다.", author: "이솝" },
        { text: "세상에서 보고 싶은 변화가 되세요.", author: "간디" },
        { text: "친절은 귀머거리도 듣고 눈먼 이도 볼 수 있는 언어입니다.", author: "마크 트웨인" },
        { text: "무엇이든 될 수 있는 세상에서, 친절해지세요.", author: "Unknown" },
        { text: "자신을 찾는 가장 좋은 방법은 남을 위해 자신을 잃는 것입니다.", author: "간디" },
        { text: "하나의 친절한 행동은 모든 방향으로 뿌리를 내립니다.", author: "아멜리아 에어하트" },
        { text: "오늘 무작위 친절을 행하세요.", author: "다이애나 공주" },
        { text: "친절은 덕이 자라는 햇빛입니다.", author: "로버트 그린 잉거솔" },
    ],
};

// Kindness suggestions
const KINDNESS_SUGGESTIONS = {
    en: [
        '🌸 Leave an encouraging note for someone',
        '☕ Buy coffee for the next person in line',
        '🧹 Pick up litter on your walk',
        '📞 Call a friend you haven\'t talked to',
        '🎁 Make a small handmade gift',
        '🤗 Give someone a sincere compliment',
        '🌳 Plant a flower or tree',
        '📖 Donate a book you loved',
        '🍪 Bake something for a neighbor',
        '💌 Write a thank-you letter',
    ],
    ko: [
        '🌸 누군가에게 응원의 메모를 남겨주세요',
        '☕ 다음 순서 사람에게 커피를 사주세요',
        '🧹 산책하며 쓰레기를 주워보세요',
        '📞 오랫동안 연락 못한 친구에게 전화하세요',
        '🎁 작은 수제 선물을 만들어보세요',
        '🤗 누군가에게 진심 어린 칭찬을 해주세요',
        '🌳 꽃이나 나무를 심어보세요',
        '📖 좋아했던 책을 기부하세요',
        '🍪 이웃에게 무언가를 구워주세요',
        '💌 감사 편지를 써보세요',
    ],
};

const translations = {
    en: {
        title: 'Karma Ripple',
        back: '← Brookvale',
        sendKindness: 'Send Kindness into the World',
        whatDidYou: 'What kind act did you do today?',
        placeholder: 'I helped someone carry their groceries...',
        categories: {
            help: '🤝 Helping',
            gift: '🎁 Giving',
            kindness: '💝 Kindness',
            environment: '🌍 Environment',
            gratitude: '🙏 Gratitude',
        },
        createRipple: '💧 Create Ripple',
        myRipples: 'My Karma Ripples',
        rippleStats: 'Ripple Impact',
        totalRipples: 'Total Ripples',
        currentStreak: 'Current Streak',
        longestStreak: 'Longest Streak',
        kindActs: 'Kind Acts',
        empty: 'Start creating ripples of kindness!',
        rippleEffect: 'ripple effect',
        days: 'days',
        questComplete: 'Ripple Created!',
        acornsEarned: '+5 Acorns',
        motivation: '💧 One drop creates infinite ripples',
        today: 'Today',
        thisWeek: 'This Week',
        delete: '×',
        karmaLevel: 'Karma Level',
        weeklyHeatmap: 'This Week\'s Kindness',
        inspiration: 'Daily Inspiration',
        suggestion: 'Today\'s Kindness Idea',
        newSuggestion: 'Another idea',
        pointsToNext: 'points to next level',
        categoryStats: 'Kindness by Category',
        milestones: 'Milestones',
        filter: 'Filter',
        all: 'All',
    },
    ko: {
        title: '카르마 리플',
        back: '← 브룩베일',
        sendKindness: '세상에 친절을 보내세요',
        whatDidYou: '오늘 어떤 착한 일을 했나요?',
        placeholder: '누군가의 짐을 들어줬어요...',
        categories: {
            help: '🤝 도움',
            gift: '🎁 선물',
            kindness: '💝 친절',
            environment: '🌍 환경',
            gratitude: '🙏 감사',
        },
        createRipple: '💧 리플 만들기',
        myRipples: '나의 카르마 리플',
        rippleStats: '리플 임팩트',
        totalRipples: '총 리플',
        currentStreak: '현재 연속',
        longestStreak: '최장 연속',
        kindActs: '착한 행동',
        empty: '친절의 파동을 만들어보세요!',
        rippleEffect: '파급 효과',
        days: '일',
        questComplete: '리플 생성!',
        acornsEarned: '+5 도토리',
        motivation: '💧 한 방울이 무한한 파동을 만듭니다',
        today: '오늘',
        thisWeek: '이번 주',
        delete: '×',
        karmaLevel: '카르마 레벨',
        weeklyHeatmap: '이번 주 친절',
        inspiration: '오늘의 영감',
        suggestion: '오늘의 친절 아이디어',
        newSuggestion: '다른 아이디어',
        pointsToNext: '다음 레벨까지',
        categoryStats: '카테고리별 친절',
        milestones: '마일스톤',
        filter: '필터',
        all: '전체',
    },
};

// ==================== COMPONENT ====================
export default function KarmaRipplePage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [kindActs, setKindActs] = useState<KindAct[]>([]);
    const [newActText, setNewActText] = useState('');
    const [newCategory, setNewCategory] = useState<KindAct['category']>('kindness');
    const [showRippleAnimation, setShowRippleAnimation] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const [stats, setStats] = useState<KarmaStats>({
        currentStreak: 0,
        longestStreak: 0,
        lastDate: '',
        karmaLevel: 1,
        totalKarmaPoints: 0,
    });
    const [filterCategory, setFilterCategory] = useState<KindAct['category'] | 'all'>('all');
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const pondRef = useRef<HTMLDivElement>(null);

    // Use global acorn system
    const { balance: totalAcorns, earn: earnAcorns } = useAcornStore(language);

    const t = translations[language];

    // Load data
    useEffect(() => {
        const saved = localStorage.getItem('karmaRippleDataV2');
        if (saved) {
            const data = JSON.parse(saved);
            setKindActs(data.kindActs || []);
            setStats(data.stats || {
                currentStreak: 0,
                longestStreak: 0,
                lastDate: '',
                karmaLevel: 1,
                totalKarmaPoints: 0,
            });
        }
        // Random suggestion
        setSuggestionIndex(Math.floor(Math.random() * KINDNESS_SUGGESTIONS.en.length));
    }, []);

    // Save data
    useEffect(() => {
        localStorage.setItem('karmaRippleDataV2', JSON.stringify({
            kindActs,
            stats,
        }));
    }, [kindActs, stats]);

    // Computed values
    const totalRipples = kindActs.reduce((sum, act) => sum + act.ripples, 0);

    // Get current karma level
    const currentLevel = useMemo(() => {
        const pts = stats.totalKarmaPoints;
        for (let i = KARMA_LEVELS.length - 1; i >= 0; i--) {
            if (pts >= KARMA_LEVELS[i].minPoints) return KARMA_LEVELS[i];
        }
        return KARMA_LEVELS[0];
    }, [stats.totalKarmaPoints]);

    const nextLevel = useMemo(() => {
        const idx = KARMA_LEVELS.findIndex(l => l.level === currentLevel.level);
        return idx < KARMA_LEVELS.length - 1 ? KARMA_LEVELS[idx + 1] : null;
    }, [currentLevel]);

    const levelProgress = useMemo(() => {
        if (!nextLevel) return 100;
        const range = nextLevel.minPoints - currentLevel.minPoints;
        const progress = stats.totalKarmaPoints - currentLevel.minPoints;
        return Math.min(100, Math.round((progress / range) * 100));
    }, [currentLevel, nextLevel, stats.totalKarmaPoints]);

    // Weekly heatmap data
    const weeklyData = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayActs = kindActs.filter(a => a.date.split('T')[0] === dateStr);
            days.push({
                date: dateStr,
                dayName: language === 'ko'
                    ? ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
                    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
                count: dayActs.length,
                ripples: dayActs.reduce((s, a) => s + a.ripples, 0),
                isToday: i === 0,
            });
        }
        return days;
    }, [kindActs, language]);

    // Category breakdown
    const categoryBreakdown = useMemo(() => {
        const counts: Record<string, number> = {};
        kindActs.forEach(a => {
            counts[a.category] = (counts[a.category] || 0) + 1;
        });
        return counts;
    }, [kindActs]);

    // Daily inspiration
    const todaysQuote = useMemo(() => {
        const idx = new Date().getDate() % INSPIRATION_QUOTES[language].length;
        return INSPIRATION_QUOTES[language][idx];
    }, [language]);

    // Create ripple
    const createRipple = useCallback(() => {
        if (!newActText.trim()) return;

        const ripples = Math.floor(Math.random() * 5) + 1;
        const karmaPoints = ripples + (newActText.length > 50 ? 2 : 1); // Bonus for detailed descriptions

        const newAct: KindAct = {
            id: Date.now().toString(),
            text: newActText,
            date: new Date().toISOString(),
            ripples,
            category: newCategory,
        };

        setKindActs(prev => [newAct, ...prev]);
        setNewActText('');

        // Update stats
        const today = new Date().toISOString().split('T')[0];
        setStats(prev => {
            const isNewDay = prev.lastDate !== today;
            const isConsecutive = (() => {
                if (!prev.lastDate) return true;
                const last = new Date(prev.lastDate);
                const diff = Math.floor((new Date(today).getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
                return diff <= 1;
            })();

            const newStreak = isNewDay
                ? (isConsecutive ? prev.currentStreak + 1 : 1)
                : prev.currentStreak;

            const newTotal = prev.totalKarmaPoints + karmaPoints;

            return {
                currentStreak: newStreak,
                longestStreak: Math.max(prev.longestStreak, newStreak),
                lastDate: today,
                karmaLevel: currentLevel.level,
                totalKarmaPoints: newTotal,
            };
        });

        // Show animation
        setShowRippleAnimation(true);
        setTimeout(() => setShowRippleAnimation(false), 2000);

        // Award acorns
        earnAcorns(5, 'Karma Ripple');
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2500);
    }, [newActText, newCategory, currentLevel, earnAcorns]);

    // Delete act
    const deleteAct = useCallback((id: string) => {
        setKindActs(prev => prev.filter(act => act.id !== id));
    }, []);

    // Get new suggestion
    const getNewSuggestion = useCallback(() => {
        setSuggestionIndex(prev => (prev + 1) % KINDNESS_SUGGESTIONS[language].length);
    }, [language]);

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) return t.today;
        return language === 'ko'
            ? `${date.getMonth() + 1}월 ${date.getDate()}일`
            : date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    // Filtered acts
    const filteredActs = filterCategory === 'all'
        ? kindActs
        : kindActs.filter(a => a.category === filterCategory);

    return (
        <div className="karma-ripple-app">
            {/* Reward Toast */}
            {showReward && (
                <div className="reward-toast">
                    <span className="toast-icon">💧</span>
                    <div className="toast-content">
                        <div className="toast-title">{t.questComplete}</div>
                        <div className="toast-reward">{t.acornsEarned}</div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <a href="/" className="back-link">{t.back}</a>
                <h1>💧 {t.title}</h1>
                <div className="header-right">
                    <button
                        className="lang-toggle"
                        onClick={() => setLanguage(l => l === 'en' ? 'ko' : 'en')}
                    >
                        {language === 'en' ? '한국어' : 'EN'}
                    </button>
                    <span className="acorn-badge">🌰 {totalAcorns}</span>
                </div>
            </header>

            {/* Karma Level Card */}
            <section className="karma-level-section">
                <div className="karma-level-card">
                    <div className="level-emoji">{currentLevel.emoji}</div>
                    <div className="level-info">
                        <div className="level-name">
                            {language === 'ko' ? currentLevel.nameKo : currentLevel.nameEn}
                        </div>
                        <div className="level-label">
                            Lv.{currentLevel.level} • {stats.totalKarmaPoints} pts
                        </div>
                    </div>
                    <div className="level-progress-container">
                        <div className="level-progress-bar">
                            <div
                                className="level-progress-fill"
                                style={{ width: `${levelProgress}%` }}
                            />
                        </div>
                        {nextLevel && (
                            <div className="level-next">
                                {nextLevel.emoji} {nextLevel.minPoints - stats.totalKarmaPoints} {t.pointsToNext}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Pond Animation */}
            <section className="pond-section">
                <div className={`pond ${showRippleAnimation ? 'animating' : ''}`} ref={pondRef}>
                    <div className="water-surface">
                        {showRippleAnimation && (
                            <>
                                <div className="ripple ripple-1" />
                                <div className="ripple ripple-2" />
                                <div className="ripple ripple-3" />
                                <div className="ripple ripple-4" />
                            </>
                        )}
                        <span className="pond-emoji">💧</span>
                    </div>
                    <div className="pond-reflection" />
                </div>
                <p className="pond-label">{t.sendKindness}</p>
            </section>

            {/* Ripple Stats */}
            <section className="stats-section">
                <h2>{t.rippleStats}</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-icon">💧</span>
                        <span className="stat-value">{totalRipples}</span>
                        <span className="stat-label">{t.totalRipples}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-icon">🔥</span>
                        <span className="stat-value">{stats.currentStreak}</span>
                        <span className="stat-label">{t.currentStreak}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-icon">🏆</span>
                        <span className="stat-value">{stats.longestStreak}</span>
                        <span className="stat-label">{t.longestStreak}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-icon">💝</span>
                        <span className="stat-value">{kindActs.length}</span>
                        <span className="stat-label">{t.kindActs}</span>
                    </div>
                </div>
            </section>

            {/* Weekly Heatmap */}
            <section className="heatmap-section">
                <h3>{t.weeklyHeatmap}</h3>
                <div className="heatmap-row">
                    {weeklyData.map((day, i) => (
                        <div key={i} className={`heatmap-cell ${day.isToday ? 'today' : ''}`}>
                            <div
                                className="heatmap-dot"
                                style={{
                                    backgroundColor: day.count === 0
                                        ? 'rgba(255,255,255,0.08)'
                                        : day.count === 1
                                            ? 'rgba(78, 205, 196, 0.4)'
                                            : day.count === 2
                                                ? 'rgba(78, 205, 196, 0.7)'
                                                : '#4ECDC4',
                                    transform: `scale(${Math.min(1.3, 0.6 + day.count * 0.25)})`,
                                }}
                            />
                            <span className="heatmap-day">{day.dayName}</span>
                            {day.count > 0 && (
                                <span className="heatmap-count">{day.count}</span>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Category Breakdown */}
            {kindActs.length > 0 && (
                <section className="category-breakdown">
                    <h3>{t.categoryStats}</h3>
                    <div className="breakdown-bars">
                        {(Object.keys(CATEGORY_EMOJIS) as KindAct['category'][]).map(cat => {
                            const count = categoryBreakdown[cat] || 0;
                            const pct = kindActs.length > 0 ? (count / kindActs.length) * 100 : 0;
                            return (
                                <div key={cat} className="breakdown-row">
                                    <span className="breakdown-emoji">{CATEGORY_EMOJIS[cat]}</span>
                                    <div className="breakdown-bar-track">
                                        <div
                                            className="breakdown-bar-fill"
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor: CATEGORY_COLORS[cat],
                                            }}
                                        />
                                    </div>
                                    <span className="breakdown-count">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Daily Inspiration */}
            <section className="inspiration-section">
                <h3>{t.inspiration}</h3>
                <div className="inspiration-card">
                    <p className="inspiration-text">&ldquo;{todaysQuote.text}&rdquo;</p>
                    <p className="inspiration-author">— {todaysQuote.author}</p>
                </div>
            </section>

            {/* Kindness Suggestion */}
            <section className="suggestion-section">
                <h3>{t.suggestion}</h3>
                <div className="suggestion-card">
                    <p className="suggestion-text">
                        {KINDNESS_SUGGESTIONS[language][suggestionIndex]}
                    </p>
                    <button className="suggestion-btn" onClick={getNewSuggestion}>
                        🔄 {t.newSuggestion}
                    </button>
                </div>
            </section>

            {/* Create Ripple Section */}
            <section className="create-section">
                <h2>{t.whatDidYou}</h2>

                <textarea
                    value={newActText}
                    onChange={(e) => setNewActText(e.target.value)}
                    placeholder={t.placeholder}
                    rows={3}
                />

                <div className="category-picker">
                    {(Object.keys(t.categories) as KindAct['category'][]).map(cat => (
                        <button
                            key={cat}
                            className={`category-btn ${newCategory === cat ? 'active' : ''}`}
                            onClick={() => setNewCategory(cat)}
                            style={{
                                borderColor: newCategory === cat ? CATEGORY_COLORS[cat] : 'transparent',
                                backgroundColor: newCategory === cat ? `${CATEGORY_COLORS[cat]}20` : undefined,
                            }}
                        >
                            {CATEGORY_EMOJIS[cat]}
                            <span className="cat-label">
                                {language === 'ko'
                                    ? t.categories[cat].replace(/[^\w\s가-힣]/g, '').trim()
                                    : t.categories[cat].replace(/[^\w\s]/g, '').trim()
                                }
                            </span>
                        </button>
                    ))}
                </div>

                <button
                    className="create-btn"
                    onClick={createRipple}
                    disabled={!newActText.trim()}
                >
                    {t.createRipple}
                </button>
            </section>

            {/* Kind Acts List */}
            <section className="acts-section">
                <div className="acts-header">
                    <h2>{t.myRipples}</h2>
                    <div className="filter-pills">
                        <button
                            className={`filter-pill ${filterCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('all')}
                        >
                            {t.all}
                        </button>
                        {(Object.keys(CATEGORY_EMOJIS) as KindAct['category'][]).map(cat => (
                            <button
                                key={cat}
                                className={`filter-pill ${filterCategory === cat ? 'active' : ''}`}
                                onClick={() => setFilterCategory(cat)}
                            >
                                {CATEGORY_EMOJIS[cat]}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredActs.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🌊</span>
                        <p>{t.empty}</p>
                    </div>
                ) : (
                    <div className="acts-list">
                        {filteredActs.slice(0, 15).map(act => (
                            <div key={act.id} className="act-card">
                                <div className="act-header">
                                    <span
                                        className="act-emoji"
                                        style={{ backgroundColor: `${CATEGORY_COLORS[act.category]}30` }}
                                    >
                                        {CATEGORY_EMOJIS[act.category]}
                                    </span>
                                    <div className="act-meta">
                                        <span className="act-date">{formatDate(act.date)}</span>
                                        <span className="ripple-count">
                                            💧 ×{act.ripples} {t.rippleEffect}
                                        </span>
                                    </div>
                                    <button
                                        className="delete-btn"
                                        onClick={() => deleteAct(act.id)}
                                    >
                                        {t.delete}
                                    </button>
                                </div>
                                <p className="act-text">{act.text}</p>
                                <div className="ripple-visualization">
                                    {[...Array(act.ripples)].map((_, i) => (
                                        <span
                                            key={i}
                                            className="ripple-dot"
                                            style={{
                                                animationDelay: `${i * 0.2}s`,
                                                backgroundColor: CATEGORY_COLORS[act.category],
                                            }}
                                        />
                                    ))}
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
        </div>
    );
}
