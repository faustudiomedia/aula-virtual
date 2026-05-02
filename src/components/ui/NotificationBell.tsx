"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notifications";

type Notif = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

const TYPE_ICON: Record<string, string> = {
  message:              "💬",
  certificate_request:  "📋",
  certificate_approved: "🎓",
  certificate_rejected: "❌",
  announcement:         "📢",
  assignment:           "📝",
  general:              "🔔",
};

export function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.is_read).length;

  // Initial fetch
  useEffect(() => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("notifications")
      .select("id, type, title, message, link_url, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }: { data: Notif[] | null }) => {
        if (data) setNotifs(data);
      });
  }, [userId]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifs(prev => [payload.new as Notif, ...prev].slice(0, 30));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleClick(notif: Notif) {
    if (!notif.is_read) {
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      startTransition(() => markNotificationAsRead(notif.id));
    }
    setOpen(false);
    if (notif.link_url) router.push(notif.link_url);
  }

  function handleMarkAll() {
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    startTransition(() => markAllNotificationsAsRead());
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-black/5 transition-colors text-[var(--ag-text-muted)] hover:text-[var(--ag-text)]"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[var(--ag-navy)] text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-black/5 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
            <p className="text-sm font-bold text-[var(--ag-text)]">Notificaciones</p>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-[var(--ag-navy)] font-medium hover:underline"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-black/5">
            {notifs.length === 0 ? (
              <div className="py-10 text-center text-[var(--ag-text)]/30 text-sm">
                <p className="text-2xl mb-2">🔔</p>
                No tenés notificaciones.
              </div>
            ) : (
              notifs.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-white transition-colors flex items-start gap-3 ${
                    !n.is_read ? "bg-[rgba(30,58,95,0.08)]/60" : ""
                  }`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {TYPE_ICON[n.type] ?? "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold text-[var(--ag-text)]" : "text-[var(--ag-text)]/70"}`}>
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="text-xs text-[var(--ag-text-muted)] mt-0.5 line-clamp-2">{n.message}</p>
                    )}
                    <p className="text-[10px] text-[var(--ag-text)]/30 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[var(--ag-navy)] flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
