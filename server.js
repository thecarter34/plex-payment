const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Venmo configuration
const VENMO_HANDLE = process.env.VENMO_HANDLE; // e.g., 'Your-Name-123'
// Email configuration
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;

if (!VENMO_HANDLE) {
    console.warn('WARNING: VENMO_HANDLE is not set. Links will likely fail.');
}

// Transporter for Nodemailer
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

app.post('/webhook', async (req, res) => {
    console.log('Received webhook:', JSON.stringify(req.body, null, 2));

    const payload = req.body;

    // Overseerr payload structure (based on standard notifications)
    // We look for 'notification_type'

    const notificationType = payload.notification_type;

    // We only care about PENDING requests usually, or explicitly requested ones.
    // 'MEDIA_PENDING' is a common type for new requests needing approval.
    if (notificationType === 'MEDIA_PENDING' || notificationType === 'TEST_NOTIFICATION') {
        const subject = payload.subject || 'Unknown Title';
        const message = payload.message || '';

        // Overseerr sends user info in internal objects often, but payload varies.
        // Assuming we can get email from 'request' object or 'user' object if provided.
        // Standard Overseerr webhook might just have 'email' if configured in the payload options json?
        // Actually, Overseerr webhooks are often generic. We might need to dig into 'request' -> 'requestedBy' -> 'email'.

        let userEmail = null;
        if (payload.email) {
            userEmail = payload.email;
        } else if (payload.request) {
            if (payload.request.requestedBy_email) {
                userEmail = payload.request.requestedBy_email;
            } else if (payload.request.requestedBy && payload.request.requestedBy.email) {
                userEmail = payload.request.requestedBy.email;
            }
        }

        // Fallback for test
        if (notificationType === 'TEST_NOTIFICATION' && !userEmail) {
            console.log('Test notification received.');
            return res.status(200).send('Test received');
        }

        if (userEmail) {
            console.log(`Processing request for: ${subject} from ${userEmail}`);

            // Generate Venmo Link
            // Web: https://venmo.com/u/USERNAME
            // Deep Link scheme: venmo://paycharge?txn=pay&recipients=USERNAME&amount=AMOUNT&note=NOTE
            // We'll leave amount blank for them to fill, or set a default if provided in env?
            // Let's stick to a generic web link for compatibility, or give both.

            const venmoWebUrl = `https://venmo.com/${VENMO_HANDLE}`;
            // Construct a "pay" specific link if possible or just the profile. 
            // Better: https://venmo.com/?txn=pay&recipients=${VENMO_HANDLE}&note=${encodeURIComponent(subject)}
            const venmoPayUrl = `https://venmo.com/?txn=pay&recipients=${VENMO_HANDLE}&note=${encodeURIComponent("Plex Request: " + subject)}`;

            const emailContent = `
                <h2>Plex Request Received</h2>
                <p>Hello,</p>
                <p>We received your request for <strong>${subject}</strong>.</p>
                <p>To process this request, please contribute via Venmo.</p>
                <p><a href="${venmoPayUrl}" style="background-color: #3D95CE; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Pay with Venmo</a></p>
                <p>Or use this link: ${venmoPayUrl}</p>
                <p>Thanks!</p>
            `;

            try {
                await transporter.sendMail({
                    from: EMAIL_FROM,
                    to: userEmail,
                    subject: `Action Required: Plex Request for ${subject}`,
                    html: emailContent,
                });
                console.log(`Email sent to ${userEmail}`);
            } catch (error) {
                console.error('Error sending email:', error);
            }

        } else {
            console.log('No user email found in payload.');
        }
    }

    res.status(200).send('Webhook processed');
});

app.get('/', (req, res) => {
    res.send('Plex Payment Service Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
