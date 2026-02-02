'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Club {
    id: string;
    name: string;
    clubNumber: string | null;
    createdAt: string;
    memberCount: number;
    meetingCount: number;
    isDisabled?: boolean;
}

export default function MasterAdminClubs() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            const res = await fetch('/api/master-admin/clubs');
            if (res.ok) {
                const data = await res.json();
                setClubs(data.clubs);
            }
        } catch (error) {
            console.error('Failed to fetch clubs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClubs = clubs.filter(club =>
        club.name.toLowerCase().includes(search.toLowerCase()) ||
        club.clubNumber?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Club Management</h1>
                    <p className="text-gray-400 mt-1">View and manage all clubs on the platform</p>
                </div>
                <div className="text-sm text-gray-400">
                    {clubs.length} total clubs
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <input
                    type="text"
                    placeholder="Search clubs by name or number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
            </div>

            {/* Clubs Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Club</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Club Number</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Members</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Meetings</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {filteredClubs.map((club) => (
                            <tr key={club.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-white font-medium">{club.name}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {club.clubNumber || '-'}
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {club.memberCount}
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {club.meetingCount}
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {new Date(club.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <Link
                                        href={`/master-admin/clubs/${club.id}`}
                                        className="text-purple-400 hover:text-purple-300 text-sm"
                                    >
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {filteredClubs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    {search ? 'No clubs match your search' : 'No clubs found'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
