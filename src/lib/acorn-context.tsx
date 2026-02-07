'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    AcornStore,
    Achievement,
    loadAcornStore,
    earnAcorns,
    spendAcorns,
    getLevelName,
    getNextLevelThreshold,
} from './acorn-store';

interface AcornContextType {
    // State
    balance: number;
    totalEarned: number;
    level: number;
    levelProgress: number;
    levelName: string;
    streak: number;
    achievements: Achievement[];
    recentTransactions: AcornStore['transactions'];

    // Actions
    earn: (amount: number, source: string) => Achievement[];
    spend: (amount: number, item: string) => boolean;

    // Helpers
    getAcornsToNextLevel: () => number;
    isLoaded: boolean;
}

const AcornContext = createContext<AcornContextType | null>(null);

interface AcornProviderProps {
    children: ReactNode;
    language?: 'en' | 'ko';
}

export function AcornProvider({ children, language = 'en' }: AcornProviderProps) {
    const [store, setStore] = useState<AcornStore | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load store on mount
    useEffect(() => {
        const loaded = loadAcornStore();
        setStore(loaded);
        setIsLoaded(true);
    }, []);

    // Earn acorns action
    const earn = useCallback((amount: number, source: string): Achievement[] => {
        if (!store) return [];

        const { store: newStore, newAchievements } = earnAcorns(store, amount, source);
        setStore(newStore);
        return newAchievements;
    }, [store]);

    // Spend acorns action
    const spend = useCallback((amount: number, item: string): boolean => {
        if (!store) return false;

        const { success, store: newStore } = spendAcorns(store, amount, item);
        if (success) {
            setStore(newStore);
        }
        return success;
    }, [store]);

    // Get acorns needed for next level
    const getAcornsToNextLevel = useCallback((): number => {
        if (!store) return 0;
        const nextThreshold = getNextLevelThreshold(store.stats.level);
        return Math.max(0, nextThreshold - store.stats.totalEarned);
    }, [store]);

    // Derive values from store
    const value: AcornContextType = {
        balance: store?.stats.currentBalance ?? 0,
        totalEarned: store?.stats.totalEarned ?? 0,
        level: store?.stats.level ?? 1,
        levelProgress: store?.stats.levelProgress ?? 0,
        levelName: store ? getLevelName(store.stats.level, language) : getLevelName(1, language),
        streak: store?.stats.streak ?? 0,
        achievements: store?.achievements ?? [],
        recentTransactions: store?.transactions ?? [],
        earn,
        spend,
        getAcornsToNextLevel,
        isLoaded,
    };

    return (
        <AcornContext.Provider value={value}>
            {children}
        </AcornContext.Provider>
    );
}

// Custom hook to use acorn context
export function useAcorns(): AcornContextType {
    const context = useContext(AcornContext);
    if (!context) {
        throw new Error('useAcorns must be used within an AcornProvider');
    }
    return context;
}

// Standalone hook for apps that don't use provider (backward compatible)
export function useAcornStore(language: 'en' | 'ko' = 'en') {
    const [store, setStore] = useState<AcornStore | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loaded = loadAcornStore();
        setStore(loaded);
        setIsLoaded(true);
    }, []);

    const earn = useCallback((amount: number, source: string): Achievement[] => {
        if (!store) return [];
        const { store: newStore, newAchievements } = earnAcorns(store, amount, source);
        setStore(newStore);
        return newAchievements;
    }, [store]);

    const spend = useCallback((amount: number, item: string): boolean => {
        if (!store) return false;
        const { success, store: newStore } = spendAcorns(store, amount, item);
        if (success) setStore(newStore);
        return success;
    }, [store]);

    return {
        balance: store?.stats.currentBalance ?? 0,
        totalEarned: store?.stats.totalEarned ?? 0,
        level: store?.stats.level ?? 1,
        levelProgress: store?.stats.levelProgress ?? 0,
        levelName: store ? getLevelName(store.stats.level, language) : getLevelName(1, language),
        streak: store?.stats.streak ?? 0,
        achievements: store?.achievements ?? [],
        earn,
        spend,
        isLoaded,
    };
}
