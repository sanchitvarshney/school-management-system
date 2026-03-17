"use client";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, Td, Th } from "@/components/ui/Table";
import type { ClassRoom, Section, SmsDb } from "@/lib/models";
import { getDb, getSelectedSessionId, setDb } from "@/lib/storage";
import { uid } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export default function SectionsPage() {
  const [db, setDbState] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);

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
  const sections = s?.sections ?? [];
  const classes = s?.classes ?? [];

  const classNameById = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((sec) =>
      `${classNameById.get(sec.classId) ?? ""} ${sec.name}`.toLowerCase().includes(q)
    );
  }, [sections, query, classNameById]);

  function upsert(item: Section) {
    if (!db) return;
    const ss = db.sessions[sessionId];
    const next = ss.sections.some((x) => x.id === item.id)
      ? ss.sections.map((x) => (x.id === item.id ? item : x))
      : [item, ...ss.sections];
    const nextDb: SmsDb = { ...db, sessions: { ...db.sessions, [sessionId]: { ...ss, sections: next } } };
    setDb(nextDb);
    setDbState(nextDb);
  }

  function del(id: string) {
    if (!db) return;
    const ss = db.sessions[sessionId];
    const nextDb: SmsDb = { ...db, sessions: { ...db.sessions, [sessionId]: { ...ss, sections: ss.sections.filter((x) => x.id !== id) } } };
    setDb(nextDb);
    setDbState(nextDb);
  }

  return (
    <AppShell>
      <Card>
        <CardHeader
          title="Sections"
          subtitle="Manage sections by class"
          right={
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              Add Section
            </Button>
          }
        />
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <Input placeholder="Search section…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="text-xs text-gray-500">Total: {filtered.length}</div>
          </div>

          <div className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Class</Th>
                  <Th>Section</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sec) => (
                  <tr key={sec.id} className="hover:bg-gray-50">
                    <Td>{classNameById.get(sec.classId) ?? "-"}</Td>
                    <Td>{sec.name}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { setEditing(sec); setOpen(true); }}>Edit</Button>
                        <Button variant="danger" onClick={() => { if (confirm("Delete this section?")) del(sec.id); }}>Delete</Button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <Td><span className="text-gray-500">No sections found.</span></Td>
                    <Td />
                    <Td />
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <SectionModal
        open={open}
        editing={editing}
        classes={classes}
        onClose={() => setOpen(false)}
        onSave={(values) => {
          upsert({ id: editing?.id ?? uid("sec"), ...values });
          setOpen(false);
        }}
      />
    </AppShell>
  );
}

function SectionModal({
  open,
  editing,
  classes,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Section | null;
  classes: ClassRoom[];
  onClose: () => void;
  onSave: (values: Omit<Section, "id">) => void;
}) {
  const [classId, setClassId] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    setClassId(editing?.classId ?? (classes[0]?.id ?? ""));
    setName(editing?.name ?? "");
  }, [open, editing, classes]);

  return (
    <Modal open={open} title={editing ? "Edit Section" : "Add Section"} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-600 mb-1">Class</div>
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Section name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="A" />
        </div>
        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (!classId) return alert("Class is required."); if (!name.trim()) return alert("Section name is required."); onSave({ classId, name: name.trim() }); }}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

