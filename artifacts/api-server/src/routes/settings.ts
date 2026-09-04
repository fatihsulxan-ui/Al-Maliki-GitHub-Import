import { Router } from "express";
import { store, adminOnly, isText, validImageUrl } from "./store.js";
import { dbSetSetting } from "../lib/db.js";

const router = Router();

router.get("/settings", adminOnly, (_req, res) => {
  res.json({
    restaurantName: store.settings.restaurantName,
    logo: store.settings.logo,
  });
});

router.patch("/settings", adminOnly, async (req, res) => {
  const body = req.body as Partial<{
    restaurantName: string;
    logo: string | null;
  }>;
  if (body.restaurantName !== undefined && !isText(body.restaurantName, 120) ||
      body.logo !== undefined && body.logo !== null && !validImageUrl(body.logo) ||
      false) {
    res.status(400).json({ error: "Invalid settings" }); return;
  }

  if (body.restaurantName !== undefined) {
    store.settings.restaurantName = body.restaurantName;
    await dbSetSetting("restaurant_name", body.restaurantName);
  }

  if (body.logo !== undefined) {
    store.settings.logo = body.logo;
    await dbSetSetting("logo", body.logo ?? "");
  }

  res.json({
    restaurantName: store.settings.restaurantName,
    logo: store.settings.logo,
  });
});

export async function initSettings() {
  try {
    const { dbGetSetting } = await import("../lib/db.js");
    const logo = await dbGetSetting("logo");
    const name = await dbGetSetting("restaurant_name");
    if (logo) store.settings.logo = logo;
    if (name) store.settings.restaurantName = name;
    process.stdout.write(`[settings] Loaded from Supabase: logo=${!!logo}, name=${name}\n`);
  } catch {
    process.stdout.write(`[settings] Supabase not ready, using defaults\n`);
  }
}

export default router;
