"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { StudentProfileView, type ProfileTabId } from "@/components/StudentProfileView";
import type { SmsDb } from "@/lib/models";
import { getDb, getSelectedSessionId } from "@/lib/storage";
import { ArrowBack } from "@mui/icons-material";
import { Box, Divider, Tab, Tabs } from "@mui/material";

const tabs: { id: ProfileTabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "attendance", label: "Attendance" },
  { id: "documents", label: "Documents" },
  { id: "examReport", label: "Exam Report" },
  { id: "addNotes", label: "Add Notes" },
];
function StudentViewContent() {
  const [tab, setTab] = useState<ProfileTabId>("profile");
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
          st.rollNo === roll && st.classId === classId && st.sectionId === ref,
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
      ]),
    );
  }, [db, sessionId, classNameById]);

  return (
    <AppShell>
      <div className="w-full p-0   space-y-4">
        <div className="flex  border-b border-gray-200  z-50 bg-white w-full p-2 justify-between items-center ">
        <div className="flex items-center gap-3">
            <Link
            href="/students"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            <ArrowBack />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">
            {student?.name}
          </h1>
        </div>
          <Box
            sx={{
              maxWidth: "100%",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "grey.200",
              borderRadius: 4,
              p: 1,
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, next) => setTab(next as ProfileTabId)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="Student view tabs"
              sx={{
                minHeight: 30,
                "& .MuiTabs-indicator": { backgroundColor: "rgb(79 70 229)", display:"none" },
                
              }}
            >
              {tabs.map(({ id, label }) => (
                <Tab
                  key={id}
                  value={id}
                  label={label}
                  disableRipple
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    minHeight: 44,
                    px: 2,
                    borderRadius: 999,
                 
                    color: "rgb(55 65 81)",
                    "&.Mui-selected": { color: "#ffffff", border:"none",  backgroundColor:"rgb(79 70 229)", },
                 
                  }}
                />
              ))}
            </Tabs>
          </Box>
        </div>
     
    <div className="p-4 max-h-[calc(100vh-160px)] overflow-y-auto">
          {student ? (
          <>
            <StudentProfileView
              student={student}
              classNameById={classNameById}
              sectionNameById={sectionNameById}
              tab={tab}
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
      </div>
    </AppShell>
  );
}

export default function StudentViewPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="max-w-4xl mx-auto p-6 text-gray-500">Loading…</div>
        </AppShell>
      }
    >
      <StudentViewContent />
    </Suspense>
  );
}
