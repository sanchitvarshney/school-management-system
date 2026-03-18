"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Home,
  Menu,
  Bell,
  MessageCircleQuestion,
  Settings,
  X,
  Pencil,
  UserPlus,
} from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sessions = ["2024-2025", "2025-2026", "2026-2027"] as const;
  const [sessionValue, setSessionValue] = useState<string>(sessions[1]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const fromStorage = localStorage.getItem("sms:session");
        if (fromStorage) setSessionValue(fromStorage);
      } catch {}
    };
    read();
    window.addEventListener("sms:session-changed", read);
    return () => window.removeEventListener("sms:session-changed", read);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotificationsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [notificationsOpen]);

  const nav: any = [
    { href: "/", label: "Home", icon: Home },
    { href: "/menu", label: "Menu", icon: Menu },
  ];

  function setSession(next: string) {
    try {
      localStorage.setItem("sms:session", next);
      setSessionValue(next);
      window.dispatchEvent(new Event("sms:session-changed"));
    } catch {}
  }

  return (
    <div className="h-screen w-full grid grid-cols-[72px_1fr] grid-rows-[56px_1fr]">
      <aside className="row-span-2 bg-white border-r border-gray-200 flex flex-col items-center gap-6 py-4">
        <div className="h-8 w-8 rounded-full bg-indigo-600" title="School MS" />
        <nav className="flex flex-col my-auto items-center gap-3 ">
          {nav.map((item: any) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={[
                  "h-10 w-10 rounded-xl flex items-center justify-center border transition-colors",
                  active
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-200",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="h-10 w-10 rounded-xl flex items-center relative justify-center hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors mt-auto"
          onClick={() => setNotificationsOpen(true)}
          aria-label="Open notifications"
          title="Notifications"
        >
          <Bell className="h-6 w-6 text-gray-700" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
            2
          </span>
        </button>
        <Settings className="h-6 w-6 text-gray-700" />
      </aside>

      <header className="col-start-2 col-end-3 border-b border-gray-200 flex items-center justify-between px-4 py-2 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Session</span>
            <div className="relative">
              <select
                className="h-9 appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-9 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600"
                value={sessionValue}
                onChange={(e) => setSession(e.target.value)}
              >
                {sessions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => {
              try {
                localStorage.removeItem("sms:db");
                window.location.reload();
              } catch {}
            }}
            title="Reset demo data"
          >
            Reset
          </button>
        </div>
      </header>

      <main className="col-start-2 col-end-3 overflow-auto bg-gray-50">
        <div className="p-6">{children}</div>
      </main>

      {notificationsOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/20"
            onClick={() => setNotificationsOpen(false)}
            aria-label="Close notifications"
          />
          <div className="absolute left-[84px] top-3 bottom-3 w-[min(420px,calc(100vw-84px-12px))] bg-white shadow-2xl border border-gray-200 rounded-3xl overflow-hidden">
            <div className="h-[64px] px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="h-10 w-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
                  onClick={() => setNotificationsOpen(false)}
                  aria-label="Close"
                  title="Close"
                >
                  <X className="h-5 w-5 text-gray-800" />
                </button>
                <div className="text-base font-semibold text-gray-900">
                  Messages
                </div>
              </div>
              <button
                type="button"
                className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700"
                aria-label="New message"
                title="New message"
              >
                <Pencil className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 pb-3">
              <div className="text-xs font-semibold text-gray-700">
                Messages
              </div>
            </div>

            <div className="px-4 pb-4 overflow-auto h-[calc(100%-64px-12px-32px)] space-y-3">
              <NotificationItem
                title="Message 1"
                subtitle="Sent an update"
                time="1h"
                active
                avatarText="S"
              />
              <NotificationItem
                title="Message 2"
                subtitle="Fee reminder created"
                time="5h"
                avatarText="F"
              />

              <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">
                    Invite your friends
                  </div>
                  <div className="text-sm text-gray-600">
                    Connect to start chatting
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  title,
  subtitle,
  time,
  active,
  avatarText,
}: {
  title: string;
  subtitle: string;
  time: string;
  active?: boolean;
  avatarText: string;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3 rounded-2xl px-3 py-3 border",
        active
          ? "border-indigo-300 bg-indigo-50/40"
          : "border-transparent hover:bg-gray-50",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-900 font-semibold">
          {avatarText}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {title}
          </div>
          <div className="text-sm text-gray-600 truncate">{subtitle}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-xs text-gray-500">{time}</div>
        <button
          type="button"
          className="h-9 w-9 rounded-xl hover:bg-gray-100 text-gray-700"
          aria-label="More"
          title="More"
        >
          …
        </button>
      </div>
    </div>
  );
}
