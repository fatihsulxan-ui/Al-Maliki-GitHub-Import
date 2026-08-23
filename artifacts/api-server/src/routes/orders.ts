import { Router } from "express";
import { store, authMiddleware, isText } from "./store.js";
import type { Order, OrderItem, OrderStatus, Review } from "./store.js";
import { saveReviews } from "../lib/persist.js";

const router = Router();

router.get("/orders", authMiddleware, (_req, res) => {
  const orders = Array.from(store.orders.values())
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(orders);
});

router.post("/orders", (req, res) => {
  const { tableId, tableNumber, items, note, rating, mood, isReviewOnly } = req.body as {
    tableId: string;
    tableNumber: number;
    items: OrderItem[];
    note?: string;
    rating?: number;
    mood?: string;
    isReviewOnly?: boolean;
  };

  if (isReviewOnly) {
    if (!isText(tableId, 80) || (note !== undefined && typeof note !== "string") ||
        (rating !== undefined && (!Number.isInteger(rating) || rating < 0 || rating > 5)) ||
        (mood !== undefined && (typeof mood !== "string" || mood.length > 80))) {
      res.status(400).json({ error: "Invalid review" }); return;
    }
    const review: Review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tableId: tableId || "unknown",
      tableNumber: tableNumber ?? 0,
      mood: mood ?? null,
      stars: rating ?? 0,
      comment: note ?? "",
      createdAt: Date.now(),
    };
    store.reviews.push(review);
    saveReviews(store.reviews);
    res.status(201).json(review);
    return;
  }

  if (!isText(tableId, 80) || !Array.isArray(items) || items.length < 1 || items.length > 100) {
    res.status(400).json({ error: "Missing tableId or items" });
    return;
  }
  if (items.some(item => !item || !isText(item.menuItemId, 80) || !isText(item.name?.en, 200) ||
      !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100)) {
    res.status(400).json({ error: "Invalid order items" }); return;
  }
  const id = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const order: Order = {
    id,
    tableId,
    tableNumber: tableNumber ?? 0,
    items,
    status: "pending",
    createdAt: Date.now(),
    note: typeof note === "string" ? note.slice(0, 1000) : undefined,
  };
  store.orders.set(id, order);
  res.status(201).json(order);
});

router.patch("/orders/:id/status", authMiddleware, (req, res) => {
  const order = store.orders.get(req.params.id);
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  const { status } = req.body as { status: OrderStatus };
  const valid: OrderStatus[] = ["pending", "preparing", "ready", "delivered", "cancelled"];
  if (!valid.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
  order.status = status;
  if (status === "delivered" || status === "cancelled") {
    setTimeout(() => store.orders.delete(order.id), 5 * 60_000);
  }
  res.json(order);
});

router.delete("/orders/:id", authMiddleware, (req, res) => {
  store.orders.delete(req.params.id);
  res.status(204).end();
});

export default router;
