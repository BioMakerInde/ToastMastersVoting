'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface ParsedMember {
    name: string;
    email: string;
    phone?: string;
    membershipNumber?: string;
    pathway?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    paidUntil?: string;
    memberSince?: string;
    status?: string;
    currentPosition?: string;
    error?: string;
}

export default function ExcelImportPage() {
    const router = useRouter();
    const [clubId, setClubId] = useState('');
    const [clubs, setClubs] = useState<any[]>([]);
    const [file, setFile] = useState<File | null>(null);
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
            setError('Failed to load clubs');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setShowPreview(false);
            setParsedMembers([]);
            setError('');
            setSuccess('');
        }
    };

    const parseExcel = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        if (!clubId) {
            setError('Please select a club');
            return;
        }

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const members: ParsedMember[] = [];

            jsonData.forEach((row: any, index) => {
                const member: ParsedMember = {
                    name: row['Name'] || '',
                    email: row['Member E-mail'] || row['Email'] || '',
                    phone: row['Home Phone'] ? String(row['Home Phone']) : (row['Mobile Phone'] ? String(row['Mobile Phone']) : ''),
                    membershipNumber: row['Addr L1'] || row['Member ID'] || '',
                    pathway: row['Pathways Enrolled'] || '',
                    address: [row['Addr L1'], row['Addr L2']].filter(Boolean).join(', '),
                    city: row['City'] || '',
                    state: row['State/Prov/Country'] || row['State'] || '',
                    country: row['State/Prov/Country'] || row['Country'] || '',
                    zipCode: row['Zip-code'] ? String(row['Zip-code']) : (row['zip-code'] ? String(row['zip-code']) : ''),
                    paidUntil: row['Paid Until'] || '',
                    memberSince: row['Member of Club Since'] || '',
                    status: row['Status (*)'] || '',
                    currentPosition: row['Current Position'] || ''
                };

                // Validation
                if (!member.name || !member.email) {
                    member.error = 'Missing required fields (Name or Email)';
                }

                // Email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (member.email && !emailRegex.test(member.email)) {
                    member.error = 'Invalid email format';
                }

                members.push(member);
            });

            setParsedMembers(members);
            setShowPreview(true);
            setError('');
        } catch (err) {
            setError('Failed to parse Excel file. Please check the format.');
            console.error(err);
        }
    };

    const handleImport = async () => {
        const validMembers = parsedMembers.filter(m => !m.error);

        if (validMembers.length === 0) {
            setError('No valid members to import');
            return;
        }

        setImporting(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/members/excel-import', {
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
                if (data.errors && data.errors.length > 0) {
                    setError(`Errors: ${data.errors.join(', ')}`);
                }
                // Reset after 2 seconds
                setTimeout(() => {
                    router.push('/admin/members');
                }, 2000);
            } else {
                setError(data.error || 'Import failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <Link href="/admin/members" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Members
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Excel Import</h1>
                    <p className="text-gray-600 mt-2">Import members from Toastmasters Excel export</p>
                </div>

                {/* Club Selection */}
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Select Club <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={clubId}
                        onChange={(e) => setClubId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="">Choose a club...</option>
                        {clubs.map(club => (
                            <option key={club.id} value={club.id}>{club.name}</option>
                        ))}
                    </select>
                </div>

                {/* File Upload */}
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Upload Excel File <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 transition-colors">
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                    <span>Upload a file</span>
                                    <input
                                        type="file"
                                        name="excelFile"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileChange}
                                        className="sr-only"
                                    />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">Excel (.xlsx, .xls) or CSV files</p>
                            {file && (
                                <p className="text-sm font-medium text-green-600 mt-2">
                                    ✓ {file.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-bold text-blue-900 mb-2">Expected Columns:</h3>
                        <p className="text-xs text-blue-800">
                            Name, Member E-mail, Home Phone, Mobile Phone, Addr L1, Addr L2,
                            City, State/Prov/Country, Zip-code, Paid Until, Member of Club Since,
                            Current Position, Pathways Enrolled
                        </p>
                        <p className="text-xs text-blue-700 mt-2">
                            <strong>Minimum required:</strong> Name and Member E-mail
                        </p>
                    </div>

                    {file && (
                        <button
                            onClick={parseExcel}
                            disabled={!clubId}
                            className="mt-4 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Parse & Preview
                        </button>
                    )}
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                        <p className="text-green-700 font-medium">{success}</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                        <div className="flex items-start">
                            <svg className="h-5 w-5 text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-red-700 font-medium whitespace-pre-line">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview Table */}
                {showPreview && parsedMembers.length > 0 && (
                    <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">
                                Preview ({parsedMembers.filter(m => !m.error).length} valid, {parsedMembers.filter(m => m.error).length} errors)
                            </h2>
                            <button
                                onClick={handleImport}
                                disabled={importing || parsedMembers.filter(m => !m.error).length === 0}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {importing ? 'Importing...' : `Import ${parsedMembers.filter(m => !m.error).length} Members`}
                            </button>
                        </div>

                        <div className="overflow-x-auto max-h-96">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Phone</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Member ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Pathway</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Address</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">City</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">State</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Country</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Paid Until</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Member Since</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Position</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {parsedMembers.map((member, index) => (
                                        <tr key={index} className={member.error ? 'bg-red-50' : ''}>
                                            <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{member.name || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{member.email || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{member.phone || '-'}</td>
                                            <td className="px-4 py-3 text-sm font-mono text-gray-900 whitespace-nowrap">{member.membershipNumber || 'Auto'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{member.pathway || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{member.address || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{member.city || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{member.state || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{member.country || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{member.paidUntil || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{member.memberSince || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{member.currentPosition || '-'}</td>
                                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                {member.error ? (
                                                    <span className="text-red-600 font-medium">{member.error}</span>
                                                ) : (
                                                    <span className="text-green-600 font-medium">✓ Valid</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
