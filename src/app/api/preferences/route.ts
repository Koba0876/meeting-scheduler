import { getPreferences, savePreferences } from '@/lib/preferences';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('admin_auth');

    if (!adminAuth || adminAuth.value !== 'authenticated') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prefs = await getPreferences();
    return NextResponse.json(prefs);
}

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('admin_auth');

    if (!adminAuth || adminAuth.value !== 'authenticated') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await request.json();
        await savePreferences(data);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }
}
