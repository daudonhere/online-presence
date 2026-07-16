import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-28 flex flex-col items-center hide-scrollbar">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
