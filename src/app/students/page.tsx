"use client";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, Td, Th } from "@/components/ui/Table";
import type { ClassRoom, Section, SmsDb, Student } from "@/lib/models";
import { getDb, getSelectedSessionId, setDb } from "@/lib/storage";
import { uid } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export default function StudentsPage() {
  const [db, setDbState] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  useEffect(() => {
    const load = () => {
      const next = getDb();
      setDbState(next);
      setSessionId(getSelectedSessionId(next));
    };
    load();
    window.addEventListener("sms:session-changed", load);
    return () => window.removeEventListener("sms:session-changed", load);
  }, []);

  const s = db?.sessions?.[sessionId];
  const students = s?.students ?? [];
  const classes = s?.classes ?? [];
  const sections = s?.sections ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((st) =>
      [st.name, st.rollNo, st.guardianPhone].some((x) => x.toLowerCase().includes(q))
    );
  }, [students, query]);

  function upsertStudent(nextStudent: Student) {
    if (!db) return;
    const ss = db.sessions[sessionId];
    const nextStudents = ss.students.some((x) => x.id === nextStudent.id)
      ? ss.students.map((x) => (x.id === nextStudent.id ? nextStudent : x))
      : [nextStudent, ...ss.students];
    const nextDb: SmsDb = {
      ...db,
      sessions: { ...db.sessions, [sessionId]: { ...ss, students: nextStudents } },
    };
    setDb(nextDb);
    setDbState(nextDb);
  }

  function deleteStudent(id: string) {
    if (!db) return;
    const ss = db.sessions[sessionId];
    const nextDb: SmsDb = {
      ...db,
      sessions: { ...db.sessions, [sessionId]: { ...ss, students: ss.students.filter((x) => x.id !== id) } },
    };
    setDb(nextDb);
    setDbState(nextDb);
  }

  const classNameById = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);
  const sectionNameById = useMemo(
    () => new Map(sections.map((sec) => [sec.id, `${classNameById.get(sec.classId) ?? ""}-${sec.name}`])),
    [sections, classNameById]
  );

  return (
    <AppShell>
      <Card>
        <CardHeader
          title="Students"
          subtitle="Manage student records"
          right={
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Add Student
            </Button>
          }
        />
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <Input
                placeholder="Search by name, roll no, guardian phone…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="text-xs text-gray-500">Total: {filtered.length}</div>
          </div>

          <div className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Roll No</Th>
                  <Th>Class</Th>
                  <Th>Section</Th>
                  <Th>Guardian Phone</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((st) => (
                  <tr key={st.id} className="hover:bg-gray-50">
                    <Td>{st.name}</Td>
                    <Td>{st.rollNo}</Td>
                    <Td>{classNameById.get(st.classId) ?? "-"}</Td>
                    <Td>{sectionNameById.get(st.sectionId) ?? "-"}</Td>
                    <Td>{st.guardianPhone}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditing(st);
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (confirm("Delete this student?")) deleteStudent(st.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <Td>
                      <span className="text-gray-500">No students found.</span>
                    </Td>
                    <Td />
                    <Td />
                    <Td />
                    <Td />
                    <Td />
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <StudentModal
        open={open}
        editing={editing}
        classes={classes}
        sections={sections}
        onClose={() => setOpen(false)}
        onSave={(values) => {
          const next: Student = {
            id: editing?.id ?? uid("s"),
            ...values,
          };
          upsertStudent(next);
          setOpen(false);
        }}
      />
    </AppShell>
  );
}

function StudentModal({
  open,
  editing,
  classes,
  sections,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Student | null;
  classes: ClassRoom[];
  sections: Section[];
  onClose: () => void;
  onSave: (values: Omit<Student, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setRollNo(editing?.rollNo ?? "");
    setClassId(editing?.classId ?? (classes[0]?.id ?? ""));
    setSectionId(editing?.sectionId ?? "");
    setGuardianPhone(editing?.guardianPhone ?? "");
  }, [open, editing, classes]);

  const filteredSections = useMemo(
    () => sections.filter((sec) => (classId ? sec.classId === classId : true)),
    [sections, classId]
  );

  useEffect(() => {
    if (!open) return;
    if (sectionId && filteredSections.some((x) => x.id === sectionId)) return;
    setSectionId(filteredSections[0]?.id ?? "");
  }, [filteredSections, open]);

  return (
    <Modal open={open} title={editing ? "Edit Student" : "Add Student"} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-600 mb-1">Name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Student name" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">Roll No</div>
            <Input value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="01" />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Guardian Phone</div>
            <Input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="03xx..." />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">Class</div>
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Section</div>
            <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              {filteredSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!name.trim()) return alert("Name is required.");
              if (!rollNo.trim()) return alert("Roll no is required.");
              if (!classId) return alert("Class is required.");
              if (!sectionId) return alert("Section is required.");
              if (!guardianPhone.trim()) return alert("Guardian phone is required.");
              onSave({
                name: name.trim(),
                rollNo: rollNo.trim(),
                classId,
                sectionId,
                guardianPhone: guardianPhone.trim(),
              });
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

