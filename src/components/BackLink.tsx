'use client';

import { usePageTransition } from './PageTransition';

/**
 * A back-to-hub link that uses smooth page transitions.
 * Drop-in replacement for <a href="/" className="back-link">
 */
export function BackLink({ children, className = 'back-link' }: { children: React.ReactNode; className?: string }) {
    const { navigateWithTransition } = usePageTransition();

    return (
        <button
            className={className}
            onClick={(e) => {
                e.preventDefault();
                navigateWithTransition('/');
            }}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                font: 'inherit',
                color: 'inherit',
                padding: 0,
                textAlign: 'left',
            }}
        >
            {children}
        </button>
    );
}
