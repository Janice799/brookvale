'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ==================== WEATHER TYPES ====================
export type WeatherType = 'clear' | 'cloudy' | 'rainy' | 'snowy' | 'foggy' | 'stormy';

interface WeatherConfig {
    particleCount: number;
    particleColor: string;
    particleSize: number;
    fallSpeed: number;
    windSpeed: number;
    fogDensity: number;
    ambientModifier: number;
    cloudOpacity: number;
}

// Weather presets
const WEATHER_PRESETS: Record<WeatherType, WeatherConfig> = {
    clear: {
        particleCount: 0,
        particleColor: '#ffffff',
        particleSize: 0,
        fallSpeed: 0,
        windSpeed: 0,
        fogDensity: 0,
        ambientModifier: 1.0,
        cloudOpacity: 0.3,
    },
    cloudy: {
        particleCount: 0,
        particleColor: '#ffffff',
        particleSize: 0,
        fallSpeed: 0,
        windSpeed: 0.5,
        fogDensity: 0.1,
        ambientModifier: 0.8,
        cloudOpacity: 0.7,
    },
    rainy: {
        particleCount: 500,
        particleColor: '#a0c4ff',
        particleSize: 0.08,
        fallSpeed: 25,
        windSpeed: 2,
        fogDensity: 0.2,
        ambientModifier: 0.6,
        cloudOpacity: 0.9,
    },
    snowy: {
        particleCount: 300,
        particleColor: '#ffffff',
        particleSize: 0.15,
        fallSpeed: 3,
        windSpeed: 1,
        fogDensity: 0.15,
        ambientModifier: 0.9,
        cloudOpacity: 0.8,
    },
    foggy: {
        particleCount: 0,
        particleColor: '#ffffff',
        particleSize: 0,
        fallSpeed: 0,
        windSpeed: 0.2,
        fogDensity: 0.5,
        ambientModifier: 0.5,
        cloudOpacity: 0.6,
    },
    stormy: {
        particleCount: 800,
        particleColor: '#7ec8e3',
        particleSize: 0.1,
        fallSpeed: 35,
        windSpeed: 5,
        fogDensity: 0.3,
        ambientModifier: 0.4,
        cloudOpacity: 1.0,
    },
};

// Global weather state
let currentWeather: WeatherType = 'clear';
let weatherChangeCallbacks: (() => void)[] = [];

export function setWeather(weather: WeatherType): void {
    currentWeather = weather;
    weatherChangeCallbacks.forEach(cb => cb());
}

export function getWeather(): WeatherType {
    return currentWeather;
}

// ==================== RAIN SYSTEM ====================
interface RainProps {
    intensity?: number;
}

export function Rain({ intensity = 1 }: RainProps) {
    const pointsRef = useRef<THREE.Points>(null);
    const config = WEATHER_PRESETS.rainy;

    const particleData = useMemo(() => {
        const count = Math.floor(config.particleCount * intensity);
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // Random positions in a box above the scene
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = Math.random() * 50 + 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

            // Random fall speeds
            velocities[i] = config.fallSpeed * (0.8 + Math.random() * 0.4);
        }

        return { positions, velocities, count };
    }, [config.particleCount, config.fallSpeed, intensity]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;

        const positionArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < particleData.count; i++) {
            // Move down
            positionArray[i * 3 + 1] -= particleData.velocities[i] * delta;

            // Wind effect
            positionArray[i * 3] += config.windSpeed * delta;

            // Reset if below ground
            if (positionArray[i * 3 + 1] < -5) {
                positionArray[i * 3] = (Math.random() - 0.5) * 100;
                positionArray[i * 3 + 1] = 50 + Math.random() * 10;
                positionArray[i * 3 + 2] = (Math.random() - 0.5) * 100;
            }
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    if (intensity === 0) return null;

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[particleData.positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color={config.particleColor}
                size={config.particleSize}
                transparent
                opacity={0.6}
                sizeAttenuation
            />
        </points>
    );
}

// ==================== SNOW SYSTEM ====================
interface SnowProps {
    intensity?: number;
}

export function Snow({ intensity = 1 }: SnowProps) {
    const pointsRef = useRef<THREE.Points>(null);
    const config = WEATHER_PRESETS.snowy;

    const particleData = useMemo(() => {
        const count = Math.floor(config.particleCount * intensity);
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const offsets = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = Math.random() * 50 + 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

            sizes[i] = config.particleSize * (0.5 + Math.random() * 0.5);
            offsets[i] = Math.random() * Math.PI * 2;
        }

        return { positions, sizes, offsets, count };
    }, [config.particleCount, config.particleSize, intensity]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;

        const time = state.clock.elapsedTime;
        const positionArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < particleData.count; i++) {
            // Gentle fall
            positionArray[i * 3 + 1] -= config.fallSpeed * delta;

            // Swaying motion
            positionArray[i * 3] += Math.sin(time + particleData.offsets[i]) * 0.02;
            positionArray[i * 3 + 2] += Math.cos(time + particleData.offsets[i]) * 0.02;

            // Wind effect
            positionArray[i * 3] += config.windSpeed * delta;

            // Reset if below ground
            if (positionArray[i * 3 + 1] < -2) {
                positionArray[i * 3] = (Math.random() - 0.5) * 100;
                positionArray[i * 3 + 1] = 40 + Math.random() * 15;
                positionArray[i * 3 + 2] = (Math.random() - 0.5) * 100;
            }
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    if (intensity === 0) return null;

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[particleData.positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-size"
                    args={[particleData.sizes, 1]}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#ffffff"
                size={config.particleSize}
                transparent
                opacity={0.9}
                sizeAttenuation
            />
        </points>
    );
}

// ==================== DYNAMIC CLOUDS ====================
interface CloudLayerProps {
    weather?: WeatherType;
}

export function CloudLayer({ weather = 'clear' }: CloudLayerProps) {
    const groupRef = useRef<THREE.Group>(null);
    const config = WEATHER_PRESETS[weather];

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Clouds drift slowly
        groupRef.current.children.forEach((cloud, index) => {
            cloud.position.x += (0.1 + index * 0.02) * delta;

            // Wrap around
            if (cloud.position.x > 80) {
                cloud.position.x = -80;
            }
        });
    });

    // Generate cloud positions
    const clouds = useMemo(() => {
        const cloudData = [];
        const cloudCount = weather === 'clear' ? 5 : weather === 'stormy' ? 15 : 10;

        for (let i = 0; i < cloudCount; i++) {
            cloudData.push({
                position: [
                    (Math.random() - 0.5) * 150,
                    35 + Math.random() * 20,
                    (Math.random() - 0.5) * 150,
                ] as [number, number, number],
                scale: 2 + Math.random() * 3,
            });
        }

        return cloudData;
    }, [weather]);

    return (
        <group ref={groupRef}>
            {clouds.map((cloud, index) => (
                <mesh key={index} position={cloud.position}>
                    <sphereGeometry args={[cloud.scale, 16, 16]} />
                    <meshStandardMaterial
                        color={weather === 'stormy' ? '#404040' : '#ffffff'}
                        transparent
                        opacity={config.cloudOpacity}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ==================== LIGHTNING ====================
interface LightningProps {
    active?: boolean;
    interval?: number;
}

export function Lightning({ active = false, interval = 5000 }: LightningProps) {
    const lightRef = useRef<THREE.PointLight>(null);
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        if (!active) return;

        const triggerLightning = () => {
            // Multiple quick flashes for realism
            setFlash(true);
            setTimeout(() => setFlash(false), 50);
            setTimeout(() => setFlash(true), 100);
            setTimeout(() => setFlash(false), 150);
            setTimeout(() => setFlash(true), 200);
            setTimeout(() => setFlash(false), 250);
        };

        // Random interval
        const scheduleNext = () => {
            const randomDelay = interval * (0.5 + Math.random());
            return setTimeout(() => {
                triggerLightning();
                scheduleNext();
            }, randomDelay);
        };

        const timeout = scheduleNext();

        return () => clearTimeout(timeout);
    }, [active, interval]);

    return (
        <pointLight
            ref={lightRef}
            position={[0, 50, 0]}
            intensity={flash ? 100 : 0}
            color="#e6f0ff"
            distance={200}
            decay={1}
        />
    );
}

// ==================== GROUND PUDDLES ====================
interface PuddlesProps {
    visible?: boolean;
}

export function Puddles({ visible = false }: PuddlesProps) {
    const puddlePositions = useMemo(() => {
        const positions: [number, number, number][] = [];
        for (let i = 0; i < 10; i++) {
            positions.push([
                (Math.random() - 0.5) * 40,
                0.05,
                (Math.random() - 0.5) * 40,
            ]);
        }
        return positions;
    }, []);

    if (!visible) return null;

    return (
        <group>
            {puddlePositions.map((pos, index) => (
                <mesh key={index} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[1 + Math.random(), 16]} />
                    <meshStandardMaterial
                        color="#4a90a4"
                        transparent
                        opacity={0.6}
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ==================== WEATHER MANAGER ====================
interface WeatherManagerProps {
    weather?: WeatherType;
    autoChange?: boolean;
    changeInterval?: number;
}

export function WeatherManager({
    weather = 'clear',
    autoChange = false,
    changeInterval = 60000,
}: WeatherManagerProps) {
    const [activeWeather, setActiveWeather] = useState<WeatherType>(weather);

    useEffect(() => {
        setActiveWeather(weather);
    }, [weather]);

    // Auto-change weather
    useEffect(() => {
        if (!autoChange) return;

        const weatherCycle: WeatherType[] = ['clear', 'cloudy', 'rainy', 'clear', 'snowy', 'foggy'];
        let currentIndex = 0;

        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % weatherCycle.length;
            setActiveWeather(weatherCycle[currentIndex]);
        }, changeInterval);

        return () => clearInterval(interval);
    }, [autoChange, changeInterval]);

    return (
        <>
            {/* Cloud layer */}
            <CloudLayer weather={activeWeather} />

            {/* Rain particles */}
            {(activeWeather === 'rainy' || activeWeather === 'stormy') && (
                <Rain intensity={activeWeather === 'stormy' ? 1.5 : 1} />
            )}

            {/* Snow particles */}
            {activeWeather === 'snowy' && <Snow intensity={1} />}

            {/* Lightning for storms */}
            {activeWeather === 'stormy' && <Lightning active interval={3000} />}

            {/* Ground puddles during/after rain */}
            {(activeWeather === 'rainy' || activeWeather === 'stormy') && (
                <Puddles visible />
            )}
        </>
    );
}

// ==================== WEATHER UI CONTROL ====================
export function WeatherControl() {
    const [weather, setWeatherState] = useState<WeatherType>('clear');

    const handleChange = (newWeather: WeatherType) => {
        setWeatherState(newWeather);
        setWeather(newWeather);
    };

    const getWeatherEmoji = (w: WeatherType) => {
        switch (w) {
            case 'clear': return '☀️';
            case 'cloudy': return '☁️';
            case 'rainy': return '🌧️';
            case 'snowy': return '❄️';
            case 'foggy': return '🌫️';
            case 'stormy': return '⛈️';
        }
    };

    return (
        <div className="weather-control" style={{
            position: 'fixed',
            top: '80px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex',
            gap: '8px',
            zIndex: 100,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
            {(['clear', 'cloudy', 'rainy', 'snowy', 'foggy', 'stormy'] as WeatherType[]).map(w => (
                <button
                    key={w}
                    onClick={() => handleChange(w)}
                    style={{
                        width: '36px',
                        height: '36px',
                        border: weather === w ? '2px solid #2196F3' : '2px solid transparent',
                        borderRadius: '8px',
                        background: weather === w ? '#E3F2FD' : '#f5f5f5',
                        cursor: 'pointer',
                        fontSize: '18px',
                        transition: 'all 0.2s',
                    }}
                    title={w}
                >
                    {getWeatherEmoji(w)}
                </button>
            ))}
        </div>
    );
}
