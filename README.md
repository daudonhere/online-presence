# Absensi Al-Riyadl

Aplikasi Absensi Guru (Teacher Attendance System) untuk MTS AL-RIYADL. Fullstack Next.js 16 (App Router) dengan Supabase (PostgreSQL), Auth.js v5, dan PWA.

## Fitur

- **QR Code Attendance** — Guru scan QR admin untuk absen hadir (geofence 10m via GPS)
- **Manual Attendance** — Absen manual dengan persetujuan admin
- **Halangan Hub** — Ajukan sakit/izin/cuti dengan upload bukti, admin approve/reject
- **Analisa Kehadiran** — Grafik harian + rincian mingguan (admin: semua guru, guru: personal)
- **Laporan** — Download PDF & Excel (rekap guru, personal, halangan)
- **Manajemen Guru** — CRUD guru (admin), inline edit, detail kehadiran
- **Push Notifications** — Web Push + in-app notifications via VAPID
- **PWA** — Installable, offline fallback, service worker

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| UI | Tailwind CSS v4, lucide-react |
| State | Zustand, React Query |
| Database | PostgreSQL via Supabase |
| Storage | Supabase Storage (avatars, obstacles) |
| Auth | Auth.js v5 (credentials, JWT) |
| Validation | Zod v4 |
| PWA | next-pwa |
| Password | bcryptjs |
| QR | qrcode.react (generate), html5-qrcode (scan) |
| Charts | SVG (custom), xlsx (SheetJS) for Excel |
| Push | Web Push (VAPID) |
| Testing | Vitest (121 tests) |

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure .env with your Supabase credentials

# Create database tables
# Run the SQL in supabase/migrations/000_initial_schema.sql via Supabase SQL Editor

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest |
| `npm run test:watch` | Run Vitest in watch mode |

## Project Structure

```
src/
  app/                    # Next.js App Router pages & API routes
    api/                  # REST API endpoints
    auth/                 # Login & Register
    scan/                 # QR scanner (camera)
    manual/               # Manual attendance form
    analisa/              # Attendance analysis charts
    laporan/              # Reports with PDF/Excel export
    halangan/             # Obstacle submissions (sakit/izin/cuti)
    pengaturan/           # Settings & profile
    guru/                 # Teacher management (admin)
  components/             # UI components (layout, providers, ui)
  lib/                    # Utilities (auth, supabase, validations, push)
  store/                  # Zustand store
  types/                  # TypeScript declarations
supabase/
  migrations/             # SQL migration files
```

## Default Admin

| Field | Value |
|-------|-------|
| Phone | `08123456789` |
| Password | `Tiger1SHA12@` |

## License

[MIT](LICENSE)
