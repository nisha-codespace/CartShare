# CartShare — Collaborative shopping carts

Project built for the CartShare internship Studio challenge. Convert a prototype into a lightweight, real-time shared cart app where users create or join Rooms, add/remove items collaboratively, and print an audit-ready receipt.

**Quick Links**
- **Landing page**: [src/routes/index.tsx](src/routes/index.tsx#L1)
- **Room (cart) UI**: [src/routes/room.$code.tsx](src/routes/room.$code.tsx#L1)
- **Printable receipt**: [src/routes/receipt.$code.tsx](src/routes/receipt.$code.tsx#L1)
- **Client-side store & sync**: [src/lib/cartshare/store.ts](src/lib/cartshare/store.ts#L1)

**Features**
- **Create / Join Room**: Generate or enter a room code to join a shared cart.
- **Real-time sync (per-device)**: Cart state persists in browser storage and syncs across tabs/windows for the same device.
- **Activity log**: See who added/removed items and when.
- **Printable receipt**: Clean, print-ready receipt with per-person split and shipping calculations.

**Prerequisites**
- **Node.js** 16+ (recommended 18+)
- Git

**Run locally**
1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

Open http://localhost:5173 and use the UI to create a room. To simulate multiple participants, open the same room URL in another tab and enter different names.

**Build & Preview**

```bash
npm run build
npm run preview
```
