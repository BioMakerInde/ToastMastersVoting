'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Fetch subscription status for trial banner
    const [subStatus, setSubStatus] = useState<{
        plan: string;
        isTrialActive: boolean;
        trialDaysRemaining: number | null;
    } | null>(null);

    // Redirect if not admin (client-side check, middleware handles server-side)
    useEffect(() => {
        if (status === 'authenticated') {
            // Simple check, robust check should rely on API or token claims
            // Ideally we'd decode the token or check an implementation specific role field
        }
    }, [status]);

    useEffect(() => {
        async function fetchSub() {
            try {
                const clubRes = await fetch('/api/clubs?managed=true');
                const clubs = await clubRes.json();
                if (clubs.length > 0) {
                    const subRes = await fetch(`/api/clubs/${clubs[0].id}/subscription`);
                    const sub = await subRes.json();
                    setSubStatus(sub);
                }
            } catch { }
        }
        if (status === 'authenticated') fetchSub();
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

                {/* Subscription Trial Banner */}
                {subStatus?.isTrialActive && subStatus.trialDaysRemaining !== null && (
                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🎉</span>
                            <div>
                                <p className="font-semibold text-purple-900">Pro Trial Active — {subStatus.trialDaysRemaining} days remaining</p>
                                <p className="text-sm text-purple-700">You have full access to all Pro features during your trial.</p>
                            </div>
                        </div>
                        <Link href="/admin/subscription" className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition">
                            View Plan
                        </Link>
                    </div>
                )}
                {subStatus && !subStatus.isTrialActive && subStatus.plan === 'FREE' && (
                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚡</span>
                            <div>
                                <p className="font-semibold text-amber-900">Upgrade to Pro</p>
                                <p className="text-sm text-amber-700">Unlock unlimited members, meetings, statistics, and more.</p>
                            </div>
                        </div>
                        <Link href="/admin/subscription" className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition">
                            Upgrade
                        </Link>
                    </div>
                )}

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

                    {/* Add Member */}
                    <Link href="/admin/members/add" className="block group">
                        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow duration-300 h-full">
                            <div className="px-5 py-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5">
                                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600">Add Member</h3>
                                        <p className="mt-1 text-sm text-gray-500">Manually add new members to your club.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Manage Members */}
                    <Link href="/admin/members" className="block group">
                        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow duration-300 h-full">
                            <div className="px-5 py-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-teal-500 rounded-md p-3">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5">
                                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-teal-600">Manage Members</h3>
                                        <p className="mt-1 text-sm text-gray-500">View, edit, and manage all club members.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Voting Statistics */}
                    <Link href="/admin/statistics" className="block group">
                        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow duration-300 h-full">
                            <div className="px-5 py-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-amber-500 rounded-md p-3">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5">
                                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-amber-600">Voting Statistics</h3>
                                        <p className="mt-1 text-sm text-gray-500">View all results and export to Excel.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Subscription */}
                    <Link href="/admin/subscription" className="block group">
                        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow duration-300 h-full">
                            <div className="px-5 py-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5">
                                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-600">Subscription</h3>
                                        <p className="mt-1 text-sm text-gray-500">Manage your plan, view usage, and upgrade.</p>
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
