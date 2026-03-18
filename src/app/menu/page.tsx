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
  type LucideIcon,
} from "lucide-react";

const tiles = {
  student: { href: "/students", label: "Student", Icon: "/assets/student.png" },
  selfEmp: {
    href: "/self-employees",
    label: "Staff Employee",
    Icon: "/assets/staff.png",
  },
  parents: { href: "/parents", label: "Parents", Icon: "/assets/parents.png" },
  class: { href: "/classes", label: "Class", Icon: "/assets/school-logo.png" },
  teacher: { href: "/teachers", label: "Teacher", Icon: "/assets/teacher.png" },
  exam: { href: "/exams", label: "Exam", Icon: "/assets/exam.png" },
  fees: { href: "/fees", label: "Fees", Icon: "/assets/fees.png", accent: true },

  subject: { href: "/subject", label: "Subject", Icon: "/assets/subject.png" },
  report: { href: "#", label: "Report", Icon: "/assets/report.png", disabled: false },
  attendance: {
    href: "#",
    label: "Attendance",
    Icon: "/assets/attendance.png",
    disabled: true,
  },
};

function Tile({ href, label, Icon, accent, disabled, className = "" }: any) {
  const base =
    "h-[90px] border border-gray-400 bg-cyan-100 flex flex-col items-center justify-center gap-2 transition-colors";

  const style = disabled
    ? "opacity-70 cursor-not-allowed"
    : accent
      ? "bg-sky-500 text-white hover:bg-sky-600 border-sky-600"
      : "text-gray-900 hover:bg-cyan-200";

  const content = (
    <>
      <img src={Icon} alt={label} className="h-8 w-8" />
      <div className="text-[11px] font-semibold">{label}</div>
    </>
  );

  if (disabled) {
    return <div className={`${base} ${style} ${className}`}>{content}</div>;
  }

  return (
    <Link href={href} className={`${base} ${style} ${className}`}>
      {content}
    </Link>
  );
}

export default function MenuPage() {
  return (
    <AppShell>
      <div className="min-h-[calc(100vh-120px)] flex flex-col justify-center items-center gap-4">
        <div className="mx-auto flex w-full gap-12 max-w-5xl border border-gray-200 bg-gray-300 p-8 space-y-4">
          <div className="grid w-full grid-cols-3  gap-4">
            <Tile {...tiles.student} />
            <Tile {...tiles.selfEmp} className="col-span-2" />
            <Tile {...tiles.class} />
            <Tile {...tiles.teacher} />
            <Tile {...tiles.exam} />
            <Tile {...tiles.attendance} />
            <Tile {...tiles.parents} />
            <Tile {...tiles.fees} />
          </div>
          <div className="w-full">
            <div className="grid grid-cols-3 gap-4">
              <Tile {...tiles.subject} />
              <Tile {...tiles.report} />
              <Tile {...tiles.exam} />
              <Tile {...tiles.student} />
              <Tile {...tiles.selfEmp} className="col-span-2" />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl flex gap-4 rounded-sm border border-gray-300 bg-white p-4">
          <img src="/post-it.png" className="h-12 w-12" />
         <div>
           <div className="text-sm font-semibold text-gray-900">
            Important Update / Notification
          </div>
          <div className="mt-1 text-sm text-gray-600">...</div>
         </div>
        </div>
      </div>
    </AppShell>
  );
}
