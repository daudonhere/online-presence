-- ============================================================
-- Absensi Al-Riyadl — Initial Schema
-- Run this in Supabase SQL Editor to create all tables.
-- ============================================================

-- 1. User
CREATE TABLE IF NOT EXISTS "User" (
  "id"        SERIAL PRIMARY KEY,
  "phone"     TEXT NOT NULL UNIQUE,
  "password"  TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "role"      TEXT NOT NULL DEFAULT 'teacher',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "User_role_idx"    ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_phone_idx"   ON "User"("phone");

-- 2. Profile
CREATE TABLE IF NOT EXISTS "Profile" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    INTEGER NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "subject"   TEXT NOT NULL DEFAULT '',
  "nip"       TEXT NOT NULL DEFAULT '',
  "email"     TEXT NOT NULL DEFAULT '',
  "avatarUrl" TEXT,
  "location"  TEXT DEFAULT '',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Attendance
CREATE TABLE IF NOT EXISTS "Attendance" (
  "id"           SERIAL PRIMARY KEY,
  "userId"       INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "date"         DATE NOT NULL,
  "checkInTime"  TEXT,
  "checkOutTime" TEXT,
  "notes"        TEXT,
  "status"       TEXT NOT NULL DEFAULT 'hadir',
  "source"       TEXT,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "Attendance_userId_date_unique" UNIQUE ("userId", "date")
);

-- Composite index: user + date range (teacher personal queries, reports, cron)
CREATE INDEX IF NOT EXISTS "Attendance_userId_date_idx" ON "Attendance"("userId", "date");

-- Single column: admin queries filter by date range without userId (analysis, reports)
CREATE INDEX IF NOT EXISTS "Attendance_date_idx" ON "Attendance"("date");

-- Status filter (analysis summary, cron)
CREATE INDEX IF NOT EXISTS "Attendance_status_idx" ON "Attendance"("status");

-- 4. Obstacle (halangan)
CREATE TABLE IF NOT EXISTS "Obstacle" (
  "id"         SERIAL PRIMARY KEY,
  "userId"     INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "category"   TEXT NOT NULL,
  "date"       DATE NOT NULL,
  "reason"     TEXT NOT NULL,
  "fileUrl"    TEXT,
  "status"     TEXT NOT NULL DEFAULT 'pending',
  "reviewedBy" INTEGER REFERENCES "User"("id") ON DELETE SET NULL,
  "reviewedAt" TIMESTAMP,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User's obstacles ordered by createdAt DESC (GET /api/obstacles)
CREATE INDEX IF NOT EXISTS "Obstacle_userId_createdAt_idx" ON "Obstacle"("userId", "createdAt" DESC);

-- Admin analysis: today's approved obstacles by date + status
CREATE INDEX IF NOT EXISTS "Obstacle_date_status_idx" ON "Obstacle"("date", "status");

-- Teacher analysis: user + approved + date range
CREATE INDEX IF NOT EXISTS "Obstacle_userId_status_date_idx" ON "Obstacle"("userId", "status", "date");

-- Admin reports: approved obstacles by date range
CREATE INDEX IF NOT EXISTS "Obstacle_status_date_idx" ON "Obstacle"("status", "date");

-- Optional category filter (admin obstacles list)
CREATE INDEX IF NOT EXISTS "Obstacle_category_idx" ON "Obstacle"("category");

-- 5. NotificationPreference
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id"             SERIAL PRIMARY KEY,
  "userId"         INTEGER NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "reminderMasuk"  BOOLEAN NOT NULL DEFAULT TRUE,
  "reminderPulang" BOOLEAN NOT NULL DEFAULT TRUE,
  "monthlySummary" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Cron: find users with morning reminder enabled
CREATE INDEX IF NOT EXISTS "NotificationPreference_reminderMasuk_idx" ON "NotificationPreference"("reminderMasuk");

-- Cron: find users with monthly summary enabled
CREATE INDEX IF NOT EXISTS "NotificationPreference_monthlySummary_idx" ON "NotificationPreference"("monthlySummary");

-- 6. Notification
CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title"     TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "type"      TEXT NOT NULL DEFAULT 'system',
  "isRead"    BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User's notifications ordered by createdAt DESC (GET /api/notifications)
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);

-- Mark all read: userId + isRead filter
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- 7. PushSubscription
CREATE TABLE IF NOT EXISTS "PushSubscription" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "endpoint"  TEXT NOT NULL,
  "p256dh"    TEXT NOT NULL,
  "auth"      TEXT NOT NULL,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "PushSubscription_userId_endpoint_unique" UNIQUE ("userId", "endpoint")
);

CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx"   ON "PushSubscription"("userId");
CREATE INDEX IF NOT EXISTS "PushSubscription_endpoint_idx" ON "PushSubscription"("endpoint");

-- 8. Report
CREATE TABLE IF NOT EXISTS "Report" (
  "id"        SERIAL PRIMARY KEY,
  "title"     TEXT NOT NULL,
  "period"    TEXT NOT NULL,
  "fileUrl"   TEXT NOT NULL,
  "status"    TEXT NOT NULL DEFAULT 'ready',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Seed: admin account
-- Password: Tiger1SHA12@ (bcryptjs hashed)
-- ============================================================
INSERT INTO "User" ("phone", "password", "name", "role")
VALUES (
  '08123456789',
  '$2a$10$EqKcp1WFKVQISheBxnEOj.gBOKBQw7aPOCP3KGBz5R.LI3QFyS1gO',
  'Admin Al-Riyadl',
  'admin'
)
ON CONFLICT ("phone") DO NOTHING;

-- Profile for admin
INSERT INTO "Profile" ("userId", "subject", "nip", "email")
SELECT "id", 'Administrator', 'NIP0001', 'admin@al-riyadl.sch.id'
FROM "User"
WHERE "phone" = '08123456789'
  AND NOT EXISTS (SELECT 1 FROM "Profile" WHERE "userId" = (SELECT "id" FROM "User" WHERE "phone" = '08123456789'));

-- NotificationPreference for admin
INSERT INTO "NotificationPreference" ("userId")
SELECT "id"
FROM "User"
WHERE "phone" = '08123456789'
  AND NOT EXISTS (SELECT 1 FROM "NotificationPreference" WHERE "userId" = (SELECT "id" FROM "User" WHERE "phone" = '08123456789'));

