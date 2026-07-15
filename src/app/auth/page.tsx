"use client";

import {
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Download,
  X,
  Smartphone,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<(Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }) | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as typeof deferredPrompt);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setIsDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && password !== retypePassword) {
      alert("Password tidak cocok");
      return;
    }
    alert(mode === "login" ? "Login berhasil" : "Register berhasil");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <section className="w-full rounded-b-[34px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-6 pb-20 text-white overflow-hidden relative">
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#003d7a]/25" />
        <div className="absolute right-8 top-8 grid grid-cols-2 gap-1 opacity-80">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#ffff00]" />
          ))}
        </div>

        <div className="relative mt-5 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {mode === "login" ? "Selamat Datang" : "Buat Akun Baru"}
          </h1>
          <p className="mt-2 text-sm text-white/80">
            {mode === "login"
              ? "Masuk ke akun absensi guru Anda"
              : "Daftar untuk mulai menggunakan absensi"}
          </p>
        </div>
      </section>

      <main className="flex-1 px-5 flex items-center justify-center">
        <section className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-card ring-2 ring-[#1b8659]/30">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <User className="text-lg text-[#1b8659]" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 min-h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold text-slate-900 outline-none transition focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Phone className="text-lg text-[#1b8659]" />
                Nomor Telepon
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 min-h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold text-slate-900 outline-none transition focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Lock className="text-lg text-[#1b8659]" />
                Password
              </label>
              <div className="mt-2 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-base font-semibold text-slate-900 outline-none transition focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="text-xl" />
                  ) : (
                    <Eye className="text-xl" />
                  )}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Lock className="text-lg text-[#1b8659]" />
                  Ketik Ulang Password
                </label>
                <div className="mt-2 relative">
                  <input
                    type={showRetypePassword ? "text" : "password"}
                    value={retypePassword}
                    onChange={(e) => setRetypePassword(e.target.value)}
                    className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-base font-semibold text-slate-900 outline-none transition focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    placeholder="Ulangi password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRetypePassword(!showRetypePassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showRetypePassword ? (
                      <EyeOff className="text-xl" />
                    ) : (
                      <Eye className="text-xl" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="min-h-[58px] w-full rounded-2xl bg-[#ffff00] px-5 py-4 text-base font-black text-[#003d7a] shadow-card transition hover:scale-[0.98] flex items-center justify-center gap-2"
            >
              {mode === "login" ? "Masuk" : "Daftar Sekarang"}
              <ArrowRight className="text-2xl" />
            </button>
          </form>

          <div className="mt-5 text-center">
            {mode === "login" ? (
              <p className="text-sm text-slate-500">
                Belum punya akun?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="font-bold text-[#1b8659] hover:underline"
                >
                  Daftar di sini
                </button>
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Sudah punya akun?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="font-bold text-[#1b8659] hover:underline"
                >
                  Masuk di sini
                </button>
              </p>
            )}
          </div>
        </section>
      </main>

      {showInstallBanner && !isDismissed && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-[slideUp_0.4s_ease-out]">
          <div className="mx-auto max-w-md p-4">
            <div className="rounded-[24px] bg-white p-5 shadow-[0_-4px_30px_rgba(0,0,0,0.15)] ring-1 ring-slate-100">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#0c6b46] to-[#1b8659] flex items-center justify-center">
                  <Smartphone className="text-2xl text-[#ffff00]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base font-bold tracking-tight text-slate-950">
                    Install Absensi Guru
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    Pasang aplikasi ini di perangkat Anda untuk akses lebih cepat dan notifikasi absensi.
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="h-8 w-8 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition"
                >
                  <X className="text-lg" />
                </button>
              </div>
              <button
                onClick={handleInstall}
                className="mt-4 min-h-[50px] w-full rounded-2xl bg-[#1b8659] px-5 py-3 text-sm font-black text-[#ffff00] shadow-card transition hover:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Download className="text-xl" />
                Install Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
