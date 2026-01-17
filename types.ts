
export type Language = 'ar' | 'en';

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface SchoolProfile {
  schoolName: string;
  supervisorName: string;
  classes: string;
  qualityOfficer: string;
  managerName: string; // Kept for backward compatibility, can represent General Manager or Principal
  year: string;
  // New Fields
  ministry?: string;
  district?: string;
  branch?: string;
  term?: string;
  branchManager?: string;
  generalManager?: string;
  customFields?: CustomField[];
}

export interface SubstitutionEntry {
  id: string;
  absentTeacher: string;
  replacementTeacher: string;
  period: string;
  class: string;
  date: string;
  paymentStatus: 'pending' | 'paid';
  // Dynamic periods
  [key: string]: any;
}

export interface TeacherFollowUp {
  id: string;
  teacherName: string;
  subjectCode: string;
  className: string;
  attendance: number;
  appearance: number;
  preparation: number;
  supervision_queue: number;
  supervision_rest: number;
  supervision_end: number;
  correction_books: number;
  correction_notebooks: number;
  correction_followup: number;
  teaching_aids: number;
  extra_activities: number;
  radio: number;
  creativity: number;
  zero_period: number;
  violations_score: number;
  violations_notes: string[];
  order?: number;
}

export interface DailyReportContainer {
  id: string;
  dayName: string;
  dateStr: string;
  teachersData: TeacherFollowUp[];
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
}

export interface AppData {
  profile: SchoolProfile;
  substitutions: SubstitutionEntry[];
  dailyReports: DailyReportContainer[];
  violations: any[];
  parentVisits: any[];
  teacherFollowUps: TeacherFollowUp[];
  maxGrades: Record<string, number>;
  studentReports?: StudentReport[];
}
