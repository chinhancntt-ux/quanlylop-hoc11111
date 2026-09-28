export type DayOfWeek = 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type ScheduleStatus = 'ongoing' | 'upcoming' | 'completed' | 'cancelled';

export const PRIMARY_SUBJECTS = [
  'Toán',
  'Tiếng Việt',
  'Tin học',
  'Công nghệ',
  'TN và XH',
  'Đạo đức',
  'Mĩ thuật',
  'Âm nhạc',
  'HĐTN',
  'Tiếng anh',
  'Lịch sử và Địa lí',
] as const;

export type PrimarySubject = (typeof PRIMARY_SUBJECTS)[number];

export interface ScheduleItem {
  id: string;
  classId: string;
  className: string;
  subject: string;
  room: string;
  teacher: string;
  dayOfWeek: DayOfWeek;
  date?: string;
  startTime: string;
  endTime: string;
  color: string;
  status: ScheduleStatus;
  note?: string;
  lessonTopic?: string;
  session?: 'morning' | 'afternoon';
  period?: number; // 1, 2, 3, 4, 5
  isRed?: boolean; // Highlight in red bold as requested in template
  shortCode?: string; // e.g. "TH 3A2", "CN 3A2"
}

export type ClassSessionShift = 'morning' | 'afternoon' | 'full_day' | 'custom';

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  subject?: string;
  grade: string;
  teacher: string;
  room: string;
  maxStudents: number;
  currentStudents: number;
  feePerSession: number;
  status: 'active' | 'archived';
  color: string;
  scheduleSummary: string;
  sessionShift?: ClassSessionShift;
  morningTime?: string;
  afternoonTime?: string;
  scheduleDays?: string;
  description?: string;
  coverImage?: string;
}

export type RankingPeriodMode = 'week' | 'month' | 'semester' | 'all';

export interface StudentPeriodStars {
  week?: Record<string, number>;
  month?: Record<string, number>;
  semester?: {
    hk1?: number;
    hk2?: number;
  };
}

export interface Student {
  id: string;
  code: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  group?: string;
  dob?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  classIds: string[];
  stars: number;
  attendanceRate: number;
  status: 'studying' | 'trial' | 'reserved';
  avatar: string;
  periodStars?: StudentPeriodStars;
}

export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  checkInTime?: string;
}

export interface CriteriaItem {
  id: string;
  title: string;
  points: number; // positive for reward, negative for penalty
  type: 'reward' | 'penalty';
  icon?: string;
}

export interface GiftItem {
  id: string;
  name: string;
  cost: number; // in stars
  icon: string;
  description?: string;
  redeemedCount?: number;
}

export interface GiftRedemptionRecord {
  id: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  cost: number; // in stars
  studentId: string;
  studentName: string;
  studentCode?: string;
  studentAvatar?: string;
  classId?: string;
  className?: string;
  redeemedAt: string; // ISO string
  dateFormatted: string; // e.g. "15/09/2026, 14:30"
  status: 'completed' | 'cancelled';
  note?: string;
}

export interface RewardRecord {
  id: string;
  studentId: string;
  studentName: string;
  type: 'reward' | 'penalty';
  points: number;
  reason: string;
  createdAt: string;
  timestamp?: string;
  date?: string;
  weekNumber?: number;
  month?: number;
  semester?: 1 | 2;
}

export interface ClassroomConfig {
  appName: string;
  className: string;
  departmentName?: string;
  schoolName?: string;
  schoolYear: string;
  teacherName: string;
  teacherTitle: string;
  teacherAvatar: string;
  coverImage: string;
  bannerOverlay?: number;
  slogans: string[];
  soundEnabled: boolean;
  headerCardBg?: string;
  headerCardBgOverlay?: number;
  appWallpaper?: string;
  wallpaperOpacity?: number;
  wallpaperBlur?: number;
}

export interface TeacherInfo {
  id: string;
  name: string;
  subject: string;
  phone: string;
  email: string;
  avatar: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
}

export interface ClassroomGroup {
  id: string;
  name: string;
  color: string;
  leaderStudentId?: string;
  studentIds: string[];
}

export type EvaluationLevel = 'HHT' | 'HT' | 'CHT';

export interface WeeklyEvaluationRecord {
  id: string;
  studentId: string;
  classId: string;
  weekNumber: number; // 1 to 35
  semester: 1 | 2;
  schoolYear: string;
  level: EvaluationLevel;
  note?: string;
  updatedAt: string;
}

export interface StudentYearEvaluation {
  id: string;
  studentId: string;
  classId: string;
  schoolYear: string;
  overrideLevel?: EvaluationLevel;
  finalRemark?: string;
  updatedAt: string;
}

export interface SchoolYearArchive {
  id: string;
  schoolYear: string; // e.g. "2026-2027", "2025-2026", "2027-2028"
  createdAt: string;
  notes?: string;
  studentCount: number;
  classCount: number;
  totalStarsAwarded: number;
  totalRedemptions: number;
  snapshot: {
    config: ClassroomConfig;
    students: Student[];
    classes: ClassItem[];
    criteria: CriteriaItem[];
    gifts: GiftItem[];
    redemptions: GiftRedemptionRecord[];
    rewards: RewardRecord[];
    classroomGroups?: Record<string, ClassroomGroup[]>;
    schedules?: ScheduleItem[];
    weeklyEvaluations?: WeeklyEvaluationRecord[];
    yearEvaluations?: StudentYearEvaluation[];
  };
}

export interface SchoolYearFullBackup {
  version: '3.0' | '2.0';
  type?: 'FULL_SCHOOL_YEAR_BACKUP' | string;
  schoolYear: string;
  schoolName?: string;
  departmentName?: string;
  teacherName?: string;
  exportDate: string;
  summary?: {
    totalClasses: number;
    classNames?: string[];
    totalStudents: number;
    totalSchedules?: number;
    totalCriteria?: number;
    totalGifts?: number;
    totalRedemptions?: number;
    totalActivityLogs?: number;
    totalWeeklyEvaluations?: number;
  };
  config: ClassroomConfig;
  classes: ClassItem[];
  students: Student[];
  schedules?: ScheduleItem[];
  attendance?: Record<string, AttendanceRecord[]>;
  classroomGroups?: Record<string, ClassroomGroup[]>;
  rooms?: RoomInfo[];
  criteria: CriteriaItem[];
  gifts: GiftItem[];
  redemptions: GiftRedemptionRecord[];
  activityLogs: RewardRecord[];
  weeklyEvaluations?: WeeklyEvaluationRecord[];
  yearEvaluations?: StudentYearEvaluation[];
  schoolYearArchives?: SchoolYearArchive[];
  activeClassId?: string;
}

export type ThemePreset = 'rose' | 'amber' | 'emerald' | 'sky' | 'indigo';

export type AppTab =
  | 'overview'
  | 'classes'
  | 'students'
  | 'attendance'
  | 'weekly-reviews'
  | 'criteria'
  | 'lucky-wheel'
  | 'teams'
  | 'groups'
  | 'gifts'
  | 'leaderboard'
  | 'noise-meter'
  | 'timer'
  | 'settings'
  | 'schedule';

