'use client';

import { useState, useEffect } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    isMasterAdmin: boolean;
    clubCount: number;
    clubs: Array<{ id: string; name: string; role: string }>;
}

export default function MasterAdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/master-admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMasterAdmin = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} Master Admin access?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/master-admin/users/${userId}/toggle-admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isMasterAdmin: !currentStatus })
            });

            if (res.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Failed to toggle admin:', error);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
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
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-gray-400 mt-1">View and manage all users on the platform</p>
                </div>
                <div className="text-sm text-gray-400">
                    {users.length} total users
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
            </div>

            {/* Users Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Clubs</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-medium">{user.name}</span>
                                        {user.isMasterAdmin && (
                                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                                                Master Admin
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-gray-400 text-sm">
                                        {user.clubCount} club{user.clubCount !== 1 ? 's' : ''}
                                        {user.clubs.length > 0 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {user.clubs.slice(0, 2).map(c => c.name).join(', ')}
                                                {user.clubs.length > 2 && ` +${user.clubs.length - 2} more`}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleMasterAdmin(user.id, user.isMasterAdmin)}
                                        className={`text-sm ${user.isMasterAdmin
                                                ? 'text-red-400 hover:text-red-300'
                                                : 'text-purple-400 hover:text-purple-300'
                                            }`}
                                    >
                                        {user.isMasterAdmin ? 'Remove Admin' : 'Make Admin'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    {search ? 'No users match your search' : 'No users found'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
