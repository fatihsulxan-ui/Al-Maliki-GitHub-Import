import { Router } from "express";
import { store } from "./store.js";

const router = Router();

router.get("/bundle", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const visibleMenu = store.menu.filter(m => !m.hidden);
  const categories = [...store.categories].sort((a, b) => a.order - b.order);
  res.json({
    menu: visibleMenu,
    categories,
    settings: {
      restaurantName: store.settings.restaurantName,
      logo: store.settings.logo,
    },
  });
});

export default router;
