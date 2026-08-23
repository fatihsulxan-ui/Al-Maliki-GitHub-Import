import { Router } from "express";
import { store, authMiddleware } from "./store.js";

const router = Router();

router.get("/waiter-calls", authMiddleware, (_req, res) => {
  const calls = Array.from(store.waiterCalls.values())
    .sort((a, b) => a.lastCalledAt - b.lastCalledAt);
  res.json(calls);
});

router.post("/waiter-call", (req, res) => {
  const { tableId } = req.body as { tableId?: string };
  if (!tableId) { res.status(400).json({ error: "Missing tableId" }); return; }

  const existing = store.waiterCalls.get(tableId);
  if (existing) {
    existing.count += 1;
    existing.lastCalledAt = Date.now();
  } else {
    store.waiterCalls.set(tableId, { tableId, count: 1, lastCalledAt: Date.now() });
  }
  res.json({ ok: true });
});

router.delete("/waiter-calls/:tableId", authMiddleware, (req, res) => {
  store.waiterCalls.delete(req.params.tableId);
  res.status(204).end();
});

export default router;
