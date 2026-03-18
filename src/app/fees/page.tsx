"use client";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { Fee, FeeStatus, SmsDb, Student } from "@/lib/models";
import { getDb, getSelectedSessionId, setDb } from "@/lib/storage";
import { uid, numberToWords } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import Paper from "@mui/material/Paper";
import { DataGrid } from "@mui/x-data-grid/DataGrid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import MuiSelect, { type SelectChangeEvent } from "@mui/material/Select";
import { Box, Tab, Tabs } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function FeesPage() {
  const [db, setDbState] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");
  const [tab, setTab] = useState<"pay" | "filters" | "dashboard">("dashboard");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | FeeStatus>("");
  const [studentFilter, setStudentFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Fee | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastPayment, setLastPayment] = useState<Fee[]>([]);

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

  const students = useMemo(
    () => db?.sessions?.[sessionId]?.students ?? [],
    [db, sessionId]
  );
  const fees = useMemo(
    () => db?.sessions?.[sessionId]?.fees ?? [],
    [db, sessionId]
  );
  const studentNameById = useMemo(() => new Map(students.map((st) => [st.id, st.name])), [students]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const f of fees) set.add(f.month);
    return Array.from(set).sort();
  }, [fees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fees.filter((f) => {
      const st = studentNameById.get(f.studentId) ?? "";
      if (statusFilter && f.status !== statusFilter) return false;
      if (studentFilter && f.studentId !== studentFilter) return false;
      if (monthFilter && f.month !== monthFilter) return false;
      if (!q) return true;
      return [st, f.month, f.status].some((x) => String(x).toLowerCase().includes(q));
    });
  }, [fees, monthFilter, query, statusFilter, studentFilter, studentNameById]);

  const printReceipt = useCallback((feeRows: Fee[]) => {
    setLastPayment(feeRows);
    setReceiptOpen(true);
  }, []);

  const del = useCallback(
    (id: string) => {
      if (!db) return;
      const ss = db.sessions[sessionId];
      const nextDb: SmsDb = {
        ...db,
        sessions: {
          ...db.sessions,
          [sessionId]: { ...ss, fees: ss.fees.filter((x) => x.id !== id) },
        },
      };
      setDb(nextDb);
      setDbState(nextDb);
    },
    [db, sessionId],
  );

  const deleteFee = useCallback(
    (id: string) => {
      if (
        !confirm(
          "Are you sure you want to delete this fee record? This action cannot be undone.",
        )
      )
        return;
      del(id);
    },
    [del],
  );

  const columns: GridColDef<Fee>[] = useMemo(
    () => [
      {
        field: "studentId",
        headerName: "Student",
        flex: 1,
        minWidth: 200,
        valueGetter: (_value, row) => studentNameById.get(row.studentId) ?? "-",
      },
      { field: "month", headerName: "Month", flex: 0.8, minWidth: 140 },
      {
        field: "amount",
        headerName: "Amount",
        flex: 0.6,
        minWidth: 120,
        valueGetter: (_value, row) => `Rs ${row.amount}`,
      },
      {
        field: "status",
        headerName: "Status",
        flex: 0.6,
        minWidth: 120,
        renderCell: (params: GridRenderCellParams<Fee, FeeStatus>) => {
          const v = params.value;
          return (
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                v === "Paid"
                  ? "bg-green-50 text-green-700"
                  : "bg-yellow-50 text-yellow-800"
              }`}
            >
              {v}
            </span>
          );
        },
      },
      {
        field: "paidDate",
        headerName: "Paid Date",
        flex: 0.7,
        minWidth: 130,
        valueGetter: (_value, row) => row.paidDate ?? "-",
      },
      {
        field: "transactionType",
        headerName: "Transaction",
        flex: 0.7,
        minWidth: 140,
        valueGetter: (_value, row) => row.transactionType ?? "-",
      },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        flex: 1,
        minWidth: 260,
        renderCell: (params: GridRenderCellParams<Fee>) => {
          const f = params.row;
          return (
            <div className="flex h-full gap-2 items-center ">
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(f);
                  setEditOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  printReceipt([f]);
                }}
              >
                Print
              </Button>
              <Button
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFee(f.id);
                }}
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [studentNameById, deleteFee, printReceipt],
  );

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

  const dashboardStats = useMemo(() => {
    const totalRows = filtered.length;
    const paidRows = filtered.filter((f) => f.status === "Paid");
    const dueRows = filtered.filter((f) => f.status !== "Paid");
    const paidAmount = paidRows.reduce((sum, f) => sum + (f.amount || 0), 0);
    const dueAmount = dueRows.reduce((sum, f) => sum + (f.amount || 0), 0);
    return { totalRows, paidRows: paidRows.length, dueRows: dueRows.length, paidAmount, dueAmount };
  }, [filtered]);

  const paidVsDuePie = useMemo(() => {
    const paid = filtered.filter((f) => f.status === "Paid").reduce((sum, f) => sum + (f.amount ?? 0), 0);
    const due = filtered.filter((f) => f.status !== "Paid").reduce((sum, f) => sum + (f.amount ?? 0), 0);
    const out = [
      { name: "Paid", value: paid },
      { name: "Due", value: due },
    ];
    return out.every((x) => x.value === 0) ? [{ name: "No data", value: 1 }] : out;
  }, [filtered]);

  const monthlyPaidDue = useMemo(() => {
    const byMonth = new Map<string, { month: string; paid: number; due: number }>();
    for (const f of filtered) {
      const cur = byMonth.get(f.month) ?? { month: f.month, paid: 0, due: 0 };
      if (f.status === "Paid") cur.paid += f.amount ?? 0;
      else cur.due += f.amount ?? 0;
      byMonth.set(f.month, cur);
    }
    // Avoid noisy non-month buckets like "Transportation"
    const rows = Array.from(byMonth.values()).filter((x) => /^\d{4}-\d{2}$/.test(x.month));
    rows.sort((a, b) => a.month.localeCompare(b.month));
    return rows.slice(-12);
  }, [filtered]);

  const topDueStudents = useMemo(() => {
    const dueByStudent = new Map<string, number>();
    for (const f of filtered) {
      if (f.status === "Paid") continue;
      dueByStudent.set(f.studentId, (dueByStudent.get(f.studentId) ?? 0) + (f.amount ?? 0));
    }
    return Array.from(dueByStudent.entries())
      .map(([studentId, due]) => ({ student: studentNameById.get(studentId) ?? studentId, due }))
      .sort((a, b) => b.due - a.due)
      .slice(0, 8);
  }, [filtered, studentNameById]);

  return (
    <AppShell>
      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-3">
            <Box
              sx={{
                maxWidth: "100%",
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "grey.200",
                borderRadius: 2,
                px: 1,
              }}
            >
              <Tabs
                value={tab}
                onChange={(_, next) => setTab(next as typeof tab)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                aria-label="Fees tabs"
                sx={{
                  minHeight: 30,
                  "& .MuiTabs-indicator": { backgroundColor: "rgb(79 70 229)" },
                }}
              >
                <Tab
                  value="pay"
                  label="Pay Student Fee"
                  disableRipple
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    minHeight: 44,
                    px: 2,
                    borderRadius: 999,
                    color: "rgb(55 65 81)",
                    "&.Mui-selected": { color: "rgb(79 70 229)" },
                  }}
                />
                <Tab
                  value="filters"
                  label="Filters"
                  disableRipple
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    minHeight: 44,
                    px: 2,
                    borderRadius: 999,
                    color: "rgb(55 65 81)",
                    "&.Mui-selected": { color: "rgb(79 70 229)" },
                  }}
                />
                <Tab
                  value="dashboard"
                  label="Dashboard"
                  disableRipple
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    minHeight: 44,
                    px: 2,
                    borderRadius: 999,
                    color: "rgb(55 65 81)",
                    "&.Mui-selected": { color: "rgb(79 70 229)" },
                  }}
                />
              </Tabs>
            </Box>
          </div>

          {tab === "pay" && (
            <div className="mt-4">
              <PayStudentFeePanel
                students={students}
                fees={fees}
                onPay={(payments) => {
                  payments.forEach(upsert);
                  setLastPayment(payments);
                  setReceiptOpen(true);
                  setTab("dashboard");
                }}
              />
            </div>
          )}

          {tab === "filters" && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Search</div>
                <div className="mt-3">
                  <Input
                    placeholder="Search by student, month, status…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Status</div>
                <div className="mt-3">
                  <FormControl fullWidth size="small">
                    <MuiSelect
                      displayEmpty
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as "" | FeeStatus)}
                      sx={{
                        height: 36,
                        borderRadius: 2,
                        backgroundColor: "#fff",
                        ".MuiSelect-select": { py: 0.5, fontSize: 14, fontWeight: 600 },
                      }}
                      renderValue={(selected) => {
                        if (!selected) return <span style={{ color: "#6b7280", fontWeight: 500 }}>All</span>;
                        return selected;
                      }}
                    >
                      <MenuItem value="">
                        <em style={{ color: "#6b7280" }}>All</em>
                      </MenuItem>
                      <MenuItem value="Paid">Paid</MenuItem>
                      <MenuItem value="Due">Due</MenuItem>
                    </MuiSelect>
                  </FormControl>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Student</div>
                <div className="mt-3">
                  <FormControl fullWidth size="small">
                    <MuiSelect
                      displayEmpty
                      value={studentFilter}
                      onChange={(e) => setStudentFilter(e.target.value)}
                      sx={{
                        height: 36,
                        borderRadius: 2,
                        backgroundColor: "#fff",
                        ".MuiSelect-select": { py: 0.5, fontSize: 14, fontWeight: 600 },
                      }}
                      renderValue={(selected) => {
                        if (!selected) return <span style={{ color: "#6b7280", fontWeight: 500 }}>All students</span>;
                        return students.find((s) => s.id === selected)?.name ?? selected;
                      }}
                    >
                      <MenuItem value="">
                        <em style={{ color: "#6b7280" }}>All students</em>
                      </MenuItem>
                      {students.map((st) => (
                        <MenuItem key={st.id} value={st.id}>
                          {st.name}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 md:col-span-2">
                <div className="text-sm font-semibold text-gray-900">Month</div>
                <div className="mt-3">
                  <FormControl fullWidth size="small">
                    <MuiSelect
                      displayEmpty
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      sx={{
                        height: 36,
                        borderRadius: 2,
                        backgroundColor: "#fff",
                        ".MuiSelect-select": { py: 0.5, fontSize: 14, fontWeight: 600 },
                      }}
                      renderValue={(selected) => {
                        if (!selected) return <span style={{ color: "#6b7280", fontWeight: 500 }}>All months</span>;
                        return selected;
                      }}
                    >
                      <MenuItem value="">
                        <em style={{ color: "#6b7280" }}>All months</em>
                      </MenuItem>
                      {monthOptions.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("");
                    setStudentFilter("");
                    setMonthFilter("");
                  }}
                >
                  Reset filters
                </Button>
              </div>
            </div>
          )}

          {tab === "dashboard" && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs text-gray-500">Rows</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{dashboardStats.totalRows}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs text-gray-500">Paid (rows)</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{dashboardStats.paidRows}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs text-gray-500">Due (rows)</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{dashboardStats.dueRows}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs text-gray-500">Paid amount</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">Rs {dashboardStats.paidAmount}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs text-gray-500">Due amount</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">Rs {dashboardStats.dueAmount}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">Paid vs due (amount)</div>
                  <div className="mt-3 h-64 min-h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip />
                        <Legend />
                        <Pie
                          data={paidVsDuePie}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={95}
                          fill="#4f46e5"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:col-span-2">
                  <div className="text-sm font-semibold text-gray-900">Monthly paid vs due</div>
                  <div className="mt-3 h-64 min-h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyPaidDue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="paid" name="Paid" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="due" name="Due" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {monthlyPaidDue.length === 0 && (
                    <div className="mt-2 text-xs text-gray-500">No month-wise data to chart (try removing filters).</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Top students by due amount</div>
                    <div className="text-xs text-gray-500">Highest outstanding balances (based on current filters).</div>
                  </div>
                  <Button variant="secondary" onClick={() => setTab("filters")}>
                    Adjust filters
                  </Button>
                </div>
                <div className="mt-3 h-72 min-h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topDueStudents} layout="vertical" margin={{ left: 36 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="student" width={140} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="due" name="Due" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {topDueStudents.length === 0 && (
                  <div className="mt-2 text-xs text-gray-500">No due fees found (or filters hide them).</div>
                )}
              </div>

              <Paper elevation={0} sx={{ width: "100%", p: 1, height: "calc(100vh - 320px)" }}>
                <DataGrid
                  rows={filtered}
                  columns={columns}
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10, page: 0 } },
                  }}
                  disableRowSelectionOnClick
                  sx={{
                    border: 0,
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "rgb(249 250 251)",
                    },
                    "& .MuiDataGrid-columnHeaderTitle": {
                      fontWeight: 700,
                      color: "rgba(0,0,0,0.6)",
                    },
                  }}
                />
              </Paper>
            </div>
          )}
        </CardBody>
      </Card>

      <ReceiptModal
        open={receiptOpen}
        payments={lastPayment}
        students={students}
        onClose={() => setReceiptOpen(false)}
      />

      <EditFeeModal
        open={editOpen}
        editing={editing}
        students={students}
        fees={fees}
        onClose={() => setEditOpen(false)}
        onSave={(fee) => {
          upsert(fee);
          setEditOpen(false);
        }}
      />
    </AppShell>
  );
}

function PayStudentFeePanel({
  students,
  fees,
  onPay,
}: {
  students: Student[];
  fees: Fee[];
  onPay: (payments: Fee[]) => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [transactionType, setTransactionType] = useState<"Cash" | "Cheque" | "DD">("Cash");
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeExpiryDate, setChequeExpiryDate] = useState("");
  const [bankName, setBankName] = useState("");
  const [ddNumber, setDdNumber] = useState("");
  const [includeTransportation, setIncludeTransportation] = useState(false);
  const [transportationAmount, setTransportationAmount] = useState<number>(500);
  const [roundup, setRoundup] = useState(false);
  const [roundupValue, setRoundupValue] = useState<number>(10);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [cashBreakdown, setCashBreakdown] = useState<Record<string, number>>({
    "2000": 0,
    "500": 0,
    "100": 0,
    "50": 0,
    "20": 0,
    "10": 0,
    "1": 0,
  });

  const unpaidFees = useMemo(() => fees.filter(f => f.studentId === studentId && f.status === "Due"), [fees, studentId]);

  const selectedFees = useMemo(() => unpaidFees.filter(f => selectedFeeIds.includes(f.id)), [unpaidFees, selectedFeeIds]);

  const baseTotal = useMemo(() => selectedFees.reduce((sum, f) => sum + f.amount, 0), [selectedFees]);
  const transportationTotal = includeTransportation ? transportationAmount : 0;
  const subtotal = baseTotal + transportationTotal - couponDiscount;
  const calculatedTotal = roundup ? (roundupValue > 0 ? Math.ceil(subtotal / roundupValue) * roundupValue : subtotal + roundupValue) : subtotal;
  const cashTotal = useMemo(() => {
    return Object.entries(cashBreakdown).reduce((sum, [denom, count]) => sum + (Number(denom) * count), 0);
  }, [cashBreakdown]);

  const formatMonth = (month: string) => {
    const [year, mon] = month.split('-');
    const date = new Date(parseInt(year), parseInt(mon) - 1, 1);
    return date.toLocaleString('default', { month: 'long' }) + ' - ' + year;
  };

  const reset = useCallback(() => {
    setStudentId("");
    setSelectedFeeIds([]);
    setAmount(0);
    setIncludeTransportation(false);
    setTransportationAmount(500);
    setRoundup(false);
    setRoundupValue(10);
    setCouponDiscount(0);
    setTransactionType("Cash");
    setChequeNumber("");
    setChequeExpiryDate("");
    setBankName("");
    setDdNumber("");
    setCashBreakdown({
      "2000": 0,
      "500": 0,
      "100": 0,
      "50": 0,
      "20": 0,
      "10": 0,
      "1": 0,
    });
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    setAmount(calculatedTotal);
  }, [calculatedTotal]);

  const handlePay = () => {
    if (!studentId) return alert("Select a student.");
    if (selectedFeeIds.length === 0 && !includeTransportation) return alert("Select at least one fee to pay or include transportation.");
    if (calculatedTotal <= 0) return alert("Amount must be > 0.");
    if (transactionType === "Cheque" && (!chequeNumber || !bankName)) return alert("Cheque number and bank name are required.");
    if (transactionType === "DD" && (!ddNumber || !bankName)) return alert("DD number and bank name are required.");

    const today = new Date().toISOString().slice(0, 10);
    const payments: Fee[] = [];

    // Add selected monthly fees
    selectedFees.forEach(fee => {
      payments.push({
        ...fee,
        status: "Paid" as const,
        paidDate: today,
        transactionType,
        ...(transactionType === "Cheque" && { chequeNumber, chequeExpiryDate, bankName }),
        ...(transactionType === "DD" && { bankName, ddNumber }),
        ...(transactionType === "Cash" && { cashBreakdown }),
      });
    });

    // Add transportation fee if included
    if (includeTransportation) {
      payments.push({
        id: uid("fee"),
        studentId,
        month: "Transportation",
        amount: transportationAmount,
        status: "Paid" as const,
        paidDate: today,
        transactionType,
        ...(transactionType === "Cheque" && { chequeNumber, chequeExpiryDate, bankName }),
        ...(transactionType === "DD" && { bankName, ddNumber }),
        ...(transactionType === "Cash" && { cashBreakdown }),
      });
    }

    onPay(payments);
    reset();
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-gray-900">Pay Student Fee</div>
          <div className="text-xs text-gray-500">Record a payment and print a receipt.</div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
          <Button onClick={handlePay} disabled={transactionType === "Cash" && cashTotal !== calculatedTotal}>
            Pay
          </Button>
        </div>
      </div>

      <div className="space-y-4 pb-2 mt-4">
        <div>
          <div className="text-xs text-gray-600 mb-1">Student</div>
          <FormControl fullWidth size="small">
            <MuiSelect
              displayEmpty
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              sx={{
                height: 36,
                maxWidth:200,
                borderRadius: 2,
                backgroundColor: "#fff",
                ".MuiSelect-select": {
                  py: 0.5,
                  fontSize: 14,
                  fontWeight: 600,
                },
              }}
              renderValue={(selected) => {
                if (!selected) {
                  return (
                    <span style={{ color: "#6b7280", fontWeight: 500 }}>
                      Select Student
                    </span>
                  );
                }
                return students.find((s) => s.id === selected)?.name ?? selected;
              }}
            >
              <MenuItem value="">
                <em style={{ color: "#6b7280" }}>Select Student</em>
              </MenuItem>
              {students.map((st) => (
                <MenuItem key={st.id} value={st.id}>
                  {st.name}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>
        </div>

        {studentId && unpaidFees.length > 0 && (
          <div>
            <div className="text-xs text-gray-600 mb-1">Unpaid Fees</div>
            <FormControl fullWidth size="small">
              <InputLabel id="unpaid-fees-label">Unpaid Fees</InputLabel>
              <MuiSelect<string[]>
                labelId="unpaid-fees-label"
                multiple
                value={selectedFeeIds}
                onChange={(e: SelectChangeEvent<string[]>) => {
                  const v = e.target.value;
                  setSelectedFeeIds(typeof v === "string" ? v.split(",") : v);
                }}
                input={<OutlinedInput label="Unpaid Fees" />}
                renderValue={(selected) => {
                  const ids = (Array.isArray(selected) ? selected : []) as string[];
                  const byId = new Map(unpaidFees.map((f) => [f.id, f]));
                  return ids
                    .map((id) => {
                      const fee = byId.get(id);
                      return fee
                        ? `${formatMonth(fee.month)} - Rs ${fee.amount}`
                        : id;
                    })
                    .join(", ");
                }}
              >
                {unpaidFees.map((fee) => (
                  <MenuItem key={fee.id} value={fee.id}>
                    {formatMonth(fee.month)} - Rs {fee.amount}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </div>
        )}

        {studentId && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="transportation"
                checked={includeTransportation}
                onChange={(e) => setIncludeTransportation(e.target.checked)}
              />
              <label htmlFor="transportation" className="text-sm">Include Transportation Fee</label>
            </div>
            {includeTransportation && (
              <div>
                <div className="text-xs text-gray-600 mb-1">Transportation Amount</div>
                <Input
                  type="number"
                  value={transportationAmount}
                  onChange={(e) => setTransportationAmount(Number(e.target.value))}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="roundup"
                checked={roundup}
                onChange={(e) => setRoundup(e.target.checked)}
              />
              <label htmlFor="roundup" className="text-sm">Round</label>
              {roundup && (
                <input
                  type="number"
                  value={roundupValue}
                  onChange={(e) => setRoundupValue(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="10"
                />
              )}
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">Coupon/Discount</div>
              <Input
                type="number"
                value={couponDiscount}
                onChange={(e) => setCouponDiscount(Number(e.target.value))}
                placeholder="Discount amount"
              />
            </div>
          </div>
        )}

        <div>
          <div className="text-xs text-gray-600 mb-1">Fee Breakdown</div>
          <div className="border rounded p-3 bg-gray-50">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Monthly Fees:</span>
                <span>Rs {baseTotal}</span>
              </div>
              {includeTransportation && (
                <div className="flex justify-between">
                  <span>Transportation:</span>
                  <span>Rs {transportationAmount}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>- Rs {couponDiscount}</span>
                </div>
              )}
              {roundup && (
                <div className="flex justify-between">
                  <span>Rounding ({roundupValue > 0 ? `to nearest ${roundupValue}` : `${roundupValue}`})</span>
                  <span>Rs {calculatedTotal - subtotal}</span>
                </div>
              )}
              <hr className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>Rs {calculatedTotal}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-600 mb-1">Total Amount</div>
          <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>

        <div>
          <div className="text-xs text-gray-600 mb-1">Transaction Type</div>
          <FormControl fullWidth size="small">
            <MuiSelect
              value={transactionType}
              onChange={(e) =>
                setTransactionType(e.target.value as "Cash" | "Cheque" | "DD")
              }
              sx={{
                height: 36,
                borderRadius: 2,
                backgroundColor: "#fff",
                ".MuiSelect-select": {
                  py: 0.5,
                  fontSize: 14,
                  fontWeight: 600,
                },
              }}
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
              <MenuItem value="DD">DD</MenuItem>
            </MuiSelect>
          </FormControl>
        </div>

        {transactionType === "Cheque" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">Cheque Number</div>
              <Input value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Expiry Date</div>
              <Input type="date" value={chequeExpiryDate} onChange={(e) => setChequeExpiryDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-600 mb-1">Bank Name</div>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
          </div>
        )}

        {transactionType === "DD" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">DD Number</div>
              <Input value={ddNumber} onChange={(e) => setDdNumber(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Bank Name</div>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
          </div>
        )}

        {transactionType === "Cash" && (
          <div>
            <div className="text-xs text-gray-600 mb-2">Cash Breakdown</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.keys(cashBreakdown).map((denom) => (
                <div key={denom}>
                  <div className="text-xs text-gray-600 mb-1">Rs {denom}</div>
                  <Input
                    type="number"
                    min="0"
                    value={cashBreakdown[denom]}
                    onChange={(e) => setCashBreakdown(prev => ({ ...prev, [denom]: Number(e.target.value) || 0 }))}
                  />
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">Total: Rs {cashTotal}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReceiptModal({
  open,
  payments,
  students,
  onClose,
}: {
  open: boolean;
  payments: Fee[];
  students: Student[];
  onClose: () => void;
}) {
  const studentName = payments.length > 0 ? students.find(s => s.id === payments[0].studentId)?.name : "";
  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Modal
      open={open}
      title="Payment Receipt"
      onClose={onClose}
      className="receipt-modal"
      footer={
        <>
          <Button variant="secondary" onClick={() => window.print()}>
            Print Receipt
          </Button>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">School Fee Payment Receipt</h3>
          <p className="text-sm text-gray-600">Session 2025-2026</p>
        </div>
        <div className="border-t border-b py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-600">Student</div>
              <div className="font-medium">{studentName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Date</div>
              <div className="font-medium">{payments[0]?.paidDate}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Transaction Type</div>
              <div className="font-medium">{payments[0]?.transactionType}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Total Amount</div>
              <div className="font-medium">Rs {total}</div>
              <div className="text-xs text-gray-500">{numberToWords(total)}</div>
            </div>
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Fee Details</div>
          <div className="space-y-1">
            {payments.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{p.month}</span>
                <span>Rs {p.amount}</span>
              </div>
            ))}
          </div>
        </div>
        {payments[0]?.transactionType === "Cheque" && (
          <div>
            <div className="text-sm font-medium mb-2">Cheque Details</div>
            <div className="text-sm space-y-1">
              <div>Number: {payments[0].chequeNumber}</div>
              <div>Bank: {payments[0].bankName}</div>
              {payments[0].chequeExpiryDate && <div>Expiry: {payments[0].chequeExpiryDate}</div>}
            </div>
          </div>
        )}
        {payments[0]?.transactionType === "DD" && (
          <div>
            <div className="text-sm font-medium mb-2">DD Details</div>
            <div className="text-sm space-y-1">
              <div>Number: {payments[0].ddNumber}</div>
              <div>Bank: {payments[0].bankName}</div>
            </div>
          </div>
        )}
        {payments[0]?.transactionType === "Cash" && payments[0].cashBreakdown && (
          <div>
            <div className="text-sm font-medium mb-2">Cash Breakdown</div>
            <div className="text-sm space-y-1">
              {Object.entries(payments[0].cashBreakdown).filter(([, count]) => count > 0).map(([denom, count]) => (
                <div key={denom}>Rs {denom} x {count} = Rs {Number(denom) * count}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function EditFeeModal({
  open,
  editing,
  students,
  fees,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Fee | null;
  students: Student[];
  fees: Fee[];
  onClose: () => void;
  onSave: (fee: Fee) => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [transactionType, setTransactionType] = useState<"Cash" | "Cheque" | "DD">("Cash");
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeExpiryDate, setChequeExpiryDate] = useState("");
  const [bankName, setBankName] = useState("");
  const [ddNumber, setDdNumber] = useState("");
  const [includeTransportation, setIncludeTransportation] = useState(false);
  const [transportationAmount, setTransportationAmount] = useState<number>(500);
  const [roundup, setRoundup] = useState(false);
  const [roundupValue, setRoundupValue] = useState<number>(10);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [cashBreakdown, setCashBreakdown] = useState<Record<string, number>>({
    "2000": 0,
    "500": 0,
    "100": 0,
    "50": 0,
    "20": 0,
    "10": 0,
    "1": 0,
  });

  const unpaidFees = useMemo(() => fees.filter(f => f.studentId === studentId && f.status === "Due"), [fees, studentId]);

  const selectedFees = useMemo(() => unpaidFees.filter(f => selectedFeeIds.includes(f.id)), [unpaidFees, selectedFeeIds]);

  const baseTotal = useMemo(() => selectedFees.reduce((sum, f) => sum + f.amount, 0), [selectedFees]);
  const transportationTotal = includeTransportation ? transportationAmount : 0;
  const subtotal = baseTotal + transportationTotal - couponDiscount;
  const calculatedTotal = roundup ? (roundupValue > 0 ? Math.ceil(subtotal / roundupValue) * roundupValue : subtotal + roundupValue) : subtotal;
  const cashTotal = useMemo(() => {
    return Object.entries(cashBreakdown).reduce((sum, [denom, count]) => sum + (Number(denom) * count), 0);
  }, [cashBreakdown]);

  const formatMonth = (month: string) => {
    const [year, mon] = month.split('-');
    const date = new Date(parseInt(year), parseInt(mon) - 1, 1);
    return date.toLocaleString('default', { month: 'long' }) + ' - ' + year;
  };

  useEffect(() => {
    if (!open || !editing) return;
    setStudentId(editing.studentId);
    setSelectedFeeIds([]); // For editing, we don't pre-select fees
    setTransactionType(editing.transactionType || "Cash");
    setChequeNumber(editing.chequeNumber || "");
    setChequeExpiryDate(editing.chequeExpiryDate || "");
    setBankName(editing.bankName || "");
    setDdNumber(editing.ddNumber || "");
    setIncludeTransportation(false); // Reset additional options
    setTransportationAmount(500);
    setRoundup(false);
    setRoundupValue(10);
    setCouponDiscount(0);
    const denomKeys = ["2000", "500", "100", "50", "20", "10", "1"] as const;
    const fromFee = editing.cashBreakdown;
    setCashBreakdown(
      Object.fromEntries(
        denomKeys.map((k) => [k, fromFee?.[k] ?? 0]),
      ) as Record<string, number>,
    );
  }, [open, editing]);

  const handleSave = () => {
    if (!editing) return;
    if (!studentId) return alert("Student is required.");
    if (selectedFeeIds.length === 0 && !includeTransportation) return alert("Select at least one fee to edit or include transportation.");
    if (calculatedTotal <= 0) return alert("Amount must be > 0.");
    if (transactionType === "Cash" && cashTotal !== calculatedTotal) return alert("Cash breakdown total must match the amount.");
    if (transactionType === "Cheque" && (!chequeNumber || !bankName)) return alert("Cheque number and bank name are required.");
    if (transactionType === "DD" && (!ddNumber || !bankName)) return alert("DD number and bank name are required.");

    const today = new Date().toISOString().slice(0, 10);
    const updatedFees: Fee[] = [];

    // Update selected monthly fees
    selectedFees.forEach(fee => {
      updatedFees.push({
        ...fee,
        status: "Paid" as const,
        paidDate: today,
        transactionType,
        ...(transactionType === "Cheque" && { chequeNumber, chequeExpiryDate, bankName }),
        ...(transactionType === "DD" && { bankName, ddNumber }),
        ...(transactionType === "Cash" && { cashBreakdown }),
      });
    });

    // Add transportation fee if included
    if (includeTransportation) {
      updatedFees.push({
        id: uid("fee"),
        studentId,
        month: "Transportation",
        amount: transportationAmount,
        status: "Paid" as const,
        paidDate: today,
        transactionType,
        ...(transactionType === "Cheque" && { chequeNumber, chequeExpiryDate, bankName }),
        ...(transactionType === "DD" && { bankName, ddNumber }),
        ...(transactionType === "Cash" && { cashBreakdown }),
      });
    }

    // For now, just update the first fee (the one being edited)
    // In a real app, you might want to handle multiple fee updates
    if (updatedFees.length > 0) {
      onSave(updatedFees[0]);
    }
  };

  return (
    <Modal
      open={open}
      title="Edit Fee Record"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={transactionType === "Cash" && cashTotal !== calculatedTotal}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-2">
        <div>
          <div className="text-xs text-gray-600 mb-1">Student</div>
          <FormControl fullWidth size="small">
            <MuiSelect
              displayEmpty
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              sx={{
                height: 36,
                borderRadius: 2,
                backgroundColor: "#fff",
                ".MuiSelect-select": {
                  py: 0.5,
                  fontSize: 14,
                  fontWeight: 600,
                },
              }}
              renderValue={(selected) => {
                if (!selected) {
                  return (
                    <span style={{ color: "#6b7280", fontWeight: 500 }}>
                      Select Student
                    </span>
                  );
                }
                return students.find((s) => s.id === selected)?.name ?? selected;
              }}
            >
              <MenuItem value="">
                <em style={{ color: "#6b7280" }}>Select Student</em>
              </MenuItem>
              {students.map((st) => (
                <MenuItem key={st.id} value={st.id}>
                  {st.name}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>
        </div>

        {studentId && unpaidFees.length > 0 && (
          <div>
            <div className="text-xs text-gray-600 mb-1">Unpaid Fees</div>
            <FormControl fullWidth size="small">
              <InputLabel id="unpaid-fees-edit-label">Unpaid Fees</InputLabel>
              <MuiSelect<string[]>
                labelId="unpaid-fees-edit-label"
                multiple
                value={selectedFeeIds}
                onChange={(e: SelectChangeEvent<string[]>) => {
                  const v = e.target.value;
                  setSelectedFeeIds(typeof v === "string" ? v.split(",") : v);
                }}
                input={<OutlinedInput label="Unpaid Fees" />}
                renderValue={(selected) => {
                  const ids = (Array.isArray(selected) ? selected : []) as string[];
                  const byId = new Map(unpaidFees.map((f) => [f.id, f]));
                  return ids
                    .map((id) => {
                      const fee = byId.get(id);
                      return fee
                        ? `${formatMonth(fee.month)} - Rs ${fee.amount}`
                        : id;
                    })
                    .join(", ");
                }}
              >
                {unpaidFees.map((fee) => (
                  <MenuItem key={fee.id} value={fee.id}>
                    {formatMonth(fee.month)} - Rs {fee.amount}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </div>
        )}

        {studentId && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="transportation-edit"
                checked={includeTransportation}
                onChange={(e) => setIncludeTransportation(e.target.checked)}
              />
              <label htmlFor="transportation-edit" className="text-sm">Include Transportation Fee</label>
            </div>
            {includeTransportation && (
              <div>
                <div className="text-xs text-gray-600 mb-1">Transportation Amount</div>
                <Input
                  type="number"
                  value={transportationAmount}
                  onChange={(e) => setTransportationAmount(Number(e.target.value))}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="roundup-edit"
                checked={roundup}
                onChange={(e) => setRoundup(e.target.checked)}
              />
              <label htmlFor="roundup-edit" className="text-sm">Round</label>
              {roundup && (
                <input
                  type="number"
                  value={roundupValue}
                  onChange={(e) => setRoundupValue(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="10"
                />
              )}
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">Coupon/Discount</div>
              <Input
                type="number"
                value={couponDiscount}
                onChange={(e) => setCouponDiscount(Number(e.target.value))}
                placeholder="Discount amount"
              />
            </div>
          </div>
        )}

        <div>
          <div className="text-xs text-gray-600 mb-1">Fee Breakdown</div>
          <div className="border rounded p-3 bg-gray-50">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Monthly Fees:</span>
                <span>Rs {baseTotal}</span>
              </div>
              {includeTransportation && (
                <div className="flex justify-between">
                  <span>Transportation:</span>
                  <span>Rs {transportationAmount}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>- Rs {couponDiscount}</span>
                </div>
              )}
              {roundup && (
                <div className="flex justify-between">
                  <span>Rounding ({roundupValue > 0 ? `to nearest ${roundupValue}` : `${roundupValue}`})</span>
                  <span>Rs {calculatedTotal - subtotal}</span>
                </div>
              )}
              <hr className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>Rs {calculatedTotal}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-600 mb-1">Transaction Type</div>
          <FormControl fullWidth size="small">
            <MuiSelect
              value={transactionType}
              onChange={(e) =>
                setTransactionType(e.target.value as "Cash" | "Cheque" | "DD")
              }
              sx={{
                height: 36,
                borderRadius: 2,
                backgroundColor: "#fff",
                ".MuiSelect-select": {
                  py: 0.5,
                  fontSize: 14,
                  fontWeight: 600,
                },
              }}
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
              <MenuItem value="DD">DD</MenuItem>
            </MuiSelect>
          </FormControl>
        </div>

        {transactionType === "Cheque" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">Cheque Number</div>
              <Input value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Expiry Date</div>
              <Input type="date" value={chequeExpiryDate} onChange={(e) => setChequeExpiryDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-600 mb-1">Bank Name</div>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
          </div>
        )}

        {transactionType === "DD" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">DD Number</div>
              <Input value={ddNumber} onChange={(e) => setDdNumber(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Bank Name</div>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
          </div>
        )}

        {transactionType === "Cash" && (
          <div>
            <div className="text-xs text-gray-600 mb-2">Cash Breakdown</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.keys(cashBreakdown).map((denom) => (
                <div key={denom}>
                  <div className="text-xs text-gray-600 mb-1">Rs {denom}</div>
                  <Input
                    type="number"
                    min="0"
                    value={cashBreakdown[denom]}
                    onChange={(e) => setCashBreakdown(prev => ({ ...prev, [denom]: Number(e.target.value) || 0 }))}
                  />
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">Total: Rs {cashTotal}</div>
          </div>
        )}
      </div>
    </Modal>
  );
}

<style jsx>{`
  @media print {
    body * {
      visibility: hidden;
    }
    .receipt-modal,
    .receipt-modal * {
      visibility: visible;
    }
    .receipt-modal {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      box-shadow: none;
      border: 1px solid #000;
    }
    .modal-overlay {
      display: none !important;
    }
    button {
      display: none !important;
    }
  }
`}</style>

