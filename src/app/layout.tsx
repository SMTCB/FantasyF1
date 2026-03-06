import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'F1 Paddock — Fantasy League 2026',
    description: 'Private Fantasy F1 League with Pit Wall Dashboard. Race bets, year bets, and live scoring.',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Paddock F1',
    },
};

export const viewport: Viewport = {
    themeColor: '#e10600',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />
            </head>
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
