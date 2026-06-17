# CartShare — Collaborative shopping carts

CartShare is a group shopping web app built for the internship Studio challenge. It turns a prototype into a working collaborative cart experience where students can create or join a Room, add items together, track shared cart activity, and print a receipt for split payment.

## Key features

- **Create or join Rooms** with a code
- **Shared cart across tabs** using browser storage and tab-sync
- **Live activity log** showing who added, updated, or removed items
- **Checkout progress bar** with free-shipping threshold tracking
- **Printable receipt** with per-person split and shipping details

## Project structure

- `src/routes/index.tsx` — landing page + room creation/join flow
- `src/routes/room.$code.tsx` — shared room/cart experience
- `src/routes/receipt.$code.tsx` — printable receipt page
- `src/lib/cartshare/store.ts` — local storage persistence, room state, and sync logic
- `src/styles.css` — base styling for responsive layout

## Tech stack

- React 19
- Vite
- Tailwind CSS
- TanStack Router + React Start
- Lucide icons
- Local browser storage for persistence

## Prerequisites

- Node.js 16+ (recommend 18+)
- npm

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the app:

```text
http://localhost:5173
```

> Tip: Open the same room URL in a second browser tab to simulate another participant.

## Build & preview

```bash
npm run build
npm run preview
```

This project has been verified with a successful build using Vercel.

## Deployment

CartShare is ready for static deployment. Use Vercel, Netlify, or GitHub Pages with the Vite build output.

- Build command: `npm run build`
- Output directory: `dist`
