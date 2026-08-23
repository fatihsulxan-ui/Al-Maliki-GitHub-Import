import { Router } from "express";
import { store, adminOnly, isLangMap, isText, type Category } from "./store.js";
import { dbLoadCategories, dbSaveCategory, dbDeleteCategory, dbSeedCategories } from "../lib/db.js";
import { nanoid } from "nanoid";

const router = Router();

router.get("/categories", (_req, res) => {
  res.json([...store.categories].sort((a, b) => a.order - b.order));
});

router.post("/categories", adminOnly, async (req, res) => {
  const body = req.body as Partial<Category>;
  if (!isLangMap(body.name) || (body.id !== undefined && !isText(body.id, 80)) ||
      (body.order !== undefined && (!Number.isInteger(body.order) || body.order < 0))) {
    res.status(400).json({ error: "Invalid category" }); return;
  }
  const cat: Category = {
    id: body.id || nanoid(8),
    name: body.name || { en: "", am: "" },
    order: body.order ?? store.categories.length + 1,
  };
  store.categories.push(cat);
  await dbSaveCategory(cat);
  res.status(201).json(cat);
});

router.put("/categories/:id", adminOnly, async (req, res) => {
  const idx = store.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const body = req.body as Partial<Category>;
  if ((body.name !== undefined && !isLangMap(body.name)) ||
      (body.order !== undefined && (!Number.isInteger(body.order) || body.order < 0))) {
    res.status(400).json({ error: "Invalid category" }); return;
  }
  store.categories[idx] = { ...store.categories[idx], ...body, id: req.params.id };
  await dbSaveCategory(store.categories[idx]);
  res.json(store.categories[idx]);
});

router.patch("/categories/:id", adminOnly, async (req, res) => {
  const idx = store.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const body = req.body as Partial<Category>;
  if ((body.name !== undefined && !isLangMap(body.name)) ||
      (body.order !== undefined && (!Number.isInteger(body.order) || body.order < 0))) {
    res.status(400).json({ error: "Invalid category" }); return;
  }
  store.categories[idx] = { ...store.categories[idx], ...body, id: req.params.id };
  await dbSaveCategory(store.categories[idx]);
  res.json(store.categories[idx]);
});

router.delete("/categories/:id", adminOnly, async (req, res) => {
  const idx = store.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const [removed] = store.categories.splice(idx, 1);
  await dbDeleteCategory(removed.id);
  res.status(204).end();
});

export async function initCategories(initialData: Category[]) {
  try {
    const rows = await dbLoadCategories();
    if (rows.length > 0) {
      store.categories = rows;
      log(`Loaded ${rows.length} categories from Supabase`);
    } else {
      await dbSeedCategories(initialData);
      store.categories = [...initialData];
      log(`Seeded ${initialData.length} categories`);
    }
  } catch (e: any) {
    log(`Supabase not ready, using defaults: ${e.message}`);
  }
}

function log(msg: string) { process.stdout.write(`[categories] ${msg}\n`); }

export default router;
