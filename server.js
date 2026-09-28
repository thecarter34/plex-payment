const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
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

// Load HTML email template once at startup
const EMAIL_TEMPLATE = fs.readFileSync(path.join(__dirname, 'templates', 'email.html'), 'utf8');

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

    // Only act on approved requests + test pings. We removed MEDIA_PENDING so
    // we don't charge users for requests that get denied.
    if (notificationType === 'MEDIA_APPROVED' || notificationType === 'MEDIA_AUTO_APPROVED' || notificationType === 'TEST_NOTIFICATION') {
        const subject = payload.subject || 'Unknown Title';
        const message = payload.message || '';

        // Detect auto-approve for slightly different copy in the email
        const autoApproved = notificationType === 'MEDIA_AUTO_APPROVED';

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

            const venmoPayUrl = `https://venmo.com/?txn=pay&recipients=${VENMO_HANDLE}&note=${encodeURIComponent("Plex Request: " + subject)}`;

            // Render the email template with the actual values
            const emailContent = EMAIL_TEMPLATE
                .replace(/\{\{SUBJECT\}\}/g, subject)
                .replace(/\{\{VENMO_URL\}\}/g, venmoPayUrl)
                .replace(/\{\{YEAR\}\}/g, new Date().getFullYear().toString());

            try {
                await transporter.sendMail({
                    from: EMAIL_FROM,
                    to: userEmail,
                    subject: autoApproved
                        ? `Available now: ${subject}`
                        : `Approved: ${subject} on Plex`,
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

