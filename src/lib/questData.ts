// ==================== BROOKVALE QUEST SYSTEM ====================
// Modular quest data - easy to modify and extend!

export interface Quest {
    id: string;
    translationKey: string; // Key for i18n lookup
    targetLandmark: string; // Which landmark the quest is for
    icon: string;
    acornReward: number;
    xpReward: number;
    requiredLevel?: number; // Optional level requirement
    isDaily: boolean;
}

export interface QuestProgress {
    id: string;
    status: 'locked' | 'available' | 'in_progress' | 'completed' | 'claimed';
    progress: number; // 0-100
    completedAt?: Date;
}

// Quest definitions - easily modifiable!
export const questDefinitions: Quest[] = [
    {
        id: 'focus_session_1',
        translationKey: 'focusSession',
        targetLandmark: 'focus-cat',
        icon: '🐱',
        acornReward: 10,
        xpReward: 25,
        isDaily: true,
    },
    {
        id: 'add_habit_1',
        translationKey: 'addHabit',
        targetLandmark: 'tiny-wins',
        icon: '🌱',
        acornReward: 5,
        xpReward: 15,
        isDaily: true,
    },
    {
        id: 'stretch_session_1',
        translationKey: 'stretchSession',
        targetLandmark: 'stretch-timer',
        icon: '🧘',
        acornReward: 8,
        xpReward: 20,
        isDaily: true,
    },
    {
        id: 'daily_goal_1',
        translationKey: 'dailyGoal',
        targetLandmark: 'goal-tycoon',
        icon: '🏗️',
        acornReward: 12,
        xpReward: 30,
        isDaily: true,
    },
    {
        id: 'explore_town_1',
        translationKey: 'exploreTown',
        targetLandmark: 'daily-quest',
        icon: '🗺️',
        acornReward: 15,
        xpReward: 35,
        isDaily: false,
    },
    {
        id: 'paint_mood_1',
        translationKey: 'paintMood',
        targetLandmark: 'vibe-painter',
        icon: '🎨',
        acornReward: 7,
        xpReward: 20,
        isDaily: true,
    },
];

// Player profile interface
export interface PlayerProfile {
    level: number;
    xp: number;
    xpToNextLevel: number;
    totalAcorns: number;
    questProgress: QuestProgress[];
    visitedLandmarks: string[];
    lastDailyReset: Date;
}

// Default new player profile
export const defaultPlayerProfile: PlayerProfile = {
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalAcorns: 0,
    questProgress: questDefinitions.map(q => ({
        id: q.id,
        status: q.requiredLevel && q.requiredLevel > 1 ? 'locked' : 'available',
        progress: 0,
    })),
    visitedLandmarks: [],
    lastDailyReset: new Date(),
};

// Calculate XP needed for next level
export function xpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Helper to check if quests should reset
export function shouldResetDailyQuests(lastReset: Date): boolean {
    const now = new Date();
    const resetHour = 4; // Reset at 4 AM local time

    const lastResetDay = new Date(lastReset);
    lastResetDay.setHours(resetHour, 0, 0, 0);

    const todayReset = new Date();
    todayReset.setHours(resetHour, 0, 0, 0);

    if (now.getHours() < resetHour) {
        todayReset.setDate(todayReset.getDate() - 1);
    }

    return lastResetDay < todayReset;
}

// Get time until next daily reset
export function timeUntilDailyReset(): { hours: number; minutes: number } {
    const now = new Date();
    const nextReset = new Date();
    nextReset.setHours(4, 0, 0, 0); // 4 AM

    if (now.getHours() >= 4) {
        nextReset.setDate(nextReset.getDate() + 1);
    }

    const diff = nextReset.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes };
}
