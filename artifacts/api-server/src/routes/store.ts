import { INITIAL_CATEGORIES, INITIAL_MENU } from "./data/initial-data.js";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export interface LangMap { en: string; am: string; om?: string; }
export interface MenuItem { id: string; name: LangMap; description: LangMap; price: number; category: string; image: string; hidden: boolean; }
export interface Category { id: string; name: LangMap; order: number; }
export interface Table { id: string; number: number; location: string; status: string; activeOrderCount: number; }
export interface WaiterCall { tableId: string; count: number; lastCalledAt: number; }
export interface Settings { restaurantName: string; logo: string | null; adminPin: string; waiterPin: string; }
export interface OrderItem { menuItemId: string; name: LangMap; price: number; quantity: number; }
export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";
export interface Order { id: string; tableId: string; tableNumber: number; items: OrderItem[]; status: OrderStatus; createdAt: number; note?: string; }
export interface Review { id: string; tableId: string; tableNumber: number; mood: string | null; stars: number; comment: string; createdAt: number; }

export const store = {
  menu: [...INITIAL_MENU] as MenuItem[],
  categories: [...INITIAL_CATEGORIES] as Category[],
  tables: [] as Table[],
  waiterCalls: new Map<string, WaiterCall>(),
  orders: new Map<string, Order>(),
  menuClicks: new Map<string, number>(),
  reviews: [] as Review[],
  settings: {
    restaurantName: "ARAB ALI HOTEL",
    logo: null,
    adminPin: process.env["ADMIN_PIN"] || (process.env["NODE_ENV"] === "production" ? "" : "1234"),
    waiterPin: process.env["WAITER_PIN"] || (process.env["NODE_ENV"] === "production" ? "" : "1234"),
  } as Settings,
};

export function isText(value: unknown, max = 500): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

export function isLangMap(value: unknown): value is LangMap {
  return !!value && typeof value === "object" &&
    isText((value as LangMap).en, 200) &&
    isText((value as LangMap).am, 200) &&
    ((value as LangMap).om === undefined || typeof (value as LangMap).om === "string");
}

export function validImageUrl(value: unknown): value is string {
  return value === "" || (typeof value === "string" && value.length <= 2048 &&
    (value.startsWith("/") || value.startsWith("https://")));
}

const configuredAuthSecret = process.env["AUTH_SECRET"] || process.env["SESSION_SECRET"];
if (process.env["NODE_ENV"] === "production" && !configuredAuthSecret) {
  throw new Error("AUTH_SECRET environment variable is required in production.");
}
const AUTH_SECRET = configuredAuthSecret || randomBytes(32).toString("hex");
const TOKEN_TTL_SECONDS = 2 * 60 * 60;

function sign(input: string) {
  return createHmac("sha256", AUTH_SECRET).update(input).digest("base64url");
}

export function getTokenForRole(role: "admin" | "waiter"): string {
  const payload = Buffer.from(JSON.stringify({ role, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string): { valid: boolean; role: "admin" | "waiter" | null } {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return { valid: false, role: null };
    const expected = sign(payload);
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return { valid: false, role: null };
    }
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role?: string; exp?: number };
    if ((data.role !== "admin" && data.role !== "waiter") || !data.exp || data.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, role: null };
    }
    return { valid: true, role: data.role };
  } catch {
    return { valid: false, role: null };
  }
}

/** Accepts both admin and waiter tokens */
export function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" }); return;
  }
  const { valid, role } = verifyToken(auth.slice(7));
  if (!valid) {
    res.status(401).json({ error: "Invalid token" }); return;
  }
  req.userRole = role;
  next();
}

/** Accepts only admin tokens */
export function adminOnly(req: any, res: any, next: any) {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" }); return;
  }
  const { valid, role } = verifyToken(auth.slice(7));
  if (!valid) {
    res.status(401).json({ error: "Invalid token" }); return;
  }
  if (role !== "admin") {
    res.status(403).json({ error: "Admin access required" }); return;
  }
  req.userRole = role;
  next();
}
