import webPush from "web-push";
import { getSupabase } from "./supabase";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@alriyadl.sch.id";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export async function sendPushToUser(
  userId: number,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const supabase = getSupabase();

  const { data: subs } = await supabase
    .from("PushSubscription")
    .select("*")
    .eq("userId", userId);

  if (!subs || subs.length === 0) return { sent: 0, failed: 0 };

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-192x192.png",
    url: payload.url || "/",
    tag: payload.tag || "absensi-notification",
  });

  let sent = 0;
  let failed = 0;

  const endpointsToRemove: string[] = [];

  for (const sub of subs) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notificationPayload
      );
      sent++;
    } catch (err: unknown) {
      failed++;
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        endpointsToRemove.push(sub.endpoint);
      }
    }
  }

  if (endpointsToRemove.length > 0) {
    await supabase
      .from("PushSubscription")
      .delete()
      .in("endpoint", endpointsToRemove);
  }

  return { sent, failed };
}

export async function sendPushToRole(
  role: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const supabase = getSupabase();

  const { data: users } = await supabase
    .from("User")
    .select("id")
    .eq("role", role);

  if (!users || users.length === 0) return { sent: 0, failed: 0 };

  let totalSent = 0;
  let totalFailed = 0;

  for (const user of users) {
    const result = await sendPushToUser(user.id, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { sent: totalSent, failed: totalFailed };
}

export async function sendPushToAllAdmins(
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  return sendPushToRole("admin", payload);
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
