import { supabase, hasSupabase } from "./supabase.js";
import { ReplitConnectors } from "@replit/connectors-sdk";
import type {
  MenuItem,
  Category,
  Table,
  Order,
  WaiterCall,
  Review,
} from "../routes/store.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = () => supabase as any;

function requireSupabase(operation: string) {
  if (!hasSupabase) throw new Error(`${operation}: Supabase connection is unavailable`);
}

function ensureNoError(error: { message: string } | null, operation: string) {
  if (error) throw new Error(`${operation}: ${error.message}`);
}

export async function dbLoadMenu(): Promise<MenuItem[]> {
  requireSupabase("loadMenu");
  const { data, error } = await sb().from("menu_items").select("*").order("sort_order");
  ensureNoError(error, "loadMenu");
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
  requireSupabase("saveMenuItem");
  const { error } = await sb().from("menu_items").upsert({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    image: item.image,
    hidden: item.hidden,
    sort_order: sortOrder,
  });
  ensureNoError(error, "saveMenuItem");
}

export async function dbDeleteMenuItem(id: string): Promise<void> {
  requireSupabase("deleteMenuItem");
  const { error } = await sb().from("menu_items").delete().eq("id", id);
  ensureNoError(error, "deleteMenuItem");
}

export async function dbSeedMenu(items: MenuItem[]): Promise<void> {
  requireSupabase("seedMenu");
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
  const { error } = await sb().from("menu_items").upsert(rows);
  ensureNoError(error, "seedMenu");
}

export async function dbLoadCategories(): Promise<Category[]> {
  requireSupabase("loadCategories");
  const { data, error } = await sb().from("categories").select("*").order("order");
  ensureNoError(error, "loadCategories");
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    order: r.order,
  }));
}

export async function dbSaveCategory(cat: Category): Promise<void> {
  requireSupabase("saveCategory");
  const { error } = await sb().from("categories").upsert({
    id: cat.id,
    name: cat.name,
    order: cat.order,
  });
  ensureNoError(error, "saveCategory");
}

export async function dbDeleteCategory(id: string): Promise<void> {
  requireSupabase("deleteCategory");
  const { error } = await sb().from("categories").delete().eq("id", id);
  ensureNoError(error, "deleteCategory");
}

export async function dbSeedCategories(cats: Category[]): Promise<void> {
  requireSupabase("seedCategories");
  const rows = cats.map(c => ({ id: c.id, name: c.name, order: c.order }));
  const { error } = await sb().from("categories").upsert(rows);
  ensureNoError(error, "seedCategories");
}

export async function dbLoadTables(): Promise<Table[]> {
  requireSupabase("loadTables");
  const { data, error } = await sb().from("tables").select("*").order("number");
  ensureNoError(error, "loadTables");
  return (data ?? []).map((r: any) => ({
    id: r.id,
    number: r.number,
    location: r.location ?? "",
    status: r.status ?? "available",
    activeOrderCount: r.active_order_count ?? 0,
  }));
}

export async function dbGetTable(tableId: string): Promise<Table | null> {
  requireSupabase("getTable");
  const { data, error } = await sb().from("tables").select("*").eq("id", tableId);
  ensureNoError(error, "getTable");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    id: row.id,
    number: row.number,
    location: row.location ?? "",
    status: row.status ?? "available",
    activeOrderCount: row.active_order_count ?? 0,
  };
}

export async function dbSaveTable(table: Table): Promise<void> {
  requireSupabase("saveTable");
  const { error } = await sb().from("tables").upsert({
    id: table.id,
    number: table.number,
    location: table.location,
    status: table.status,
    active_order_count: table.activeOrderCount,
  });
  ensureNoError(error, "saveTable");
}

export async function dbDeleteTable(id: string): Promise<void> {
  requireSupabase("deleteTable");
  const { error } = await sb().from("tables").delete().eq("id", id);
  ensureNoError(error, "deleteTable");
}

export async function dbGetSetting(key: string): Promise<string | null> {
  requireSupabase("getSetting");
  const { data, error } = await sb().from("settings").select("value").eq("key", key);
  ensureNoError(error, "getSetting");
  const row = Array.isArray(data) ? data[0] : data;
  return (row as any)?.value ?? null;
}

export async function dbSetSetting(key: string, value: string): Promise<void> {
  requireSupabase("setSetting");
  const { error } = await sb().from("settings").upsert({ key, value });
  ensureNoError(error, "setSetting");
}

export async function dbLoadOrders(): Promise<Order[]> {
  requireSupabase("loadOrders");
  const { data, error } = await sb().from("orders").select("*").order("created_at", { ascending: false });
  ensureNoError(error, "loadOrders");
  return (data ?? []).map((row: any) => ({
    id: row.id,
    tableId: row.table_id,
    tableNumber: row.table_number ?? 0,
    items: row.items ?? [],
    status: row.status,
    createdAt: Number(row.created_at),
    ...(row.note ? { note: row.note } : {}),
  })) as Order[];
}

export async function dbSaveOrder(order: Order): Promise<void> {
  requireSupabase("saveOrder");
  const { error } = await sb().from("orders").upsert({
    id: order.id,
    table_id: order.tableId,
    table_number: order.tableNumber,
    items: order.items,
    status: order.status,
    note: order.note ?? null,
    created_at: order.createdAt,
  });
  ensureNoError(error, "saveOrder");
}

export async function dbDeleteOrder(id: string): Promise<void> {
  requireSupabase("deleteOrder");
  const { error } = await sb().from("orders").delete().eq("id", id);
  ensureNoError(error, "deleteOrder");
}

export async function dbLoadWaiterCalls(): Promise<WaiterCall[]> {
  requireSupabase("loadWaiterCalls");
  const { data, error } = await sb().from("waiter_calls").select("*").order("last_called_at");
  ensureNoError(error, "loadWaiterCalls");
  return (data ?? []).map((row: any) => ({
    tableId: row.table_id,
    count: row.count ?? 1,
    lastCalledAt: Number(row.last_called_at),
  })) as WaiterCall[];
}

export async function dbSaveWaiterCall(call: WaiterCall): Promise<void> {
  requireSupabase("saveWaiterCall");
  const { error } = await sb().from("waiter_calls").upsert({
    table_id: call.tableId,
    count: call.count,
    last_called_at: call.lastCalledAt,
  });
  ensureNoError(error, "saveWaiterCall");
}

export async function dbIncrementWaiterCall(tableId: string): Promise<void> {
  requireSupabase("incrementWaiterCall");
  const { error } = await sb().rpc("increment_waiter_call", { p_table_id: tableId });
  ensureNoError(error, "incrementWaiterCall");
}

export async function dbDeleteWaiterCall(tableId: string): Promise<void> {
  requireSupabase("deleteWaiterCall");
  const { error } = await sb().from("waiter_calls").delete().eq("table_id", tableId);
  ensureNoError(error, "deleteWaiterCall");
}

export async function dbLoadReviews(): Promise<Review[]> {
  requireSupabase("loadReviews");
  const { data, error } = await sb().from("reviews").select("*").order("created_at", { ascending: false });
  ensureNoError(error, "loadReviews");
  return (data ?? []).map((row: any) => ({
    id: row.id,
    tableId: row.table_id,
    tableNumber: row.table_number ?? 0,
    mood: row.mood ?? null,
    stars: row.stars ?? 0,
    comment: row.comment ?? "",
    createdAt: Number(row.created_at),
  })) as Review[];
}

export async function dbSaveReview(review: Review): Promise<void> {
  requireSupabase("saveReview");
  const { error } = await sb().from("reviews").upsert({
    id: review.id,
    table_id: review.tableId,
    table_number: review.tableNumber,
    mood: review.mood,
    stars: review.stars,
    comment: review.comment,
    created_at: review.createdAt,
  });
  ensureNoError(error, "saveReview");
}

export async function dbDeleteReview(id: string): Promise<void> {
  requireSupabase("deleteReview");
  const { error } = await sb().from("reviews").delete().eq("id", id);
  ensureNoError(error, "deleteReview");
}

export async function dbSeedReviews(reviews: Review[]): Promise<void> {
  for (const review of reviews) await dbSaveReview(review);
}

export async function dbGetMenuClick(itemId: string): Promise<number> {
  requireSupabase("getMenuClick");
  const { data, error } = await sb().from("menu_clicks").select("clicks").eq("item_id", itemId);
  ensureNoError(error, "getMenuClick");
  const row = Array.isArray(data) ? data[0] : data;
  return Number((row as any)?.clicks ?? 0);
}

export async function dbSaveMenuClick(itemId: string, clicks: number): Promise<void> {
  requireSupabase("saveMenuClick");
  const { error } = await sb().from("menu_clicks").upsert({ item_id: itemId, clicks });
  ensureNoError(error, "saveMenuClick");
}

export async function dbLoadMenuClicks(): Promise<Array<{ itemId: string; clicks: number }>> {
  requireSupabase("loadMenuClicks");
  const { data, error } = await sb().from("menu_clicks").select("*");
  ensureNoError(error, "loadMenuClicks");
  return (data ?? []).map((row: any) => ({ itemId: row.item_id, clicks: row.clicks ?? 0 }));
}

export async function dbIncrementMenuClick(itemId: string): Promise<void> {
  requireSupabase("incrementMenuClick");
  const { error } = await sb().rpc("increment_menu_click", { p_item_id: itemId });
  ensureNoError(error, "incrementMenuClick");
}

export async function dbReorderCategories(ids: string[]): Promise<void> {
  requireSupabase("reorderCategories");
  const { error } = await sb().rpc("reorder_categories", { p_ids: ids });
  ensureNoError(error, "reorderCategories");
}

export async function dbConsumeRateLimit(key: string, limit: number): Promise<boolean> {
  requireSupabase("consumeRateLimit");
  const { data, error } = await sb().rpc("consume_public_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_now: Date.now(),
    p_window_ms: 60_000,
  });
  ensureNoError(error, "consumeRateLimit");
  return data === true;
}

export async function downloadStorageObject(bucket: string, objectPath: string): Promise<Response> {
  return new ReplitConnectors().proxy("supabase", `/object/${bucket}/${objectPath}`, { method: "GET" });
}

export async function uploadImageToSupabase(buffer: Buffer, ext: string, folder: string): Promise<string> {
  if (!hasSupabase) throw new Error("Supabase not configured");
  const fileName = `${folder}/${Date.now()}${ext}`;
  const { error } = await sb().storage.from("menu-images").upload(fileName, buffer, {
    contentType: ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg",
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
    contentType: ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb().storage.from("logos").getPublicUrl(fileName);
  return data.publicUrl;
}
