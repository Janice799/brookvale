'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import './performance-optimization.css';

// ==================== DEVICE PERFORMANCE DETECTION ====================
export type PerformanceLevel = 'high' | 'medium' | 'low';

export function usePerformanceLevel(): PerformanceLevel {
    const [level, setLevel] = useState<PerformanceLevel>('high');

    useEffect(() => {
        // Check device capabilities
        const checkPerformance = () => {
            // Check for mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );

            // Check hardware concurrency (CPU cores)
            const cores = navigator.hardwareConcurrency || 4;

            // Check device memory (if available)
            const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;

            // Check WebGL capabilities
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            let gpuTier = 'high';

            if (gl) {
                const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    // Detect low-end GPUs
                    if (/Intel|Mali-4|Adreno 3|PowerVR/i.test(renderer)) {
                        gpuTier = 'low';
                    } else if (/Mali-T|Adreno 4|Adreno 5|Intel.*UHD/i.test(renderer)) {
                        gpuTier = 'medium';
                    }
                }
            }

            // Calculate performance level
            if (isMobile || cores <= 2 || memory <= 2 || gpuTier === 'low') {
                setLevel('low');
            } else if (cores <= 4 || memory <= 4 || gpuTier === 'medium') {
                setLevel('medium');
            } else {
                setLevel('high');
            }
        };

        checkPerformance();
    }, []);

    return level;
}

// ==================== QUALITY SETTINGS ====================
export interface QualitySettings {
    shadowQuality: 'none' | 'low' | 'high';
    particleCount: number;
    animationDetail: 'simple' | 'full';
    waterWaves: boolean;
    cloudsEnabled: boolean;
    postProcessing: boolean;
}

export function getQualitySettings(level: PerformanceLevel): QualitySettings {
    switch (level) {
        case 'low':
            return {
                shadowQuality: 'none',
                particleCount: 5,
                animationDetail: 'simple',
                waterWaves: false,
                cloudsEnabled: false,
                postProcessing: false,
            };
        case 'medium':
            return {
                shadowQuality: 'low',
                particleCount: 15,
                animationDetail: 'simple',
                waterWaves: true,
                cloudsEnabled: true,
                postProcessing: false,
            };
        case 'high':
        default:
            return {
                shadowQuality: 'high',
                particleCount: 30,
                animationDetail: 'full',
                waterWaves: true,
                cloudsEnabled: true,
                postProcessing: true,
            };
    }
}

// ==================== 3D LOADING SCREEN ====================
interface LoadingScreenProps {
    progress?: number;
    message?: string;
}

export function LoadingScreen({ progress = 0, message = 'Loading Brookvale...' }: LoadingScreenProps) {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="loading-screen-3d">
            <div className="loading-gradient-bg" />

            <div className="loading-content">
                {/* Animated Logo */}
                <div className="loading-logo-container">
                    <span className="loading-logo">🏡</span>
                    <div className="loading-glow" />
                </div>

                {/* Title */}
                <h1 className="loading-title">Brookvale</h1>
                <p className="loading-subtitle">Healing Village</p>

                {/* Progress Bar */}
                <div className="loading-progress-container">
                    <div className="loading-progress-bar">
                        <div
                            className="loading-progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="loading-progress-text">{Math.round(progress)}%</span>
                </div>

                {/* Message */}
                <p className="loading-message">{message}{dots}</p>

                {/* Floating Elements */}
                <div className="loading-floating-elements">
                    <span className="floating-element" style={{ animationDelay: '0s' }}>🌳</span>
                    <span className="floating-element" style={{ animationDelay: '0.5s' }}>🌸</span>
                    <span className="floating-element" style={{ animationDelay: '1s' }}>🦋</span>
                    <span className="floating-element" style={{ animationDelay: '1.5s' }}>✨</span>
                    <span className="floating-element" style={{ animationDelay: '2s' }}>🍃</span>
                </div>
            </div>
        </div>
    );
}

// ==================== MOBILE TOUCH JOYSTICK ====================
interface TouchJoystickProps {
    onMove: (direction: { forward: boolean; backward: boolean; left: boolean; right: boolean }) => void;
    onRun?: (isRunning: boolean) => void;
}

export function TouchJoystick({ onMove, onRun }: TouchJoystickProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
    const [isActive, setIsActive] = useState(false);
    const baseRef = useRef<HTMLDivElement>(null);
    const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    useEffect(() => {
        // Detect touch device
        const checkTouch = () => {
            setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
        };
        checkTouch();
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (baseRef.current) {
            const rect = baseRef.current.getBoundingClientRect();
            centerRef.current = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            };
        }
        setIsActive(true);
        handleTouchMove(e);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isActive && e.type !== 'touchstart') return;

        const touch = e.touches[0];
        const dx = touch.clientX - centerRef.current.x;
        const dy = touch.clientY - centerRef.current.y;

        // Limit to circle
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 40;
        const limitedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(dy, dx);

        const x = Math.cos(angle) * limitedDistance;
        const y = Math.sin(angle) * limitedDistance;

        setJoystickPos({ x, y });

        // Calculate direction based on joystick position
        const threshold = 15;
        const forward = y < -threshold;
        const backward = y > threshold;
        const left = x < -threshold;
        const right = x > threshold;

        onMove({ forward, backward, left, right });

        // Run when pushed far
        if (onRun) {
            onRun(distance > maxDistance * 0.8);
        }
    }, [isActive, onMove, onRun]);

    const handleTouchEnd = useCallback(() => {
        setIsActive(false);
        setJoystickPos({ x: 0, y: 0 });
        onMove({ forward: false, backward: false, left: false, right: false });
        if (onRun) onRun(false);
    }, [onMove, onRun]);

    if (!isMobile) return null;

    return (
        <div className="touch-joystick-container">
            <div
                ref={baseRef}
                className="joystick-base"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className={`joystick-knob ${isActive ? 'active' : ''}`}
                    style={{
                        transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                    }}
                />
                <div className="joystick-directions">
                    <span className="direction up">▲</span>
                    <span className="direction down">▼</span>
                    <span className="direction left">◀</span>
                    <span className="direction right">▶</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="touch-action-buttons">
                <button
                    className="action-btn interact"
                    onTouchStart={(e) => {
                        e.preventDefault();
                        // Trigger interaction
                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
                    }}
                >
                    👆
                </button>
            </div>
        </div>
    );
}

// ==================== FPS COUNTER (Dev Tool) ====================
export function FPSCounter() {
    const [fps, setFps] = useState(60);
    const frameRef = useRef<number[]>([]);

    useEffect(() => {
        let animationId: number;
        let lastTime = performance.now();

        const measureFPS = (currentTime: number) => {
            const delta = currentTime - lastTime;
            lastTime = currentTime;

            frameRef.current.push(1000 / delta);
            if (frameRef.current.length > 30) {
                frameRef.current.shift();
            }

            const avgFps = frameRef.current.reduce((a, b) => a + b, 0) / frameRef.current.length;
            setFps(Math.round(avgFps));

            animationId = requestAnimationFrame(measureFPS);
        };

        animationId = requestAnimationFrame(measureFPS);
        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div className="fps-counter">
            <span className={fps < 30 ? 'low' : fps < 50 ? 'medium' : 'high'}>
                {fps} FPS
            </span>
        </div>
    );
}

// ==================== PERFORMANCE INDICATOR ====================
interface PerformanceIndicatorProps {
    level: PerformanceLevel;
    showDetails?: boolean;
}

export function PerformanceIndicator({ level, showDetails = false }: PerformanceIndicatorProps) {
    const labels = {
        high: '🚀 HD',
        medium: '⚡ 일반',
        low: '🔋 절전',
    };

    const descriptions = {
        high: '최고 품질 • 모든 효과 활성화',
        medium: '균형 모드 • 일부 효과 감소',
        low: '절전 모드 • 필수 요소만 표시',
    };

    return (
        <div className="performance-indicator">
            <span className={`dot ${level}`} />
            <span className="level-label">{labels[level]}</span>
            {showDetails && (
                <span className="level-description">{descriptions[level]}</span>
            )}
        </div>
    );
}
