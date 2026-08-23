import { Router } from "express";
import { store, adminOnly, isText, type Table } from "./store.js";
import { dbLoadTables, dbSaveTable, dbDeleteTable } from "../lib/db.js";
import { nanoid } from "nanoid";

const router = Router();

router.get("/tables", (_req, res) => {
  res.json(store.tables);
});

router.post("/tables", adminOnly, async (req, res) => {
  const body = req.body as Partial<Table> & { number?: number; location?: string };
  if ((body.number !== undefined && (!Number.isInteger(body.number) || body.number < 1 || body.number > 10_000)) ||
      (body.location !== undefined && (typeof body.location !== "string" || body.location.length > 120))) {
    res.status(400).json({ error: "Invalid table" }); return;
  }
  const table: Table = {
    id: nanoid(8),
    number: body.number ?? store.tables.length + 1,
    location: body.location || "",
    status: body.status || "available",
    activeOrderCount: 0,
  };
  store.tables.push(table);
  await dbSaveTable(table);
  res.status(201).json(table);
});

router.put("/tables/:id", adminOnly, async (req, res) => {
  const idx = store.tables.findIndex(t => t.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const body = req.body as Partial<Table>;
  if ((body.number !== undefined && (!Number.isInteger(body.number) || body.number < 1 || body.number > 10_000)) ||
      (body.location !== undefined && (typeof body.location !== "string" || body.location.length > 120)) ||
      (body.status !== undefined && !["available", "occupied", "reserved"].includes(body.status))) {
    res.status(400).json({ error: "Invalid table" }); return;
  }
  store.tables[idx] = { ...store.tables[idx], ...body, id: req.params.id };
  await dbSaveTable(store.tables[idx]);
  res.json(store.tables[idx]);
});

router.patch("/tables/:id", adminOnly, async (req, res) => {
  const idx = store.tables.findIndex(t => t.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const body = req.body as Partial<Table>;
  if ((body.number !== undefined && (!Number.isInteger(body.number) || body.number < 1 || body.number > 10_000)) ||
      (body.location !== undefined && (typeof body.location !== "string" || body.location.length > 120)) ||
      (body.status !== undefined && !["available", "occupied", "reserved"].includes(body.status))) {
    res.status(400).json({ error: "Invalid table" }); return;
  }
  store.tables[idx] = { ...store.tables[idx], ...body, id: req.params.id };
  await dbSaveTable(store.tables[idx]);
  res.json(store.tables[idx]);
});

router.delete("/tables/:id", adminOnly, async (req, res) => {
  const idx = store.tables.findIndex(t => t.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  store.tables.splice(idx, 1);
  await dbDeleteTable(req.params.id);
  res.status(204).end();
});

export async function initTables() {
  try {
    const rows = await dbLoadTables();
    store.tables = rows;
    log(`Loaded ${rows.length} tables from Supabase`);
  } catch {
    log("Supabase tables not ready, starting empty");
  }
}

function log(msg: string) {
  process.stdout.write(`[tables] ${msg}\n`);
}

export default router;
