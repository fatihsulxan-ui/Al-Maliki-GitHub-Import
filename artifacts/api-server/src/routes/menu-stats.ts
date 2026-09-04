import { Router } from "express";
import { store } from "./store.js";
import { dbLoadMenuClicks, dbSaveMenuClick } from "../lib/db.js";

const router = Router();

router.post("/menu-stats/click/:itemId", async (req, res) => {
  const { itemId } = req.params;
  const clicks = (store.menuClicks.get(itemId) ?? 0) + 1;
  await dbSaveMenuClick(itemId, clicks);
  store.menuClicks.set(itemId, clicks);
  res.json({ ok: true });
});

router.get("/menu-stats/popular", (_req, res) => {
  const menuMap = new Map(store.menu.map(m => [m.id, m]));
  const limit = Math.min(Number((_req.query as { limit?: string }).limit) || 10, 50);
  const result = Array.from(store.menuClicks.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([itemId, clicks]) => {
      const item = menuMap.get(itemId);
      return {
        id: itemId,
        clicks,
        name: item?.name ?? { en: itemId, am: itemId },
        price: item?.price ?? 0,
        image: item?.image ?? "",
      };
    });
  res.json(result);
});

export async function initMenuStats() {
  try {
    const rows = await dbLoadMenuClicks();
    store.menuClicks = new Map(rows.map(row => [row.itemId, row.clicks]));
    process.stdout.write(`[menu-stats] Loaded ${rows.length} click counters from Supabase\n`);
  } catch (error) {
    process.stdout.write(`[menu-stats] Supabase not ready, starting empty: ${String(error)}\n`);
  }
}

export default router;
