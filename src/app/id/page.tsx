"use client";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import type { SmsDb, Student, Teacher } from "@/lib/models";
import { getDb, getSelectedSessionId } from "@/lib/storage";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";

type IdType = "Student" | "Teacher";

export default function IdGeneratePage() {
  const [db, setDb] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");
  const [type, setType] = useState<IdType>("Student");
  const [personId, setPersonId] = useState<string>("");
  const cardRef = useRef<HTMLDivElement | null>(null);

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

  const students = useMemo(
    () => db?.sessions?.[sessionId]?.students ?? [],
    [db, sessionId]
  );
  const teachers = useMemo(
    () => db?.sessions?.[sessionId]?.teachers ?? [],
    [db, sessionId]
  );

  const options = useMemo(() => {
    if (type === "Student") return students.map((x) => ({ id: x.id, label: x.name }));
    return teachers.map((x) => ({ id: x.id, label: x.name }));
  }, [type, students, teachers]);

  useEffect(() => {
    setPersonId(options[0]?.id ?? "");
  }, [type, options]);

  const selectedStudent = useMemo(
    () => students.find((x) => x.id === personId) ?? null,
    [students, personId]
  );
  const selectedTeacher = useMemo(
    () => teachers.find((x) => x.id === personId) ?? null,
    [teachers, personId]
  );
  const selected = type === "Student" ? selectedStudent : selectedTeacher;

  return (
    <AppShell>
      <Card>
        <CardHeader
          title="ID Generate"
          subtitle="Create printable student/teacher ID cards"
          right={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => window.print()}
                disabled={!selected}
                title="Print this page"
              >
                Print
              </Button>
            </div>
          }
        />
        <CardBody>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">Select</div>
              <div className="mt-3 space-y-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Type</div>
                  <Select value={type} onChange={(e) => setType(e.target.value as IdType)}>
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                  </Select>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">{type}</div>
                  <Select value={personId} onChange={(e) => setPersonId(e.target.value)}>
                    {options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="text-xs text-gray-500">
                  Session: <span className="font-medium text-gray-800">{sessionId}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">Preview</div>
              <div className="mt-3">
                {!selected ? (
                  <div className="text-sm text-gray-500">No record found.</div>
                ) : (
                  <IdCardPreview ref={cardRef} type={type} person={selected} sessionId={sessionId} />
                )}
                <div className="mt-3 text-xs text-gray-500">
                  Tip: Use browser print and choose “Save as PDF”.
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          header,
          aside {
            display: none !important;
          }
          main {
            background: white !important;
          }
          .print-card {
            break-inside: avoid;
          }
        }
      `}</style>
    </AppShell>
  );
}

const IdCardPreview = forwardRef<
  HTMLDivElement,
  { type: IdType; person: Student | Teacher; sessionId: string }
>(function IdCardPreviewInner({ type, person, sessionId }, ref) {
  const isStudent = type === "Student";
  return (
    <div ref={ref} className="print-card w-full max-w-sm rounded-2xl border border-gray-200 overflow-hidden">
      <div className="bg-indigo-600 text-white p-4">
        <div className="text-sm font-semibold">School Management System</div>
        <div className="text-xs opacity-90">
          {type} ID Card • Session {sessionId}
        </div>
      </div>
      <div className="p-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 text-xs">
            Photo
          </div>
          <div className="min-w-0">
            <div className="text-base font-semibold text-gray-900 truncate">{person.name}</div>
            <div className="text-xs text-gray-500">{isStudent ? "Student" : "Teacher"}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          {isStudent ? (
            <>
              <Field label="Roll No" value={(person as Student).rollNo} />
              <Field label="Guardian" value={(person as Student).guardianPhone} />
              <Field label="Class ID" value={(person as Student).classId} />
              <Field label="Section ID" value={(person as Student).sectionId} />
            </>
          ) : (
            <>
              <Field label="Phone" value={(person as Teacher).phone} />
              <Field label="Subject" value={(person as Teacher).subject} />
              <Field label="Joining" value={(person as Teacher).joiningDate} />
              <Field label="Staff ID" value={(person as Teacher).id} />
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500">
          <span>ID: {person.id}</span>
          <span>Generated: {new Date().toISOString().slice(0, 10)}</span>
        </div>
      </div>
    </div>
  );
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-2">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="mt-0.5 text-xs font-semibold text-gray-900 break-words">{value || "-"}</div>
    </div>
  );
}

