'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import './menu-oracle.css';

// ==================== TYPES ====================
interface MenuOption {
    id: string;
    text: string;
    emoji?: string;
}

interface Decision {
    id: string;
    question: string;
    answer: string;
    date: string;
    category?: string;
}

interface WeeklyStats {
    totalDecisions: number;
    favoriteCategory: string;
    decisiveness: number; // Average time to decide (fake metric for fun)
}

// ==================== ORACLE MESSAGES ====================
const ORACLE_MESSAGES = {
    en: [
        "The stars align in favor of...",
        "The mystic waters reveal...",
        "The ancient wisdom points to...",
        "Your destiny chooses...",
        "The cosmic forces suggest...",
        "The oracle has spoken:",
        "The universe whispers...",
        "The crystal ball shows...",
        "Fate has decided...",
        "The runes spell out...",
    ],
    ko: [
        "별들이 가리키는 것은...",
        "신비로운 물이 보여주는 것은...",
        "고대의 지혜가 가리키는 것은...",
        "당신의 운명이 선택한 것은...",
        "우주의 힘이 말하길...",
        "신탁이 말합니다:",
        "우주가 속삭이길...",
        "수정구가 보여주는 것은...",
        "운명은 결정했습니다...",
        "룬 문자가 그리는 것은...",
    ],
};

// ==================== PRESET CATEGORIES ====================
interface PresetCategory {
    id: string;
    emoji: string;
    nameEn: string;
    nameKo: string;
    options: { en: string; ko: string; emoji: string }[];
}

const PRESET_CATEGORIES: PresetCategory[] = [
    {
        id: 'food',
        emoji: '🍽️',
        nameEn: 'Food',
        nameKo: '음식',
        options: [
            { en: 'Korean BBQ', ko: '삼겹살', emoji: '🥩' },
            { en: 'Pizza', ko: '피자', emoji: '🍕' },
            { en: 'Sushi', ko: '초밥', emoji: '🍣' },
            { en: 'Burger', ko: '버거', emoji: '🍔' },
            { en: 'Ramen', ko: '라멘', emoji: '🍜' },
            { en: 'Salad', ko: '샐러드', emoji: '🥗' },
            { en: 'Pasta', ko: '파스타', emoji: '🍝' },
            { en: 'Chicken', ko: '치킨', emoji: '🍗' },
        ],
    },
    {
        id: 'drink',
        emoji: '☕',
        nameEn: 'Drinks',
        nameKo: '음료',
        options: [
            { en: 'Coffee', ko: '커피', emoji: '☕' },
            { en: 'Bubble Tea', ko: '버블티', emoji: '🧋' },
            { en: 'Smoothie', ko: '스무디', emoji: '🥤' },
            { en: 'Hot Chocolate', ko: '핫초코', emoji: '🍫' },
            { en: 'Green Tea', ko: '녹차', emoji: '🍵' },
            { en: 'Juice', ko: '주스', emoji: '🧃' },
        ],
    },
    {
        id: 'activity',
        emoji: '🎯',
        nameEn: 'Activities',
        nameKo: '활동',
        options: [
            { en: 'Watch a movie', ko: '영화 보기', emoji: '🎬' },
            { en: 'Read a book', ko: '독서', emoji: '📚' },
            { en: 'Go for a walk', ko: '산책', emoji: '🚶' },
            { en: 'Play games', ko: '게임', emoji: '🎮' },
            { en: 'Draw/Paint', ko: '그림 그리기', emoji: '🎨' },
            { en: 'Listen to music', ko: '음악 듣기', emoji: '🎵' },
        ],
    },
    {
        id: 'movie',
        emoji: '🎬',
        nameEn: 'Movie Genre',
        nameKo: '영화 장르',
        options: [
            { en: 'Comedy', ko: '코미디', emoji: '😂' },
            { en: 'Action', ko: '액션', emoji: '💥' },
            { en: 'Romance', ko: '로맨스', emoji: '💕' },
            { en: 'Horror', ko: '공포', emoji: '👻' },
            { en: 'Sci-Fi', ko: 'SF', emoji: '🚀' },
            { en: 'Anime', ko: '애니', emoji: '✨' },
        ],
    },
];

// ==================== FORTUNE MESSAGES ====================
const FORTUNE_MESSAGES = {
    en: [
        "🌟 Today's luck is especially bright!",
        "🍀 Good fortune follows your choice.",
        "⭐ The stars are smiling upon you.",
        "🌈 A rainbow of possibilities awaits.",
        "✨ Magic is in the air today.",
        "🎯 Trust your instincts today.",
        "🌸 Beauty surrounds your decision.",
        "💫 The universe approves!",
    ],
    ko: [
        "🌟 오늘의 운은 특별히 밝습니다!",
        "🍀 행운이 당신의 선택을 따릅니다.",
        "⭐ 별들이 당신을 향해 미소짓고 있어요.",
        "🌈 무한한 가능성이 기다리고 있어요.",
        "✨ 오늘은 마법 같은 날이에요.",
        "🎯 오늘은 직감을 믿으세요.",
        "🌸 아름다움이 당신의 결정을 감싸요.",
        "💫 우주가 승인했습니다!",
    ],
};

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        title: 'Menu Oracle',
        back: '← Brookvale',
        whatToDecide: 'What do you need to decide?',
        questionPlaceholder: "What should I eat for dinner?",
        addOption: '+ Add Option',
        optionPlaceholder: 'Option',
        askOracle: '🔮 Ask the Oracle',
        spinWheel: '🎡 Spin the Wheel!',
        decision: 'The Oracle Speaks',
        tryAgain: 'Ask Again',
        newQuestion: 'New Question',
        history: 'Decision History',
        empty: 'No decisions yet. Ask the Oracle!',
        thinking: 'The Oracle is contemplating...',
        clearAll: 'Clear All',
        minOptions: 'Add at least 2 options',
        questComplete: 'Decision Made!',
        acornsEarned: '+3 Acorns',
        crystalBall: '🔮',
        presets: 'Quick Decide',
        custom: '✏️ Custom Question',
        weeklyStats: 'This Week',
        decisionsThisWeek: 'Decisions',
        favoriteCategory: 'Favorite',
        fortune: "Today's Fortune",
        spinMode: 'Wheel Mode',
        classicMode: 'Crystal Ball Mode',
        wheelSpinning: 'Spinning...',
    },
    ko: {
        title: '메뉴 신탁',
        back: '← 브룩베일',
        whatToDecide: '무엇을 결정해야 하나요?',
        questionPlaceholder: "저녁에 뭘 먹을까?",
        addOption: '+ 옵션 추가',
        optionPlaceholder: '옵션',
        askOracle: '🔮 신탁에게 물어보기',
        spinWheel: '🎡 룰렛 돌리기!',
        decision: '신탁이 말한다',
        tryAgain: '다시 물어보기',
        newQuestion: '새 질문',
        history: '결정 기록',
        empty: '아직 결정이 없어요. 신탁에게 물어보세요!',
        thinking: '신탁이 깊이 생각하는 중...',
        clearAll: '모두 지우기',
        minOptions: '최소 2개 옵션을 추가하세요',
        questComplete: '결정 완료!',
        acornsEarned: '+3 도토리',
        crystalBall: '🔮',
        presets: '빠른 결정',
        custom: '✏️ 직접 입력',
        weeklyStats: '이번 주',
        decisionsThisWeek: '결정 횟수',
        favoriteCategory: '자주 고른 것',
        fortune: '오늘의 포춘',
        spinMode: '룰렛 모드',
        classicMode: '수정구 모드',
        wheelSpinning: '돌아가는 중...',
    },
};

// ==================== WHEEL COLORS ====================
const WHEEL_COLORS = [
    '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3',
    '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA',
    '#FF9A9E', '#FAD0C4', '#A18CD1', '#FBC2EB',
];

// ==================== COMPONENT ====================
export default function MenuOraclePage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<MenuOption[]>([
        { id: '1', text: '' },
        { id: '2', text: '' },
    ]);
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [result, setResult] = useState<{ message: string; answer: string; fortune: string } | null>(null);
    const [showReward, setShowReward] = useState(false);
    const [mode, setMode] = useState<'crystal' | 'wheel'>('crystal');
    const [isSpinning, setIsSpinning] = useState(false);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const wheelRef = useRef<HTMLDivElement>(null);

    // Use global acorn system
    const { balance: totalAcorns, earn: earnAcorns } = useAcornStore(language);

    const t = translations[language];

    // Load data
    useEffect(() => {
        const saved = localStorage.getItem('menuOracleDataV2');
        if (saved) {
            const data = JSON.parse(saved);
            setDecisions(data.decisions || []);
        }
    }, []);

    // Save data
    useEffect(() => {
        localStorage.setItem('menuOracleDataV2', JSON.stringify({ decisions }));
    }, [decisions]);

    // Get today's fortune
    const todaysFortune = FORTUNE_MESSAGES[language][
        new Date().getDate() % FORTUNE_MESSAGES[language].length
    ];

    // Weekly stats calculation
    const weeklyStats: WeeklyStats = (() => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekDecisions = decisions.filter(d => new Date(d.date) > oneWeekAgo);

        // Find most common answer
        const answerCounts: Record<string, number> = {};
        weekDecisions.forEach(d => {
            answerCounts[d.answer] = (answerCounts[d.answer] || 0) + 1;
        });
        const favorite = Object.entries(answerCounts).sort((a, b) => b[1] - a[1])[0];

        return {
            totalDecisions: weekDecisions.length,
            favoriteCategory: favorite ? favorite[0] : '-',
            decisiveness: weekDecisions.length > 0 ? Math.floor(Math.random() * 5) + 6 : 0,
        };
    })();

    // Load preset category
    const loadPreset = useCallback((preset: PresetCategory) => {
        setSelectedPreset(preset.id);
        setQuestion(language === 'ko' ? preset.nameKo : preset.nameEn);
        setOptions(
            preset.options.map((opt, i) => ({
                id: `preset-${i}`,
                text: language === 'ko' ? opt.ko : opt.en,
                emoji: opt.emoji,
            }))
        );
    }, [language]);

    // Add option
    const addOption = useCallback(() => {
        setOptions(prev => [
            ...prev,
            { id: Date.now().toString(), text: '' },
        ]);
    }, []);

    // Remove option
    const removeOption = useCallback((id: string) => {
        if (options.length <= 2) return;
        setOptions(prev => prev.filter(o => o.id !== id));
    }, [options.length]);

    // Update option
    const updateOption = useCallback((id: string, text: string) => {
        setOptions(prev =>
            prev.map(o => o.id === id ? { ...o, text } : o)
        );
        setSelectedPreset(null); // Custom mode once text edited
    }, []);

    // Ask oracle (Crystal Ball mode)
    const askOracle = useCallback(() => {
        const validOptions = options.filter(o => o.text.trim());
        if (validOptions.length < 2) return;

        setIsThinking(true);
        setResult(null);

        setTimeout(() => {
            const messages = ORACLE_MESSAGES[language];
            const fortunes = FORTUNE_MESSAGES[language];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            const randomAnswer = validOptions[Math.floor(Math.random() * validOptions.length)];
            const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];

            const answerText = randomAnswer.emoji
                ? `${randomAnswer.emoji} ${randomAnswer.text}`
                : randomAnswer.text;

            setResult({
                message: randomMessage,
                answer: answerText,
                fortune,
            });

            // Save to history
            const newDecision: Decision = {
                id: Date.now().toString(),
                question: question || 'Quick decision',
                answer: answerText,
                date: new Date().toISOString(),
                category: selectedPreset || 'custom',
            };
            setDecisions(prev => [newDecision, ...prev].slice(0, 50));

            earnAcorns(3, 'Menu Oracle');
            setShowReward(true);
            setTimeout(() => setShowReward(false), 2500);

            setIsThinking(false);
        }, 2500);
    }, [options, question, language, earnAcorns, selectedPreset]);

    // Spin wheel
    const spinWheel = useCallback(() => {
        const validOptions = options.filter(o => o.text.trim());
        if (validOptions.length < 2 || isSpinning) return;

        setIsSpinning(true);
        setResult(null);

        // Random number of full rotations + landing angle
        const winnerIndex = Math.floor(Math.random() * validOptions.length);
        const segmentAngle = 360 / validOptions.length;
        const targetAngle = 360 - (winnerIndex * segmentAngle + segmentAngle / 2);
        const totalRotation = wheelRotation + 1440 + targetAngle; // 4 full spins + target

        setWheelRotation(totalRotation);

        // Wait for spin to finish
        setTimeout(() => {
            const winner = validOptions[winnerIndex];
            const fortunes = FORTUNE_MESSAGES[language];
            const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];

            const answerText = winner.emoji
                ? `${winner.emoji} ${winner.text}`
                : winner.text;

            setResult({
                message: ORACLE_MESSAGES[language][Math.floor(Math.random() * ORACLE_MESSAGES[language].length)],
                answer: answerText,
                fortune,
            });

            const newDecision: Decision = {
                id: Date.now().toString(),
                question: question || 'Wheel spin',
                answer: answerText,
                date: new Date().toISOString(),
                category: selectedPreset || 'custom',
            };
            setDecisions(prev => [newDecision, ...prev].slice(0, 50));

            earnAcorns(3, 'Menu Oracle');
            setShowReward(true);
            setTimeout(() => setShowReward(false), 2500);

            setIsSpinning(false);
        }, 4000);
    }, [options, isSpinning, wheelRotation, question, language, earnAcorns, selectedPreset]);

    // Reset
    const resetQuestion = useCallback(() => {
        setQuestion('');
        setOptions([
            { id: '1', text: '' },
            { id: '2', text: '' },
        ]);
        setResult(null);
        setSelectedPreset(null);
        setWheelRotation(0);
    }, []);

    // Clear history
    const clearHistory = useCallback(() => {
        setDecisions([]);
    }, []);

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return language === 'ko'
            ? `${date.getMonth() + 1}월 ${date.getDate()}일`
            : date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    const validOptionsCount = options.filter(o => o.text.trim()).length;
    const validOptions = options.filter(o => o.text.trim());

    return (
        <div className="menu-oracle-app">
            {/* Reward Toast */}
            {showReward && (
                <div className="reward-toast">
                    <span className="toast-icon">🔮</span>
                    <div className="toast-content">
                        <div className="toast-title">{t.questComplete}</div>
                        <div className="toast-reward">{t.acornsEarned}</div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <a href="/" className="back-link">{t.back}</a>
                <h1>🔮 {t.title}</h1>
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

            {/* Today's Fortune */}
            <section className="fortune-section">
                <div className="fortune-card">
                    <div className="fortune-title">{t.fortune}</div>
                    <p className="fortune-text">{todaysFortune}</p>
                </div>
            </section>

            {/* Weekly Stats Bar */}
            <section className="weekly-stats">
                <div className="stat-chip">
                    <span className="chip-emoji">📊</span>
                    <span className="chip-label">{t.weeklyStats}</span>
                    <span className="chip-value">{weeklyStats.totalDecisions}</span>
                </div>
                {weeklyStats.favoriteCategory !== '-' && (
                    <div className="stat-chip">
                        <span className="chip-emoji">❤️</span>
                        <span className="chip-label">{t.favoriteCategory}</span>
                        <span className="chip-value">{weeklyStats.favoriteCategory}</span>
                    </div>
                )}
            </section>

            {/* Mode Toggle */}
            <section className="mode-toggle">
                <button
                    className={`mode-btn ${mode === 'crystal' ? 'active' : ''}`}
                    onClick={() => setMode('crystal')}
                >
                    🔮 {t.classicMode}
                </button>
                <button
                    className={`mode-btn ${mode === 'wheel' ? 'active' : ''}`}
                    onClick={() => setMode('wheel')}
                >
                    🎡 {t.spinMode}
                </button>
            </section>

            {/* Preset Categories */}
            {!result && !isThinking && !isSpinning && (
                <section className="preset-section">
                    <h3>{t.presets}</h3>
                    <div className="preset-grid">
                        {PRESET_CATEGORIES.map(preset => (
                            <button
                                key={preset.id}
                                className={`preset-card ${selectedPreset === preset.id ? 'active' : ''}`}
                                onClick={() => loadPreset(preset)}
                            >
                                <span className="preset-emoji">{preset.emoji}</span>
                                <span className="preset-name">
                                    {language === 'ko' ? preset.nameKo : preset.nameEn}
                                </span>
                            </button>
                        ))}
                        <button
                            className={`preset-card ${selectedPreset === null && options.some(o => o.text) ? 'active' : ''}`}
                            onClick={resetQuestion}
                        >
                            <span className="preset-emoji">✏️</span>
                            <span className="preset-name">{language === 'ko' ? '직접 입력' : 'Custom'}</span>
                        </button>
                    </div>
                </section>
            )}

            {/* Crystal Ball Mode */}
            {mode === 'crystal' && (
                <section className="crystal-section">
                    <div className={`crystal-ball ${isThinking ? 'thinking' : ''} ${result ? 'revealed' : ''}`}>
                        {isThinking ? (
                            <>
                                <span className="crystal-emoji">🔮</span>
                                <div className="thinking-dots">
                                    <span>.</span><span>.</span><span>.</span>
                                </div>
                            </>
                        ) : result ? (
                            <>
                                <span className="crystal-emoji result">✨</span>
                                <div className="oracle-message">{result.message}</div>
                                <div className="oracle-answer">{result.answer}</div>
                                <div className="oracle-fortune">{result.fortune}</div>
                            </>
                        ) : (
                            <span className="crystal-emoji idle">🔮</span>
                        )}
                    </div>

                    {isThinking && (
                        <p className="thinking-text">{t.thinking}</p>
                    )}
                </section>
            )}

            {/* Wheel Mode */}
            {mode === 'wheel' && validOptions.length >= 2 && (
                <section className="wheel-section">
                    <div className="wheel-container">
                        {/* Pointer */}
                        <div className="wheel-pointer">▼</div>

                        {/* Spinning Wheel */}
                        <div
                            ref={wheelRef}
                            className={`wheel ${isSpinning ? 'spinning' : ''}`}
                            style={{
                                transform: `rotate(${wheelRotation}deg)`,
                                transition: isSpinning
                                    ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                                    : 'none',
                            }}
                        >
                            {validOptions.map((opt, i) => {
                                const segAngle = 360 / validOptions.length;
                                const rotation = i * segAngle;
                                const color = WHEEL_COLORS[i % WHEEL_COLORS.length];
                                return (
                                    <div
                                        key={opt.id}
                                        className="wheel-segment"
                                        style={{
                                            transform: `rotate(${rotation}deg)`,
                                            background: `conic-gradient(${color} 0deg, ${color} ${segAngle}deg, transparent ${segAngle}deg)`,
                                            clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin(segAngle * Math.PI / 180)}% ${50 - 50 * Math.cos(segAngle * Math.PI / 180)}%)`,
                                        }}
                                    >
                                        <span
                                            className="segment-label"
                                            style={{
                                                transform: `rotate(${segAngle / 2}deg) translateY(-60px)`,
                                            }}
                                        >
                                            {opt.emoji || ''} {opt.text.slice(0, 8)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Result overlay for wheel */}
                    {result && !isSpinning && (
                        <div className="wheel-result">
                            <div className="wheel-result-answer">{result.answer}</div>
                            <div className="wheel-result-fortune">{result.fortune}</div>
                        </div>
                    )}
                </section>
            )}

            {/* Question & Options Input */}
            {!result && !isThinking && !isSpinning && (
                <section className="question-section">
                    <h2>{t.whatToDecide}</h2>

                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={t.questionPlaceholder}
                        className="question-input"
                    />

                    <div className="options-list">
                        {options.map((option, index) => (
                            <div key={option.id} className="option-row">
                                <span className="option-number">{option.emoji || (index + 1)}</span>
                                <input
                                    type="text"
                                    value={option.text}
                                    onChange={(e) => updateOption(option.id, e.target.value)}
                                    placeholder={`${t.optionPlaceholder} ${index + 1}`}
                                    className="option-input"
                                />
                                {options.length > 2 && (
                                    <button
                                        className="remove-btn"
                                        onClick={() => removeOption(option.id)}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button className="add-option-btn" onClick={addOption}>
                        {t.addOption}
                    </button>

                    <button
                        className="ask-btn"
                        onClick={mode === 'crystal' ? askOracle : spinWheel}
                        disabled={validOptionsCount < 2}
                    >
                        {validOptionsCount < 2
                            ? t.minOptions
                            : mode === 'crystal' ? t.askOracle : t.spinWheel
                        }
                    </button>
                </section>
            )}

            {/* Result Actions */}
            {result && !isSpinning && (
                <section className="result-actions">
                    <button className="try-again-btn" onClick={mode === 'crystal' ? askOracle : spinWheel}>
                        🔄 {t.tryAgain}
                    </button>
                    <button className="new-question-btn" onClick={resetQuestion}>
                        ✨ {t.newQuestion}
                    </button>
                </section>
            )}

            {/* History Toggle */}
            <section className="history-section">
                <button
                    className="history-toggle"
                    onClick={() => setShowHistory(prev => !prev)}
                >
                    📜 {t.history} ({decisions.length})
                </button>

                {showHistory && (
                    <>
                        <div className="history-header">
                            {decisions.length > 0 && (
                                <button className="clear-btn" onClick={clearHistory}>
                                    {t.clearAll}
                                </button>
                            )}
                        </div>

                        {decisions.length === 0 ? (
                            <div className="empty-history">
                                <span className="empty-icon">🔮</span>
                                <p>{t.empty}</p>
                            </div>
                        ) : (
                            <div className="history-list">
                                {decisions.slice(0, 10).map(decision => (
                                    <div key={decision.id} className="history-item">
                                        <div className="history-question">{decision.question}</div>
                                        <div className="history-answer">→ {decision.answer}</div>
                                        <div className="history-date">{formatDate(decision.date)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}
