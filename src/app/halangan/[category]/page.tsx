"use client";

import { ArrowLeft, ShieldCheck, Info, UploadCloud, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout";
import { DatePicker } from "@/components/ui/DatePicker";
import { useFormValidation, FieldError } from "@/lib/hooks";
import { obstacleSchema } from "@/lib/validations";

const categoryConfig: Record<string, { title: string; placeholder: string; uploadText: string }> = {
  sakit: {
    title: "Izin Sakit",
    placeholder: "Contoh: Saya tidak dapat hadir karena sedang sakit demam dan perlu istirahat di rumah...",
    uploadText: "Unggah surat dokter atau bukti pendukung",
  },
  izin: {
    title: "Izin Kehadiran",
    placeholder: "Contoh: Saya tidak dapat hadir karena ada keperluan keluarga yang mendesak...",
    uploadText: "Unggah dokumen pendukung izin",
  },
  cuti: {
    title: "Izin Cuti",
    placeholder: "Contoh: Saya mengajukan cuti untuk keperluan pribadi selama 3 hari...",
    uploadText: "Unggah dokumen cuti atau surat keterangan",
  },
};

const categories = [
  { value: "sakit", label: "Sakit" },
  { value: "izin", label: "Izin" },
  { value: "cuti", label: "Cuti" },
];

export default function HalanganFormPage() {
  const params = useParams();
  const category = (params.category as string) || "sakit";
  const config = categoryConfig[category] || categoryConfig.sakit;

  const [date, setDate] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [reason, setReason] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const { errors, validate, clearField } = useFormValidation(obstacleSchema);

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/obstacles", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim pengajuan.");
      return data;
    },
    onSuccess: () => {
      setSuccess(true);
      setDate("");
      setReason("");
      setCharCount(0);
      setConfirmed(false);
      setFile(null);
      const fileInput = document.getElementById("file-bukti") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    },
  });

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, 250);
    setReason(val);
    setCharCount(val.length);
    clearField("reason");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);

    if (!validate({ date, category, reason })) return;
    if (!confirmed) return;

    const formData = new FormData();
    formData.append("date", date);
    formData.append("category", category);
    formData.append("reason", reason);
    if (file) formData.append("file", file);

    submitMutation.mutate(formData);
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-md">
      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white shadow-soft">
        <div className="absolute -right-12 -top-10 h-32 w-32 rounded-bl-[48px] bg-[#ffff00] z-0" />
        <div className="absolute -left-12 -bottom-14 h-36 w-36 rounded-full bg-[#003d7a]/25" />

        <div className="relative flex items-start gap-4">
          <Link
            href="/halangan"
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/15 flex items-center justify-center ring-1 ring-white/20 transition hover:bg-white/25 shrink-0"
            aria-label="Kembali ke halaman halangan"
          >
            <ArrowLeft className="text-xl text-white" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {config.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              Isi data ketidakhadiran dengan benar agar dapat diverifikasi oleh
              admin sekolah.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[30px] bg-white p-5 shadow-soft ring-1 ring-slate-100">
        <div className="flex items-center gap-3 rounded-3xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-[#1b8659] flex items-center justify-center">
            <ShieldCheck className="text-2xl text-[#ffff00]" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950">Validasi Admin</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Pengajuan akan masuk status menunggu persetujuan setelah dikirim.
            </p>
          </div>
        </div>

        {success && (
          <div className="mt-4 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <p className="text-sm font-bold text-emerald-700">Pengajuan berhasil dikirim!</p>
            <p className="mt-1 text-xs text-emerald-600">
              Data Anda telah diterima dan menunggu persetujuan admin.
            </p>
          </div>
        )}

        {submitMutation.isError && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
            <p className="text-sm font-bold text-red-700">{submitMutation.error.message}</p>
          </div>
        )}

        <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="tanggal-kejadian" className="flex items-center justify-between text-sm font-bold text-slate-900">
              <span>Tanggal Kejadian</span>
              <span className="text-xs font-semibold text-red-500">Wajib</span>
            </label>
            <div className="mt-2">
              <DatePicker
                value={date}
                onChange={(v) => { setDate(v); clearField("date"); }}
                minDate={today}
                placeholder="Pilih tanggal kejadian"
              />
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Info className="text-sm text-[#1b8659]" />
              Pilih tanggal saat Bapak/Ibu tidak dapat hadir.
            </p>
            <FieldError error={errors.date} />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-bold text-slate-900">
              <span>Kategori</span>
            </label>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${
                category === "sakit" ? "bg-emerald-50 text-[#1b8659] ring-1 ring-emerald-100" :
                category === "izin" ? "bg-yellow-50 text-amber-600 ring-1 ring-yellow-100" :
                "bg-blue-50 text-[#003d7a] ring-1 ring-blue-100"
              }`}>
                {categories.find((c) => c.value === category)?.label}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="alasan-halangan" className="flex items-center justify-between text-sm font-bold text-slate-900">
              <span>Keterangan</span>
              <span className="text-xs font-semibold text-red-500">Wajib</span>
            </label>
            <textarea
              id="alasan-halangan"
              name="alasan-halangan"
              rows={5}
              required
              placeholder={config.placeholder}
              value={reason}
              onChange={handleReasonChange}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
              <span>Minimal tuliskan alasan yang jelas.</span>
              <span>{charCount}/250</span>
            </div>
            <FieldError error={errors.reason} />
          </div>

          <div>
            <label htmlFor="file-bukti" className="flex items-center justify-between text-sm font-bold text-slate-900">
              <span>File Referensi</span>
              <span className="text-xs font-semibold text-slate-400">Opsional</span>
            </label>
            <label
              htmlFor="file-bukti"
              className="mt-2 flex min-h-[118px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-5 text-center transition hover:border-[#1b8659] hover:bg-emerald-50"
            >
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-card">
                <UploadCloud className="text-2xl text-[#1b8659]" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">{config.uploadText}</p>
              {file ? (
                <p className="mt-1 text-xs font-semibold text-[#1b8659]">{file.name}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">PDF, JPG, PNG maksimal 1 MB</p>
              )}
            </label>
            <input
              id="file-bukti"
              name="file-bukti"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={handleFileChange}
            />
          </div>

          <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="flex items-start gap-3">
              <input
                id="konfirmasi-data"
                name="konfirmasi-data"
                type="checkbox"
                required
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-[#1b8659] focus:ring-[#1b8659]"
              />
              <label htmlFor="konfirmasi-data" className="text-sm leading-relaxed text-slate-600">
                Saya menyatakan data yang dikirim benar dan dapat
                dipertanggungjawabkan. Pengajuan ini akan diverifikasi
                oleh admin sebelum disetujui.
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitMutation.isPending || !confirmed}
            className="min-h-[58px] w-full rounded-2xl bg-[#ffff00] px-5 py-4 text-base font-black text-[#003d7a] shadow-card transition hover:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="text-2xl animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="text-2xl" />
                Kirim Pengajuan
              </>
            )}
          </button>
        </form>
      </section>
      </div>
    </DashboardLayout>
  );
}
