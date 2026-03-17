"use client";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, Td, Th } from "@/components/ui/Table";
import type { SmsDb, Teacher } from "@/lib/models";
import { getDb, getSelectedSessionId, setDb } from "@/lib/storage";
import { uid } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export default function TeachersPage() {
  const [db, setDbState] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);

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

  const teachers = db?.sessions?.[sessionId]?.teachers ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) =>
      [t.name, t.phone, t.subject].some((x) => x.toLowerCase().includes(q))
    );
  }, [teachers, query]);

  function upsertTeacher(nextTeacher: Teacher) {
    if (!db) return;
    const s = db.sessions[sessionId];
    const nextTeachers = s.teachers.some((t) => t.id === nextTeacher.id)
      ? s.teachers.map((t) => (t.id === nextTeacher.id ? nextTeacher : t))
      : [nextTeacher, ...s.teachers];
    const nextDb: SmsDb = {
      ...db,
      sessions: { ...db.sessions, [sessionId]: { ...s, teachers: nextTeachers } },
    };
    setDb(nextDb);
    setDbState(nextDb);
  }

  function deleteTeacher(id: string) {
    if (!db) return;
    const s = db.sessions[sessionId];
    const nextDb: SmsDb = {
      ...db,
      sessions: {
        ...db.sessions,
        [sessionId]: { ...s, teachers: s.teachers.filter((t) => t.id !== id) },
      },
    };
    setDb(nextDb);
    setDbState(nextDb);
  }

  return (
    <AppShell>
      <Card>
        <CardHeader
          title="Teachers"
          subtitle="Manage teacher records"
          right={
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Add Teacher
            </Button>
          }
        />
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <Input
                placeholder="Search by name, phone, subject…"
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
                  <Th>Phone</Th>
                  <Th>Subject</Th>
                  <Th>Joining</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <Td>{t.name}</Td>
                    <Td>{t.phone}</Td>
                    <Td>{t.subject}</Td>
                    <Td>{t.joiningDate}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditing(t);
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (confirm("Delete this teacher?")) deleteTeacher(t.id);
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
                      <span className="text-gray-500">No teachers found.</span>
                    </Td>
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

      <TeacherModal
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSave={(values) => {
          const teacher: Teacher = {
            id: editing?.id ?? uid("t"),
            ...values,
          };
          upsertTeacher(teacher);
          setOpen(false);
        }}
      />
    </AppShell>
  );
}

function TeacherModal({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Teacher | null;
  onClose: () => void;
  onSave: (values: Omit<Teacher, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [joiningDate, setJoiningDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setPhone(editing?.phone ?? "");
    setSubject(editing?.subject ?? "");
    setJoiningDate(editing?.joiningDate ?? "");
  }, [open, editing]);

  return (
    <Modal open={open} title={editing ? "Edit Teacher" : "Add Teacher"} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-600 mb-1">Name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Teacher name" />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Phone</div>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx..." />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Subject</div>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Math" />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Joining date</div>
          <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!name.trim()) return alert("Name is required.");
              if (!phone.trim()) return alert("Phone is required.");
              if (!subject.trim()) return alert("Subject is required.");
              if (!joiningDate.trim()) return alert("Joining date is required.");
              onSave({ name: name.trim(), phone: phone.trim(), subject: subject.trim(), joiningDate });
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

