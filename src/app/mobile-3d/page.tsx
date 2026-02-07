'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import for 3D component (no SSR)
const World3DMap = dynamic(() => import('@/components/World3DMap'), { ssr: false });

export default function Mobile3DPage() {
    const router = useRouter();

    const handleAppClick = (appId: string) => {
        router.push(`/${appId}`);
    };

    // Sample quest apps for testing
    const questApps = ['focus-cat', 'tiny-wins', 'daily-quest'];

    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <World3DMap onAppClick={handleAppClick} questApps={questApps} />

            {/* Bottom Navigation */}
            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-around',
                padding: '12px 16px',
                background: 'rgba(13, 27, 62, 0.95)',
                backdropFilter: 'blur(10px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                zIndex: 100,
            }}>
                <button
                    onClick={() => router.push('/mobile')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                    }}
                >
                    <span style={{ fontSize: '1.3rem' }}>🗺️</span>
                    <span>2D Map</span>
                </button>
                <button
                    style={{
                        background: 'linear-gradient(135deg, #FFD54F, #FFA726)',
                        border: 'none',
                        color: '#1a1a2e',
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                        padding: '8px 16px',
                        borderRadius: 8,
                        fontWeight: 'bold',
                    }}
                >
                    <span style={{ fontSize: '1.3rem' }}>🌍</span>
                    <span>3D Map</span>
                </button>
                <button
                    onClick={() => router.push('/')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                    }}
                >
                    <span style={{ fontSize: '1.3rem' }}>🎮</span>
                    <span>Full 3D</span>
                </button>
            </nav>
        </div>
    );
}
