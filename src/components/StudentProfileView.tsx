"use client";

import { useState, type ReactNode } from "react";

import { Select } from "@/components/ui/Select";
import { Table, Td, Th } from "@/components/ui/Table";
import type { Student } from "@/lib/models";
import { uid } from "@/lib/utils";

type ProfileTabId = "profile" | "attendance" | "documents" | "examReport" | "addNotes";

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 py-2 border-b border-gray-100 last:border-b-0">
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      <div className="text-sm text-gray-800">{value && value.trim() ? value : "-"}</div>
    </div>
  );
}

function SectionFieldset({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-gray-200 bg-white">
      <legend className="ml-4 px-3 text-sm font-semibold text-gray-900">{title}</legend>
      <div className="p-4 sm:p-5 space-y-4">{children}</div>
    </fieldset>
  );
}

const DUMMY_ATTENDANCE: Record<string, "P" | "A" | "L"> = {
  "2025-01-02": "P", "2025-01-03": "A", "2025-01-06": "P", "2025-01-07": "L", "2025-01-08": "P", "2025-01-09": "P", "2025-01-10": "P",
  "2025-01-13": "P", "2025-01-14": "A", "2025-01-15": "P", "2025-01-16": "P", "2025-01-17": "L",
  "2025-02-03": "P", "2025-02-04": "P", "2025-02-05": "P", "2025-02-06": "L", "2025-02-07": "P",
  "2025-02-10": "P", "2025-02-11": "P", "2025-02-12": "A", "2025-02-13": "P", "2025-02-14": "P",
  "2025-03-03": "P", "2025-03-04": "P", "2025-03-05": "L", "2025-03-06": "P", "2025-03-07": "P",
  "2025-03-10": "P", "2025-03-11": "P", "2025-03-12": "P", "2025-03-13": "A", "2025-03-14": "P",
  "2025-03-17": "P", "2025-03-18": "P",
};

function getAttendanceForDate(dateKey: string): "P" | "A" | "L" | "S" | "-" {
  const d = new Date(dateKey + "T12:00:00");
  if (d.getDay() === 0) return "S";
  return DUMMY_ATTENDANCE[dateKey] ?? "-";
}

function AttendanceMonthGrid({ session }: { session: string }) {
  const [y1, y2] = session.split("-").map(Number);
  const today = new Date();
  const from = new Date(y1, 6, 1);
  const to = new Date(y2, 5, 31);
  const end = today < to ? today : to;
  const months: { year: number; month: number; label: string }[] = [];
  const seen = new Set<string>();
  for (let d = new Date(from.getFullYear(), from.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${month}`;
    if (seen.has(key)) break;
    seen.add(key);
    const label = new Date(year, month, 1).toLocaleString("en-US", { month: "short" }).toUpperCase();
    months.push({ year, month, label });
  }
  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">P = Present · A = Absent · L = Late · S = Sunday (auto)</p>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse min-w-[600px] bg-white">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <Th className="py-2 pr-4 text-left w-12 sticky left-0 bg-gray-50 border-r border-gray-200 z-10">MONTH</Th>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <Th key={day} className="py-1.5 px-0.5 text-center min-w-[24px] w-8 font-normal border-r border-gray-100 last:border-r-0">{day}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {months.map(({ year, month, label }) => {
              const days = daysInMonth(year, month);
              return (
                <tr key={`${year}-${month}`} className="border-b border-gray-100 last:border-b-0 group hover:bg-indigo-50/80 transition-colors">
                  <Td className="py-1.5 pr-4 font-medium sticky left-0 border-r border-gray-200 bg-gray-50/90 group-hover:bg-indigo-50/80 z-10 transition-colors">{label}</Td>
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1;
                    if (day > days) return <Td key={day} className="py-0.5 px-0.5 text-center min-w-[24px] w-8 border-r border-gray-100 last:border-r-0" />;
                    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const status = getAttendanceForDate(dateKey);
                    const color = status === "P" ? "text-emerald-600 font-medium" : status === "A" ? "text-red-600 font-medium" : status === "L" ? "text-amber-600 font-medium" : "text-gray-400";
                    return <Td key={day} className={`py-0.5 px-0.5 text-center min-w-[24px] w-8 border-r border-gray-100 last:border-r-0 ${color} transition-colors`}>{status}</Td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const SESSION_OPTIONS = ["2024-2025", "2025-2026"];

export function StudentProfileView({
  student,
  classNameById,
  sectionNameById,
}: {
  student: Student;
  classNameById: Map<string, string>;
  sectionNameById: Map<string, string>;
}) {
  const [tab, setTab] = useState<ProfileTabId>("profile");
  const [notes, setNotes] = useState("");
  const [attendanceSession, setAttendanceSession] = useState("2025-2026");
  const [documents, setDocuments] = useState<{ id: string; name: string; type: string; date: string; size: string }[]>([
    { id: uid("doc"), name: "Birth Certificate", type: "PDF", date: "12 Jan 2024", size: "245 KB" },
    { id: uid("doc"), name: "Transfer Certificate (Last School)", type: "PDF", date: "15 Jan 2024", size: "180 KB" },
    { id: uid("doc"), name: "Guardian ID Proof", type: "PDF", date: "18 Jan 2024", size: "312 KB" },
    { id: uid("doc"), name: "Passport Size Photo", type: "Image", date: "20 Jan 2024", size: "89 KB" },
  ]);
  const [examReportSession, setExamReportSession] = useState("2025-2026");
  const [examExpandedId, setExamExpandedId] = useState<string | null>("mid-term");
  const [notesList, setNotesList] = useState<{ id: string; date: string; text: string }[]>([
    { id: uid("n"), date: "15 Mar 2025", text: "Parent meeting scheduled for next week. Guardian requested callback regarding transport." },
    { id: uid("n"), date: "10 Mar 2025", text: "Good performance in science project. Recommended for school exhibition." },
    { id: uid("n"), date: "05 Mar 2025", text: "Submitted leave application for 12–14 Mar (family function). Approved." },
  ]);

  const tabs: { id: ProfileTabId; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "attendance", label: "Attendance" },
    { id: "documents", label: "Documents" },
    { id: "examReport", label: "Exam Report" },
    { id: "addNotes", label: "Add Notes" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              "h-9 px-3 rounded-xl text-sm font-semibold border transition-colors",
              tab === id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="space-y-4 text-sm">
          <SectionFieldset title="Personal Info.">
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
          </SectionFieldset>
          <SectionFieldset title="Medical Information">
            <div className="space-y-0">
              <InfoRow label="Medical Condition" value={student.medicalCondition} />
              <InfoRow label="Description" value={student.medicalDescription} />
            </div>
          </SectionFieldset>
          <SectionFieldset title="Guardian Information">
            <div className="space-y-0">
              <InfoRow label="Father's Name" value={student.fatherName} />
              <InfoRow label="Mother's Name" value={student.motherName} />
              <InfoRow label="Mobile No." value={student.mobileNo} />
              <InfoRow label="Alt Mobile No." value={student.altMobileNo} />
              <InfoRow label="Email ID" value={student.emailId} />
              <InfoRow label="Guardian Phone" value={student.guardianPhone} />
            </div>
          </SectionFieldset>
          <SectionFieldset title="Admission / Class">
            <div className="space-y-0">
              <InfoRow label="Admission ID" value={student.admissionId} />
              <InfoRow label="Roll No." value={student.rollNo} />
              <InfoRow label="Class" value={classNameById.get(student.classId)} />
              <InfoRow label="Section" value={sectionNameById.get(student.sectionId)} />
            </div>
          </SectionFieldset>
          <SectionFieldset title="Address">
            <div className="space-y-0">
              <InfoRow label="Current Address" value={student.currentAddress} />
              <InfoRow label="Current Pin Code" value={student.currentPinCode} />
              <InfoRow label="Permanent Address" value={student.permanentAddress} />
              <InfoRow label="Permanent Pin Code" value={student.permanentPinCode} />
            </div>
          </SectionFieldset>
          <SectionFieldset title="Last School Attempt Information">
            <div className="space-y-0">
              <InfoRow label="Board" value={student.lastSchoolBoard} />
              <InfoRow label="School Name" value={student.lastSchoolName} />
              <InfoRow label="School Address" value={student.lastSchoolAddress} />
            </div>
          </SectionFieldset>
        </div>
      )}

      {tab === "attendance" && (
        <div className="space-y-4">
          <SectionFieldset title="Session">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Session</label>
              <Select value={attendanceSession} onChange={(e) => setAttendanceSession(e.target.value)} className="w-40">
                {SESSION_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </SectionFieldset>
          <SectionFieldset title="Summary">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="rounded-xl bg-emerald-50 p-3 text-center">
                <div className="text-2xl font-bold text-emerald-700">22</div>
                <div className="text-emerald-600">Present</div>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <div className="text-2xl font-bold text-amber-700">1</div>
                <div className="text-amber-600">Absent</div>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-center">
                <div className="text-2xl font-bold text-blue-700">2</div>
                <div className="text-blue-600">Late</div>
              </div>
              <div className="rounded-xl bg-gray-100 p-3 text-center">
                <div className="text-2xl font-bold text-gray-700">88%</div>
                <div className="text-gray-600">Attendance %</div>
              </div>
            </div>
          </SectionFieldset>
          <SectionFieldset title="Recent Records (School present attendance)">
            <AttendanceMonthGrid session={attendanceSession} />
          </SectionFieldset>
        </div>
      )}

      {tab === "documents" && (
        <div className="space-y-4">
          <SectionFieldset title="Upload Document">
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const ext = file.name.split(".").pop()?.toUpperCase() ?? "File";
                    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                    const size = file.size < 1024 ? `${file.size} B` : `${(file.size / 1024).toFixed(0)} KB`;
                    setDocuments((prev) => [...prev, { id: uid("doc"), name: file.name, type: ext, date, size }]);
                    e.target.value = "";
                  }}
                />
                Choose file to upload
              </label>
              <span className="text-xs text-gray-500">PDF, DOC, or image</span>
            </div>
          </SectionFieldset>
          <SectionFieldset title="Documents">
            <ul className="space-y-3 text-sm">
              {documents.map((doc) => (
                <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">{doc.type}</span>
                    <span className="font-medium text-gray-800">{doc.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <span>{doc.date}</span>
                    <span>{doc.size}</span>
                    <button type="button" className="text-indigo-600 hover:underline font-medium">View</button>
                    <button type="button" onClick={() => setDocuments((prev) => prev.filter((d) => d.id !== doc.id))} className="text-red-600 hover:underline font-medium" title="Delete">Delete</button>
                  </div>
                </li>
              ))}
              {documents.length === 0 && <li className="text-gray-500 py-4 text-center">No documents yet. Upload one above.</li>}
            </ul>
          </SectionFieldset>
        </div>
      )}

      {tab === "examReport" && (
        <div className="space-y-4">
          <SectionFieldset title="Session">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter by session</label>
              <Select value={examReportSession} onChange={(e) => setExamReportSession(e.target.value)} className="w-40">
                {SESSION_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </SectionFieldset>
          <div className="space-y-2">
            {(() => {
              const examList = [
                { id: "mid-term", title: "Mid-Term Exam (Oct 2024)", session: "2025-2026", body: (
                  <> <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 text-left text-gray-600"><Th className="py-2">Subject</Th><Th className="py-2">Max</Th><Th className="py-2">Obtained</Th><Th className="py-2">Grade</Th></tr></thead><tbody className="text-gray-800">{[{ subject: "Mathematics", max: 100, obtained: 82, grade: "A" }, { subject: "Science", max: 100, obtained: 78, grade: "B+" }, { subject: "English", max: 100, obtained: 85, grade: "A" }, { subject: "Hindi", max: 100, obtained: 72, grade: "B" }, { subject: "Social Studies", max: 100, obtained: 88, grade: "A" }].map((row, i) => (<tr key={i} className="border-b border-gray-100"><Td className="py-2">{row.subject}</Td><Td className="py-2">{row.max}</Td><Td className="py-2 font-medium">{row.obtained}</Td><Td className="py-2"><span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700 font-medium">{row.grade}</span></Td></tr>))}</tbody></table></div><div className="mt-3 pt-3 border-t border-gray-200 text-sm"><strong>Total:</strong> 425 / 500 — Percentage: <strong>85%</strong></div></>
                )},
                { id: "unit-test", title: "Unit Test – March 2025", session: "2025-2026", body: (
                  <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 text-left text-gray-600"><Th className="py-2">Subject</Th><Th className="py-2">Marks</Th><Th className="py-2">Grade</Th></tr></thead><tbody className="text-gray-800">{[{ subject: "Mathematics", marks: "18/25", grade: "B+" }, { subject: "Science", marks: "22/25", grade: "A" }, { subject: "English", marks: "20/25", grade: "A" }].map((row, i) => (<tr key={i} className="border-b border-gray-100"><Td className="py-2">{row.subject}</Td><Td className="py-2">{row.marks}</Td><Td className="py-2 font-medium text-emerald-700">{row.grade}</Td></tr>))}</tbody></table></div>
                )},
                { id: "final", title: "Final Exam (Feb 2025)", session: "2025-2026", body: (
                  <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 text-left text-gray-600"><Th className="py-2">Subject</Th><Th className="py-2">Max</Th><Th className="py-2">Obtained</Th><Th className="py-2">Grade</Th></tr></thead><tbody className="text-gray-800">{[{ subject: "Mathematics", max: 100, obtained: 80, grade: "A" }, { subject: "Science", max: 100, obtained: 76, grade: "B+" }, { subject: "English", max: 100, obtained: 82, grade: "A" }].map((row, i) => (<tr key={i} className="border-b border-gray-100"><Td className="py-2">{row.subject}</Td><Td className="py-2">{row.max}</Td><Td className="py-2 font-medium">{row.obtained}</Td><Td className="py-2"><span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700 font-medium">{row.grade}</span></Td></tr>))}</tbody></table></div>
                )},
                { id: "mid-term-24", title: "Mid-Term Exam (Oct 2023)", session: "2024-2025", body: (
                  <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 text-left text-gray-600"><Th className="py-2">Subject</Th><Th className="py-2">Max</Th><Th className="py-2">Obtained</Th><Th className="py-2">Grade</Th></tr></thead><tbody className="text-gray-800">{[{ subject: "Mathematics", max: 100, obtained: 80, grade: "A" }, { subject: "Science", max: 100, obtained: 76, grade: "B+" }, { subject: "English", max: 100, obtained: 82, grade: "A" }].map((row, i) => (<tr key={i} className="border-b border-gray-100"><Td className="py-2">{row.subject}</Td><Td className="py-2">{row.max}</Td><Td className="py-2 font-medium">{row.obtained}</Td><Td className="py-2"><span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700 font-medium">{row.grade}</span></Td></tr>))}</tbody></table></div>
                )},
              ];
              const filteredExams = examList.filter((e) => e.session === examReportSession);
              return (
                <>
                  {filteredExams.length === 0 ? <p className="text-sm text-gray-500 py-4 text-center">No exam reports for this session.</p> : filteredExams.map((exam) => {
                    const isOpen = examExpandedId === exam.id;
                    return (
                      <div key={exam.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <button type="button" className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors" onClick={() => setExamExpandedId(isOpen ? null : exam.id)}>
                          <span>{exam.title}</span>
                          <span className="text-gray-500 transform transition-transform">{isOpen ? "▼" : "▶"}</span>
                        </button>
                        {isOpen && <div className="px-4 pb-4 pt-1 border-t border-gray-100">{exam.body}</div>}
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {tab === "addNotes" && (
        <div className="space-y-4">
          <SectionFieldset title="Add New Note">
            <textarea className="w-full min-h-[100px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Add notes about this student..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button type="button" className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700" onClick={() => { if (!notes.trim()) return; setNotesList((prev) => [{ id: uid("n"), date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), text: notes.trim() }, ...prev]); setNotes(""); }}>Save Note</button>
          </SectionFieldset>
          <SectionFieldset title="Previous Notes">
            <ul className="space-y-3 text-sm">
              {notesList.map((note) => (
                <li key={note.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-500 mb-1">{note.date}</div>
                    <div className="text-gray-800">{note.text}</div>
                  </div>
                  <button type="button" onClick={() => setNotesList((prev) => prev.filter((n) => n.id !== note.id))} className="shrink-0 text-red-600 hover:text-red-700 font-medium text-xs p-1 rounded hover:bg-red-50" title="Delete note">Delete</button>
                </li>
              ))}
              {notesList.length === 0 && <li className="text-gray-500 py-4 text-center">No notes yet. Add one above.</li>}
            </ul>
          </SectionFieldset>
        </div>
      )}
    </div>
  );
}
