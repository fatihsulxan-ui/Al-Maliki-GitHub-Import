import { Router } from "express";
import { store, authMiddleware } from "./store.js";
import { saveReviews } from "../lib/persist.js";

const router = Router();

router.get("/reviews", authMiddleware, (_req, res) => {
  const reviews = [...store.reviews].sort((a, b) => b.createdAt - a.createdAt);
  res.json(reviews);
});

router.delete("/reviews/:id", authMiddleware, (req, res) => {
  const idx = store.reviews.findIndex(r => r.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Review not found" }); return; }
  store.reviews.splice(idx, 1);
  saveReviews(store.reviews);
  res.status(204).end();
});

export default router;
