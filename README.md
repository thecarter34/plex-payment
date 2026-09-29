# Plex Payment Request Notifier

This lightweight Docker application acts as a middleware between Overseerr and your users. When a request is **approved** in Overseerr, this app receives the webhook and emails the requester a JJCTech-branded confirmation with a Venmo deep-link for tipping the server.

## Features
- 🚀 **Automated**: Listens for `MEDIA_APPROVED` / `MEDIA_AUTO_APPROVED` webhooks from Overseerr.
- 📧 **Notifications**: Emails the requester a JJCTech-branded confirmation with a direct Venmo deep-link.
- 🎨 **Polished template**: Dark-themed HTML email (cyan→blue→purple gradient hero + CTA, WCAG AA contrast, responsive).
- 🐳 **Dockerized**: Ready for TrueNAS Scale, Unraid, or standard Docker.
- 🔄 **Auto-Updating**: GitHub Actions workflow to auto-build and push to Docker Hub on every push to `main`.

## Prerequisites

1.  **System**: TrueNAS Scale, Unraid, or any system with Docker.
2.  **Overseerr**: The interface people use to make requests.
3.  **Gmail Account**: For sending emails (App Password required).
4.  **Venmo Account**: To receive payments.

## Quick Start (No Coding Required)

You do **not** need to download or modify the code. You can simply deploy the pre-built Docker image.

### 1. Deploy via Docker Compose (TrueNAS)
Use the `install.template.yaml` file provided in this repo.

1.  **Copy the YAML below:**

    ```yaml
    version: '3.8'

    services:
      plex-payment:
        # Official Docker Image
        image: thecarter34/plex-payment:latest
        pull_policy: always
        restart: unless-stopped
        ports:
          # Host Port : Container Port
          - "10000:3000"
        environment:
          # --- Venmo Configuration ---
          - VENMO_HANDLE=your_venmo_username
          - PORT=3000

          # --- Email Configuration (Gmail) ---
          - SMTP_HOST=smtp.gmail.com
          - SMTP_PORT=587
          - SMTP_USER=your_email@gmail.com
          # App Password (16 chars, no spaces)
          - SMTP_PASS=abcdefghijklmnop
          - EMAIL_FROM=Plex Admin
    ```

2.  Fill in your `VENMO_HANDLE`, `SMTP_USER`, and `SMTP_PASS`.
3.  Paste into TrueNAS "Custom App" or Portainer Stack.
4.  Click Install.

### 2. Configure Overseerr
1.  **Settings** -> **Notifications** -> **Webhooks**.
2.  **Add Webhook**:
    *   **Url**: `http://<YOUR-NAS-IP>:10000/webhook` (Update port to match your mapping)
    *   **Triggers**: `Media Auto-Approved` and/or `Media Approved`

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VENMO_HANDLE` | Your Venmo Username (no @) | `john_doe` |
| `SMTP_HOST` | SMTP Server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP Port | `587` |
| `SMTP_USER` | Your Email Address | `me@gmail.com` |
| `SMTP_PASS` | App Password (No spaces) | `abcdefghijklmnop` |
| `EMAIL_FROM` | Sender Name | `Plex Admin` |

## Email Template

The notification email is rendered from `templates/email.html` (JJCTech dark theme) and uses three template placeholders that are substituted by `server.js` at request time:

| Placeholder | Replaced with |
|-------------|---------------|
| `{{SUBJECT}}` | The approved media title (e.g. `Runner (2026)`) |
| `{{VENMO_URL}}` | The Venmo deep-link with the request title pre-filled in the note |
| `{{YEAR}}` | Current year (`new Date().getFullYear()`) — never hardcoded |

The resulting email subject is `Request Approved: <title>`. If the template file is missing or any placeholder is misspelled, the regex escape in `server.js` (`/\{\{SUBJECT\}\}/g` etc.) silently leaves the literal `{{...}}` token in the email — verify the template ships inside the Docker image (the `Dockerfile` must `COPY . .`, not just `COPY server.js package.json`).

### Editing the template

The template is a single self-contained HTML file with inline styles for email-client compatibility (Apple Mail, Gmail, Outlook Mac, iOS Mail render fully; Outlook Windows degrades gracefully — gradient → flat color, rounded corners → sharp). To iterate, edit `templates/email.html` locally, then:

```bash
# Render a preview in your browser before committing
google-chrome --headless --screenshot=/tmp/email-preview.png \
  --window-size=700,1200 \
  "file://$(pwd)/templates/email.html"
```

Audit checklist before any template change:
- [ ] All three placeholders preserved (`{{SUBJECT}}`, `{{VENMO_URL}}`, `{{YEAR}}`)
- [ ] All text colors clear WCAG AA (≥4.5:1 for body, ≥3:1 for large/bold) against the dark card
- [ ] Hero + CTA gradient identity preserved (`#00d4ff` → `#0066ff` → `#8b5cf6`)
- [ ] No `display: flex`, no CSS Grid — table-based layout only for Outlook compat
- [ ] SVG logo has `role="img"` and `aria-label="JJC Tech"`



