'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface ClubDetail {
    id: string;
    name: string;
    clubNumber: string | null;
    areaNumber: string | null;
    divisionNumber: string | null;
    districtNumber: string | null;
    website: string | null;
    description: string | null;
    createdAt: string;
    subscription: {
        plan: string;
        trialStartDate: string | null;
        trialEndDate: string | null;
        isTrialUsed: boolean;
        subscribedAt: string | null;
        expiresAt: string | null;
    } | null;
    _count: {
        members: number;
        meetings: number;
        categories: number;
    };
    members: Array<{
        id: string;
        role: string;
        user: { name: string; email: string };
    }>;
    meetings: Array<{
        id: string;
        title: string;
        meetingDate: string;
        isVotingOpen: boolean;
        isFinalized: boolean;
        _count: { votes: number };
    }>;
}

export default function ClubDetailPage() {
    const params = useParams();
    const clubId = params.id as string;
    const [club, setClub] = useState<ClubDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        fetchClub();
    }, [clubId]);

    const fetchClub = async () => {
        try {
            const res = await fetch(`/api/master-admin/clubs/${clubId}`);
            if (res.ok) {
                const data = await res.json();
                setClub(data.club);
            }
        } catch (error) {
            console.error('Failed to fetch club:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePlan = async () => {
        if (!club) return;
        const currentPlan = club.subscription?.plan || 'FREE';
        const newPlan = currentPlan === 'PRO' ? 'FREE' : 'PRO';

        if (!confirm(`Change ${club.name} to ${newPlan} plan?`)) return;

        setToggling(true);
        try {
            const res = await fetch(`/api/master-admin/clubs/${clubId}/subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: newPlan }),
            });
            if (res.ok) {
                fetchClub();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed');
            }
        } catch {
            alert('Failed to update plan');
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!club) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-400 text-lg">Club not found</p>
                <Link href="/master-admin/clubs" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
                    ← Back to Clubs
                </Link>
            </div>
        );
    }

    const plan = club.subscription?.plan || 'FREE';
    const now = new Date();
    const isTrialActive = club.subscription?.trialEndDate
        ? new Date(club.subscription.trialEndDate) > now && plan === 'FREE'
        : false;
    const trialDaysLeft = isTrialActive && club.subscription?.trialEndDate
        ? Math.ceil((new Date(club.subscription.trialEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/master-admin/clubs" className="text-sm text-gray-400 hover:text-purple-400 mb-2 inline-block">
                        ← Back to Clubs
                    </Link>
                    <h1 className="text-2xl font-bold text-white">{club.name}</h1>
                    {club.description && <p className="text-gray-400 mt-1">{club.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${plan === 'PRO'
                            ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30'
                            : isTrialActive
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-gray-600/50 text-gray-300 border border-gray-500/30'
                        }`}>
                        {isTrialActive ? `⭐ TRIAL (${trialDaysLeft}d left)` : plan === 'PRO' ? '⚡ PRO' : 'FREE'}
                    </span>
                    <button
                        onClick={togglePlan}
                        disabled={toggling}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${plan === 'PRO'
                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                                : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
                            }`}
                    >
                        {toggling ? '...' : plan === 'PRO' ? 'Downgrade to Free' : 'Upgrade to Pro'}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                    <p className="text-gray-400 text-sm">Members</p>
                    <p className="text-3xl font-bold text-blue-400 mt-1">{club._count.members}</p>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                    <p className="text-gray-400 text-sm">Meetings</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">{club._count.meetings}</p>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                    <p className="text-gray-400 text-sm">Categories</p>
                    <p className="text-3xl font-bold text-yellow-400 mt-1">{club._count.categories}</p>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                    <p className="text-gray-400 text-sm">Created</p>
                    <p className="text-lg font-bold text-gray-300 mt-1">{new Date(club.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Club Info + Subscription */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Club Info */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                    <h2 className="text-lg font-semibold text-white mb-4">Club Information</h2>
                    <div className="space-y-3">
                        <InfoRow label="Club Number" value={club.clubNumber || '-'} />
                        <InfoRow label="Area" value={club.areaNumber || '-'} />
                        <InfoRow label="Division" value={club.divisionNumber || '-'} />
                        <InfoRow label="District" value={club.districtNumber || '-'} />
                        <InfoRow label="Website" value={club.website || '-'} />
                    </div>
                </div>

                {/* Subscription */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                    <h2 className="text-lg font-semibold text-white mb-4">Subscription Details</h2>
                    <div className="space-y-3">
                        <InfoRow label="Plan" value={plan} />
                        <InfoRow label="Trial Used" value={club.subscription?.isTrialUsed ? 'Yes' : 'No'} />
                        <InfoRow label="Trial End" value={club.subscription?.trialEndDate
                            ? new Date(club.subscription.trialEndDate).toLocaleDateString()
                            : '-'
                        } />
                        <InfoRow label="Subscribed At" value={club.subscription?.subscribedAt
                            ? new Date(club.subscription.subscribedAt).toLocaleDateString()
                            : '-'
                        } />
                        <InfoRow label="Expires At" value={club.subscription?.expiresAt
                            ? new Date(club.subscription.expiresAt).toLocaleDateString()
                            : 'Never (Lifetime)'
                        } />
                    </div>
                </div>
            </div>

            {/* Admins & Officers */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <h2 className="text-lg font-semibold text-white mb-4">Admins & Officers</h2>
                <div className="space-y-2">
                    {club.members.map(m => (
                        <div key={m.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                            <div>
                                <p className="text-white font-medium">{m.user.name}</p>
                                <p className="text-gray-400 text-sm">{m.user.email}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.role === 'ADMIN'
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'bg-blue-500/20 text-blue-300'
                                }`}>
                                {m.role}
                            </span>
                        </div>
                    ))}
                    {club.members.length === 0 && (
                        <p className="text-gray-500 text-center py-2">No admins or officers</p>
                    )}
                </div>
            </div>

            {/* Recent Meetings */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <h2 className="text-lg font-semibold text-white mb-4">Recent Meetings</h2>
                <div className="space-y-2">
                    {club.meetings.map(meeting => (
                        <div key={meeting.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-white font-medium">{meeting.title}</p>
                                    {meeting.isVotingOpen && (
                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">LIVE</span>
                                    )}
                                    {meeting.isFinalized && (
                                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">FINALIZED</span>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm">
                                    {new Date(meeting.meetingDate).toLocaleDateString()} • {meeting._count.votes} votes
                                </p>
                            </div>
                        </div>
                    ))}
                    {club.meetings.length === 0 && (
                        <p className="text-gray-500 text-center py-2">No meetings yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">{label}</span>
            <span className="text-white text-sm font-medium">{value}</span>
        </div>
    );
}
