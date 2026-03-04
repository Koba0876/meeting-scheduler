import { getPreferences, savePreferences } from '@/lib/preferences';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const prefs = await getPreferences();
    return NextResponse.json(prefs);
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        await savePreferences(data);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }
}
