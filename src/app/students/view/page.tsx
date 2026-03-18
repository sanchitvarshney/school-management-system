"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { StudentProfileView } from "@/components/StudentProfileView";
import type { SmsDb, Student } from "@/lib/models";
import { getDb, getSelectedSessionId } from "@/lib/storage";

export default function StudentViewPage() {
  const searchParams = useSearchParams();
  const roll = searchParams.get("roll") ?? "";
  const classId = searchParams.get("class") ?? "";
  const ref = searchParams.get("ref") ?? ""; // section id

  const [db, setDb] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");

  useEffect(() => {
    const load = () => {
      const next = getDb();
      setDb(next);
      setSessionId(getSelectedSessionId(next));
    };
    load();
    window.addEventListener("sms:session-changed", load);
    return () => window.removeEventListener("sms:session-changed", load);
  }, []);

  const student = useMemo(() => {
    const s = db?.sessions?.[sessionId];
    if (!s?.students) return null;
    return (
      s.students.find(
        (st) =>
          st.rollNo === roll &&
          st.classId === classId &&
          st.sectionId === ref
      ) ?? null
    );
  }, [db, sessionId, roll, classId, ref]);

  const classNameById = useMemo(() => {
    const s = db?.sessions?.[sessionId];
    return new Map((s?.classes ?? []).map((c) => [c.id, c.name]));
  }, [db, sessionId]);

  const sectionNameById = useMemo(() => {
    const s = db?.sessions?.[sessionId];
    if (!s?.sections) return new Map<string, string>();
    return new Map(
      s.sections.map((sec) => [
        sec.id,
        `${classNameById.get(sec.classId) ?? ""}-${sec.name}`,
      ])
    );
  }, [db, sessionId, classNameById]);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href="/students"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            ← Back to Students
          </Link>
        </div>
        {student ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900">{student.name}</h1>
            <StudentProfileView
            student={student}
            classNameById={classNameById}
            sectionNameById={sectionNameById}
            />
          </>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">
              {roll && classId && ref
                ? "Student not found for this roll, class, and section."
                : "Use roll, class, and ref query params to view a student (e.g. /students/view?roll=1&class=...&ref=...)."}
            </p>
            <Link
              href="/students"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Back to Students
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
