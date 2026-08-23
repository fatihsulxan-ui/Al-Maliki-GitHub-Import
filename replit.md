# ARAB ALI HOTEL Digital Menu

Restoran için masa bazlı QR kod menü sistemi. Müşteriler masalarındaki QR kodu tarayarak dijital menüyü görüntüler, garsonlar siparişleri ve masa çağrılarını takip eder, admin ise menüyü ve masaları yönetir.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API sunucusunu çalıştır (port 8080)
- `pnpm --filter @workspace/restoran-menu run dev` — Frontend'i çalıştır (port 24236)
- `pnpm run typecheck` — Tüm paketlerde TypeScript kontrolü

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend:** React 19 + Vite, TailwindCSS v4, Wouter (router), TanStack Query, Framer Motion
- **Backend:** Express 5, Pino logger
- **Depolama:** Supabase (birincil) + in-memory fallback (Supabase yoksa otomatik devreye girer)
- **Resim yükleme:** Multer, Supabase Storage

## Uygulama Rotaları

| Rota | Açıklama |
|---|---|
| `/` | Personel giriş ekranı (Garson / Admin seçimi) |
| `/masa/:tableId` | Müşteri menü sayfası (QR ile açılır) |
| `/garson` | Garson paneli (siparişler, masa çağrıları) |
| `/admin` | Admin paneli (menü yönetimi, masalar, ayarlar, QR kodlar) |

## API Rotaları

- `GET /api/healthz` — Sağlık kontrolü
- `GET/POST /api/menu` — Menü öğeleri CRUD
- `GET/POST /api/categories` — Kategoriler CRUD
- `GET/POST /api/tables` — Masalar CRUD
- `GET/POST /api/orders` — Siparişler
- `GET/POST /api/waiter-calls` — Garson çağrıları
- `GET/POST /api/settings` — Restoran ayarları (isim, logo vb.)
- `POST /api/upload` — Görsel yükleme (Supabase Storage)
- `GET /api/reviews` — Müşteri yorumları
- `GET /api/menu-stats` — Menü istatistikleri
- `GET /api/bundle` — Tüm veriyi tek seferde çek (menü+kategori+masa)

## Mimari Notlar

- `artifacts/api-server/src/routes/store.ts` — In-memory store (Supabase fallback)
- `artifacts/api-server/src/lib/db.ts` — Supabase operasyonları (`sb()` cast ile)
- `artifacts/api-server/src/lib/supabase.ts` — Supabase client (`hasSupabase` flag'i)
- `artifacts/api-server/src/lib/persist.ts` — Yorumları diske kaydet (`data/reviews.json`)
- `artifacts/api-server/src/routes/data/initial-data.ts` — Başlangıç seed verisi

## Supabase Yapılandırması

Supabase env vars yoksa uygulama in-memory modda çalışır (veriler sunucu yeniden başlatıldığında sıfırlanır). Kalıcı depolama için:
- `SUPABASE_URL` ve `SUPABASE_ANON_KEY` env vars gerekli
- Tablolar: `menu_items`, `categories`, `tables`, `settings`
- Bucket'lar: `menu-images`, `logos`

## User Preferences

_Kullanıcı tercihleri buraya eklenir._

## Gotchas

- `supabase.from("table")` çağrıları `sb()` cast'i üzerinden yapılmalı (untyped client)
- Express 5 route handler'larında erken return için `res.status(404).json({...}); return;` pattern'ini kullan (`return res.json(...)` TypeScript hatası verir)
- Logo resmi Supabase Storage'dan geliyor — dev ortamında 404 beklenen bir durum
