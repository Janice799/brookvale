'use client';

import { useRouter } from 'next/navigation';

interface ComingSoonAppProps {
    appName: string;
    emoji: string;
    description: string;
    themeColor: string; // Background gradient via simple color or class
}

export default function ComingSoonApp({ appName, emoji, description, themeColor }: ComingSoonAppProps) {
    const router = useRouter();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: themeColor,
            color: 'white',
            textAlign: 'center',
            padding: '2rem',
            position: 'relative',
        }}>
            <button
                onClick={() => router.push('/')}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backdropFilter: 'blur(5px)',
                }}
            >
                ← Back to World
            </button>

            <div style={{
                fontSize: '6rem',
                marginBottom: '1rem',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))',
                animation: 'float 3s ease-in-out infinite'
            }}>
                {emoji}
            </div>

            <h1 style={{
                fontSize: '2.5rem',
                marginBottom: '1rem',
                fontWeight: '800',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
                {appName}
            </h1>

            <p style={{
                fontSize: '1.2rem',
                maxWidth: '600px',
                lineHeight: '1.6',
                opacity: '0.9',
                marginBottom: '3rem',
                background: 'rgba(0,0,0,0.1)',
                padding: '1rem',
                borderRadius: '16px',
            }}>
                {description}
            </p>

            <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.15)',
                padding: '1rem 2rem',
                borderRadius: '50px',
                backdropFilter: 'blur(10px)',
            }}>
                <span style={{ fontSize: '1.5rem' }}>🚧</span>
                <span style={{ fontWeight: '600' }}>Under Construction</span>
                <span style={{ fontSize: '1.5rem' }}>🏗️</span>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
            `}</style>
        </div>
    );
}
