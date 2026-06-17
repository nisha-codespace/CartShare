import { useCallback, useEffect, useRef, useState } from "react";
import {
  type RoomState,
  type CartItem,
  loadRoom,
  saveRoom,
  getChannel,
  broadcast,
  pushActivity,
  colorFor,
} from "./store";

export function useRoom(code: string, userName: string | null) {
  const [state, setState] = useState<RoomState | null>(() => loadRoom(code));
  const stateRef = useRef(state);
  stateRef.current = state;

  // Subscribe to cross-tab changes
  useEffect(() => {
    const refresh = () => setState(loadRoom(code));
    refresh();
    const ch = getChannel(code);
    const onMsg = () => refresh();
    ch?.addEventListener("message", onMsg);
    const onStorage = (e: StorageEvent) => {
      if (e.key === `cartshare:room:${code}`) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      ch?.removeEventListener("message", onMsg);
      window.removeEventListener("storage", onStorage);
    };
  }, [code]);

  const commit = useCallback((next: RoomState) => {
    saveRoom(next);
    setState(next);
    broadcast(code);
  }, [code]);

  // Mark presence
  useEffect(() => {
    if (!userName || !stateRef.current) return;
    const cur = stateRef.current;
    const existing = cur.participants.find(p => p.name === userName);
    const now = Date.now();
    let next: RoomState;
    if (existing) {
      next = {
        ...cur,
        participants: cur.participants.map(p => p.name === userName ? { ...p, lastSeen: now } : p),
      };
    } else {
      next = {
        ...cur,
        participants: [
          ...cur.participants,
          { name: userName, joinedAt: now, lastSeen: now, color: colorFor(userName, cur.participants) },
        ],
      };
      next = pushActivity(next, { who: userName, kind: "join", message: `${userName} joined the room` });
    }
    commit(next);
    const heartbeat = setInterval(() => {
      const s = stateRef.current;
      if (!s) return;
      commit({
        ...s,
        participants: s.participants.map(p => p.name === userName ? { ...p, lastSeen: Date.now() } : p),
      });
    }, 15000);
    return () => clearInterval(heartbeat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName, code]);

  const addItem = useCallback((input: Omit<CartItem, "id" | "addedAt" | "addedBy">, who: string) => {
    const s = stateRef.current; if (!s) return;
    const item: CartItem = { ...input, id: crypto.randomUUID(), addedAt: Date.now(), addedBy: who };
    const next = pushActivity(
      { ...s, items: [item, ...s.items] },
      { who, kind: "add", message: `${who} added ${item.qty}× ${item.name}` },
    );
    commit(next);
  }, [commit]);

  const removeItem = useCallback((id: string, who: string) => {
    const s = stateRef.current; if (!s) return;
    const item = s.items.find(i => i.id === id);
    if (!item) return;
    const next = pushActivity(
      { ...s, items: s.items.filter(i => i.id !== id) },
      { who, kind: "remove", message: `${who} removed ${item.name}` },
    );
    commit(next);
  }, [commit]);

  const updateQty = useCallback((id: string, qty: number, who: string) => {
    const s = stateRef.current; if (!s) return;
    if (qty < 1) return;
    const item = s.items.find(i => i.id === id);
    if (!item) return;
    const next = pushActivity(
      { ...s, items: s.items.map(i => i.id === id ? { ...i, qty } : i) },
      { who, kind: "update", message: `${who} set ${item.name} to ${qty}×` },
    );
    commit(next);
  }, [commit]);

  const clearCart = useCallback((who: string) => {
    const s = stateRef.current; if (!s) return;
    const next = pushActivity({ ...s, items: [] }, { who, kind: "clear", message: `${who} cleared the cart` });
    commit(next);
  }, [commit]);

  const setThreshold = useCallback((threshold: number) => {
    const s = stateRef.current; if (!s) return;
    commit({ ...s, freeShippingThreshold: Math.max(0, threshold) });
  }, [commit]);

  return { state, addItem, removeItem, updateQty, clearCart, setThreshold };
}
