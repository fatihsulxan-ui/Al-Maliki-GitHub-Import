import { supabase, hasSupabase } from "./supabase.js";
import type { MenuItem, Category, Table } from "../routes/store.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = () => supabase as any;

function log(msg: string) { process.stdout.write(`[db] ${msg}\n`); }

export async function dbLoadMenu(): Promise<MenuItem[]> {
  if (!hasSupabase) return [];
  const { data, error } = await sb().from("menu_items").select("*").order("sort_order");
  if (error) { log(`loadMenu error: ${error.message}`); return []; }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    price: r.price,
    category: r.category,
    image: r.image ?? "",
    hidden: r.hidden ?? false,
  }));
}

export async function dbSaveMenuItem(item: MenuItem, sortOrder: number): Promise<void> {
  if (!hasSupabase) return;
  await sb().from("menu_items").upsert({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    image: item.image,
    hidden: item.hidden,
    sort_order: sortOrder,
  }, { onConflict: "id" });
}

export async function dbDeleteMenuItem(id: string): Promise<void> {
  if (!hasSupabase) return;
  await sb().from("menu_items").delete().eq("id", id);
}

export async function dbSeedMenu(items: MenuItem[]): Promise<void> {
  if (!hasSupabase) return;
  const rows = items.map((item, i) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    image: item.image,
    hidden: item.hidden,
    sort_order: i,
  }));
  await sb().from("menu_items").upsert(rows, { onConflict: "id" });
}

export async function dbLoadCategories(): Promise<Category[]> {
  if (!hasSupabase) return [];
  const { data, error } = await sb().from("categories").select("*").order("order");
  if (error) { log(`loadCategories error: ${error.message}`); return []; }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    order: r.order,
  }));
}

export async function dbSaveCategory(cat: Category): Promise<void> {
  if (!hasSupabase) return;
  await sb().from("categories").upsert({
    id: cat.id,
    name: cat.name,
    order: cat.order,
  }, { onConflict: "id" });
}

export async function dbDeleteCategory(id: string): Promise<void> {
  if (!hasSupabase) return;
  await sb().from("categories").delete().eq("id", id);
}

export async function dbSeedCategories(cats: Category[]): Promise<void> {
  if (!hasSupabase) return;
  const rows = cats.map(c => ({ id: c.id, name: c.name, order: c.order }));
  await sb().from("categories").upsert(rows, { onConflict: "id" });
}

export async function dbLoadTables(): Promise<Table[]> {
  if (!hasSupabase) return [];
  const { data, error } = await sb().from("tables").select("*").order("number");
  if (error) { log(`loadTables error: ${error.message}`); return []; }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    number: r.number,
    location: r.location ?? "",
    status: r.status ?? "available",
    activeOrderCount: r.active_order_count ?? 0,
  }));
}

export async function dbSaveTable(table: Table): Promise<void> {
  if (!hasSupabase) return;
  await sb().from("tables").upsert({
    id: table.id,
    number: table.number,
    location: table.location,
    status: table.status,
    active_order_count: table.activeOrderCount,
  }, { onConflict: "id" });
}

export async function dbDeleteTable(id: string): Promise<void> {
  if (!hasSupabase) return;
  await sb().from("tables").delete().eq("id", id);
}

export async function dbGetSetting(key: string): Promise<string | null> {
  if (!hasSupabase) return null;
  const { data } = await sb().from("settings").select("value").eq("key", key).single();
  return (data as any)?.value ?? null;
}

export async function dbSetSetting(key: string, value: string): Promise<void> {
  if (!hasSupabase) return;
  await sb().from("settings").upsert({ key, value }, { onConflict: "key" });
}

export async function uploadImageToSupabase(buffer: Buffer, ext: string, folder: string): Promise<string> {
  if (!hasSupabase) throw new Error("Supabase not configured");
  const fileName = `${folder}/${Date.now()}${ext}`;
  const { error } = await sb().storage.from("menu-images").upload(fileName, buffer, {
    contentType: ext === ".png" ? "image/png" : "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  const { data } = sb().storage.from("menu-images").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadLogoToSupabase(buffer: Buffer, ext: string): Promise<string> {
  if (!hasSupabase) throw new Error("Supabase not configured");
  const fileName = `restaurant-logo${ext}`;
  const { error } = await sb().storage.from("logos").upload(fileName, buffer, {
    contentType: ext === ".png" ? "image/png" : "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb().storage.from("logos").getPublicUrl(fileName);
  return data.publicUrl;
}
