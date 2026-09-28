import { WeeklyEvaluationRecord, EvaluationLevel, StudentYearEvaluation, Student } from '../types';

export const EVALUATION_LEVEL_CONFIG: Record<
  EvaluationLevel,
  {
    code: EvaluationLevel;
    label: string;
    description: string;
    color: string;
    bgLight: string;
    border: string;
    textBadge: string;
    textColor: string;
    btnClass: string;
    activeClass: string;
    starBonus: number;
    icon: string;
  }
> = {
  HHT: {
    code: 'HHT',
    label: 'Hoàn thành tốt',
    description: 'Nắm vững kiến thức, kỹ năng tốt, tích cực chủ động',
    color: '#059669', // emerald-600
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-200',
    textBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    textColor: 'text-emerald-700',
    btnClass: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black ring-2 ring-emerald-300',
    starBonus: 3,
    icon: '🌟',
  },
  HT: {
    code: 'HT',
    label: 'Hoàn thành',
    description: 'Đạt yêu cầu kiến thức kỹ năng theo chuẩn',
    color: '#0284c7', // sky-600
    bgLight: 'bg-sky-50',
    border: 'border-sky-200',
    textBadge: 'bg-sky-100 text-sky-800 border-sky-300',
    textColor: 'text-sky-700',
    btnClass: 'border-sky-200 text-sky-700 hover:bg-sky-50',
    activeClass: 'bg-sky-600 text-white border-sky-600 shadow-sm font-black ring-2 ring-sky-300',
    starBonus: 1,
    icon: '✅',
  },
  CHT: {
    code: 'CHT',
    label: 'Chưa hoàn thành',
    description: 'Chưa đạt yêu cầu, cần GV và phụ huynh hỗ trợ rèn thêm',
    color: '#e11d48', // rose-600
    bgLight: 'bg-rose-50',
    border: 'border-rose-200',
    textBadge: 'bg-rose-100 text-rose-800 border-rose-300',
    textColor: 'text-rose-700',
    btnClass: 'border-rose-200 text-rose-700 hover:bg-rose-50',
    activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm font-black ring-2 ring-rose-300',
    starBonus: 0,
    icon: '⚠️',
  },
};

export const QUICK_EVALUATION_TAGS: string[] = [
  'Chăm ngoan, tích cực phát biểu',
  'Hoàn thành bài tập xuất sắc',
  'Có nhiều tiến bộ vượt bậc',
  'Ý thức kỷ luật tốt, lễ phép',
  'Biết giúp đỡ bạn bè cùng tiến bộ',
  'Cần tập trung chú ý hơn trong giờ',
  'Cần rèn luyện thêm chữ viết',
  'Cần hoàn thành bài về nhà đúng hạn',
  'Cần chủ động hỏi bài khi chưa hiểu',
];

export interface StudentEvaluationSummary {
  studentId: string;
  studentName: string;
  studentCode: string;
  gender: string;
  evaluatedWeeksCount: number;
  totalPeriodWeeks: number;
  countHHT: number;
  countHT: number;
  countCHT: number;
  pctHHT: number;
  pctHT: number;
  pctCHT: number;
  suggestedLevel: EvaluationLevel;
  overrideLevel?: EvaluationLevel;
  finalLevel: EvaluationLevel;
  finalRemark?: string;
  weeklyMap: Record<number, WeeklyEvaluationRecord>;
}

/**
 * Calculates suggested evaluation level for primary school standards (TT 27/2020)
 */
export function calculateSuggestedLevel(
  countHHT: number,
  countHT: number,
  countCHT: number
): EvaluationLevel {
  const total = countHHT + countHT + countCHT;
  if (total === 0) return 'HT';

  // If having 2 or more CHT weeks (or >= 15% CHT) -> CHT
  if (countCHT >= 2 || (countCHT / total) >= 0.15) {
    return 'CHT';
  }

  // If >= 55% HHT weeks and no CHT -> HHT
  if ((countHHT / total) >= 0.55 && countCHT === 0) {
    return 'HHT';
  }

  // Otherwise -> HT
  return 'HT';
}

/**
 * Computes summary for one student across specified weeks
 */
export function computeStudentEvaluationSummary(
  student: Student,
  allEvaluations: WeeklyEvaluationRecord[],
  yearEvaluations: StudentYearEvaluation[],
  startWeek: number = 1,
  endWeek: number = 35,
  classId?: string
): StudentEvaluationSummary {
  // Filter student's evaluations within week range and optional classId
  const relevantEvals = allEvaluations.filter((ev) => {
    if (ev.studentId !== student.id) return false;
    if (classId && ev.classId !== classId) return false;
    return ev.weekNumber >= startWeek && ev.weekNumber <= endWeek;
  });

  const weeklyMap: Record<number, WeeklyEvaluationRecord> = {};
  let countHHT = 0;
  let countHT = 0;
  let countCHT = 0;

  relevantEvals.forEach((ev) => {
    weeklyMap[ev.weekNumber] = ev;
    if (ev.level === 'HHT') countHHT++;
    else if (ev.level === 'HT') countHT++;
    else if (ev.level === 'CHT') countCHT++;
  });

  const evaluatedWeeksCount = relevantEvals.length;
  const totalPeriodWeeks = Math.max(1, endWeek - startWeek + 1);

  const pctHHT = evaluatedWeeksCount > 0 ? Math.round((countHHT / evaluatedWeeksCount) * 100) : 0;
  const pctHT = evaluatedWeeksCount > 0 ? Math.round((countHT / evaluatedWeeksCount) * 100) : 0;
  const pctCHT = evaluatedWeeksCount > 0 ? Math.round((countCHT / evaluatedWeeksCount) * 100) : 0;

  const suggestedLevel = calculateSuggestedLevel(countHHT, countHT, countCHT);

  // Look for teacher override in yearEvaluations
  const yearRecord = yearEvaluations.find(
    (y) => y.studentId === student.id && (!classId || y.classId === classId)
  );

  const overrideLevel = yearRecord?.overrideLevel;
  const finalLevel = overrideLevel || suggestedLevel;
  const finalRemark = yearRecord?.finalRemark;

  return {
    studentId: student.id,
    studentName: student.name,
    studentCode: student.code,
    gender: student.gender,
    evaluatedWeeksCount,
    totalPeriodWeeks,
    countHHT,
    countHT,
    countCHT,
    pctHHT,
    pctHT,
    pctCHT,
    suggestedLevel,
    overrideLevel,
    finalLevel,
    finalRemark,
    weeklyMap,
  };
}

/**
 * Export summary table to CSV formatted with UTF-8 BOM
 */
export function exportEvaluationsSummaryCSV(
  className: string,
  schoolYear: string,
  teacherName: string,
  summaries: StudentEvaluationSummary[],
  weeksRangeLabel: string
) {
  const headers = [
    'STT,Mã Học Sinh,Họ và Tên,Giới Tính,Số Tuần Đánh Giá,Số Tuần HHT,Số Tuần HT,Số Tuần CHT,Tỉ Lệ HHT %,Đề Xuất Cuối Năm,Kết Quả Chốt,Nhận Xét Đánh Giá\n',
  ];

  const rows = summaries.map((s, idx) => {
    const finalRemarkSafe = (s.finalRemark || '').replace(/"/g, '""');
    return `"${idx + 1}","${s.studentCode}","${s.studentName}","${s.gender}","${s.evaluatedWeeksCount}","${s.countHHT}","${s.countHT}","${s.countCHT}","${s.pctHHT}%","${s.suggestedLevel}","${s.finalLevel}","${finalRemarkSafe}"\n`;
  });

  const content =
    `# BẢNG TỔNG HỢP NHẬN XÉT HỌC SINH - ${className.toUpperCase()}\n` +
    `# Năm học: ${schoolYear} | Giáo viên chủ nhiệm: ${teacherName}\n` +
    `# Giai đoạn: ${weeksRangeLabel}\n` +
    headers.concat(rows).join('');

  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeClass = className.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute(
    'download',
    `Tong_Hop_Nhan_Xet_${safeClass}_Nam_${schoolYear.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
}
