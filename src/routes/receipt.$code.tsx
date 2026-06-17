import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { loadRoom, totals, type RoomState } from "@/lib/cartshare/store";

export const Route = createFileRoute("/receipt/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Receipt — Room ${params.code} — CartShare` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { code } = Route.useParams();
  const [state, setState] = useState<RoomState | null>(null);

  useEffect(() => { setState(loadRoom(code)); }, [code]);

  if (!state) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <p className="text-muted-foreground">Loading receipt…</p>
      </main>
    );
  }

  const t = totals(state);
  const sharedShipping = t.subtotal >= state.freeShippingThreshold ? 0 : 5.99;
  const perPersonShipping = state.participants.length > 0 ? sharedShipping / state.participants.length : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link
          to="/room/$code"
          params={{ code }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to cart
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90"
        >
          <Printer className="h-4 w-4" /> Print receipt
        </button>
      </div>

      <article className="print-container rounded-3xl bg-card p-8 shadow-[var(--shadow-soft)] ring-1 ring-border sm:p-12">
        <header className="border-b border-border pb-6">
          <div className="flex items-baseline justify-between">
            <h1 className="font-display text-3xl font-bold">CartShare Receipt</h1>
            <span className="font-mono text-sm text-muted-foreground">#{code}</span>
          </div>
          <p className="mt-1 text-muted-foreground">{state.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Generated {new Date().toLocaleString()} · Created {new Date(state.createdAt).toLocaleDateString()}
          </p>
        </header>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Items</h2>
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2">Item</th>
                <th className="py-2">Added by</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map(item => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-2.5">
                    <div className="font-medium">{item.name}</div>
                    {item.note && <div className="text-xs text-muted-foreground">{item.note}</div>}
                  </td>
                  <td className="py-2.5 text-muted-foreground">{item.addedBy}</td>
                  <td className="py-2.5 text-right tabular-nums">{item.qty}</td>
                  <td className="py-2.5 text-right tabular-nums">${item.price.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-semibold tabular-nums">${(item.price * item.qty).toFixed(2)}</td>
                </tr>
              ))}
              {state.items.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No items.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Split by person</h2>
            <ul className="space-y-2 text-sm">
              {state.participants.map(p => {
                const items = t.byPerson.get(p.name) ?? 0;
                const total = items + perPersonShipping;
                return (
                  <li key={p.name} className="flex items-baseline justify-between border-b border-border/40 py-1.5">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      {perPersonShipping > 0 && <div className="text-xs text-muted-foreground">items ${items.toFixed(2)} + shipping ${perPersonShipping.toFixed(2)}</div>}
                    </div>
                    <div className="font-semibold tabular-nums">${total.toFixed(2)}</div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Totals</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">${t.subtotal.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="tabular-nums">{sharedShipping === 0 ? "FREE" : `$${sharedShipping.toFixed(2)}`}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Free-shipping threshold</dt><dd className="tabular-nums">${state.freeShippingThreshold.toFixed(2)}</dd></div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold">
                <dt>Grand total</dt><dd className="tabular-nums">${(t.subtotal + sharedShipping).toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <footer className="mt-10 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Generated by CartShare · cartshare.app
        </footer>
      </article>
    </main>
  );
}
