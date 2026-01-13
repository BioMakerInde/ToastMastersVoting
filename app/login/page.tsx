'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans'>
      <div className='max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900 tracking-tight'>
            Toastmasters Voting
          </h2>
          <p className='mt-2 text-sm text-gray-600'>
            Please sign in to your account
          </p>
        </div>
        
        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          {error && (
            <div className='bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md'>
              <div className='flex items-center'>
                <ExclamationCircleIcon className='h-5 w-5 text-red-500 mr-2' aria-hidden='true' />
                <p className='text-sm text-red-700 font-medium'>{error}</p>
              </div>
            </div>
          )}
          
          <div className='space-y-4'>
            <div>
              <label htmlFor='email-address' className='block text-sm font-medium text-gray-700 mb-1'>
                Email address
              </label>
              <input
                id='email-address'
                name='email'
                type='email'
                autoComplete='email'
                required
                className='appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-1'>
                Password
              </label>
              <input
                id='password'
                name='password'
                type='password'
                autoComplete='current-password'
                required
                className='appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                placeholder=''
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={loading}
              className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors duration-200 shadow-md transform hover:-translate-y-0.5'
            >
              {loading ? (
                <svg className='animate-spin h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
        
        <div className='text-center mt-4'>
          <p className='text-sm text-gray-600'>
            Don't have an account?{' '}
            <Link href='/register' className='font-semibold text-indigo-600 hover:text-indigo-500 transition-colors'>
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}