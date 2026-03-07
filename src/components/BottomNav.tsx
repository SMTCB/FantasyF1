'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Trophy,
    Flag,
    Settings,
    ChevronRight,
    ClipboardList,
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/bets/year', label: 'Year Bets', icon: Trophy },
    { href: '/bets/race', label: 'Race Bets', icon: Flag },
    { href: '/bets/report', label: 'Report', icon: ClipboardList },
    { href: '/admin', label: 'Admin', icon: Settings },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50">
            {/* Blur backdrop */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.8) 100%)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
            />

            {/* Scanline accent */}
            <div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(225,6,0,0.4) 30%, rgba(225,6,0,0.4) 70%, transparent 100%)',
                }}
            />

            <div className="relative flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        item.href === '/'
                            ? pathname === '/'
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
                            style={{
                                color: isActive ? '#e10600' : '#777',
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 rounded-lg"
                                    style={{
                                        background: 'rgba(225, 6, 0, 0.08)',
                                        border: '1px solid rgba(225, 6, 0, 0.15)',
                                    }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                />
                            )}

                            <item.icon
                                size={20}
                                strokeWidth={isActive ? 2.2 : 1.6}
                                className="relative z-10"
                            />
                            <span
                                className="relative z-10 text-[10px] font-medium tracking-wider uppercase"
                                style={{ fontFamily: 'var(--font-mono)' }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
