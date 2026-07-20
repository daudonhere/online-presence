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

type ScanState = "idle" | "scanning" | "success" | "error" | "no-permission";

export default function ScanPage() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scannedResult, setScannedResult] = useState<string>("");
  const [geoError, setGeoError] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

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
      try {
        const audio = new Audio("/icons/beep.mp3");
        audio.play().catch(() => {});
      } catch {}
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
          setScannedResult(decodedText);
          setScanState("success");
          stopScanner();
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
  }, [stopScanner]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const handleSubmit = () => {
    if (!scannedResult || submitMutation.isPending) return;
    setGeoError("");

    if (!navigator.geolocation) {
      setGeoError("Perangkat tidak mendukung GPS");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        submitMutation.mutate({
          qrData: scannedResult,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {
        setGeoError("Gagal mendapatkan lokasi. Aktifkan GPS lalu coba lagi.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
              {/* Camera feed mounts here */}
              <div
                ref={containerRef}
                className="absolute inset-0 flex items-center justify-center [&>div]:w-full [&>div]:h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover"
              />

              {/* Corner borders overlay */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute left-0 top-0 h-12 w-12 rounded-tl-3xl border-l-4 border-t-4 border-[#ffff00]" />
                <div className="absolute right-0 top-0 h-12 w-12 rounded-tr-3xl border-r-4 border-t-4 border-[#ffff00]" />
                <div className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-3xl border-b-4 border-l-4 border-[#ffff00]" />
                <div className="absolute bottom-0 right-0 h-12 w-12 rounded-br-3xl border-b-4 border-r-4 border-[#ffff00]" />
              </div>

              {/* Scan line animation — only while scanning */}
              {scanState === "scanning" && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-[#ffff00] shadow-[0_0_24px_rgba(255,255,0,0.95)] animate-[scan_2.2s_ease-in-out_infinite] z-20" />
              )}

              {/* Status overlays */}
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
                      onClick={() => {
                        startedRef.current = false;
                        setScanState("idle");
                        setTimeout(startScanner, 300);
                      }}
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
                      onClick={() => {
                        startedRef.current = false;
                        setScanState("idle");
                        setTimeout(startScanner, 300);
                      }}
                      className="mt-2 flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-xs font-bold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Coba Lagi
                    </button>
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
                      QR Terdeteksi!
                    </p>
                    <p className="text-xs text-white/60">
                      Tekan tombol di bawah untuk mengirim absensi
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative mt-4 space-y-3">
            {submitMutation.isSuccess ? (
              <div className="min-h-[58px] w-full rounded-2xl bg-[#1b8659] px-5 py-4 text-center text-base font-black text-white flex items-center justify-center gap-2 shadow-card">
                <CheckCircle2 className="text-2xl" />
                Absensi berhasil!
              </div>
            ) : (
              <>
                <button
                  disabled={scanState !== "success" || submitMutation.isPending}
                  onClick={handleSubmit}
                  className="min-h-[58px] w-full rounded-2xl bg-[#ffff00] px-5 py-4 text-center text-base font-black text-[#003d7a] transition hover:scale-[0.98] flex items-center justify-center gap-2 shadow-card disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="text-2xl animate-spin" />
                  ) : (
                    <CheckCircle2 className="text-2xl" />
                  )}
                  {submitMutation.isPending ? "Mengirim..." : "Kirim Absensi"}
                </button>
                {submitMutation.isError && (
                  <p className="text-sm text-red-500 font-medium text-center">{submitMutation.error.message}</p>
                )}
                {geoError && !submitMutation.isError && (
                  <p className="text-sm text-red-500 font-medium text-center">{geoError}</p>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
