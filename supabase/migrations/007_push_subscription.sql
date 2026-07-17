-- PushSubscription table for Web Push Notifications
CREATE TABLE IF NOT EXISTS "PushSubscription" (
  id          SERIAL PRIMARY KEY,
  userId      INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  userAgent   TEXT,
  createdAt   TIMESTAMP DEFAULT NOW(),
  updatedAt   TIMESTAMP DEFAULT NOW(),
  UNIQUE(userId, endpoint)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscription_user_id ON "PushSubscription"(userId);
CREATE INDEX IF NOT EXISTS idx_push_subscription_endpoint ON "PushSubscription"(endpoint);
