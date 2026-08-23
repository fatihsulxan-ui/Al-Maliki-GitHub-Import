import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { adminOnly, store } from "./store.js";
import { uploadImageToSupabase, uploadLogoToSupabase } from "../lib/db.js";
import { hasSupabase } from "../lib/supabase.js";

const memStorage = multer.memoryStorage();
const upload = multer({
  storage: memStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10 },
  fileFilter: (_req, file, cb) => {
    cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
});

const LOCAL_IMAGES_DIR = path.resolve(process.cwd(), "public/images");

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_IMAGES_DIR)) {
    fs.mkdirSync(LOCAL_IMAGES_DIR, { recursive: true });
  }
}

function saveLocalFile(buffer: Buffer, fileName: string): string {
  ensureLocalDir();
  const filePath = path.join(LOCAL_IMAGES_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  return `/api/images/${fileName}`;
}

const router = Router();

// Serve locally-uploaded images
router.get("/images/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  if (filename !== req.params.filename || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
    res.status(400).json({ error: "Invalid filename" }); return;
  }
  const filePath = path.join(LOCAL_IMAGES_DIR, filename);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: "Not found" }); return; }
  res.sendFile(filePath);
});

router.post("/upload", adminOnly, upload.single("image"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No file" }); return; }
  try {
    const ext = req.file.mimetype === "image/png" ? ".png" : req.file.mimetype === "image/webp" ? ".webp" : ".jpg";
    if (hasSupabase) {
      const url = await uploadImageToSupabase(req.file.buffer, ext, "menu");
      res.json({ url }); return;
    }
    // Local fallback
    const fileName = `upload-${Date.now()}${ext}`;
    const url = saveLocalFile(req.file.buffer, fileName);
    res.json({ url });
  } catch {
    res.status(500).json({ error: "Upload failed" });
  }
});

router.post("/upload/logo", adminOnly, upload.single("image"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No file" }); return; }
  try {
    const ext = req.file.mimetype === "image/png" ? ".png" : req.file.mimetype === "image/webp" ? ".webp" : ".jpg";
    if (hasSupabase) {
      const url = await uploadLogoToSupabase(req.file.buffer, ext);
      store.settings.logo = url;
      res.json({ url }); return;
    }
    // Local fallback
    const fileName = `restaurant-logo${ext}`;
    const url = saveLocalFile(req.file.buffer, fileName);
    store.settings.logo = url;
    res.json({ url });
  } catch {
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
