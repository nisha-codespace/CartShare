import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag, Plus, Trash2, Minus, Copy, Check, Printer, LogOut, Users, Activity as ActivityIcon, Settings2,
} from "lucide-react";
import { getUserName, setUserName, totals, loadRoom } from "@/lib/cartshare/store";
import { useRoom } from "@/lib/cartshare/useRoom";

export const Route = createFileRoute("/room/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Room ${params.code} — CartShare` },
      { name: "description", content: `Shared cart room ${params.code}. Add items together in real time.` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RoomPage,
});

function RoomPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [roomMissing, setRoomMissing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = loadRoom(code);
    if (!existing) { setRoomMissing(true); return; }
    const u = getUserName();
    if (u) setUser(u);
  }, [code]);

  const { state, addItem, removeItem, updateQty, clearCart, setThreshold } = useRoom(code, user);

  if (roomMissing) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold">Room not found</h1>
          <p className="mt-3 text-muted-foreground">
            We couldn't find a room with code <span className="font-mono">{code}</span> on this device.
          </p>
          <Link to="/" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-soft)]">Back home</Link>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <form
          onSubmit={e => {
            e.preventDefault();
            const trimmed = nameInput.trim();
            if (!trimmed) return;
            setUserName(trimmed);
            setUser(trimmed);
          }}
          className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-[var(--shadow-pop)] ring-1 ring-border"
        >
          <h1 className="text-2xl font-bold">Join room <span className="font-mono text-primary">{code}</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Tell the group who you are.</p>
          <input
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder="Your name"
            className="mt-5 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
          <button className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-soft)]">Join</button>
        </form>
      </main>
    );
  }

  if (!state) return null;

  const t = totals(state);
  const activeParticipants = state.participants.filter(p => Date.now() - p.lastSeen < 60_000);

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      {/* Header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold sm:text-2xl">{state.name}</h1>
            <button
              onClick={copyCode}
              className="mt-0.5 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 font-mono text-xs tracking-widest text-muted-foreground transition hover:bg-secondary"
              title="Copy room code"
            >
              {code} {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/receipt/$code"
            params={{ code }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-card px-3 py-2 text-sm font-medium shadow-[var(--shadow-soft)] ring-1 ring-border transition hover:bg-secondary"
          >
            <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Receipt</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-card px-3 py-2 text-sm font-medium text-muted-foreground shadow-[var(--shadow-soft)] ring-1 ring-border transition hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Leave</span>
          </Link>
        </div>
      </header>

      {/* Progress */}
      <section className="mt-6 rounded-3xl bg-card p-5 shadow-[var(--shadow-soft)] ring-1 ring-border sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="text-sm text-muted-foreground">Cart subtotal</div>
            <div className="font-display text-3xl font-bold">${t.subtotal.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Free-shipping at</div>
            <ThresholdEditor value={state.freeShippingThreshold} onChange={setThreshold} />
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${t.percent}%` }}
          />
        </div>
        <div className="mt-2 text-sm">
          {t.remaining > 0 ? (
            <span className="text-muted-foreground">Add <span className="font-semibold text-foreground">${t.remaining.toFixed(2)}</span> more to unlock free shipping</span>
          ) : (
            <span className="font-medium text-success">🎉 Free shipping unlocked!</span>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Cart */}
        <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-soft)] ring-1 ring-border sm:p-6">
          <AddItemForm onAdd={(item) => addItem(item, user)} />
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Items ({state.items.length})</h2>
              {state.items.length > 0 && (
                <button
                  onClick={() => clearCart(user)}
                  className="text-xs font-medium text-muted-foreground hover:text-destructive"
                >
                  Clear all
                </button>
              )}
            </div>
            {state.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
                Cart is empty. Add the first item above ☝️
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {state.items.map(item => {
                  const p = state.participants.find(p => p.name === item.addedBy);
                  return (
                    <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{item.name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: `${p?.color ?? "#999"}20`, color: p?.color ?? "#666" }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p?.color ?? "#999" }} />
                            {item.addedBy}
                          </span>
                          <span>·</span>
                          <span>${item.price.toFixed(2)} each</span>
                          {item.note && <><span>·</span><span className="italic">{item.note}</span></>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="flex items-center rounded-lg border border-border bg-background">
                          <button
                            onClick={() => updateQty(item.id, item.qty - 1, user)}
                            className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground"
                            aria-label="Decrease"
                          ><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-8 text-center text-sm font-medium tabular-nums">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + 1, user)}
                            className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground"
                            aria-label="Increase"
                          ><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="w-16 text-right font-semibold tabular-nums">${(item.price * item.qty).toFixed(2)}</div>
                        <button
                          onClick={() => removeItem(item.id, user)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Remove"
                        ><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-soft)] ring-1 ring-border">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">In the room</h2>
            </div>
            <ul className="space-y-2">
              {state.participants.map(p => {
                const online = Date.now() - p.lastSeen < 60_000;
                const spent = t.byPerson.get(p.name) ?? 0;
                return (
                  <li key={p.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: p.color }}
                      >{p.name.slice(0, 1).toUpperCase()}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium">{p.name}</span>
                          {p.name === user && <span className="text-[10px] font-medium uppercase text-muted-foreground">you</span>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-success" : "bg-muted-foreground/40"}`} />
                          {online ? "online" : "away"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold tabular-nums">${spent.toFixed(2)}</div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              {activeParticipants.length} active · share code <span className="font-mono text-foreground">{code}</span>
            </p>
          </section>

          <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-soft)] ring-1 ring-border">
            <div className="mb-3 flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Activity</h2>
            </div>
            {state.activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ol className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {state.activity.map(a => (
                  <li key={a.id} className="text-sm">
                    <div className="text-foreground">{a.message}</div>
                    <div className="text-xs text-muted-foreground">{relativeTime(a.at)}</div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

function ThresholdEditor({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value.toString());
  useEffect(() => setV(value.toString()), [value]);
  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 font-display text-2xl font-bold text-foreground hover:text-primary"
      >
        ${value.toFixed(2)} <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    );
  }
  return (
    <form
      onSubmit={e => { e.preventDefault(); const n = parseFloat(v); if (!isNaN(n)) onChange(n); setEditing(false); }}
      className="flex items-center gap-1"
    >
      <span className="font-display text-2xl font-bold">$</span>
      <input
        autoFocus
        type="number"
        step="0.01"
        value={v}
        onChange={e => setV(e.target.value)}
        onBlur={() => { const n = parseFloat(v); if (!isNaN(n)) onChange(n); setEditing(false); }}
        className="w-24 rounded-md border border-input bg-background px-2 py-1 text-right font-display text-2xl font-bold outline-none focus:border-primary"
      />
    </form>
  );
}

function AddItemForm({ onAdd }: { onAdd: (i: { name: string; price: number; qty: number; note?: string }) => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const p = parseFloat(price);
    const q = parseInt(qty, 10);
    if (!trimmed || isNaN(p) || p < 0 || isNaN(q) || q < 1) return;
    onAdd({ name: trimmed, price: p, qty: q, note: note.trim() || undefined });
    setName(""); setPrice(""); setQty("1"); setNote("");
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[2fr_1fr_auto_auto]">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Item name (e.g. Oat milk)"
        className="rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 sm:col-span-1"
      />
      <input
        value={price}
        onChange={e => setPrice(e.target.value)}
        placeholder="Price"
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        className="rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
      />
      <input
        value={qty}
        onChange={e => setQty(e.target.value)}
        type="number"
        min="1"
        className="w-20 rounded-xl border border-input bg-background px-3 py-2.5 text-center outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
        aria-label="Quantity"
      />
      <button className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90">
        <Plus className="h-4 w-4" /> Add
      </button>
      <input
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Optional note (brand, size…)"
        className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 sm:col-span-4"
      />
    </form>
  );
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
}
