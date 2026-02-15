'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface SubscriptionData {
    plan: 'FREE' | 'PRO';
    isTrialActive: boolean;
    trialDaysRemaining: number | null;
    trialEndDate: string | null;
    rawPlan: 'FREE' | 'PRO';
    usage: {
        membersUsed: number;
        membersLimit: number;
        meetingsThisMonth: number;
        meetingsLimit: number;
    };
    features: Record<string, boolean>;
    limits: {
        maxMembers: number;
        maxMeetingsPerMonth: number;
        maxClubsPerAccount: number;
    };
}

interface Club {
    id: string;
    name: string;
}

export default function SubscriptionPage() {
    const { data: session } = useSession();
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [selectedClubId, setSelectedClubId] = useState('');
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchClubs();
    }, []);

    useEffect(() => {
        if (selectedClubId) fetchSubscription(selectedClubId);
    }, [selectedClubId]);

    async function fetchClubs() {
        try {
            const res = await fetch('/api/clubs?managed=true');
            const data = await res.json();
            setClubs(data);
            if (data.length > 0) {
                setSelectedClubId(data[0].id);
            }
        } catch {
            console.error('Failed to fetch clubs');
        } finally {
            setLoading(false);
        }
    }

    async function fetchSubscription(clubId: string) {
        try {
            setLoading(true);
            const res = await fetch(`/api/clubs/${clubId}/subscription`);
            const data = await res.json();
            setSubscription(data);
        } catch {
            console.error('Failed to fetch subscription');
        } finally {
            setLoading(false);
        }
    }

    async function handleUpgrade() {
        if (!selectedClubId) return;
        setUpgrading(true);
        setMessage('');
        try {
            const res = await fetch(`/api/clubs/${selectedClubId}/subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: 'PRO' }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage('🎉 Successfully upgraded to Pro!');
                fetchSubscription(selectedClubId);
            } else {
                setMessage(data.error || 'Upgrade failed');
            }
        } catch {
            setMessage('Failed to upgrade');
        } finally {
            setUpgrading(false);
        }
    }

    async function handleDowngrade() {
        if (!selectedClubId) return;
        if (!confirm('Are you sure you want to downgrade to Free? Some features will be restricted.')) return;
        setUpgrading(true);
        try {
            const res = await fetch(`/api/clubs/${selectedClubId}/subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: 'FREE' }),
            });
            if (res.ok) {
                setMessage('Plan changed to Free');
                fetchSubscription(selectedClubId);
            }
        } catch {
            setMessage('Failed to change plan');
        } finally {
            setUpgrading(false);
        }
    }

    const featureLabels: Record<string, { label: string; description: string }> = {
        EXCEL_IMPORT: { label: 'Excel Import', description: 'Import members from Excel files' },
        BULK_IMPORT: { label: 'Bulk Import', description: 'Bulk add multiple members at once' },
        CUSTOM_CATEGORIES: { label: 'Custom Categories', description: 'Create unlimited voting categories' },
        STATISTICS: { label: 'Statistics Dashboard', description: 'View detailed voting analytics' },
        AUDIT_LOGS: { label: 'Audit Logs', description: 'Track all admin actions' },
        QR_CHECKIN: { label: 'QR Check-in', description: 'Quick member check-in via QR codes' },
        ANONYMOUS_VOTING: { label: 'Anonymous Voting', description: 'Enable anonymous voting mode' },
        CSV_EXPORT: { label: 'CSV Export', description: 'Export data to CSV files' },
        MULTI_ADMIN: { label: 'Multi-Admin', description: 'Multiple admins per club' },
    };

    if (loading && !subscription) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                            ← Back to Admin
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
                    </div>
                    {clubs.length > 1 && (
                        <select
                            value={selectedClubId}
                            onChange={(e) => setSelectedClubId(e.target.value)}
                            className="border rounded-lg px-3 py-2 text-sm"
                        >
                            {clubs.map((club) => (
                                <option key={club.id} value={club.id}>{club.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {message && (
                    <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-center font-medium">
                        {message}
                    </div>
                )}

                {subscription && (
                    <>
                        {/* Plan Status Card */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {/* Current Plan */}
                            <div className="bg-white rounded-2xl shadow-sm border p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-700">Current Plan</h2>
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${subscription.plan === 'PRO'
                                            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {subscription.isTrialActive ? '⭐ PRO TRIAL' : subscription.plan}
                                    </span>
                                </div>

                                {subscription.isTrialActive && subscription.trialDaysRemaining !== null && (
                                    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-2xl">⏳</span>
                                            <span className="font-bold text-amber-800 text-lg">
                                                {subscription.trialDaysRemaining} days remaining
                                            </span>
                                        </div>
                                        <p className="text-amber-700 text-sm">
                                            Your free trial ends on {new Date(subscription.trialEndDate!).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                {subscription.plan === 'PRO' && !subscription.isTrialActive ? (
                                    <button
                                        onClick={handleDowngrade}
                                        disabled={upgrading}
                                        className="w-full mt-4 py-2 px-4 rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition text-sm"
                                    >
                                        Downgrade to Free
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleUpgrade}
                                        disabled={upgrading}
                                        className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50"
                                    >
                                        {upgrading ? 'Upgrading...' : '⚡ Upgrade to Pro — ₹499/mo'}
                                    </button>
                                )}
                            </div>

                            {/* Usage Meters */}
                            <div className="bg-white rounded-2xl shadow-sm border p-6">
                                <h2 className="text-lg font-semibold text-gray-700 mb-4">Usage</h2>

                                {/* Members */}
                                <div className="mb-5">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Members</span>
                                        <span className="font-medium text-gray-900">
                                            {subscription.usage.membersUsed}
                                            {subscription.usage.membersLimit > 0 ? ` / ${subscription.usage.membersLimit}` : ' / ∞'}
                                        </span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${subscription.usage.membersLimit > 0 &&
                                                    subscription.usage.membersUsed / subscription.usage.membersLimit > 0.8
                                                    ? 'bg-red-500'
                                                    : 'bg-indigo-500'
                                                }`}
                                            style={{
                                                width: subscription.usage.membersLimit > 0
                                                    ? `${Math.min((subscription.usage.membersUsed / subscription.usage.membersLimit) * 100, 100)}%`
                                                    : '10%',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Meetings */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Meetings this month</span>
                                        <span className="font-medium text-gray-900">
                                            {subscription.usage.meetingsThisMonth}
                                            {subscription.usage.meetingsLimit > 0 ? ` / ${subscription.usage.meetingsLimit}` : ' / ∞'}
                                        </span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${subscription.usage.meetingsLimit > 0 &&
                                                    subscription.usage.meetingsThisMonth / subscription.usage.meetingsLimit > 0.8
                                                    ? 'bg-red-500'
                                                    : 'bg-emerald-500'
                                                }`}
                                            style={{
                                                width: subscription.usage.meetingsLimit > 0
                                                    ? `${Math.min((subscription.usage.meetingsThisMonth / subscription.usage.meetingsLimit) * 100, 100)}%`
                                                    : '10%',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature Access */}
                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <h2 className="text-lg font-semibold text-gray-700 mb-4">Feature Access</h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(subscription.features).map(([key, allowed]) => {
                                    const info = featureLabels[key];
                                    if (!info) return null;
                                    return (
                                        <div
                                            key={key}
                                            className={`p-4 rounded-xl border transition ${allowed
                                                    ? 'border-green-200 bg-green-50'
                                                    : 'border-gray-200 bg-gray-50 opacity-60'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-lg ${allowed ? 'text-green-500' : 'text-gray-400'}`}>
                                                    {allowed ? '✅' : '🔒'}
                                                </span>
                                                <span className="font-medium text-gray-900">{info.label}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 ml-7">{info.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
