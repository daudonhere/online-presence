"use client";

import {
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Download,
  Smartphone,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<(Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }) | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;

    if (isStandalone) return;
    if (sessionStorage.getItem("pwa-banner-dismissed")) return;

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

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!name.trim() || !phone.trim() || !password) {
        setError("Semua field wajib diisi");
        return;
      }
      if (password !== retypePassword) {
        setError("Password tidak cocok");
        return;
      }
      if (password.length < 6) {
        setError("Password minimal 6 karakter");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), phone: phone.trim(), password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Registrasi gagal");
          setLoading(false);
          return;
        }

        // Auto-login after register
        const loginResult = await signIn("credentials", {
          phone: phone.trim(),
          password,
          redirect: false,
        });

        if (loginResult?.error) {
          setError("Registrasi berhasil, tapi login otomatis gagal. Silakan login manual.");
          setMode("login");
          setLoading(false);
          return;
        }

        router.push("/");
        router.refresh();
      } catch {
        setError("Terjadi kesalahan jaringan");
        setLoading(false);
      }
    } else {
      if (!phone.trim() || !password) {
        setError("Telepon dan password wajib diisi");
        return;
      }

      setLoading(true);
      try {
        const result = await signIn("credentials", {
          phone: phone.trim(),
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Nomor telepon atau password salah");
          setLoading(false);
          return;
        }

        router.push("/");
        router.refresh();
      } catch {
        setError("Terjadi kesalahan jaringan");
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <section className="w-full rounded-b-[34px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] px-6 pt-8 pb-6 text-white overflow-hidden relative">
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#003d7a]/25" />
        <div className="absolute right-8 top-8 grid grid-cols-2 gap-1 opacity-80">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#ffff00]" />
          ))}
        </div>

        <div className="relative mt-5 flex flex-col items-center justify-end pb-2">
          <div className="h-20 w-20 rounded-2xl bg-white p-1.5 shadow-card ring-4 ring-[#ffff00]/40">
            <img // eslint-disable-line @next/next/no-img-element
              src="/icons/logo.png"
              alt="Logo Al-Riyadl"
              className="h-full w-full rounded-xl object-contain"
            />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
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
        <section className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-card ring-2 ring-[#1b8659]/30 -mt-[12%]">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

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
              disabled={loading}
              className="min-h-[58px] w-full rounded-2xl bg-[#ffff00] px-5 py-4 text-base font-black text-[#003d7a] shadow-card transition hover:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <Loader2 className="text-2xl animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Masuk" : "Daftar Sekarang"}
                  <ArrowRight className="text-2xl" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            {mode === "login" ? (
              <p className="text-sm text-slate-500">
                Belum punya akun?{" "}
                <button
                  onClick={() => { setMode("register"); setError(""); }}
                  className="font-bold text-[#1b8659] hover:underline"
                >
                  Daftar di sini
                </button>
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Sudah punya akun?{" "}
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className="font-bold text-[#1b8659] hover:underline"
                >
                  Masuk di sini
                </button>
              </p>
            )}
          </div>
        </section>
      </main>

      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-[slideUp_0.4s_ease-out]">
          <div className="mx-auto max-w-md p-4">
            <div className="rounded-[24px] bg-[#0a0a0a] p-5 shadow-[0_-4px_30px_rgba(0,0,0,0.4)]">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Smartphone className="text-2xl text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold tracking-tight text-white">
                    Install Absensi Al-Riyadl
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">
                    Pasang aplikasi ini di perangkat Anda untuk akses lebih cepat dan notifikasi absensi.
                  </p>
                </div>
                <button
                  onClick={handleDismissBanner}
                  className="h-8 w-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition"
                  aria-label="Tutup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleInstall}
                className="mt-4 min-h-[50px] w-full rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/90 flex items-center justify-center gap-2"
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
