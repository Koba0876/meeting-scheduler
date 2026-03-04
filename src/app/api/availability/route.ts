import { NextResponse } from 'next/server';
import { getGoogleCalendarClient } from '@/lib/google';
import { getPreferences } from '@/lib/preferences';
import { addMinutes, isBefore, isAfter, formatISO, addDays, format } from 'date-fns';
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

        // Visitor's requested day boundaries in their own localized timezone
        const visitorTz = searchParams.get('tz') || prefs.timezone;
        const visitorStartOfDay = fromZonedTime(`${dateParam}T00:00:00`, visitorTz);
        const visitorEndOfDay = fromZonedTime(`${dateParam}T23:59:59`, visitorTz);

        // To guarantee we cover the visitor's day regardless of the +/- 14hr timezone offset,
        // we deliberately generate Admin slots for 3 consecutive days centered around the request.
        const centerDate = new Date(`${dateParam}T12:00:00Z`);
        const datesToGenerate = [
            addDays(centerDate, -1),
            centerDate,
            addDays(centerDate, 1) // +1
        ].map(d => format(d, 'yyyy-MM-dd'));

        let allAvailableSlots: Date[] = [];
        const now = new Date();

        for (const genDateString of datesToGenerate) {
            // Find the day of week relative to the admin's intended timezone for this generated day
            const adminDateObj = fromZonedTime(`${genDateString}T12:00:00`, prefs.timezone);
            const adminZoned = toZonedTime(adminDateObj, prefs.timezone);
            const dayOfWeek = adminZoned.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
            const dayPrefs = prefs.schedule[dayOfWeek];

            if (!dayPrefs.isWorking) continue;

            for (const block of dayPrefs.timeBlocks) {
                // "08:00" -> ISO strict UTC match for that exact hour in admin's timezone
                const blockStartStr = `${genDateString}T${block.start}:00`;
                const workStart = fromZonedTime(blockStartStr, prefs.timezone);

                const blockEndStr = `${genDateString}T${block.end}:00`;
                let workEnd = fromZonedTime(blockEndStr, prefs.timezone);

                // Allow 23:59 to capture the very end of the literal day
                if (block.end === '23:59') {
                    workEnd = addMinutes(workEnd, 1);
                }

                let currentSlotStart = workStart;

                while (isBefore(currentSlotStart, workEnd)) {
                    allAvailableSlots.push(currentSlotStart);
                    currentSlotStart = addMinutes(currentSlotStart, 30);
                }
            }
        }

        // Strictly filter the massive 3-day block to ONLY slots that fall perfectly 
        // within the visitor's 24-hour localized request window
        allAvailableSlots = allAvailableSlots.filter(slot => {
            return slot.getTime() >= visitorStartOfDay.getTime() &&
                slot.getTime() <= visitorEndOfDay.getTime() &&
                slot.getTime() > now.getTime();
        });

        if (allAvailableSlots.length === 0) {
            return NextResponse.json({ date: dateParam, availableSlots: [] });
        }

        // Check Google Calendar *only* for the overlapping bounds of the visitor's actual day
        const timeMin = formatISO(visitorStartOfDay);
        const timeMax = formatISO(visitorEndOfDay);

        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin,
                timeMax,
                timeZone: 'UTC',
                items: [{ id: calendarId }],
            },
        });

        const busySlots = response.data.calendars?.[calendarId]?.busy || [];

        // Final Filter: Remove slots that overlap with the Google Calendar events
        const finalSlots = allAvailableSlots.filter(slot => {
            const slotEnd = addMinutes(slot, 30);

            const isBusy = busySlots.some((busy: { start?: string | null, end?: string | null }) => {
                if (!busy.start || !busy.end) return false;
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);

                return isBefore(slot, busyEnd) && isAfter(slotEnd, busyStart);
            });

            return !isBusy;
        });

        // Map back to ISO strings for transmission
        const formattedSlots = finalSlots.map(s => s.toISOString());

        return NextResponse.json({ date: dateParam, availableSlots: formattedSlots });
    } catch (error) {
        console.error('Error fetching availability:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch availability';
        return NextResponse.json({ error: errorMessage, details: error }, { status: 500 });
    }
}
