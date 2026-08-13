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
