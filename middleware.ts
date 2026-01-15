import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Define public paths that NEVER need authentication
    const isPublicPath =
        pathname === '/' ||
        pathname === '/login' ||
        pathname === '/register' ||
        pathname.startsWith('/vote/') ||
        pathname.startsWith('/api/auth') ||
        pathname.includes('.') || // static files like .png, .ico
        pathname.startsWith('/_next'); // internal nextjs files

    if (isPublicPath) {
        return NextResponse.next()
    }

    // 2. Check for NextAuth session cookie
    // Note: During local development it's usually 'next-auth.session-token'
    // In production (HTTPS) it's usually '__Secure-next-auth.session-token'
    const token = request.cookies.get('next-auth.session-token') ||
        request.cookies.get('__Secure-next-auth.session-token');

    if (!token) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('callbackUrl', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

// Match ALL paths
export const config = {
    matcher: ['/:path*'],
}
