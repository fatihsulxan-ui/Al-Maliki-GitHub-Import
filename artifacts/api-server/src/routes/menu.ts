import { Router } from "express";
import { store, adminOnly, isLangMap, isText, validImageUrl, type MenuItem } from "./store.js";
import { dbLoadMenu, dbSaveMenuItem, dbDeleteMenuItem, dbSeedMenu } from "../lib/db.js";
import { nanoid } from "nanoid";

const router = Router();

router.get("/menu", (req, res) => {
  const showHidden = req.query["showHidden"] === "1";
  const items = showHidden ? store.menu : store.menu.filter(m => !m.hidden);
  res.json(items);
});

router.post("/menu", adminOnly, async (req, res) => {
  const body = req.body as Partial<MenuItem>;
  if (!isLangMap(body.name) || !isLangMap(body.description) || typeof body.price !== "number" ||
      !Number.isFinite(body.price) || body.price < 0 || body.price > 1_000_000 ||
      !isText(body.category, 80) || !validImageUrl(body.image ?? "")) {
    res.status(400).json({ error: "Invalid menu item" }); return;
  }
  const item: MenuItem = {
    id: body.id || nanoid(8),
    name: body.name || { en: "", am: "" },
    description: body.description || { en: "", am: "" },
    price: body.price || 0,
    category: body.category || "main",
    image: body.image || "",
    hidden: body.hidden || false,
  };
  store.menu.push(item);
  await dbSaveMenuItem(item, store.menu.length - 1);
  res.status(201).json(item);
});

router.put("/menu/:id", adminOnly, async (req, res) => {
  const idx = store.menu.findIndex(m => m.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const body = req.body as Partial<MenuItem>;
  if (body.name !== undefined && !isLangMap(body.name) ||
      body.description !== undefined && !isLangMap(body.description) ||
      body.price !== undefined && (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0 || body.price > 1_000_000) ||
      body.category !== undefined && !isText(body.category, 80) ||
      body.image !== undefined && !validImageUrl(body.image)) {
    res.status(400).json({ error: "Invalid menu item" }); return;
  }
  store.menu[idx] = { ...store.menu[idx], ...body, id: req.params.id };
  await dbSaveMenuItem(store.menu[idx], idx);
  res.json(store.menu[idx]);
});

router.patch("/menu/:id", adminOnly, async (req, res) => {
  const idx = store.menu.findIndex(m => m.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const body = req.body as Partial<MenuItem>;
  if (body.name !== undefined && !isLangMap(body.name) ||
      body.description !== undefined && !isLangMap(body.description) ||
      body.price !== undefined && (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0 || body.price > 1_000_000) ||
      body.category !== undefined && !isText(body.category, 80) ||
      body.image !== undefined && !validImageUrl(body.image)) {
    res.status(400).json({ error: "Invalid menu item" }); return;
  }
  store.menu[idx] = { ...store.menu[idx], ...body, id: req.params.id };
  await dbSaveMenuItem(store.menu[idx], idx);
  res.json(store.menu[idx]);
});

router.delete("/menu/:id", adminOnly, async (req, res) => {
  const idx = store.menu.findIndex(m => m.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const [removed] = store.menu.splice(idx, 1);
  await dbDeleteMenuItem(removed.id);
  res.status(204).end();
});

export async function initMenu(initialData: MenuItem[]) {
  try {
    const rows = await dbLoadMenu();
    if (rows.length > 0) {
      store.menu = rows;
      log(`Loaded ${rows.length} menu items from Supabase`);
    } else {
      await dbSeedMenu(initialData);
      store.menu = [...initialData];
      log(`Seeded ${initialData.length} initial menu items`);
    }
  } catch (e: any) {
    log(`Supabase not ready, using defaults: ${e.message}`);
  }
}

function log(msg: string) { process.stdout.write(`[menu] ${msg}\n`); }

export default router;
