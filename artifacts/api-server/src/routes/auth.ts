import { Router } from "express";
import { store, getTokenForRole } from "./store.js";

const router = Router();
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;

router.post("/auth/login", (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = attempts.get(ip);
  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
    res.status(429).json({ error: "Too many login attempts. Try again later." }); return;
  }
  if (current && current.resetAt <= now) attempts.delete(ip);

  const { role, pin } = req.body as { role?: unknown; pin?: unknown };
  if ((role !== "admin" && role !== "waiter") || typeof pin !== "string" || pin.length < 4 || pin.length > 128) {
    res.status(400).json({ error: "Invalid login request" }); return;
  }

  if (role === "admin" && pin === store.settings.adminPin) {
    attempts.delete(ip);
    res.json({ token: getTokenForRole("admin"), role: "admin" }); return;
  }
  if (role === "waiter" && pin === store.settings.waiterPin) {
    attempts.delete(ip);
    res.json({ token: getTokenForRole("waiter"), role: "waiter" }); return;
  }
  const next = current && current.resetAt > now ? current : { count: 0, resetAt: now + WINDOW_MS };
  next.count += 1;
  attempts.set(ip, next);
  res.status(401).json({ error: "Wrong PIN" });
});

export default router;
