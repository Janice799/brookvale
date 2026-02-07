import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PageTransitionProvider } from "@/components/PageTransition";

export const metadata: Metadata = {
    title: "Brookvale - Living Pixel World",
    description: "A place where your daily life becomes a living world",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Brookvale",
    },
    icons: {
        icon: "/icon-192x192.png",
        apple: "/icon-192x192.png",
    },
};

export const viewport: Viewport = {
    themeColor: "#0D1B3E",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
            </head>
            <body>
                <PageTransitionProvider>
                    {children}
                </PageTransitionProvider>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator) {
                                window.addEventListener('load', function() {
                                    navigator.serviceWorker.register('/sw.js')
                                        .then(function(reg) { console.log('SW registered:', reg.scope); })
                                        .catch(function(err) { console.log('SW registration failed:', err); });
                                });
                            }
                        `,
                    }}
                />
            </body>
        </html>
    );
}
