import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Protect Admin Routes (e.g. /admin)
    // Skip /admin/login so they can actually log in
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
        const adminAuth = request.cookies.get('admin_auth');
        if (!adminAuth || adminAuth.value !== 'authenticated') {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // 2. Protect Main Booking Page (e.g. / or subpages except /login)
    // We want to skip static files, api routes, and admin stuff
    if (
        !pathname.startsWith('/login') &&
        !pathname.startsWith('/admin') &&
        !pathname.startsWith('/api') &&
        !pathname.startsWith('/_next') &&
        !pathname.includes('.')
    ) {
        const bookingAuth = request.cookies.get('booking_auth');
        if (!bookingAuth || bookingAuth.value !== 'authenticated') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
