# Dijital QR Menü Sistemi

Lionel Hotel Istanbul için hazırlanmış çok dilli, veritabanı destekli QR menü ve yönetim paneli uygulaması.

## Kullanılan teknolojiler

- Next.js App Router, React, TypeScript
- Tailwind CSS ve shadcn/ui yaklaşımına uygun yerel UI bileşenleri
- PostgreSQL, Prisma ORM, Prisma seed
- Güvenli session tabanlı admin girişi, bcrypt parola hash'i
- Zod validasyon, server actions, route handlers
- QR kod üretimi, görsel yükleme ve WebP optimizasyonu
- Vitest ve Playwright test altyapısı
- Docker ve Docker Compose

## Sistem gereksinimleri

- Node.js 22+
- PostgreSQL 16+
- Docker Desktop veya Docker Engine
- Windows Server ya da standart Linux sunucu

## Geliştirme ortamı kurulumu

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

Uygulama: `http://localhost:3000/menu`

Admin paneli: `http://localhost:3000/admin`

## .env yapılandırması

`.env.example` dosyasını `.env` olarak kopyalayın. Production ortamında özellikle şu değerleri değiştirin:

- `DATABASE_URL`
- `SESSION_SECRET`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_USERNAME`
- `SEED_ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL`
- `UPLOAD_DIR`

Gerçek parola kaynak koda yazılmaz; seed işlemi `.env` içindeki parolayı bcrypt ile hash'ler.

## PostgreSQL kurulumu

Yerel PostgreSQL kullanıyorsanız `DATABASE_URL` değerini kendi bağlantınıza göre düzenleyin.

```bash
npx prisma migrate deploy
npm run db:seed
```

## Prisma migration işlemleri

Geliştirme ortamında:

```bash
npx prisma migrate dev
```

Production ortamında:

```bash
npx prisma migrate deploy
```

## Seed data çalıştırma

```bash
npm run db:seed
```

Seed; diller, roller, admin kullanıcısı, işletme ayarları, tema, kategoriler, ürünler, alerjenler, diyet etiketleri ve örnek QR kaydı oluşturur.

## Docker kurulumu

```bash
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

PostgreSQL verisi `postgres_data`, yüklenen görseller `uploads` volume içinde kalıcı tutulur.

## Production build

```bash
npm run build
npm run start
```

## Reverse proxy ve HTTPS

Nginx veya IIS reverse proxy ile `localhost:3000` uygulamasını alan adınıza yönlendirin. HTTPS terminasyonunu proxy katmanında yapın ve `NEXT_PUBLIC_APP_URL` değerini gerçek HTTPS adresiyle güncelleyin.

## Görsel klasörü izinleri

`UPLOAD_DIR` uygulama kullanıcısı tarafından yazılabilir olmalıdır. Docker içinde bu klasör `/app/storage/uploads` olarak ayarlanmıştır.

## Yedekleme

PostgreSQL:

```bash
pg_dump "$DATABASE_URL" > qr_menu_backup.sql
```

Görseller:

```bash
tar -czf uploads_backup.tar.gz storage/uploads
```

Menü verilerini JSON veya CSV olarak dışa aktarma:

```bash
curl -b "qr_admin_session=..." http://localhost:3000/api/admin/export
curl -b "qr_admin_session=..." "http://localhost:3000/api/admin/export?format=csv" -o menu.csv
```

## Güncelleme

```bash
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart qr-menu
```

Docker ile:

```bash
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

## Test ve kalite kontrolleri

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

E2E testleri:

```bash
npm run test:e2e
```

## Sorun giderme

- Admin girişi çalışmıyorsa seed parolasını ve `SEED_ADMIN_*` değerlerini kontrol edin.
- Görseller görünmüyorsa `UPLOAD_DIR` izinlerini kontrol edin.
- Veritabanı bağlantı hatasında `DATABASE_URL` host, kullanıcı, parola ve port değerlerini doğrulayın.
- Docker üzerinde migration unutulduysa `docker compose exec app npx prisma migrate deploy` çalıştırın.
