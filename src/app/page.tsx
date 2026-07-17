import Link from "next/link";
import { ScanLine, Pointer } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { QrUserId } from "@/components/ui/QrUserId";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  const user = session?.user;
  const userId = user?.id ? Number(user.id) : 0;
  const userName = user?.name || "Guru";

  return (
    <DashboardLayout>
      <section className="w-full max-w-md mx-auto rounded-[34px] bg-white p-5 shadow-soft ring-1 ring-slate-100">
        <div className="rounded-[30px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-6 text-white overflow-hidden relative min-h-[440px] flex flex-col justify-between">
          <div className="absolute -right-16 -top-10 h-44 w-44 rounded-bl-[64px] bg-[#ffff00] z-0" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#003d7a]/25" />
          <div className="absolute right-8 top-8 grid grid-cols-2 gap-1 opacity-80">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#ffff00]" />
            ))}
          </div>

          <div className="relative flex-1 flex items-center justify-center">
            <div className="relative h-52 w-52 rounded-[34px] bg-white shadow-card ring-4 ring-[#ffff00]/40 overflow-hidden flex items-center justify-center p-2">
              <QrUserId userId={userId} name={userName} />
            </div>
          </div>

          <div className="relative mt-8 space-y-3">
            <Link
              href="/scan"
              className="min-h-[58px] w-full rounded-2xl bg-[#ffff00] px-5 py-4 text-center text-base font-black text-[#003d7a] transition hover:scale-[0.98] flex items-center justify-center gap-2 shadow-card"
            >
              <ScanLine className="text-2xl" />
              Scan QR
            </Link>
            {user?.role !== "admin" && (
              <Link
                href="/manual"
                className="min-h-[58px] w-full rounded-2xl bg-white px-5 py-4 text-center text-base font-black text-[#1b8659] transition hover:scale-[0.98] flex items-center justify-center gap-2 shadow-card"
              >
                <Pointer className="text-2xl" />
                Absen Manual
              </Link>
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
