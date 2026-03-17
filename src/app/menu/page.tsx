"use client";

import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  School,
  LayoutGrid,
  CreditCard,
  BookOpen,
  IdCard,
  FileText,
  ClipboardList,
} from "lucide-react";

const tiles = [
  { href: "/students", label: "Student", Icon: GraduationCap },
  { href: "/teachers", label: "Teacher", Icon: Users },
  { href: "/classes", label: "Class", Icon: School },
  { href: "/sections", label: "Section", Icon: LayoutGrid },
  { href: "/fees", label: "Fees", Icon: CreditCard, accent: true },
  { href: "/exams", label: "Exam", Icon: BookOpen },
  { href: "/id", label: "ID Generate", Icon: IdCard },
  { href: "#", label: "Report", Icon: FileText, disabled: true },
  { href: "#", label: "Attendance", Icon: ClipboardList, disabled: true },
] as const;

export default function MenuPage() {
  return (
    <AppShell>
      <div className="min-h-[calc(100vh-56px)] flex flex-col justify-center gap-4">
        {/* Center menu panel */}
        <div className="mx-auto w-full max-w-5xl rounded-md border border-gray-300 bg-gray-200 p-6">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {tiles.map(({ href, label, Icon, accent, disabled }) => {
              const base =
                "group relative h-[92px] rounded-sm border border-gray-400 bg-cyan-100 flex flex-col items-center justify-center gap-2 transition-colors";
              const style = disabled
                ? "opacity-70 cursor-not-allowed"
                : accent
                  ? "bg-sky-500 text-white hover:bg-sky-600 border-sky-600"
                  : "text-gray-900 hover:bg-cyan-200";

              const content = (
                <>
                  <Icon className={accent ? "h-8 w-8" : "h-8 w-8"} />
                  <div className="text-[11px] font-semibold">{label}</div>
                </>
              );

              return disabled ? (
                <div key={label} className={`${base} ${style}`} title="Coming soon">
                  {content}
                </div>
              ) : (
                <Link key={label} href={href} className={`${base} ${style}`} title={label}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom notification box */}
        <div className="mx-auto w-full max-w-5xl rounded-sm border border-gray-300 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Important Update / Notification</div>
          <div className="mt-1 text-sm text-gray-600">...</div>
        </div>
      </div>
    </AppShell>
  );
}

