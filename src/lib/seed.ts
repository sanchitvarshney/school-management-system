import type { SmsDb } from "./models";

function id(prefix: string, n: number) {
  return `${prefix}_${n.toString().padStart(3, "0")}`;
}

export function createSeedDb(): SmsDb {
  const sessionA = "2025-2026";
  const sessionB = "2024-2025";

  const classes = [
    { id: id("class", 1), name: "Class 1" },
    { id: id("class", 2), name: "Class 2" },
    { id: id("class", 3), name: "Class 3" },
  ];
  const sections = [
    { id: id("sec", 1), classId: classes[0]!.id, name: "A" },
    { id: id("sec", 2), classId: classes[0]!.id, name: "B" },
    { id: id("sec", 3), classId: classes[1]!.id, name: "A" },
  ];
  const teachers = [
    { id: id("t", 1), name: "Ayesha Khan", phone: "03001234567", subject: "Math", joiningDate: "2023-08-01" },
    { id: id("t", 2), name: "Ali Raza", phone: "03111234567", subject: "English", joiningDate: "2022-04-15" },
  ];
  const students = [
    { id: id("s", 1), name: "Hamza Ahmed", rollNo: "01", classId: classes[0]!.id, sectionId: sections[0]!.id, guardianPhone: "03009876543" },
    { id: id("s", 2), name: "Sara Noor", rollNo: "02", classId: classes[0]!.id, sectionId: sections[1]!.id, guardianPhone: "03211239876" },
    { id: id("s", 3), name: "Usman Tariq", rollNo: "01", classId: classes[1]!.id, sectionId: sections[2]!.id, guardianPhone: "03331234567" },
  ];
  const fees = [
    { id: id("fee", 1), studentId: students[0]!.id, month: "2025-08", amount: 2500, status: "Paid" as const, paidDate: "2025-08-05" },
    { id: id("fee", 2), studentId: students[1]!.id, month: "2025-08", amount: 2500, status: "Due" as const },
    { id: id("fee", 3), studentId: students[2]!.id, month: "2025-08", amount: 2500, status: "Paid" as const, paidDate: "2025-08-02" },
  ];
  const exams = [
    { id: id("ex", 1), name: "Mid Term", classId: classes[0]!.id, startDate: "2025-10-10", endDate: "2025-10-20" },
    { id: id("ex", 2), name: "Final Term", classId: classes[1]!.id, startDate: "2026-03-01", endDate: "2026-03-10" },
  ];

  return {
    version: 1,
    selectedSessionId: sessionA,
    sessions: {
      [sessionA]: { teachers, classes, sections, students, fees, exams },
      [sessionB]: { teachers: [], classes, sections: [], students: [], fees: [], exams: [] },
    },
  };
}

