import type { AcademicSessionId, SmsDb } from "./models";
import { createSeedDb } from "./seed";

const DB_KEY = "sms:db";
const SESSION_KEY = "sms:session";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getDb(): SmsDb {
  if (typeof window === "undefined") {
    return createSeedDb();
  }
  const existing = safeParse<SmsDb>(localStorage.getItem(DB_KEY));
  if (existing?.version === 1) return existing;
  const seeded = createSeedDb();
  localStorage.setItem(DB_KEY, JSON.stringify(seeded));
  localStorage.setItem(SESSION_KEY, seeded.selectedSessionId);
  return seeded;
}

export function setDb(next: SmsDb) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DB_KEY, JSON.stringify(next));
}

export function getSelectedSessionId(db?: SmsDb): AcademicSessionId {
  if (typeof window === "undefined") return (db?.selectedSessionId ?? "2025-2026");
  const fromStorage = localStorage.getItem(SESSION_KEY);
  return fromStorage ?? db?.selectedSessionId ?? "2025-2026";
}

export function setSelectedSessionId(id: AcademicSessionId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, id);
}

export function ensureSession(db: SmsDb, sessionId: AcademicSessionId): SmsDb {
  if (db.sessions[sessionId]) return db;
  return {
    ...db,
    sessions: {
      ...db.sessions,
      [sessionId]: {
        teachers: [],
        classes: [],
        sections: [],
        students: [],
        fees: [],
        exams: [],
      },
    },
  };
}

