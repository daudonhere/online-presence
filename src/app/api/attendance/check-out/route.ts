import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { checkOutSchema } from "@/lib/validations";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await req.json();
  const result = checkOutSchema.safeParse(body);

  if (!result.success) {
    return apiError(result.error.issues[0].message, 400);
  }

  const { time } = result.data;
  const userId = Number(session.user.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!existing) {
    return apiError("Anda belum melakukan absensi masuk hari ini");
  }

  if (existing.checkOutTime) {
    return apiError("Anda sudah melakukan check-out hari ini");
  }

  const record = await prisma.attendance.update({
    where: { id: existing.id },
    data: { checkOutTime: time },
  });

  return apiSuccess(record);
});
