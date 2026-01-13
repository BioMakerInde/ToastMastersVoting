'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

import { use } from 'react';

export default function MeetingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { data: session } = useSession();
    const router = useRouter();
    const { id } = use(params);

    const [mounted, setMounted] = useState(false);
    const [meeting, setMeeting] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [votingLink, setVotingLink] = useState('');

    const [categories, setCategories] = useState<any[]>([]);
    const [enabledCategoryIds, setEnabledCategoryIds] = useState<Set<string>>(new Set());
    const [clubMembers, setClubMembers] = useState<any[]>([]);
    const [nominating, setNominating] = useState<string | null>(null);
    const [togglingCategory, setTogglingCategory] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            setVotingLink(`${window.location.origin}/vote/${id}`);
        }
        fetchMeetingDetails();
    }, [id]);

    const fetchMeetingDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/meetings/${id}`);
            const data = await res.json();
            if (res.ok) {
                setMeeting(data);
                if (data.categories) {
                    setEnabledCategoryIds(new Set(data.categories.map((c: any) => c.categoryId)));
                }
                if (data.clubId) {
                    fetchClubData(data.clubId);
                }
            } else {
                setError(data.error || 'Failed to fetch meeting');
            }
        } catch (error) {
            console.error('Failed to fetch meeting');
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const fetchClubData = async (clubId: string) => {
        try {
            const [catRes, memRes] = await Promise.all([
                fetch(`/api/categories?clubId=${clubId}`),
                fetch(`/api/clubs/${clubId}/members`)
            ]);
            if (catRes.ok) {
                const catData = await catRes.json();
                setCategories(catData.categories || []);
            }
            if (memRes.ok) {
                const memData = await memRes.json();
                setClubMembers(memData || []);
            }
        } catch (err) {
            console.error('Failed to fetch club data:', err);
        }
    };

    const toggleNomination = async (categoryId: string, memberId: string) => {
        setNominating(`${categoryId}-${memberId}`);
        try {
            const res = await fetch(`/api/meetings/${id}/nominations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryId, memberId })
            });
            if (res.ok) {
                // Manually update the meeting state or refetch
                const updatedRes = await fetch(`/api/meetings/${id}`);
                const updatedData = await updatedRes.json();
                if (updatedRes.ok) {
                    setMeeting(updatedData);
                }
            } else {
                const d = await res.json();
                alert(d.error || 'Failed to update nomination');
            }
        } catch (e) {
            alert('Connection error');
        } finally {
            setNominating(null);
        }
    };

    const isNominated = (categoryId: string, memberId: string) => {
        return meeting?.nominations?.some((n: any) => n.categoryId === categoryId && n.memberId === memberId);
    };

    const toggleCategory = async (categoryId: string) => {
        setTogglingCategory(categoryId);
        try {
            const res = await fetch(`/api/meetings/${id}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryId })
            });

            if (res.ok) {
                const data = await res.json();
                setEnabledCategoryIds(prev => {
                    const next = new Set(prev);
                    if (data.enabled) next.add(categoryId);
                    else next.delete(categoryId);
                    return next;
                });
            }
        } catch (e) {
            console.error('Toggle category failed');
        } finally {
            setTogglingCategory(null);
        }
    };

    const toggleVoting = async () => {
        if (!meeting) return;
        try {
            const res = await fetch(`/api/meetings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: meeting.id,
                    isVotingOpen: !meeting.isVotingOpen
                })
            });

            if (res.ok) {
                setMeeting({ ...meeting, isVotingOpen: !meeting.isVotingOpen });
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update');
            }
        } catch (error) {
            console.error('Failed to toggle voting');
        }
    };

    if (!mounted) return null;
    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Syncing meeting intelligence...</p>
        </div>
    );

    if (error || !meeting) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Meeting Not Found</h3>
                <p className="text-gray-500 mb-8">{error || 'This session has been moved or deleted.'}</p>
                <Link href="/admin/sessions" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
                    Return to Sessions
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans pb-20">
            <div className="bg-indigo-900 text-white pt-12 pb-24 px-8">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <Link href="/admin/sessions" className="text-indigo-200 text-sm font-bold uppercase tracking-widest hover:text-white transition-colors mb-4 inline-block">
                            &larr; Back to Sessions
                        </Link>
                        <h1 className="text-4xl font-black tracking-tight">{meeting.title}</h1>
                        <p className="text-indigo-200 mt-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(meeting.meetingDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href={`/admin/meetings/${meeting.id}/results`}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
                        >
                            📊 View Results
                        </Link>
                        <button
                            onClick={toggleVoting}
                            className={`${meeting.isVotingOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white px-8 py-3 rounded-2xl font-black transition-all shadow-xl active:scale-95 flex items-center gap-2`}
                        >
                            <span className={`w-2 h-2 rounded-full bg-white ${meeting.isVotingOpen ? 'animate-pulse' : ''}`}></span>
                            {meeting.isVotingOpen ? 'Close Polling' : 'Start Polling'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 -mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details & QR */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-8 space-y-6">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Sharing Intelligence</h3>
                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center gap-6">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                        <QRCodeSVG value={votingLink} size={160} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-800 mb-1">Session QR Code</p>
                                        <p className="text-xs text-gray-500 mb-4">Members can scan this to vote</p>
                                        <a
                                            href={votingLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-bold text-indigo-600 hover:underline break-all block px-4 py-2 bg-indigo-50 rounded-xl"
                                        >
                                            {votingLink}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Nominee Assignment */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                            <div className="px-10 py-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">Poll Configuration</h3>
                                    <p className="text-gray-500 mt-1">Select valid categories and assign performers for this session.</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                        {enabledCategoryIds.size} Active Categories
                                    </span>
                                </div>
                            </div>

                            <div className="p-10 space-y-12">
                                {categories.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-400 font-medium">No voting categories configured for this club.</p>
                                        <Link href="/admin/categories" className="text-indigo-600 font-bold hover:underline mt-2 inline-block">Setup Categories &rarr;</Link>
                                    </div>
                                ) : (
                                    categories.map((category) => {
                                        const isEnabled = enabledCategoryIds.has(category.id);
                                        const isToggling = togglingCategory === category.id;

                                        return (
                                            <div key={category.id} className={`space-y-6 transition-opacity duration-300 ${isEnabled ? 'opacity-100' : 'opacity-40'}`}>
                                                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={() => toggleCategory(category.id)}
                                                            disabled={isToggling}
                                                            className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${isEnabled ? 'bg-indigo-600' : 'bg-gray-200'} ${isToggling ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                                        >
                                                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${isEnabled ? 'translate-x-6' : 'translate-x-0'} flex items-center justify-center`}>
                                                                {isToggling && <div className="w-2 h-2 border border-indigo-600 border-t-transparent animate-spin rounded-full"></div>}
                                                            </div>
                                                        </button>
                                                        <h4 className="text-lg font-black text-gray-900 flex items-center gap-3">
                                                            {isEnabled && (
                                                                <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">
                                                                    {meeting?.nominations?.filter((n: any) => n.categoryId === category.id).length || 0}
                                                                </span>
                                                            )}
                                                            {category.name}
                                                        </h4>
                                                    </div>
                                                    {!isEnabled && <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Disabled for this session</span>}
                                                </div>

                                                {isEnabled && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        {clubMembers.map((member) => {
                                                            const isActive = isNominated(category.id, member.id);
                                                            const isChanging = nominating === `${category.id}-${member.id}`;

                                                            return (
                                                                <button
                                                                    key={member.id}
                                                                    onClick={() => toggleNomination(category.id, member.id)}
                                                                    disabled={isChanging}
                                                                    className={`flex items-center justify-between px-5 py-3 rounded-2xl border-2 transition-all text-left group ${isActive
                                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                                        : 'bg-white border-gray-100 text-gray-700 hover:border-indigo-200 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-black tracking-tight">{member.user.name}</span>
                                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                                            {member.role}
                                                                        </span>
                                                                    </div>
                                                                    {isChanging ? (
                                                                        <div className={`w-4 h-4 border-2 ${isActive ? 'border-white' : 'border-indigo-600'} border-t-transparent rounded-full animate-spin`}></div>
                                                                    ) : isActive ? (
                                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    ) : (
                                                                        <div className="w-5 h-5 rounded-full border-2 border-gray-200 group-hover:border-indigo-300 transition-colors"></div>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
