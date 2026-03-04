import { google } from 'googleapis';

// The scopes required for reading and managing calendar events
const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
];

export function getGoogleCalendarClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error("Missing Google OAuth 2.0 credentials in environment variables.");
    }

    const auth = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'http://localhost:3000/api/auth/callback'
    );

    auth.setCredentials({
        refresh_token: refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth });
    return calendar;
}
