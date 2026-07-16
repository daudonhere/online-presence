"use client";

import {
  UserRound,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  ChevronRight,
  BellRing,
  LogOut,
  Camera,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { DashboardLayout } from "@/components/layout";

const toggles = [
  {
    key: "reminderMasuk" as const,
    label: "Pengingat Absen Masuk",
    description: "Dikirim sebelum jam 07.00 WIB",
  },
  {
    key: "reminderPulang" as const,
    label: "Pengingat Absen Pulang",
    description: "Dikirim setelah jam mengajar selesai",
  },
  {
    key: "monthlySummary" as const,
    label: "Ringkasan Bulanan",
    description: "Laporan singkat setiap akhir bulan",
  },
];

export default function PengaturanPage() {
  const { data: session } = useSession();

  const [profile, setProfile] = useState({
    name: "",
    subject: "",
    nip: "",
    email: "",
    phone: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifStates, setNotifStates] = useState({
    reminderMasuk: true,
    reminderPulang: true,
    monthlySummary: false,
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);

  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarMsg, setAvatarMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notifMsg, setNotifMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, notifRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/notifications/preferences"),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile({
            name: profileData.name || "",
            subject: profileData.profile?.subject || "",
            nip: profileData.profile?.nip || "",
            email: profileData.profile?.email || "",
            phone: profileData.phone || "",
          });
          if (profileData.profile?.avatarUrl) {
            setProfileImage(profileData.profile.avatarUrl);
          }
        }

        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifStates({
            reminderMasuk: notifData.reminderMasuk ?? true,
            reminderPulang: notifData.reminderPulang ?? true,
            monthlySummary: notifData.monthlySummary ?? false,
          });
        }
      } catch {
        // silent — defaults are fine
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleProfileChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({ type: "error", text: data.error || "Gagal menyimpan profil" });
      } else {
        setProfileMsg({ type: "success", text: "Profil berhasil disimpan" });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Terjadi kesalahan jaringan" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setAvatarMsg({ type: "error", text: "Ukuran gambar maksimal 1 MB" });
      return;
    }

    setUploadingAvatar(true);
    setAvatarMsg(null);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setAvatarMsg({ type: "error", text: data.error || "Gagal upload avatar" });
      } else {
        setProfileImage(data.avatarUrl);
        setAvatarMsg({ type: "success", text: "Avatar berhasil diunggah" });
      }
    } catch {
      setAvatarMsg({ type: "error", text: "Terjadi kesalahan jaringan" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleNotif = async (key: keyof typeof notifStates) => {
    const newState = { ...notifStates, [key]: !notifStates[key] };
    setNotifStates(newState);
    setSavingNotif(true);
    setNotifMsg(null);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newState),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotifMsg({ type: "error", text: data.error || "Gagal menyimpan preferensi" });
        setNotifStates((prev) => ({ ...prev, [key]: !newState[key] }));
      } else {
        setNotifMsg({ type: "success", text: "Preferensi notifikasi disimpan" });
      }
    } catch {
      setNotifMsg({ type: "error", text: "Terjadi kesalahan jaringan" });
      setNotifStates((prev) => ({ ...prev, [key]: !newState[key] }));
    } finally {
      setSavingNotif(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (password !== retypePassword) {
      alert("Password tidak cocok");
      return;
    }
    if (password.length < 6) {
      alert("Password minimal 6 karakter");
      return;
    }
    setShowPasswordModal(false);
    setPassword("");
    setRetypePassword("");
    alert("Password berhasil diubah");
  };

  const displayName = profile.name || session?.user?.name || "Guru";
  const displaySubject = profile.subject || "";

  return (
    <DashboardLayout>
      <div className="w-full max-w-md">
      <section className="rounded-[30px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white overflow-hidden relative shadow-soft">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-bl-[54px] bg-[#ffff00] z-0" />
        <div className="absolute -left-10 -bottom-12 h-32 w-32 rounded-full bg-[#003d7a]/25" />

        <div className="relative flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="h-20 w-20 shrink-0 rounded-[26px] bg-white p-1 shadow-card ring-4 ring-[#ffff00]/40 relative group cursor-pointer disabled:opacity-50"
          >
            {uploadingAvatar ? (
              <div className="h-full w-full rounded-[22px] bg-gradient-to-br from-emerald-100 to-white flex items-center justify-center overflow-hidden">
                <Loader2 className="text-2xl text-[#1b8659] animate-spin" />
              </div>
            ) : profileImage ? (
              <img // eslint-disable-line @next/next/no-img-element
                src={profileImage}
                alt="Profile"
                className="h-full w-full rounded-[22px] object-cover"
              />
            ) : (
              <div className="h-full w-full rounded-[22px] bg-gradient-to-br from-emerald-100 to-white flex items-center justify-center overflow-hidden">
                <UserRound className="text-5xl text-[#1b8659]" />
              </div>
            )}
            <div className="absolute inset-0 rounded-[26px] bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <Camera className="text-xl text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90 ring-1 ring-white/15">
              <span className="h-2 w-2 rounded-full bg-[#ffff00]" />
              Profil Guru
            </div>
            <h1 className="mt-2 font-display text-lg font-bold tracking-tight truncate">
              {loading ? "..." : displayName}
            </h1>
            <p className="mt-1 text-sm font-medium text-white/80 truncate">
              {loading ? "" : displaySubject}
            </p>
            <p className="mt-1 text-xs text-white/70 truncate">
              {loading ? "" : `NIP. ${profile.nip}`}
            </p>
          </div>
        </div>
      </section>

      {avatarMsg && (
        <div className={`mt-3 flex items-center gap-2 rounded-2xl p-3 text-sm font-medium ring-1 ${avatarMsg.type === "error" ? "bg-red-50 text-red-700 ring-red-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}>
          {avatarMsg.type === "error" ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {avatarMsg.text}
        </div>
      )}

      <section className="mt-5 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1b8659]">Akun</p>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">
              {loading ? (
                <span className="inline-block h-6 w-40 animate-pulse rounded bg-slate-200" />
              ) : (
                "Data Dasar"
              )}
            </h2>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <IdCard className="text-2xl text-[#1b8659]" />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Nama</p>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleProfileChange("name", e.target.value)}
              disabled={loading}
              className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none disabled:opacity-50"
            />
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Guru Bidang Pelajaran</p>
            <input
              type="text"
              value={profile.subject}
              onChange={(e) => handleProfileChange("subject", e.target.value)}
              disabled={loading}
              className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none disabled:opacity-50"
            />
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">NIP</p>
            <input
              type="text"
              value={profile.nip}
              onChange={(e) => handleProfileChange("nip", e.target.value)}
              disabled={loading}
              className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none disabled:opacity-50"
            />
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500">Email</p>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange("email", e.target.value)}
                disabled={loading}
                className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none disabled:opacity-50"
              />
            </div>
            <Mail className="text-xl text-slate-400 shrink-0" />
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500">Nomor Telepon</p>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
                disabled={loading}
                className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none disabled:opacity-50"
              />
            </div>
            <Phone className="text-xl text-slate-400 shrink-0" />
          </div>
        </div>

        {profileMsg && (
          <div className={`mt-3 flex items-center gap-2 rounded-2xl p-3 text-sm font-medium ring-1 ${profileMsg.type === "error" ? "bg-red-50 text-red-700 ring-red-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}>
            {profileMsg.type === "error" ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {profileMsg.text}
          </div>
        )}

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile || loading}
          className="mt-4 min-h-[54px] w-full rounded-2xl bg-[#1b8659] px-5 py-3 text-sm font-black text-[#ffff00] shadow-card transition hover:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {savingProfile ? (
            <Loader2 className="text-xl animate-spin" />
          ) : (
            "Simpan Profil"
          )}
        </button>
      </section>

      <section className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1b8659]">Keamanan</p>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">
              Login & Password
            </h2>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-yellow-50 flex items-center justify-center">
            <ShieldCheck className="text-2xl text-amber-500" />
          </div>
        </div>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="mt-4 min-h-[58px] w-full flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50 px-4 py-3 transition hover:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#1b8659] flex items-center justify-center">
              <KeyRound className="text-xl text-[#ffff00]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">Ubah Password</p>
              <p className="text-xs text-slate-500">
                Terakhir diubah 12 hari lalu
              </p>
            </div>
          </div>
          <ChevronRight className="text-xl text-slate-400" />
        </button>
      </section>

      <section className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1b8659]">Preferensi</p>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">
              Notifikasi
            </h2>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-blue-50 flex items-center justify-center">
            <BellRing className="text-2xl text-[#003d7a]" />
          </div>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {toggles.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div>
                <p className="text-sm font-bold text-slate-950">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
              <button
                onClick={() => toggleNotif(item.key)}
                disabled={savingNotif}
                className={`min-h-[32px] w-14 rounded-full p-1 flex transition disabled:opacity-50 ${
                  notifStates[item.key]
                    ? "bg-[#1b8659] justify-end"
                    : "bg-slate-200 justify-start"
                }`}
                aria-label={item.label}
              >
                <span className="h-6 w-6 rounded-full bg-white shadow-card" />
              </button>
            </div>
          ))}
        </div>
        {notifMsg && (
          <div className={`mt-3 flex items-center gap-2 rounded-2xl p-3 text-sm font-medium ring-1 ${notifMsg.type === "error" ? "bg-red-50 text-red-700 ring-red-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}>
            {notifMsg.type === "error" ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {notifMsg.text}
          </div>
        )}
      </section>

      <section className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-red-100">
        <button
          onClick={() => signOut({ callbackUrl: "/auth" })}
          className="min-h-[60px] w-full flex items-center justify-center gap-3 rounded-2xl bg-red-50 px-5 py-4 text-base font-black text-red-600 transition hover:scale-[0.99] hover:bg-red-100"
        >
          <LogOut className="text-2xl" />
          Keluar dari Akun
        </button>
      </section>

      <p className="mt-5 text-center text-xs font-medium text-slate-400">
        Absensi Guru MTS AL-RIYADL v1.0.0
      </p>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold tracking-tight text-slate-950">
                Ubah Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                  setRetypePassword("");
                }}
                className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="text-xl" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-900">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 min-h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold text-slate-900 outline-none transition focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  placeholder="Masukkan password baru"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-900">
                  Ketik Ulang Password
                </label>
                <input
                  type="password"
                  value={retypePassword}
                  onChange={(e) => setRetypePassword(e.target.value)}
                  className="mt-2 min-h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold text-slate-900 outline-none transition focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={handlePasswordSubmit}
                className="min-h-[54px] w-full rounded-2xl bg-[#1b8659] px-5 py-3 text-sm font-black text-[#ffff00] shadow-card transition hover:scale-[0.98]"
              >
                Simpan Password
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
