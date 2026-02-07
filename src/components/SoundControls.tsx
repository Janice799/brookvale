'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    initializeAudio,
    playUISound,
    startZoneAmbient,
    stopAllAmbient,
    setMasterVolume,
    setAmbientVolume,
    setUIVolume,
    toggleMute,
    getAudioState,
    cleanupAudio,
    type ZoneAmbient,
} from '@/lib/soundManager';
import './sound-controls.css';

interface SoundControlsProps {
    currentZone?: ZoneAmbient;
    compact?: boolean;
}

export function SoundControls({ currentZone, compact = true }: SoundControlsProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const [volumes, setVolumes] = useState({
        master: 0.7,
        ambient: 0.5,
        ui: 0.8,
    });
    const [activeZone, setActiveZone] = useState<ZoneAmbient | null>(null);

    // Initialize audio on first user interaction
    const handleInitialize = useCallback(async () => {
        if (!isInitialized) {
            const success = await initializeAudio();
            if (success) {
                setIsInitialized(true);
                playUISound('pop');

                // Start ambient for current zone if available
                if (currentZone) {
                    startZoneAmbient(currentZone);
                    setActiveZone(currentZone);
                }
            }
        }
    }, [isInitialized, currentZone]);

    // Update zone ambient when zone changes
    useEffect(() => {
        if (isInitialized && currentZone && currentZone !== activeZone) {
            startZoneAmbient(currentZone);
            setActiveZone(currentZone);
        }
    }, [currentZone, isInitialized, activeZone]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupAudio();
        };
    }, []);

    // Sync with audio state
    useEffect(() => {
        const state = getAudioState();
        setIsMuted(state.isMuted);
        setVolumes({
            master: state.masterVolume,
            ambient: state.ambientVolume,
            ui: state.uiVolume,
        });
    }, [isInitialized]);

    const handleToggleMute = () => {
        const muted = toggleMute();
        setIsMuted(muted);
        if (!muted) {
            playUISound('pop');
        }
    };

    const handleMasterVolume = (value: number) => {
        setVolumes(prev => ({ ...prev, master: value }));
        setMasterVolume(value);
    };

    const handleAmbientVolume = (value: number) => {
        setVolumes(prev => ({ ...prev, ambient: value }));
        setAmbientVolume(value);
    };

    const handleUIVolume = (value: number) => {
        setVolumes(prev => ({ ...prev, ui: value }));
        setUIVolume(value);
    };

    const handleTestSound = (type: 'click' | 'success' | 'reward') => {
        playUISound(type);
    };

    // Compact mode - just a speaker icon
    if (compact) {
        return (
            <div className="sound-controls-compact">
                {!isInitialized ? (
                    <button
                        className="sound-btn sound-btn-init"
                        onClick={handleInitialize}
                        title="Enable Sound"
                    >
                        <span className="sound-icon">🔈</span>
                        <span className="sound-label">Sound</span>
                    </button>
                ) : (
                    <>
                        <button
                            className={`sound-btn ${isMuted ? 'muted' : ''}`}
                            onClick={handleToggleMute}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            <span className="sound-icon">{isMuted ? '🔇' : '🔊'}</span>
                        </button>
                        <button
                            className="sound-btn sound-btn-settings"
                            onClick={() => setShowPanel(!showPanel)}
                            title="Sound Settings"
                        >
                            <span className="sound-icon">⚙️</span>
                        </button>
                    </>
                )}

                {/* Expanded settings panel */}
                {showPanel && isInitialized && (
                    <div className="sound-panel">
                        <div className="sound-panel-header">
                            <span>🎵 Sound Settings</span>
                            <button className="sound-panel-close" onClick={() => setShowPanel(false)}>×</button>
                        </div>

                        <div className="sound-slider-group">
                            <label>
                                <span>🔊 Master</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={volumes.master}
                                    onChange={(e) => handleMasterVolume(parseFloat(e.target.value))}
                                />
                                <span className="volume-value">{Math.round(volumes.master * 100)}%</span>
                            </label>
                        </div>

                        <div className="sound-slider-group">
                            <label>
                                <span>🌿 Ambient</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={volumes.ambient}
                                    onChange={(e) => handleAmbientVolume(parseFloat(e.target.value))}
                                />
                                <span className="volume-value">{Math.round(volumes.ambient * 100)}%</span>
                            </label>
                        </div>

                        <div className="sound-slider-group">
                            <label>
                                <span>🎮 UI</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={volumes.ui}
                                    onChange={(e) => handleUIVolume(parseFloat(e.target.value))}
                                />
                                <span className="volume-value">{Math.round(volumes.ui * 100)}%</span>
                            </label>
                        </div>

                        <div className="sound-test-buttons">
                            <span>Test:</span>
                            <button onClick={() => handleTestSound('click')}>Click</button>
                            <button onClick={() => handleTestSound('success')}>Success</button>
                            <button onClick={() => handleTestSound('reward')}>Reward</button>
                        </div>

                        {activeZone && (
                            <div className="sound-zone-info">
                                <span>🗺️ Active Zone: {activeZone}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Full panel mode (for settings page)
    return (
        <div className="sound-controls-full">
            <h3>🎵 Sound Settings</h3>

            {!isInitialized ? (
                <button className="sound-enable-btn" onClick={handleInitialize}>
                    Enable Sound System
                </button>
            ) : (
                <>
                    <div className="sound-status">
                        <span className={`status-indicator ${isMuted ? 'muted' : 'active'}`} />
                        <span>{isMuted ? 'Muted' : 'Active'}</span>
                        <button onClick={handleToggleMute}>
                            {isMuted ? 'Unmute' : 'Mute'}
                        </button>
                    </div>

                    <div className="sound-sliders">
                        <div className="slider-row">
                            <label>Master Volume</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volumes.master}
                                onChange={(e) => handleMasterVolume(parseFloat(e.target.value))}
                            />
                            <span>{Math.round(volumes.master * 100)}%</span>
                        </div>

                        <div className="slider-row">
                            <label>Ambient (ASMR)</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volumes.ambient}
                                onChange={(e) => handleAmbientVolume(parseFloat(e.target.value))}
                            />
                            <span>{Math.round(volumes.ambient * 100)}%</span>
                        </div>

                        <div className="slider-row">
                            <label>UI Effects</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volumes.ui}
                                onChange={(e) => handleUIVolume(parseFloat(e.target.value))}
                            />
                            <span>{Math.round(volumes.ui * 100)}%</span>
                        </div>
                    </div>

                    <div className="zone-selector">
                        <label>Preview Zone Ambient:</label>
                        <div className="zone-buttons">
                            {(['forest', 'town', 'lake', 'hill', 'cloud'] as ZoneAmbient[]).map((zone) => (
                                <button
                                    key={zone}
                                    className={activeZone === zone ? 'active' : ''}
                                    onClick={() => {
                                        startZoneAmbient(zone);
                                        setActiveZone(zone);
                                    }}
                                >
                                    {zone === 'forest' && '🌲'}
                                    {zone === 'town' && '🏘️'}
                                    {zone === 'lake' && '🌊'}
                                    {zone === 'hill' && '⭐'}
                                    {zone === 'cloud' && '☁️'}
                                    <span>{zone}</span>
                                </button>
                            ))}
                            <button onClick={() => { stopAllAmbient(); setActiveZone(null); }}>
                                🔇 Stop
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Hook for playing sounds from any component
export function useBrookvaleSound() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const state = getAudioState();
        setIsReady(state.isInitialized);
    }, []);

    const play = useCallback((type: Parameters<typeof playUISound>[0]) => {
        if (isReady) {
            playUISound(type);
        }
    }, [isReady]);

    const changeZone = useCallback((zone: ZoneAmbient) => {
        if (isReady) {
            startZoneAmbient(zone);
        }
    }, [isReady]);

    return {
        isReady,
        playClick: () => play('click'),
        playSuccess: () => play('success'),
        playReward: () => play('reward'),
        playLevelUp: () => play('levelUp'),
        playQuest: () => play('quest'),
        playPop: () => play('pop'),
        playWhoosh: () => play('whoosh'),
        changeZone,
    };
}
