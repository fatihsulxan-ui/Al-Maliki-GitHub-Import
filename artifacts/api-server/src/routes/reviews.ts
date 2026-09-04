import { Router } from "express";
import { store, authMiddleware } from "./store.js";
import { dbDeleteReview, dbLoadReviews } from "../lib/db.js";

const router = Router();

router.get("/reviews", authMiddleware, (_req, res) => {
  const reviews = [...store.reviews].sort((a, b) => b.createdAt - a.createdAt);
  res.json(reviews);
});

router.delete("/reviews/:id", authMiddleware, async (req, res) => {
  const idx = store.reviews.findIndex(r => r.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Review not found" }); return; }
  await dbDeleteReview(req.params.id);
  store.reviews.splice(idx, 1);
  res.status(204).end();
});

export async function initReviews() {
  try {
    const rows = await dbLoadReviews();
    store.reviews = rows;
    process.stdout.write(`[reviews] Loaded ${rows.length} reviews from Supabase\n`);
  } catch (error) {
    process.stdout.write(`[reviews] Supabase not ready, starting empty: ${String(error)}\n`);
  }
}

export default router;
