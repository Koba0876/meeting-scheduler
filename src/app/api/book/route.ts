import { NextResponse } from 'next/server';
import { getGoogleCalendarClient } from '@/lib/google';
import { sendMeetingEmail } from '@/lib/mail';
import { addMinutes, format } from 'date-fns';

export async function POST(request: Request) {
    try {
        const { meetingTitle, name, email, extraGuests, startTime, notes } = await request.json();

        if (!name || !email || !startTime) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const calendar = getGoogleCalendarClient();
        const calendarId = process.env.GOOGLE_CALENDAR_ID;

        if (!calendarId) {
            throw new Error('GOOGLE_CALENDAR_ID is not set in environment variables');
        }

        const start = new Date(startTime);
        const end = addMinutes(start, 30);
        const now = new Date();
        const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
        const isPending = start < fourHoursFromNow;

        const attendees: { email: string; displayName?: string }[] = [
            { email, displayName: name },
            { email: 'melina@baitsociety.ai', displayName: 'Melina' },
            { email: 'koba@baitsociety.ai', displayName: 'Koba' },
        ];

        if (extraGuests && Array.isArray(extraGuests)) {
            extraGuests.forEach((guest: { email: string; name: string }) => {
                if (guest.email) {
                    attendees.push({ email: guest.email, displayName: guest.name || '' });
                }
            });
        }

        let meetLink = '';
        let eventLink = '';

        const event = {
            summary: isPending ? `[PENDING AUTHORIZATION] ${meetingTitle || `Meeting with ${name}`}` : (meetingTitle || `Meeting with ${name}`),
            description: `Meeting scheduled via web app.\n\nNotes: ${notes || 'None'}`,
            start: {
                dateTime: start.toISOString(),
            },
            end: {
                dateTime: end.toISOString(),
            },
            attendees,
            guestsCanModify: true,
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet',
                    },
                },
            },
        };

        const response = await calendar.events.insert({
            calendarId,
            conferenceDataVersion: 1,
            sendUpdates: 'none', // DO NOT send Google Invites, we handle this via Aruba SMTP
            requestBody: event,
        });

        meetLink = response.data.hangoutLink || '';
        eventLink = response.data.htmlLink || '';

        // 2. Dispatch Custom Aruba SMTP Email
        const recipientEmails: string[] = [email, 'melina@baitsociety.ai', 'koba@baitsociety.ai'];
        
        if (extraGuests && Array.isArray(extraGuests)) {
            extraGuests.forEach((guest: { email: string; name: string }) => {
                if (guest.email) recipientEmails.push(guest.email);
            });
        }

        // Use basic formatting since the API server handles UTC. 
        const formattedDate = format(start, 'EEEE, MMMM d, yyyy');
        const formattedTime = `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')} UTC`;

        await sendMeetingEmail({
            to: recipientEmails,
            clientName: name,
            meetingTitle: meetingTitle || `Meeting with ${name}`,
            dateString: formattedDate,
            timeString: formattedTime,
            meetLink: meetLink,
            notes: notes,
            isPending: isPending
        });

        return NextResponse.json({
            success: true,
            status: isPending ? 'pending' : 'confirmed',
            meetLink: meetLink,
            eventLink: eventLink
        });
    } catch (error) {
        console.error('Error creating meeting:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create meeting';
        return NextResponse.json({ error: errorMessage, details: error }, { status: 500 });
    }
}
