"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SlideOver } from "@/components/ui/SlideOver";
import Paper from "@mui/material/Paper";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import type { ClassRoom, Section, SmsDb, Student } from "@/lib/models";
import { getDb, getSelectedSessionId, setDb } from "@/lib/storage";
import { uid } from "@/lib/utils";
import { DataGrid } from "@mui/x-data-grid/DataGrid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import Typography from "@mui/material/Typography";

const columns: GridColDef<Student>[] = [
  {
    field: "name",
    headerName: "Name",
    width: 200,
    valueGetter: (_value, row) => row?.name ?? "",
    renderCell: (params: GridRenderCellParams<Student>) => (
      <Link
        href={`/students/view?roll=${encodeURIComponent(params.row.rollNo)}&class=${encodeURIComponent(params.row.classId)}&ref=${encodeURIComponent(params.row.sectionId)}`}
        className="text-indigo-700 font-semibold hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {params.row.name}
      </Link>
    ),
  },
  {
    field: "rollNo",
    headerName: "Father / Roll No.",
    width: 180,
    flex: 0,
    // Plain string for sort/filter/export — JSX belongs in renderCell only
    valueGetter: (_value, row) =>
      `${row?.fatherName ?? ""} · ${row?.rollNo ?? ""}`,
    renderCell: (params: GridRenderCellParams<Student>) => {
      const row = params.row;
      return (
        <div className="flex flex-col justify-center py-0.5 leading-tight">
          <Typography variant="body2" component="span">
            {row?.fatherName ?? "Father name not set"}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="span">
            Roll No. {row?.rollNo ?? "—"}
          </Typography>
        </div>
      );
    },
  },

];

export default function StudentsPage() {
  const [db, setDbState] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");
  // top filters
  const [filterGradeId, setFilterGradeId] = useState<string>("");
  const [filterSectionIds, setFilterSectionIds] = useState<string[]>([]);
  const classScrollRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<Student[]>([]);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editing] = useState<Student | null>(null);

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
    [db, sessionId],
  );
  const classes = useMemo(
    () => db?.sessions?.[sessionId]?.classes ?? [],
    [db, sessionId],
  );
  const sections = useMemo(
    () => db?.sessions?.[sessionId]?.sections ?? [],
    [db, sessionId],
  );

  // Default to Grade 8 with 8A selected so 8A–8K show on load (like reference design)
  useEffect(() => {
    if (!db || filterGradeId !== "") return;
    const grade8 = classes.find((c) => c.name === "8");
    if (grade8) {
      setFilterGradeId(grade8.id);
      const grade8Sections = sections.filter(
        (sec) => sec.classId === grade8.id,
      );
      const firstSection = grade8Sections[0];
      if (firstSection) setFilterSectionIds([firstSection.id]);
    }
  }, [db, classes, sections, filterGradeId]);

  const sectionsForGrade = useMemo(
    () =>
      sections.filter((sec) =>
        filterGradeId ? sec.classId === filterGradeId : false,
      ),
    [sections, filterGradeId],
  );

  function toggleSection(id: string) {
    setFilterSectionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function selectAllSectionsForGrade() {
    if (sectionsForGrade.length === 0) return;
    const allIds = sectionsForGrade.map((s) => s.id);
    const allSelected = allIds.every((id) => filterSectionIds.includes(id));
    setFilterSectionIds(allSelected ? [] : allIds);
  }

  function scrollClassRow(dir: -1 | 1) {
    const el = classScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: "smooth" });
  }

  // Clear section selection when user changes grade (not on initial default)
  function onGradeChange(gradeId: string) {
    setFilterGradeId(gradeId);
    setFilterSectionIds([]);
  }

  function upsertStudent(nextStudent: Student) {
    if (!db) return;
    const ss = db.sessions[sessionId];
    const nextStudents = ss.students.some((x) => x.id === nextStudent.id)
      ? ss.students.map((x) => (x.id === nextStudent.id ? nextStudent : x))
      : [nextStudent, ...ss.students];
    const nextDb: SmsDb = {
      ...db,
      sessions: {
        ...db.sessions,
        [sessionId]: { ...ss, students: nextStudents },
      },
    };
    setDb(nextDb);
    setDbState(nextDb);
  }

  const classNameById = useMemo(
    () => new Map(classes.map((c) => [c.id, c.name])),
    [classes],
  );
  const sectionNameById = useMemo(() => {
    return new Map(
      sections.map((sec) => [
        sec.id,
        `${classNameById.get(sec.classId) ?? ""}-${sec.name}`,
      ]),
    );
  }, [sections, classNameById]);

  const resultsFromFilters = useMemo(() => {
    const grade = filterGradeId.trim();
    let out: Student[] = students;
    if (grade) {
      out = out.filter((st) => st.classId === grade);
    }
    if (filterSectionIds.length > 0) {
      const set = new Set(filterSectionIds);
      out = out.filter((st) => set.has(st.sectionId));
    }
    return out;
  }, [students, filterGradeId, filterSectionIds]);

  useEffect(() => {
    setResults(resultsFromFilters);
  }, [resultsFromFilters]);

  const showResults = filterGradeId !== "";

  const filterSummaryTitle = useMemo(() => {
    const g = classes.find((c) => c.id === filterGradeId)?.name ?? "All";
    if (filterSectionIds.length === 0)
      return filterGradeId ? `Grade: ${g}` : "All students";
    const names = filterSectionIds
      .map((id) => sectionNameById.get(id))
      .filter(Boolean)
      .join(", ");
    return names ? `${g}: ${names}` : `Grade: ${g}`;
  }, [classes, filterGradeId, filterSectionIds, sectionNameById]);

  return (
    <AppShell>
      <div className="w-full  space-y-4">
        <Card>
          <CardBody>
            <div className="space-y-4">
              {/* Filter bar: grade dropdown + scrollable class (section) checkboxes */}
              <div className="bg-[#002147] text-white px-4 py-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <div className="flex h-10 shrink-0 items-center">
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select
                      value={filterGradeId}
                      displayEmpty
                      onChange={(e) => onGradeChange(String(e.target.value))}
                      sx={{
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: "#fff",
                        ".MuiSelect-select": {
                          py: 0.5,
                          fontSize: 14,
                          fontWeight: 600,
                        },
                      }}
                      renderValue={(value) => {
                        const v = String(value ?? "");
                        if (!v) return "Select Grade";
                        return (
                          classes.find((c) => c.id === v)?.name ??
                          "Select Grade"
                        );
                      }}
                    >
                      {classes.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <span className="shrink-0 text-sm font-bold leading-none text-white">
                    Select Class
                  </span>
                  {/* Single row: h-10 matches grade dropdown; arrows + scroll + Select All share same height */}
                  <div className="flex h-10 min-w-0 flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <button
                      type="button"
                      aria-label="Scroll classes left"
                      onClick={() => scrollClassRow(-1)}
                      disabled={!filterGradeId || sectionsForGrade.length === 0}
                      className="flex h-10 w-8 shrink-0 items-center justify-center border-r border-gray-200 bg-gray-200 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-300 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-gray-200 disabled:hover:text-gray-700"
                    >
                      ‹
                    </button>
                    <div
                      ref={classScrollRef}
                      tabIndex={-1}
                      className="class-strip-scroll flex h-10 min-h-10 min-w-0 flex-1 touch-pan-y items-center overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                      onWheel={(e) => {
                        if (e.shiftKey) e.preventDefault();
                        if (Math.abs(e.deltaX) > Math.abs(e.deltaY))
                          e.preventDefault();
                      }}
                    >
                      {filterGradeId === "" ? (
                        <span className="flex h-10 items-center px-3 text-sm text-gray-400">
                          Select a grade to see classes
                        </span>
                      ) : sectionsForGrade.length === 0 ? (
                        <span className="flex h-10 items-center px-3 text-sm text-gray-400">
                          No sections for this grade
                        </span>
                      ) : (
                        sectionsForGrade.map((sec, i) => {
                          const cn = classNameById.get(sec.classId) ?? "";
                          const label =
                            cn && sec.name
                              ? `${cn.replace(/\s/g, "")}${sec.name}`
                              : (sectionNameById.get(sec.id) ?? sec.name);
                          const checked = filterSectionIds.includes(sec.id);
                          return (
                            <label
                              key={sec.id}
                              className={[
                                "flex h-10 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-gray-200 px-3 text-sm leading-none",
                                checked ? "text-gray-800" : "text-gray-400",
                                i > 0 ? "border-l" : "",
                              ].join(" ")}
                            >
                              <Checkbox
                                size="small"
                                checked={checked}
                                onChange={() => toggleSection(sec.id)}
                                sx={{
                                  p: 0,
                                  "& .MuiSvgIcon-root": { fontSize: 18 },
                                }}
                              />
                              <span className="font-medium">{label}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label="Scroll classes right"
                      onClick={() => scrollClassRow(1)}
                      disabled={!filterGradeId || sectionsForGrade.length === 0}
                      className="flex h-10 w-8 shrink-0 items-center justify-center border-l border-gray-200 bg-gray-200 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-300 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-gray-200 disabled:hover:text-gray-700"
                    >
                      ›
                    </button>
                 
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {showResults && (
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader
                title={filterSummaryTitle}
                subtitle={`Students: ${results.length}`}
                right={
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search..."
                      className="h-8 w-48 rounded-lg text-sm"
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase();
                        const filtered = students.filter((st) => {
                          if (filterGradeId && st.classId !== filterGradeId)
                            return false;
                          if (
                            filterSectionIds.length > 0 &&
                            !filterSectionIds.includes(st.sectionId)
                          )
                            return false;
                          return (st.name ?? "").toLowerCase().includes(value);
                        });
                        setResults(filtered);
                      }}
                    />
                  </div>
                }
              />

              <Paper
                elevation={0}
                sx={{ height: "calc(100vh - 240px)", width: "100%", p: 2 }}
              >
                <DataGrid
                  rows={results}
                  columns={columns}
                  pageSizeOptions={[5, 10]}
                  sx={{ border: 0 }}
                />
              </Paper>
            </Card>

            {/* Right side reserved for future attendance details; hidden on this screen */}
          </div>
        )}
      </div>

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

function SectionFieldset({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border border-gray-200 bg-white">
      <legend className="ml-4 px-3 text-sm font-semibold text-gray-900">
        {title}
      </legend>
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
    setClassId(editing?.classId ?? classes[0]?.id ?? "");
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
    [sections, classId],
  );

  useEffect(() => {
    if (!open) return;
    if (sectionId && filteredSections.some((x) => x.id === sectionId)) return;
    setSectionId(filteredSections[0]?.id ?? "");
  }, [filteredSections, open, sectionId]);

  const drawerTitle = editing
    ? "Student Registration (Edit)"
    : "Student Registration";
  const fullName = [firstName, middleName, lastName]
    .map((x) => x.trim())
    .filter(Boolean)
    .join(" ");
  const displayName = (fullName || nickName || editing?.name || "").trim();

  return (
    <SlideOver
      open={open}
      title={drawerTitle}
      onClose={onClose}
      closeOnOverlayClick={false}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-900">Student</div>
          <div className="text-sm text-gray-600">
            {displayName ? (
              <>
                Editing:{" "}
                <span className="font-semibold text-gray-900">
                  {displayName}
                </span>
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
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Middle</div>
              <Input
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Last</div>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <Field label="Nick Name">
            <Input
              value={nickName}
              onChange={(e) => setNickName(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Gender">
              <Select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </Field>

            <Field label="D.O.B">
              <Input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Place of Birth">
              <Input
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
              />
            </Field>
            <Field label="Religion">
              <Input
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Field label="Caste">
              <Input value={caste} onChange={(e) => setCaste(e.target.value)} />
            </Field>
            <Field label="Category">
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </Field>
            <Field label="Nationality">
              <Input
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              />
            </Field>
          </div>
        </SectionFieldset>

        <SectionFieldset title="Medical Information">
          <Field label="Any medical/physical condition?">
            <Select
              value={medicalCondition}
              onChange={(e) => setMedicalCondition(e.target.value)}
            >
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
              <Input
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
              />
            </Field>
            <Field label="Mother's Name">
              <Input
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Mobile No.">
              <Input
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
              />
            </Field>
            <Field label="Alt Mobile No.">
              <Input
                value={altMobileNo}
                onChange={(e) => setAltMobileNo(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Email ID">
            <Input
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
            />
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
            <Input
              value={currentPinCode}
              onChange={(e) => setCurrentPinCode(e.target.value)}
            />
          </Field>

          <Field label="Permanent Address">
            <textarea
              className="w-full min-h-[90px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
            />
          </Field>
          <Field label="Pin Code">
            <Input
              value={permanentPinCode}
              onChange={(e) => setPermanentPinCode(e.target.value)}
            />
          </Field>
        </SectionFieldset>

        <SectionFieldset title="Last School Attempt Information">
          <Field label="Board">
            <Input
              value={lastSchoolBoard}
              onChange={(e) => setLastSchoolBoard(e.target.value)}
            />
          </Field>
          <Field label="School Name">
            <Input
              value={lastSchoolName}
              onChange={(e) => setLastSchoolName(e.target.value)}
            />
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
              <Input
                value={admissionId}
                onChange={(e) => setAdmissionId(e.target.value)}
                placeholder="(optional)"
              />
            </Field>
            <Field label="Roll No.">
              <Input
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="01"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Class">
              <Select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Section">
              <Select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
              >
                {filteredSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Guardian Phone">
            <Input
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              placeholder="03xx..."
            />
          </Field>
        </SectionFieldset>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const name = (
                [firstName, middleName, lastName]
                  .map((x) => x.trim())
                  .filter(Boolean)
                  .join(" ") ||
                nickName.trim() ||
                editing?.name ||
                ""
              ).trim();

              if (!name) return alert("First name (or any name) is required.");
              if (!rollNo.trim()) return alert("Roll no is required.");
              if (!classId) return alert("Class is required.");
              if (!sectionId) return alert("Section is required.");
              if (!guardianPhone.trim())
                return alert("Guardian phone is required.");

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
