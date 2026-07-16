import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { scanSchema } from "@/lib/validations";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await req.json();
  const result = scanSchema.safeParse(body);

  if (!result.success) {
    return apiError(result.error.issues[0].message, 400);
  }

  const { qrData } = result.data;

  const match = qrData.match(/^ATTENDANCE:USER:(\d+):(.+)$/);
  if (!match) return apiError("Format QR tidak valid");

  const qrUserId = Number(match[1]);
  const currentUserId = Number(session.user.id);

  if (qrUserId === currentUserId) {
    return apiError("Tidak bisa scan QR sendiri");
  }

  const qrUser = await prisma.user.findUnique({
    where: { id: qrUserId },
    select: { id: true, role: true, name: true },
  });

  if (!qrUser) return apiError("User pada QR tidak ditemukan");

  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { role: true },
  });

  let attendanceUserId: number;

  if (currentUser?.role === "teacher" && qrUser.role === "admin") {
    attendanceUserId = currentUserId;
  } else if (currentUser?.role === "admin" && qrUser.role === "teacher") {
    attendanceUserId = qrUserId;
  } else {
    return apiError("Scan tidak valid. Guru harus scan QR admin, atau admin harus scan QR guru.");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId: attendanceUserId, date: today } },
  });

  if (existing) {
    return apiError("User sudah melakukan absensi hari ini");
  }

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const record = await prisma.attendance.create({
    data: {
      userId: attendanceUserId,
      date: today,
      checkInTime: time,
      status: "hadir",
      source: "qr",
    },
  });

  return apiSuccess(record, 201);
});
