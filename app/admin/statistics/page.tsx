'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface CategoryWinner {
    categoryId: string;
    categoryName: string;
    winnerName: string;
    winnerVotes: number;
    isGuestWinner: boolean;
    totalVotes: number;
}

interface MeetingResult {
    meetingId: string;
    meetingTitle: string;
    meetingDate: string;
    categories: CategoryWinner[];
}

export default function StatisticsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<MeetingResult[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfile();
    }, [session]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                if (data.clubId) {
                    fetchStatistics(data.clubId);
                }
            }
        } catch (err) {
            setError('Failed to load profile');
            setLoading(false);
        }
    };

    const fetchStatistics = async (clubId: string) => {
        try {
            const res = await fetch(`/api/admin/statistics?clubId=${clubId}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
            } else {
                setError('Failed to load statistics');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        // Create CSV content
        const headers = ['Meeting Date', 'Meeting Title', 'Category', 'Winner', 'Type', 'Votes', 'Total Votes'];
        const rows: string[][] = [];

        results.forEach(meeting => {
            meeting.categories.forEach(cat => {
                rows.push([
                    new Date(meeting.meetingDate).toLocaleDateString(),
                    meeting.meetingTitle,
                    cat.categoryName,
                    cat.winnerName,
                    cat.isGuestWinner ? 'Guest' : 'Member',
                    cat.winnerVotes.toString(),
                    cat.totalVotes.toString()
                ]);
            });
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `voting_results_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-indigo-600">Toastmasters</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-gray-600 hover:text-gray-900 font-medium">
                                ← Back to Admin
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Voting Statistics</h1>
                        <p className="mt-2 text-gray-600">Date-wise winners for all finalized meetings</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <button
                            onClick={exportToCSV}
                            disabled={results.length === 0}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export to Excel (CSV)
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {results.length === 0 ? (
                    <div className="bg-white rounded-xl shadow p-12 text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                        <p className="text-gray-500">Finalize your meeting voting sessions to see results here.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {results.map(meeting => (
                            <div key={meeting.meetingId} className="bg-white rounded-xl shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-white">{meeting.meetingTitle}</h2>
                                            <p className="text-indigo-200 text-sm mt-1">
                                                {new Date(meeting.meetingDate).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            {meeting.categories.length} Categories
                                        </span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Winner
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Votes
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Vote %
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {meeting.categories.map((cat, idx) => (
                                                <tr key={cat.categoryId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-medium text-gray-900">{cat.categoryName}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <span className="text-yellow-500 mr-2">🏆</span>
                                                            <span className="text-sm font-bold text-gray-900">{cat.winnerName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cat.isGuestWinner
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {cat.isGuestWinner ? 'Guest' : 'Member'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {cat.winnerVotes} / {cat.totalVotes}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                                                <div
                                                                    className="bg-indigo-600 h-2 rounded-full"
                                                                    style={{ width: `${cat.totalVotes > 0 ? (cat.winnerVotes / cat.totalVotes) * 100 : 0}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-sm text-gray-600">
                                                                {cat.totalVotes > 0 ? Math.round((cat.winnerVotes / cat.totalVotes) * 100) : 0}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
