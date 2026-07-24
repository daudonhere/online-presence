"use client";

import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  NotebookPen,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout";
import { DatePicker } from "@/components/ui/DatePicker";
import { useFormValidation, FieldError } from "@/lib/hooks";
import { attendanceSchema } from "@/lib/validations";
import { queryKeys } from "@/lib/query-keys";

interface AttendanceRecord {
  id: number;
  date: string;
  time: string;
  notes: string | null;
  status: "hadir" | "izin" | "alpha" | "libur" | "pending";
  checkOutTime: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  hadir: { label: "Hadir", color: "text-emerald-600", bg: "bg-emerald-50" },
  izin: { label: "Izin", color: "text-amber-600", bg: "bg-amber-50" },
  alpha: { label: "Alpha", color: "text-red-600", bg: "bg-red-50" },
  pending: { label: "Menunggu", color: "text-amber-600", bg: "bg-amber-50" },
  menunggu: { label: "Menunggu", color: "text-amber-600", bg: "bg-amber-50" },
};

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getCurrentTime(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ManualPage() {
  const today = getTodayDate();
  const now = new Date();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(today);
  const [time, setTime] = useState(getCurrentTime());
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { errors, validate, clearField } = useFormValidation(attendanceSchema);

  const { data: lastAttendance, isLoading: loadingLast } = useQuery<AttendanceRecord | null>({
    queryKey: queryKeys.attendance.last,
    queryFn: async () => {
      const res = await fetch("/api/attendance/last");
      if (!res.ok) return null;
      const data = await res.json();
      const last = data?.attendance ?? data;
      return last && typeof last === "object" && last.date ? last : null;
    },
  });

  const { data: monthRecords, isLoading: loadingMonth } = useQuery<AttendanceRecord[]>({
    queryKey: queryKeys.attendance.list(now.getMonth() + 1, now.getFullYear()),
    queryFn: async () => {
      const res = await fetch(`/api/attendance?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data?.attendance ?? (Array.isArray(data) ? data : []);
    },
  });

  const todayAttendance = monthRecords?.find((r) => r.date === today) ?? null;
  const isCheckedInToday = todayAttendance?.status === "hadir" || todayAttendance?.status === "izin";
  const hasCheckedOut = todayAttendance?.checkOutTime != null;

  const checkInMutation = useMutation({
    mutationFn: async (payload: { date: string; time: string; notes?: string }) => {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengirim absensi.");
      return data.attendance ?? { ...data, checkOutTime: null };
    },
    onSuccess: (newRecord: AttendanceRecord) => {
      queryClient.setQueryData<AttendanceRecord[]>(
        queryKeys.attendance.list(now.getMonth() + 1, now.getFullYear()),
        (old) => {
          if (!old) return [newRecord];
          const idx = old.findIndex((r) => r.date === newRecord.date);
          if (idx >= 0) {
            const next = [...old];
            next[idx] = newRecord;
            return next;
          }
          return [...old, newRecord];
        }
      );
      setSuccess("Absensi terkirim! Menunggu persetujuan admin.");
      setConfirmed(false);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (time: string) => {
      const res = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal melakukan check-out.");
      return data;
    },
    onSuccess: (data: { checkOutTime?: string }) => {
      queryClient.setQueryData<AttendanceRecord[]>(
        queryKeys.attendance.list(now.getMonth() + 1, now.getFullYear()),
        (old) => {
          if (!old) return old;
          return old.map((r) =>
            r.date === today ? { ...r, checkOutTime: data.checkOutTime ?? getCurrentTime() } : r
          );
        }
      );
      setSuccess("Berhasil check-out!");
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toTimeString().slice(0, 5));
      const todayNow = now.toISOString().split("T")[0];
      setDate((prev) => {
        if (prev < todayNow) return todayNow;
        return prev;
      });
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  function resetMessages() {
    setSuccess(null);
  }

  function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    const submitTime = getCurrentTime();
    setTime(submitTime);
    if (!validate({ date, time: submitTime, notes: notes || undefined })) return;
    checkInMutation.mutate({ date, time: submitTime, notes: notes || undefined });
  }

  function handleCheckOut() {
    resetMessages();
    checkOutMutation.mutate(getCurrentTime());
  }

  const loading = loadingLast || loadingMonth;
  const isSubmitting = checkInMutation.isPending || checkOutMutation.isPending;
  const errorMsg = checkInMutation.error?.message || checkOutMutation.error?.message || null;

  const statusKey = todayAttendance ? todayAttendance.status : "menunggu";
  const statusDisplay = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.menunggu;

  return (
    <DashboardLayout>
      <div className="w-full max-w-md">
      <div className="rounded-[30px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white overflow-hidden relative">
        <div className="absolute -right-12 -top-8 h-32 w-32 rounded-bl-[46px] bg-[#ffff00] z-0" />
        <div className="absolute -left-8 -bottom-10 h-28 w-28 rounded-full bg-[#003d7a]/25" />
        <div className="relative flex items-start gap-4">
          <Link
            href="/"
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/15 flex items-center justify-center ring-1 ring-white/20 transition hover:bg-white/25"
            aria-label="Kembali ke halaman absensi"
          >
            <ArrowLeft className="text-xl text-white" />
          </Link>
          <div className="pt-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/90 ring-1 ring-white/15">
              <span className="h-2 w-2 rounded-full bg-[#ffff00]" />
              Hari Ini
            </div>
            <h2 className="mt-3 font-display text-lg font-bold tracking-tight">
              {formatDay(today)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/82">
              Isi data kedatangan hari ini.
            </p>
          </div>
        </div>
      </div>

      <form
        className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100"
        onSubmit={handleCheckIn}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="attendance-date"
              className="flex items-center gap-2 text-sm font-bold text-slate-900"
            >
              <Calendar className="text-lg text-[#1b8659]" />
              Tanggal Absensi
            </label>
            <div className="mt-2">
              <DatePicker
                value={date}
                onChange={(v) => { setDate(v); clearField("date"); }}
                minDate={today}
                placeholder="Pilih tanggal absensi"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Pastikan tanggal sesuai hari kerja aktif.
            </p>
            <FieldError error={errors.date} />
          </div>

          <div>
            <label
              htmlFor="arrival-time"
              className="flex items-center gap-2 text-sm font-bold text-slate-900"
            >
              <Clock className="text-lg text-[#1b8659]" />
              Jam Kedatangan
            </label>
            <div className="mt-2 relative">
              <input
                id="arrival-time"
                name="arrival-time"
                type="text"
                value={time}
                readOnly
                className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-base font-semibold text-slate-900 outline-none cursor-not-allowed"
              />
              <Clock className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-400" />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Jam otomatis diambil saat Anda menekan tombol kirim.
            </p>
          </div>

          <div>
            <label
              htmlFor="attendance-notes"
              className="flex items-center gap-2 text-sm font-bold text-slate-900"
            >
              <NotebookPen className="text-lg text-[#1b8659]" />
              Catatan Opsional
            </label>
            <textarea
              id="attendance-notes"
              name="attendance-notes"
              rows={4}
              placeholder="Contoh: Hadir untuk jadwal piket pagi dan mengajar kelas VII A."
              value={notes}
              onChange={(e) => { setNotes(e.target.value); clearField("notes"); }}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <FieldError error={errors.notes} />
          </div>
        </div>

        <div className="mt-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="confirm-manual"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-slate-300 text-[#1b8659] focus:ring-[#1b8659]"
            />
            <label htmlFor="confirm-manual" className="text-sm leading-relaxed text-slate-600">
              Saya hadir di sekolah pada tanggal dan jam yang tertera. Absensi
              ini memerlukan persetujuan admin.
            </label>
          </div>
        </div>

        {errorMsg && (
          <p className="mt-3 text-center text-sm font-bold text-red-600">{errorMsg}</p>
        )}
        {success && (
          <p className="mt-3 text-center text-sm font-bold text-emerald-600">{success}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isCheckedInToday || !confirmed}
          className="mt-4 min-h-[58px] w-full rounded-2xl bg-[#1b8659] px-5 py-4 text-center text-base font-black text-[#ffff00] shadow-card transition hover:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <Loader2 className="text-2xl animate-spin" />
          ) : (
            <Send className="text-2xl" />
          )}
          {isCheckedInToday ? "Sudah absen masuk" : "Kirim Absensi"}
        </button>

        {isCheckedInToday && !hasCheckedOut && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCheckOut}
            className="mt-3 min-h-[54px] w-full rounded-2xl border-2 border-[#1b8659] bg-white px-5 py-4 text-center text-base font-black text-[#1b8659] transition hover:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <Loader2 className="text-xl animate-spin" />
            ) : (
              <Clock className="text-xl" />
            )}
            Check-out Sekarang
          </button>
        )}
      </form>

      <section className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Status Terakhir
            </p>
            {loading ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat...
              </div>
            ) : todayAttendance ? (
              <div>
                <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-slate-950">
                  {todayAttendance.status === "hadir" && hasCheckedOut
                    ? "Sudah check-out"
                    : todayAttendance.status === "hadir"
                      ? "Sudah absen masuk"
                      : todayAttendance.status === "izin"
                        ? "Sudah izin hari ini"
                        : todayAttendance.status === "alpha"
                          ? "Alpha hari ini"
                          : todayAttendance.status}
                </h3>
                {todayAttendance.checkOutTime && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Masuk: {todayAttendance.time} — Keluar: {todayAttendance.checkOutTime}
                  </p>
                )}
                {!todayAttendance.checkOutTime && todayAttendance.status === "hadir" && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Jam masuk: {todayAttendance.time}
                  </p>
                )}
              </div>
            ) : lastAttendance ? (
              <div>
                <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-slate-950">
                  {lastAttendance.status === "hadir"
                    ? "Hadir"
                    : lastAttendance.status === "izin"
                      ? "Izin"
                      : lastAttendance.status === "alpha"
                        ? "Alpha"
                        : lastAttendance.status}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDay(lastAttendance.date)}
                </p>
              </div>
            ) : (
              <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-slate-950">
                Belum ada data
              </h3>
            )}
          </div>
          <span className={`rounded-full ${statusDisplay.bg} px-3 py-1.5 text-xs font-black ${statusDisplay.color}`}>
            {statusDisplay.label}
          </span>
        </div>
      </section>
      </div>
    </DashboardLayout>
  );
}
