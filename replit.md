# ARAB ALI HOTEL Digital Menu

Masaya özel QR menü; müşteriler `/masa/:tableId` üzerinden menüyü görüntüler, sipariş ve garson çağrısı gönderir. Garson ve yönetici panelleri Clerk oturumu gerektirir.

## Çalıştırma

- API: `pnpm --filter @workspace/api-server run dev`
- Aktif web arayüzü: `pnpm --filter @workspace/arab-ali-menu run dev`
- Typecheck: `pnpm --filter @workspace/api-server run typecheck` ve `pnpm --filter @workspace/arab-ali-menu run typecheck`
- Web build: `pnpm --filter @workspace/arab-ali-menu run build`

## Mimari

- Aktif arayüz `artifacts/arab-ali-menu`; eski `restoran-menu` arayüzü kullanılmaz.
- Web: React, Vite, Tailwind CSS, Wouter, TanStack Query ve Clerk.
- API: Express 5; Clerk cookie oturumu ve sunucu tarafında rol denetimi.
- Veri ve görseller Supabase'te kalıcıdır; uygulama belleği veritabanının yerine geçmez.
- Supabase SQL Editor'da `supabase/schema.sql` bir kez çalıştırılmalıdır.
- Supabase tablolarına erişim API sunucusundaki Replit Supabase bağlantısı üzerinden yapılır. İstemcide Supabase anahtarı kullanılmaz.
- Menü, kategori, masa, ayarlar, sipariş, garson çağrısı, yorum ve menü tıklama kayıtları Supabase'te tutulur.
- `orders` tablosundaki `delivered` ve `cancelled` kayıtları kalıcı arşivdir. Garson sorgusu bunları dışarıda bırakır; yönetici Dashboard sorgusu geçmişi dahil eder.
- İlk menü/kategori örnek verisi yalnızca ilk kurulum işaretlenmemişse yüklenir. Sonradan tüm menü silinirse yeniden başlatma örnek veriyi geri getirmez.

## Rotalar

| Rota | Erişim | Açıklama |
|---|---|---|
| `/` | Herkese açık | Personel giriş ekranı |
| `/masa/:tableId` | Herkese açık | QR ile açılan müşteri menüsü |
| `/sign-in` | Herkese açık | Clerk Google girişi |
| `/sign-up/*` | Giriş sayfasına yönlendirilir | Herkese açık kayıt kapalıdır |
| `/garson` | Clerk `waiter` rolü | Aktif siparişler ve masa çağrıları |
| `/admin` | Clerk `admin` rolü | Menü, kategoriler, masalar, yorumlar, ayarlar ve raporlar |

Clerk kullanıcısının `publicMetadata.role` alanı `waiter` veya `admin` olmalıdır. Rol atanmamış kullanıcıya erişim verilmez. Yeni rol ataması Clerk yönetiminden yapılır.

## API notları

- `GET /api/auth/me` Clerk oturumunu ve rolü döndürür.
- `GET /api/bundle` yalnızca görünür menü öğelerini ve restoran ayarlarını verir.
- `GET /api/menu?showHidden=1` yalnızca admin oturumuna açıktır.
- Sipariş, masa çağrısı, yorum ve menü tıklaması masa kimliğini sunucuda doğrular; sipariş fiyatı Supabase menüsünden hesaplanır.
- `GET /api/orders` arşivlenmemiş kayıtları; `GET /api/orders?includeArchived=1` yönetici geçmişini döndürür.
- Personel API çağrıları Clerk oturum çerezini aynı kök adresten gönderir.
- İstek gövdelerinde menü, kategori, masa ve ayar alanları izin listesine göre doğrulanır.

## Görsel kapsamı

Mevcut renkler, yazı tipleri, yerleşim ve animasyonlar korunur. Görsel değişiklik yalnızca açıkça istenirse yapılır.
