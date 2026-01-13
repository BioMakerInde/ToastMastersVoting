'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Request {
    id: string;
    status: string;
    joinedAt: string;
    user: {
        name: string;
        email: string;
    };
    club: {
        name: string;
    };
}

export default function MemberRequestsPage() {
    const { data: session } = useSession();
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/members/requests');
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [session]);

    const handleAction = async (id: string, action: 'ACTIVE' | 'REJECTED') => {
        if (!confirm(`Are you sure you want to ${action === 'ACTIVE' ? 'Approve' : 'Reject'} this member?`)) return;

        try {
            const res = await fetch(`/api/members/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action })
            });

            if (res.ok) {
                // Remove from list
                setRequests(requests.filter(r => r.id !== id));
            } else {
                alert('Action failed');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-8">Loading requests...</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Member Requests</h1>

                <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 mb-6 inline-block">
                    &larr; Back to Admin Dashboard
                </Link>

                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {requests.length === 0 ? (
                            <li className="p-6 text-center text-gray-500">No pending requests found.</li>
                        ) : (
                            requests.map((req) => (
                                <li key={req.id}>
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-indigo-600 truncate">{req.user.name}</p>
                                                <p className="text-sm text-gray-500">{req.user.email}</p>
                                                <p className="text-xs text-gray-400 mt-1">Requesting to join: {req.club.name}</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleAction(req.id, 'ACTIVE')}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, 'REJECTED')}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    Requested: {new Date(req.joinedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
