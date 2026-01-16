'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddMemberPage() {
    const { data: session } = useSession();
    const router = useRouter();

    const [clubs, setClubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        clubId: '',
        membershipNumber: '',
        firstName: '',
        secondName: '',
        fullName: '',
        email: '',
        phone: '',
        pathway: '',
        mentor: ''
    });

    useEffect(() => {
        fetchUserClubs();
    }, []);

    const fetchUserClubs = async () => {
        try {
            const res = await fetch('/api/clubs?managed=true');
            if (res.ok) {
                const data = await res.json();
                // API returns array directly
                setClubs(Array.isArray(data) ? data : []);
                // Auto-select first club if only one
                if (data?.length === 1) {
                    setFormData(prev => ({ ...prev, clubId: data[0].id }));
                    await generateMembershipId(data[0].id);
                }
            }
        } catch (e) {
            console.error('Failed to fetch clubs');
        }
    };

    const generateMembershipId = async (clubId: string) => {
        try {
            const res = await fetch(`/api/clubs/${clubId}/members`);
            if (res.ok) {
                const members = await res.json();
                // Generate next sequential number
                const nextNumber = members.length + 1;
                const membershipId = `TM${String(nextNumber).padStart(5, '0')}`;
                setFormData(prev => ({ ...prev, membershipNumber: membershipId }));
            }
        } catch (e) {
            console.error('Failed to generate membership ID');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Generate membership ID when club is selected
        if (name === 'clubId' && value) {
            generateMembershipId(value);
        }

        // Auto-generate full name from first and second name
        if (name === 'firstName' || name === 'secondName') {
            const firstName = name === 'firstName' ? value : formData.firstName;
            const secondName = name === 'secondName' ? value : formData.secondName;
            setFormData(prev => ({
                ...prev,
                [name]: value,
                fullName: `${firstName} ${secondName}`.trim()
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/members/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('Member added successfully!');
                // Reset form
                setFormData({
                    clubId: formData.clubId, // Keep club selected
                    membershipNumber: '',
                    firstName: '',
                    secondName: '',
                    fullName: '',
                    email: '',
                    phone: '',
                    pathway: '',
                    mentor: ''
                });
            } else {
                setError(data.error || 'Failed to add member');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <Link
                        href="/admin"
                        className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
                    >
                        ← Back to Admin
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Member</h1>
                            <p className="text-gray-600">Manually add a new member to your club</p>
                        </div>
                        <Link
                            href="/admin/members/bulk"
                            className="inline-flex items-center px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium transition-colors"
                        >
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Bulk Import
                        </Link>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                            <p className="text-green-700 font-medium">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Club Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Club <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="clubId"
                                value={formData.clubId}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">Select a club</option>
                                {clubs.map(club => (
                                    <option key={club.id} value={club.id}>
                                        {club.name}
                                    </option>
                                ))}
                            </select>
                            {formData.clubId && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Selected: <span className="font-bold">{clubs.find(c => c.id === formData.clubId)?.name}</span>
                                </p>
                            )}
                        </div>

                        {/* Membership ID - Auto-generated */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Membership ID <span className="text-gray-400">(Auto-generated)</span>
                            </label>
                            <input
                                type="text"
                                name="membershipNumber"
                                value={formData.membershipNumber}
                                readOnly
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                placeholder="Select a club first"
                            />
                        </div>

                        {/* First Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Enter first name"
                            />
                        </div>

                        {/* Second Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Second Name
                            </label>
                            <input
                                type="text"
                                name="secondName"
                                value={formData.secondName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Enter second name"
                            />
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Auto-filled or enter manually"
                            />
                        </div>

                        {/* Email ID */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Email ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="member@example.com"
                            />
                        </div>

                        {/* Mobile Number */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Mobile Number
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="+1 234 567 8900"
                            />
                        </div>

                        {/* Current Pathway */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Current Pathway
                            </label>
                            <input
                                type="text"
                                name="pathway"
                                value={formData.pathway}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Dynamic Leadership"
                            />
                        </div>

                        {/* Mentor */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Mentor
                            </label>
                            <input
                                type="text"
                                name="mentor"
                                value={formData.mentor}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Mentor's name"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                                {loading ? 'Adding Member...' : 'Add Member'}
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 text-center">
                            Default password: <span className="font-mono font-bold">Welcome@123</span>
                            <br />
                            Member should change this after first login
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
