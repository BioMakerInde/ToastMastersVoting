'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  // Redirect master admins to master admin dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.isMasterAdmin) {
      router.push('/master-admin');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(err => console.error(err));
    }
  }, [session]);


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-indigo-600">Toastmasters</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {(profile?.role === 'ADMIN' || profile?.role === 'OFFICER') && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Dashboard
                </Link>
              )}
              <span className="text-gray-700">Welcome, {session?.user?.name || 'Member'}</span>
              <button
                onClick={() => window.location.href = '/api/auth/signout'}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard
            </h2>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Admin Zone - Only visible to Club Admins */}
          {profile?.role === 'ADMIN' && (
            <>
              <div className="bg-indigo-50 overflow-hidden shadow rounded-lg border-2 border-indigo-200 col-span-1 md:col-span-2 lg:col-span-3">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-bold text-indigo-900 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Club Admin Zone: {profile.clubName}
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link href="/admin/requests" className="relative rounded-lg border border-indigo-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-indigo-400 hover:shadow-md transition">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-900">Approve Members</p>
                        <p className="text-sm text-gray-500 truncate">Review pending join requests</p>
                      </div>
                    </Link>

                    <Link href="/admin/sessions" className="relative rounded-lg border border-indigo-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-indigo-400 hover:shadow-md transition">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-900">Manage Sessions</p>
                        <p className="text-sm text-gray-500 truncate">Create meetings & toggle voting</p>
                      </div>
                    </Link>

                    <Link href="/admin/categories" className="relative rounded-lg border border-indigo-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-indigo-400 hover:shadow-md transition">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-900">Voting Categories</p>
                        <p className="text-sm text-gray-500 truncate">Setup voting options</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Create Club Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Start a Club
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Create and manage your own club.</p>
              </div>
              <div className="mt-5">
                <Link href="/clubs/create" className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 sm:text-sm">
                  Create Club
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                My Profile
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>View your membership details and QR code.</p>
              </div>
              <div className="mt-5">
                <Link href="/profile" className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 sm:text-sm">
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
