"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SlideOver } from "@/components/ui/SlideOver";
import { Table, Td, Th } from "@/components/ui/Table";
import type { ClassRoom, Section, SmsDb, Student } from "@/lib/models";
import { getDb, getSelectedSessionId, setDb } from "@/lib/storage";
import { uid } from "@/lib/utils";

export default function StudentsPage() {
  const [db, setDbState] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");
  // search-first UI (like screenshot)
  const [searchClassId, setSearchClassId] = useState<string>("");
  const [searchSectionId, setSearchSectionId] = useState<string>("");
  const [admissionId, setAdmissionId] = useState<string>("");
  const [rollOrName, setRollOrName] = useState<string>("");
  const [showResults, setShowResults] = useState<boolean>(false);
  const [results, setResults] = useState<Student[]>([]);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

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
  const students = s?.students ?? [];
  const classes = s?.classes ?? [];
  const sections = s?.sections ?? [];

  const availableSections = useMemo(() => {
    if (!searchClassId) return sections;
    return sections.filter((sec) => sec.classId === searchClassId);
  }, [sections, searchClassId]);

  useEffect(() => {
    if (!searchClassId) {
      setSearchSectionId("");
      return;
    }
    if (searchSectionId && availableSections.some((x) => x.id === searchSectionId)) return;
    setSearchSectionId(availableSections[0]?.id ?? "");
  }, [searchClassId, availableSections, searchSectionId]);

  function clearSearch() {
    setSearchClassId("");
    setSearchSectionId("");
    setAdmissionId("");
    setRollOrName("");
    setResults([]);
    setShowResults(false);
  }

  function fetchStudents() {
    const cls = searchClassId.trim();
    const sec = searchSectionId.trim();
    const adm = admissionId.trim();
    const rn = rollOrName.trim().toLowerCase();

    let out: Student[] = [];

    // Priority order (matches screenshot "OR"):
    // 1) Class + Section
    // 2) Admission ID
    // 3) Roll No / Name
    if (cls && sec) {
      out = students.filter((st) => st.classId === cls && st.sectionId === sec);
    } else if (adm) {
      // admission id is mapped to student.id in this demo
      out = students.filter((st) => st.id.toLowerCase() === adm.toLowerCase());
    } else if (rn) {
      out = students.filter(
        (st) => st.rollNo.toLowerCase().includes(rn) || st.name.toLowerCase().includes(rn)
      );
    } else {
      out = students;
    }

    setResults(out);
    setShowResults(true);
  }

  function upsertStudent(nextStudent: Student) {
    if (!db) return;
    const ss = db.sessions[sessionId];
    const nextStudents = ss.students.some((x) => x.id === nextStudent.id)
      ? ss.students.map((x) => (x.id === nextStudent.id ? nextStudent : x))
      : [nextStudent, ...ss.students];
    const nextDb: SmsDb = {
      ...db,
      sessions: { ...db.sessions, [sessionId]: { ...ss, students: nextStudents } },
    };
    setDb(nextDb);
    setDbState(nextDb);
  }

  function deleteStudent(id: string) {
    if (!db) return;
    const ss = db.sessions[sessionId];
    const nextDb: SmsDb = {
      ...db,
      sessions: { ...db.sessions, [sessionId]: { ...ss, students: ss.students.filter((x) => x.id !== id) } },
    };
    setDb(nextDb);
    setDbState(nextDb);
  }

  const classNameById = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);
  const sectionNameById = useMemo(
    () => new Map(sections.map((sec) => [sec.id, `${classNameById.get(sec.classId) ?? ""}-${sec.name}`])),
    [sections, classNameById]
  );

  return (
    <AppShell>
      {!showResults ? (
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader title="Students" subtitle="Search students" />
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm font-semibold text-gray-800">Class</div>
                  <div className="flex-1">
                    <Select value={searchClassId} onChange={(e) => setSearchClassId(e.target.value)}>
                      <option value="">Select</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm font-semibold text-gray-800">Section</div>
                  <div className="flex-1">
                    <Select
                      value={searchSectionId}
                      onChange={(e) => setSearchSectionId(e.target.value)}
                      disabled={!searchClassId}
                    >
                      <option value="">Select</option>
                      {availableSections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              <div className="my-6 text-center text-lg font-extrabold text-gray-900">OR</div>

              <div className="flex items-center gap-4">
                <div className="w-40 text-sm font-semibold text-gray-800">Admission ID</div>
                <div className="flex-1">
                  <Input
                    value={admissionId}
                    onChange={(e) => setAdmissionId(e.target.value)}
                    placeholder="Enter admission id"
                  />
                </div>
              </div>

              <div className="my-6 text-center text-lg font-extrabold text-gray-900">OR</div>

              <div className="flex items-center gap-4">
                <div className="w-40 text-sm font-semibold text-gray-800">Roll No. / Name</div>
                <div className="flex-1">
                  <Input
                    value={rollOrName}
                    onChange={(e) => setRollOrName(e.target.value)}
                    placeholder="Enter roll no or name"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-8">
                <button type="button" className="text-sm text-blue-600 underline" onClick={clearSearch}>
                  Clear
                </button>
                <Button onClick={fetchStudents}>Fetch</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader
            title="Students"
            subtitle={`Results: ${results.length}`}
            right={
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowResults(false)}>
                  New Search
                </Button>
                <Button
                  onClick={() => {
                    setEditing(null);
                    setRegisterOpen(true);
                  }}
                >
                  Register Student
                </Button>
              </div>
            }
          />
          <CardBody>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Roll No</Th>
                  <Th>Class</Th>
                  <Th>Section</Th>
                  <Th>Guardian Phone</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {results.map((st) => (
                  <tr key={st.id} className="hover:bg-gray-50">
                    <Td>
                      <Link className="text-indigo-700 hover:underline font-semibold" href={`/students/${st.id}`}>
                        {st.name}
                      </Link>
                    </Td>
                    <Td>{st.rollNo}</Td>
                    <Td>{classNameById.get(st.classId) ?? "-"}</Td>
                    <Td>{sectionNameById.get(st.sectionId) ?? "-"}</Td>
                    <Td>{st.guardianPhone}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditing(st);
                            setRegisterOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (confirm("Delete this student?")) deleteStudent(st.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <Td>
                      <span className="text-gray-500">No students found.</span>
                    </Td>
                    <Td />
                    <Td />
                    <Td />
                    <Td />
                    <Td />
                  </tr>
                )}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      <StudentRegistrationDrawer
        open={registerOpen}
        editing={editing}
        classes={classes}
        sections={sections}
        onClose={() => setRegisterOpen(false)}
        onSave={(values) => {
          const next: Student = {
            id: editing?.id ?? uid("s"),
            ...values,
          };
          upsertStudent(next);
          setRegisterOpen(false);
        }}
      />
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 items-start">
      <div className="text-sm font-semibold text-gray-800 pt-2">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function SectionFieldset({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-gray-200 bg-white">
      <legend className="ml-4 px-3 text-sm font-semibold text-gray-900">{title}</legend>
      <div className="p-4 sm:p-5 space-y-4">{children}</div>
    </fieldset>
  );
}

function StudentRegistrationDrawer({
  open,
  editing,
  classes,
  sections,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Student | null;
  classes: ClassRoom[];
  sections: Section[];
  onClose: () => void;
  onSave: (values: Omit<Student, "id">) => void;
}) {
  // Core + identifiers
  const [admissionId, setAdmissionId] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");

  // Personal information
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickName, setNickName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [religion, setReligion] = useState("");
  const [caste, setCaste] = useState("");
  const [category, setCategory] = useState("");
  const [nationality, setNationality] = useState("");

  // Medical information
  const [medicalCondition, setMedicalCondition] = useState("");
  const [medicalDescription, setMedicalDescription] = useState("");

  // Guardian information
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [altMobileNo, setAltMobileNo] = useState("");
  const [emailId, setEmailId] = useState("");

  // Address
  const [currentAddress, setCurrentAddress] = useState("");
  const [currentPinCode, setCurrentPinCode] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [permanentPinCode, setPermanentPinCode] = useState("");

  // Last school / attempt information
  const [lastSchoolBoard, setLastSchoolBoard] = useState("");
  const [lastSchoolName, setLastSchoolName] = useState("");
  const [lastSchoolAddress, setLastSchoolAddress] = useState("");

  useEffect(() => {
    if (!open) return;
    setAdmissionId(editing?.admissionId ?? "");
    setRollNo(editing?.rollNo ?? "");
    setClassId(editing?.classId ?? (classes[0]?.id ?? ""));
    setSectionId(editing?.sectionId ?? "");
    setGuardianPhone(editing?.guardianPhone ?? "");

    setFirstName(editing?.firstName ?? "");
    setMiddleName(editing?.middleName ?? "");
    setLastName(editing?.lastName ?? "");
    setNickName(editing?.nickName ?? "");
    setGender(editing?.gender ?? "");
    setDob(editing?.dob ?? "");
    setPlaceOfBirth(editing?.placeOfBirth ?? "");
    setReligion(editing?.religion ?? "");
    setCaste(editing?.caste ?? "");
    setCategory(editing?.category ?? "");
    setNationality(editing?.nationality ?? "");

    setMedicalCondition(editing?.medicalCondition ?? "");
    setMedicalDescription(editing?.medicalDescription ?? "");

    setFatherName(editing?.fatherName ?? "");
    setMotherName(editing?.motherName ?? "");
    setMobileNo(editing?.mobileNo ?? "");
    setAltMobileNo(editing?.altMobileNo ?? "");
    setEmailId(editing?.emailId ?? "");

    setCurrentAddress(editing?.currentAddress ?? "");
    setCurrentPinCode(editing?.currentPinCode ?? "");
    setPermanentAddress(editing?.permanentAddress ?? "");
    setPermanentPinCode(editing?.permanentPinCode ?? "");

    setLastSchoolBoard(editing?.lastSchoolBoard ?? "");
    setLastSchoolName(editing?.lastSchoolName ?? "");
    setLastSchoolAddress(editing?.lastSchoolAddress ?? "");
  }, [open, editing, classes]);

  const filteredSections = useMemo(
    () => sections.filter((sec) => (classId ? sec.classId === classId : true)),
    [sections, classId]
  );

  useEffect(() => {
    if (!open) return;
    if (sectionId && filteredSections.some((x) => x.id === sectionId)) return;
    setSectionId(filteredSections[0]?.id ?? "");
  }, [filteredSections, open, sectionId]);

  const drawerTitle = editing ? "Student Registration (Edit)" : "Student Registration";
  const fullName = [firstName, middleName, lastName].map((x) => x.trim()).filter(Boolean).join(" ");
  const displayName = (fullName || nickName || editing?.name || "").trim();

  return (
    <SlideOver open={open} title={drawerTitle} onClose={onClose} closeOnOverlayClick={false}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-900">Student</div>
          <div className="text-sm text-gray-600">
            {displayName ? (
              <>
                Editing: <span className="font-semibold text-gray-900">{displayName}</span>
              </>
            ) : (
              "Enter details below to create a new student."
            )}
          </div>
        </div>

        <SectionFieldset title="Personal Info.">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">First</div>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Middle</div>
              <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Last</div>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <Field label="Nick Name">
            <Input value={nickName} onChange={(e) => setNickName(e.target.value)} />
          </Field>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Gender">
              <Select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </Field>

            <Field label="D.O.B">
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Place of Birth">
              <Input value={placeOfBirth} onChange={(e) => setPlaceOfBirth(e.target.value)} />
            </Field>
            <Field label="Religion">
              <Input value={religion} onChange={(e) => setReligion(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Field label="Caste">
              <Input value={caste} onChange={(e) => setCaste(e.target.value)} />
            </Field>
            <Field label="Category">
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </Field>
            <Field label="Nationality">
              <Input value={nationality} onChange={(e) => setNationality(e.target.value)} />
            </Field>
          </div>
        </SectionFieldset>

        <SectionFieldset title="Medical Information">
          <Field label="Any medical/physical condition?">
            <Select value={medicalCondition} onChange={(e) => setMedicalCondition(e.target.value)}>
              <option value="">Select</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </Select>
          </Field>
          <Field label="If Yes, description">
            <textarea
              className="w-full min-h-[90px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
              value={medicalDescription}
              onChange={(e) => setMedicalDescription(e.target.value)}
              placeholder="Brief description"
            />
          </Field>
        </SectionFieldset>

        <SectionFieldset title="Guardian Information">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Father's Name">
              <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
            </Field>
            <Field label="Mother's Name">
              <Input value={motherName} onChange={(e) => setMotherName(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Mobile No.">
              <Input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} />
            </Field>
            <Field label="Alt Mobile No.">
              <Input value={altMobileNo} onChange={(e) => setAltMobileNo(e.target.value)} />
            </Field>
          </div>

          <Field label="Email ID">
            <Input value={emailId} onChange={(e) => setEmailId(e.target.value)} />
          </Field>
        </SectionFieldset>

        <SectionFieldset title="Address">
          <Field label="Current Address">
            <textarea
              className="w-full min-h-[90px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
              value={currentAddress}
              onChange={(e) => setCurrentAddress(e.target.value)}
            />
          </Field>
          <Field label="Pin Code">
            <Input value={currentPinCode} onChange={(e) => setCurrentPinCode(e.target.value)} />
          </Field>

          <Field label="Permanent Address">
            <textarea
              className="w-full min-h-[90px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
            />
          </Field>
          <Field label="Pin Code">
            <Input value={permanentPinCode} onChange={(e) => setPermanentPinCode(e.target.value)} />
          </Field>
        </SectionFieldset>

        <SectionFieldset title="Last School Attempt Information">
          <Field label="Board">
            <Input value={lastSchoolBoard} onChange={(e) => setLastSchoolBoard(e.target.value)} />
          </Field>
          <Field label="School Name">
            <Input value={lastSchoolName} onChange={(e) => setLastSchoolName(e.target.value)} />
          </Field>
          <Field label="School Address">
            <textarea
              className="w-full min-h-[90px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
              value={lastSchoolAddress}
              onChange={(e) => setLastSchoolAddress(e.target.value)}
            />
          </Field>
        </SectionFieldset>

        <SectionFieldset title="Admission / Class">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Admission ID">
              <Input value={admissionId} onChange={(e) => setAdmissionId(e.target.value)} placeholder="(optional)" />
            </Field>
            <Field label="Roll No.">
              <Input value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="01" />
            </Field>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Class">
              <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Section">
              <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                {filteredSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Guardian Phone">
            <Input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="03xx..." />
          </Field>
        </SectionFieldset>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const name = (
                [firstName, middleName, lastName].map((x) => x.trim()).filter(Boolean).join(" ") ||
                nickName.trim() ||
                editing?.name ||
                ""
              ).trim();

              if (!name) return alert("First name (or any name) is required.");
              if (!rollNo.trim()) return alert("Roll no is required.");
              if (!classId) return alert("Class is required.");
              if (!sectionId) return alert("Section is required.");
              if (!guardianPhone.trim()) return alert("Guardian phone is required.");

              onSave({
                name,
                admissionId: admissionId.trim() || undefined,
                rollNo: rollNo.trim(),
                classId,
                sectionId,
                guardianPhone: guardianPhone.trim(),

                firstName: firstName.trim() || undefined,
                middleName: middleName.trim() || undefined,
                lastName: lastName.trim() || undefined,
                nickName: nickName.trim() || undefined,
                gender: gender || undefined,
                dob: dob || undefined,
                placeOfBirth: placeOfBirth.trim() || undefined,
                religion: religion.trim() || undefined,
                caste: caste.trim() || undefined,
                category: category.trim() || undefined,
                nationality: nationality.trim() || undefined,

                medicalCondition: medicalCondition || undefined,
                medicalDescription: medicalDescription.trim() || undefined,

                fatherName: fatherName.trim() || undefined,
                motherName: motherName.trim() || undefined,
                mobileNo: mobileNo.trim() || undefined,
                altMobileNo: altMobileNo.trim() || undefined,
                emailId: emailId.trim() || undefined,

                currentAddress: currentAddress.trim() || undefined,
                currentPinCode: currentPinCode.trim() || undefined,
                permanentAddress: permanentAddress.trim() || undefined,
                permanentPinCode: permanentPinCode.trim() || undefined,

                lastSchoolBoard: lastSchoolBoard.trim() || undefined,
                lastSchoolName: lastSchoolName.trim() || undefined,
                lastSchoolAddress: lastSchoolAddress.trim() || undefined,
              });
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </SlideOver>
  );
}

