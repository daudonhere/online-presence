"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Camera,
  CameraOff,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Html5Qrcode } from "html5-qrcode";

type ScanState = "idle" | "scanning" | "detecting" | "submitting" | "success" | "error" | "no-permission" | "geo-error";

export default function ScanPage() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [geoError, setGeoError] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const handleScanRef = useRef<(qrData: string) => void>(() => {});

  const submitMutation = useMutation({
    mutationFn: async ({ qrData, latitude, longitude }: { qrData: string; latitude: number; longitude: number }) => {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData, latitude, longitude }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim absensi.");
      return data;
    },
    onSuccess: () => {
      setScanState("success");
      try {
        const audio = new Audio("/icons/beep.mp3");
        audio.play().catch(() => {});
      } catch {}
    },
    onError: (err: Error) => {
      setGeoError(err.message);
      setScanState("error");
    },
  });

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && startedRef.current) {
      try {
        await scannerRef.current.stop();
        startedRef.current = false;
      } catch {
        // already stopped
      }
    }
  }, []);

  useEffect(() => {
    handleScanRef.current = async (qrData: string) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      await stopScanner();
      setScanState("detecting");
      setGeoError("");

      if (!navigator.geolocation) {
        setGeoError("Perangkat tidak mendukung GPS");
        setScanState("geo-error");
        return;
      }

      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        if (permission.state === "denied") {
          setGeoError("Izin lokasi ditolak. Aktifkan di Pengaturan Browser > Privasi > Lokasi.");
          setScanState("geo-error");
          return;
        }
      } catch {
        // permissions API not supported, proceed with getCurrentPosition
      }

      setScanState("submitting");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          submitMutation.mutate({
            qrData,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          let msg = "Gagal mendapatkan lokasi. Aktifkan GPS lalu coba lagi.";
          if (err.code === 1) {
            msg = "Izin lokasi ditolak. Aktifkan akses lokasi di pengaturan perangkat Anda.";
          } else if (err.code === 2) {
            msg = "Lokasi tidak tersedia. Pastikan GPS perangkat aktif.";
          } else if (err.code === 3) {
            msg = "Permintaan lokasi melewati batas waktu. Pastikan GPS aktif dan coba lagi.";
          }
          setGeoError(msg);
          setScanState("geo-error");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };
  }, [stopScanner, submitMutation]);

  const startScanner = useCallback(async () => {
    if (!containerRef.current || startedRef.current) return;

    const scannerId = "qr-scanner-" + Date.now();
    const container = containerRef.current;
    container.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.id = scannerId;
    wrapper.className = "w-full h-full";
    container.appendChild(wrapper);

    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1,
          disableFlip: false,
        },
        (decodedText) => {
          handleScanRef.current(decodedText);
        },
        () => {
          // QR not found — keep scanning
        }
      );
      startedRef.current = true;
      setScanState("scanning");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Permission") || msg.includes("permission") || msg.includes("NotAllowed")) {
        setScanState("no-permission");
      } else {
        setScanState("error");
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const handleRetry = () => {
    submittedRef.current = false;
    setGeoError("");
    setScanState("idle");
    startedRef.current = false;
    setTimeout(startScanner, 300);
  };

  return (
    <DashboardLayout>
      <section className="w-full max-w-md mx-auto h-full rounded-[34px] bg-white p-4 shadow-soft ring-1 ring-slate-100 flex flex-col">
        <div className="rounded-[30px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white overflow-hidden relative flex-1 flex flex-col">
          <div className="absolute -right-16 -top-10 h-44 w-44 rounded-bl-[64px] bg-[#ffff00] z-0" />
          <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-[#003d7a]/25" />
          <div className="absolute right-6 top-24 grid grid-cols-2 gap-1 opacity-80">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#ffff00]" />
            ))}
          </div>

          <div className="relative flex items-center justify-between gap-3">
            <Link
              href="/"
              className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/15 flex items-center justify-center ring-1 ring-white/20 transition hover:bg-white/25"
              aria-label="Kembali ke halaman absensi"
            >
              <ArrowLeft className="text-xl text-white" />
            </Link>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/90 ring-1 ring-white/15">
                <span className="h-2 w-2 rounded-full bg-[#ffff00]" />
                Pemindai QR
              </div>
            </div>
          </div>

          <div className="relative mt-4 flex-1 rounded-[28px] bg-slate-950/40 p-3 ring-1 ring-white/15 shadow-card flex items-center justify-center">
            <div className="relative w-full max-w-[286px] aspect-square overflow-hidden rounded-[22px] bg-gradient-to-br from-slate-900 via-[#0b3f2d] to-[#003d7a]">
              <div
                ref={containerRef}
                className="absolute inset-0 flex items-center justify-center [&>div]:w-full [&>div]:h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover"
              />

              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute left-0 top-0 h-12 w-12 rounded-tl-3xl border-l-4 border-t-4 border-[#ffff00]" />
                <div className="absolute right-0 top-0 h-12 w-12 rounded-tr-3xl border-r-4 border-t-4 border-[#ffff00]" />
                <div className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-3xl border-b-4 border-l-4 border-[#ffff00]" />
                <div className="absolute bottom-0 right-0 h-12 w-12 rounded-br-3xl border-b-4 border-r-4 border-[#ffff00]" />
              </div>

              {scanState === "scanning" && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-[#ffff00] shadow-[0_0_24px_rgba(255,255,0,0.95)] animate-[scan_2.2s_ease-in-out_infinite] z-20" />
              )}

              {scanState === "idle" && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="flex flex-col items-center gap-3">
                    <Camera className="h-12 w-12 text-white/50" />
                    <p className="text-sm text-white/60 font-medium">
                      Memulai kamera...
                    </p>
                  </div>
                </div>
              )}

              {scanState === "no-permission" && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-950/60">
                  <div className="flex flex-col items-center gap-3 px-6 text-center">
                    <CameraOff className="h-12 w-12 text-red-400" />
                    <p className="text-sm text-white/80 font-medium">
                      Akses kamera ditolak
                    </p>
                    <p className="text-xs text-white/50">
                      Izinkan akses kamera di pengaturan browser Anda
                    </p>
                    <button
                      onClick={handleRetry}
                      className="mt-2 flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-xs font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Coba Lagi
                    </button>
                  </div>
                </div>
              )}

              {scanState === "error" && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-950/60">
                  <div className="flex flex-col items-center gap-3 px-6 text-center">
                    <CameraOff className="h-12 w-12 text-red-400" />
                    <p className="text-sm text-white/80 font-medium">
                      Gagal memulai kamera
                    </p>
                    <button
                      onClick={handleRetry}
                      className="mt-2 flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-xs font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Coba Lagi
                    </button>
                  </div>
                </div>
              )}

              {scanState === "geo-error" && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-950/60">
                  <div className="flex flex-col items-center gap-3 px-6 text-center">
                    <div className="h-14 w-14 rounded-full bg-red-500/20 flex items-center justify-center">
                      <CameraOff className="h-8 w-8 text-red-400" />
                    </div>
                    <p className="text-sm text-white/90 font-bold leading-snug">
                      {geoError}
                    </p>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Buka <span className="font-bold text-white/70">Pengaturan Perangkat</span> &gt; <span className="font-bold text-white/70">Privasi</span> &gt; <span className="font-bold text-white/70">Lokasi</span>, lalu aktifkan akses lokasi untuk browser ini.
                    </p>
                    <button
                      onClick={handleRetry}
                      className="mt-2 flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-xs font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Coba Lagi
                    </button>
                  </div>
                </div>
              )}

              {(scanState === "detecting" || scanState === "submitting") && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-950/70">
                  <div className="flex flex-col items-center gap-3 px-6 text-center">
                    <Loader2 className="h-12 w-12 text-[#ffff00] animate-spin" />
                    <p className="text-sm text-white font-bold">
                      {scanState === "detecting" ? "QR Terdeteksi!" : "Mengirim absensi..."}
                    </p>
                  </div>
                </div>
              )}

              {scanState === "success" && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-950/70">
                  <div className="flex flex-col items-center gap-3 px-6 text-center">
                    <div className="h-16 w-16 rounded-full bg-[#1b8659] flex items-center justify-center">
                      <CheckCircle2 className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-sm text-white font-bold">
                      Absensi Berhasil!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative mt-4 space-y-3">
            {scanState === "success" ? (
              <div className="min-h-[58px] w-full rounded-2xl bg-[#1b8659] px-5 py-4 text-center text-base font-black text-white flex items-center justify-center gap-2 shadow-card">
                <CheckCircle2 className="text-2xl" />
                Absensi berhasil!
              </div>
            ) : scanState === "geo-error" ? (
              <button
                onClick={handleRetry}
                className="min-h-[58px] w-full rounded-2xl bg-[#ffff00] px-5 py-4 text-center text-base font-black text-[#003d7a] transition hover:scale-[0.98] flex items-center justify-center gap-2 shadow-card"
              >
                <RefreshCw className="text-2xl" />
                Coba Lagi
              </button>
            ) : (
              <div className="min-h-[58px] w-full rounded-2xl bg-white/20 px-5 py-4 text-center text-sm font-bold text-white/70 flex items-center justify-center gap-2">
                <Loader2 className="text-lg animate-spin" />
                Arahkan kamera ke QR Code
              </div>
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
