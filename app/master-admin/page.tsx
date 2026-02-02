'use client';

import { useState, useEffect } from 'react';

interface Stats {
    totalClubs: number;
    totalUsers: number;
    totalMeetings: number;
    activeSessions: number;
    recentClubs: Array<{
        id: string;
        name: string;
        createdAt: string;
        memberCount: number;
    }>;
    recentMeetings: Array<{
        id: string;
        title: string;
        clubName: string;
        meetingDate: string;
        isVotingOpen: boolean;
    }>;
}

export default function MasterAdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/master-admin/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                <p className="text-gray-400 mt-1">Site-wide statistics and activity</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Clubs"
                    value={stats?.totalClubs || 0}
                    icon="🏢"
                    color="blue"
                />
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon="👥"
                    color="green"
                />
                <StatCard
                    title="Total Meetings"
                    value={stats?.totalMeetings || 0}
                    icon="📅"
                    color="yellow"
                />
                <StatCard
                    title="Active Voting"
                    value={stats?.activeSessions || 0}
                    icon="🗳️"
                    color="purple"
                />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Clubs */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                    <h2 className="text-lg font-semibold text-white mb-4">Recent Clubs</h2>
                    <div className="space-y-3">
                        {stats?.recentClubs?.map((club) => (
                            <div key={club.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                                <div>
                                    <p className="text-white font-medium">{club.name}</p>
                                    <p className="text-gray-400 text-sm">
                                        {club.memberCount} members • Created {new Date(club.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!stats?.recentClubs || stats.recentClubs.length === 0) && (
                            <p className="text-gray-500 text-center py-4">No clubs yet</p>
                        )}
                    </div>
                </div>

                {/* Recent Meetings */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                    <h2 className="text-lg font-semibold text-white mb-4">Recent Meetings</h2>
                    <div className="space-y-3">
                        {stats?.recentMeetings?.map((meeting) => (
                            <div key={meeting.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-medium">{meeting.title}</p>
                                        {meeting.isVotingOpen && (
                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                LIVE
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-400 text-sm">
                                        {meeting.clubName} • {new Date(meeting.meetingDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!stats?.recentMeetings || stats.recentMeetings.length === 0) && (
                            <p className="text-gray-500 text-center py-4">No meetings yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: {
    title: string;
    value: number;
    icon: string;
    color: 'blue' | 'green' | 'yellow' | 'purple'
}) {
    const colorClasses = {
        blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        green: 'bg-green-500/10 border-green-500/30 text-green-400',
        yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
        purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    };

    return (
        <div className={`rounded-xl border p-5 ${colorClasses[color]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm">{title}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <span className="text-3xl">{icon}</span>
            </div>
        </div>
    );
}
