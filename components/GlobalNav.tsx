'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function GlobalNav() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!session) return null;

    const isAdmin = true; // If they can see admin pages, they're admin
    const isMasterAdmin = session.user?.isMasterAdmin;

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
        { label: 'Meetings', href: '/admin/meetings', icon: '📅' },
        { label: 'Members', href: '/admin/members', icon: '👥' },
        { label: 'Categories', href: '/admin/categories', icon: '🏷️' },
        { label: 'Statistics', href: '/admin/statistics', icon: '📊' },
        { label: 'Subscription', href: '/admin/subscription', icon: '💎' },
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-14">
                    {/* Logo / Brand */}
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-indigo-700 text-lg shrink-0">
                        🗳️ <span className="hidden sm:inline">Toastmasters</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {isMasterAdmin && (
                            <Link
                                href="/master-admin"
                                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors"
                            >
                                🛡️ Admin
                            </Link>
                        )}
                        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-medium text-gray-700">{session.user?.name?.split(' ')[0]}</span>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="hidden sm:inline-flex text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
                        >
                            Sign Out
                        </button>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            {mobileMenuOpen ? (
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white">
                    <div className="px-4 py-3 space-y-1">
                        {navItems.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                        {isMasterAdmin && (
                            <Link
                                href="/master-admin"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                            >
                                <span>🛡️</span>
                                <span>Master Admin</span>
                            </Link>
                        )}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between px-3 py-2">
                            <span className="text-sm text-gray-500">{session.user?.name}</span>
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="text-xs text-red-500 font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
