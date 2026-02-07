/**
 * 🌰 Brookvale Global Acorn System
 * 
 * Central store for all acorns across the ecosystem.
 * All apps share this unified acorn wallet.
 */

// Types
export interface AcornTransaction {
    id: string;
    amount: number;
    type: 'earn' | 'spend';
    source: string; // App name or item name
    timestamp: string;
}

export interface Achievement {
    id: string;
    name: string;
    nameKo: string;
    description: string;
    descriptionKo: string;
    emoji: string;
    requirement: number; // Total acorns needed
    unlocked: boolean;
    unlockedAt?: string;
}

export interface UserStats {
    totalEarned: number;
    totalSpent: number;
    currentBalance: number;
    level: number;
    levelProgress: number; // 0-100%
    streak: number; // Days in a row using any app
    lastActiveDate: string;
    appUsage: Record<string, number>; // App name -> times used
}

export interface AcornStore {
    stats: UserStats;
    transactions: AcornTransaction[];
    achievements: Achievement[];
}

// Level thresholds
const LEVEL_THRESHOLDS = [
    0,      // Level 1
    50,     // Level 2
    150,    // Level 3
    300,    // Level 4
    500,    // Level 5
    750,    // Level 6
    1000,   // Level 7
    1500,   // Level 8
    2000,   // Level 9
    3000,   // Level 10 (Max)
];

const LEVEL_NAMES = {
    en: ['Seedling', 'Sprout', 'Sapling', 'Young Tree', 'Growing Oak', 'Strong Oak', 'Wise Oak', 'Ancient Oak', 'Forest Guardian', 'Brookvale Legend'],
    ko: ['씨앗', '새싹', '어린나무', '자라는 나무', '성장하는 참나무', '튼튼한 참나무', '지혜로운 참나무', '고대 참나무', '숲의 수호자', '브룩베일 전설'],
};

// Default achievements
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first-acorn',
        name: 'First Acorn',
        nameKo: '첫 도토리',
        description: 'Earn your first acorn',
        descriptionKo: '첫 도토리를 획득하세요',
        emoji: '🌱',
        requirement: 1,
        unlocked: false,
    },
    {
        id: 'acorn-collector',
        name: 'Acorn Collector',
        nameKo: '도토리 수집가',
        description: 'Earn 50 acorns',
        descriptionKo: '50개의 도토리를 획득하세요',
        emoji: '🧺',
        requirement: 50,
        unlocked: false,
    },
    {
        id: 'acorn-hoarder',
        name: 'Acorn Hoarder',
        nameKo: '도토리 저장왕',
        description: 'Earn 200 acorns',
        descriptionKo: '200개의 도토리를 획득하세요',
        emoji: '🏆',
        requirement: 200,
        unlocked: false,
    },
    {
        id: 'forest-friend',
        name: 'Forest Friend',
        nameKo: '숲의 친구',
        description: 'Earn 500 acorns',
        descriptionKo: '500개의 도토리를 획득하세요',
        emoji: '🌲',
        requirement: 500,
        unlocked: false,
    },
    {
        id: 'oak-master',
        name: 'Oak Master',
        nameKo: '참나무 마스터',
        description: 'Earn 1000 acorns',
        descriptionKo: '1000개의 도토리를 획득하세요',
        emoji: '👑',
        requirement: 1000,
        unlocked: false,
    },
    {
        id: 'brookvale-legend',
        name: 'Brookvale Legend',
        nameKo: '브룩베일 전설',
        description: 'Earn 3000 acorns',
        descriptionKo: '3000개의 도토리를 획득하세요',
        emoji: '⭐',
        requirement: 3000,
        unlocked: false,
    },
];

const STORAGE_KEY = 'brookvale-acorn-store';

// Helper functions
function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

function calculateLevel(totalEarned: number): { level: number; progress: number } {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (totalEarned >= LEVEL_THRESHOLDS[i]) {
            level = i + 1;
        } else {
            break;
        }
    }

    // Calculate progress to next level
    const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const progress = level >= 10 ? 100 : Math.floor(((totalEarned - currentThreshold) / (nextThreshold - currentThreshold)) * 100);

    return { level, progress };
}

// Initialize or load store
export function loadAcornStore(): AcornStore {
    if (typeof window === 'undefined') {
        return getDefaultStore();
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge with defaults to ensure new fields exist
            return {
                ...getDefaultStore(),
                ...parsed,
                achievements: mergeAchievements(parsed.achievements || []),
            };
        }
    } catch (e) {
        console.error('Failed to load acorn store:', e);
    }

    return getDefaultStore();
}

function getDefaultStore(): AcornStore {
    return {
        stats: {
            totalEarned: 0,
            totalSpent: 0,
            currentBalance: 0,
            level: 1,
            levelProgress: 0,
            streak: 0,
            lastActiveDate: getToday(),
            appUsage: {},
        },
        transactions: [],
        achievements: [...DEFAULT_ACHIEVEMENTS],
    };
}

function mergeAchievements(saved: Achievement[]): Achievement[] {
    return DEFAULT_ACHIEVEMENTS.map(defaultAch => {
        const savedAch = saved.find(s => s.id === defaultAch.id);
        return savedAch ? { ...defaultAch, ...savedAch } : defaultAch;
    });
}

// Save store
export function saveAcornStore(store: AcornStore): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
        console.error('Failed to save acorn store:', e);
    }
}

// Earn acorns
export function earnAcorns(store: AcornStore, amount: number, source: string): { store: AcornStore; newAchievements: Achievement[] } {
    const newStore = { ...store };
    const today = getToday();

    // Update stats
    newStore.stats = {
        ...newStore.stats,
        totalEarned: newStore.stats.totalEarned + amount,
        currentBalance: newStore.stats.currentBalance + amount,
        appUsage: {
            ...newStore.stats.appUsage,
            [source]: (newStore.stats.appUsage[source] || 0) + 1,
        },
    };

    // Update streak
    if (newStore.stats.lastActiveDate !== today) {
        const lastDate = new Date(newStore.stats.lastActiveDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            newStore.stats.streak += 1;
        } else if (diffDays > 1) {
            newStore.stats.streak = 1;
        }
        newStore.stats.lastActiveDate = today;
    }

    // Update level
    const { level, progress } = calculateLevel(newStore.stats.totalEarned);
    newStore.stats.level = level;
    newStore.stats.levelProgress = progress;

    // Add transaction
    const transaction: AcornTransaction = {
        id: Date.now().toString(),
        amount,
        type: 'earn',
        source,
        timestamp: new Date().toISOString(),
    };
    newStore.transactions = [transaction, ...newStore.transactions].slice(0, 100); // Keep last 100

    // Check achievements
    const newAchievements: Achievement[] = [];
    newStore.achievements = newStore.achievements.map(ach => {
        if (!ach.unlocked && newStore.stats.totalEarned >= ach.requirement) {
            newAchievements.push({ ...ach, unlocked: true, unlockedAt: new Date().toISOString() });
            return { ...ach, unlocked: true, unlockedAt: new Date().toISOString() };
        }
        return ach;
    });

    saveAcornStore(newStore);
    return { store: newStore, newAchievements };
}

// Spend acorns
export function spendAcorns(store: AcornStore, amount: number, item: string): { success: boolean; store: AcornStore } {
    if (store.stats.currentBalance < amount) {
        return { success: false, store };
    }

    const newStore = { ...store };
    newStore.stats = {
        ...newStore.stats,
        totalSpent: newStore.stats.totalSpent + amount,
        currentBalance: newStore.stats.currentBalance - amount,
    };

    const transaction: AcornTransaction = {
        id: Date.now().toString(),
        amount,
        type: 'spend',
        source: item,
        timestamp: new Date().toISOString(),
    };
    newStore.transactions = [transaction, ...newStore.transactions].slice(0, 100);

    saveAcornStore(newStore);
    return { success: true, store: newStore };
}

// Get level name
export function getLevelName(level: number, lang: 'en' | 'ko' = 'en'): string {
    return LEVEL_NAMES[lang][Math.min(level - 1, LEVEL_NAMES[lang].length - 1)];
}

// Get next level threshold
export function getNextLevelThreshold(level: number): number {
    return LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)];
}

// Export constants
export { LEVEL_THRESHOLDS, LEVEL_NAMES };
