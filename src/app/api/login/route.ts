import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { password, type } = await request.json();

        // type can be 'booking' or 'admin'

        if (type === 'booking') {
            const correctBookingPassword = process.env.BOOKING_PASSWORD;
            if (!correctBookingPassword || password !== correctBookingPassword) {
                return NextResponse.json({ error: 'Incorrect booking password' }, { status: 401 });
            }

            const response = NextResponse.json({ success: true });
            response.cookies.set('booking_auth', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
            });
            return response;
        }

        if (type === 'admin') {
            const correctAdminPassword = process.env.ADMIN_PASSWORD;
            if (!correctAdminPassword || password !== correctAdminPassword) {
                return NextResponse.json({ error: 'Incorrect admin password' }, { status: 401 });
            }

            const response = NextResponse.json({ success: true });
            response.cookies.set('admin_auth', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            });
            return response;
        }

        return NextResponse.json({ error: 'Invalid login type' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
