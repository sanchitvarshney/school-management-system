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
    { id: id("class", 4), name: "8" },
  ];
  const sections = [
    { id: id("sec", 1), classId: classes[0]!.id, name: "A" },
    { id: id("sec", 2), classId: classes[0]!.id, name: "B" },
    { id: id("sec", 3), classId: classes[1]!.id, name: "A" },
    { id: id("sec", 4), classId: classes[3]!.id, name: "A" },
    { id: id("sec", 5), classId: classes[3]!.id, name: "B" },
    { id: id("sec", 6), classId: classes[3]!.id, name: "C" },
    { id: id("sec", 7), classId: classes[3]!.id, name: "D" },
    { id: id("sec", 8), classId: classes[3]!.id, name: "E" },
    { id: id("sec", 9), classId: classes[3]!.id, name: "F" },
    { id: id("sec", 10), classId: classes[3]!.id, name: "G" },
    { id: id("sec", 11), classId: classes[3]!.id, name: "H" },
    { id: id("sec", 12), classId: classes[3]!.id, name: "I" },
    { id: id("sec", 13), classId: classes[3]!.id, name: "J" },
    { id: id("sec", 14), classId: classes[3]!.id, name: "K" },
  ];
  const teachers = [
    { id: id("t", 1), name: "Ayesha Khan", phone: "03001234567", subject: "Math", joiningDate: "2023-08-01" },
    { id: id("t", 2), name: "Ali Raza", phone: "03111234567", subject: "English", joiningDate: "2022-04-15" },
  ];
  const students = [
    { id: id("s", 1), name: "Hamza Ahmed", rollNo: "01", classId: classes[0]!.id, sectionId: sections[0]!.id, guardianPhone: "03009876543" },
    { id: id("s", 2), name: "Sara Noor", rollNo: "02", classId: classes[0]!.id, sectionId: sections[1]!.id, guardianPhone: "03211239876" },
    { id: id("s", 3), name: "Usman Tariq", rollNo: "01", classId: classes[1]!.id, sectionId: sections[2]!.id, guardianPhone: "03331234567" },
    { id: id("s", 4), name: "Amina Khan", rollNo: "01", classId: classes[3]!.id, sectionId: sections[3]!.id, guardianPhone: "03001112222" },
    { id: id("s", 5), name: "Bilal Hassan", rollNo: "02", classId: classes[3]!.id, sectionId: sections[3]!.id, guardianPhone: "03002223333" },
    { id: id("s", 6), name: "Fatima Ali", rollNo: "03", classId: classes[3]!.id, sectionId: sections[3]!.id, guardianPhone: "03003334444" },
    { id: id("s", 7), name: "Hassan Raza", rollNo: "01", classId: classes[3]!.id, sectionId: sections[4]!.id, guardianPhone: "03004445555" },
    { id: id("s", 8), name: "Zainab Malik", rollNo: "02", classId: classes[3]!.id, sectionId: sections[4]!.id, guardianPhone: "03005556666" },
    { id: id("s", 9), name: "Omar Sheikh", rollNo: "01", classId: classes[3]!.id, sectionId: sections[5]!.id, guardianPhone: "03006667777" },
    { id: id("s", 10), name: "Ayesha Siddiqui", rollNo: "02", classId: classes[3]!.id, sectionId: sections[5]!.id, guardianPhone: "03007778888" },
    { id: id("s", 11), name: "Yusuf Ahmed", rollNo: "01", classId: classes[3]!.id, sectionId: sections[6]!.id, guardianPhone: "03008889999" },
    { id: id("s", 12), name: "Mariam Noor", rollNo: "02", classId: classes[3]!.id, sectionId: sections[6]!.id, guardianPhone: "03009990000" },
    { id: id("s", 13), name: "Ibrahim Khan", rollNo: "01", classId: classes[3]!.id, sectionId: sections[7]!.id, guardianPhone: "03101112222" },
    { id: id("s", 14), name: "Hira Tariq", rollNo: "02", classId: classes[3]!.id, sectionId: sections[7]!.id, guardianPhone: "03112223333" },
    { id: id("s", 15), name: "Arham Hussain", rollNo: "01", classId: classes[3]!.id, sectionId: sections[8]!.id, guardianPhone: "03113334444" },
    { id: id("s", 16), name: "Sana Mahmood", rollNo: "02", classId: classes[3]!.id, sectionId: sections[8]!.id, guardianPhone: "03114445555" },
    { id: id("s", 17), name: "Danish Ali", rollNo: "01", classId: classes[3]!.id, sectionId: sections[9]!.id, guardianPhone: "03115556666" },
    { id: id("s", 18), name: "Aiza Farooq", rollNo: "02", classId: classes[3]!.id, sectionId: sections[9]!.id, guardianPhone: "03116667777" },
    { id: id("s", 19), name: "Rayyan Ahmed", rollNo: "01", classId: classes[3]!.id, sectionId: sections[10]!.id, guardianPhone: "03117778888" },
    { id: id("s", 20), name: "Mehak Khan", rollNo: "02", classId: classes[3]!.id, sectionId: sections[10]!.id, guardianPhone: "03118889999" },
    { id: id("s", 21), name: "Saad Malik", rollNo: "01", classId: classes[3]!.id, sectionId: sections[11]!.id, guardianPhone: "03119990000" },
    { id: id("s", 22), name: "Zara Sheikh", rollNo: "02", classId: classes[3]!.id, sectionId: sections[11]!.id, guardianPhone: "03201112222" },
    { id: id("s", 23), name: "Taha Raza", rollNo: "01", classId: classes[3]!.id, sectionId: sections[12]!.id, guardianPhone: "03212223333" },
    { id: id("s", 24), name: "Noor ul Ain", rollNo: "02", classId: classes[3]!.id, sectionId: sections[12]!.id, guardianPhone: "03213334444" },
    { id: id("s", 25), name: "Ahmed Hassan", rollNo: "01", classId: classes[3]!.id, sectionId: sections[13]!.id, guardianPhone: "03214445555" },
  ];
  const fees = [
    { id: id("fee", 1), studentId: students[0]!.id, month: "2025-08", amount: 2500, status: "Paid" as const, paidDate: "2025-08-05" },
    { id: id("fee", 2), studentId: students[1]!.id, month: "2025-08", amount: 2500, status: "Due" as const },
    { id: id("fee", 3), studentId: students[2]!.id, month: "2025-08", amount: 2500, status: "Paid" as const, paidDate: "2025-08-02" },
    { id: id("fee", 4), studentId: students[3]!.id, month: "2025-08", amount: 2500, status: "Due" as const },
    { id: id("fee", 5), studentId: students[4]!.id, month: "2025-08", amount: 2500, status: "Paid" as const, paidDate: "2025-08-10" },
  ];
  const exams = [
    { id: id("ex", 1), name: "Mid Term", classId: classes[0]!.id, startDate: "2025-10-10", endDate: "2025-10-20" },
    { id: id("ex", 2), name: "Final Term", classId: classes[1]!.id, startDate: "2026-03-01", endDate: "2026-03-10" },
    { id: id("ex", 3), name: "Grade 8 Mid Term", classId: classes[3]!.id, startDate: "2025-11-01", endDate: "2025-11-15" },
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

