'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ParsedMember {
    firstName: string;
    secondName: string;
    fullName: string;
    email: string;
    phone: string;
    pathway: string;
    mentor: string;
    error?: string;
}

export default function BulkImportPage() {
    const router = useRouter();
    const [clubId, setClubId] = useState('');
    const [clubs, setClubs] = useState<any[]>([]);
    const [textData, setTextData] = useState('');
    const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            const res = await fetch('/api/clubs?managed=true');
            if (res.ok) {
                const data = await res.json();
                setClubs(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error('Failed to fetch clubs');
        }
    };

    const parseData = () => {
        setError('');
        const lines = textData.trim().split('\n');
        const members: ParsedMember[] = [];

        lines.forEach((line, index) => {
            if (!line.trim()) return; // Skip empty lines

            const parts = line.split(',').map(p => p.trim());

            if (parts.length < 4) {
                members.push({
                    firstName: parts[0] || '',
                    secondName: parts[1] || '',
                    fullName: parts[2] || '',
                    email: parts[3] || '',
                    phone: parts[4] || '',
                    pathway: parts[5] || '',
                    mentor: parts[6] || '',
                    error: 'Incomplete data - need at least: FirstName, SecondName, FullName, Email'
                });
                return;
            }

            const member: ParsedMember = {
                firstName: parts[0] || '',
                secondName: parts[1] || '',
                fullName: parts[2] || '',
                email: parts[3] || '',
                phone: parts[4] || '',
                pathway: parts[5] || '',
                mentor: parts[6] || ''
            };

            // Validate email
            if (!member.email || !member.email.includes('@')) {
                member.error = 'Invalid email address';
            }

            // Validate required fields
            if (!member.fullName) {
                member.error = 'Full name is required';
            }

            members.push(member);
        });

        setParsedMembers(members);
        setShowPreview(true);
    };

    const importMembers = async () => {
        if (!clubId) {
            setError('Please select a club');
            return;
        }

        const validMembers = parsedMembers.filter(m => !m.error);
        if (validMembers.length === 0) {
            setError('No valid members to import');
            return;
        }

        setImporting(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/members/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clubId,
                    members: validMembers
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(`Successfully imported ${data.imported} members!`);
                setTextData('');
                setParsedMembers([]);
                setShowPreview(false);
            } else {
                setError(data.error || 'Failed to import members');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setImporting(false);
        }
    };

    const validCount = parsedMembers.filter(m => !m.error).length;
    const errorCount = parsedMembers.filter(m => m.error).length;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <Link
                        href="/admin/members/add"
                        className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
                    >
                        ← Back to Add Member
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Import Members</h1>
                    <p className="text-gray-600 mb-8">Paste comma-separated member data to import multiple members at once</p>

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

                    {/* Club Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Select Club <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={clubId}
                            onChange={(e) => setClubId(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Select a club</option>
                            {clubs.map(club => (
                                <option key={club.id} value={club.id}>{club.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Format Example */}
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-bold text-blue-900 mb-2">Format (one member per line):</h3>
                        <code className="text-sm text-blue-800 block font-mono">
                            FirstName, SecondName, FullName, Email, Phone, Pathway, Mentor
                        </code>
                        <p className="text-xs text-blue-700 mt-2">
                            <strong>Required:</strong> FirstName, SecondName, FullName, Email<br />
                            <strong>Optional:</strong> Phone, Pathway, Mentor<br />
                            <strong>Note:</strong> Membership ID will be auto-generated (TM00001, TM00002, etc.)
                        </p>
                    </div>

                    {/* Textarea */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Paste Member Data
                        </label>
                        <textarea
                            value={textData}
                            onChange={(e) => setTextData(e.target.value)}
                            rows={12}
                            placeholder="John, Doe, John Doe, john@email.com, 1234567890, Leadership, Jane Smith
Mary, Jane, Mary Jane, mary@email.com, 0987654321, Speaking, Bob Wilson"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                        />
                    </div>

                    {/* Preview Button */}
                    {!showPreview && (
                        <button
                            onClick={parseData}
                            disabled={!textData.trim()}
                            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Preview Members
                        </button>
                    )}

                    {/* Preview Table */}
                    {showPreview && parsedMembers.length > 0 && (
                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Preview ({validCount} valid, {errorCount} errors)
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        setParsedMembers([]);
                                    }}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    Edit Data
                                </button>
                            </div>

                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Full Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Phone</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Pathway</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {parsedMembers.map((member, index) => (
                                            <tr key={index} className={member.error ? 'bg-red-50' : ''}>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {member.error ? (
                                                        <span className="text-red-600 text-xs font-bold">❌ {member.error}</span>
                                                    ) : (
                                                        <span className="text-green-600 text-xs font-bold">✓ Valid</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {member.fullName}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                    {member.email}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                    {member.phone || '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                    {member.pathway || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Import Button */}
                            <div className="mt-6">
                                <button
                                    onClick={importMembers}
                                    disabled={importing || validCount === 0}
                                    className="w-full bg-green-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {importing ? 'Importing...' : `Import ${validCount} Members`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
