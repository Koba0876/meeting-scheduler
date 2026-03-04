import { NextResponse } from 'next/server';
import { getGoogleCalendarClient } from '@/lib/google';
import { getPreferences } from '@/lib/preferences';
import { addMinutes, isBefore, isAfter, formatISO, startOfDay, endOfDay, setHours, setMinutes } from 'date-fns';

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
        const selectedDate = new Date(dateParam);

        // Get day of week (0-6)
        const dayOfWeek = selectedDate.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        const dayPrefs = prefs.schedule[dayOfWeek];

        if (!dayPrefs.isWorking) {
            return NextResponse.json({ date: dateParam, availableSlots: [] });
        }

        // Convert to ISO string for Google API for the whole day
        const timeMin = formatISO(startOfDay(selectedDate));
        const timeMax = formatISO(endOfDay(selectedDate));

        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin,
                timeMax,
                timeZone: prefs.timezone,
                items: [{ id: calendarId }],
            },
        });

        const busySlots = response.data.calendars?.[calendarId]?.busy || [];

        // Generate 30-minute slots between workStart and workEnd for each block
        const availableSlots: string[] = [];
        const now = new Date();

        for (const block of dayPrefs.timeBlocks) {
            // Parse start time (HH:mm)
            const [startHour, startMin] = block.start.split(':').map(Number);
            const workStart = setMinutes(setHours(selectedDate, startHour), startMin);

            // Parse end time (HH:mm)
            const [endHour, endMin] = block.end.split(':').map(Number);
            const workEnd = setMinutes(setHours(selectedDate, endHour), endMin);

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
