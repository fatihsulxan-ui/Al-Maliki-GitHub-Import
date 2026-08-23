import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import menuRouter, { initMenu } from "./menu.js";
import categoriesRouter, { initCategories } from "./categories.js";
import tablesRouter, { initTables } from "./tables.js";
import waiterCallsRouter from "./waiter-calls.js";
import bundleRouter from "./bundle.js";
import settingsRouter, { initSettings } from "./settings.js";
import uploadRouter from "./upload.js";
import ordersRouter from "./orders.js";
import menuStatsRouter from "./menu-stats.js";
import reviewsRouter from "./reviews.js";
import { store } from "./store.js";
import { loadReviews } from "../lib/persist.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(menuRouter);
router.use(categoriesRouter);
router.use(tablesRouter);
router.use(waiterCallsRouter);
router.use(bundleRouter);
router.use(settingsRouter);
router.use(uploadRouter);
router.use(ordersRouter);
router.use(menuStatsRouter);
router.use(reviewsRouter);

export function initReviews() {
  const saved = loadReviews();
  if (saved.length > 0) {
    store.reviews.push(...saved);
    process.stdout.write(`[reviews] Loaded ${saved.length} reviews from disk\n`);
  }
}

export { initTables, initSettings, initMenu, initCategories };
export default router;
