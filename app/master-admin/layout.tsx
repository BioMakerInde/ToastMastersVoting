'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MasterAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/login');
            return;
        }

        // Check if user is a master admin
        if (!session.user?.isMasterAdmin) {
            router.push('/dashboard');
            return;
        }

        setIsAuthorized(true);
    }, [session, status, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 max-w-md text-center">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
                    <p className="text-gray-400 mb-4">You do not have permission to access the Master Admin panel.</p>
                    <Link
                        href="/dashboard"
                        className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 border-r border-gray-700 p-4 flex flex-col">
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-purple-400">🛡️ Master Admin</h1>
                    <p className="text-xs text-gray-500 mt-1">Site-wide Control Panel</p>
                </div>

                <nav className="flex-1 space-y-1">
                    <Link href="/master-admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
                        <span>📊</span>
                        <span>Dashboard</span>
                    </Link>
                    <Link href="/master-admin/clubs" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
                        <span>🏢</span>
                        <span>Clubs</span>
                    </Link>
                    <Link href="/master-admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
                        <span>👥</span>
                        <span>Users</span>
                    </Link>
                    <Link href="/master-admin/meetings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
                        <span>🗳️</span>
                        <span>Meetings</span>
                    </Link>
                    <Link href="/master-admin/audit" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
                        <span>📋</span>
                        <span>Audit Logs</span>
                    </Link>
                </nav>

                <div className="pt-4 border-t border-gray-700">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-gray-300 transition-colors">
                        <span>←</span>
                        <span>Back to Dashboard</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Top Bar */}
                <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                        Logged in as <span className="text-purple-400 font-medium">{session?.user?.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs font-medium rounded-full">
                            Master Admin
                        </span>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
