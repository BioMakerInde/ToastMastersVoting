'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

// Types
interface Category {
    id: string;
    name: string;
}

interface Member {
    id: string;
    user: {
        name: string;
    };
}

export default function VotingPage({ params }: { params: Promise<{ meetingId: string }> }) {
    const router = useRouter();
    const { meetingId } = use(params);

    // State
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [nominees, setNominees] = useState<Member[]>([]);
    const [meetingNominations, setMeetingNominations] = useState<any[]>([]);
    const [votes, setVotes] = useState<Record<string, string>>({}); // categoryId -> memberId
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [meetingData, setMeetingData] = useState<any>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchVotingData();
    }, [meetingId]);

    const fetchVotingData = async () => {
        try {
            const res = await fetch(`/api/meetings/${meetingId}`);
            if (!res.ok) {
                setError('Meeting not found or inaccessible');
                setLoading(false);
                return;
            }
            const data = await res.json();
            setMeetingData(data);
            setMeetingNominations(data.nominations || []);

            if (!data.isVotingOpen) {
                setError('Voting is currently closed for this meeting.');
                setLoading(false);
                return;
            }

            // FILTER: Only show categories explicitly enabled for this meeting
            if (data.categories && data.categories.length > 0) {
                setCategories(data.categories.map((mc: any) => mc.category));
            } else {
                // Fallback (optional): If NO categories are enabled, maybe show all club categories?
                // The user requested selective, so if none are selected, it should probably be empty.
                setCategories([]);
            }

            const clubId = data.clubId;
            const memberRes = await fetch(`/api/clubs/${clubId}/members`);
            if (memberRes.ok) {
                const memberData = await memberRes.json();
                setNominees(memberData);
            }

            setLoading(false);
        } catch (e) {
            console.error('Fetch error:', e);
            setError('Failed to load voting session');
            setLoading(false);
        }
    };

    const handleVoteChange = (categoryId: string, nomineeId: string) => {
        setVotes(prev => ({ ...prev, [categoryId]: nomineeId }));
    };

    const handleSubmit = async () => {
        const votedCount = Object.keys(votes).length;
        if (votedCount < categories.length && categories.length > 0) {
            if (!confirm(`You've only voted in ${votedCount} out of ${categories.length} categories. Submit anyway?`)) return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            let successCount = 0;
            const voteEntries = Object.entries(votes);

            for (const [categoryId, nomineeId] of voteEntries) {
                const res = await fetch('/api/votes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        meetingId,
                        categoryId,
                        nomineeId
                    })
                });
                if (res.ok) successCount++;
            }

            if (successCount > 0) {
                setSuccess(true);
            } else {
                setError('Failed to submit votes. You might have already voted or there was a server error.');
            }
        } catch (e) {
            setError('Failed to submit votes. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Loading State ---
    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Initializing secure voting channel...</p>
        </div>
    );

    // --- Success State ---
    if (success) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Vote Recorded!</h2>
                <p className="text-gray-600 mb-8 px-2">Thank you for participating. Your contribution matters!</p>
                <p className="text-sm text-gray-500">You can close this window now.</p>
            </div>
        </div>
    );

    // --- Main Voting Interface ---
    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
            <header className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white pb-24 relative overflow-hidden">
                <div className="max-w-3xl mx-auto px-6 pt-12 relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-indigo-500 bg-opacity-30 text-indigo-100 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Live Voting</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">{meetingData?.title || 'Meeting Session'}</h1>
                    <p className="mt-3 text-indigo-100 text-md opacity-90 font-light">Select the best performance for each category.</p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 -mt-12 relative z-20">
                {error && (
                    <div className="bg-white border-l-4 border-red-500 p-6 mb-8 rounded-2xl shadow-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="text-red-600">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-red-900 font-bold mb-1">Voting Notice</p>
                            <p className="text-red-700 text-sm leading-relaxed">{error}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {categories.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl shadow-lg text-center border border-dashed border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No active polls</h3>
                            <p className="text-gray-500">Wait for the admin to enable voting categories for this session.</p>
                        </div>
                    ) : (
                        categories.map((category, index) => (
                            <div key={category.id} className="bg-white shadow-lg rounded-2xl border border-white hover:border-indigo-100 transition-all duration-300 overflow-hidden group">
                                <div className="px-6 py-5 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold">{index + 1}</span>
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{category.name}</h3>
                                    </div>
                                    {votes[category.id] && (
                                        <div className="bg-green-50 p-1 rounded-full text-green-500">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="p-8">
                                    <select
                                        className="block w-full px-5 py-4 text-gray-700 bg-gray-50 border border-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-lg rounded-xl appearance-none cursor-pointer"
                                        onChange={(e) => handleVoteChange(category.id, e.target.value)}
                                        value={votes[category.id] || ""}
                                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1.5rem' }}
                                    >
                                        <option value="" disabled>Select a performer...</option>
                                        {(() => {
                                            const categoryNominees = meetingNominations.filter(n => n.categoryId === category.id);

                                            if (categoryNominees.length > 0) {
                                                return categoryNominees.map((n) => (
                                                    <option key={n.memberId} value={n.memberId}>
                                                        {n.member.user.name}
                                                    </option>
                                                ));
                                            } else {
                                                return nominees.map((nominee) => (
                                                    <option key={nominee.id} value={nominee.id}>
                                                        {nominee.user.name}
                                                    </option>
                                                ));
                                            }
                                        })()}
                                    </select>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {categories.length > 0 && (
                    <div className="mt-12">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || Object.keys(votes).length === 0}
                            className="w-full bg-indigo-600 text-white rounded-2xl shadow-xl py-5 px-8 text-xl font-bold hover:bg-indigo-700 transition-all duration-200 transform hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3 relative overflow-hidden"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Submitting Your Votes...
                                </>
                            ) : (
                                <>
                                    Submit Final Results
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
