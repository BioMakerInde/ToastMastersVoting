'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Meeting {
    id: string;
    title: string;
    meetingDate: string;
    isVotingOpen: boolean;
    club: {
        name: string;
    };
    _count: {
        votes: number;
    };
}

export default function SessionsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // New Session Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [selectedClub, setSelectedClub] = useState('');
    const [availableClubs, setAvailableClubs] = useState<any[]>([]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (session) {
            fetchInitialData();
        }
    }, [session]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [meetingsRes, clubsRes] = await Promise.all([
                fetch('/api/meetings'),
                fetch('/api/clubs?managed=true')
            ]);

            if (meetingsRes.ok) {
                const data = await meetingsRes.json();
                setMeetings(Array.isArray(data) ? data : []);
            }
            if (clubsRes.ok) {
                const data = await clubsRes.json();
                setAvailableClubs(Array.isArray(data) ? data : []);
                if (data.length > 0) setSelectedClub(data[0].id);
            }
        } catch (err) {
            setError('Failed to sync dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, meetingDate: date, clubId: selectedClub })
            });
            if (res.ok) {
                setShowCreateModal(false);
                setTitle('');
                setDate('');
                fetchInitialData();
            } else {
                const data = await res.json();
                alert(data.error || 'Creation failed');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setCreating(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-indigo-100">
            {/* Glossy Header */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <h1 className="text-xl font-bold tracking-tight text-gray-800">Sessions Manager</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchInitialData}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-all border border-transparent"
                            title="Refresh"
                        >
                            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-100 active:scale-95"
                        >
                            + New Session
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {error && (
                    <div className="mb-8 bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-sm">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group transition-all hover:shadow-md">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Sessions</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">{meetings.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group transition-all hover:shadow-md">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-4 text-green-600 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Active Polling</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">{meetings.filter(m => m.isVotingOpen).length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group transition-all hover:shadow-md">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-600 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Members Voted</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">{meetings.reduce((sum, m) => sum + (m._count?.votes || 0), 0)}</p>
                    </div>
                </div>

                {/* Session List */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800">Recent Sessions</h2>
                        <div className="flex gap-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search sessions..."
                                    className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none w-64"
                                />
                                <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {loading && meetings.length === 0 ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="p-8 animate-pulse flex items-center gap-6">
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl"></div>
                                    <div className="flex-1 space-y-3">
                                        <div className="w-48 h-5 bg-gray-100 rounded-lg"></div>
                                        <div className="w-32 h-4 bg-gray-50 rounded-lg"></div>
                                    </div>
                                </div>
                            ))
                        ) : meetings.length === 0 ? (
                            <div className="p-20 text-center">
                                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-12 h-12 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No meetings found</h3>
                                <p className="text-gray-500 mb-8 max-w-xs mx-auto">Start your first high-impact Toastmasters session today.</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 active:scale-95"
                                >
                                    + Create First Session
                                </button>
                            </div>
                        ) : (
                            meetings.map((meeting) => (
                                <div key={meeting.id} className={`group p-6 sm:p-8 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-6 ${(meeting as any).isFinalized
                                    ? 'bg-blue-50/30 hover:bg-blue-50/50 border-l-4 border-blue-400'
                                    : meeting.isVotingOpen
                                        ? 'bg-green-50/30 hover:bg-green-50/50 border-l-4 border-green-400'
                                        : 'hover:bg-gray-50/50'
                                    }`}>
                                    {/* Date Visual */}
                                    <div className="w-16 h-16 bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                        <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-tighter">
                                            {new Date(meeting.meetingDate).toLocaleString('default', { month: 'short' })}
                                        </span>
                                        <span className="text-2xl font-black text-gray-800 -mt-1">
                                            {new Date(meeting.meetingDate).getDate()}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-bold text-gray-900 truncate">
                                                {meeting.title}
                                            </h3>
                                            {(meeting as any).isFinalized ? (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-200">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Results Announced
                                                </span>
                                            ) : meeting.isVotingOpen ? (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                    Polling Live
                                                </span>
                                            ) : (meeting as any).votingEndTime ? (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Voting Ended
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                {meeting.club?.name}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                {meeting._count?.votes || 0} Members Voted
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <Link
                                            href={`/admin/meetings/${meeting.id}/results`}
                                            className="flex-1 sm:flex-none text-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all hover:shadow-sm active:scale-95"
                                        >
                                            📊 Results
                                        </Link>
                                        <Link
                                            href={`/admin/meetings/${meeting.id}`}
                                            className="flex-1 sm:flex-none text-center px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-100 active:scale-95"
                                        >
                                            Manage
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Create Session Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-indigo-900/20 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-gray-900">New Session</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateSession} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Session Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Weekly Meeting #142"
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Club</label>
                                    <select
                                        required
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium appearance-none"
                                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                                        value={selectedClub}
                                        onChange={(e) => setSelectedClub(e.target.value)}
                                    >
                                        <option value="" disabled>Select...</option>
                                        {availableClubs.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {creating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Initializing...
                                        </>
                                    ) : (
                                        'Create Session'
                                    )}
                                </button>
                                <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-tighter">
                                    Finalizing this session will make it available for voting configuration.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
