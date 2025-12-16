# Plex Payment Request Notifier

This lightweight Docker application acts as a middleware between Overseerr and your users. When a user requests media in Overseerr, this app receives the webhook and sends them an automated email asking for a Venmo payment.

## Features
- 🚀 **Automated**: Listens for `MEDIA_PENDING` webhooks from Overseerr.
- 📧 **Notifications**: Emails the requester a direct Venmo deep-link.
- 🐳 **Dockerized**: Ready for TrueNAS Scale, Unraid, or standard Docker.
- 🔄 **Auto-Updating**: GitHub Actions workflow to auto-build on push.

## Prerequisites

1.  **System**: TrueNAS Scale, Unraid, or any system with Docker.
2.  **Gmail Account**: For sending emails (App Password required).
3.  **Venmo Account**: To receive payments.

## Quick Start (No Coding Required)

You do **not** need to download or modify the code. You can simply deploy the pre-built Docker image.

### 1. Deploy via Docker Compose (TrueNAS)
Use the `install.template.yaml` file provided in this repo.

1.  Copy the content of `install.template.yaml`.
2.  Fill in your Environment Variables (Email, Password, Venmo).
    *   **Image**: `thecarter34/plex-payment:latest`
3.  Paste into TrueNAS "Custom App" or Portainer Stack.
4.  Click Install.

### 2. Configure Overseerr
1.  **Settings** -> **Notifications** -> **Webhooks**.
2.  **Add Webhook**:
    *   **Url**: `http://<YOUR-NAS-IP>:10000/webhook` (Update port to match your mapping)
    *   **Triggers**: `Media Pending Approval`

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VENMO_HANDLE` | Your Venmo Username (no @) | `john_doe` |
| `SMTP_HOST` | SMTP Server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP Port | `587` |
| `SMTP_USER` | Your Email Address | `me@gmail.com` |
| `SMTP_PASS` | App Password (No spaces) | `abcdefghijklmnop` |
| `EMAIL_FROM` | Sender Name | `Plex Admin` |
