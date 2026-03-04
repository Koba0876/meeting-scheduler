import { NextResponse } from 'next/server';
import { getGoogleCalendarClient } from '@/lib/google';
import { getPreferences } from '@/lib/preferences';
import { addMinutes, isBefore, isAfter, formatISO } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    try {
        const calendar = getGoogleCalendarClient();
        const calendarId = process.env.GOOGLE_CALENDAR_ID;

        if (!calendarId) {
            throw new Error('GOOGLE_CALENDAR_ID is not set in environment variables');
        }

        const prefs = await getPreferences();

        // Find the day of week relative to the admin's intended timezone
        const dateInAdminTz = toZonedTime(new Date(`${dateParam}T12:00:00Z`), prefs.timezone);
        const dayOfWeek = dateInAdminTz.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        const dayPrefs = prefs.schedule[dayOfWeek];

        if (!dayPrefs.isWorking) {
            return NextResponse.json({ date: dateParam, availableSlots: [] });
        }

        // Convert literal start/end of the day in admin timezone to strict ISO boundaries for Google's API
        const workStartOfDay = fromZonedTime(`${dateParam}T00:00:00`, prefs.timezone);
        const workEndOfDay = fromZonedTime(`${dateParam}T23:59:59`, prefs.timezone);

        const timeMin = formatISO(workStartOfDay);
        const timeMax = formatISO(workEndOfDay);

        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin,
                timeMax,
                timeZone: prefs.timezone,
                items: [{ id: calendarId }],
            },
        });

        const busySlots = response.data.calendars?.[calendarId]?.busy || [];

        // Generate 30-minute slots strictly in the Admin's timezone
        const availableSlots: string[] = [];
        const now = new Date();

        for (const block of dayPrefs.timeBlocks) {
            // "08:00" -> ISO strict UTC match for that exact hour in Rome
            const blockStartStr = `${dateParam}T${block.start}:00`;
            const workStart = fromZonedTime(blockStartStr, prefs.timezone);

            const blockEndStr = `${dateParam}T${block.end}:00`;
            let workEnd = fromZonedTime(blockEndStr, prefs.timezone);

            // Allow 23:59 to capture the very end of the literal day
            if (block.end === '23:59') {
                workEnd = addMinutes(workEnd, 1);
            }

            let currentSlotStart = workStart;

            while (isBefore(currentSlotStart, workEnd)) {
                const currentSlotEnd = addMinutes(currentSlotStart, 30);

                // Check if this slot overlaps with any busy slots
                const isBusy = busySlots.some((busy: { start?: string | null, end?: string | null }) => {
                    if (!busy.start || !busy.end) return false;
                    const busyStart = new Date(busy.start);
                    const busyEnd = new Date(busy.end);

                    // Overlap condition: slot start is before busy end AND slot end is after busy start
                    return isBefore(currentSlotStart, busyEnd) && isAfter(currentSlotEnd, busyStart);
                });

                // Also ensure slot is not in the past
                if (!isBusy && isAfter(currentSlotStart, now)) {
                    availableSlots.push(currentSlotStart.toISOString());
                }

                currentSlotStart = currentSlotEnd;
            }
        }

        return NextResponse.json({ date: dateParam, availableSlots });
    } catch (error) {
        console.error('Error fetching availability:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch availability';
        return NextResponse.json({ error: errorMessage, details: error }, { status: 500 });
    }
}
