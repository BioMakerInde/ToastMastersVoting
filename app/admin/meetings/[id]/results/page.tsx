'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { use } from 'react';
import Link from 'next/link';

interface VoteData {
    categoryId: string;
    nomineeId: string;
    _count: number;
}

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

export default function MeetingResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<any[]>([]);
    const [meeting, setMeeting] = useState<any>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchInitialData();
        const interval = setInterval(fetchVotes, 5000); // Polling every 5s
        return () => clearInterval(interval);
    }, [id]);

    const fetchInitialData = async () => {
        try {
            const meetingRes = await fetch(`/api/meetings/${id}`);
            const meetingData = await meetingRes.json();
            setMeeting(meetingData);

            if (meetingData.clubId) {
                // Fetch categories
                const catRes = await fetch(`/api/categories?clubId=${meetingData.clubId}`);
                const catData = await catRes.json();
                setCategories(catData.categories || []);

                // Fetch members
                const memRes = await fetch(`/api/clubs/${meetingData.clubId}/members`);
                const memData = await memRes.json();
                setMembers(memData);
            }

            await fetchVotes();
            setLoading(false);
        } catch (e) {
            setError('Failed to load results');
            setLoading(false);
        }
    };

    const fetchVotes = async () => {
        try {
            const res = await fetch(`/api/votes?meetingId=${id}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.votes || []);
            }
        } catch (e) {
            console.error('Failed to fetch votes');
        }
    };

    const getNomineeName = (nomineeId: string) => {
        const member = members.find(m => m.id === nomineeId);
        return member?.user.name || 'Unknown';
    };

    const getCategoryResults = (categoryId: string) => {
        return results.filter(r => r.categoryId === categoryId)
            .sort((a, b) => b._count - a._count);
    };

    if (loading) return <div className="p-8 text-center text-gray-600">Loading results...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{meeting?.title} - Results</h1>
                        <p className="text-gray-500">Real-time polling results</p>
                    </div>
                    <Link
                        href={`/admin/meetings/${id}`}
                        className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                    >
                        Back to Meeting Details
                    </Link>
                </div>

                <div className="grid gap-8">
                    {categories.map(category => {
                        const catResults = getCategoryResults(category.id);
                        const totalVotes = catResults.reduce((sum, r) => sum + r._count, 0);

                        return (
                            <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-gray-900">{category.name}</h3>
                                    <span className="text-sm font-medium text-gray-500">{totalVotes} votes total</span>
                                </div>
                                <div className="p-6 space-y-4">
                                    {catResults.length === 0 ? (
                                        <p className="text-gray-400 italic text-center py-4">No votes yet</p>
                                    ) : (
                                        catResults.map((res, idx) => {
                                            const percentage = totalVotes > 0 ? (res._count / totalVotes) * 100 : 0;
                                            return (
                                                <div key={res.nomineeId} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium text-gray-700">
                                                            {idx === 0 && '🏆 '}{getNomineeName(res.nomineeId)}
                                                        </span>
                                                        <span className="text-gray-500 font-mono">{res._count}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-indigo-600' : 'bg-indigo-300'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
