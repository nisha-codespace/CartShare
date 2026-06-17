import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Users, Activity, Printer, Sparkles } from "lucide-react";
import {
  createRoom,
  generateRoomCode,
  getUserName,
  loadRoom,
  setUserName,
} from "@/lib/cartshare/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CartShare — Collaborative shopping carts for groups" },
      { name: "description", content: "Plan group orders together in real time. Hit free-shipping thresholds, split fairly, and print a clean receipt." },
      { property: "og:title", content: "CartShare — Collaborative shopping carts" },
      { property: "og:description", content: "Plan group orders together in real time. Hit free-shipping thresholds, split fairly, and print a clean receipt." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"join" | "create">("join");

  useEffect(() => {
    const u = getUserName();
    if (u) setName(u);
  }, []);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedName) return setError("Enter your name first");
    if (trimmedCode.length < 4) return setError("Room codes are at least 4 characters");
    const existing = loadRoom(trimmedCode);
    if (!existing) return setError(`No room found with code "${trimmedCode}". Create one instead?`);
    setUserName(trimmedName);
    navigate({ to: "/room/$code", params: { code: trimmedCode } });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) return setError("Enter your name first");
    const finalRoomName = roomName.trim() || "Group order";
    const newCode = generateRoomCode();
    createRoom(newCode, finalRoomName);
    setUserName(trimmedName);
    navigate({ to: "/room/$code", params: { code: newCode } });
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">CartShare</span>
          </div>
          <span className="hidden text-sm text-muted-foreground sm:inline">Built for dorms, teams &amp; travel crews</span>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <section>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Real-time across every tab
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-6xl">
              Shop together,<br />
              <span className="text-primary">split fairly,</span>
              <br />never miss free shipping.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              CartShare turns chaotic group orders into a single shared cart. Add items, watch the total
              climb past the free-shipping line, and print a clean receipt when you check out.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Users, label: "Shared rooms" },
                { icon: Activity, label: "Live activity log" },
                { icon: Printer, label: "Printable receipt" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 rounded-xl bg-card/70 px-3 py-2 text-sm shadow-[var(--shadow-soft)] ring-1 ring-border">
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-pop)] ring-1 ring-border sm:p-8">
            <div className="flex rounded-full bg-muted p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => { setMode("join"); setError(null); }}
                className={`flex-1 rounded-full px-4 py-2 transition ${mode === "join" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Join a room
              </button>
              <button
                type="button"
                onClick={() => { setMode("create"); setError(null); }}
                className={`flex-1 rounded-full px-4 py-2 transition ${mode === "create" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Create a room
              </button>
            </div>

            <form onSubmit={mode === "join" ? handleJoin : handleCreate} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Your name</span>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Priya"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none ring-ring/30 transition focus:border-primary focus:ring-2"
                />
              </label>

              {mode === "join" ? (
                <label className="block">
                  <span className="text-sm font-medium">Room code</span>
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. K7P2QX"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base font-mono tracking-[0.3em] outline-none ring-ring/30 transition focus:border-primary focus:ring-2"
                    maxLength={8}
                  />
                </label>
              ) : (
                <label className="block">
                  <span className="text-sm font-medium">Room name (optional)</span>
                  <input
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    placeholder="e.g. Flat 3B Weekly Groceries"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none ring-ring/30 transition focus:border-primary focus:ring-2"
                  />
                </label>
              )}

              {error && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90 active:translate-y-px"
              >
                {mode === "join" ? "Join room" : "Create room"}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Tip: open the room URL in another tab to simulate a second person.
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
