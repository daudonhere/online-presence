# SPECS — Absensi Al-Riyadl

Aplikasi Absensi Guru (Teacher Attendance System) for MTS AL-RIYADL school.

Fullstack Next.js 16 (App Router) + Supabase (PostgreSQL) + Auth.js v5.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | Tailwind CSS v4, lucide-react |
| State | Zustand (online/offline), React Query (server state) |
| Auth | Auth.js v5 (credentials, JWT) |
| DB | PostgreSQL via Supabase (`@supabase/supabase-js`) |
| Storage | Supabase Storage (avatars, obstacles) |
| Validation | Zod v4 |
| PWA | next-pwa |
| Password | bcryptjs (salt: 10) |
| QR | qrcode.react (generate), html5-qrcode (scan) |
| Charts | SVG (custom), xlsx (SheetJS) for Excel export |
| Push | web-push (VAPID) |
| Testing | Vitest (121 tests) |

---

## Database Schema (PostgreSQL via Supabase)

### User
```
id          Int       @id @default(autoincrement())
phone       String    @unique
password    String    (bcryptjs hashed)
name        String
role        String    @default("teacher")  // "teacher" | "admin"
createdAt   DateTime  @default(now())
updatedAt   DateTime  @updatedAt
```

### Profile
```
id          Int       @id @default(autoincrement())
userId      Int       @unique  → User
subject     String
nip         String
email       String
avatarUrl   String?
location    String?   (decimal coords: "-6.954097, 107.009786")
createdAt   DateTime  @default(now())
updatedAt   DateTime  @updatedAt
```

### Attendance
```
id            Int       @id @default(autoincrement())
userId        Int       → User
date          DateTime  @db.Date
checkInTime   String?   (HH:mm)
checkOutTime  String?   (HH:mm)
notes         String?
status        String    @default("hadir")  // "hadir" | "izin" | "alpha" | "libur" | "sakit"
source        String?                      // "qr" | "manual" | "obstacle"
createdAt     DateTime  @default(now())
updatedAt     DateTime  @updatedAt

@@unique([userId, date])
```

### Obstacle
```
id          Int       @id @default(autoincrement())
userId      Int       → User
category    String                      // "sakit" | "izin" | "cuti"
date        DateTime  @db.Date
reason      String
fileUrl     String?
status      String    @default("pending")  // "pending" | "approved" | "rejected"
reviewedBy  Int?      → User
reviewedAt  DateTime?
createdAt   DateTime  @default(now())
updatedAt   DateTime  @updatedAt
```

### NotificationPreference
```
id             Int       @id @default(autoincrement())
userId         Int       @unique  → User
reminderMasuk  Boolean   @default(true)
reminderPulang Boolean   @default(true)
monthlySummary Boolean   @default(false)
```

### Notification
```
id        Int       @id @default(autoincrement())
userId    Int       → User (CASCADE delete)
title     String
message   String
type      String    @default("system")  // "system" | "obstacle"
isRead    Boolean   @default(false)
createdAt DateTime  @default(now())

INDEX ON (userId), (isRead)
```

### PushSubscription
```
id        Int       @id @default(autoincrement())
userId    Int       → User (CASCADE delete)
endpoint  String
p256dh    String
auth      String
userAgent String?
createdAt DateTime  @default(now())
updatedAt DateTime  @updatedAt

UNIQUE(userId, endpoint)
INDEX ON (userId), (endpoint)
```

### Report
```
id        Int       @id @default(autoincrement())
title     String
period    String    (e.g. "Juli 2026")
fileUrl   String
status    String    @default("ready")  // "ready" | "generating" | "failed"
createdAt DateTime  @default(now())
```

---

## Zod Schemas (`src/lib/validations.ts`)

All schemas use `sanitize()` (strip HTML tags) via `.transform()` where applicable.

| Schema | Fields |
|--------|--------|
| `registerSchema` | `name` (string, 1-100, sanitized), `phone` (regex `^0[0-9]{9,13}$`), `password` (6-100) |
| `loginSchema` | `phone` (string, required), `password` (string, required) |
| `profileUpdateSchema` | `name?` (sanitized), `subject?` (sanitized), `nip?` (sanitized), `email?` (valid email), `phone?` (regex), `location?` (decimal coords regex, sanitized) |
| `attendanceSchema` | `date` (required), `time` (regex `^([01]\d\|2[0-3]):[0-5]\d$`), `notes?` (max 500, sanitized) |
| `checkOutSchema` | `time` (regex `^([01]\d\|2[0-3]):[0-5]\d$`) |
| `obstacleSchema` | `date` (required), `category` (enum: sakit/izin/cuti), `reason` (1-250, sanitized) |
| `notificationPrefsSchema` | `reminderMasuk?` (boolean), `reminderPulang?` (boolean), `monthlySummary?` (boolean) |
| `scanSchema` | `qrData` (regex `^ATTENDANCE:USER:\d+:.+$`), `latitude` (number, -90..90), `longitude` (number, -180..180) |

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Validation | Purpose |
|--------|----------|------|------------|---------|
| GET/POST | `/api/auth/[...nextauth]` | — | — | Auth.js handler |
| POST | `/api/auth/register` | No | registerSchema | Register (creates User + Profile + NotificationPreference) |
| POST | `/api/auth/change-password` | Yes | — | Verify current password, hash new with bcryptjs |

### Profile
| Method | Endpoint | Auth | Validation | Purpose |
|--------|----------|------|------------|---------|
| GET | `/api/profile` | Yes | — | Get current user + profile |
| PUT | `/api/profile` | Yes | profileUpdateSchema | Update biodata (name, subject, nip, email, phone, location) |
| POST | `/api/profile/avatar` | Yes | — | Upload avatar (max 1MB, jpg/png) to Supabase Storage |

### Attendance
| Method | Endpoint | Auth | Validation | Purpose |
|--------|----------|------|------------|---------|
| GET | `/api/attendance?month=&year=` | Yes | — | List attendance for current user |
| POST | `/api/attendance` | Yes | attendanceSchema | Manual check-in (source: "manual") |
| POST | `/api/attendance/check-out` | Yes | checkOutSchema | Update checkOutTime |
| GET | `/api/attendance/last` | Yes | — | Get today's attendance status |
| GET | `/api/attendance/analysis?month=&year=` | Yes | — | Monthly analysis (admin: all teachers; teacher: personal) |

### QR Scan
| Method | Endpoint | Auth | Validation | Purpose |
|--------|----------|------|------------|---------|
| POST | `/api/scan` | Yes | scanSchema | QR scan check-in with geofence (≤10m from admin location) |

**Scan rules:**
- Teacher scans admin QR → teacher hadir
- Admin scans teacher QR → that teacher hadir
- Cannot scan own QR or same-role QR
- GPS must be within 10 meters of admin's configured location (Haversine formula)

### Obstacle (Halangan)
| Method | Endpoint | Auth | Validation | Purpose |
|--------|----------|------|------------|---------|
| GET | `/api/obstacles` | Yes | — | List user's own obstacles |
| POST | `/api/obstacles` | Yes | obstacleSchema | Submit new obstacle (FormData with optional file) |

### Notification
| Method | Endpoint | Auth | Validation | Purpose |
|--------|----------|------|------------|---------|
| GET | `/api/notifications` | Yes | — | List user's notifications |
| PATCH | `/api/notifications/:id` | Yes | — | Mark as read |
| DELETE | `/api/notifications/:id` | Yes | — | Delete notification |
| GET | `/api/notifications/preferences` | Yes | — | Get notification preferences |
| PUT | `/api/notifications/preferences` | Yes | notificationPrefsSchema | Update notification preferences |

### Push Notification
| Method | Endpoint | Auth | Validation | Purpose |
|--------|----------|------|------------|---------|
| POST | `/api/push/subscribe` | Yes | — | Register push subscription (VAPID) |
| GET | `/api/push/subscribe` | Yes | — | Get user's push subscriptions |
| POST | `/api/push/unsubscribe` | Yes | — | Remove push subscription |

### Reports
| Method | Endpoint | Auth | Validation | Purpose |
|--------|----------|------|------------|---------|
| GET | `/api/reports?month=&year=` | Yes | — | List reports (PDF & Excel generated client-side) |

### Admin — Obstacles
| Method | Endpoint | Auth | Validation | Purpose |
|--------|----------|------|------------|---------|
| GET | `/api/admin/obstacles?category=&month=&year=` | Admin | — | List all obstacles with filters |
| PATCH | `/api/admin/obstacles/:id` | Admin | — | Approve/reject (creates Attendance on approve) |
| DELETE | `/api/admin/obstacles/:id` | Admin | — | Delete single obstacle + storage file |
| DELETE | `/api/admin/obstacles` | Admin | — | Bulk delete (`{ ids: [] }`) or delete all (`{ all: true }`) |

**Approval status mapping:**
- `sakit` → attendance status `"sakit"`
- `izin` → attendance status `"izin"`
- `cuti` → attendance status `"libur"`

### Admin — Teachers
| Method | Endpoint | Auth | Validation | Purpose |
|--------|----------|------|------------|---------|
| GET | `/api/admin/teachers` | Admin | — | List all teachers with today's attendance status |
| GET | `/api/admin/teachers/:id` | Admin | — | Get teacher detail (profile + recent attendance) |
| PUT | `/api/admin/teachers/:id` | Admin | — | Update teacher (name, phone, subject, nip, email) |
| DELETE | `/api/admin/teachers/:id` | Admin | — | Delete teacher + profile + avatar cleanup |

### Cron (Vercel)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/cron/reminder-masuk` | Bearer (CRON_SECRET) | Daily reminder at 06:00 WIB |
| GET | `/api/cron/monthly-summary` | Bearer (CRON_SECRET) | Monthly summary on 1st of month |

---

## Pages / Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Dashboard — QR code + menu buttons |
| `/auth` | `src/app/auth/page.tsx` | Login / Register + PWA install banner |
| `/scan` | `src/app/scan/page.tsx` | QR scanner (html5-qrcode) + GPS geofence |
| `/manual` | `src/app/manual/page.tsx` | Manual attendance (date, time, notes) |
| `/analisa` | `src/app/analisa/page.tsx` | Attendance analysis (admin: all teachers; teacher: personal) |
| `/laporan` | `src/app/laporan/page.tsx` | Reports — PDF + Excel export |
| `/halangan` | `src/app/halangan/page.tsx` | Obstacle hub (admin: Persetujuan + Riwayat; teacher: 3 category cards) |
| `/halangan/[category]` | `src/app/halangan/[category]/page.tsx` | Submit obstacle form |
| `/halangan/admin/persetujuan` | `src/app/halangan/admin/persetujuan/page.tsx` | Admin: approve/reject obstacles |
| `/halangan/admin/riwayat` | `src/app/halangan/admin/riwayat/page.tsx` | Admin: obstacle history + bulk delete |
| `/pengaturan` | `src/app/pengaturan/page.tsx` | Settings — profile, password, notifications, Manajemen Guru (admin), location (admin) |
| `/guru` | `src/app/guru/page.tsx` | Admin: teacher list with search + status badges |
| `/guru/[id]` | `src/app/guru/[id]/page.tsx` | Admin: teacher detail, edit, delete |
| `/offline` | `src/app/offline/page.tsx` | PWA offline fallback |

---

## File Upload Limits

| Type | Max Size | Allowed Formats | Storage |
|------|----------|-----------------|---------|
| Avatar | 1 MB | .jpg, .jpeg, .png | Supabase Storage (`avatars` bucket, public) |
| Obstacle bukti | 1 MB | .pdf, .jpg, .jpeg, .png | Supabase Storage (`obstacles` bucket, public) |
| Report file | — | .html, .csv | Server-side generation |

Magic byte validation: JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), PDF (`25 50 44 46`).

---

## Seed Data

| Role | Phone | Password |
|------|-------|----------|
| Admin | `08123456789` | `Tiger1SHA12@` |
| Teacher | `081222222222` | `guru123` |
| Teacher | `081333333333` | `guru123` |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side only) |
| `AUTH_SECRET` | Auth.js JWT secret |
| `AUTH_URL` | App base URL |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key |
| `VAPID_SUBJECT` | Web Push contact email |
| `CRON_SECRET` | Bearer token for Vercel cron endpoints |

---

## Supabase Storage Buckets

| Bucket | Visibility | Purpose |
|--------|-----------|---------|
| `avatars` | Public | Teacher/admin profile photos |
| `obstacles` | Public | Obstacle submission attachments |

---

## Security

- Passwords hashed with bcryptjs (salt rounds: 10)
- Rate limiting: max 5 login attempts per minute per phone (`src/lib/rate-limit.ts`)
- Input sanitization: HTML tag stripping via Zod `.transform(sanitize)`
- File upload: magic byte detection, 1MB size limit
- CSRF: handled by Auth.js
- Route protection: middleware redirects to `/auth` if not logged in
- Geofence: QR scan requires GPS within 10 meters of admin location (Haversine)
- Role-based access: admin endpoints check `session.user.role === "admin"`

---

## Testing (Vitest)

| Category | Tests | File |
|----------|-------|------|
| Unit — Zod schemas | 45 | `src/lib/__tests__/validations.test.ts` |
| Unit — Geo (haversine, parseDecimal) | 16 | `src/lib/__tests__/geo.test.ts` |
| Unit — Rate limiting | 7 | `src/lib/__tests__/rate-limit.test.ts` |
| Unit — API response helpers | 11 | `src/lib/__tests__/api-response.test.ts` |
| Unit — Auth (bcryptjs) | 7 | `src/lib/__tests__/auth.test.ts` |
| Unit — Upload error | 2 | `src/lib/__tests__/upload.test.ts` |
| API — Routes | 17 | `src/app/api/__tests__/routes.test.ts` |
| Integration — Flows | 12 | `src/app/api/__tests__/integration.test.ts` |
| **Total** | **121** | |

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-emerald-school` | `#1b8659` | Primary green |
| `--color-yellow-school` | `#ffff00` | Accent yellow |
| `--color-navy-school` | `#003d7a` | Dark blue |
| `--background` | `#f8fafc` | Page background |
| `--foreground` | `#0f172a` | Text color |
| `--font-sans` | Satoshi | Body text |
| `--font-display` | Cabinet Grotesk | Headings |
| `--shadow-soft` | `0 14px 35px rgba(0,61,122,0.10)` | Navy soft shadow |
| `--shadow-card` | `0 10px 24px rgba(15,23,42,0.08)` | Card shadow |
