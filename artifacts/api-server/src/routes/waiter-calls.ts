import { Router } from "express";
import { store, authMiddleware } from "./store.js";
import {
  dbDeleteWaiterCall,
  dbLoadWaiterCalls,
  dbSaveWaiterCall,
} from "../lib/db.js";

const router = Router();

router.get("/waiter-calls", authMiddleware, (_req, res) => {
  const calls = Array.from(store.waiterCalls.values())
    .sort((a, b) => a.lastCalledAt - b.lastCalledAt);
  res.json(calls);
});

router.post("/waiter-call", async (req, res) => {
  const { tableId } = req.body as { tableId?: string };
  if (!tableId) { res.status(400).json({ error: "Missing tableId" }); return; }

  const existing = store.waiterCalls.get(tableId);
  const call = existing
    ? { ...existing, count: existing.count + 1, lastCalledAt: Date.now() }
    : { tableId, count: 1, lastCalledAt: Date.now() };
  await dbSaveWaiterCall(call);
  if (existing) {
    Object.assign(existing, call);
  } else {
    store.waiterCalls.set(tableId, call);
  }
  res.json({ ok: true });
});

router.delete("/waiter-calls/:tableId", authMiddleware, async (req, res) => {
  await dbDeleteWaiterCall(req.params.tableId);
  store.waiterCalls.delete(req.params.tableId);
  res.status(204).end();
});

export async function initWaiterCalls() {
  try {
    const rows = await dbLoadWaiterCalls();
    store.waiterCalls = new Map(rows.map(call => [call.tableId, call]));
    process.stdout.write(`[waiter-calls] Loaded ${rows.length} calls from Supabase\n`);
  } catch (error) {
    process.stdout.write(`[waiter-calls] Supabase not ready, starting empty: ${String(error)}\n`);
  }
}

export default router;
