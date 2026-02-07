'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import { BackLink } from '@/components/BackLink';
import { AcornTransaction, Achievement } from '@/lib/acorn-store';
import './acorn-bank.css';

// ==================== TYPES ====================
interface ShopItem {
    id: string;
    name: string;
    nameKo: string;
    description: string;
    descriptionKo: string;
    emoji: string;
    price: number;
    category: 'theme' | 'avatar' | 'boost' | 'decoration';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface SavingsGoal {
    id: string;
    name: string;
    target: number;
    saved: number;
    emoji: string;
    createdAt: string;
}

// ==================== SHOP ITEMS ====================
const SHOP_ITEMS: ShopItem[] = [
    // Themes
    { id: 'theme-forest', name: 'Forest Theme', nameKo: '숲 테마', description: 'Deep green forest colors', descriptionKo: '진한 초록 숲 색상', emoji: '🌲', price: 100, category: 'theme', rarity: 'common' },
    { id: 'theme-ocean', name: 'Ocean Theme', nameKo: '바다 테마', description: 'Calm blue ocean colors', descriptionKo: '차분한 파란 바다 색상', emoji: '🌊', price: 100, category: 'theme', rarity: 'common' },
    { id: 'theme-sunset', name: 'Sunset Theme', nameKo: '석양 테마', description: 'Warm sunset colors', descriptionKo: '따뜻한 석양 색상', emoji: '🌅', price: 100, category: 'theme', rarity: 'common' },
    { id: 'theme-galaxy', name: 'Galaxy Theme', nameKo: '은하 테마', description: 'Cosmic purple galaxy', descriptionKo: '우주적인 보라 은하', emoji: '🌌', price: 250, category: 'theme', rarity: 'rare' },
    { id: 'theme-cherry', name: 'Cherry Blossom', nameKo: '벚꽃 테마', description: 'Soft pink cherry blossoms', descriptionKo: '부드러운 핑크 벚꽃', emoji: '🌸', price: 250, category: 'theme', rarity: 'rare' },
    // Avatars
    { id: 'avatar-squirrel', name: 'Squirrel Avatar', nameKo: '다람쥐 아바타', description: 'Cute squirrel companion', descriptionKo: '귀여운 다람쥐 친구', emoji: '🐿️', price: 200, category: 'avatar', rarity: 'common' },
    { id: 'avatar-owl', name: 'Owl Avatar', nameKo: '올빼미 아바타', description: 'Wise owl companion', descriptionKo: '지혜로운 올빼미 친구', emoji: '🦉', price: 200, category: 'avatar', rarity: 'common' },
    { id: 'avatar-fox', name: 'Fox Avatar', nameKo: '여우 아바타', description: 'Clever fox friend', descriptionKo: '영리한 여우 친구', emoji: '🦊', price: 350, category: 'avatar', rarity: 'rare' },
    { id: 'avatar-dragon', name: 'Dragon Avatar', nameKo: '용 아바타', description: 'Legendary dragon companion', descriptionKo: '전설의 용 친구', emoji: '🐉', price: 500, category: 'avatar', rarity: 'epic' },
    // Boosts
    { id: 'boost-double', name: 'Double Acorns (24h)', nameKo: '2배 도토리 (24시간)', description: 'Earn double acorns for 24h', descriptionKo: '24시간 동안 도토리 2배', emoji: '✨', price: 150, category: 'boost', rarity: 'common' },
    { id: 'boost-lucky', name: 'Lucky Charm (24h)', nameKo: '행운 부적 (24시간)', description: 'Bonus acorns on every quest', descriptionKo: '퀘스트마다 보너스 도토리', emoji: '🍀', price: 200, category: 'boost', rarity: 'rare' },
    // Decorations
    { id: 'deco-garden', name: 'Rooftop Garden', nameKo: '옥상 정원', description: 'A tiny garden for your island', descriptionKo: '섬을 위한 작은 정원', emoji: '🌻', price: 300, category: 'decoration', rarity: 'rare' },
    { id: 'deco-fountain', name: 'Crystal Fountain', nameKo: '크리스탈 분수', description: 'Sparkling water fountain', descriptionKo: '반짝이는 물 분수', emoji: '⛲', price: 500, category: 'decoration', rarity: 'epic' },
    { id: 'deco-aurora', name: 'Aurora Borealis', nameKo: '오로라', description: 'Northern lights over your island', descriptionKo: '섬 위의 오로라', emoji: '🌈', price: 1000, category: 'decoration', rarity: 'legendary' },
];

const RARITY_COLORS = {
    common: '#9E9E9E',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FF9800',
};

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        title: 'Acorn Bank',
        back: '← Brookvale',
        balance: 'Current Balance',
        level: 'Level',
        nextLevel: 'to next level',
        totalEarned: 'Total Earned',
        streak: 'Day Streak',
        shop: '🛒 Shop',
        history: '📜 History',
        achievements: '🏆 Badges',
        savings: '🎯 Savings',
        buy: 'Buy',
        owned: 'Owned',
        earned: 'earned',
        spent: 'spent',
        from: 'from',
        categories: {
            theme: '🎨 Themes',
            avatar: '🐾 Avatars',
            boost: '⚡ Boosts',
            decoration: '🏡 Decorations',
        },
        locked: 'Locked',
        unlocked: 'Unlocked',
        notEnough: 'Not enough acorns!',
        purchased: 'Purchased!',
        weeklyEarnings: 'This Week',
        monthlyEarnings: 'This Month',
        topSources: 'Top Sources',
        savingsGoals: 'Savings Goals',
        addGoal: '+ New Goal',
        goalName: 'Goal name',
        goalTarget: 'Target',
        deposit: 'Deposit',
        depositAmount: 'Amount',
        complete: 'Complete!',
        noGoals: 'Create a savings goal!',
        spendingBreakdown: 'Spending',
        earningBreakdown: 'Earning',
        rarity: {
            common: 'Common',
            rare: 'Rare',
            epic: 'Epic',
            legendary: 'Legendary',
        },
    },
    ko: {
        title: '도토리 은행',
        back: '← 브룩베일',
        balance: '현재 잔액',
        level: '레벨',
        nextLevel: '다음 레벨까지',
        totalEarned: '총 획득',
        streak: '연속 일',
        shop: '🛒 상점',
        history: '📜 기록',
        achievements: '🏆 업적',
        savings: '🎯 저축',
        buy: '구매',
        owned: '소유',
        earned: '획득',
        spent: '사용',
        from: '에서',
        categories: {
            theme: '🎨 테마',
            avatar: '🐾 아바타',
            boost: '⚡ 부스트',
            decoration: '🏡 장식',
        },
        locked: '잠김',
        unlocked: '달성',
        notEnough: '도토리가 부족해요!',
        purchased: '구매 완료!',
        weeklyEarnings: '이번 주',
        monthlyEarnings: '이번 달',
        topSources: '주요 출처',
        savingsGoals: '저축 목표',
        addGoal: '+ 새 목표',
        goalName: '목표 이름',
        goalTarget: '목표 금액',
        deposit: '입금',
        depositAmount: '금액',
        complete: '완료!',
        noGoals: '저축 목표를 만들어보세요!',
        spendingBreakdown: '지출',
        earningBreakdown: '수입',
        rarity: {
            common: '일반',
            rare: '레어',
            epic: '에픽',
            legendary: '전설',
        },
    },
};

type TabType = 'shop' | 'history' | 'achievements' | 'savings';

export default function AcornBankPage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [activeTab, setActiveTab] = useState<TabType>('shop');
    const [ownedItems, setOwnedItems] = useState<string[]>([]);
    const [showPurchaseToast, setShowPurchaseToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [newGoalName, setNewGoalName] = useState('');
    const [newGoalTarget, setNewGoalTarget] = useState('');
    const [newGoalEmoji, setNewGoalEmoji] = useState('🎯');
    const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
    const [depositAmount, setDepositAmount] = useState('');
    const [shopCategory, setShopCategory] = useState<'all' | 'theme' | 'avatar' | 'boost' | 'decoration'>('all');

    const {
        balance,
        totalEarned,
        level,
        levelProgress,
        levelName,
        streak,
        achievements,
        spend,
        isLoaded,
    } = useAcornStore(language);

    const t = translations[language];

    // Load saved language
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLang = localStorage.getItem('brookvale-language') as Language;
            if (savedLang) setLanguage(savedLang);
        }
    }, []);

    // Load owned items & savings goals
    useEffect(() => {
        const saved = localStorage.getItem('brookvale-owned-items');
        if (saved) setOwnedItems(JSON.parse(saved));

        const savedGoals = localStorage.getItem('brookvale-savings-goals');
        if (savedGoals) setSavingsGoals(JSON.parse(savedGoals));
    }, []);

    // Save savings goals
    useEffect(() => {
        localStorage.setItem('brookvale-savings-goals', JSON.stringify(savingsGoals));
    }, [savingsGoals]);

    // Load transaction history
    const [transactions, setTransactions] = useState<AcornTransaction[]>([]);
    useEffect(() => {
        const saved = localStorage.getItem('brookvale-acorn-store');
        if (saved) {
            const data = JSON.parse(saved);
            setTransactions(data.transactions || []);
        }
    }, [balance]);

    // Weekly earnings
    const weeklyData = useMemo(() => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekTxs = transactions.filter(tx => new Date(tx.timestamp) >= weekAgo);
        const earned = weekTxs.filter(tx => tx.type === 'earn').reduce((sum, tx) => sum + tx.amount, 0);
        const spent = weekTxs.filter(tx => tx.type === 'spend').reduce((sum, tx) => sum + tx.amount, 0);
        return { earned, spent };
    }, [transactions]);

    // Top sources
    const topSources = useMemo(() => {
        const sourceMap: Record<string, number> = {};
        transactions.filter(tx => tx.type === 'earn').forEach(tx => {
            sourceMap[tx.source] = (sourceMap[tx.source] || 0) + tx.amount;
        });
        return Object.entries(sourceMap)
            .map(([source, amount]) => ({ source, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }, [transactions]);

    const maxSourceAmount = topSources.length > 0 ? Math.max(...topSources.map(s => s.amount)) : 1;

    // Filtered shop items
    const filteredShopItems = useMemo(() => {
        if (shopCategory === 'all') return SHOP_ITEMS;
        return SHOP_ITEMS.filter(item => item.category === shopCategory);
    }, [shopCategory]);

    // Buy item
    const buyItem = useCallback((item: ShopItem) => {
        if (ownedItems.includes(item.id)) return;

        const success = spend(item.price, language === 'ko' ? item.nameKo : item.name);
        if (success) {
            const newOwned = [...ownedItems, item.id];
            setOwnedItems(newOwned);
            localStorage.setItem('brookvale-owned-items', JSON.stringify(newOwned));
            setToastMessage(`✅ ${t.purchased}`);
            setShowPurchaseToast(true);
            setTimeout(() => setShowPurchaseToast(false), 2000);
        } else {
            setToastMessage(`❌ ${t.notEnough}`);
            setShowPurchaseToast(true);
            setTimeout(() => setShowPurchaseToast(false), 2000);
        }
    }, [ownedItems, spend, language, t]);

    // Add savings goal
    const addSavingsGoal = () => {
        if (!newGoalName.trim() || !newGoalTarget) return;
        const goal: SavingsGoal = {
            id: Date.now().toString(),
            name: newGoalName.trim(),
            target: parseInt(newGoalTarget),
            saved: 0,
            emoji: newGoalEmoji,
            createdAt: new Date().toISOString(),
        };
        setSavingsGoals(prev => [...prev, goal]);
        setNewGoalName('');
        setNewGoalTarget('');
        setShowAddGoal(false);
    };

    // Deposit to savings goal
    const depositToGoal = (goalId: string) => {
        const amount = parseInt(depositAmount);
        if (!amount || amount <= 0 || amount > balance) return;

        const success = spend(amount, 'Savings Goal');
        if (success) {
            setSavingsGoals(prev =>
                prev.map(g => g.id === goalId
                    ? { ...g, saved: Math.min(g.saved + amount, g.target) }
                    : g
                )
            );
            setDepositGoalId(null);
            setDepositAmount('');
        }
    };

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return language === 'ko'
            ? `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
            : date.toLocaleDateString('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    // Next level progress
    const getNextLevelProgress = () => {
        const thresholds = [0, 50, 150, 300, 500, 750, 1000, 1500, 2000, 3000];
        const nextThreshold = thresholds[Math.min(level, thresholds.length - 1)];
        return nextThreshold - totalEarned;
    };

    const GOAL_EMOJIS = ['🎯', '🏠', '🎮', '📱', '🎁', '✈️', '🎓', '💎'];

    if (!isLoaded) {
        return <div className="acorn-bank-app loading">Loading...</div>;
    }

    return (
        <div className="acorn-bank-app">
            {/* Toast */}
            {showPurchaseToast && (
                <div className="purchase-toast">{toastMessage}</div>
            )}

            {/* Header */}
            <header className="app-header">
                <BackLink>{t.back}</BackLink>
                <h1>🏦 {t.title}</h1>
                <div className="header-right">
                    <button
                        className="lang-toggle"
                        onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
                    >
                        {language === 'en' ? '한국어' : 'EN'}
                    </button>
                    <span className="acorn-badge">🌰 {balance}</span>
                </div>
            </header>

            {/* Profile Section */}
            <section className="profile-section">
                <div className="balance-display">
                    <div className="big-acorn">🌰</div>
                    <div className="balance-info">
                        <span className="balance-label">{t.balance}</span>
                        <span className="balance-value">{balance}</span>
                    </div>
                </div>

                <div className="level-display">
                    <div className="level-badge">
                        <span className="level-number">{level}</span>
                    </div>
                    <div className="level-info">
                        <span className="level-name">{levelName}</span>
                        <div className="level-progress-bar">
                            <div className="level-progress-fill" style={{ width: `${levelProgress}%` }} />
                        </div>
                        {level < 10 && (
                            <span className="level-next">{getNextLevelProgress()} {t.nextLevel}</span>
                        )}
                    </div>
                </div>

                <div className="stats-row">
                    <div className="stat-mini">
                        <span className="stat-emoji">📊</span>
                        <span className="stat-value">{totalEarned}</span>
                        <span className="stat-label">{t.totalEarned}</span>
                    </div>
                    <div className="stat-mini">
                        <span className="stat-emoji">🔥</span>
                        <span className="stat-value">{streak}</span>
                        <span className="stat-label">{t.streak}</span>
                    </div>
                    <div className="stat-mini highlight">
                        <span className="stat-emoji">📈</span>
                        <span className="stat-value">+{weeklyData.earned}</span>
                        <span className="stat-label">{t.weeklyEarnings}</span>
                    </div>
                </div>
            </section>

            {/* Tab Navigation */}
            <nav className="tab-nav">
                {(['shop', 'savings', 'history', 'achievements'] as TabType[]).map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {t[tab]}
                    </button>
                ))}
            </nav>

            {/* Tab Content */}
            <section className="tab-content">
                {/* ==================== SHOP TAB ==================== */}
                {activeTab === 'shop' && (
                    <div className="shop-tab">
                        {/* Category filter */}
                        <div className="shop-filter">
                            {(['all', 'theme', 'avatar', 'boost', 'decoration'] as const).map(cat => (
                                <button
                                    key={cat}
                                    className={`filter-pill ${shopCategory === cat ? 'active' : ''}`}
                                    onClick={() => setShopCategory(cat)}
                                >
                                    {cat === 'all' ? '🏪 All' : t.categories[cat]}
                                </button>
                            ))}
                        </div>

                        <div className="shop-grid">
                            {filteredShopItems.map(item => {
                                const isOwned = ownedItems.includes(item.id);
                                const canAfford = balance >= item.price;

                                return (
                                    <div
                                        key={item.id}
                                        className={`shop-item ${isOwned ? 'owned' : ''} ${!canAfford && !isOwned ? 'cant-afford' : ''}`}
                                    >
                                        <div className="item-header">
                                            <span className="item-emoji">{item.emoji}</span>
                                            <span className="rarity-badge" style={{ backgroundColor: RARITY_COLORS[item.rarity] }}>
                                                {t.rarity[item.rarity]}
                                            </span>
                                        </div>
                                        <span className="item-name">
                                            {language === 'ko' ? item.nameKo : item.name}
                                        </span>
                                        <span className="item-desc">
                                            {language === 'ko' ? item.descriptionKo : item.description}
                                        </span>
                                        {isOwned ? (
                                            <span className="owned-badge">✓ {t.owned}</span>
                                        ) : (
                                            <button
                                                className="buy-btn"
                                                onClick={() => buyItem(item)}
                                                disabled={!canAfford}
                                            >
                                                🌰 {item.price}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ==================== SAVINGS TAB ==================== */}
                {activeTab === 'savings' && (
                    <div className="savings-tab">
                        <div className="savings-header">
                            <h3>{t.savingsGoals}</h3>
                            <button className="add-goal-btn" onClick={() => setShowAddGoal(!showAddGoal)}>
                                {t.addGoal}
                            </button>
                        </div>

                        {/* Add Goal Form */}
                        {showAddGoal && (
                            <div className="add-goal-form">
                                <div className="emoji-picker">
                                    {GOAL_EMOJIS.map(e => (
                                        <button
                                            key={e}
                                            className={`emoji-btn ${newGoalEmoji === e ? 'active' : ''}`}
                                            onClick={() => setNewGoalEmoji(e)}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    placeholder={t.goalName}
                                    value={newGoalName}
                                    onChange={e => setNewGoalName(e.target.value)}
                                    className="goal-input"
                                />
                                <input
                                    type="number"
                                    placeholder={t.goalTarget}
                                    value={newGoalTarget}
                                    onChange={e => setNewGoalTarget(e.target.value)}
                                    className="goal-input"
                                />
                                <button className="save-goal-btn" onClick={addSavingsGoal}>
                                    ✅ {language === 'ko' ? '만들기' : 'Create'}
                                </button>
                            </div>
                        )}

                        {/* Goals List */}
                        {savingsGoals.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">🎯</span>
                                <p>{t.noGoals}</p>
                            </div>
                        ) : (
                            <div className="goals-list">
                                {savingsGoals.map(goal => {
                                    const progress = (goal.saved / goal.target) * 100;
                                    const isComplete = goal.saved >= goal.target;
                                    return (
                                        <div key={goal.id} className={`savings-goal-card ${isComplete ? 'complete' : ''}`}>
                                            <div className="sg-header">
                                                <span className="sg-emoji">{goal.emoji}</span>
                                                <div className="sg-info">
                                                    <span className="sg-name">{goal.name}</span>
                                                    <span className="sg-amount">
                                                        🌰 {goal.saved} / {goal.target}
                                                    </span>
                                                </div>
                                                {isComplete && <span className="sg-complete">🎉 {t.complete}</span>}
                                            </div>
                                            <div className="sg-bar">
                                                <div className="sg-fill" style={{ width: `${Math.min(100, progress)}%` }} />
                                            </div>
                                            {!isComplete && (
                                                <div className="sg-actions">
                                                    {depositGoalId === goal.id ? (
                                                        <div className="deposit-form">
                                                            <input
                                                                type="number"
                                                                placeholder={t.depositAmount}
                                                                value={depositAmount}
                                                                onChange={e => setDepositAmount(e.target.value)}
                                                                className="deposit-input"
                                                                max={balance}
                                                            />
                                                            <button
                                                                className="deposit-confirm-btn"
                                                                onClick={() => depositToGoal(goal.id)}
                                                            >
                                                                ✅
                                                            </button>
                                                            <button
                                                                className="deposit-cancel-btn"
                                                                onClick={() => setDepositGoalId(null)}
                                                            >
                                                                ✖
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="deposit-btn"
                                                            onClick={() => setDepositGoalId(goal.id)}
                                                        >
                                                            🌰 {t.deposit}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ==================== HISTORY TAB ==================== */}
                {activeTab === 'history' && (
                    <div className="history-tab">
                        {/* Top Sources */}
                        {topSources.length > 0 && (
                            <div className="top-sources">
                                <h3>{t.topSources}</h3>
                                {topSources.map((source, i) => (
                                    <div key={i} className="source-item">
                                        <span className="source-rank">#{i + 1}</span>
                                        <span className="source-name">{source.source}</span>
                                        <div className="source-bar">
                                            <div
                                                className="source-fill"
                                                style={{ width: `${(source.amount / maxSourceAmount) * 100}%` }}
                                            />
                                        </div>
                                        <span className="source-amount">🌰 {source.amount}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Transaction List */}
                        <div className="history-list">
                            <h3>{language === 'ko' ? '전체 기록' : 'All Transactions'}</h3>
                            {transactions.length === 0 ? (
                                <div className="empty-state">
                                    <span className="empty-icon">📜</span>
                                    <p>No transactions yet</p>
                                </div>
                            ) : (
                                transactions.slice(0, 30).map(tx => (
                                    <div key={tx.id} className={`transaction-item ${tx.type}`}>
                                        <span className="tx-icon">
                                            {tx.type === 'earn' ? '📥' : '📤'}
                                        </span>
                                        <div className="tx-info">
                                            <span className="tx-source">{tx.source}</span>
                                            <span className="tx-date">{formatDate(tx.timestamp)}</span>
                                        </div>
                                        <span className={`tx-amount ${tx.type}`}>
                                            {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ==================== ACHIEVEMENTS TAB ==================== */}
                {activeTab === 'achievements' && (
                    <div className="achievements-list">
                        {achievements.map(ach => (
                            <div
                                key={ach.id}
                                className={`achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}`}
                            >
                                <span className="ach-emoji">{ach.emoji}</span>
                                <div className="ach-info">
                                    <span className="ach-name">
                                        {language === 'ko' ? ach.nameKo : ach.name}
                                    </span>
                                    <span className="ach-desc">
                                        {language === 'ko' ? ach.descriptionKo : ach.description}
                                    </span>
                                </div>
                                <span className={`ach-status ${ach.unlocked ? 'unlocked' : 'locked'}`}>
                                    {ach.unlocked ? `✅ ${t.unlocked}` : `${ach.requirement} 🌰`}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
