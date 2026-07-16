# AGENTS.md

## Critical Rules

**DO NOT run `npm run lint`, `npm run build`, or `npm run dev` unless the user explicitly asks for it.**

This applies to ALL agents and subagents, at ALL times. No exceptions. Only run these commands when the user directly requests them with an explicit command (e.g. "jalankan lint", "run build", etc.).

**Always read `todo.md` first** to understand current backend development tasks, database schema, and API routes before making any changes.

## Project Overview

**Online Presence** — Aplikasi Absensi Guru (Teacher Attendance System) for MTS AL-RIYADL school. App name: **Absensi Al-Riyadl**.

Fullstack Next.js 16 (App Router) with:

- **Frontend:** Next.js 16, Tailwind CSS v4, Zustand, React Query
- **Backend:** Next.js API Routes / Server Actions, Prisma (SQLite), Auth.js v5
- **PWA:** next-pwa
- **Validation:** Zod v4
- **Database:** SQLite via Prisma 7 (BetterSqlite3 driver adapter)

## Commands

```bash
npm run dev                # Start dev server (ONLY when user asks)
npm run build              # Build for production (ONLY when user asks)
npm run lint               # Run ESLint (ONLY when user asks)
npm run start              # Start production server
npx prisma migrate dev     # Run migrations (ONLY when user asks)
npx prisma generate        # Generate Prisma client
npx prisma studio          # Open Prisma Studio
```

## Routes

| Route | Page | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Dashboard utama — menu absensi + QR code dari session |
| `/scan` | `src/app/scan/page.tsx` | Scan QR untuk absensi (live camera html5-qrcode) |
| `/manual` | `src/app/manual/page.tsx` | Absen manual |
| `/analisa` | `src/app/analisa/page.tsx` | Analisa data kehadiran |
| `/laporan` | `src/app/laporan/page.tsx` | Laporan kehadiran |
| `/halangan` | `src/app/halangan/page.tsx` | Halangan / kategori kendala |
| `/halangan/[category]` | `src/app/halangan/[category]/page.tsx` | Form submit halangan |
| `/pengaturan` | `src/app/pengaturan/page.tsx` | Pengaturan aplikasi |
| `/auth` | `src/app/auth/page.tsx` | Login / Register (outside DashboardLayout) |

## Features

### Auth (`/auth`)
- **Login:** phone + password (Auth.js credentials provider)
- **Register:** name + phone + password + retype password, Zod validation
- Toggle between login/register mode
- Validation: password match check on register
- **Logo:** centered above "Selamat Datang", white rounded card with yellow ring + `logo.png`
- **PWA Install Banner:** listens for `beforeinstallprompt`, checks `display-mode: standalone`, dismiss via X button persists in `sessionStorage("pwa-banner-dismissed")`, reappears per new session

### Dashboard (`/`)
- Real QR code from `qrcode.react` using session user data (`QrUserId.tsx`)
- "Scan QR" button → `/scan`
- "Absen Manual" button → `/manual`
- Decorative: yellow circle, blue circle, 8 yellow dots grid

### Scan QR (`/scan`)
- Live camera QR scanner using `html5-qrcode`
- Corner borders (yellow), pulsing scan line animation
- "Kirim Absensi" button submits to `POST /api/scan` (validates QR format + userId match)
- Auto-check-in on successful scan

### Manual Attendance (`/manual`)
- **Fields:**
  - Tanggal Absensi — `<input type="date">` (required)
  - Jam Kedatangan — `<input type="time">` (required)
  - Catatan Opsional — `<textarea rows={4}>`
- "Verifikasi Kehadiran" info box (yellow)
- "Kirim Absensi" submit button → `POST /api/attendance`
- "Status Terakhir" section showing last attendance via `GET /api/attendance/last`

### Attendance Analysis (`/analisa`)
- Fetches real data from `GET /api/attendance/analysis`
- **Header:** Month badge, title, BarChart3 icon
- **Attendance Percentage:** percentage value + rating + progress bar
- **Summary Stats (3-col grid):** Hadir count, Izin count, Alpha count
- **Daily Chart:** SVG line chart for 31 days with legend (Hadir/Izin/Alpha/Libur)
- **Weekly Breakdown:** 4 weeks, each with per-day status grid (Sen-Jum)
- **CTA:** Link to `/laporan`

### Reports (`/laporan`)
- Fetches real data from `GET /api/reports`
- **Filter Form:** month select + year select + submit button
- **Report List:** each report has icon, title, period, stats, PDF/Excel download buttons
  1. Rekap Absensi Guru — stats: Hari Kerja, Dibuat
  2. Ringkasan Kehadiran Personal — stats: Hadir/Izin/Alpha
  3. Detail Halangan Kehadiran — tags: Sakit/Izin/Cuti counts
- **Download History:** file name, timestamp, status (Berhasil/Gagal)

### Halangan Hub (`/halangan`)
- 3 category cards:
  1. **Sakit** — green theme, link → `/halangan/sakit`
  2. **Izin** — yellow theme, link → `/halangan/izin`
  3. **Cuti** — blue theme, link → `/halangan/cuti`
- Info note: submissions verified by admin before appearing in reports

### Halangan Form (`/halangan/[category]`)
- Dynamic category from URL params: `sakit`, `izin`, `cuti`
- **Fields:**
  - Tanggal Kejadian — `<input type="date">` (required, marked "Wajib")
  - Kategori — read-only badge (color-coded per category)
  - Keterangan — `<textarea rows={5}>` (required, 250 char max with live counter)
  - File Referensi — file upload, accepts `.pdf, .jpg, .jpeg, .png`, max 1 MB (optional)
  - Confirmation checkbox — data accuracy statement
- "Kirim Pengajuan" submit button → `POST /api/obstacles`

### Settings (`/pengaturan`)
- **Profile Header:** clickable profile image upload (max 1 MB), default avatar, badge "Profil Guru", name/subject/NIP display
- **Data Dasar (editable inline):** Nama, Guru Bidang Pelajaran, NIP, Email, Nomor Telepon
- **Login & Password:** "Ubah Password" button → modal with Password Baru + Ketik Ulang (min 6 chars, match check)
- **Notifikasi (toggles):**
  - Pengingat Absen Masuk — default ON, "Dikirim sebelum jam 07.00 WIB"
  - Pengingat Absen Pulang — default ON, "Dikirim setelah jam mengajar selesai"
  - Ringkasan Bulanan — default OFF, "Laporan singkat setiap akhir bulan"
- **Logout:** red section "Keluar dari Akun" (Auth.js signOut)
- **Footer:** "Absensi Guru MTS AL-RIYADL v1.0.0"

## Data Models (Prisma Schema)

### User
- `id` — Int, auto-increment
- `phone` — String, unique
- `password` — String (hashed with bcryptjs)
- `name` — String
- `role` — Enum: `"teacher"` | `"admin"`, default `"teacher"`
- `createdAt` — DateTime
- `updatedAt` — DateTime

### Profile
- `id` — Int, auto-increment
- `userId` — Int, FK → User
- `subject` — String (guru bidang pelajaran)
- `nip` — String
- `email` — String
- `avatarUrl` — String, optional
- `createdAt` — DateTime
- `updatedAt` — DateTime

### Attendance
- `id` — Int, auto-increment
- `userId` — Int, FK → User
- `date` — DateTime (date only)
- `checkInTime` — String (HH:mm), optional
- `checkOutTime` — String (HH:mm), optional
- `notes` — String, optional
- `status` — Enum: `"hadir"` | `"izin"` | `"alpha"` | `"libur"`
- `source` — String, optional: `"qr"` | `"manual"` | `"obstacle"`
- `createdAt` — DateTime
- `updatedAt` — DateTime
- `@@unique([userId, date])`

### Obstacle (Halangan)
- `id` — Int, auto-increment
- `userId` — Int, FK → User
- `category` — Enum: `"sakit"` | `"izin"` | `"cuti"`
- `date` — DateTime (date only)
- `reason` — String (max 250 chars)
- `fileUrl` — String, optional
- `status` — Enum: `"pending"` | `"approved"` | `"rejected"`, default `"pending"`
- `reviewedBy` — Int, FK → User, optional
- `reviewedAt` — DateTime, optional
- `createdAt` — DateTime
- `updatedAt` — DateTime

### NotificationPreference
- `id` — Int, auto-increment
- `userId` — Int, FK → User, unique
- `reminderMasuk` — Boolean, default `true`
- `reminderPulang` — Boolean, default `true`
- `monthlySummary` — Boolean, default `false`

### Report
- `id` — Int, auto-increment
- `title` — String
- `period` — String (e.g. "Juli 2026")
- `fileUrl` — String
- `status` — Enum: `"ready"` | `"generating"` | `"failed"`
- `createdAt` — DateTime

## API Endpoints

### Auth
- `POST /api/auth/register` — create user account (Zod: registerSchema)
- `POST /api/auth/login` — authenticate user (via Auth.js credentials)
- `POST /api/auth/logout` — end session (via Auth.js signOut)

### Attendance
- `GET /api/attendance?month=&year=` — list attendance records for user
- `POST /api/attendance` — create manual attendance record (Zod: attendanceSchema)
- `GET /api/attendance/last` — get today's attendance status
- `POST /api/attendance/check-out` — update checkOutTime (Zod: checkOutSchema)
- `GET /api/attendance/analysis?month=&year=` — calculate monthly analysis data

### QR Scan
- `POST /api/scan` — validate QR data + create attendance (Zod: scanSchema)

### Obstacle
- `GET /api/obstacles` — list user's obstacle submissions
- `POST /api/obstacles` — submit new obstacle (Zod: obstacleSchema)
- `PATCH /api/obstacles/:id` — update status (admin only)

### Profile
- `GET /api/profile` — get current user profile
- `PUT /api/profile` — update biodata (Zod: profileUpdateSchema)
- `POST /api/profile/avatar` — upload avatar image (max 1 MB)

### Reports
- `GET /api/reports?month=&year=` — list available reports
- `POST /api/reports/generate` — admin: generate report file (HTML + CSV)
- `GET /api/reports/:id/download` — download report file

### Notifications
- `GET /api/notifications/preferences` — get notification settings
- `PUT /api/notifications/preferences` — update notification settings (Zod: notificationPrefsSchema)

## Zod Validation Schemas (`src/lib/validations.ts`)

| Schema | Fields |
|--------|--------|
| `registerSchema` | name (string, 1-100), phone (regex `^0[0-9]{9,13}$`), password (6-100) |
| `loginSchema` | phone (string, required), password (string, required) |
| `profileUpdateSchema` | name?, subject?, nip?, email? (valid email), phone? (regex) |
| `attendanceSchema` | date (required), time (regex `^([01]\d\|2[0-3]):[0-5]\d$`), notes? |
| `checkOutSchema` | time (regex `^([01]\d\|2[0-3]):[0-5]\d$`) |
| `obstacleSchema` | date (required), category (enum sakit/izin/cuti), reason (1-250 chars) |
| `notificationPrefsSchema` | reminderMasuk?, reminderPulang?, monthlySummary? |
| `scanSchema` | qrData (regex `^ATTENDANCE:USER:\d+:.+$`) |

## Design Tokens

### Fonts
| Token | Font Family | Weights | Usage |
|-------|-------------|---------|-------|
| `--font-sans` | Satoshi | 400, 500, 600, 700 | Body text, UI elements |
| `--font-display` | Cabinet Grotesk | 500, 700, 800 | Headings, titles |

### Brand Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-emerald-school` | `#1b8659` | Primary green (buttons, headers, active states) |
| `--color-yellow-school` | `#ffff00` | Accent yellow (badges, CTA buttons, decorative) |
| `--color-navy-school` | `#003d7a` | Dark blue (text on yellow, decorative circles) |
| `--background` | `#f8fafc` | Page background (slate-50) |
| `--foreground` | `#0f172a` | Text color (slate-900) |

### Shadows
| Token | Value |
|-------|-------|
| `--shadow-soft` | `0 14px 35px rgba(0, 61, 122, 0.10)` — navy-tinted soft shadow |
| `--shadow-card` | `0 10px 24px rgba(15, 23, 42, 0.08)` — subtle dark shadow |

### Animations
| Name | Keyframes | Usage |
|------|-----------|-------|
| `scan` | Top: 0 → 100%-4px → 0 | QR scanner scan line |
| `slideUp` | translateY(100%) + opacity:0 → translateY(0) + opacity:1 | PWA install banner |

### Design Patterns
- **Rounded corners:** `rounded-2xl` (16px), `rounded-3xl` (24px), custom `rounded-[28px]`, `rounded-[30px]`, `rounded-[34px]`
- **Minimum touch targets:** `min-h-[54px]`, `min-h-[58px]`, `min-h-[44px]`, `min-w-[44px]`
- **Focus rings:** `focus:ring-4 focus:ring-emerald-100`, `focus:border-[#1b8659]`
- **Gradient headers:** `bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d]`
- **Card pattern:** `rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100`
- **Hover effect:** `transition hover:scale-[0.98]` or `hover:scale-[0.99]`
- **Decorative elements:** Yellow circle (`rounded-bl-[64px]`), blue circle (`bg-[#003d7a]/25`), 8-dot grids

## Component Inventory

### Layout Components (`src/components/layout/`)
| File | Type | Purpose |
|------|------|---------|
| `DashboardLayout.tsx` | Server | Root layout wrapper: Header + scrollable main (`flex flex-col items-center`) + BottomNav. Full-height flex column, `bg-slate-50`. |
| `Header.tsx` | Client | Sticky top header: green gradient, school name badge "MTS AL-RIYADL", greeting + user name (from `useSession()`), clock + time, notification bell. |
| `BottomNav.tsx` | Client | Fixed bottom nav, 5 tabs in grid. Active detection via `usePathname()`. Special: "/" also matches `/scan` and `/manual`. |
| `index.ts` | — | Barrel export. |

### Provider Components (`src/components/providers/`)
| File | Type | Purpose |
|------|------|---------|
| `SessionProvider.tsx` | Client | Auth.js `SessionProvider` wrapper for client-side session access. |

### UI Components (`src/components/ui/`)
| File | Type | Purpose |
|------|------|---------|
| `QrUserId.tsx` | Client | QR code generator using `qrcode.react`. Props: `userId`, `name`, `className`. Encodes `ATTENDANCE:USER:{id}:{name}`. |

### Bottom Navigation Tabs
| Tab | Route | Icon | Active When |
|-----|-------|------|-------------|
| Absensi | `/` | QrCode | pathname is `/`, `/scan`, or `/manual` |
| Halangan | `/halangan` | FileClock | pathname starts with `/halangan` |
| Analisa | `/analisa` | BarChart3 | pathname starts with `/analisa` |
| Laporan | `/laporan` | FileDown | pathname starts with `/laporan` |
| Atur | `/pengaturan` | UserCog | pathname starts with `/pengaturan` |

## State Management

### Zustand Store (`src/store/useAppStore.ts`)
```typescript
interface AppState {
  isOnline: boolean;          // default: true
  setIsOnline: (status: boolean) => void;
}
```
- Minimal — only tracks online/offline status
- Currently not consumed by any component

### Local Component State
All interactive pages use `useState` directly:
- `manual/page.tsx`: date, time, notes
- `halangan/[category]/page.tsx`: date, reason, charCount, confirmed
- `pengaturan/page.tsx`: notifStates[], profileImage, showPasswordModal, password, retypePassword, profile object
- `auth/page.tsx`: mode, phone, password, retypePassword, name, showPassword, showRetypePassword, deferredPrompt, showInstallBanner, isDismissed

## PWA Configuration

### next-pwa Config (`next.config.ts`)
```typescript
const withPWA = withPWAInit({
  dest: "public",           // Service worker output directory
  register: true,            // Auto-register SW
  skipWaiting: true,         // Skip waiting on new SW
  disable: process.env.NODE_ENV === "development",  // Disabled in dev
});
```

### Manifest (`public/manifest.json`)
- name: "Absensi Al-Riyadl"
- short_name: "AbsensiAlRiyadl"
- display: "standalone"
- Icons: 192x192 and 512x512 PNG (from `logo.png`)

### Root Layout Metadata
- `<html lang="id">` (Indonesian)
- title: "Absensi Al-Riyadl"
- themeColor: `#1b8659`
- maximumScale: 1 (prevents zoom)
- appleWebApp capable, status bar: black-translucent
- favicon: `/favicon.ico`, apple-touch-icon: `/icons/apple-touch-icon.png`

### Install Prompt Logic (`auth/page.tsx`)
- Captures `beforeinstallprompt` event
- Checks `display-mode: standalone` media query + `navigator.standalone`
- Dismiss via X button, persists in `sessionStorage("pwa-banner-dismissed")` — reappears per new session
- Slide-up banner with "Install Absensi Al-Riyadl" title, install/dismiss buttons

## Dependencies

### Production
| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| `next` | 16.2.10 | Framework | Used |
| `react` | 19.2.4 | UI library | Used |
| `react-dom` | 19.2.4 | DOM renderer | Used |
| `@prisma/client` | ^7.8.0 | ORM client | Used |
| `prisma` | ^7.8.0 | ORM CLI | Used |
| `@auth/prisma-adapter` | ^2.9.0 | Auth.js Prisma adapter | Used |
| `@tanstack/react-query` | ^5.101.2 | Server state | Unused |
| `next-auth` | ^5.0.0-beta.31 | Auth | Used |
| `next-pwa` | ^5.6.0 | PWA support | Used |
| `next-safe-action` | ^8.5.5 | Type-safe actions | Unused |
| `zod` | ^4.4.3 | Validation | Used |
| `lucide-react` | ^1.24.0 | Icons | Used |
| `bcryptjs` | ^3.0.3 | Password hashing | Used |
| `html5-qrcode` | ^2.3.8 | QR scanner | Used |
| `qrcode.react` | ^4.2.0 | QR code generator | Used |
| `zustand` | ^5.0.14 | State management | Used |
| `ioredis` | ^5.11.1 | Redis client | Unused |
| `better-sqlite3` | ^12.11.1 | SQLite driver | Used |

### Dev
| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^4 | CSS framework |
| `@tailwindcss/postcss` | ^4 | PostCSS plugin |
| `typescript` | ^5 | Type checking |
| `eslint` | ^9 | Linting |
| `eslint-config-next` | 16.2.10 | Next.js ESLint rules |
| `dotenv` | ^17.4.2 | Env loading |
| `@types/node` | ^20 | Node types |
| `@types/react` | ^19 | React types |
| `@types/react-dom` | ^19 | React DOM types |
| `@types/bcryptjs` | ^2.4.6 | bcryptjs types |

## Project Structure

```
online-presence/
  .env                              # DATABASE_URL, AUTH_SECRET, AUTH_URL
  AGENTS.md
  next.config.ts                    # PWA + reactStrictMode + turbopack
  package.json                      # v0.1.0
  postcss.config.mjs
  prisma.config.ts                  # Prisma config with dotenv
  tsconfig.json                     # strict mode, @/* alias
  eslint.config.mjs
  src/middleware.ts                  # Route protection (redirect to /auth)
  prisma/
    schema.prisma                   # 6 models
    seed.ts                         # Seed script (admin + 2 teachers)
  public/
    manifest.json
    sw.js                           # Generated service worker
    workbox-4754cb34.js             # Generated workbox
    icons/
      icon-192x192.png
      icon-512x512.png
    reference/                      # HTML design mockups
  src/
    app/
      layout.tsx                    # Root layout (lang="id", metadata, AuthProvider)
      globals.css                   # Design tokens, fonts, animations
      page.tsx                      # Dashboard home (real QR from session)
      auth/page.tsx                 # Login/Register (real API, PWA banner)
      scan/page.tsx                 # QR scanner (live camera html5-qrcode)
      manual/page.tsx               # Manual attendance (real APIs)
      analisa/page.tsx              # Attendance analysis (real API)
      laporan/page.tsx              # Reports (real API)
      halangan/page.tsx             # Obstacles hub
      halangan/[category]/page.tsx  # Obstacle form (real API)
      pengaturan/page.tsx           # Settings (real APIs)
      api/
        auth/
          [...nextauth]/route.ts    # Auth.js route handler
          register/route.ts         # Register endpoint (Zod)
        profile/
          route.ts                  # Profile GET/PUT (Zod)
          avatar/route.ts           # Avatar upload
        attendance/
          route.ts                  # Attendance GET/POST (Zod)
          last/route.ts             # Today's status
          check-out/route.ts        # Check-out (Zod)
          analysis/route.ts         # Monthly analysis
        scan/route.ts               # QR scan submit (Zod)
        obstacles/route.ts          # Obstacles GET/POST (Zod)
        notifications/
          preferences/route.ts      # Notif prefs GET/PUT (Zod)
        reports/route.ts            # Reports list
    components/
      layout/
        index.ts
        DashboardLayout.tsx
        Header.tsx                  # Uses useSession()
        BottomNav.tsx
      providers/
        SessionProvider.tsx         # Auth.js wrapper
      ui/
        QrUserId.tsx               # QR code generator
    lib/
      prisma.ts                    # PrismaClient singleton + BetterSqlite3 adapter
      auth.ts                      # Auth.js v5 config (credentials, JWT)
      validations.ts               # Zod schemas (all form inputs)
      api-response.ts              # API error/success helpers
      upload.ts                    # File upload utility
    store/
      useAppStore.ts                # Zustand (isOnline only)
    types/
      next-pwa.d.ts                 # Type declarations
```

## Code Conventions

- TypeScript strict mode
- Use `@/*` alias for imports from `src/`
- App Router structure in `src/app/`
- Zustand stores in `src/store/`
- Prisma schema in `prisma/schema.prisma`
- Auth config in `src/lib/auth.ts`
- All API routes use Zod validation where user input is accepted
- All pages fetch from real API routes
