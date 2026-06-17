// Collaborative store using localStorage + BroadcastChannel for cross-tab sync.
// No backend required — perfect for simulating multiple users in the same room.

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  addedBy: string; // user name
  addedAt: number;
  note?: string;
};

export type Participant = {
  name: string;
  joinedAt: number;
  lastSeen: number;
  color: string;
};

export type ActivityEntry = {
  id: string;
  at: number;
  who: string;
  kind: "join" | "leave" | "add" | "remove" | "update" | "clear";
  message: string;
};

export type RoomState = {
  code: string;
  name: string;
  createdAt: number;
  freeShippingThreshold: number;
  items: CartItem[];
  participants: Participant[];
  activity: ActivityEntry[];
};

const PREFIX = "cartshare:room:";
const USER_KEY = "cartshare:user";

export const PALETTE = [
  "#0d9488", "#f97316", "#7c3aed", "#e11d48",
  "#0ea5e9", "#16a34a", "#d97706", "#db2777",
];

export function getUserName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_KEY);
}

export function setUserName(name: string) {
  localStorage.setItem(USER_KEY, name);
}

export function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export function loadRoom(code: string): RoomState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PREFIX + code);
  if (!raw) return null;
  try { return JSON.parse(raw) as RoomState; } catch { return null; }
}

export function saveRoom(state: RoomState) {
  localStorage.setItem(PREFIX + state.code, JSON.stringify(state));
}

export function createRoom(code: string, name: string, threshold = 75): RoomState {
  const state: RoomState = {
    code,
    name,
    createdAt: Date.now(),
    freeShippingThreshold: threshold,
    items: [],
    participants: [],
    activity: [],
  };
  saveRoom(state);
  return state;
}

export function colorFor(name: string, existing: Participant[]): string {
  const found = existing.find(p => p.name === name);
  if (found) return found.color;
  return PALETTE[existing.length % PALETTE.length];
}

export function pushActivity(state: RoomState, entry: Omit<ActivityEntry, "id" | "at">): RoomState {
  const next: RoomState = {
    ...state,
    activity: [
      { ...entry, id: crypto.randomUUID(), at: Date.now() },
      ...state.activity,
    ].slice(0, 100),
  };
  return next;
}

// --- Broadcast across tabs ---

const channels = new Map<string, BroadcastChannel>();

export function getChannel(code: string): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  let ch = channels.get(code);
  if (!ch) {
    ch = new BroadcastChannel(`cartshare-${code}`);
    channels.set(code, ch);
  }
  return ch;
}

export function broadcast(code: string) {
  getChannel(code)?.postMessage({ type: "update", at: Date.now() });
}

export function totals(state: RoomState) {
  const subtotal = state.items.reduce((s, it) => s + it.price * it.qty, 0);
  const remaining = Math.max(0, state.freeShippingThreshold - subtotal);
  const percent = Math.min(100, (subtotal / state.freeShippingThreshold) * 100);
  const byPerson = new Map<string, number>();
  for (const it of state.items) {
    byPerson.set(it.addedBy, (byPerson.get(it.addedBy) ?? 0) + it.price * it.qty);
  }
  return { subtotal, remaining, percent, byPerson };
}
