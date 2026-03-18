"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type { SmsDb, Student } from "@/lib/models";
import { getDb, getSelectedSessionId } from "@/lib/storage";

type TabId = "profile" | "attendance" | "exams" | "lastClass" | "documents";

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-2 py-2 border-b border-gray-100">
      <div className="text-sm font-semibold text-gray-800">{label}</div>
      <div className="text-sm text-gray-700">{value && value.trim() ? value : "-"}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const studentId = params?.id ?? "";

  const [tab, setTab] = useState<TabId>("profile");
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

  const student: Student | undefined = useMemo(() => {
    const s = db?.sessions?.[sessionId];
    return s?.students?.find((x) => x.id === studentId);
  }, [db, sessionId, studentId]);

  const className = useMemo(() => {
    const s = db?.sessions?.[sessionId];
    const cls = s?.classes?.find((c) => c.id === student?.classId);
    return cls?.name ?? "-";
  }, [db, sessionId, student?.classId]);

  const sectionName = useMemo(() => {
    const s = db?.sessions?.[sessionId];
    const sec = s?.sections?.find((x) => x.id === student?.sectionId);
    return sec?.name ?? "-";
  }, [db, sessionId, student?.sectionId]);

  return (
    <AppShell>
      <div className="space-y-4">
        <Card>
          <CardHeader
            title={student ? student.name : "Student Profile"}
            subtitle={student ? `ID: ${student.id} • Class: ${className} • Section: ${sectionName}` : "Loading..."}
            right={
              <div className="flex gap-2">
                <Link href="/students">
                  <Button variant="secondary">Bak</Button>
                </Link>
              </div>
            }
          />
          <CardBody>
            {!student ? (
              <div className="text-sm text-gray-600">
                Student not found. Go back to{" "}
                <Link className="text-indigo-700 hover:underline" href="/students">
                  Students
                </Link>
                .
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["profile", "Profile"],
                    ["attendance", "Attendance"],
                    ["exams", "Exams"],
                    ["lastClass", "Last Class"],
                    ["documents", "Documents"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={[
                      "h-9 px-3 rounded-xl text-sm font-semibold border transition-colors",
                      tab === id
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {student && tab === "profile" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Section title="Personal Info.">
              <div className="space-y-0">
                <InfoRow label="First Name" value={student.firstName} />
                <InfoRow label="Middle Name" value={student.middleName} />
                <InfoRow label="Last Name" value={student.lastName} />
                <InfoRow label="Nick Name" value={student.nickName} />
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow label="D.O.B" value={student.dob} />
                <InfoRow label="Place of Birth" value={student.placeOfBirth} />
                <InfoRow label="Religion" value={student.religion} />
                <InfoRow label="Caste" value={student.caste} />
                <InfoRow label="Category" value={student.category} />
                <InfoRow label="Nationality" value={student.nationality} />
              </div>
            </Section>

            <Section title="Admission / Class">
              <div className="space-y-0">
                <InfoRow label="Admission ID" value={student.admissionId} />
                <InfoRow label="Roll No." value={student.rollNo} />
                <InfoRow label="Class" value={className} />
                <InfoRow label="Section" value={sectionName} />
                <InfoRow label="Guardian Phone" value={student.guardianPhone} />
              </div>
            </Section>

            <Section title="Medical Information">
              <div className="space-y-0">
                <InfoRow label="Medical Condition" value={student.medicalCondition} />
                <InfoRow label="Description" value={student.medicalDescription} />
              </div>
            </Section>

            <Section title="Guardian Information">
              <div className="space-y-0">
                <InfoRow label="Father's Name" value={student.fatherName} />
                <InfoRow label="Mother's Name" value={student.motherName} />
                <InfoRow label="Mobile No." value={student.mobileNo} />
                <InfoRow label="Alt Mobile No." value={student.altMobileNo} />
                <InfoRow label="Email ID" value={student.emailId} />
              </div>
            </Section>

            <div className="xl:col-span-2">
              <Section title="Address">
                <div className="space-y-0">
                  <InfoRow label="Current Address" value={student.currentAddress} />
                  <InfoRow label="Current Pin Code" value={student.currentPinCode} />
                  <InfoRow label="Permanent Address" value={student.permanentAddress} />
                  <InfoRow label="Permanent Pin Code" value={student.permanentPinCode} />
                </div>
              </Section>
            </div>

            <div className="xl:col-span-2">
              <Section title="Last School Attempt Information">
                <div className="space-y-0">
                  <InfoRow label="Board" value={student.lastSchoolBoard} />
                  <InfoRow label="School Name" value={student.lastSchoolName} />
                  <InfoRow label="School Address" value={student.lastSchoolAddress} />
                </div>
              </Section>
            </div>
          </div>
        )}

        {student && tab === "attendance" && (
          <Card>
            <CardHeader title="Attendance Statistics" subtitle="(Demo) Connect attendance data to show real stats." />
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: "Present", value: "—" },
                  { label: "Absent", value: "—" },
                  { label: "Late", value: "—" },
                ].map((x) => (
                  <div key={x.label} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-xs font-semibold text-gray-600">{x.label}</div>
                    <div className="mt-1 text-2xl font-extrabold text-gray-900">{x.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-600">
                When you add an attendance table/model, I’ll render charts + month filters here.
              </div>
            </CardBody>
          </Card>
        )}

        {student && tab === "exams" && (
          <Card>
            <CardHeader title="Examination Report" subtitle="(Demo) Wire marks/results to show performance." />
            <CardBody>
              <div className="text-sm text-gray-600">
                This section can show subject-wise marks, grade trend, and exam-wise reports.
              </div>
            </CardBody>
          </Card>
        )}

        {student && tab === "lastClass" && (
          <Card>
            <CardHeader title="Last Class Statistics" subtitle="(Demo) Add last class details / promotion history." />
            <CardBody>
              <div className="text-sm text-gray-600">
                This section can show last class, last session, and promotion summary.
              </div>
            </CardBody>
          </Card>
        )}

        {student && tab === "documents" && (
          <Card>
            <CardHeader title="Documents" subtitle="(Demo) Upload and manage student documents." />
            <CardBody>
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6">
                <div className="text-sm font-semibold text-gray-900">No documents yet</div>
                <div className="text-sm text-gray-600 mt-1">
                  Next step: add document fields (e.g., Birth certificate, Aadhar/ID, Transfer certificate) and uploads.
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

