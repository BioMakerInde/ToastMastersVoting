'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Club {
    id: string;
    name: string;
    districtNumber: string;
}

export default function JoinClubPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Club[]>([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/clubs?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    const handleJoin = async (clubId: string) => {
        console.log('Join clicked for club:', clubId);
        setJoiningId(clubId);
        setMessage(null);

        try {
            console.log('Sending join request to API...');
            const res = await fetch('/api/clubs/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clubId })
            });

            const data = await res.json();
            console.log('Join request response:', res.status, data);

            if (res.ok) {
                setMessage({ type: 'success', text: 'Join request sent! Waiting for admin approval.' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to send request' });
            }
        } catch (error) {
            console.error('Join handle error:', error);
            setMessage({ type: 'error', text: 'Error joining club' });
        } finally {
            setJoiningId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Join a Club
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Search for your Toastmasters club to join.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSearch}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Club Name</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                    type="text"
                                    required
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                                    placeholder="e.g. Speakers Corner"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-6">
                        {searched && results.length === 0 && (
                            <p className="text-center text-gray-500">No clubs found.</p>
                        )}

                        <ul className="divide-y divide-gray-200">
                            {results.map(club => (
                                <li key={club.id} className="py-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{club.name}</p>
                                        {club.districtNumber && <p className="text-xs text-gray-500">District {club.districtNumber}</p>}
                                    </div>
                                    <button
                                        onClick={() => handleJoin(club.id)}
                                        disabled={joiningId !== null}
                                        className="ml-4 bg-white border border-gray-300 rounded-md shadow-sm px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        {joiningId === club.id ? 'Joining...' : 'Join'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {message && (
                        <div className={`mt-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Back to Dashboard</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
