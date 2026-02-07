'use client';

import React from 'react';
import { useAcornStore } from '@/lib/acorn-context';
import './acorn-components.css';

interface AcornBadgeProps {
    language?: 'en' | 'ko';
    showLevel?: boolean;
    size?: 'small' | 'medium' | 'large';
    onClick?: () => void;
}

/**
 * 🌰 Global Acorn Badge
 * Shows current acorn balance with optional level indicator
 */
export function AcornBadge({
    language = 'en',
    showLevel = false,
    size = 'medium',
    onClick
}: AcornBadgeProps) {
    const { balance, level, levelProgress } = useAcornStore(language);

    return (
        <div
            className={`global-acorn-badge size-${size} ${onClick ? 'clickable' : ''}`}
            onClick={onClick}
        >
            <span className="acorn-emoji">🌰</span>
            <span className="acorn-balance">{balance}</span>
            {showLevel && (
                <div className="level-indicator">
                    <span className="level-badge">Lv.{level}</span>
                    <div className="level-progress-bar">
                        <div
                            className="level-progress-fill"
                            style={{ width: `${levelProgress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

interface AcornToastProps {
    amount: number;
    source?: string;
    language?: 'en' | 'ko';
    onClose?: () => void;
}

/**
 * 🌰 Acorn Earned Toast
 * Shows animated notification when acorns are earned
 */
export function AcornToast({ amount, source, language = 'en', onClose }: AcornToastProps) {
    const texts = {
        en: { earned: 'Acorns Earned!', from: 'from' },
        ko: { earned: '도토리 획득!', from: '에서' },
    };
    const t = texts[language];

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose?.();
        }, 2500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="acorn-toast">
            <span className="toast-icon">🌰</span>
            <div className="toast-content">
                <div className="toast-title">{t.earned}</div>
                <div className="toast-amount">+{amount}</div>
                {source && (
                    <div className="toast-source">{source}</div>
                )}
            </div>
        </div>
    );
}

interface AchievementToastProps {
    achievement: {
        emoji: string;
        name: string;
        nameKo: string;
        description: string;
        descriptionKo: string;
    };
    language?: 'en' | 'ko';
    onClose?: () => void;
}

/**
 * 🏆 Achievement Unlocked Toast
 */
export function AchievementToast({ achievement, language = 'en', onClose }: AchievementToastProps) {
    const texts = {
        en: { unlocked: 'Achievement Unlocked!' },
        ko: { unlocked: '업적 달성!' },
    };
    const t = texts[language];

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose?.();
        }, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="achievement-toast">
            <span className="achievement-icon">{achievement.emoji}</span>
            <div className="achievement-content">
                <div className="achievement-label">{t.unlocked}</div>
                <div className="achievement-name">
                    {language === 'ko' ? achievement.nameKo : achievement.name}
                </div>
                <div className="achievement-desc">
                    {language === 'ko' ? achievement.descriptionKo : achievement.description}
                </div>
            </div>
        </div>
    );
}

interface LevelUpToastProps {
    newLevel: number;
    levelName: string;
    language?: 'en' | 'ko';
    onClose?: () => void;
}

/**
 * ⬆️ Level Up Toast
 */
export function LevelUpToast({ newLevel, levelName, language = 'en', onClose }: LevelUpToastProps) {
    const texts = {
        en: { levelUp: 'LEVEL UP!', reached: 'You reached' },
        ko: { levelUp: '레벨 업!', reached: '도달' },
    };
    const t = texts[language];

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose?.();
        }, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="levelup-toast">
            <div className="levelup-glow" />
            <span className="levelup-icon">⬆️</span>
            <div className="levelup-content">
                <div className="levelup-label">{t.levelUp}</div>
                <div className="levelup-level">Level {newLevel}</div>
                <div className="levelup-name">{levelName}</div>
            </div>
        </div>
    );
}

interface UserProfileCardProps {
    language?: 'en' | 'ko';
}

/**
 * 👤 User Profile Card
 * Shows user's level, stats, and recent achievements
 */
export function UserProfileCard({ language = 'en' }: UserProfileCardProps) {
    const {
        balance,
        totalEarned,
        level,
        levelProgress,
        levelName,
        streak,
        achievements
    } = useAcornStore(language);

    const texts = {
        en: {
            acorns: 'Acorns',
            level: 'Level',
            streak: 'Day Streak',
            achievements: 'Achievements',
            totalEarned: 'Total Earned',
        },
        ko: {
            acorns: '도토리',
            level: '레벨',
            streak: '연속 일',
            achievements: '업적',
            totalEarned: '총 획득',
        },
    };
    const t = texts[language];

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <div className="user-profile-card">
            {/* Level Badge */}
            <div className="profile-level-section">
                <div className="level-circle">
                    <span className="level-number">{level}</span>
                </div>
                <div className="level-info">
                    <span className="level-name">{levelName}</span>
                    <div className="level-bar">
                        <div
                            className="level-fill"
                            style={{ width: `${levelProgress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="profile-stats">
                <div className="stat-item">
                    <span className="stat-emoji">🌰</span>
                    <span className="stat-value">{balance}</span>
                    <span className="stat-label">{t.acorns}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-emoji">🔥</span>
                    <span className="stat-value">{streak}</span>
                    <span className="stat-label">{t.streak}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-emoji">🏆</span>
                    <span className="stat-value">{unlockedCount}/{achievements.length}</span>
                    <span className="stat-label">{t.achievements}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-emoji">📊</span>
                    <span className="stat-value">{totalEarned}</span>
                    <span className="stat-label">{t.totalEarned}</span>
                </div>
            </div>
        </div>
    );
}
