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
import { uid, numberToWords } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export default function FeesPage() {
  const [db, setDbState] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
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

  function printReceipt(fees: Fee[]) {
    setLastPayment(fees);
    setReceiptOpen(true);
  }

  function deleteFee(id: string) {
    if (confirm("Are you sure you want to delete this fee record? This action cannot be undone.")) {
      del(id);
    }
  }

  return (
    <AppShell>
      <Card>
        <CardHeader
          title="Fees"
          subtitle="Track student fees"
          right={
            <Button onClick={() => setOpen(true)}>
              Pay Fee
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
                  <Th>Transaction</Th>
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
                    <Td>{f.transactionType ?? "-"}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { setEditing(f); setEditOpen(true); }}>Edit</Button>
                        <Button variant="secondary" onClick={() => printReceipt([f])}>Print</Button>
                        <Button variant="danger" onClick={() => deleteFee(f.id)}>Delete</Button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <Td><span className="text-gray-500">No fee records found.</span></Td>
                    <Td /><Td /><Td /><Td /><Td /><Td />
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <PaymentModal
        open={open}
        students={students}
        fees={db?.sessions?.[sessionId]?.fees ?? []}
        onClose={() => setOpen(false)}
        onPay={(payments) => {
          payments.forEach(upsert);
          setLastPayment(payments);
          setReceiptOpen(true);
          setOpen(false);
        }}
      />

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

function PaymentModal({
  open,
  students,
  fees,
  onClose,
  onPay,
}: {
  open: boolean;
  students: Student[];
  fees: Fee[];
  onClose: () => void;
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

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

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
  };

  return (
    <Modal open={open} title="Pay Student Fee" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <div className="text-xs text-gray-600 mb-1">Student</div>
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Select Student</option>
            {students.map((st) => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </Select>
        </div>

        {studentId && unpaidFees.length > 0 && (
          <div>
            <div className="text-xs text-gray-600 mb-1">Unpaid Fees</div>
            <Select
              multiple
              value={selectedFeeIds}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedFeeIds(options);
              }}
              className="w-full"
            >
              {unpaidFees.map((fee) => (
                <option key={fee.id} value={fee.id}>
                  {formatMonth(fee.month)} - Rs {fee.amount}
                </option>
              ))}
            </Select>
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
          <Select value={transactionType} onChange={(e) => setTransactionType(e.target.value as typeof transactionType)}>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
            <option value="DD">DD</option>
          </Select>
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

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handlePay} 
            disabled={transactionType === "Cash" && cashTotal !== calculatedTotal}
          >
            Pay
          </Button>
        </div>
      </div>
    </Modal>
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
    <Modal open={open} title="Payment Receipt" onClose={onClose} className="receipt-modal">
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
        <div className="pt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => window.print()}>Print Receipt</Button>
          <Button onClick={onClose}>Close</Button>
        </div>
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

  useEffect(() => {
    if (!open || !editing) return;
    setStudentId(editing.studentId);
    setSelectedFeeIds([]); // For editing, we don't pre-select fees
    setAmount(editing.amount);
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
    setCashBreakdown({
      "2000": 0,
      "500": 0,
      "100": 0,
      "50": 0,
      "20": 0,
      "10": 0,
      "1": 0,
    });
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
    <Modal open={open} title="Edit Fee Record" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <div className="text-xs text-gray-600 mb-1">Student</div>
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Select Student</option>
            {students.map((st) => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </Select>
        </div>

        {studentId && unpaidFees.length > 0 && (
          <div>
            <div className="text-xs text-gray-600 mb-1">Unpaid Fees</div>
            <Select
              multiple
              value={selectedFeeIds}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedFeeIds(options);
              }}
              className="w-full"
            >
              {unpaidFees.map((fee) => (
                <option key={fee.id} value={fee.id}>
                  {formatMonth(fee.month)} - Rs {fee.amount}
                </option>
              ))}
            </Select>
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
          <Select value={transactionType} onChange={(e) => setTransactionType(e.target.value as typeof transactionType)}>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
            <option value="DD">DD</option>
          </Select>
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

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={transactionType === "Cash" && cashTotal !== calculatedTotal}
          >
            Save Changes
          </Button>
        </div>
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

