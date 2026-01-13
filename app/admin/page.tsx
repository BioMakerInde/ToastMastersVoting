'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Redirect if not admin (client-side check, middleware handles server-side)
    useEffect(() => {
        if (status === 'authenticated') {
            // Simple check, robust check should rely on API or token claims
            // Ideally we'd decode the token or check an implementation specific role field
        }
    }, [status]);

    if (status === 'loading') return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <nav className="bg-indigo-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-white text-xl font-bold">Admin Portal</span>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link href="/dashboard" className="text-indigo-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                    &larr; Member Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
                    <p className="mt-2 text-gray-600">Manage your club meetings, members, and settings.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Session Management */}
                    <Link href="/admin/sessions" className="block group">
                        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow duration-300 h-full">
                            <div className="px-5 py-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5">
                                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600">Sessions</h3>
                                        <p className="mt-1 text-sm text-gray-500">Manage meetings, view live results, and coordinate voting.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Voting Categories (Coming Soon) */}
                    <Link href="/admin/categories" className="block group">
                        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow duration-300 h-full">
                            <div className="px-5 py-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </div>
                                    <div className="ml-5">
                                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-600">Categories</h3>
                                        <p className="mt-1 text-sm text-gray-500">Customize voting categories (Best Speaker, etc.).</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Member Management */}
                    <Link href="/admin/requests" className="block group">
                        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow duration-300 h-full">
                            <div className="px-5 py-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5">
                                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">Member Requests</h3>
                                        <p className="mt-1 text-sm text-gray-500">Approve or reject new member applications.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
}
