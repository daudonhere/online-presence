"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  UserRound,
  Phone,
  Mail,
  IdCard,
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Save,
  Calendar,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TeacherDetail {
  user: { id: number; name: string; phone: string; role: string; createdAt: string };
  profile: { subject: string; nip: string; email: string; avatarUrl: string; location: string } | null;
  attendance: { date: string; status: string; checkInTime: string; source: string }[];
  obstacles: { date: string; category: string; reason: string; status: string }[];
}

export default function GuruDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teacherId = Number(params.id);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editCount, setEditCount] = useState(0);
  const [savedForm, setSavedForm] = useState<{
    name: string; phone: string; subject: string; nip: string; email: string;
  } | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data, isLoading } = useQuery<TeacherDetail>({
    queryKey: ["admin", "teacher", teacherId],
    queryFn: async (): Promise<TeacherDetail> => {
      const res = await fetch(`/api/admin/teachers/${teacherId}`);
      if (!res.ok) throw new Error("Gagal memuat data guru");
      return res.json();
    },
    enabled: !!teacherId,
  });

  const teacherData = data as TeacherDetail | undefined;
  const user = teacherData?.user;
  const profile = teacherData?.profile;
  const attendance = teacherData?.attendance || [];

  const initialForm = useMemo(() => {
    if (!teacherData) return { name: "", phone: "", subject: "", nip: "", email: "" };
    return {
      name: teacherData.user.name,
      phone: teacherData.user.phone,
      subject: teacherData.profile?.subject || "",
      nip: teacherData.profile?.nip || "",
      email: teacherData.profile?.email || "",
    };
  }, [teacherData]);

  const form = editCount === 0 && !savedForm ? initialForm : savedForm || initialForm;

  const updateField = (field: string, value: string) => {
    setEditCount((c) => c + 1);
    setSavedForm({ ...form, [field]: value });
  };

  const updateMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      const res = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan");
      return result;
    },
    onSuccess: () => {
      setMsg({ type: "success", text: "Data guru berhasil disimpan" });
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "teachers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "teacher", teacherId] });
    },
    onError: (err: Error) => setMsg({ type: "error", text: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/teachers/${teacherId}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teachers"] });
      router.push("/guru");
    },
    onError: (err: Error) => setMsg({ type: "error", text: err.message }),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <section className="w-full max-w-md mx-auto flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-[#1b8659]" />
        </section>
      </DashboardLayout>
    );
  }

  if (!teacherData || !user) return null;

  return (
    <DashboardLayout>
      <section className="w-full max-w-md mx-auto pb-8">
        <div className="rounded-[32px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white overflow-hidden relative shadow-soft">
          <div className="absolute -right-12 -top-8 h-32 w-32 rounded-bl-[52px] bg-[#ffff00] z-0" />
          <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-[#003d7a]/25" />

          <div className="relative flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/15 flex items-center justify-center ring-1 ring-white/20 transition hover:bg-white/25"
            >
              <ArrowLeft className="text-xl text-white" />
            </button>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/90 ring-1 ring-white/15">
                <span className="h-2 w-2 rounded-full bg-[#ffff00]" />
                Detail Guru
              </div>
            </div>
            <button
              onClick={() => setShowDelete(true)}
              className="min-h-[44px] min-w-[44px] rounded-2xl bg-red-500/20 flex items-center justify-center ring-1 ring-red-400/30 transition hover:bg-red-500/30"
            >
              <Trash2 className="text-lg text-red-300" />
            </button>
          </div>

          <div className="relative mt-4 flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center ring-2 ring-[#ffff00]/40">
              {profile?.avatarUrl ? (
                <Image src={profile.avatarUrl} alt={user.name} width={64} height={64} unoptimized className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <UserRound className="text-2xl text-white" />
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">{user.name}</h1>
              <p className="text-sm text-white/70">{profile?.subject || "Guru"}</p>
            </div>
          </div>
        </div>

        {msg && (
          <div className={`mt-3 flex items-center gap-2 rounded-2xl p-3 text-sm font-medium ring-1 ${msg.type === "error" ? "bg-red-50 text-red-700 ring-red-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}>
            {msg.type === "error" ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {msg.text}
          </div>
        )}

        <div className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">Data Diri</h2>
            {!editing && (
              <button
                onClick={() => { setEditing(true); setMsg(null); }}
                className="rounded-xl bg-[#1b8659] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0c6b46]"
              >
                Edit
              </button>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <UserRound className="text-base text-[#1b8659] shrink-0" />
                <p className="text-xs font-medium text-slate-500">Nama</p>
              </div>
              {editing ? (
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none border-b border-[#1b8659] pb-1"
                />
              ) : (
                <p className="mt-1 text-sm font-bold text-slate-900">{user.name}</p>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <BookOpen className="text-base text-amber-500 shrink-0" />
                <p className="text-xs font-medium text-slate-500">Bidang Pelajaran</p>
              </div>
              {editing ? (
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none border-b border-amber-400 pb-1"
                  placeholder="Belum diatur"
                />
              ) : (
                <p className="mt-1 text-sm font-bold text-slate-900">{profile?.subject || "Belum diatur"}</p>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <IdCard className="text-base text-blue-500 shrink-0" />
                <p className="text-xs font-medium text-slate-500">NIP</p>
              </div>
              {editing ? (
                <input
                  type="text"
                  value={form.nip}
                  onChange={(e) => updateField("nip", e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none border-b border-blue-400 pb-1"
                  placeholder="Belum diatur"
                />
              ) : (
                <p className="mt-1 text-sm font-bold text-slate-900">{profile?.nip || "Belum diatur"}</p>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Phone className="text-base text-emerald-500 shrink-0" />
                <p className="text-xs font-medium text-slate-500">Telepon</p>
              </div>
              {editing ? (
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none border-b border-emerald-400 pb-1"
                />
              ) : (
                <p className="mt-1 text-sm font-bold text-slate-900">{user.phone}</p>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Mail className="text-base text-purple-500 shrink-0" />
                <p className="text-xs font-medium text-slate-500">Email</p>
              </div>
              {editing ? (
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none border-b border-purple-400 pb-1"
                  placeholder="Belum diatur"
                />
              ) : (
                <p className="mt-1 text-sm font-bold text-slate-900">{profile?.email || "Belum diatur"}</p>
              )}
            </div>
          </div>

          {editing && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => { setEditing(false); setEditCount(0); setSavedForm(null); setMsg(null); }}
                className="min-h-[48px] rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 transition hover:scale-[0.98] flex items-center justify-center gap-2"
              >
                Batal
              </button>
              <button
                onClick={() => { setMsg(null); updateMutation.mutate(form); }}
                disabled={updateMutation.isPending}
                className="min-h-[48px] rounded-2xl bg-[#1b8659] px-4 py-3 text-sm font-black text-white transition hover:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan
              </button>
            </div>
          )}
        </div>

        {attendance.length > 0 && (
          <div className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="text-lg text-[#1b8659]" />
              <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">Kehadiran Bulan Ini</h2>
            </div>
            <div className="mt-3 space-y-2">
              {attendance.map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{new Date(a.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</p>
                    {a.checkInTime && <p className="text-[10px] text-slate-500">{a.checkInTime} WIB</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${a.status === "hadir" ? "bg-emerald-100 text-emerald-700" : a.status === "izin" ? "bg-yellow-100 text-amber-700" : a.status === "sakit" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-slate-950">Hapus Guru?</h3>
                <button onClick={() => setShowDelete(false)} className="min-h-[36px] min-w-[36px] rounded-xl bg-slate-100 flex items-center justify-center">
                  <X className="text-lg text-slate-500" />
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Semua data <strong>{user.name}</strong> termasuk kehadiran dan pengajuan akan dihapus secara permanen.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowDelete(false)}
                  className="min-h-[48px] rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 transition hover:scale-[0.98]"
                >
                  Batal
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="min-h-[48px] rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
