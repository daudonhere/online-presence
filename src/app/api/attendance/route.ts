import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { attendanceSchema } from "@/lib/validations";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const where: Record<string, unknown> = { userId: Number(session.user.id) };

  if (month && year) {
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);
    where.date = { gte: startDate, lte: endDate };
  }

  const records = await prisma.attendance.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return apiSuccess(records);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await req.json();
  const result = attendanceSchema.safeParse(body);

  if (!result.success) {
    return apiError(result.error.issues[0].message, 400);
  }

  const { date, time, notes } = result.data;
  const userId = Number(session.user.id);
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);

  if (dateObj.getTime() !== today.getTime()) {
    return apiError("Absensi hanya bisa dilakukan untuk hari ini");
  }

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: dateObj } },
  });

  if (existing) {
    return apiError("Anda sudah melakukan absensi hari ini");
  }

  const record = await prisma.attendance.create({
    data: {
      userId,
      date: dateObj,
      checkInTime: time,
      notes: notes || null,
      status: "pending",
      source: "manual",
    },
  });

  return apiSuccess(record, 201);
});
