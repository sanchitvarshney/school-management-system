"use client";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, Td, Th } from "@/components/ui/Table";
import type { Fee, FeeStatus, SmsDb, Student } from "@/lib/models";
import { getDb, getSelectedSessionId, setDb } from "@/lib/storage";
import { uid } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export default function FeesPage() {
  const [db, setDbState] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Fee | null>(null);

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
  const fees = s?.fees ?? [];
  const students = s?.students ?? [];
  const studentNameById = useMemo(() => new Map(students.map((st) => [st.id, st.name])), [students]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fees;
    return fees.filter((f) => {
      const st = studentNameById.get(f.studentId) ?? "";
      return [st, f.month, f.status].some((x) => String(x).toLowerCase().includes(q));
    });
  }, [fees, query, studentNameById]);

  function upsert(item: Fee) {
    if (!db) return;
    const ss = db.sessions[sessionId];
    const next = ss.fees.some((x) => x.id === item.id)
      ? ss.fees.map((x) => (x.id === item.id ? item : x))
      : [item, ...ss.fees];
    const nextDb: SmsDb = { ...db, sessions: { ...db.sessions, [sessionId]: { ...ss, fees: next } } };
    setDb(nextDb);
    setDbState(nextDb);
  }

  function del(id: string) {
    if (!db) return;
    const ss = db.sessions[sessionId];
    const nextDb: SmsDb = { ...db, sessions: { ...db.sessions, [sessionId]: { ...ss, fees: ss.fees.filter((x) => x.id !== id) } } };
    setDb(nextDb);
    setDbState(nextDb);
  }

  return (
    <AppShell>
      <Card>
        <CardHeader
          title="Fees"
          subtitle="Track student fees"
          right={
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              Add Fee
            </Button>
          }
        />
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <Input placeholder="Search by student, month, status…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="text-xs text-gray-500">Total: {filtered.length}</div>
          </div>

          <div className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Month</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Paid Date</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <Td>{studentNameById.get(f.studentId) ?? "-"}</Td>
                    <Td>{f.month}</Td>
                    <Td>Rs {f.amount}</Td>
                    <Td>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${f.status === "Paid" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-800"}`}>
                        {f.status}
                      </span>
                    </Td>
                    <Td>{f.paidDate ?? "-"}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { setEditing(f); setOpen(true); }}>Edit</Button>
                        <Button variant="danger" onClick={() => { if (confirm("Delete this fee record?")) del(f.id); }}>Delete</Button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <Td><span className="text-gray-500">No fee records found.</span></Td>
                    <Td /><Td /><Td /><Td /><Td />
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <FeeModal
        open={open}
        editing={editing}
        students={students}
        onClose={() => setOpen(false)}
        onSave={(values) => {
          upsert({ id: editing?.id ?? uid("fee"), ...values });
          setOpen(false);
        }}
      />
    </AppShell>
  );
}

function FeeModal({
  open,
  editing,
  students,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Fee | null;
  students: Student[];
  onClose: () => void;
  onSave: (values: Omit<Fee, "id">) => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [status, setStatus] = useState<FeeStatus>("Due");
  const [paidDate, setPaidDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setStudentId(editing?.studentId ?? (students[0]?.id ?? ""));
    setMonth(editing?.month ?? "2025-08");
    setAmount(editing?.amount ?? 2500);
    setStatus(editing?.status ?? "Due");
    setPaidDate(editing?.paidDate ?? "");
  }, [open, editing, students]);

  useEffect(() => {
    if (!open) return;
    if (status !== "Paid") setPaidDate("");
    if (status === "Paid" && !paidDate) {
      const d = new Date();
      const iso = d.toISOString().slice(0, 10);
      setPaidDate(iso);
    }
  }, [status, open]);

  return (
    <Modal open={open} title={editing ? "Edit Fee" : "Add Fee"} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-600 mb-1">Student</div>
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {students.map((st) => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">Month</div>
            <Input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="yyyy-mm" />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Amount</div>
            <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">Status</div>
            <Select value={status} onChange={(e) => setStatus(e.target.value as FeeStatus)}>
              <option value="Paid">Paid</option>
              <option value="Due">Due</option>
            </Select>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Paid date</div>
            <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} disabled={status !== "Paid"} />
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (!studentId) return alert("Student is required.");
            if (!month.trim()) return alert("Month is required.");
            if (!Number.isFinite(amount) || amount <= 0) return alert("Amount must be > 0.");
            onSave({ studentId, month: month.trim(), amount, status, paidDate: status === "Paid" ? paidDate : undefined });
          }}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

