import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465, // Aruba typically uses 465 for SSL or 587 for TLS
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendMeetingEmail({
    to,
    meetingTitle,
    dateString,
    timeString,
    meetLink,
    notes,
    clientName,
    isPending = false,
}: {
    to: string | string[];
    meetingTitle: string;
    dateString: string;
    timeString: string;
    meetLink: string;
    notes?: string;
    clientName: string;
    isPending?: boolean;
}) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials not configured. Skipping email send.');
        return false;
    }

    const subject = isPending 
        ? `Authorization Required: ${meetingTitle || 'New Booking'} Request`
        : `Meeting Confirmation: ${meetingTitle || 'Bait Society'} on ${dateString}`;

    const headerNote = isPending
        ? `<div style="background-color: #fef7e0; border: 1px solid #feefc3; border-radius: 4px; padding: 12px; margin-bottom: 24px; color: #b05e00; font-size: 13px;">
            <strong>Note:</strong> This is a last-minute booking request that requires manual authorization by the Bait Society team.
           </div>`
        : '';

    const guestListHtml = Array.isArray(to)
        ? to.map(email => `<li style="margin-bottom: 4px; display: flex; align-items: center;"><span style="color: #3c4043;">${email}</span></li>`).join('')
        : `<li style="margin-bottom: 4px; display: flex; align-items: center;"><span style="color: #3c4043;">${to}</span></li>`;

    const organizerEmail = 'koba@baitsociety.ai';

    const htmlContent = `
        <div style="font-family: 'Google Sans', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #3c4043;">
            ${headerNote}
            <div style="border: 1px solid #dadce0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                <div style="padding: 24px;">
                    <p style="font-size: 14px; color: #70757a; margin: 0 0 8px 0;">${dateString} ⋅ ${timeString}</p>
                    <h1 style="font-size: 24px; font-weight: 400; color: #202124; margin: 0 0 24px 0;">${meetingTitle || 'Meeting with Bait Society'}</h1>
                    
                    <div style="display: flex; align-items: center; margin-bottom: 24px; color: #5f6368; font-size: 14px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 12px;"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                        <span>${Array.isArray(to) ? (to.length > 2 ? `${to.slice(0, 2).join(', ')} & ${to.length - 2} other${to.length - 2 > 1 ? 's' : ''}` : to.join(', ')) : to}</span>
                    </div>
                </div>
            </div>

            <div style="padding: 0 24px;">
                <div style="margin-bottom: 32px; border-bottom: 1px solid #e8eaed; padding-bottom: 24px;">
                    <h3 style="font-size: 16px; font-weight: 500; color: #202124; margin: 0 0 8px 0;">When</h3>
                    <p style="font-size: 14px; margin: 0;">${dateString} ⋅ ${timeString}</p>
                </div>

                <div style="display: flex; flex-direction: row; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px; margin-bottom: 24px; padding-right: 16px;">
                        <h3 style="font-size: 16px; font-weight: 500; color: #202124; margin: 0 0 12px 0;">Guests</h3>
                        <ul style="list-style-type: none; padding: 0; margin: 0; font-size: 14px;">
                            <li style="margin-bottom: 4px;"><strong>${organizerEmail} - organizer</strong></li>
                            ${guestListHtml}
                        </ul>
                        
                        ${notes ? `
                        <div style="margin-top: 24px;">
                            <h3 style="font-size: 16px; font-weight: 500; color: #202124; margin: 0 0 8px 0;">Notes</h3>
                            <p style="font-size: 14px; margin: 0; white-space: pre-wrap;">${notes}</p>
                        </div>
                        ` : ''}
                    </div>

                    ${isPending ? `
                    <div style="flex: 1; min-width: 250px;">
                        <div style="font-size: 14px; color: #5f6368; font-style: italic; border: 1px dashed #dadce0; padding: 16px; border-radius: 8px;">
                            Authorization pending. No Google Meet link generated yet.
                        </div>
                    </div>
                    ` : `
                    <div style="flex: 1; min-width: 250px;">
                        <div style="margin-bottom: 16px;">
                            <a href="${meetLink}" style="display: inline-block; background-color: #1a73e8; color: #ffffff; padding: 10px 24px; border-radius: 4px; text-decoration: none; font-weight: 500; font-size: 14px; font-family: 'Google Sans', Roboto, Arial, sans-serif;">Join with Google Meet</a>
                        </div>
                        <div style="font-size: 14px;">
                            <p style="color: #70757a; margin: 0 0 4px 0;">Meeting link</p>
                            <a href="${meetLink}" style="color: #1a73e8; text-decoration: none;">${meetLink.replace('https://', '')}</a>
                        </div>
                    </div>
                    `}
                </div>
            </div>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"Bait Society" <${process.env.SMTP_USER}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject: subject,
            html: htmlContent,
        });
        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}
