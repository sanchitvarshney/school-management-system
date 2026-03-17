export type AcademicSessionId = string;

export type Teacher = {
  id: string;
  name: string;
  phone: string;
  subject: string;
  joiningDate: string; // ISO yyyy-mm-dd
};

export type ClassRoom = {
  id: string;
  name: string; // e.g. "Class 1", "Grade 10"
};

export type Section = {
  id: string;
  classId: string;
  name: string; // e.g. "A"
};

export type Student = {
  id: string;
  name: string;
  rollNo: string;
  classId: string;
  sectionId: string;
  guardianPhone: string;
};

export type FeeStatus = "Paid" | "Due";

export type Fee = {
  id: string;
  studentId: string;
  month: string; // yyyy-mm
  amount: number;
  status: FeeStatus;
  paidDate?: string; // ISO
};

export type Exam = {
  id: string;
  name: string;
  classId: string;
  startDate: string; // ISO
  endDate: string; // ISO
};

export type SmsDb = {
  version: 1;
  selectedSessionId: AcademicSessionId;
  sessions: Record<
    AcademicSessionId,
    {
      teachers: Teacher[];
      classes: ClassRoom[];
      sections: Section[];
      students: Student[];
      fees: Fee[];
      exams: Exam[];
    }
  >;
};

