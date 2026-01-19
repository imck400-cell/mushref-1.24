
export interface TeacherFollowUp {
  id: string;
  teacherName: string;
  subject: string;
  class?: string;
  period?: string;
  week?: string;
  date?: string;
  
  // Evaluation criteria
  appearance?: number;
  preparation?: number;
  objective?: number;
  strategy?: number;
  aids?: number;
  interaction?: number;
  closing?: number;
  evaluation?: number;
  
  // Checkboxes/Status
  homework?: boolean;
  notes?: string;
  recommendations?: string;
  
  // For dashboard calculations
  violations_score: number;
  attendance?: number;
  supervision_queue?: number;
  supervision_rest?: number;
  correction_books?: number;
  correction_notebooks?: number;
  teaching_aids?: number;
  extra_activities?: number;
  _reportDate?: string;
}

export interface SubstitutionEntry {
  id: string;
  absentTeacher: string;
  replacementTeacher: string;
  date: string;
  paymentStatus: string;
  p1: string; p2: string; p3: string; p4: string; p5: string; p6: string; p7: string;
  sig1?: string; sig2?: string; sig3?: string; sig4?: string; sig5?: string; sig6?: string; sig7?: string;
  signature?: string;
  period?: string;
  class?: string;
}

export interface SchoolProfile {
  schoolName: string;
  supervisorName: string;
  year: string;
  ministry?: string;
  district?: string;
  branch?: string;
  term?: string;
  branchManager?: string;
  generalManager?: string;
  customFields?: { id: string; label: string; value: string }[];
}

export interface DailyReportContainer {
  id: string;
  dayName: string;
  dateStr: string;
  teachersData: TeacherFollowUp[];
}

export interface AbsenceRecord {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  section: string;
  date: string;
  dayName: string;
  reason: string;
  contactStatus: string;
  contactType: string;
  respondent: string;
  contactResult: string;
  notes: string;
  previousAbsenceCount: number;
  term?: string;
  tags?: string[];
}

export interface LatenessRecord {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  section: string;
  date: string;
  dayName: string;
  term: string;
  latenessStatus: string;
  reason: string;
  actionTaken: string;
  signaturePledge?: string;
  notes: string;
  previousCount: number;
}

export interface StudentReport {
  id: string;
  name: string;
  gender: string;
  grade: string;
  section: string;
  address: string;
  workOutside: string;
  healthStatus: string;
  healthDetails: string;
  guardianName: string;
  guardianPhones: string[];
  academicReading: string;
  academicWriting: string;
  academicParticipation: string;
  behaviorLevel: string;
  mainNotes: string[];
  otherNotesText: string;
  guardianEducation: string;
  guardianFollowUp: string;
  guardianCooperation: string;
  notes: string;
  createdAt: string;
  isBlacklisted?: boolean;
  isExcellent?: boolean;
  absenceDays?: number;
  isExpectedAbsent?: boolean;
  isLatenessPinned?: boolean;
}

export interface AppData {
  profile: SchoolProfile;
  substitutions: SubstitutionEntry[];
  dailyReports: DailyReportContainer[];
  violations: any[];
  parentVisits: any[];
  teacherFollowUps: TeacherFollowUp[];
  maxGrades: Record<string, number>;
  studentReports: StudentReport[];
  absenceRecords: AbsenceRecord[];
  latenessRecords: LatenessRecord[];
}
