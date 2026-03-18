"use client";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Td, Th } from "@/components/ui/Table";
import type { ClassRoom, Section, SmsDb, Student } from "@/lib/models";
import { getDb, getSelectedSessionId } from "@/lib/storage";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ClassViewPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [db, setDbState] = useState<SmsDb | null>(null);
  const [sessionId, setSessionId] = useState<string>("2025-2026");

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

  const classData = useMemo(() => {
    if (!db || !sessionId) return null;
    return db.sessions[sessionId]?.classes.find(c => c.id === classId);
  }, [db, sessionId, classId]);

  const sections = useMemo(() => {
    if (!db || !sessionId) return [];
    return db.sessions[sessionId]?.sections.filter(s => s.classId === classId) ?? [];
  }, [db, sessionId, classId]);

  const students = useMemo(() => {
    if (!db || !sessionId) return [];
    return db.sessions[sessionId]?.students.filter(s => s.classId === classId) ?? [];
  }, [db, sessionId, classId]);

  const studentsBySection = useMemo(() => {
    const grouped: Record<string, Student[]> = {};
    sections.forEach(section => {
      grouped[section.name] = students.filter(s => s.sectionId === section.id);
    });
    return grouped;
  }, [students, sections]);

  if (!classData) {
    return (
      <AppShell>
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-gray-500">Class not found.</p>
              <Button onClick={() => router.push('/classes')} className="mt-4">
                Back to Classes
              </Button>
            </div>
          </CardBody>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Class Header */}
        <Card>
          <CardHeader
            title={`Class: ${classData.name}`}
            subtitle="Class Overview"
            right={
              <Button variant="secondary" onClick={() => router.push('/classes')}>
                Back to Classes
              </Button>
            }
          />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{sections.length}</div>
                <div className="text-sm text-blue-600">Sections</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{students.length}</div>
                <div className="text-sm text-green-600">Total Students</div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content - 8 columns */}
          <div className="lg:col-span-8 space-y-6">
            {/* Sections */}
            <Card>
              <CardHeader title="Sections" subtitle="All sections in this class" />
              <CardBody>
                {sections.length > 0 ? (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Section Name</Th>
                        <Th>Students Count</Th>
                        <Th>Class Teacher</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {sections.map((section) => (
                        <tr key={section.id} className="hover:bg-gray-50">
                          <Td className="font-medium">Section {section.name}</Td>
                          <Td>{studentsBySection[section.name]?.length || 0} students</Td>
                          <Td>
                            {/* For now, showing "Not Assigned" since there's no class teacher relationship */}
                            <span className="text-gray-500">Not Assigned</span>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-gray-500 text-center py-4">No sections found for this class.</p>
                )}
              </CardBody>
            </Card>

            {/* Students by Section */}
            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader
                  title={`Section ${section.name} Students`}
                  subtitle={`${studentsBySection[section.name]?.length || 0} students`}
                />
                <CardBody>
                  {studentsBySection[section.name]?.length > 0 ? (
                    <Table>
                      <thead>
                        <tr>
                          <Th>Roll No</Th>
                          <Th>Name</Th>
                          <Th>Admission ID</Th>
                          <Th>Guardian Phone</Th>
                          <Th>Gender</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsBySection[section.name].map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <Td className="font-medium">{student.rollNo}</Td>
                            <Td>{student.name}</Td>
                            <Td>{student.admissionId || '-'}</Td>
                            <Td>{student.guardianPhone}</Td>
                            <Td>{student.gender || '-'}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No students in this section.</p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Sidebar - 4 columns */}
          <div className="lg:col-span-4">
            {/* Class Information Summary */}
            <Card>
              <CardHeader title="Class Information Summary" />
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Class Name:</span> {classData.name}</div>
                        <div><span className="font-medium">Class ID:</span> {classData.id}</div>
                        <div><span className="font-medium">Total Sections:</span> {sections.length}</div>
                        <div><span className="font-medium">Total Students:</span> {students.length}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Section Distribution</h4>
                      <div className="space-y-1 text-sm">
                        {sections.map(section => (
                          <div key={section.id}>
                            Section {section.name}: {studentsBySection[section.name]?.length || 0} students
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}