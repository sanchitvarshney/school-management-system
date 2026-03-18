"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { getDb, getSelectedSessionId } from "@/lib/storage";
import type { SmsDb } from "@/lib/models";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function HomePage() {
  const [db, setDb] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");

  useEffect(() => {
    const load = () => {
      const next = getDb();
      const sid = getSelectedSessionId(next);
      setDb(next);
      setSessionId(sid);
    };
    load();
    window.addEventListener("sms:session-changed", load);
    return () => window.removeEventListener("sms:session-changed", load);
  }, []);

  const stats = useMemo(() => {
    const s = db?.sessions?.[sessionId];
    const students = s?.students?.length ?? 0;
    const teachers = s?.teachers?.length ?? 0;
    const classes = s?.classes?.length ?? 0;
    const fees = s?.fees ?? [];
    const feesCollected = fees.filter((f) => f.status === "Paid").reduce((sum, f) => sum + (f.amount ?? 0), 0);
    const feesDue = fees.filter((f) => f.status === "Due").reduce((sum, f) => sum + (f.amount ?? 0), 0);
    return { students, teachers, classes, feesCollected, feesDue };
  }, [db, sessionId]);

  const barData = useMemo(() => {
    const s = db?.sessions?.[sessionId];
    const fees = s?.fees ?? [];
    const byMonth = new Map<string, number>();
    for (const f of fees) {
      if (f.status !== "Paid") continue;
      byMonth.set(f.month, (byMonth.get(f.month) ?? 0) + f.amount);
    }
    const arr = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }));
    return arr.length ? arr : [{ month: "2025-08", amount: stats.feesCollected }];
  }, [db, sessionId, stats.feesCollected]);

  const pieData = useMemo(() => {
    const s = db?.sessions?.[sessionId];
    const students = s?.students ?? [];
    const classes = s?.classes ?? [];
    const byClass = new Map<string, number>();
    for (const st of students) byClass.set(st.classId, (byClass.get(st.classId) ?? 0) + 1);
    const out = Array.from(byClass.entries()).map(([classId, value]) => ({
      name: classes.find((c) => c.id === classId)?.name ?? "Unknown",
      value,
    }));
    return out.length ? out : [{ name: "No students", value: 1 }];
  }, [db, sessionId]);

  const feeProgress = useMemo(() => {
    const total = stats.feesCollected + stats.feesDue;
    const pct = total === 0 ? 0 : Math.round((stats.feesCollected / total) * 100);
    return pct;
  }, [stats.feesCollected, stats.feesDue]);

  return (
    <AppShell>
      <div className="space-y-6 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Overview for session <span className="font-medium text-gray-900">{sessionId}</span>
            </p>
        </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Kpi title="Students" value={stats.students} />
          <Kpi title="Teachers" value={stats.teachers} />
          <Kpi title="Classes" value={stats.classes} />
          <Kpi title="Fees Collected" value={`Rs ${stats.feesCollected}`} />
          <Kpi title="Fees Due" value={`Rs ${stats.feesDue}`} />
              </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-sm font-semibold text-gray-900">Fee collection progress</div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Collected</span>
                <span>{feeProgress}%</span>
                  </div>
              <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-indigo-600" style={{ width: `${feeProgress}%` }} />
                </div>
              <div className="mt-3 text-xs text-gray-500">
                Rs {stats.feesCollected} collected • Rs {stats.feesDue} due
                        </div>
                      </div>
                  </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Monthly fees (paid)</div>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" name="Paid" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
                      </div>
                  </div>
                </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:col-span-1">
            <div className="text-sm font-semibold text-gray-900">Students by class</div>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} fill="#4f46e5" />
                </PieChart>
              </ResponsiveContainer>
          </div>
            </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Quick notes</div>
            <div className="mt-2 text-sm text-gray-600">
              This is a demo school management system. Next we’ll fill Teachers, Students, Fees, Classes, Sections, Exams, and ID Generation pages with full CRUD.
          </div>
        </div>
    </div>
      </div>
    </AppShell>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
      return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-2 text-lg font-semibold text-gray-900">{value}</div>
        </div>
      );
}

