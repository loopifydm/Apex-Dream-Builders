# APEX Dream Builders & Engineers — Construction Management Website

A GitHub Pages-ready construction management dashboard for:

- Site measurements and automatic quantity calculation
- Material buying / purchase tracking
- Daily labour count uploaded by supervisor name
- Supervisor management
- Dashboard summaries
- CSV report export
- JSON backup

## Current version

This version is a **frontend-first working prototype**. Data is stored in the browser using `localStorage`, so it works immediately on GitHub Pages without a server.

### Important

`localStorage` is device/browser-specific. If a supervisor enters data from a mobile phone, the management dashboard on another computer will not automatically receive that data.

For a real multi-user construction system, connect this UI to a backend such as Firebase or Supabase.

## GitHub Pages deployment

1. Create a GitHub repository, for example `apex-construction-management`.
2. Upload `index.html`, `assets/` and `README.md`.
3. Open repository **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`.
6. Save.
7. GitHub will provide your public website URL.

## Suggested production upgrade

Add:

- Supervisor login
- Admin / Engineer / Supervisor roles
- Cloud database
- Photo upload for measurements and material bills
- Site-wise access control
- Material stock / inward / outward
- Daily labour cost and wage calculations
- Weekly and monthly summaries
- Payment advance and balance
- PDF/Excel reports
- WhatsApp notification
- Audit history
- Mobile-friendly PWA

## Recommended data model

### Sites
`site_id, site_name, client_name, location, status`

### Supervisors
`supervisor_id, name, phone, assigned_sites, status`

### Measurements
`measurement_id, date, site_id, work, supervisor_id, length, breadth, height, quantity, unit, notes, photo_url`

### Materials
`purchase_id, date, site_id, item, supplier, invoice, quantity, unit, rate, total, buyer, supervisor_id, bill_photo_url`

### Labour
`labour_id, date, site_id, supervisor_id, category, shift, worker_count, notes`

## Brand

**APEX Dream Builders & Engineers**

Use this as the foundation for a production construction ERP / site management portal.


## PWA setup

The repository now includes the initial Progressive Web App shell:

- `manifest.webmanifest` — app name, launch URL, standalone display and theme colours.
- `service-worker.js` — caches the local app shell and provides a network fallback for navigation.
- `icons/apex-icon.svg` — APEX app icon.
- `index.html` — links the manifest and registers the service worker.

### Publish and install

1. Open **Settings → Pages** and confirm the `main` branch and `/ (root)` are published.
2. Wait for the Pages deployment to finish and open the HTTPS website in Chrome on Android.
3. Open Chrome's menu and choose **Install app** or **Add to Home screen**.
4. Open the installed app once while online so the service worker can cache its app shell.

### Offline behaviour and limitations

- The app shell can load offline after the first successful online visit and service-worker installation.
- Existing records are stored in browser `localStorage`; they remain local to that browser/device and are not synced across devices.
- External Google Fonts may not be available offline.
- Do not treat local browser storage as a secure, shared production database.

### Push notifications

The service worker includes handlers for receiving and displaying push messages, but push delivery is **not fully configured** by this repository alone. A static GitHub Pages site cannot securely send push messages. To activate push subscriptions and delivery, configure a push provider/backend (for example, Firebase Cloud Messaging or a server using Web Push/VAPID), its public client configuration, and a secure endpoint to save subscriptions and send notifications. Never place a private VAPID key or server credential in frontend files.
