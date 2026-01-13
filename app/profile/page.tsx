'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react'; // We need to install this or use a simple library, or just use text for now if lib missing

// Since we haven't installed a QR lib yet, we'll placeholder it or use a simple Canvas approach if requested.
// For now, let's display the text code.

interface ProfileData {
    name: string;
    email: string;
    joinedAt: string;
    clubName: string;
    role: string;
    membershipNumber: string;
    qrCode: string | null;
    isActive: boolean;
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated') {
            fetchProfile();
        }
    }, [status, router]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (error) {
            console.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading || status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto">
                <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 mb-6 inline-block font-medium">
                    &larr; Back to Dashboard
                </Link>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-bold leading-6 text-gray-900">Member Profile</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and club membership.</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${profile?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {profile?.isActive ? 'Active Member' : 'Inactive'}
                        </div>
                    </div>

                    <div className="border-t border-gray-200">
                        <dl>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-semibold">{profile?.name}</dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile?.email}</dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Club Name</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile?.clubName}</dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Club Role</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800">
                                        {profile?.role}
                                    </span>
                                </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Membership Number</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">{profile?.membershipNumber}</dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Joined Date</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : 'N/A'}
                                </dd>
                            </div>

                            {/* QR Code Section */}
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Digital ID (QR)</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-48 h-48 flex items-center justify-center bg-white">
                                        {profile?.qrCode ? (
                                            // Placeholder for actual QR code library or image
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 mb-2">Scan for Check-in</p>
                                                <p className="font-mono font-bold text-lg">{profile.qrCode}</p>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm text-center">No QR Code Generated</span>
                                        )}
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">Use this QR code for meeting check-ins.</p>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
