'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ManageMembersPage() {
    const { data: session } = useSession();
    const [clubs, setClubs] = useState<any[]>([]);
    const [selectedClubId, setSelectedClubId] = useState('');
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        fetchClubs();
    }, []);

    useEffect(() => {
        if (selectedClubId) {
            fetchMembers();
        }
    }, [selectedClubId]);

    const fetchClubs = async () => {
        try {
            const res = await fetch('/api/clubs?managed=true');
            if (res.ok) {
                const data = await res.json();
                setClubs(Array.isArray(data) ? data : []);
                if (data.length === 1) {
                    setSelectedClubId(data[0].id);
                }
            }
        } catch (e) {
            console.error('Failed to fetch clubs');
        }
    };

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clubs/${selectedClubId}/members`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (e) {
            console.error('Failed to fetch members');
        } finally {
            setLoading(false);
        }
    };

    const toggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/members/${memberId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            if (res.ok) {
                fetchMembers(); // Refresh list
            } else {
                alert('Failed to update member status');
            }
        } catch (e) {
            alert('Connection error');
        }
    };

    const openEditModal = (member: any) => {
        setEditingMember(member);
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setEditingMember(null);
        setShowEditModal(false);
    };

    const saveEdit = async () => {
        try {
            const res = await fetch(`/api/members/${editingMember.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    membershipNumber: editingMember.membershipNumber,
                    pathway: editingMember.pathway,
                    mentor: editingMember.mentor,
                    role: editingMember.role
                })
            });

            if (res.ok) {
                fetchMembers();
                closeEditModal();
            } else {
                alert('Failed to update member');
            }
        } catch (e) {
            alert('Connection error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Admin Panel
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Manage Members</h1>
                            <p className="text-gray-600 mt-2">View and manage all club members</p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href="/admin/members/add"
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                            >
                                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Member
                            </Link>
                            <Link
                                href="/admin/members/bulk"
                                className="inline-flex items-center px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium"
                            >
                                Text Import
                            </Link>
                            <Link
                                href="/admin/members/excel"
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                            >
                                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Excel Import
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Club Selection */}
                <div className="mb-6 bg-white rounded-xl shadow p-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Select Club
                    </label>
                    <select
                        value={selectedClubId}
                        onChange={(e) => setSelectedClubId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="">Choose a club...</option>
                        {clubs.map(club => (
                            <option key={club.id} value={club.id}>{club.name}</option>
                        ))}
                    </select>
                </div>

                {/* Members Table */}
                {selectedClubId && (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900">
                                Members ({members.length})
                            </h2>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-4 text-gray-600">Loading members...</p>
                            </div>
                        ) : members.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-gray-500">No members found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Membership ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Pathway
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {members.map((member) => (
                                            <tr key={member.id} className={!member.isActive ? 'bg-gray-50 opacity-60' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <div className="text-sm font-bold text-gray-900">{member.user.name}</div>
                                                        {member.user.phone && (
                                                            <div className="text-xs text-gray-500">{member.user.phone}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {member.user.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                                    {member.membershipNumber || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                        member.role === 'OFFICER' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {member.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {member.pathway || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => toggleMemberStatus(member.id, member.isActive)}
                                                        className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${member.isActive
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                            }`}
                                                    >
                                                        {member.isActive ? 'Active' : 'Disabled'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => openEditModal(member)}
                                                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && editingMember && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Member</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={editingMember.user.name}
                                            disabled
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={editingMember.user.email}
                                            disabled
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Membership ID</label>
                                        <input
                                            type="text"
                                            value={editingMember.membershipNumber || ''}
                                            onChange={(e) => setEditingMember({ ...editingMember, membershipNumber: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                                        <select
                                            value={editingMember.role}
                                            onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="MEMBER">Member</option>
                                            <option value="OFFICER">Officer</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Pathway</label>
                                        <input
                                            type="text"
                                            value={editingMember.pathway || ''}
                                            onChange={(e) => setEditingMember({ ...editingMember, pathway: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g., Dynamic Leadership"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Mentor</label>
                                        <input
                                            type="text"
                                            value={editingMember.mentor || ''}
                                            onChange={(e) => setEditingMember({ ...editingMember, mentor: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Mentor's name"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        onClick={saveEdit}
                                        className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={closeEditModal}
                                        className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
