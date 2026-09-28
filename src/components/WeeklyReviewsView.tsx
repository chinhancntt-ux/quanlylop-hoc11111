import React, { useState, useMemo } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  Copy,
  Trash2,
  Edit3,
  Check,
  Sparkles,
  Info,
  Clock,
  School,
  X,
  Plus,
  Star,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EvaluationLevel, Student, WeeklyEvaluationRecord } from '../types';
import {
  EVALUATION_LEVEL_CONFIG,
  QUICK_EVALUATION_TAGS,
  computeStudentEvaluationSummary,
  exportEvaluationsSummaryCSV,
  StudentEvaluationSummary,
} from '../utils/evaluationUtils';
import { SCHOOL_WEEKS, getCurrentSchoolWeek } from '../utils/rankingPeriods';

export const WeeklyReviewsView: React.FC = () => {
  const {
    students,
    classes,
    activeClassId,
    setActiveClassId,
    activeClass,
    config,
    weeklyEvaluations,
    yearEvaluations,
    setWeeklyEvaluation,
    batchSetWeeklyEvaluations,
    copyWeeklyEvaluationsFromPrevious,
    setStudentYearEvaluation,
    deleteWeeklyEvaluation,
    playSound,
    showToast,
  } = useApp();

  // Mode: 'weekly' (đánh giá tuần) | 'summary' (tổng hợp cả năm)
  const [viewMode, setViewMode] = useState<'weekly' | 'summary'>('weekly');

  // Current selected week for evaluation (defaults to current school week, 1 to 35)
  const currentRealWeek = useMemo(() => getCurrentSchoolWeek(), []);
  const [selectedWeek, setSelectedWeek] = useState<number>(() => Math.min(Math.max(currentRealWeek, 1), 35));

  // Search & filter in weekly view
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'HHT' | 'HT' | 'CHT' | 'unevaluated'>('all');

  // Summary view period filter: 'all' (Tuần 1-35) | 'hk1' (Tuần 1-18) | 'hk2' (Tuần 19-35)
  const [summaryPeriod, setSummaryPeriod] = useState<'all' | 'hk1' | 'hk2'>('all');
  const [summaryLevelFilter, setSummaryLevelFilter] = useState<'all' | 'HHT' | 'HT' | 'CHT'>('all');

  // Modal for editing student year remark
  const [editingStudentRemark, setEditingStudentRemark] = useState<Student | null>(null);
  const [modalOverrideLevel, setModalOverrideLevel] = useState<EvaluationLevel | ''>('');
  const [modalRemarkText, setModalRemarkText] = useState<string>('');

  // Printable view modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter students for current class
  const classStudents = useMemo(() => {
    return students.filter(s => s.classIds?.includes(activeClassId));
  }, [students, activeClassId]);

  const targetStudents = classStudents.length > 0 ? classStudents : students;

  // Selected school week metadata
  const currentWeekMeta = useMemo(() => {
    return SCHOOL_WEEKS.find(w => w.weekNumber === selectedWeek) || {
      id: `w${selectedWeek}`,
      key: `w${selectedWeek}`,
      weekNum: selectedWeek,
      weekNumber: selectedWeek,
      label: `Tuần ${selectedWeek}`,
      dateRange: '',
      isCurrent: selectedWeek === currentRealWeek,
    };
  }, [selectedWeek, currentRealWeek]);

  // Map of evaluations for this class & week
  const weekEvaluationsMap = useMemo(() => {
    const map = new Map<string, WeeklyEvaluationRecord>();
    weeklyEvaluations
      .filter(e => e.weekNumber === selectedWeek && (!activeClassId || e.classId === activeClassId))
      .forEach(e => {
        map.set(e.studentId, e);
      });
    return map;
  }, [weeklyEvaluations, selectedWeek, activeClassId]);

  // Statistics for selected week
  const weekStats = useMemo(() => {
    let countHHT = 0;
    let countHT = 0;
    let countCHT = 0;
    let evaluated = 0;

    targetStudents.forEach(stu => {
      const ev = weekEvaluationsMap.get(stu.id);
      if (ev) {
        evaluated++;
        if (ev.level === 'HHT') countHHT++;
        else if (ev.level === 'HT') countHT++;
        else if (ev.level === 'CHT') countCHT++;
      }
    });

    const total = targetStudents.length;
    const unevaluated = Math.max(0, total - evaluated);

    return {
      total,
      evaluated,
      unevaluated,
      countHHT,
      countHT,
      countCHT,
      pctHHT: evaluated > 0 ? Math.round((countHHT / evaluated) * 100) : 0,
      pctHT: evaluated > 0 ? Math.round((countHT / evaluated) * 100) : 0,
      pctCHT: evaluated > 0 ? Math.round((countCHT / evaluated) * 100) : 0,
    };
  }, [targetStudents, weekEvaluationsMap]);

  // Filtered students for weekly list
  const filteredWeeklyStudents = useMemo(() => {
    return targetStudents.filter(stu => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = stu.name.toLowerCase().includes(q);
        const matchCode = stu.code.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }

      const ev = weekEvaluationsMap.get(stu.id);
      if (statusFilter === 'unevaluated') {
        return !ev;
      }
      if (statusFilter !== 'all') {
        return ev?.level === statusFilter;
      }
      return true;
    });
  }, [targetStudents, searchQuery, statusFilter, weekEvaluationsMap]);

  // Summary summaries for all students
  const periodRange = useMemo(() => {
    if (summaryPeriod === 'hk1') return { start: 1, end: 18, label: 'Học kỳ I (Tuần 1 - Tuần 18)' };
    if (summaryPeriod === 'hk2') return { start: 19, end: 35, label: 'Học kỳ II (Tuần 19 - Tuần 35)' };
    return { start: 1, end: 35, label: 'Cả năm học (Tuần 1 - Tuần 35)' };
  }, [summaryPeriod]);

  const studentSummaries = useMemo<StudentEvaluationSummary[]>(() => {
    return targetStudents.map(stu => {
      return computeStudentEvaluationSummary(
        stu,
        weeklyEvaluations,
        yearEvaluations,
        periodRange.start,
        periodRange.end,
        activeClassId
      );
    });
  }, [targetStudents, weeklyEvaluations, yearEvaluations, periodRange, activeClassId]);

  // Class overall summary metrics
  const classSummaryMetrics = useMemo(() => {
    const total = studentSummaries.length;
    let hht = 0;
    let ht = 0;
    let cht = 0;

    studentSummaries.forEach(s => {
      if (s.finalLevel === 'HHT') hht++;
      else if (s.finalLevel === 'HT') ht++;
      else if (s.finalLevel === 'CHT') cht++;
    });

    return {
      total,
      hht,
      ht,
      cht,
      pctHHT: total > 0 ? Math.round((hht / total) * 100) : 0,
      pctHT: total > 0 ? Math.round((ht / total) * 100) : 0,
      pctCHT: total > 0 ? Math.round((cht / total) * 100) : 0,
    };
  }, [studentSummaries]);

  // Filtered student summaries for table
  const filteredSummaries = useMemo(() => {
    return studentSummaries.filter(s => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.studentName.toLowerCase().includes(q);
        const matchCode = s.studentCode.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      if (summaryLevelFilter !== 'all') {
        return s.finalLevel === summaryLevelFilter;
      }
      return true;
    });
  }, [studentSummaries, searchQuery, summaryLevelFilter]);

  // Handlers
  const handleQuickLevelSelect = (studentId: string, level: EvaluationLevel) => {
    const current = weekEvaluationsMap.get(studentId);
    if (current?.level === level) {
      // Toggle off / remove
      deleteWeeklyEvaluation(studentId, selectedWeek, activeClassId);
    } else {
      setWeeklyEvaluation(studentId, selectedWeek, level, current?.note, activeClassId);
    }
  };

  const handleNoteChange = (studentId: string, noteText: string) => {
    const current = weekEvaluationsMap.get(studentId);
    if (current) {
      setWeeklyEvaluation(studentId, selectedWeek, current.level, noteText, activeClassId);
    } else {
      // Default to HT if not set
      setWeeklyEvaluation(studentId, selectedWeek, 'HT', noteText, activeClassId);
    }
  };

  const handleOpenRemarkModal = (student: Student) => {
    const summary = studentSummaries.find(s => s.studentId === student.id);
    setEditingStudentRemark(student);
    setModalOverrideLevel(summary?.overrideLevel || '');
    setModalRemarkText(summary?.finalRemark || '');
  };

  const handleSaveStudentRemark = () => {
    if (!editingStudentRemark) return;
    setStudentYearEvaluation(
      editingStudentRemark.id,
      modalOverrideLevel ? (modalOverrideLevel as EvaluationLevel) : undefined,
      modalRemarkText.trim(),
      activeClassId
    );
    setEditingStudentRemark(null);
  };

  const handleExportCSV = () => {
    exportEvaluationsSummaryCSV(
      activeClass?.name || config.className,
      config.schoolYear || '2026-2027',
      config.teacherName,
      studentSummaries,
      periodRange.label
    );
    playSound('praise');
    showToast('Đã xuất Bảng tổng hợp nhận xét ra tệp Excel CSV!', 'success');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-blue-100 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-50/70 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-sky-50/60 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-black rounded-full flex items-center gap-1.5 border border-indigo-200 shadow-2xs">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                <span>THÔNG TƯ 27/2020/TT-BGDĐT</span>
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                Năm học: {config.schoolYear || '2026-2027'}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full hidden sm:inline">
                GVCN: {config.teacherName}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Sổ Đánh Giá & Nhận Xét Học Sinh</span>
              <span className="text-2xl">📝</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Theo dõi đánh giá thường xuyên từng tuần với 3 mức độ:{' '}
              <strong className="text-emerald-700 font-extrabold">HHT (Hoàn thành tốt)</strong>,{' '}
              <strong className="text-sky-700 font-extrabold">HT (Hoàn thành)</strong>,{' '}
              <strong className="text-rose-700 font-extrabold">CHT (Chưa hoàn thành)</strong> và tổng hợp đánh giá
              cuối năm tự động, trực quan.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shrink-0 self-start md:self-auto shadow-inner">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-white text-indigo-700 shadow-md ring-1 ring-black/5'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-white/60'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Đánh Giá Theo Tuần</span>
            </button>

            <button
              onClick={() => setViewMode('summary')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'summary'
                  ? 'bg-white text-blue-700 shadow-md ring-1 ring-black/5'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-white/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-500" />
              <span>Tổng Hợp Cuối Năm</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>
        </div>

        {/* Quick Class Switcher Toolbar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-700">Lớp đang chọn:</span>
            <span className="font-black text-blue-700">{activeClass?.name || config.className}</span>
            <span className="text-slate-400">({targetStudents.length} học sinh)</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => setActiveClassId(cls.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeClassId === cls.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cls.color || '#3b82f6' }} />
                <span>{cls.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: WEEKLY ASSESSMENT VIEW */}
      {/* ========================================================= */}
      {viewMode === 'weekly' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Week Selector Bar & Batch Actions */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-100 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Week Stepper & Label */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedWeek(prev => Math.max(1, prev - 1))}
                  disabled={selectedWeek <= 1}
                  title="Tuần trước"
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>

                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center font-black shadow-md shadow-indigo-200">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Tuần</span>
                    <span className="text-xl leading-none">{selectedWeek}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">
                        Tuần học số {selectedWeek} / 35
                      </h3>
                      {selectedWeek === currentRealWeek && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full border border-emerald-300">
                          Tuần hiện tại
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {currentWeekMeta.dateRange || `Học kỳ ${selectedWeek <= 18 ? 'I' : 'II'}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedWeek(prev => Math.min(35, prev + 1))}
                  disabled={selectedWeek >= 35}
                  title="Tuần sau"
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>

                {/* Direct Week Quick Jump Select */}
                <select
                  value={selectedWeek}
                  onChange={e => setSelectedWeek(Number(e.target.value))}
                  className="ml-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {SCHOOL_WEEKS.map(w => (
                    <option key={w.weekNumber} value={w.weekNumber}>
                      Tuần {w.weekNumber} {w.weekNumber === currentRealWeek ? '⭐ (Hiện tại)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Right: 1-Click Fast Batch Assignment Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 hidden sm:inline">Gán nhanh cả lớp:</span>

                <button
                  onClick={() => batchSetWeeklyEvaluations(selectedWeek, 'HHT', activeClassId)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  title="Đánh giá tất cả học sinh trong lớp là Hoàn thành tốt"
                >
                  <span>🌟</span>
                  <span>Tất cả HHT</span>
                </button>

                <button
                  onClick={() => batchSetWeeklyEvaluations(selectedWeek, 'HT', activeClassId)}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  title="Đánh giá tất cả học sinh trong lớp là Hoàn thành"
                >
                  <span>✅</span>
                  <span>Tất cả HT</span>
                </button>

                {selectedWeek > 1 && (
                  <button
                    onClick={() => copyWeeklyEvaluationsFromPrevious(selectedWeek, activeClassId)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    title={`Sao chép nhận xét từ Tuần ${selectedWeek - 1} sang Tuần ${selectedWeek}`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Chép từ Tuần {selectedWeek - 1}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Week Progress Bar & Counter Banner */}
            <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white p-3 sm:p-4 rounded-xl border border-blue-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-800">Tiến độ tuần:</span>
                  <span className="font-black text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 shadow-2xs">
                    {weekStats.evaluated} / {weekStats.total} học sinh
                  </span>
                </div>

                <div className="w-32 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${weekStats.total > 0 ? (weekStats.evaluated / weekStats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Counters breakdown */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold flex items-center gap-1 border border-emerald-300">
                  <span>🌟 HHT:</span>
                  <span>{weekStats.countHHT}</span>
                  <span className="opacity-70 text-[10px]">({weekStats.pctHHT}%)</span>
                </span>

                <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 font-extrabold flex items-center gap-1 border border-sky-300">
                  <span>✅ HT:</span>
                  <span>{weekStats.countHT}</span>
                  <span className="opacity-70 text-[10px]">({weekStats.pctHT}%)</span>
                </span>

                <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-extrabold flex items-center gap-1 border border-rose-300">
                  <span>⚠️ CHT:</span>
                  <span>{weekStats.countCHT}</span>
                  <span className="opacity-70 text-[10px]">({weekStats.pctCHT}%)</span>
                </span>

                {weekStats.unevaluated > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold">
                    Chưa nhận xét: {weekStats.unevaluated}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-blue-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm học sinh theo tên hoặc mã HS..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
              <span className="text-xs font-bold text-slate-400 shrink-0">Lọc mức độ:</span>
              {(['all', 'HHT', 'HT', 'CHT', 'unevaluated'] as const).map(flt => (
                <button
                  key={flt}
                  onClick={() => setStatusFilter(flt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    statusFilter === flt
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {flt === 'all' && `Tất cả (${targetStudents.length})`}
                  {flt === 'HHT' && `HHT (${weekStats.countHHT})`}
                  {flt === 'HT' && `HT (${weekStats.countHT})`}
                  {flt === 'CHT' && `CHT (${weekStats.countCHT})`}
                  {flt === 'unevaluated' && `Chưa đánh giá (${weekStats.unevaluated})`}
                </button>
              ))}
            </div>
          </div>

          {/* Student Evaluation List Table */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4 min-w-[200px]">Học Sinh</th>
                    <th className="py-3 px-4 min-w-[230px] text-center">
                      Mức Đánh Giá (Tuần {selectedWeek})
                    </th>
                    <th className="py-3 px-4 min-w-[280px]">Nhận Xét Cụ Thể Trong Tuần</th>
                    <th className="py-3 px-4 w-28 text-center">Tích Lũy</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredWeeklyStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        Không tìm thấy học sinh nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredWeeklyStudents.map((stu, index) => {
                      const currentEval = weekEvaluationsMap.get(stu.id);
                      const currentLevel = currentEval?.level;

                      return (
                        <tr
                          key={stu.id}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                          {/* STT */}
                          <td className="py-3 px-4 text-center font-bold text-slate-400">
                            {index + 1}
                          </td>

                          {/* Student Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shadow-2xs shrink-0">
                                {stu.avatar}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-slate-800 text-sm truncate">
                                  {stu.name}
                                </h4>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  {stu.code} • {stu.gender}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 3 Quick-Click Toggle Buttons: HHT, HT, CHT */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* HHT Button */}
                              <button
                                onClick={() => handleQuickLevelSelect(stu.id, 'HHT')}
                                title="Hoàn thành tốt (Đạt thành tích xuất sắc, chủ động)"
                                className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                  currentLevel === 'HHT'
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 ring-2 ring-emerald-400 scale-105'
                                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 opacity-80 hover:opacity-100'
                                }`}
                              >
                                <span>🌟</span>
                                <span>HHT</span>
                              </button>

                              {/* HT Button */}
                              <button
                                onClick={() => handleQuickLevelSelect(stu.id, 'HT')}
                                title="Hoàn thành (Đạt yêu cầu chuẩn kiến thức, kỹ năng)"
                                className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                  currentLevel === 'HT'
                                    ? 'bg-sky-600 text-white shadow-md shadow-sky-200 ring-2 ring-sky-400 scale-105'
                                    : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/80 opacity-80 hover:opacity-100'
                                }`}
                              >
                                <span>✅</span>
                                <span>HT</span>
                              </button>

                              {/* CHT Button */}
                              <button
                                onClick={() => handleQuickLevelSelect(stu.id, 'CHT')}
                                title="Chưa hoàn thành (Chưa đạt yêu cầu, cần rèn luyện thêm)"
                                className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                  currentLevel === 'CHT'
                                    ? 'bg-rose-600 text-white shadow-md shadow-rose-200 ring-2 ring-rose-400 scale-105'
                                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/80 opacity-80 hover:opacity-100'
                                }`}
                              >
                                <span>⚠️</span>
                                <span>CHT</span>
                              </button>
                            </div>
                          </td>

                          {/* Quick Remark Input with Auto Suggestions */}
                          <td className="py-3 px-4">
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                placeholder="Ghi chú nhận xét cho em..."
                                value={currentEval?.note || ''}
                                onChange={e => handleNoteChange(stu.id, e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 transition-colors"
                              />

                              {/* Quick tags pills */}
                              <div className="flex items-center gap-1 flex-wrap">
                                {QUICK_EVALUATION_TAGS.slice(0, 3).map((tag, tIdx) => (
                                  <button
                                    key={tIdx}
                                    type="button"
                                    onClick={() => handleNoteChange(stu.id, tag)}
                                    className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 font-medium transition-colors"
                                  >
                                    + {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </td>

                          {/* Cumulative Stars */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{stu.stars} ⭐</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: YEAR-END / SEMESTER SYNTHESIS VIEW (TỔNG HỢP) */}
      {/* ========================================================= */}
      {viewMode === 'summary' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Summary Control Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-100 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Period Selectors */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-700">Giai đoạn tổng hợp:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setSummaryPeriod('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      summaryPeriod === 'all'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cả năm học (Tuần 1 - 35)
                  </button>

                  <button
                    onClick={() => setSummaryPeriod('hk1')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      summaryPeriod === 'hk1'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Học kỳ I (Tuần 1 - 18)
                  </button>

                  <button
                    onClick={() => setSummaryPeriod('hk2')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      summaryPeriod === 'hk2'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Học kỳ II (Tuần 19 - 35)
                  </button>
                </div>
              </div>

              {/* Export & Print Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="In báo cáo tổng hợp theo mẫu chuẩn trường tiểu học"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>In Bản Tổng Hợp</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  title="Xuất dữ liệu ra file Excel CSV"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất File Excel</span>
                </button>
              </div>
            </div>

            {/* Overall Class Distribution Banner */}
            <div className="bg-gradient-to-r from-blue-50/60 via-slate-50 to-white p-4 rounded-xl border border-blue-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Sĩ số lớp</div>
                <div className="text-2xl font-black text-slate-800">{classSummaryMetrics.total}</div>
                <div className="text-[10px] text-slate-500 font-medium">học sinh</div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-2xs">
                <div className="text-[11px] font-bold text-emerald-800 uppercase flex items-center justify-center gap-1">
                  <span>🌟 Hoàn thành tốt</span>
                </div>
                <div className="text-2xl font-black text-emerald-700">{classSummaryMetrics.hht}</div>
                <div className="text-[10px] text-emerald-600 font-extrabold">{classSummaryMetrics.pctHHT}% cả lớp</div>
              </div>

              <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 shadow-2xs">
                <div className="text-[11px] font-bold text-sky-800 uppercase flex items-center justify-center gap-1">
                  <span>✅ Hoàn thành</span>
                </div>
                <div className="text-2xl font-black text-sky-700">{classSummaryMetrics.ht}</div>
                <div className="text-[10px] text-sky-600 font-extrabold">{classSummaryMetrics.pctHT}% cả lớp</div>
              </div>

              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 shadow-2xs">
                <div className="text-[11px] font-bold text-rose-800 uppercase flex items-center justify-center gap-1">
                  <span>⚠️ Chưa hoàn thành</span>
                </div>
                <div className="text-2xl font-black text-rose-700">{classSummaryMetrics.cht}</div>
                <div className="text-[10px] text-rose-600 font-extrabold">{classSummaryMetrics.pctCHT}% cả lớp</div>
              </div>
            </div>

            {/* Segmented Percentage Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${classSummaryMetrics.pctHHT}%` }}
                  title={`Hoàn thành tốt: ${classSummaryMetrics.pctHHT}%`}
                />
                <div
                  className="bg-sky-500 h-full transition-all duration-500"
                  style={{ width: `${classSummaryMetrics.pctHT}%` }}
                  title={`Hoàn thành: ${classSummaryMetrics.pctHT}%`}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${classSummaryMetrics.pctCHT}%` }}
                  title={`Chưa hoàn thành: ${classSummaryMetrics.pctCHT}%`}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                <span>0%</span>
                <span>Tỉ lệ xếp loại tổng hợp {periodRange.label}</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Search & Level Filter */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-blue-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm học sinh..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-400 shrink-0">Lọc kết quả:</span>
              {(['all', 'HHT', 'HT', 'CHT'] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSummaryLevelFilter(lvl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    summaryLevelFilter === lvl
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl === 'all' && `Tất cả (${studentSummaries.length})`}
                  {lvl === 'HHT' && `🌟 HHT (${classSummaryMetrics.hht})`}
                  {lvl === 'HT' && `✅ HT (${classSummaryMetrics.ht})`}
                  {lvl === 'CHT' && `⚠️ CHT (${classSummaryMetrics.cht})`}
                </button>
              ))}
            </div>
          </div>

          {/* Comprehensive Summary Table */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">STT</th>
                    <th className="py-3 px-4 min-w-[190px]">Học Sinh</th>
                    <th className="py-3 px-3 text-center w-24">Số Tuần ĐG</th>
                    <th className="py-3 px-3 text-center text-emerald-700 bg-emerald-50/50 w-20">HHT</th>
                    <th className="py-3 px-3 text-center text-sky-700 bg-sky-50/50 w-20">HT</th>
                    <th className="py-3 px-3 text-center text-rose-700 bg-rose-50/50 w-20">CHT</th>
                    <th className="py-3 px-3 text-center w-24">Tỉ lệ HHT</th>
                    <th className="py-3 px-3 text-center min-w-[130px]">Đề Xuất Tự Động</th>
                    <th className="py-3 px-4 min-w-[150px] text-center">Kết Quả Cuối Năm</th>
                    <th className="py-3 px-4 min-w-[200px]">Nhận Xét Tổng Kết</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        Không có dữ liệu phù hợp với điều kiện tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredSummaries.map((s, idx) => {
                      const studentObj = targetStudents.find(st => st.id === s.studentId);
                      const isOverridden = Boolean(s.overrideLevel);

                      return (
                        <tr
                          key={s.studentId}
                          className="hover:bg-blue-50/40 transition-colors"
                        >
                          {/* STT */}
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Student */}
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900 text-sm">
                              {s.studentName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {s.studentCode} • {s.gender}
                            </div>
                          </td>

                          {/* Evaluated weeks count */}
                          <td className="py-3 px-3 text-center font-bold text-slate-600">
                            {s.evaluatedWeeksCount} / {s.totalPeriodWeeks}
                          </td>

                          {/* Count HHT */}
                          <td className="py-3 px-3 text-center font-black text-emerald-700 bg-emerald-50/30">
                            {s.countHHT}
                          </td>

                          {/* Count HT */}
                          <td className="py-3 px-3 text-center font-black text-sky-700 bg-sky-50/30">
                            {s.countHT}
                          </td>

                          {/* Count CHT */}
                          <td className="py-3 px-3 text-center font-black text-rose-700 bg-rose-50/30">
                            {s.countCHT}
                          </td>

                          {/* Percent HHT */}
                          <td className="py-3 px-3 text-center font-bold text-slate-700">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100">
                              {s.pctHHT}%
                            </span>
                          </td>

                          {/* Auto Suggested Rating */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${
                                EVALUATION_LEVEL_CONFIG[s.suggestedLevel].textBadge
                              }`}
                            >
                              <span>{EVALUATION_LEVEL_CONFIG[s.suggestedLevel].icon}</span>
                              <span>{s.suggestedLevel}</span>
                            </span>
                          </td>

                          {/* Teacher Final Rating */}
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <select
                                value={s.overrideLevel || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setStudentYearEvaluation(
                                    s.studentId,
                                    val ? (val as EvaluationLevel) : undefined,
                                    s.finalRemark,
                                    activeClassId
                                  );
                                }}
                                className={`px-2.5 py-1 rounded-xl text-xs font-black border cursor-pointer focus:outline-hidden ${
                                  s.finalLevel === 'HHT'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : s.finalLevel === 'HT'
                                    ? 'bg-sky-100 text-sky-800 border-sky-300'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}
                              >
                                <option value="">Đề xuất ({s.suggestedLevel})</option>
                                <option value="HHT">🌟 HHT (Hoàn thành tốt)</option>
                                <option value="HT">✅ HT (Hoàn thành)</option>
                                <option value="CHT">⚠️ CHT (Chưa hoàn thành)</option>
                              </select>

                              {isOverridden && (
                                <span className="w-2 h-2 rounded-full bg-amber-500" title="GV đã điều chỉnh thủ công" />
                              )}
                            </div>
                          </td>

                          {/* Final Remark & Edit Button */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-slate-600 truncate max-w-[200px]" title={s.finalRemark}>
                                {s.finalRemark || (
                                  <span className="text-slate-400 italic">Chưa ghi nhận xét tổng kết...</span>
                                )}
                              </span>

                              {studentObj && (
                                <button
                                  onClick={() => handleOpenRemarkModal(studentObj)}
                                  title="Chỉnh sửa nhận xét cuối năm"
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT FINAL REMARK FOR A STUDENT */}
      {/* ========================================================= */}
      {editingStudentRemark && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                  {editingStudentRemark.avatar}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {editingStudentRemark.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {editingStudentRemark.code} • Lớp {activeClass?.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingStudentRemark(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Level selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Xếp loại chốt cuối năm:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['HHT', 'HT', 'CHT'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setModalOverrideLevel(lvl)}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      modalOverrideLevel === lvl
                        ? EVALUATION_LEVEL_CONFIG[lvl].activeClass
                        : EVALUATION_LEVEL_CONFIG[lvl].btnClass
                    }`}
                  >
                    <span>{EVALUATION_LEVEL_CONFIG[lvl].icon}</span> {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Remark Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nhận xét tổng kết của Giáo viên chủ nhiệm:
              </label>
              <textarea
                rows={4}
                value={modalRemarkText}
                onChange={e => setModalRemarkText(e.target.value)}
                placeholder="Nhập lời nhận xét chi tiết về quá trình học tập, rèn luyện của học sinh trong năm..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed"
              />

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1 pt-1">
                {[
                  'Chăm ngoan, xuất sắc toàn diện, gương mẫu.',
                  'Hoàn thành tốt các môn học và hoạt động giáo dục.',
                  'Có nhiều tiến bộ vượt bậc so với đầu năm.',
                  'Ý thức kỷ luật tốt, tích cực giúp đỡ bạn bè.',
                  'Cần cố gắng rèn thêm chữ viết và tập trung hơn.',
                ].map((sug, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => setModalRemarkText(prev => (prev ? `${prev} ${sug}` : sug))}
                    className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium rounded-md transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingStudentRemark(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleSaveStudentRemark}
                className="px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
              >
                Lưu Nhận Xét
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PRINT PREVIEW & PRINTABLE FORMAT */}
      {/* ========================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto print:m-0 print:p-0 print:max-w-none print:shadow-none">
            {/* Header controls for screen only */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-base">
                  Bản In Sổ Tổng Hợp Nhận Xét Học Sinh
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In ngay (Print)</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Standard Document Sheet */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 print:border-none print:p-0">
              {/* Document Header */}
              <div className="flex justify-between items-start text-xs text-slate-800">
                <div className="text-center font-bold space-y-0.5">
                  <p>{config.departmentName || 'UBND XÃ NGUYỄN VIỆT KHÁI'}</p>
                  <p className="font-black uppercase">{config.schoolName || 'TRƯỜNG TH-THCS RẠCH CHÈO'}</p>
                  <p className="text-[11px] font-normal text-slate-500">Lớp: {activeClass?.name || config.className}</p>
                </div>

                <div className="text-center font-bold space-y-0.5">
                  <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                  <p className="text-[11px] underline">Độc lập - Tự do - Hạnh phúc</p>
                  <p className="text-[10px] font-normal text-slate-500 italic">
                    Rạch Chèo, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1 pt-2">
                <h2 className="text-lg font-black uppercase text-slate-900">
                  BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ THƯỜNG XUYÊN VÀ CUỐI NĂM
                </h2>
                <p className="text-xs text-slate-600 font-bold">
                  Năm học: {config.schoolYear || '2026-2027'} • {periodRange.label}
                </p>
              </div>

              {/* Roster Table */}
              <table className="w-full text-left text-[11px] border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold text-center border-b border-slate-300">
                    <th className="p-1.5 border border-slate-300 w-8">STT</th>
                    <th className="p-1.5 border border-slate-300 w-16">Mã HS</th>
                    <th className="p-1.5 border border-slate-300 text-left">Họ và tên</th>
                    <th className="p-1.5 border border-slate-300 w-12">Nữ</th>
                    <th className="p-1.5 border border-slate-300 w-14">HHT</th>
                    <th className="p-1.5 border border-slate-300 w-14">HT</th>
                    <th className="p-1.5 border border-slate-300 w-14">CHT</th>
                    <th className="p-1.5 border border-slate-300 w-24">Kết quả cuối</th>
                    <th className="p-1.5 border border-slate-300 text-left">Lời nhận xét của GVCN</th>
                  </tr>
                </thead>
                <tbody>
                  {studentSummaries.map((s, idx) => (
                    <tr key={s.studentId} className="border-b border-slate-200">
                      <td className="p-1.5 border border-slate-300 text-center font-bold">{idx + 1}</td>
                      <td className="p-1.5 border border-slate-300 text-center">{s.studentCode}</td>
                      <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{s.studentName}</td>
                      <td className="p-1.5 border border-slate-300 text-center">{s.gender === 'Nữ' ? 'x' : ''}</td>
                      <td className="p-1.5 border border-slate-300 text-center font-bold">{s.countHHT}</td>
                      <td className="p-1.5 border border-slate-300 text-center font-bold">{s.countHT}</td>
                      <td className="p-1.5 border border-slate-300 text-center font-bold">{s.countCHT}</td>
                      <td className="p-1.5 border border-slate-300 text-center font-black">
                        {s.finalLevel}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-slate-700 italic">
                        {s.finalRemark || (s.finalLevel === 'HHT' ? 'Hoàn thành tốt nhiệm vụ học tập và rèn luyện.' : 'Hoàn thành chương trình lớp học.')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="flex justify-between items-start pt-8 text-xs font-bold text-slate-800">
                <div className="text-center space-y-12">
                  <p className="uppercase">HIỆU TRƯỞNG</p>
                  <p className="italic text-slate-400">(Ký và ghi rõ họ tên)</p>
                </div>

                <div className="text-center space-y-12">
                  <div>
                    <p className="uppercase">GIÁO VIÊN CHỦ NHIỆM</p>
                    <p className="font-normal italic text-slate-500">(Ký và ghi rõ họ tên)</p>
                  </div>
                  <p className="font-extrabold text-slate-900 pt-6">{config.teacherName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
