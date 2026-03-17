"use client";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, Td, Th } from "@/components/ui/Table";
import type { ClassRoom, Exam, SmsDb } from "@/lib/models";
import { getDb, getSelectedSessionId, setDb } from "@/lib/storage";
import { uid } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export default function ExamsPage() {
  const [db, setDbState] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);

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
  const exams = s?.exams ?? [];
  const classes = s?.classes ?? [];
  const classNameById = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exams;
    return exams.filter((ex) =>
      [ex.name, classNameById.get(ex.classId) ?? "", ex.startDate, ex.endDate]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [exams, query, classNameById]);

  function upsert(item: Exam) {
    if (!db) return;
    const ss = db.sessions[sessionId];
    const next = ss.exams.some((x) => x.id === item.id)
      ? ss.exams.map((x) => (x.id === item.id ? item : x))
      : [item, ...ss.exams];
    const nextDb: SmsDb = { ...db, sessions: { ...db.sessions, [sessionId]: { ...ss, exams: next } } };
    setDb(nextDb);
    setDbState(nextDb);
  }

  function del(id: string) {
    if (!db) return;
    const ss = db.sessions[sessionId];
    const nextDb: SmsDb = { ...db, sessions: { ...db.sessions, [sessionId]: { ...ss, exams: ss.exams.filter((x) => x.id !== id) } } };
    setDb(nextDb);
    setDbState(nextDb);
  }

  return (
    <AppShell>
      <Card>
        <CardHeader
          title="Exams"
          subtitle="Manage exam schedules"
          right={
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              Add Exam
            </Button>
          }
        />
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <Input placeholder="Search exam…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="text-xs text-gray-500">Total: {filtered.length}</div>
          </div>

          <div className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Class</Th>
                  <Th>Start</Th>
                  <Th>End</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ex) => (
                  <tr key={ex.id} className="hover:bg-gray-50">
                    <Td>{ex.name}</Td>
                    <Td>{classNameById.get(ex.classId) ?? "-"}</Td>
                    <Td>{ex.startDate}</Td>
                    <Td>{ex.endDate}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { setEditing(ex); setOpen(true); }}>Edit</Button>
                        <Button variant="danger" onClick={() => { if (confirm("Delete this exam?")) del(ex.id); }}>Delete</Button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <Td><span className="text-gray-500">No exams found.</span></Td>
                    <Td /><Td /><Td /><Td />
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <ExamModal
        open={open}
        editing={editing}
        classes={classes}
        onClose={() => setOpen(false)}
        onSave={(values) => {
          upsert({ id: editing?.id ?? uid("ex"), ...values });
          setOpen(false);
        }}
      />
    </AppShell>
  );
}

function ExamModal({
  open,
  editing,
  classes,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Exam | null;
  classes: ClassRoom[];
  onClose: () => void;
  onSave: (values: Omit<Exam, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setClassId(editing?.classId ?? (classes[0]?.id ?? ""));
    setStartDate(editing?.startDate ?? "");
    setEndDate(editing?.endDate ?? "");
  }, [open, editing, classes]);

  return (
    <Modal open={open} title={editing ? "Edit Exam" : "Add Exam"} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-600 mb-1">Name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mid Term" />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Class</div>
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">Start date</div>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">End date</div>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (!name.trim()) return alert("Name is required.");
            if (!classId) return alert("Class is required.");
            if (!startDate) return alert("Start date is required.");
            if (!endDate) return alert("End date is required.");
            onSave({ name: name.trim(), classId, startDate, endDate });
          }}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

