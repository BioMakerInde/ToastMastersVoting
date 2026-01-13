'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Meeting {
    id: string;
    title: string;
    meetingDate: string;
    isVotingOpen: boolean;
    _count: {
        votes: number;
    };
}

export default function MeetingsPage() {
    const { data: session } = useSession();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [selectedClub, setSelectedClub] = useState('');
    const [availableClubs, setAvailableClubs] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
        if (session) {
            fetchMeetings();
            fetchClubs();
        }
    }, [session]);

    const fetchMeetings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/meetings');
            const data = await res.json();

            if (res.ok) {
                if (Array.isArray(data)) {
                    setMeetings(data);
                } else {
                    console.error('Meetings API returned non-array:', data);
                    setError('Unexpected data format from server');
                    setMeetings([]);
                }
            } else {
                setError(data.error || 'Failed to load meetings');
            }
        } catch (error) {
            console.error('Failed to fetch meetings:', error);
            setError('Connection error. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    const fetchClubs = async () => {
        // Fetch clubs where user is admin
        // Ideally we have a better endpoint for this, but reusing /api/clubs with some client side filter or just expecting admin access
        // Better: GET /api/members/requests uses a similar logic. 
        // Let's create a quick way or assume we can list keys. 
        // Actually, we can assume the user has a profile with club info or just listing all clubs is fine for now? 
        // No, should be only their managed clubs.
        // Let's check /api/profile? 
        // Simplest: GET /api/clubs (it returns all match query, or first 20). 
        // Let's just create a quick helper to get user's clubs.
        // Or better, let's look at `GET /api/members/requests`.
        // Let's try to fetch profile which has club info if implemented.
        // Or simpler: Just fetch '/api/clubs' and let them pick (backend verifies admin status anyway).
        try {
            // Fetching profile usually returns club info if we set it up.
            // Else, searching empty fetches list.
            const res = await fetch('/api/clubs?managed=true');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setAvailableClubs(data);
                    if (data.length > 0) setSelectedClub(data[0].id);
                }
            }
        } catch (e) { console.error(e); }
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClub) {
            alert('Please select a club');
            return;
        }
        try {
            const res = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    meetingDate: date,
                    clubId: selectedClub,
                }),
            });

            if (res.ok) {
                setShowCreateModal(false);
                setTitle('');
                setDate('');
                fetchMeetings(); // Refresh list
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create meeting');
            }
        } catch (error) {
            console.error('Error creating meeting');
        }
    };

    if (!mounted) return null;
    if (loading && meetings.length === 0) return <div className="p-8 text-center">Loading meetings...</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                        + New Meeting
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 mb-6 inline-block">
                    &larr; Back to Admin Dashboard
                </Link>

                {/* Meeting List */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {meetings.length === 0 ? (
                            <li className="p-6 text-center text-gray-500">No meetings found. Create one to get started.</li>
                        ) : (
                            meetings.map((meeting) => (
                                <li key={meeting.id}>
                                    <Link href={`/admin/meetings/${meeting.id}`} className="block hover:bg-gray-50">
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-indigo-600 truncate">{meeting.title || 'Untitled Meeting'}</p>
                                                    <p className="text-xs text-gray-400">{(meeting as any).club?.name || 'Unknown Club'}</p>
                                                </div>
                                                <div className="ml-2 flex-shrink-0 flex">
                                                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${meeting.isVotingOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {meeting.isVotingOpen ? 'Voting Open' : 'Voting Closed'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                                <div className="sm:flex">
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        Date: {meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString() : 'No date'}
                                                    </p>
                                                </div>
                                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                    <p>{meeting._count?.votes || 0} Votes Cast</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Create New Meeting
                                </h3>
                                <form onSubmit={handleCreateRequest} className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Meeting Title</label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="Toastmasters Weekly #105"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Club</label>
                                        <select
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={selectedClub}
                                            onChange={(e) => setSelectedClub(e.target.value)}
                                        >
                                            <option value="" disabled>Select a Club</option>
                                            {availableClubs.map(club => (
                                                <option key={club.id} value={club.id}>{club.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                        <button
                                            type="submit"
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                                        >
                                            Create
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                            onClick={() => setShowCreateModal(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
