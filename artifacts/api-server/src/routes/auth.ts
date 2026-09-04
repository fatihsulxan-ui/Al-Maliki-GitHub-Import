import { Router } from "express";

const router = Router();
router.get("/auth/me", (req, res) => {
  res.json({ authenticated: Boolean((req as any).auth?.userId) });
});

export default router;
