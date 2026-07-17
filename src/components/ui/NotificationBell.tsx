"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Loader2,
  Inbox,
  Calendar,
  FileClock,
  Info,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

const TYPE_ICON: Record<string, typeof Bell> = {
  attendance: Calendar,
  obstacle: FileClock,
  system: Info,
};

const TYPE_COLOR: Record<string, string> = {
  attendance: "bg-emerald-100 text-[#1b8659]",
  obstacle: "bg-amber-100 text-amber-600",
  system: "bg-slate-100 text-slate-500",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

const MAX_VISIBLE = 5;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: queryKeys.notifications.list,
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Gagal memuat notifikasi");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Gagal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", { method: "PATCH" });
      if (!res.ok) throw new Error("Gagal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list });
    },
  });

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      panelRef.current &&
      !panelRef.current.contains(e.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;
  const hasNotif = notifications.length > 0;
  const visibleNotifs = hasNotif ? notifications.slice(0, MAX_VISIBLE) : [];
  const hiddenCount = notifications.length - MAX_VISIBLE;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="relative min-h-[44px] min-w-[44px] rounded-2xl bg-white/15 flex items-center justify-center ring-1 ring-white/20 transition hover:bg-white/25"
        aria-label="Notifikasi"
      >
        <Bell className="text-xl text-white" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ffff00] px-1 text-[10px] font-black text-[#003d7a]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed right-4 top-[72px] z-[9999] w-[calc(100vw-32px)] max-w-[380px] rounded-[24px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] ring-1 ring-slate-100 flex flex-col overflow-hidden"
          style={{ height: hasNotif ? "min(calc(100dvh - 120px), 420px)" : "auto" }}
        >
          <div className="flex items-center justify-between border-b-2 border-[#1b8659]/20 px-4 py-3">
            <h3 className="font-display text-base font-bold text-slate-950">
              Notifikasi
            </h3>
            <div className="flex items-center gap-2">
              {hasUnread && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#1b8659] transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  {markAllReadMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3 w-3" />
                  )}
                  Baca Semua
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-[#1b8659]" />
              </div>
            ) : !hasNotif ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Inbox className="h-7 w-7 text-slate-400" />
                </div>
                <p className="mt-3 text-sm font-bold text-slate-500">
                  Belum ada notifikasi
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Notifikasi akan muncul di sini
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {visibleNotifs.map((notif) => {
                  const Icon = TYPE_ICON[notif.type] ?? Info;
                  const iconColor = TYPE_COLOR[notif.type] ?? TYPE_COLOR.system;

                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50 ${
                        !notif.isRead ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-snug ${!notif.isRead ? "font-bold text-slate-950" : "font-medium text-slate-700"}`}>
                            {notif.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(notif.id);
                            }}
                            className="mt-0.5 shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            aria-label="Hapus notifikasi"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
                          {notif.message}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[10px] font-medium text-slate-400">
                            {timeAgo(notif.createdAt)}
                          </span>
                          {!notif.isRead && (
                            <button
                              onClick={() => markReadMutation.mutate(notif.id)}
                              disabled={markReadMutation.isPending}
                              className="text-[10px] font-bold text-[#1b8659] hover:underline disabled:opacity-50"
                            >
                              Tandai sudah dibaca
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {hiddenCount > 0 && (
                  <div className="px-4 py-2.5 text-center">
                    <p className="text-xs font-medium text-slate-400">
                      +{hiddenCount} notifikasi lainnya
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
