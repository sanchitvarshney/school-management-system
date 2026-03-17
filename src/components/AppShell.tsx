"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  CreditCard,
  GraduationCap,
  Home,
  IdCard,
  LayoutGrid,
  School,
  Users,
  Menu,
  Bell,
  MessageCircleQuestion,
  Settings,
} from "lucide-react";

export function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const sessions = ["2024-2025", "2025-2026", "2026-2027"] as const;
  const [sessionValue, setSessionValue] = useState<string>(sessions[1]);

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

  const nav = useMemo(
    () =>
      [
        { href: "/", label: "Home", icon: Home },
        { href: "/menu", label: "Menu", icon: Menu },
      ] as const,
    []
  );

  function setSession(next: string) {
    try {
      localStorage.setItem("sms:session", next);
      setSessionValue(next);
      window.dispatchEvent(new Event("sms:session-changed"));
    } catch {}
  }

  return (
    <div className="h-screen w-full grid grid-cols-[72px_1fr] grid-rows-[56px_1fr]">
      {/* Old-style slim icon rail */}
      <aside className="row-span-2 bg-white border-r border-gray-200 flex flex-col items-center gap-6 py-4">
        <div className="h-8 w-8 rounded-full bg-indigo-600" title="School MS" />
        <div className="h-8 w-8 rounded-lg border" title="Logo" />

        <nav className="flex flex-col items-center gap-3">
          {nav.map((item) => {
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

        <div className="relative">
          <Bell className="h-6 w-6 text-gray-700" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
            2
          </span>
        </div>
        <MessageCircleQuestion className="h-6 w-6 mt-auto text-gray-700" />
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
    </div>
  );
}

