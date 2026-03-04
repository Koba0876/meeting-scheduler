import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Missing authorization code from Google.' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Missing OAuth Client ID or Secret in environment.' }, { status: 500 });
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            'http://localhost:3000/api/auth/callback'
        );

        const { tokens } = await oauth2Client.getToken(code);

        // Let's attempt to auto-inject the refresh token into the .env.local file
        try {
            const envPath = path.join(process.cwd(), '.env.local');
            let envContent = fs.readFileSync(envPath, 'utf8');
            envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=".*"/, `GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
            fs.writeFileSync(envPath, envContent);

            return new NextResponse(`
                <html>
                    <body style="font-family: sans-serif; padding: 40px; text-align: center;">
                        <h1 style="color: #10b981;">Successfully Authenticated!</h1>
                        <p>Google has granted the Meeting Scheduler full Calendar Access.</p>
                        <p>Your new Refresh Token has been <b>automatically injected</b> into your <code>.env.local</code> file.</p>
                        <p>You may now close this window and book a meeting!</p>
                    </body>
                </html>
            `, { headers: { 'Content-Type': 'text/html' } });
        } catch (fileError) {
            // Fallback if we can't write to the file
            return NextResponse.json({
                message: 'Successfully generated tokens! Please manually copy the refresh token into your .env.local file.',
                refresh_token: tokens.refresh_token
            });
        }

    } catch (error) {
        console.error('Error exchanging token:', error);
        return NextResponse.json({ error: 'Failed to exchange token with Google.', details: error }, { status: 500 });
    }
}
