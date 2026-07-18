import { z } from "zod";

function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

export const registerSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100).transform(sanitize),
  phone: z
    .string()
    .min(1, "Nomor telepon wajib diisi")
    .regex(/^0[0-9]{9,13}$/, "Format nomor telepon tidak valid"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(100),
});

export const loginSchema = z.object({
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100).optional().transform(v => v ? sanitize(v) : v),
  subject: z.string().max(100).optional().transform(v => v ? sanitize(v) : v),
  nip: z.string().max(30).optional().transform(v => v ? sanitize(v) : v),
  email: z.string().email("Format email tidak valid").max(100).optional(),
  phone: z
    .string()
    .regex(/^0[0-9]{9,13}$/, "Format nomor telepon tidak valid")
    .optional(),
  location: z.string().max(100).optional().refine(
    (v) => !v || /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(v),
    "Format koordinat tidak valid. Contoh: -6.954097, 107.009786"
  ).transform(v => v ? sanitize(v) : v),
});

export const attendanceSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam tidak valid"),
  notes: z.string().max(500).optional().transform(v => v ? sanitize(v) : v),
});

export const checkOutSchema = z.object({
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam tidak valid"),
});

export const obstacleSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  category: z.enum(["sakit", "izin", "cuti"], "Kategori tidak valid"),
  reason: z
    .string()
    .min(1, "Keterangan wajib diisi")
    .max(250, "Keterangan maksimal 250 karakter")
    .transform(sanitize),
});

export const notificationPrefsSchema = z.object({
  reminderMasuk: z.boolean().optional(),
  reminderPulang: z.boolean().optional(),
  monthlySummary: z.boolean().optional(),
});

export const scanSchema = z.object({
  qrData: z
    .string()
    .min(1, "Data QR tidak boleh kosong")
    .regex(/^ATTENDANCE:USER:\d+:.+$/, "Format QR tidak valid"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
