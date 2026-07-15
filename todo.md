# TODO — Backend Development

## Progress

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | Pending | Foundation (seed, error handling, security) |
| 1 | Pending | Database setup |
| 2 | Pending | Auth |
| 3 | Pending | Core features (profile, attendance, obstacle, notifications) |
| 4 | Pending | Analytics & reports |
| 5 | Pending | Admin dashboard (future) |
| 6 | Pending | Polish (validation, state management, PWA) |
| 7 | Pending | Testing |
| 8 | Pending | Deployment |

## MVP Scope (Phase 1-3)

Minimum Viable Product = guru bisa login, absen (QR/manual), submit halangan, lihat profil.

- [ ] Database schema + seed data
- [ ] Auth (register/login/logout)
- [ ] Manual attendance (check-in + check-out)
- [ ] QR scan attendance (static per guru)
- [ ] Obstacle submission (sakit/izin/cuti)
- [ ] Profile view & edit
- [ ] Notification preferences toggle
- [ ] Middleware route protection

**Tidak di MVP:** Admin dashboard, report generation, analytics real-time, notification push.

## Phase 0: Foundation

### 0.1 Seed Data
- [ ] Create seed script (`prisma/seed.ts`)
- [ ] Seed 1 admin user: phone `081111111111`, password `admin123`, role `admin`
- [ ] Seed 2 teacher users: phone `081222222222` / `081333333333`, password `guru123`
- [ ] Seed profiles for each teacher (subject, nip, email)
- [ ] Seed notification preferences for each user
- [ ] Add `"seed": "npx tsx prisma/seed.ts"` to package.json scripts

### 0.2 Error Handling
- [ ] Create error response utility (`src/lib/api-error.ts`) — consistent `{ error: string, status: number }` format
- [ ] Add try/catch wrapper for all API routes
- [ ] Add error boundary for client pages (`src/components/ErrorBoundary.tsx`)
- [ ] Handle Prisma errors: unique constraint, foreign key, not found
- [ ] Handle file upload errors: too large, wrong type, missing file

### 0.3 Security
- [ ] Hash passwords with bcryptjs (salt rounds: 10)
- [ ] Add rate limiting on auth routes (max 5 attempts per minute)
- [ ] Sanitize user input (trim, escape)
- [ ] Validate file uploads: check MIME type, not just extension
- [ ] Add CSRF protection (Auth.js handles this)
- [ ] Ensure user can only access their own data (check userId in session)

## Phase 1: Database Setup

### 1.1 Prisma Schema
- [ ] Define `User` model (phone, password, name, role, qrToken)
- [ ] Define `Profile` model (userId, subject, nip, email, avatarUrl)
- [ ] Define `Attendance` model (userId, date, checkInTime, checkOutTime, notes, status, source)
- [ ] Define `Obstacle` model (userId, category, date, reason, fileUrl, status, reviewedBy, reviewedAt)
- [ ] Define `NotificationPreference` model (userId, reminderMasuk, reminderPulang, monthlySummary)
- [ ] Define `Report` model (title, period, fileUrl, status)
- [ ] Add relations: User→Profile (1:1), User→Attendance (1:N), User→Obstacle (1:N), User→NotificationPreference (1:1)
- [ ] Add `@@unique([userId, date])` on Attendance
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Run `npx prisma generate`

### 1.2 File Upload Setup
- [ ] Create `public/uploads/avatars/` directory
- [ ] Create `public/uploads/obstacles/` directory
- [ ] Create `public/uploads/reports/` directory
- [ ] Create upload utility (`src/lib/upload.ts`) — handle file save, validate size (max 1MB avatar, max 1MB obstacle), validate type

## Phase 2: Auth

### 2.1 Auth Configuration
- [ ] Install & configure Auth.js v5 (`src/lib/auth.ts`)
- [ ] Set up Prisma adapter for Auth.js
- [ ] Configure credentials provider (phone + password)
- [ ] Create `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Create `SessionProvider` wrapper in root layout

### 2.2 Auth API
- [ ] `POST /api/auth/register` — create User + Profile + NotificationPreference, hash password with bcryptjs
- [ ] `POST /api/auth/login` — authenticate via Auth.js
- [ ] `POST /api/auth/logout` — end session

### 2.3 Auth Pages
- [ ] Update `/auth` page to call real API (replace `alert()`)
- [ ] Add middleware to protect routes (redirect to `/auth` if not logged in)
- [ ] Add middleware to protect `/auth` if already logged in (redirect to `/`)

## Phase 3: Core Features

### 3.1 Profile
- [ ] `GET /api/profile` — get current user + profile
- [ ] `PUT /api/profile` — update biodata (name, subject, nip, email, phone)
- [ ] `POST /api/profile/avatar` — upload avatar (max 1MB, jpg/png), save to `public/uploads/avatars/`
- [ ] Update `/pengaturan` page to call real APIs

### 3.2 Attendance — Manual
- [ ] `POST /api/attendance` — create attendance record (source: "manual")
- [ ] `GET /api/attendance?month=&year=` — list attendance for current user
- [ ] `GET /api/attendance/last` — get last attendance status
- [ ] `POST /api/attendance/check-out` — update checkOutTime
- [ ] Update `/manual` page to call real APIs

### 3.3 Attendance — QR Scan
- [ ] Generate static QR code per teacher (encode qrToken or URL)
- [ ] `POST /api/scan` — validate qrToken, create attendance (source: "qr")
- [ ] Add QR display in `/pengaturan` (show teacher's QR code)
- [ ] Integrate QR scanning library in `/scan` page (e.g. `html5-qrcode`)

### 3.4 Obstacle (Halangan)
- [ ] `POST /api/obstacles` — create obstacle (date, category, reason, file)
- [ ] `POST /api/obstacles/upload` — upload bukti file (max 1MB, pdf/jpg/png)
- [ ] `GET /api/obstacles` — list user's obstacles
- [ ] Update `/halangan/[category]` page to call real APIs

### 3.5 Notification Preferences
- [ ] `GET /api/notifications/preferences` — get preferences
- [ ] `PUT /api/notifications/preferences` — update toggles
- [ ] Update `/pengaturan` notification toggles to call real APIs

## Phase 4: Analytics & Reports

### 4.1 Attendance Analysis
- [ ] `GET /api/attendance/analysis?month=&year=` — calculate percentage, weekly breakdown, daily chart data
- [ ] Update `/analisa` page to call real API (replace hardcoded data)

### 4.2 Reports
- [ ] `GET /api/reports?month=&year=` — list reports
- [ ] `GET /api/reports/:id/download` — download report file
- [ ] `POST /api/reports/generate` — admin: generate report file (PDF/Excel)
- [ ] Update `/laporan` page to call real APIs

## Phase 5: Admin Features

### 5.1 Admin Dashboard (future)
- [ ] `GET /api/admin/teachers` — list all teachers
- [ ] `GET /api/admin/teachers/:id` — get teacher detail
- [ ] `PUT /api/admin/teachers/:id` — update teacher
- [ ] `DELETE /api/admin/teachers/:id` — delete teacher
- [ ] `PATCH /api/obstacles/:id` — approve/reject obstacle (updates Attendance status)
- [ ] Create admin pages (teacher management, obstacle review, report generation)

## Phase 6: Polish

### 6.1 Validation
- [ ] Create Zod schemas for all form inputs
- [ ] Add server-side validation on all API routes
- [ ] Add client-side validation with error messages

### 6.2 State Management
- [ ] Set up React Query for server state (attendance, profile, obstacles)
- [ ] Create query keys constants
- [ ] Add loading states and error handling to all pages

### 6.3 PWA
- [ ] Test service worker in production build
- [ ] Test install prompt flow
- [ ] Add offline fallback page

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
- [ ] Environment variables for production (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
- [ ] Run `npx prisma migrate deploy` in production
- [ ] Build with `npm run build`
- [ ] Test all critical flows in production-like environment

### 8.2 Production Checklist
- [ ] HTTPS enabled (required for PWA + service worker)
- [ ] Database file backed up (SQLite: copy `prisma/dev.db`)
- [ ] Upload directories writable
- [ ] Service worker registered and active
- [ ] Auth session working (check NEXTAUTH_SECRET)

---

## File Upload Limits

| Type | Max Size | Allowed Formats | Path |
|------|----------|-----------------|------|
| Avatar | 1 MB | .jpg, .jpeg, .png | `public/uploads/avatars/` |
| Obstacle bukti | 1 MB | .pdf, .jpg, .jpeg, .png | `public/uploads/obstacles/` |
| Report file | — | .pdf, .xlsx | `public/uploads/reports/` |

## Database Schema Summary

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

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | No | Register |
| `/api/auth/login` | POST | No | Login |
| `/api/auth/logout` | POST | Yes | Logout |
| `/api/profile` | GET | Yes | Get profile |
| `/api/profile` | PUT | Yes | Update profile |
| `/api/profile/avatar` | POST | Yes | Upload avatar |
| `/api/attendance` | GET | Yes | List attendance |
| `/api/attendance` | POST | Yes | Manual check-in |
| `/api/attendance/check-out` | POST | Yes | Check-out |
| `/api/attendance/last` | GET | Yes | Last status |
| `/api/attendance/analysis` | GET | Yes | Monthly analysis |
| `/api/scan` | POST | Yes | QR scan check-in |
| `/api/obstacles` | GET | Yes | List obstacles |
| `/api/obstacles` | POST | Yes | Submit obstacle |
| `/api/obstacles/:id` | PATCH | Admin | Approve/reject |
| `/api/notifications/preferences` | GET | Yes | Get preferences |
| `/api/notifications/preferences` | PUT | Yes | Update preferences |
| `/api/reports` | GET | Yes | List reports |
| `/api/reports/generate` | POST | Admin | Generate report |
| `/api/reports/:id/download` | GET | Yes | Download report |
| `/api/admin/teachers` | GET | Admin | List teachers |
| `/api/admin/teachers/:id` | GET/PUT/DELETE | Admin | Manage teacher |
