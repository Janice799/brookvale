'use client';

import { useState, useEffect, useCallback } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import './dream-catcher.css';

// ==================== TYPES ====================
interface Dream {
    id: string;
    content: string;
    date: string;
    mood: 'happy' | 'sad' | 'scary' | 'weird' | 'peaceful' | 'exciting';
    symbols: string[];
    recurring: boolean;
    lucid?: boolean;
    clarity?: number; // 1-5
}

interface DreamStats {
    totalDreams: number;
    weeklyDreams: number;
    streak: number;
    bestStreak: number;
    recurringCount: number;
    lucidCount: number;
    moodCounts: Record<string, number>;
}

// ==================== CONSTANTS ====================
const MOOD_EMOJIS = {
    happy: '😊',
    sad: '😢',
    scary: '😨',
    weird: '🤔',
    peaceful: '😌',
    exciting: '🤩',
};

const MOOD_COLORS = {
    happy: '#FFD700',
    sad: '#5D5D8D',
    scary: '#8B0000',
    weird: '#9B59B6',
    peaceful: '#87CEEB',
    exciting: '#FF6B6B',
};

const SYMBOL_OPTIONS = ['🌙', '⭐', '🌊', '🏠', '🚗', '✈️', '🐱', '🐕', '🦋', '🌸', '🌳', '⛰️', '🔥', '💎', '👤', '💀', '🚪', '🔑', '📚', '💰'];

const SYMBOL_MEANINGS: Record<string, { en: string; ko: string }> = {
    '🌙': { en: 'Moon: Intuition, feminine energy, cycles', ko: '달: 직관, 여성 에너지, 순환' },
    '⭐': { en: 'Star: Hopes, dreams, guidance', ko: '별: 희망, 꿈, 안내' },
    '🌊': { en: 'Water: Emotions, subconscious, change', ko: '물: 감정, 잠재의식, 변화' },
    '🏠': { en: 'House: Self, security, family', ko: '집: 자아, 안전, 가족' },
    '🚗': { en: 'Car: Journey, control, direction in life', ko: '자동차: 여정, 통제, 삶의 방향' },
    '✈️': { en: 'Airplane: Ambition, freedom, transcendence', ko: '비행기: 야망, 자유, 초월' },
    '🐱': { en: 'Cat: Independence, intuition, mystery', ko: '고양이: 독립, 직관, 신비' },
    '🐕': { en: 'Dog: Loyalty, protection, friendship', ko: '개: 충성, 보호, 우정' },
    '🦋': { en: 'Butterfly: Transformation, beauty, soul', ko: '나비: 변신, 아름다움, 영혼' },
    '🌸': { en: 'Flower: Growth, love, beauty', ko: '꽃: 성장, 사랑, 아름다움' },
    '🌳': { en: 'Tree: Growth, life, connection', ko: '나무: 성장, 생명, 연결' },
    '⛰️': { en: 'Mountain: Obstacles, achievement, perspective', ko: '산: 장애물, 성취, 관점' },
    '🔥': { en: 'Fire: Passion, transformation, destruction', ko: '불: 열정, 변화, 파괴' },
    '💎': { en: 'Diamond: Value, clarity, permanence', ko: '다이아몬드: 가치, 명료함, 영속성' },
    '👤': { en: 'Person: Aspect of self, relationship', ko: '사람: 자아의 측면, 관계' },
    '💀': { en: 'Skull: End of something, transformation', ko: '해골: 무언가의 끝, 변화' },
    '🚪': { en: 'Door: Opportunity, transition, choice', ko: '문: 기회, 전환, 선택' },
    '🔑': { en: 'Key: Solution, access, secrets', ko: '열쇠: 해결책, 접근, 비밀' },
    '📚': { en: 'Books: Knowledge, learning, wisdom', ko: '책: 지식, 학습, 지혜' },
    '💰': { en: 'Money: Value, security, self-worth', ko: '돈: 가치, 안전, 자존감' },
};

const STORAGE_KEY = 'dreamCatcherV2';

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        title: 'Dream Catcher',
        back: '← Brookvale',
        recordDream: 'Catch Your Dream',
        whatDreamed: 'What did you dream last night?',
        placeholder: 'I was flying over a purple ocean...',
        howFeel: 'How did it feel?',
        moods: {
            happy: 'Happy',
            sad: 'Sad',
            scary: 'Scary',
            weird: 'Weird',
            peaceful: 'Peaceful',
            exciting: 'Exciting',
        },
        symbols: 'Dream Symbols',
        recurring: 'Recurring Dream?',
        lucid: 'Lucid Dream?',
        clarity: 'Dream Clarity',
        yes: 'Yes',
        no: 'No',
        saveDream: '🌙 Catch This Dream',
        dreamJournal: 'Dream Journal',
        empty: 'No dreams caught yet. Rest well tonight!',
        showInterpretation: 'Interpret Dream',
        interpretation: 'Dream Insight',
        questComplete: 'Dream Caught!',
        acornsEarned: '+8 Acorns',
        motivation: '✨ Dreams are whispers from your soul',
        thisWeek: 'This Week',
        dreams: 'dreams',
        mostCommon: 'Most Common',
        delete: '×',
        stats: '📊 Statistics',
        totalDreams: 'Total Dreams',
        streak: 'Recording Streak',
        bestStreak: 'Best Streak',
        lucidDreams: 'Lucid Dreams',
        recurringDreams: 'Recurring',
        moodBreakdown: 'Mood Breakdown',
        symbolMeaning: 'Symbol Meanings',
        viewDetail: 'View',
        close: 'Close',
        filterBy: 'Filter',
        all: 'All',
        filterLucid: 'Lucid Only',
        filterRecurring: 'Recurring Only',
        searchPlaceholder: 'Search dreams...',
        days: 'days',
    },
    ko: {
        title: '드림 캐처',
        back: '← 브룩베일',
        recordDream: '꿈을 붙잡으세요',
        whatDreamed: '어젯밤 무슨 꿈을 꿨나요?',
        placeholder: '보라색 바다 위를 날고 있었어요...',
        howFeel: '기분이 어땠나요?',
        moods: {
            happy: '행복',
            sad: '슬픔',
            scary: '무서움',
            weird: '이상함',
            peaceful: '평화',
            exciting: '신남',
        },
        symbols: '꿈 상징',
        recurring: '반복되는 꿈인가요?',
        lucid: '자각몽인가요?',
        clarity: '꿈의 선명도',
        yes: '예',
        no: '아니오',
        saveDream: '🌙 이 꿈 붙잡기',
        dreamJournal: '꿈 일지',
        empty: '아직 잡힌 꿈이 없어요. 오늘 밤 푹 쉬세요!',
        showInterpretation: '꿈 해석',
        interpretation: '꿈의 통찰',
        questComplete: '꿈 포착!',
        acornsEarned: '+8 도토리',
        motivation: '✨ 꿈은 영혼의 속삭임입니다',
        thisWeek: '이번 주',
        dreams: '개 꿈',
        mostCommon: '가장 흔한 심볼',
        delete: '×',
        stats: '📊 통계',
        totalDreams: '총 꿈',
        streak: '기록 연속',
        bestStreak: '최고 연속',
        lucidDreams: '자각몽',
        recurringDreams: '반복 꿈',
        moodBreakdown: '기분 분석',
        symbolMeaning: '상징 의미',
        viewDetail: '보기',
        close: '닫기',
        filterBy: '필터',
        all: '전체',
        filterLucid: '자각몽만',
        filterRecurring: '반복 꿈만',
        searchPlaceholder: '꿈 검색...',
        days: '일',
    },
};

// Dream interpretations
const INTERPRETATIONS = {
    en: {
        happy: "This positive dream reflects contentment and joy in your waking life. You may be processing good feelings or anticipating happy events.",
        sad: "Sad dreams can help you process difficult emotions. Consider what aspect of your life might need attention or healing.",
        scary: "Fear in dreams often represents anxieties about the unknown. What challenges are you facing that feel overwhelming?",
        weird: "Strange dreams indicate your mind is processing complex information. Creativity and problem-solving may be at work.",
        peaceful: "This dream suggests inner harmony. You may be finding balance in your life or need to seek more tranquility.",
        exciting: "Your subconscious is energized! This could indicate upcoming opportunities or a desire for more adventure.",
    },
    ko: {
        happy: "이 긍정적인 꿈은 깨어있는 삶에서의 만족과 기쁨을 반영합니다.",
        sad: "슬픈 꿈은 어려운 감정을 처리하는 데 도움이 됩니다.",
        scary: "꿈에서의 두려움은 종종 미지에 대한 불안을 나타냅니다.",
        weird: "이상한 꿈은 마음이 복잡한 정보를 처리하고 있음을 나타냅니다.",
        peaceful: "이 꿈은 내면의 조화를 암시합니다.",
        exciting: "잠재의식이 활력을 받고 있습니다!",
    },
};

export default function DreamCatcherPage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showSymbolModal, setShowSymbolModal] = useState<string | null>(null);
    const [showDetailModal, setShowDetailModal] = useState<Dream | null>(null);
    const [newContent, setNewContent] = useState('');
    const [newMood, setNewMood] = useState<Dream['mood']>('peaceful');
    const [newSymbols, setNewSymbols] = useState<string[]>([]);
    const [newRecurring, setNewRecurring] = useState(false);
    const [newLucid, setNewLucid] = useState(false);
    const [newClarity, setNewClarity] = useState(3);
    const [showReward, setShowReward] = useState(false);
    const [expandedDream, setExpandedDream] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'lucid' | 'recurring'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<DreamStats>({
        totalDreams: 0,
        weeklyDreams: 0,
        streak: 0,
        bestStreak: 0,
        recurringCount: 0,
        lucidCount: 0,
        moodCounts: {},
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
                setDreams(data.dreams || []);
            }
        }
    }, []);

    // Save data
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ dreams }));
        }
    }, [dreams]);

    // Calculate stats
    useEffect(() => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyDreams = dreams.filter(d => new Date(d.date) >= oneWeekAgo).length;
        const recurringCount = dreams.filter(d => d.recurring).length;
        const lucidCount = dreams.filter(d => d.lucid).length;

        const moodCounts = dreams.reduce((acc, d) => {
            acc[d.mood] = (acc[d.mood] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calculate streak
        let streak = 0;
        const today = new Date().toDateString();
        const sortedDates = [...new Set(dreams.map(d => new Date(d.date).toDateString()))]
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
            totalDreams: dreams.length,
            weeklyDreams,
            streak,
            bestStreak: Math.max(stats.bestStreak, streak),
            recurringCount,
            lucidCount,
            moodCounts,
        });
    }, [dreams, stats.bestStreak]);

    // Add dream
    const addDream = useCallback(() => {
        if (!newContent.trim()) return;

        const newDream: Dream = {
            id: Date.now().toString(),
            content: newContent,
            date: new Date().toISOString(),
            mood: newMood,
            symbols: newSymbols,
            recurring: newRecurring,
            lucid: newLucid,
            clarity: newClarity,
        };

        setDreams(prev => [newDream, ...prev]);
        setNewContent('');
        setNewMood('peaceful');
        setNewSymbols([]);
        setNewRecurring(false);
        setNewLucid(false);
        setNewClarity(3);
        setShowAddModal(false);

        earnAcorns(8, 'Dream Catcher');
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2500);
    }, [newContent, newMood, newSymbols, newRecurring, newLucid, newClarity, earnAcorns]);

    // Delete dream
    const deleteDream = useCallback((id: string) => {
        setDreams(prev => prev.filter(d => d.id !== id));
        if (showDetailModal?.id === id) setShowDetailModal(null);
    }, [showDetailModal]);

    // Toggle symbol
    const toggleSymbol = (symbol: string) => {
        setNewSymbols(prev =>
            prev.includes(symbol)
                ? prev.filter(s => s !== symbol)
                : [...prev, symbol].slice(0, 5)
        );
    };

    // Filtered dreams
    const filteredDreams = dreams.filter(d => {
        const matchesFilter = filterType === 'all' ||
            (filterType === 'lucid' && d.lucid) ||
            (filterType === 'recurring' && d.recurring);
        const matchesSearch = searchQuery === '' ||
            d.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Most common symbol
    const allSymbols = dreams.flatMap(d => d.symbols);
    const symbolCounts = allSymbols.reduce((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const mostCommonSymbol = Object.entries(symbolCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '🌙';

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return language === 'ko'
            ? `${date.getMonth() + 1}월 ${date.getDate()}일`
            : date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="dream-catcher-app">
            {/* Reward Toast */}
            {showReward && (
                <div className="reward-toast">
                    <span className="toast-icon">🌙</span>
                    <div className="toast-content">
                        <div className="toast-title">{t.questComplete}</div>
                        <div className="toast-reward">{t.acornsEarned}</div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <a href="/" className="back-link">{t.back}</a>
                <h1>🌙 {t.title}</h1>
                <div className="header-right">
                    <button className="icon-btn" onClick={() => setShowStatsModal(true)}>📊</button>
                    <span className="acorn-badge">🌰 {totalAcorns}</span>
                </div>
            </header>

            {/* Dream Catcher Visual */}
            <section className="catcher-section">
                <div className="dream-catcher-visual">
                    <div className="catcher-ring" />
                    <div className="catcher-web" />
                    <div className="catcher-center">
                        <span className="moon-emoji">🌙</span>
                    </div>
                    <div className="feathers">
                        <span className="feather">🪶</span>
                        <span className="feather">🪶</span>
                        <span className="feather">🪶</span>
                    </div>
                </div>
                <p className="catcher-label">{t.recordDream}</p>
                <button className="catch-btn" onClick={() => setShowAddModal(true)}>
                    {t.saveDream}
                </button>
            </section>

            {/* Quick Stats */}
            <section className="stats-section">
                <div className="stat-card">
                    <span className="stat-icon">📅</span>
                    <span className="stat-value">{stats.weeklyDreams}</span>
                    <span className="stat-label">{t.thisWeek}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">🔥</span>
                    <span className="stat-value">{stats.streak}</span>
                    <span className="stat-label">{t.streak}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-emoji">{mostCommonSymbol}</span>
                    <span className="stat-label">{t.mostCommon}</span>
                </div>
            </section>

            {/* Filter */}
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
                        className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        {t.all}
                    </button>
                    <button
                        className={`filter-chip ${filterType === 'lucid' ? 'active' : ''}`}
                        onClick={() => setFilterType('lucid')}
                    >
                        ✨ {t.filterLucid}
                    </button>
                    <button
                        className={`filter-chip ${filterType === 'recurring' ? 'active' : ''}`}
                        onClick={() => setFilterType('recurring')}
                    >
                        🔄 {t.filterRecurring}
                    </button>
                </div>
            </section>

            {/* Dream Journal */}
            <section className="journal-section">
                <h2>{t.dreamJournal} ({filteredDreams.length})</h2>

                {filteredDreams.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">💤</span>
                        <p>{t.empty}</p>
                    </div>
                ) : (
                    <div className="dream-list">
                        {filteredDreams.map(dream => (
                            <div
                                key={dream.id}
                                className={`dream-card ${expandedDream === dream.id ? 'expanded' : ''}`}
                                style={{ borderColor: MOOD_COLORS[dream.mood] }}
                            >
                                <div className="dream-header">
                                    <span className="mood-emoji">{MOOD_EMOJIS[dream.mood]}</span>
                                    <div className="dream-meta">
                                        <span className="dream-date">{formatDate(dream.date)}</span>
                                        <div className="dream-tags">
                                            {dream.recurring && <span className="tag recurring">🔄</span>}
                                            {dream.lucid && <span className="tag lucid">✨</span>}
                                            {dream.clarity && (
                                                <span className="tag clarity">
                                                    {'🔮'.repeat(Math.min(dream.clarity, 3))}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="dream-actions">
                                        <button
                                            className="view-btn"
                                            onClick={() => setShowDetailModal(dream)}
                                        >
                                            {t.viewDetail}
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => deleteDream(dream.id)}
                                        >
                                            {t.delete}
                                        </button>
                                    </div>
                                </div>

                                <p className="dream-content">{dream.content}</p>

                                {dream.symbols.length > 0 && (
                                    <div className="dream-symbols">
                                        {dream.symbols.map((s, i) => (
                                            <button
                                                key={i}
                                                className="symbol-tag"
                                                onClick={() => setShowSymbolModal(s)}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <button
                                    className="interpret-btn"
                                    onClick={() => setExpandedDream(
                                        expandedDream === dream.id ? null : dream.id
                                    )}
                                >
                                    {t.showInterpretation}
                                </button>

                                {expandedDream === dream.id && (
                                    <div className="interpretation-box">
                                        <h4>{t.interpretation}</h4>
                                        <p>{INTERPRETATIONS[language][dream.mood]}</p>
                                    </div>
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

            {/* Add Dream Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{t.recordDream}</h2>

                        <div className="form-group">
                            <label>{t.whatDreamed}</label>
                            <textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                placeholder={t.placeholder}
                                rows={4}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>{t.howFeel}</label>
                            <div className="mood-picker">
                                {(Object.keys(t.moods) as Dream['mood'][]).map(mood => (
                                    <button
                                        key={mood}
                                        className={`mood-btn ${newMood === mood ? 'active' : ''}`}
                                        onClick={() => setNewMood(mood)}
                                        style={{
                                            borderColor: newMood === mood ? MOOD_COLORS[mood] : 'transparent',
                                            backgroundColor: newMood === mood ? `${MOOD_COLORS[mood]}30` : undefined,
                                        }}
                                    >
                                        <span>{MOOD_EMOJIS[mood]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t.symbols} (max 5)</label>
                            <div className="symbol-picker">
                                {SYMBOL_OPTIONS.map(symbol => (
                                    <button
                                        key={symbol}
                                        className={`symbol-btn ${newSymbols.includes(symbol) ? 'active' : ''}`}
                                        onClick={() => toggleSymbol(symbol)}
                                    >
                                        {symbol}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t.clarity}</label>
                            <div className="clarity-picker">
                                {[1, 2, 3, 4, 5].map(level => (
                                    <button
                                        key={level}
                                        className={`clarity-btn ${newClarity >= level ? 'active' : ''}`}
                                        onClick={() => setNewClarity(level)}
                                    >
                                        🔮
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group toggles-row">
                            <div className="toggle-group">
                                <label>{t.recurring}</label>
                                <div className="recurring-toggle">
                                    <button
                                        className={`toggle-btn ${!newRecurring ? 'active' : ''}`}
                                        onClick={() => setNewRecurring(false)}
                                    >
                                        {t.no}
                                    </button>
                                    <button
                                        className={`toggle-btn ${newRecurring ? 'active' : ''}`}
                                        onClick={() => setNewRecurring(true)}
                                    >
                                        {t.yes}
                                    </button>
                                </div>
                            </div>
                            <div className="toggle-group">
                                <label>{t.lucid}</label>
                                <div className="recurring-toggle">
                                    <button
                                        className={`toggle-btn ${!newLucid ? 'active' : ''}`}
                                        onClick={() => setNewLucid(false)}
                                    >
                                        {t.no}
                                    </button>
                                    <button
                                        className={`toggle-btn ${newLucid ? 'active' : ''}`}
                                        onClick={() => setNewLucid(true)}
                                    >
                                        {t.yes}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                                ✕
                            </button>
                            <button className="save-btn" onClick={addDream}>
                                {t.saveDream}
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
                                <span className="ov-icon">🌙</span>
                                <span className="ov-number">{stats.totalDreams}</span>
                                <span className="ov-label">{t.totalDreams}</span>
                            </div>
                            <div className="overview-card">
                                <span className="ov-icon">🔥</span>
                                <span className="ov-number">{stats.streak}</span>
                                <span className="ov-label">{t.streak}</span>
                            </div>
                            <div className="overview-card">
                                <span className="ov-icon">✨</span>
                                <span className="ov-number">{stats.lucidCount}</span>
                                <span className="ov-label">{t.lucidDreams}</span>
                            </div>
                            <div className="overview-card">
                                <span className="ov-icon">🔄</span>
                                <span className="ov-number">{stats.recurringCount}</span>
                                <span className="ov-label">{t.recurringDreams}</span>
                            </div>
                        </div>

                        <div className="mood-breakdown">
                            <h3>{t.moodBreakdown}</h3>
                            <div className="breakdown-list">
                                {(Object.keys(MOOD_EMOJIS) as Dream['mood'][]).map(mood => (
                                    <div key={mood} className="breakdown-item">
                                        <span className="breakdown-emoji">{MOOD_EMOJIS[mood]}</span>
                                        <div className="breakdown-bar">
                                            <div
                                                className="breakdown-fill"
                                                style={{
                                                    width: `${stats.totalDreams > 0 ? ((stats.moodCounts[mood] || 0) / stats.totalDreams) * 100 : 0}%`,
                                                    backgroundColor: MOOD_COLORS[mood],
                                                }}
                                            />
                                        </div>
                                        <span className="breakdown-count">{stats.moodCounts[mood] || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="close-btn" onClick={() => setShowStatsModal(false)}>×</button>
                    </div>
                </div>
            )}

            {/* Symbol Meaning Modal */}
            {showSymbolModal && (
                <div className="modal-overlay" onClick={() => setShowSymbolModal(null)}>
                    <div className="modal-content symbol-modal" onClick={e => e.stopPropagation()}>
                        <div className="symbol-detail-emoji">{showSymbolModal}</div>
                        <h2>{t.symbolMeaning}</h2>
                        <p className="symbol-meaning">
                            {SYMBOL_MEANINGS[showSymbolModal]?.[language] || 'Unknown symbol'}
                        </p>
                        <button className="close-btn" onClick={() => setShowSymbolModal(null)}>×</button>
                    </div>
                </div>
            )}

            {/* Dream Detail Modal */}
            {showDetailModal && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
                    <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="detail-header">
                            <span className="detail-emoji">{MOOD_EMOJIS[showDetailModal.mood]}</span>
                            <span
                                className="detail-mood"
                                style={{ color: MOOD_COLORS[showDetailModal.mood] }}
                            >
                                {t.moods[showDetailModal.mood]}
                            </span>
                        </div>

                        <div className="detail-tags">
                            {showDetailModal.recurring && <span className="detail-tag">🔄 {t.recurringDreams}</span>}
                            {showDetailModal.lucid && <span className="detail-tag">✨ {t.lucidDreams}</span>}
                            {showDetailModal.clarity && (
                                <span className="detail-tag clarity">
                                    {t.clarity}: {'🔮'.repeat(showDetailModal.clarity)}
                                </span>
                            )}
                        </div>

                        <p className="detail-content">{showDetailModal.content}</p>

                        {showDetailModal.symbols.length > 0 && (
                            <div className="detail-symbols">
                                {showDetailModal.symbols.map((s, i) => (
                                    <button
                                        key={i}
                                        className="symbol-tag clickable"
                                        onClick={() => {
                                            setShowDetailModal(null);
                                            setShowSymbolModal(s);
                                        }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="interpretation-box">
                            <h4>{t.interpretation}</h4>
                            <p>{INTERPRETATIONS[language][showDetailModal.mood]}</p>
                        </div>

                        <div className="detail-date">{formatDate(showDetailModal.date)}</div>

                        <button className="close-btn" onClick={() => setShowDetailModal(null)}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
}
