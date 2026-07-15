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
} from "lucide-react";
import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout";

const toggles = [
  {
    label: "Pengingat Absen Masuk",
    description: "Dikirim sebelum jam 07.00 WIB",
    defaultOn: true,
  },
  {
    label: "Pengingat Absen Pulang",
    description: "Dikirim setelah jam mengajar selesai",
    defaultOn: true,
  },
  {
    label: "Ringkasan Bulanan",
    description: "Laporan singkat setiap akhir bulan",
    defaultOn: false,
  },
];

export default function PengaturanPage() {
  const [notifStates, setNotifStates] = useState(
    toggles.map((t) => t.defaultOn)
  );
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: "Ibu Titin S.Pd",
    subject: "Guru Bahasa Indonesia",
    nip: "19870512 201403 2 006",
    email: "titin@mtsalriyadl.sch.id",
    phone: "0812-3456-7890",
  });

  const toggleNotif = (index: number) => {
    setNotifStates((prev) =>
      prev.map((v, i) => (i === index ? !v : v))
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert("Ukuran gambar maksimal 1 MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
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

  return (
    <DashboardLayout>
      <div className="w-full max-w-md">
      <section className="rounded-[30px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white overflow-hidden relative shadow-soft">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-bl-[54px] bg-[#ffff00] z-0" />
        <div className="absolute -left-10 -bottom-12 h-32 w-32 rounded-full bg-[#003d7a]/25" />

        <div className="relative flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-20 w-20 shrink-0 rounded-[26px] bg-white p-1 shadow-card ring-4 ring-[#ffff00]/40 relative group cursor-pointer"
          >
            {profileImage ? (
              <img
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
              {profile.name}
            </h1>
            <p className="mt-1 text-sm font-medium text-white/80 truncate">
              {profile.subject}
            </p>
            <p className="mt-1 text-xs text-white/70 truncate">
              NIP. {profile.nip}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1b8659]">Akun</p>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">
              Data Dasar
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
              className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
            />
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Guru Bidang Pelajaran</p>
            <input
              type="text"
              value={profile.subject}
              onChange={(e) => handleProfileChange("subject", e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
            />
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">NIP</p>
            <input
              type="text"
              value={profile.nip}
              onChange={(e) => handleProfileChange("nip", e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
            />
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500">Email</p>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange("email", e.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
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
                className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
              />
            </div>
            <Phone className="text-xl text-slate-400 shrink-0" />
          </div>
        </div>
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
          {toggles.map((item, i) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div>
                <p className="text-sm font-bold text-slate-950">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
              <button
                onClick={() => toggleNotif(i)}
                className={`min-h-[32px] w-14 rounded-full p-1 flex transition ${
                  notifStates[i]
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
      </section>

      <section className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-red-100">
        <a
          href="#"
          className="min-h-[60px] flex items-center justify-center gap-3 rounded-2xl bg-red-50 px-5 py-4 text-base font-black text-red-600 transition hover:scale-[0.99] hover:bg-red-100"
        >
          <LogOut className="text-2xl" />
          Keluar dari Akun
        </a>
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
