"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CloseRounded as CloseIcon,
  HomeRounded as HomeIcon,
  KeyboardArrowDownRounded as KeyboardArrowDownIcon,
  LogoutRounded as LogoutIcon,
  MenuRounded as MenuIcon,
  NotificationsNoneRounded as NotificationsIcon,
  PersonAddRounded as PersonAddIcon,
  SettingsRounded as SettingsIcon,
} from "@mui/icons-material";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { IconButton } from "@mui/material";

/** Demo account; replace with real auth user when available */
const defaultAccount = {
  firstName: "Admin",
  lastName: "User",
  email: "admin@school.edu",
  avatarUrl: "https://github.com/shadcn.png",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const sessions = ["2024-2025", "2025-2026", "2026-2027"] as const;
  const [sessionValue, setSessionValue] = useState<string>(sessions[1]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const userMenuOpen = Boolean(userMenuAnchor);
  const data = defaultAccount;

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

  const nav = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/menu", label: "Menu", icon: MenuIcon },
  ];

  function setSession(next: string) {
    try {
      localStorage.setItem("sms:session", next);
      setSessionValue(next);
      window.dispatchEvent(new Event("sms:session-changed"));
    } catch {}
  }

  function closeUserMenu() {
    setUserMenuAnchor(null);
  }

  function handleLogout() {
    closeUserMenu();
    try {
      localStorage.removeItem("sms:session");
    } catch {}
    router.push("/");
  }

  return (
    <div className="h-screen w-full grid grid-cols-[72px_1fr] grid-rows-[56px_1fr]">
      <aside className="row-span-2 bg-[#fff] border-r-2 border-r-[#00a6f4] flex flex-col items-center gap-6 py-4">
        <div className="h-8 w-8 rounded-full bg-indigo-600" title="School MS" />
        <nav className="flex flex-col my-auto items-center gap-3 ">
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
                <Icon sx={{ fontSize: 20 }} />
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
          <NotificationsIcon sx={{ fontSize: 22, color: "#374151" }} />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
            2
          </span>
        </button>
        <SettingsIcon sx={{ fontSize: 22, color: "#374151" }} />
      </aside>

      <header className="col-start-2 col-end-3 border-b-4 border-b-[#00a6f4] flex items-center justify-between px-4 py-[10px] bg-[#cefafe]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Session</span>
            <FormControl size="small">
              <Select
                value={sessionValue}
                onChange={(e) => setSession(String(e.target.value))}
                sx={{
                  height: 36,
                  minWidth: 140,
                  borderRadius: 2,
                  backgroundColor: "#fff",
                  ".MuiSelect-select": {
                    py: 0.5,
                    fontSize: 14,
                    fontWeight: 600,
                  },
                }}
              >
                {sessions.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Avoid nesting <button> inside <button> (IconButton is a <button>) */}
          <div className="flex items-center justify-between gap-2 bg-white max-w-[280px] w-full px-3 py-2 rounded-lg border border-gray-200">
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
              <Avatar
                src={data.avatarUrl}
                alt=""
                sx={{ width: 36, height: 36 }}
              />
            </span>
            <IconButton
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              sx={{}}
            >
              {" "}
              <KeyboardArrowDownIcon
                sx={{ flexShrink: 0, color: "text.secondary", fontSize: 22 }}
              />
            </IconButton>
          </div>
          <Menu
            anchorEl={userMenuAnchor}
            open={userMenuOpen}
            onClose={closeUserMenu}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "bottom", horizontal: "right" }}
            slotProps={{
              paper: {
                elevation: 4,
                sx: {
                  minWidth: 220,
                  mt: 4,
                  ml: 0,
                  borderRadius: 1,
                  p: 2,
                  bgcolor: "background.paper",
                  overflow: "visible",
                },
              },
            }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <Avatar
                src={data.avatarUrl}
                alt=""
                sx={{ width: 36, height: 36 }}
              />

              <div className="flex min-w-0 flex-col items-start text-left">
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.primary"
                  noWrap
                  sx={{ maxWidth: 140, lineHeight: 1.2 }}
                >
                  {data.firstName} {data.lastName}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ maxWidth: 160, fontSize: 13 }}
                >
                  {data.email ?? ""}
                </Typography>
              </div>
            </div>

            <MenuItem onClick={handleLogout} sx={{ py: 1, mt: 1 }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: "#4b5563" }} />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </div>
      </header>

      <main className="col-start-2 col-end-3 overflow-auto bg-gray-50">
        <div className="p-0">{children}</div>
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
                  <CloseIcon sx={{ fontSize: 20, color: "#1f2937" }} />
                </button>
                <div className="text-base font-semibold text-gray-900">
                  Messages
                </div>
              </div>
              <span className="text-xs text-gray-500 cursor-pointer hover:underline ">
                Mark all as read
              </span>
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
                  <PersonAddIcon sx={{ fontSize: 22 }} />
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
      <div className="shrink-0 text-xs text-gray-500">{time}</div>
    </div>
  );
}
