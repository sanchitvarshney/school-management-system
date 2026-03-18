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
  // Core identifiers
  name: string; // display name (fallback: first + last)
  admissionId?: string;
  rollNo: string;
  classId: string;
  sectionId: string;
  guardianPhone: string;

  // Personal information
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nickName?: string;
  gender?: string;
  dob?: string; // ISO yyyy-mm-dd
  placeOfBirth?: string;
  religion?: string;
  caste?: string;
  category?: string;
  nationality?: string;

  // Medical information
  medicalCondition?: string; // yes/no
  medicalDescription?: string;

  // Guardian information
  fatherName?: string;
  motherName?: string;
  mobileNo?: string;
  altMobileNo?: string;
  emailId?: string;

  // Address
  currentAddress?: string;
  currentPinCode?: string;
  permanentAddress?: string;
  permanentPinCode?: string;

  // Last school / attempt info
  lastSchoolBoard?: string;
  lastSchoolName?: string;
  lastSchoolAddress?: string;
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

