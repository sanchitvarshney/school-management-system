"use client";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, Td, Th } from "@/components/ui/Table";
import type { ClassRoom, SmsDb } from "@/lib/models";
import { getDb, getSelectedSessionId, setDb } from "@/lib/storage";
import { uid } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export default function ClassesPage() {
  const [db, setDbState] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRoom | null>(null);

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

  const filtered = useMemo(() => {
    const classes = db?.sessions?.[sessionId]?.classes ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => c.name.toLowerCase().includes(q));
  }, [db, sessionId, query]);

  function upsert(item: ClassRoom) {
    if (!db) return;
    const s = db.sessions[sessionId];
    const next = s.classes.some((x) => x.id === item.id)
      ? s.classes.map((x) => (x.id === item.id ? item : x))
      : [item, ...s.classes];
    const nextDb: SmsDb = { ...db, sessions: { ...db.sessions, [sessionId]: { ...s, classes: next } } };
    setDb(nextDb);
    setDbState(nextDb);
  }

  function del(id: string) {
    if (!db) return;
    const s = db.sessions[sessionId];
    const nextDb: SmsDb = { ...db, sessions: { ...db.sessions, [sessionId]: { ...s, classes: s.classes.filter((x) => x.id !== id) } } };
    setDb(nextDb);
    setDbState(nextDb);
  }

  return (
    <AppShell>
      <Card>
        <CardHeader
          title="Classes"
          subtitle="Manage classes/grades"
          right={
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Add Class
            </Button>
          }
        />
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <Input placeholder="Search class…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="text-xs text-gray-500">Total: {filtered.length}</div>
          </div>

          <div className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <Td>{c.name}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { setEditing(c); setOpen(true); }}>Edit</Button>
                        <Button variant="danger" onClick={() => { if (confirm("Delete this class?")) del(c.id); }}>Delete</Button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <Td><span className="text-gray-500">No classes found.</span></Td>
                    <Td />
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <ClassModal
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSave={(name) => {
          upsert({ id: editing?.id ?? uid("class"), name });
          setOpen(false);
        }}
      />
    </AppShell>
  );
}

function ClassModal({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: ClassRoom | null;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
  }, [open, editing]);

  return (
    <Modal open={open} title={editing ? "Edit Class" : "Add Class"} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-600 mb-1">Name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Class 1" />
        </div>
        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (!name.trim()) return alert("Name is required."); onSave(name.trim()); }}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

