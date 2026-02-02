'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Meeting {
    id: string;
    title: string;
    clubId: string;
    clubName: string;
    meetingDate: string;
    isVotingOpen: boolean;
    isFinalized: boolean;
    voteCount: number;
    categoryCount: number;
}

export default function MasterAdminMeetings() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'finalized'>('all');

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const res = await fetch('/api/master-admin/meetings');
            if (res.ok) {
                const data = await res.json();
                setMeetings(data.meetings);
            }
        } catch (error) {
            console.error('Failed to fetch meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    const forceCloseVoting = async (meetingId: string) => {
        if (!confirm('Are you sure you want to force close voting for this meeting?')) {
            return;
        }

        try {
            const res = await fetch(`/api/master-admin/meetings/${meetingId}/force-close`, {
                method: 'POST'
            });

            if (res.ok) {
                fetchMeetings();
            }
        } catch (error) {
            console.error('Failed to close voting:', error);
        }
    };

    const filteredMeetings = meetings.filter(meeting => {
        if (filter === 'active') return meeting.isVotingOpen;
        if (filter === 'finalized') return meeting.isFinalized;
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Meeting Oversight</h1>
                    <p className="text-gray-400 mt-1">View and manage all meetings across clubs</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{meetings.length} total</span>
                    <span className="text-green-400 text-sm">
                        ({meetings.filter(m => m.isVotingOpen).length} live)
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'active', 'finalized'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Meetings Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Meeting</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Club</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Votes</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {filteredMeetings.map((meeting) => (
                            <tr key={meeting.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-white font-medium">{meeting.title}</div>
                                    <div className="text-gray-500 text-xs mt-1">
                                        {meeting.categoryCount} categories
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {meeting.clubName}
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm">
                                    {new Date(meeting.meetingDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    {meeting.isVotingOpen ? (
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full animate-pulse">
                                            🔴 LIVE
                                        </span>
                                    ) : meeting.isFinalized ? (
                                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                            Finalized
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                                            Closed
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {meeting.voteCount}
                                </td>
                                <td className="px-6 py-4 space-x-3">
                                    {meeting.isVotingOpen && (
                                        <button
                                            onClick={() => forceCloseVoting(meeting.id)}
                                            className="text-red-400 hover:text-red-300 text-sm"
                                        >
                                            Force Close
                                        </button>
                                    )}
                                    <Link
                                        href={`/vote/${meeting.id}/results`}
                                        className="text-purple-400 hover:text-purple-300 text-sm"
                                    >
                                        View Results
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {filteredMeetings.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No meetings found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
