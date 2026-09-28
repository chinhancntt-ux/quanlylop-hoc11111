import { Student, RewardRecord } from '../types';

export type RankingPeriodMode = 'week' | 'month' | 'semester' | 'all';

export interface RankingPeriodOption {
  id: string;
  label: string;
  shortLabel: string;
  subLabel?: string;
  mode: RankingPeriodMode;
  isCurrent?: boolean;
}

// Vietnamese school year 2026-2027 timeline
export const CURRENT_SCHOOL_YEAR = '2026-2027';

// Calculate week number relative to school year start (approx Sep 1, 2026)
export function getCurrentSchoolWeek(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // If in Sep 2026, day 1-6 is week 1, day 7-13 is week 2, day 14-20 is week 3...
  if (year === 2026 && month === 9) {
    if (day <= 6) return 1;
    if (day <= 13) return 2;
    if (day <= 20) return 3;
    if (day <= 27) return 4;
    return 5;
  }
  
  // General fallback: approximate by week of year or standard formula
  const startDate = new Date(2026, 8, 1); // Sep 1, 2026
  const diffTime = date.getTime() - startDate.getTime();
  if (diffTime < 0) return 1;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(week, 1), 35);
}

export function getCurrentSchoolSemester(date: Date = new Date()): 1 | 2 {
  const month = date.getMonth() + 1;
  // Months 9, 10, 11, 12, 1 belong to Semester 1
  if (month >= 9 || month === 1) return 1;
  // Months 2, 3, 4, 5 belong to Semester 2
  return 2;
}

export interface SchoolWeek {
  id: string;
  key: string;
  weekNum: number;
  weekNumber: number;
  label: string;
  dateRange: string;
  isCurrent: boolean;
}

export interface SchoolMonth {
  id: string;
  key: string;
  monthNum: number;
  monthNumber: number;
  label: string;
  semester: 1 | 2;
  isCurrent: boolean;
}

export interface SchoolSemester {
  id: string;
  key: string;
  semesterNum: 1 | 2;
  label: string;
  timeRange: string;
  months: string;
  isCurrent: boolean;
}

// Generate full 35 standard school weeks for Vietnam school year 2026-2027
function generateSchoolWeeks(): SchoolWeek[] {
  const weeks: SchoolWeek[] = [];
  const baseStart = new Date(2026, 8, 1); // 01/09/2026

  for (let i = 1; i <= 35; i++) {
    const start = new Date(baseStart);
    start.setDate(baseStart.getDate() + (i - 1) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const sDay = String(start.getDate()).padStart(2, '0');
    const sMonth = String(start.getMonth() + 1).padStart(2, '0');
    const eDay = String(end.getDate()).padStart(2, '0');
    const eMonth = String(end.getMonth() + 1).padStart(2, '0');

    const isCurrent = i === 3; // Sep 15, 2026 is week 3
    const dateRange = isCurrent
      ? `${sDay}/${sMonth} - ${eDay}/${eMonth} (Hiện tại)`
      : `${sDay}/${sMonth} - ${eDay}/${eMonth}`;

    weeks.push({
      id: `w${i}`,
      key: `w${i}`,
      weekNum: i,
      weekNumber: i,
      label: `Tuần ${i}`,
      dateRange,
      isCurrent,
    });
  }
  return weeks;
}

export const SCHOOL_WEEKS: SchoolWeek[] = generateSchoolWeeks();

export const SCHOOL_MONTHS: SchoolMonth[] = [
  { id: 'm9', key: 'm9', monthNum: 9, monthNumber: 9, label: 'Tháng 9 (Hiện tại)', semester: 1, isCurrent: true },
  { id: 'm10', key: 'm10', monthNum: 10, monthNumber: 10, label: 'Tháng 10', semester: 1, isCurrent: false },
  { id: 'm11', key: 'm11', monthNum: 11, monthNumber: 11, label: 'Tháng 11', semester: 1, isCurrent: false },
  { id: 'm12', key: 'm12', monthNum: 12, monthNumber: 12, label: 'Tháng 12', semester: 1, isCurrent: false },
  { id: 'm1', key: 'm1', monthNum: 1, monthNumber: 1, label: 'Tháng 1', semester: 1, isCurrent: false },
  { id: 'm2', key: 'm2', monthNum: 2, monthNumber: 2, label: 'Tháng 2', semester: 2, isCurrent: false },
  { id: 'm3', key: 'm3', monthNum: 3, monthNumber: 3, label: 'Tháng 3', semester: 2, isCurrent: false },
  { id: 'm4', key: 'm4', monthNum: 4, monthNumber: 4, label: 'Tháng 4', semester: 2, isCurrent: false },
  { id: 'm5', key: 'm5', monthNum: 5, monthNumber: 5, label: 'Tháng 5', semester: 2, isCurrent: false },
];

export const SCHOOL_SEMESTERS: SchoolSemester[] = [
  {
    id: 'hk1',
    key: 'hk1',
    semesterNum: 1,
    label: 'Học kỳ I',
    timeRange: 'Tháng 9/2026 - Tháng 1/2027 (Hiện tại)',
    months: 'Tháng 9 - Tháng 1',
    isCurrent: true,
  },
  {
    id: 'hk2',
    key: 'hk2',
    semesterNum: 2,
    label: 'Học kỳ II',
    timeRange: 'Tháng 2/2027 - Tháng 5/2027',
    months: 'Tháng 2 - Tháng 5',
    isCurrent: false,
  },
];

/**
 * Returns user-friendly title and subtitle description for any period key
 */
export function getPeriodLabel(mode: RankingPeriodMode, periodKey: string): { title: string; sub: string } {
  if (mode === 'week') {
    const found = SCHOOL_WEEKS.find((w) => w.id === periodKey || w.key === periodKey) || { label: 'Tuần 3', dateRange: '14/09 - 20/09' };
    return {
      title: found.label,
      sub: found.dateRange,
    };
  }
  if (mode === 'month') {
    const found = SCHOOL_MONTHS.find((m) => m.id === periodKey || m.key === periodKey) || { label: 'Tháng 9' };
    return {
      title: found.label.replace(' (Hiện tại)', ''),
      sub: 'Năm học 2026-2027',
    };
  }
  if (mode === 'semester') {
    const found = SCHOOL_SEMESTERS.find((s) => s.id === periodKey || s.key === periodKey) || { label: 'Học kỳ I', timeRange: 'Tháng 9/2026 - Tháng 1/2027' };
    return {
      title: found.label,
      sub: found.timeRange,
    };
  }
  return {
    title: 'Cả Năm Học',
    sub: 'Tổng tích lũy toàn bộ hoa sao',
  };
}

/**
 * Calculates a student's stars for a given period (week, month, semester, or all).
 */
export function getStudentStarsForPeriod(
  student: Student,
  mode: RankingPeriodMode,
  periodKey: string,
  activityLogs: RewardRecord[] = []
): number {
  // If 'all', return student total stars
  if (mode === 'all') {
    return student.stars;
  }

  // 1. Check if student has explicit periodStars defined on the object
  if (student.periodStars) {
    if (mode === 'week' && student.periodStars.week && student.periodStars.week[periodKey] !== undefined) {
      return student.periodStars.week[periodKey];
    }
    if (mode === 'month' && student.periodStars.month && student.periodStars.month[periodKey] !== undefined) {
      return student.periodStars.month[periodKey];
    }
    if (mode === 'semester' && student.periodStars.semester) {
      if (periodKey === 'hk1' && student.periodStars.semester.hk1 !== undefined) {
        return student.periodStars.semester.hk1;
      }
      if (periodKey === 'hk2' && student.periodStars.semester.hk2 !== undefined) {
        return student.periodStars.semester.hk2;
      }
    }
  }

  // 2. Try to calculate from matching activityLogs / reward records
  const studentLogs = activityLogs.filter(
    (log) => log.studentId === student.id
  );

  if (studentLogs.length > 0) {
    const matchingLogs = studentLogs.filter((log) => {
      if (mode === 'week') {
        const weekNum = parseInt(periodKey.replace('w', ''), 10);
        return log.weekNumber === weekNum;
      }
      if (mode === 'month') {
        const monthNum = parseInt(periodKey.replace('m', ''), 10);
        return log.month === monthNum;
      }
      if (mode === 'semester') {
        const semNum = periodKey === 'hk1' ? 1 : 2;
        return log.semester === semNum;
      }
      return true;
    });

    if (matchingLogs.length > 0) {
      const sum = matchingLogs.reduce((acc, log) => acc + log.points, 0);
      return Math.max(0, sum);
    }
  }

  // 3. Fallback heuristic for mock/seeded students so rankings reflect realistic values
  // Since we are currently in Week 3, Month 9, Semester 1:
  if (mode === 'semester') {
    if (periodKey === 'hk1') {
      return student.stars; // currently in semester 1
    }
    return 0; // semester 2 has not started
  }

  if (mode === 'month') {
    if (periodKey === 'm9') {
      return student.stars; // all stars earned so far in Sep
    }
    return 0;
  }

  if (mode === 'week') {
    if (periodKey === 'w3') {
      // Current week 3: roughly 40-70% of total stars or minimum
      return Math.max(0, Math.ceil(student.stars * 0.45));
    }
    if (periodKey === 'w2') {
      return Math.max(0, Math.floor(student.stars * 0.35));
    }
    if (periodKey === 'w1') {
      return Math.max(0, Math.floor(student.stars * 0.2));
    }
    return 0;
  }

  return student.stars;
}

/**
 * Returns user-friendly titles and descriptions for Bảng Vàng Danh Dự based on period
 */
export function getHonorBoardTitleForPeriod(
  mode: RankingPeriodMode,
  periodKey: string,
  schoolYear: string = CURRENT_SCHOOL_YEAR
): { title: string; subtitle: string; periodBadge: string } {
  if (mode === 'week') {
    const found = SCHOOL_WEEKS.find((w) => w.id === periodKey) || { label: 'Tuần 3', dateRange: '14/09 - 20/09' };
    return {
      title: `BẢNG VÀNG DANH DỰ - ${found.label.toUpperCase()}`,
      subtitle: `TUYÊN DƯƠNG HỌC SINH XUẤT SẮC & TIÊU BIỂU (${found.dateRange})`,
      periodBadge: `${found.label} (${found.dateRange})`,
    };
  }

  if (mode === 'month') {
    const found = SCHOOL_MONTHS.find((m) => m.id === periodKey) || { label: 'Tháng 9' };
    const monthName = found.label.replace(' (Hiện tại)', '');
    return {
      title: `BẢNG VÀNG DANH DỰ - ${monthName.toUpperCase()}`,
      subtitle: `TUYÊN DƯƠNG HỌC SINH XUẤT SẮC & TIÊU BIỂU ${monthName.toUpperCase()}/2026`,
      periodBadge: `${monthName} / 2026`,
    };
  }

  if (mode === 'semester') {
    const found = SCHOOL_SEMESTERS.find((s) => s.id === periodKey) || { label: 'Học kỳ I' };
    return {
      title: `BẢNG VÀNG DANH DỰ - ${found.label.toUpperCase()}`,
      subtitle: `TUYÊN DƯƠNG HỌC SINH TIÊU BIỂU ${found.label.toUpperCase()} (NĂM HỌC ${schoolYear})`,
      periodBadge: `${found.label} (${schoolYear})`,
    };
  }

  return {
    title: 'BẢNG VÀNG DANH DỰ',
    subtitle: `TUYÊN DƯƠNG HỌC SINH XUẤT SẮC & TIÊU BIỂU NĂM HỌC ${schoolYear}`,
    periodBadge: `Cả năm (${schoolYear})`,
  };
}
