# TODO — Backend Development

## Progress

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | Done | Foundation (seed, error handling, security) |
| 1 | Done | Database setup (Supabase PostgreSQL + Storage) |
| 2 | Done | Auth (register/login/logout/change-password, middleware, session) |
| 3 | Done | Core features (profile, attendance, obstacle, notifications) |
| 4 | Done | Analytics & reports |
| 5 | Partial | Admin halangan (persetujuan + riwayat) + admin analisa |
| 6 | Done | Polish (Zod, lint, React Query, PWA offline page) |
| 7 | Pending | Testing |
| 8 | Pending | Deployment (Vercel + Supabase) |

## MVP Scope (Phase 1-3)

Minimum Viable Product = guru bisa login, absen (QR/manual), submit halangan, lihat profil.

- [x] Database schema + seed data
- [x] Auth (register/login/logout)
- [x] Manual attendance (check-in + check-out)
- [x] QR scan attendance (live camera via html5-qrcode)
- [x] Obstacle submission (sakit/izin/cuti)
- [x] Profile view & edit
- [x] Notification preferences toggle (reminderMasuk + monthlySummary, UI shows 2 toggles)
- [x] Middleware route protection

**Tidak di MVP:** Admin dashboard, report generation, analytics real-time, notification push.

## Phase 0: Foundation

### 0.1 Seed Data
- [x] Create seed script (migrated to Supabase)
- [x] Seed 1 admin user: phone `08123456789`, password `Tiger1SHA12@`, role `admin`
- [x] Seed 2 teacher users: phone `081222222222` / `081333333333`, password `guru123`
- [x] Seed profiles for each teacher (subject, nip, email)
- [x] Seed notification preferences for each user

### 0.2 Error Handling
- [x] Create error response utility (`src/lib/api-response.ts`) — consistent `{ error: string, status: number }` format
- [x] Add try/catch wrapper for all API routes (`withErrorHandling` HOF)
- [x] Add error boundary: `error.tsx`, `not-found.tsx`, `global-error.tsx`
- [x] Handle file upload errors: too large, wrong type, missing file

### 0.3 Security
- [x] Hash passwords with bcryptjs (salt rounds: 10)
- [x] Add rate limiting on auth routes (max 5 attempts per minute) — `src/lib/rate-limit.ts`
- [x] Sanitize user input (strip HTML tags) — `sanitize()` in validations.ts, applied via Zod `.transform()`
- [x] Validate file uploads: magic byte detection (JPEG/PNG/PDF) — `src/lib/upload.ts`
- [x] Add CSRF protection (Auth.js handles this)
- [x] Ensure user can only access their own data (check userId in session)

## Phase 1: Database Setup

### 1.1 Database Schema (PostgreSQL via Supabase)
- [x] Create PostgreSQL schema via Supabase SQL Editor (6 tables)
- [x] Define `User` table (phone, password, name, role)
- [x] Define `Profile` table (userId, subject, nip, email, avatarUrl)
- [x] Define `Attendance` table (userId, date, checkInTime, checkOutTime, notes, status, source)
- [x] Define `Obstacle` table (userId, category, date, reason, fileUrl, status, reviewedBy, reviewedAt)
- [x] Define `NotificationPreference` table (userId, reminderMasuk, reminderPulang, monthlySummary)
- [x] Define `Report` table (title, period, fileUrl, status)
- [x] Add unique constraint: `Attendance(userId, date)`

### 1.2 File Upload Setup
- [x] Configure Supabase Storage buckets: `avatars` (public), `obstacles` (public)
- [x] Create upload utility (`src/lib/upload.ts`) — Supabase Storage upload, magic byte validation, size limits (1MB)

## Phase 2: Auth

### 2.1 Auth Configuration
- [x] Install & configure Auth.js v5 (`src/lib/auth.ts`)
- [x] Configure credentials provider (phone + password)
- [x] Create `src/app/api/auth/[...nextauth]/route.ts`
- [x] Create `SessionProvider` wrapper in root layout

### 2.2 Auth API
- [x] `POST /api/auth/register` — create User + Profile + NotificationPreference, hash password with bcryptjs, Zod validation
- [x] `POST /api/auth/login` — authenticate via Auth.js
- [x] `POST /api/auth/logout` — end session (via Auth.js signOut)

### 2.3 Auth Pages
- [x] Update `/auth` page to call real API (replace `alert()`)
- [x] Add middleware to protect routes (redirect to `/auth` if not logged in)
- [x] Add middleware to protect `/auth` if already logged in (redirect to `/`)
- [x] PWA install banner with X close button, sessionStorage dismiss

## Phase 3: Core Features

### 3.1 Profile
- [x] `GET /api/profile` — get current user + profile (Supabase)
- [x] `PUT /api/profile` — update biodata (name, subject, nip, email, phone), Zod validation (Supabase)
- [x] `POST /api/profile/avatar` — upload avatar (max 1MB, jpg/png), save to Supabase Storage (`avatars` bucket)
- [x] Update `/pengaturan` page to call real APIs

### 3.2 Attendance — Manual
- [x] `POST /api/attendance` — create attendance record (source: "manual"), Zod validation (Supabase)
- [x] `GET /api/attendance?month=&year=` — list attendance for current user (Supabase)
- [x] `GET /api/attendance/last` — get last attendance status (Supabase)
- [x] `POST /api/attendance/check-out` — update checkOutTime, Zod validation (Supabase)
- [x] Update `/manual` page to call real APIs + React Query

### 3.3 Attendance — QR Scan
- [x] Generate static QR code per teacher (encode `ATTENDANCE:USER:{id}:{name}`)
- [x] `POST /api/scan` — validate qrData, create attendance (source: "qr"), Zod validation (Supabase)
- [x] Add QR display on homepage (`QrUserId.tsx` component, `qrcode.react`)
- [x] Integrate QR scanning library in `/scan` page (`html5-qrcode`, live camera)
- [x] Refactor `/scan` page with React Query

### 3.4 Obstacle (Halangan)
- [x] `POST /api/obstacles` — create obstacle (date, category, reason), Zod validation (Supabase)
- [x] `GET /api/obstacles` — list user's obstacles (Supabase)
- [x] Update `/halangan/[category]` page to call real APIs + React Query

### 3.5 Notification Preferences
- [x] `GET /api/notifications/preferences` — get preferences (Supabase)
- [x] `PUT /api/notifications/preferences` — update toggles, Zod validation (Supabase)
- [x] Update `/pengaturan` notification toggles to call real APIs

## Phase 4: Analytics & Reports

### 4.1 Attendance Analysis
- [x] `GET /api/attendance/analysis?month=&year=` — calculate percentage, weekly breakdown, daily chart data (Supabase)
- [x] Update `/analisa` page to call real API (replace hardcoded data) + React Query

### 4.2 Reports
- [x] `GET /api/reports?month=&year=` — list reports (Supabase)
- [x] `/laporan` page with custom dropdown styling, PDF export, Excel export + React Query
- [x] `POST /api/reports/generate` — admin: generate report file (HTML + CSV)
- [x] `GET /api/reports/:id/download` — download report file

## Phase 5: Admin Features

### 5.1 Admin Halangan
- [x] Admin hub page (`/halangan`) — shows 2 cards: Persetujuan + Riwayat (teacher sees 3 category cards)
- [x] Admin Persetujuan page (`/halangan/admin/persetujuan`) — period filter (month/year pills), search by name/phone, approve/reject buttons, file download via fetch+blob
- [x] Admin Riwayat page (`/halangan/admin/riwayat`) — period filter, search, history items with status badges, checkbox multi-select, bulk delete, single delete icon, file download
- [x] `GET /api/admin/obstacles?category=&month=&year=` — list all obstacles with filters
- [x] `PATCH /api/admin/obstacles/:id` — approve/reject (creates Attendance on approve), `await ctx.params`
- [x] `DELETE /api/admin/obstacles/:id` — delete single + Supabase storage cleanup
- [x] `DELETE /api/admin/obstacles` — bulk delete (`{ ids: number[] }`) or delete all (`{ all: true }`)

### 5.2 Admin Analisa
- [x] Admin analisa view — big stat "Guru Hadir Hari Ini", 3 cards (Sakit Hari Ini, Izin Hari Ini, Tidak Hadir), SVG line chart (daily hadir), weekly breakdown Mon-Sat
- [x] Analysis API admin branch — `todayHadir`, `todayIzin`, `todaySakit`, `tidakHadirHari`, `dailyChart`, `weeks`; uses `localDate()` for WIB timezone

### 5.3 Admin Dashboard (future)
- [ ] `GET /api/admin/teachers` — list all teachers
- [ ] `GET /api/admin/teachers/:id` — get teacher detail
- [ ] `PUT /api/admin/teachers/:id` — update teacher
- [ ] `DELETE /api/admin/teachers/:id` — delete teacher
- [ ] Create admin pages (teacher management)

## Phase 6: Polish

### 6.1 Validation
- [x] Create Zod schemas for all form inputs (`src/lib/validations.ts`) + `sanitize()` function
- [x] Add server-side validation on all API routes (7 routes: register, profile, attendance, check-out, scan, obstacles, notifications)
- [x] Add client-side validation with error messages (`useFormValidation` hook + `FieldError` component)

### 6.2 Lint Fixes
- [x] Fix `react-hooks/set-state-in-effect` in `/laporan` (useEffect → inline async)
- [x] Fix `react-hooks/exhaustive-deps` in `/laporan`
- [x] Remove unused `router` import in `/pengaturan`
- [x] Suppress `@next/next/no-img-element` in avatar display
- [x] Refactored all pages to React Query (eliminated manual useEffect fetch patterns)

### 6.3 State Management
- [x] Install & configure React Query (`@tanstack/react-query`) via `Providers` component
- [x] Create query keys constants (`src/lib/query-keys.ts`) — attendance, analysis, reports, profile, notifications, obstacles
- [x] Refactor `/analisa` page — `useQuery` for analysis data
- [x] Refactor `/laporan` page — `useQuery` for reports list
- [x] Refactor `/manual` page — `useQuery` for last attendance + month records, `useMutation` for check-in/check-out
- [x] Refactor `/scan` page — `useMutation` for QR submit
- [x] Refactor `/pengaturan` page — `useQuery` for profile + notifications, `useMutation` for save profile, avatar upload, notification toggle
- [x] Refactor `/halangan/[category]` page — `useMutation` for obstacle submit

### 6.4 PWA
- [ ] Test service worker in production build
- [ ] Test install prompt flow
- [x] Add offline fallback page (`src/app/offline/page.tsx`)

### 6.5 Additional Features
- [x] QR code click-to-download as PNG (`QrUserId.tsx` — SVG→canvas→PNG, named `QR-{name}.png`)
- [x] Change password API (`POST /api/auth/change-password`) — verify current password, hash new with bcryptjs
- [x] Password modal: current password field + new password + retype, loading state, success/error feedback
- [x] Admin halangan hub: admin sees Persetujuan + Riwayat cards, teacher sees 3 category cards
- [x] Admin analisa: admin gets all-teacher stats, teacher gets personal stats; uses `localDate()` for WIB
- [x] Notification bell component (`NotificationBell.tsx`) + notification API routes
- [x] Custom DatePicker component (`DatePicker.tsx`) — DD/MM/YYYY, no past dates
- [x] React Query configured via `Providers` component + query keys in `query-keys.ts`

## Phase 7: Testing

### 7.1 Unit Tests
- [ ] Test password hashing (bcryptjs)
- [ ] Test Zod validation schemas
- [ ] Test file upload utility (size, type validation)
- [ ] Test attendance status calculation

### 7.2 API Tests
- [ ] Test auth flow: register → login → access protected → logout
- [ ] Test attendance: manual check-in → check-out → list
- [ ] Test obstacles: submit → list → admin approve
- [ ] Test profile: get → update → upload avatar
- [ ] Test error cases: duplicate phone, wrong password, unauthorized access

### 7.3 Integration Tests
- [ ] Test full attendance flow: register → scan QR → see in analisa
- [ ] Test obstacle flow: submit → admin approve → status updates in attendance

## Phase 8: Deployment

### 8.1 Pre-deploy
- [x] Set up Supabase project (PostgreSQL + Storage)
- [x] Migrate all API routes from Prisma to Supabase (`@supabase/supabase-js`)
- [x] Remove Prisma, SQLite, Turso dependencies
- [x] Configure Supabase buckets: `avatars` (public), `obstacles` (public)
- [ ] Set environment variables in Vercel (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `AUTH_SECRET`, `AUTH_URL`)
- [ ] Build with `npm run build`
- [ ] Test all critical flows in production

### 8.2 Production Checklist
- [ ] HTTPS enabled (required for PWA + service worker)
- [ ] Service worker registered and active
- [ ] Auth session working (check AUTH_SECRET)
- [ ] Supabase Storage buckets accessible (avatars, obstacles)

---

## File Upload Limits

| Type | Max Size | Allowed Formats | Storage |
|------|----------|-----------------|---------|
| Avatar | 1 MB | .jpg, .jpeg, .png | Supabase Storage (`avatars` bucket) |
| Obstacle bukti | 1 MB | .pdf, .jpg, .jpeg, .png | Supabase Storage (`obstacles` bucket) |
| Report file | — | .html, .csv | Filesystem (server-side generation) |

## Zod Schemas (`src/lib/validations.ts`)

| Schema | Fields |
|--------|--------|
| `registerSchema` | name, phone (regex), password (min 6) |
| `loginSchema` | phone, password |
| `profileUpdateSchema` | name?, subject?, nip?, email?, phone? |
| `attendanceSchema` | date, time (HH:mm), notes? |
| `checkOutSchema` | time (HH:mm) |
| `obstacleSchema` | date, category (enum), reason (max 250) |
| `notificationPrefsSchema` | reminderMasuk?, reminderPulang?, monthlySummary? |
| `scanSchema` | qrData (regex: `ATTENDANCE:USER:{id}:{name}`) |

## Database Schema Summary (PostgreSQL via Supabase)

### User
```
id          Int       @id @default(autoincrement())
phone       String    @unique
password    String
name        String
role        String    @default("teacher")  // "teacher" | "admin"
qrToken     String    @unique @default(uuid())
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
createdAt   DateTime  @default(now())
updatedAt   DateTime  @updatedAt
```

### Attendance
```
id            Int       @id @default(autoincrement())
userId        Int       → User
date          DateTime  @db.Date
checkInTime   String?
checkOutTime  String?
notes         String?
status        String    @default("hadir")  // "hadir" | "izin" | "alpha" | "libur"
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

### Report
```
id        Int       @id @default(autoincrement())
title     String
period    String
fileUrl   String
status    String    @default("ready")  // "ready" | "generating" | "failed"
createdAt DateTime  @default(now())
```

## API Routes Summary

| Endpoint | Method | Auth | Validation | Purpose |
|----------|--------|------|------------|---------|
| `/api/auth/register` | POST | No | registerSchema | Register |
| `/api/auth/login` | POST | No | — | Login (via Auth.js) |
| `/api/auth/logout` | POST | Yes | — | Logout |
| `/api/auth/change-password` | POST | Yes | — | Change password (verify current + hash new) |
| `/api/profile` | GET | Yes | — | Get profile |
| `/api/profile` | PUT | Yes | profileUpdateSchema | Update profile |
| `/api/profile/avatar` | POST | Yes | — | Upload avatar |
| `/api/attendance` | GET | Yes | — | List attendance |
| `/api/attendance` | POST | Yes | attendanceSchema | Manual check-in |
| `/api/attendance/check-out` | POST | Yes | checkOutSchema | Check-out |
| `/api/attendance/last` | GET | Yes | — | Last status |
| `/api/attendance/analysis` | GET | Yes | — | Monthly analysis (admin: all teachers) |
| `/api/scan` | POST | Yes | scanSchema | QR scan check-in |
| `/api/obstacles` | GET | Yes | — | List obstacles |
| `/api/obstacles` | POST | Yes | obstacleSchema | Submit obstacle |
| `/api/notifications` | GET | Yes | — | List notifications |
| `/api/notifications/:id` | PATCH | Yes | — | Mark as read |
| `/api/notifications/:id` | DELETE | Yes | — | Delete notification |
| `/api/notifications/preferences` | GET | Yes | — | Get preferences |
| `/api/notifications/preferences` | PUT | Yes | notificationPrefsSchema | Update preferences |
| `/api/admin/obstacles` | GET | Admin | — | List all obstacles (category/month/year filters) |
| `/api/admin/obstacles/:id` | PATCH | Admin | — | Approve/reject obstacle |
| `/api/admin/obstacles/:id` | DELETE | Admin | — | Delete obstacle + storage file |
| `/api/admin/obstacles` | DELETE | Admin | — | Bulk delete / delete all obstacles |
| `/api/reports` | GET | Yes | — | List reports |
| `/api/reports/generate` | POST | Admin | — | Generate report |
| `/api/reports/:id` | GET | Yes | — | Download report |
| `/api/admin/teachers` | GET | Admin | — | List teachers (planned) |
| `/api/admin/teachers/:id` | GET/PUT/DELETE | Admin | — | Manage teacher (planned) |
