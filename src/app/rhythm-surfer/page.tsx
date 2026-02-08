'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import { BackLink } from '@/components/BackLink';
import { getRhythmMusicEngine } from '@/lib/rhythm-music';
import './rhythm-surfer.css';

interface Song {
    id: string;
    title: string;
    titleKo: string;
    emoji: string;
    tempo: 'slow' | 'medium' | 'fast';
    bpm: number;
    duration: number; // seconds
    pattern: number[]; // beat pattern (intervals in ms)
    color: string;
}

interface Session {
    id: string;
    date: string;
    song: string;
    songEmoji: string;
    score: number;
    perfect: number;
    good: number;
    miss: number;
    maxCombo: number;
    accuracy: number;
}

interface PlayerStats {
    totalSessions: number;
    totalScore: number;
    bestCombo: number;
    rank: string;
    rankEmoji: string;
}

const RANKS = [
    { name: 'Beginner', nameKo: '초보', emoji: '🎵', minScore: 0 },
    { name: 'Rhythmic', nameKo: '리듬감', emoji: '🎶', minScore: 500 },
    { name: 'Groover', nameKo: '그루버', emoji: '🎸', minScore: 2000 },
    { name: 'Beat Master', nameKo: '비트마스터', emoji: '🥁', minScore: 5000 },
    { name: 'Rhythm King', nameKo: '리듬킹', emoji: '👑', minScore: 10000 },
    { name: 'Sound God', nameKo: '사운드신', emoji: '✨', minScore: 25000 },
];

const SONGS: Song[] = [
    {
        id: 'morning-dew',
        title: 'Morning Dew',
        titleKo: '아침 이슬',
        emoji: '🌅',
        tempo: 'slow',
        bpm: 75,
        duration: 30,
        pattern: [800, 1000, 800, 1200, 800, 1000],
        color: '#FFB74D',
    },
    {
        id: 'ocean-waves',
        title: 'Ocean Waves',
        titleKo: '파도 소리',
        emoji: '🌊',
        tempo: 'slow',
        bpm: 60,
        duration: 30,
        pattern: [1000, 1200, 1000, 1000, 1200, 800],
        color: '#4FC3F7',
    },
    {
        id: 'forest-walk',
        title: 'Forest Walk',
        titleKo: '숲 속 산책',
        emoji: '🌲',
        tempo: 'medium',
        bpm: 100,
        duration: 30,
        pattern: [600, 600, 800, 600, 600, 800],
        color: '#66BB6A',
    },
    {
        id: 'starlight-dance',
        title: 'Starlight Dance',
        titleKo: '별빛 댄스',
        emoji: '⭐',
        tempo: 'medium',
        bpm: 120,
        duration: 30,
        pattern: [500, 500, 700, 500, 500, 700],
        color: '#AB47BC',
    },
    {
        id: 'cosmic-beat',
        title: 'Cosmic Beat',
        titleKo: '우주 비트',
        emoji: '🚀',
        tempo: 'fast',
        bpm: 150,
        duration: 30,
        pattern: [400, 400, 400, 500, 400, 400],
        color: '#EF5350',
    },
    {
        id: 'neon-city',
        title: 'Neon City',
        titleKo: '네온 시티',
        emoji: '🌃',
        tempo: 'fast',
        bpm: 140,
        duration: 30,
        pattern: [430, 430, 430, 600, 430, 430],
        color: '#EC407A',
    },
];

const translations = {
    en: {
        title: 'Rhythm Surfer',
        back: '← Brookvale',
        selectSong: 'Select a Rhythm',
        tempo: {
            slow: 'Slow',
            medium: 'Medium',
            fast: 'Fast',
        },
        tapToStart: 'Tap to Start',
        tapOnBeat: 'Tap on the Beat!',
        score: 'Score',
        combo: 'Combo',
        perfect: 'Perfect!',
        good: 'Good',
        miss: 'Miss',
        gameOver: 'Session Complete!',
        finalScore: 'Final Score',
        playAgain: 'Play Again',
        backToSongs: 'Back to Songs',
        history: 'Session History',
        empty: 'No sessions yet. Catch some beats!',
        highScore: 'Best Score',
        questComplete: 'Rhythm Complete!',
        acornsEarned: '+10 Acorns',
        motivation: '🎵 Feel the rhythm, flow with life',
        bpm: 'BPM',
        maxCombo: 'Best Combo',
        accuracy: 'Accuracy',
        rank: 'Rank',
        totalSessions: 'Sessions',
        yourRank: 'Your Rank',
        songStats: 'Song Stats',
        perfectHits: 'Perfect',
        goodHits: 'Good',
        missHits: 'Missed',
        noHistory: 'No play history',
        sessionDetails: 'Session Details',
        visualizer: 'Equalizer',
        newHighScore: '🏆 New High Score!',
        streakBonus: 'Streak Bonus',
        tempoFilter: 'Tempo',
        all: 'All',
        personalBest: 'Personal Best',
        avgAccuracy: 'Avg Accuracy',
    },
    ko: {
        title: '리듬 서퍼',
        back: '← 브룩베일',
        selectSong: '리듬 선택',
        tempo: {
            slow: '느림',
            medium: '보통',
            fast: '빠름',
        },
        tapToStart: '시작하려면 탭',
        tapOnBeat: '비트에 맞춰 탭!',
        score: '점수',
        combo: '콤보',
        perfect: '퍼펙트!',
        good: '굿',
        miss: '미스',
        gameOver: '세션 완료!',
        finalScore: '최종 점수',
        playAgain: '다시 하기',
        backToSongs: '곡 선택으로',
        history: '세션 기록',
        empty: '아직 세션이 없어요. 비트를 잡아보세요!',
        highScore: '최고 점수',
        questComplete: '리듬 완료!',
        acornsEarned: '+10 도토리',
        motivation: '🎵 리듬을 느끼고, 삶과 함께 흐르세요',
        bpm: 'BPM',
        maxCombo: '최대 콤보',
        accuracy: '정확도',
        rank: '등급',
        totalSessions: '세션',
        yourRank: '나의 등급',
        songStats: '곡 통계',
        perfectHits: '퍼펙트',
        goodHits: '굿',
        missHits: '미스',
        noHistory: '플레이 기록 없음',
        sessionDetails: '세션 상세',
        visualizer: '이퀄라이저',
        newHighScore: '🏆 신기록!',
        streakBonus: '연속 보너스',
        tempoFilter: '템포',
        all: '전체',
        personalBest: '자기 최고',
        avgAccuracy: '평균 정확도',
    },
};

export default function RhythmSurferPage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [feedback, setFeedback] = useState<'perfect' | 'good' | 'miss' | null>(null);
    const [beatVisible, setBeatVisible] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [sessionStats, setSessionStats] = useState({ perfect: 0, good: 0, miss: 0 });
    const [showReward, setShowReward] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [tempoFilter, setTempoFilter] = useState<'all' | 'slow' | 'medium' | 'fast'>('all');
    const [eqBars, setEqBars] = useState<number[]>(Array(8).fill(0));
    const [showNewHighScore, setShowNewHighScore] = useState(false);
    const [pulseIntensity, setPulseIntensity] = useState(0);

    const beatTimeRef = useRef<number>(0);
    const patternIndexRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const eqIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const musicEngineRef = useRef<ReturnType<typeof getRhythmMusicEngine> | null>(null);

    // Use global acorn system
    const { balance: totalAcorns, earn: earnAcorns } = useAcornStore(language);

    const t = translations[language];

    // Load saved language
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLang = localStorage.getItem('brookvale-language') as Language;
            if (savedLang) setLanguage(savedLang);
        }
    }, []);

    // Load data
    useEffect(() => {
        const saved = localStorage.getItem('rhythmSurferData');
        if (saved) {
            const data = JSON.parse(saved);
            setSessions(data.sessions || []);
        }
    }, []);

    // Save data
    useEffect(() => {
        localStorage.setItem('rhythmSurferData', JSON.stringify({ sessions }));
    }, [sessions]);

    // Initialize music engine
    useEffect(() => {
        musicEngineRef.current = getRhythmMusicEngine();
        return () => {
            musicEngineRef.current?.dispose();
            musicEngineRef.current = null;
        };
    }, []);

    // Clean up intervals
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
            if (eqIntervalRef.current) clearInterval(eqIntervalRef.current);
        };
    }, []);

    // Player rank
    const playerStats: PlayerStats = useMemo(() => {
        const totalScore = sessions.reduce((acc, s) => acc + s.score, 0);
        const bestCombo = sessions.length > 0 ? Math.max(...sessions.map(s => s.maxCombo || 0)) : 0;
        let rank = RANKS[0];
        for (const r of RANKS) {
            if (totalScore >= r.minScore) rank = r;
        }
        return {
            totalSessions: sessions.length,
            totalScore,
            bestCombo,
            rank: language === 'ko' ? rank.nameKo : rank.name,
            rankEmoji: rank.emoji,
        };
    }, [sessions, language]);

    // Average accuracy
    const avgAccuracy = useMemo(() => {
        if (sessions.length === 0) return 0;
        return Math.round(sessions.reduce((acc, s) => acc + (s.accuracy || 0), 0) / sessions.length);
    }, [sessions]);

    // Filtered songs
    const filteredSongs = useMemo(() => {
        if (tempoFilter === 'all') return SONGS;
        return SONGS.filter(s => s.tempo === tempoFilter);
    }, [tempoFilter]);

    // EQ animation
    const startEQ = useCallback(() => {
        eqIntervalRef.current = setInterval(() => {
            setEqBars(prev => prev.map(() => 10 + Math.random() * 80));
        }, 120);
    }, []);

    const stopEQ = useCallback(() => {
        if (eqIntervalRef.current) clearInterval(eqIntervalRef.current);
        setEqBars(Array(8).fill(0));
    }, []);

    // Start game
    const startGame = useCallback(() => {
        if (!selectedSong) return;

        setIsPlaying(true);
        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setSessionStats({ perfect: 0, good: 0, miss: 0 });
        setTimeLeft(selectedSong.duration);
        patternIndexRef.current = 0;
        startEQ();

        // Start music!
        if (musicEngineRef.current) {
            musicEngineRef.current.play(selectedSong.id, selectedSong.bpm, selectedSong.duration);
        }

        // Timer countdown
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Beat generation
        const generateBeat = () => {
            const pattern = selectedSong.pattern;
            const interval = pattern[patternIndexRef.current % pattern.length];

            beatTimeRef.current = Date.now();
            setBeatVisible(true);
            setPulseIntensity(1);

            // Auto-hide beat after window
            setTimeout(() => {
                setBeatVisible(false);
                setPulseIntensity(0);
            }, 400);

            // Miss if not tapped
            setTimeout(() => {
                if (beatTimeRef.current !== 0) {
                    handleMiss();
                }
            }, 500);

            patternIndexRef.current++;
            intervalRef.current = setTimeout(generateBeat, interval);
        };

        generateBeat();
    }, [selectedSong, startEQ]);

    // Handle tap
    const handleTap = useCallback(() => {
        if (!isPlaying || !beatVisible) {
            handleMiss();
            return;
        }

        const timeDiff = Date.now() - beatTimeRef.current;
        beatTimeRef.current = 0;

        // Play tap click sound
        if (musicEngineRef.current) {
            musicEngineRef.current.playBeatClick();
        }
        setBeatVisible(false);

        if (timeDiff < 150) {
            // Perfect
            const points = 100 * (combo + 1);
            setScore(prev => prev + points);
            setCombo(prev => {
                const newCombo = prev + 1;
                setMaxCombo(mc => Math.max(mc, newCombo));
                return newCombo;
            });
            setFeedback('perfect');
            setSessionStats(prev => ({ ...prev, perfect: prev.perfect + 1 }));
        } else if (timeDiff < 300) {
            // Good
            const points = 50 * (combo + 1);
            setScore(prev => prev + points);
            setCombo(prev => {
                const newCombo = prev + 1;
                setMaxCombo(mc => Math.max(mc, newCombo));
                return newCombo;
            });
            setFeedback('good');
            setSessionStats(prev => ({ ...prev, good: prev.good + 1 }));
        } else {
            handleMiss();
        }

        setTimeout(() => setFeedback(null), 300);
    }, [isPlaying, beatVisible, combo]);

    // Handle miss
    const handleMiss = () => {
        setCombo(0);
        setFeedback('miss');
        setSessionStats(prev => ({ ...prev, miss: prev.miss + 1 }));
        setTimeout(() => setFeedback(null), 300);
    };

    // End game
    const endGame = useCallback(() => {
        if (intervalRef.current) clearTimeout(intervalRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        stopEQ();

        // Stop music
        if (musicEngineRef.current) {
            musicEngineRef.current.stop();
        }

        setIsPlaying(false);
        setShowResult(true);

        if (selectedSong) {
            const totalHits = sessionStats.perfect + sessionStats.good + sessionStats.miss;
            const accuracy = totalHits > 0
                ? Math.round(((sessionStats.perfect + sessionStats.good) / totalHits) * 100)
                : 0;

            const newSession: Session = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                song: language === 'ko' ? selectedSong.titleKo : selectedSong.title,
                songEmoji: selectedSong.emoji,
                score,
                maxCombo,
                accuracy,
                ...sessionStats,
            };

            // Check for new high score
            const prevHighScore = sessions.length > 0
                ? Math.max(...sessions.map(s => s.score))
                : 0;
            if (score > prevHighScore && score > 0) {
                setShowNewHighScore(true);
                setTimeout(() => setShowNewHighScore(false), 3000);
            }

            setSessions(prev => [newSession, ...prev].slice(0, 30));

            earnAcorns(10, 'Rhythm Surfer');
            setShowReward(true);
            setTimeout(() => setShowReward(false), 2500);
        }
    }, [selectedSong, score, maxCombo, sessionStats, earnAcorns, sessions, language, stopEQ]);

    // Reset
    const resetGame = () => {
        setShowResult(false);
        setSelectedSong(null);
        setBeatVisible(false);
        setFeedback(null);
        setPulseIntensity(0);
        if (musicEngineRef.current) {
            musicEngineRef.current.stop();
        }
    };

    // Get high score
    const highScore = sessions.length > 0
        ? Math.max(...sessions.map(s => s.score))
        : 0;

    // Get best song record
    const getSongBest = (songId: string) => {
        const songSessions = sessions.filter(s => {
            const song = SONGS.find(so => so.id === songId);
            return song && (s.song === song.title || s.song === song.titleKo);
        });
        if (songSessions.length === 0) return null;
        return Math.max(...songSessions.map(s => s.score));
    };

    // Result accuracy
    const resultAccuracy = useMemo(() => {
        const total = sessionStats.perfect + sessionStats.good + sessionStats.miss;
        if (total === 0) return 0;
        return Math.round(((sessionStats.perfect + sessionStats.good) / total) * 100);
    }, [sessionStats]);

    // Format date
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return language === 'ko'
            ? `${d.getMonth() + 1}/${d.getDate()}`
            : d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="rhythm-surfer-app">
            {/* Reward Toast */}
            {showReward && (
                <div className="reward-toast">
                    <span className="toast-icon">🎵</span>
                    <div className="toast-content">
                        <div className="toast-title">{t.questComplete}</div>
                        <div className="toast-reward">{t.acornsEarned}</div>
                    </div>
                </div>
            )}

            {/* New High Score Toast */}
            {showNewHighScore && (
                <div className="high-score-toast">
                    {t.newHighScore}
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <BackLink>{t.back}</BackLink>
                <h1>🎵 {t.title}</h1>
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

            {/* Game Area */}
            {!selectedSong ? (
                <>
                    {/* Player Rank Card */}
                    <section className="rank-card">
                        <div className="rank-info">
                            <span className="rank-emoji-large">{playerStats.rankEmoji}</span>
                            <div className="rank-text">
                                <span className="rank-label">{t.yourRank}</span>
                                <span className="rank-name">{playerStats.rank}</span>
                            </div>
                        </div>
                        <div className="rank-stats">
                            <div className="rs-stat">
                                <span className="rs-value">{playerStats.totalSessions}</span>
                                <span className="rs-label">{t.totalSessions}</span>
                            </div>
                            <div className="rs-stat">
                                <span className="rs-value">{highScore}</span>
                                <span className="rs-label">{t.highScore}</span>
                            </div>
                            <div className="rs-stat">
                                <span className="rs-value">{avgAccuracy}%</span>
                                <span className="rs-label">{t.avgAccuracy}</span>
                            </div>
                        </div>
                    </section>

                    {/* Tempo Filter */}
                    <div className="tempo-filter">
                        {(['all', 'slow', 'medium', 'fast'] as const).map(tempo => (
                            <button
                                key={tempo}
                                className={`tempo-pill ${tempoFilter === tempo ? 'active' : ''}`}
                                onClick={() => setTempoFilter(tempo)}
                            >
                                {tempo === 'all' ? t.all : t.tempo[tempo]}
                            </button>
                        ))}
                    </div>

                    {/* Song Selection */}
                    <section className="song-selection">
                        <h2>{t.selectSong}</h2>
                        <div className="song-grid">
                            {filteredSongs.map(song => {
                                const best = getSongBest(song.id);
                                return (
                                    <button
                                        key={song.id}
                                        className="song-card"
                                        onClick={() => setSelectedSong(song)}
                                        style={{ '--song-color': song.color } as React.CSSProperties}
                                    >
                                        <span className="song-emoji">{song.emoji}</span>
                                        <span className="song-title">
                                            {language === 'ko' ? song.titleKo : song.title}
                                        </span>
                                        <div className="song-meta">
                                            <span className={`tempo-tag ${song.tempo}`}>
                                                {t.tempo[song.tempo]}
                                            </span>
                                            <span className="bpm-tag">
                                                {song.bpm} {t.bpm}
                                            </span>
                                        </div>
                                        {best !== null && (
                                            <div className="song-best">
                                                ⭐ {best}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Session History */}
                    <section className="history-section">
                        <h2>{t.history}</h2>
                        {sessions.length === 0 ? (
                            <div className="empty-history">
                                <span className="empty-icon">🎵</span>
                                <p>{t.empty}</p>
                            </div>
                        ) : (
                            <div className="history-list">
                                {sessions.slice(0, 8).map(session => (
                                    <div key={session.id} className="history-item">
                                        <span className="hi-emoji">{session.songEmoji || '🎵'}</span>
                                        <div className="hi-info">
                                            <span className="hi-song">{session.song}</span>
                                            <span className="hi-date">{formatDate(session.date)}</span>
                                        </div>
                                        <div className="hi-stats">
                                            <span className="hi-score">{session.score}</span>
                                            <span className="hi-accuracy">{session.accuracy || 0}%</span>
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
                </>
            ) : showResult ? (
                /* Result Screen */
                <section className="result-section">
                    <div className="result-emoji">{selectedSong.emoji}</div>
                    <h2>{t.gameOver}</h2>

                    <div className="result-score">
                        <span className="score-label">{t.finalScore}</span>
                        <span className="score-number">{score}</span>
                    </div>

                    <div className="result-breakdown">
                        <div className="rb-item perfect">
                            <span className="rb-icon">🌟</span>
                            <span className="rb-label">{t.perfectHits}</span>
                            <span className="rb-value">{sessionStats.perfect}</span>
                        </div>
                        <div className="rb-item good">
                            <span className="rb-icon">👍</span>
                            <span className="rb-label">{t.goodHits}</span>
                            <span className="rb-value">{sessionStats.good}</span>
                        </div>
                        <div className="rb-item miss">
                            <span className="rb-icon">❌</span>
                            <span className="rb-label">{t.missHits}</span>
                            <span className="rb-value">{sessionStats.miss}</span>
                        </div>
                    </div>

                    <div className="result-extras">
                        <div className="re-stat">
                            <span className="re-label">{t.maxCombo}</span>
                            <span className="re-value">{maxCombo}x</span>
                        </div>
                        <div className="re-stat">
                            <span className="re-label">{t.accuracy}</span>
                            <span className="re-value">{resultAccuracy}%</span>
                        </div>
                    </div>

                    <div className="result-actions">
                        <button className="play-again-btn" onClick={() => { setShowResult(false); startGame(); }}>
                            🔄 {t.playAgain}
                        </button>
                        <button className="back-btn" onClick={resetGame}>
                            🎵 {t.backToSongs}
                        </button>
                    </div>
                </section>
            ) : (
                /* Game Play */
                <section className="game-section">
                    {/* Timer and Score */}
                    <div className="game-hud">
                        <div className="timer">⏱️ {timeLeft}s</div>
                        <div className="score-display">
                            <span>{t.score}: {score}</span>
                        </div>
                        <div className="combo-display">
                            {t.combo}: <span className={`combo-value ${combo >= 10 ? 'fire' : combo >= 5 ? 'hot' : ''}`}>
                                {combo}x
                            </span>
                        </div>
                    </div>

                    {/* EQ Visualizer */}
                    <div className="eq-visualizer">
                        {eqBars.map((height, i) => (
                            <div
                                key={i}
                                className="eq-bar"
                                style={{
                                    height: `${height}%`,
                                    backgroundColor: selectedSong.color,
                                    opacity: 0.6 + (height / 200),
                                }}
                            />
                        ))}
                    </div>

                    {/* Beat Zone */}
                    <div
                        className={`beat-zone ${isPlaying ? 'active' : ''}`}
                        onClick={isPlaying ? handleTap : startGame}
                        style={{ '--song-color': selectedSong.color } as React.CSSProperties}
                    >
                        <div
                            className={`beat-pulse ${pulseIntensity > 0 ? 'pulsing' : ''}`}
                            style={{ borderColor: selectedSong.color }}
                        />
                        <div className={`beat-target ${beatVisible ? 'visible' : ''}`}>
                            <div className="beat-circle" style={{ borderColor: selectedSong.color }} />
                        </div>

                        {!isPlaying && (
                            <div className="start-prompt">
                                <span className="song-emoji-large">{selectedSong.emoji}</span>
                                <h3>{language === 'ko' ? selectedSong.titleKo : selectedSong.title}</h3>
                                <span className="bpm-display">{selectedSong.bpm} BPM</span>
                                <p>{t.tapToStart}</p>
                            </div>
                        )}

                        {isPlaying && !beatVisible && !feedback && (
                            <p className="tap-instruction">{t.tapOnBeat}</p>
                        )}

                        {/* Feedback */}
                        {feedback && (
                            <div className={`feedback ${feedback}`}>
                                {feedback === 'perfect' && t.perfect}
                                {feedback === 'good' && t.good}
                                {feedback === 'miss' && t.miss}
                            </div>
                        )}
                    </div>

                    {/* Song info during play */}
                    <div className="now-playing">
                        <span className="np-emoji">{selectedSong.emoji}</span>
                        <span className="np-title">
                            {language === 'ko' ? selectedSong.titleKo : selectedSong.title}
                        </span>
                        <span className="np-bpm">{selectedSong.bpm} BPM</span>
                    </div>
                </section>
            )}
        </div>
    );
}
