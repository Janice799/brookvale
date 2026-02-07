'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// ==================== TRANSITION CONTEXT ====================
interface TransitionContextType {
    navigateWithTransition: (href: string) => void;
    isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType>({
    navigateWithTransition: () => { },
    isTransitioning: false,
});

export const usePageTransition = () => useContext(TransitionContext);

// ==================== PAGE TRANSITION PROVIDER ====================
export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [displayChildren, setDisplayChildren] = useState(children);
    const [phase, setPhase] = useState<'idle' | 'fade-out' | 'fade-in'>('idle');

    // Page enter animation on route change
    useEffect(() => {
        setPhase('fade-in');
        setDisplayChildren(children);
        const timer = setTimeout(() => {
            setPhase('idle');
            setIsTransitioning(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [pathname, children]);

    const navigateWithTransition = useCallback((href: string) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setPhase('fade-out');

        // Wait for fade-out to complete, then navigate
        setTimeout(() => {
            router.push(href);
        }, 350);
    }, [router, isTransitioning]);

    return (
        <TransitionContext.Provider value={{ navigateWithTransition, isTransitioning }}>
            <div
                className={`page-transition-wrapper ${phase === 'fade-out' ? 'page-exit' :
                        phase === 'fade-in' ? 'page-enter' : ''
                    }`}
            >
                {displayChildren}
            </div>
        </TransitionContext.Provider>
    );
}
