import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { notificationPrefsSchema } from "@/lib/validations";

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: Number(session.user.id) },
  });

  return apiSuccess({
    reminderMasuk: prefs?.reminderMasuk ?? true,
    reminderPulang: prefs?.reminderPulang ?? true,
    monthlySummary: prefs?.monthlySummary ?? false,
  });
});

export const PUT = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await req.json();
  const result = notificationPrefsSchema.safeParse(body);

  if (!result.success) {
    return apiError(result.error.issues[0].message, 400);
  }

  const { reminderMasuk, reminderPulang, monthlySummary } = result.data;

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: Number(session.user.id) },
    update: {
      ...(typeof reminderMasuk === "boolean" && { reminderMasuk }),
      ...(typeof reminderPulang === "boolean" && { reminderPulang }),
      ...(typeof monthlySummary === "boolean" && { monthlySummary }),
    },
    create: {
      userId: Number(session.user.id),
      reminderMasuk: reminderMasuk ?? true,
      reminderPulang: reminderPulang ?? true,
      monthlySummary: monthlySummary ?? false,
    },
  });

  return apiSuccess({
    reminderMasuk: prefs.reminderMasuk,
    reminderPulang: prefs.reminderPulang,
    monthlySummary: prefs.monthlySummary,
  });
});
