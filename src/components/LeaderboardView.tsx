import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Star,
  Plus,
  Search,
  Sparkles,
  Users,
  TrendingUp,
  Printer,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { Student, RankingPeriodMode } from '../types';
import { HonorBoardPrintModal } from './HonorBoardPrintModal';
import {
  SCHOOL_WEEKS,
  SCHOOL_MONTHS,
  SCHOOL_SEMESTERS,
  getCurrentSchoolWeek,
  getCurrentSchoolSemester,
  getStudentStarsForPeriod,
  getPeriodLabel,
  getHonorBoardTitleForPeriod,
} from '../utils/rankingPeriods';

export const LeaderboardView: React.FC = () => {
  const {
    students,
    classes,
    activeClassId,
    setActiveClassId,
    openRewardModalForStudent,
    playSound,
    showToast,
    activityLogs,
    config,
  } = useApp();

  // Current real-time date anchors
  const now = useMemo(() => new Date(), []);
  const currentWeekNumber = useMemo(() => getCurrentSchoolWeek(now), [now]);
  const currentMonthNumber = useMemo(() => now.getMonth() + 1, [now]);
  const currentSem = useMemo(() => getCurrentSchoolSemester(now), [now]);

  // Period State: Week, Month, Semester, or All
  const [periodMode, setPeriodMode] = useState<RankingPeriodMode>('week');
  const [selectedWeek, setSelectedWeek] = useState<string>(`w${currentWeekNumber}`);
  const [selectedMonth, setSelectedMonth] = useState<string>(`m${currentMonthNumber}`);
  const [selectedSemester, setSelectedSemester] = useState<string>(`hk${currentSem}`);

  const [selectedClassId, setSelectedClassId] = useState<string>(activeClassId || 'all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<'all' | 'diamond' | 'gold' | 'silver' | 'bronze'>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Active key for star lookup
  const activePeriodKey = useMemo(() => {
    if (periodMode === 'week') return selectedWeek;
    if (periodMode === 'month') return selectedMonth;
    if (periodMode === 'semester') return selectedSemester;
    return 'all';
  }, [periodMode, selectedWeek, selectedMonth, selectedSemester]);

  // Human readable label for active period
  const periodLabel = useMemo(() => {
    return getPeriodLabel(periodMode, activePeriodKey);
  }, [periodMode, activePeriodKey]);

  // Compute period stars for each student
  const studentsWithPeriodStars = useMemo(() => {
    return students.map((s) => {
      const displayStars = getStudentStarsForPeriod(s, periodMode, activePeriodKey, activityLogs);
      return {
        ...s,
        displayStars,
      };
    });
  }, [students, periodMode, activePeriodKey, activityLogs]);

  // Dynamic tier thresholds depending on period mode
  const tierThresholds = useMemo(() => {
    if (periodMode === 'week') {
      return { diamond: 10, gold: 7, silver: 4 };
    }
    if (periodMode === 'month') {
      return { diamond: 25, gold: 18, silver: 10 };
    }
    return { diamond: 50, gold: 35, silver: 20 };
  }, [periodMode]);

  // Filter students by class, search query, and tier
  const filtered = useMemo(() => {
    return studentsWithPeriodStars.filter((s) => {
      const matchesClass = selectedClassId === 'all' || s.classIds.includes(selectedClassId);
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesTier = true;
      if (tierFilter === 'diamond') matchesTier = s.displayStars >= tierThresholds.diamond;
      else if (tierFilter === 'gold') matchesTier = s.displayStars >= tierThresholds.gold && s.displayStars < tierThresholds.diamond;
      else if (tierFilter === 'silver') matchesTier = s.displayStars >= tierThresholds.silver && s.displayStars < tierThresholds.gold;
      else if (tierFilter === 'bronze') matchesTier = s.displayStars < tierThresholds.silver;

      return matchesClass && matchesSearch && matchesTier;
    });
  }, [studentsWithPeriodStars, selectedClassId, searchTerm, tierFilter, tierThresholds]);

  // Sort descending by displayStars (period stars), tie-breaker by total stars then Vietnamese alphabet
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (b.displayStars !== a.displayStars) {
        return b.displayStars - a.displayStars;
      }
      if (b.stars !== a.stars) {
        return b.stars - a.stars;
      }
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [filtered]);

  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];
  const maxStars = top1 ? Math.max(top1.displayStars, 1) : 1;

  // Stats calculation for the current period
  const totalPeriodStars = useMemo(() => {
    return filtered.reduce((acc, curr) => acc + curr.displayStars, 0);
  }, [filtered]);

  const avgPeriodStars = useMemo(() => {
    return filtered.length > 0 ? Math.round(totalPeriodStars / filtered.length) : 0;
  }, [filtered, totalPeriodStars]);

  const starAchieversCount = useMemo(() => {
    return filtered.filter((s) => s.displayStars >= tierThresholds.gold).length;
  }, [filtered, tierThresholds]);

  // Confetti celebration trigger
  const handleCelebrate = () => {
    try {
      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // fallback
    }
    playSound('praise');
    showToast(`🎉 Tung hoa chúc mừng các bạn học sinh xuất sắc ${periodLabel.title}!`, 'success');
  };

  // Helper for honorary title relative to active period
  const getHonorTitle = (stars: number, rank: number) => {
    if (rank === 1) return { title: '👑 Quán Quân Sao Sáng', color: 'text-amber-800 bg-amber-100 border-amber-300' };
    if (rank === 2) return { title: '🥈 Á Quân Gương Mẫu', color: 'text-slate-800 bg-slate-100 border-slate-300' };
    if (rank === 3) return { title: '🥉 Hạng Ba Tiến Bộ', color: 'text-amber-900 bg-amber-50 border-amber-200' };
    if (stars >= tierThresholds.diamond) return { title: '💎 Chiến Binh Kim Cương', color: 'text-cyan-800 bg-cyan-50 border-cyan-200' };
    if (stars >= tierThresholds.gold) return { title: '🥇 Búp Măng Ưu Tú', color: 'text-yellow-800 bg-yellow-50 border-yellow-200' };
    if (stars >= tierThresholds.silver) return { title: '🥈 Chăm Ngoan Học Tốt', color: 'text-blue-800 bg-blue-50 border-blue-200' };
    return { title: '🌱 Mầm Non Tích Cực', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' };
  };

  // Current class name
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes.find((c) => c.id === activeClassId);
  const currentClassName = currentClass?.name || config?.className || 'Lớp Học';

  // Navigation helpers for weeks
  const currentWeekIndex = SCHOOL_WEEKS.findIndex((w) => w.key === selectedWeek);
  const handlePrevWeek = () => {
    if (currentWeekIndex > 0) {
      setSelectedWeek(SCHOOL_WEEKS[currentWeekIndex - 1].key);
    }
  };
  const handleNextWeek = () => {
    if (currentWeekIndex < SCHOOL_WEEKS.length - 1) {
      setSelectedWeek(SCHOOL_WEEKS[currentWeekIndex + 1].key);
    }
  };

  // Prepare students for Honor Board Print modal with their period stars assigned
  const studentsForHonorBoard = useMemo(() => {
    return sorted.map((s) => ({
      ...s,
      stars: s.displayStars, // The print modal displays this stars value
    }));
  }, [sorted]);

  const honorTitles = useMemo(() => {
    return getHonorBoardTitleForPeriod(periodMode, activePeriodKey, config?.schoolYear || '2026-2027');
  }, [periodMode, activePeriodKey, config?.schoolYear]);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 1. Prestige Luxury Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-6 sm:p-7 text-white shadow-xl border border-blue-800/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-black tracking-wider uppercase backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BẢNG VÀNG THI ĐUA HOA SAO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Bảng Xếp Hạng</span>
              <span className="text-amber-400 text-3xl">⭐</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Vinh danh các em học sinh có thành tích xuất sắc theo từng <strong>Tuần</strong>, <strong>Tháng</strong>, <strong>Học kỳ</strong> hoặc <strong>Cả năm học</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={handleCelebrate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-amber-950" />
              <span>Tung Hoa Chúc Mừng</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs border border-white/20 backdrop-blur-xs transition-all cursor-pointer shadow-sm"
              title="Xem trước & In bảng vinh danh danh dự theo kỳ đã chọn"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>In Bảng Danh Dự ({periodLabel.title})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PERIOD SELECTOR TABS & CONTROLS */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        {/* Level 1: Primary Mode Switcher (Week, Month, Semester, All) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <div>
              <span className="text-xs font-black text-slate-900 uppercase tracking-wide">Kỳ Xếp Hạng:</span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">Chọn đợt thi đua tính điểm</span>
            </div>
          </div>

          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl text-xs font-bold gap-1 self-stretch sm:self-auto overflow-x-auto">
            {/* Week Tab */}
            <button
              onClick={() => setPeriodMode('week')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                periodMode === 'week'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Theo Tuần</span>
            </button>

            {/* Month Tab */}
            <button
              onClick={() => setPeriodMode('month')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                periodMode === 'month'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Theo Tháng</span>
            </button>

            {/* Semester Tab */}
            <button
              onClick={() => setPeriodMode('semester')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                periodMode === 'semester'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Theo Học Kỳ</span>
            </button>

            {/* All Year Tab */}
            <button
              onClick={() => setPeriodMode('all')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                periodMode === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Cả Năm Học</span>
            </button>
          </div>
        </div>

        {/* Level 2: Sub-options for the chosen mode */}
        {periodMode === 'week' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevWeek}
                disabled={currentWeekIndex <= 0}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Tuần trước"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>

              <button
                onClick={() => setSelectedWeek(`w${currentWeekNumber}`)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedWeek === `w${currentWeekNumber}`
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
                title="Quay về tuần học hiện tại"
              >
                Tuần Hiện Tại (Tuần {currentWeekNumber})
              </button>

              <button
                onClick={handleNextWeek}
                disabled={currentWeekIndex >= SCHOOL_WEEKS.length - 1}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Tuần tiếp theo"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Quick Pills for Weeks */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {SCHOOL_WEEKS.map((w) => (
                <button
                  key={w.key}
                  onClick={() => setSelectedWeek(w.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedWeek === w.key
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : w.weekNumber === currentWeekNumber
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={`${w.label}: ${w.dateRange}`}
                >
                  {w.label} {w.weekNumber === currentWeekNumber ? '★' : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {periodMode === 'month' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {SCHOOL_MONTHS.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMonth(m.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedMonth === m.key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : m.monthNumber === currentMonthNumber
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {m.label} {m.monthNumber === currentMonthNumber ? '(Hiện tại)' : ''}
              </button>
            ))}
          </div>
        )}

        {periodMode === 'semester' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {SCHOOL_SEMESTERS.map((sem) => (
              <button
                key={sem.key}
                onClick={() => setSelectedSemester(sem.key)}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                  selectedSemester === sem.key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>{sem.label}</span>
                <span className="text-[11px] opacity-80 font-normal">({sem.months})</span>
              </button>
            ))}
          </div>
        )}

        {/* Level 3: Active Period Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            <span className="font-bold text-slate-700">Đang xếp hạng:</span>
            <span className="font-black text-blue-900 px-2.5 py-0.5 rounded-lg bg-white border border-blue-200 shadow-2xs">
              {periodLabel.title}
            </span>
            <span className="text-slate-500 font-medium">({periodLabel.sub})</span>
          </div>

          <div className="flex items-center gap-3 text-slate-600 font-semibold">
            {top1 && (
              <div className="flex items-center gap-1.5">
                <span>Dẫn đầu kỳ này:</span>
                <span className="font-extrabold text-amber-700">{top1.name}</span>
                <span className="font-black text-amber-600">({top1.displayStars} ⭐)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. KEY METRICS SHOWCASE BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Period Total Stars */}
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-500 shrink-0 shadow-2xs">
            <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sao {periodLabel.title}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {totalPeriodStars.toLocaleString()} <span className="text-xs font-bold text-amber-500">⭐</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Top Leader for this period */}
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Crown className="w-6 h-6 text-amber-500" />
          </div>
          <div className="truncate">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Thủ Khoa {periodLabel.title}
            </div>
            <div className="text-sm sm:text-base font-black text-slate-800 truncate">
              {top1 ? top1.name : 'Chưa có'}
            </div>
            {top1 && (
              <div className="text-[11px] font-bold text-amber-600">
                {top1.displayStars} sao (#{top1.code})
              </div>
            )}
          </div>
        </div>

        {/* Metric 3: Average Stars for this period */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm TB Kỳ Này</div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {avgPeriodStars} <span className="text-xs font-bold text-emerald-600">sao/em</span>
            </div>
          </div>
        </div>

        {/* Metric 4: High Achievers in this period */}
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200/70 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs">
            <Trophy className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chiến Binh Tiêu Biểu</div>
            <div className="text-xl sm:text-2xl font-black text-purple-900 tracking-tight">
              {starAchieversCount}{' '}
              <span className="text-xs font-bold text-purple-600">
                em (≥{tierThresholds.gold}⭐)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FILTER & CLASS SELECTION CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Row 1: Class Selection Pills */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700">Xem theo lớp:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => {
                setSelectedClassId('all');
                setActiveClassId('all');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedClassId === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả lớp ({classes.length})
            </button>
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => {
                  setSelectedClassId(cls.id);
                  setActiveClassId(cls.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedClassId === cls.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Search and Tier Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm học sinh theo tên hoặc mã HS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Tier Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setTierFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                tierFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({filtered.length})
            </button>
            <button
              onClick={() => setTierFilter('diamond')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                tierFilter === 'diamond' ? 'bg-white text-cyan-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title={`Từ ${tierThresholds.diamond} sao trở lên trong kỳ này`}
            >
              💎 Kim Cương (≥{tierThresholds.diamond}⭐)
            </button>
            <button
              onClick={() => setTierFilter('gold')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                tierFilter === 'gold' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title={`Từ ${tierThresholds.gold} đến ${tierThresholds.diamond - 1} sao`}
            >
              🥇 Vàng ({tierThresholds.gold}-{tierThresholds.diamond - 1}⭐)
            </button>
            <button
              onClick={() => setTierFilter('silver')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                tierFilter === 'silver' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title={`Từ ${tierThresholds.silver} đến ${tierThresholds.gold - 1} sao`}
            >
              🥈 Bạc ({tierThresholds.silver}-{tierThresholds.gold - 1}⭐)
            </button>
            <button
              onClick={() => setTierFilter('bronze')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                tierFilter === 'bronze' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title={`Dưới ${tierThresholds.silver} sao`}
            >
              🌱 Mầm Non (&lt;{tierThresholds.silver}⭐)
            </button>
          </div>
        </div>
      </div>

      {/* 5. GRAND PODIUM TOP 3 */}
      {sorted.length >= 3 && !searchTerm && tierFilter === 'all' && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-50/50 via-white to-amber-50/30 border border-amber-200/70 p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs uppercase tracking-wider border border-amber-300/60 inline-flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              BỤC VINH QUANG TOP 3 DẪN ĐẦU • {periodLabel.title.toUpperCase()}
            </span>
          </div>

          <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-2xl mx-auto pt-4 pb-2">
            {/* RANK 2: SILVER (Á QUÂN) */}
            {top2 && (
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="relative group cursor-pointer" onClick={() => openRewardModalForStudent(top2)}>
                  <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-slate-200 to-white border-4 border-slate-300 ring-4 ring-slate-200/70 flex items-center justify-center text-3xl sm:text-4xl shadow-md transition-transform group-hover:scale-105">
                    {top2.avatar}
                  </div>
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-gradient-to-r from-slate-400 to-slate-500 text-white text-[10px] font-black rounded-full shadow-xs whitespace-nowrap border border-white">
                    🥈 Á QUÂN
                  </span>
                </div>

                <div className="mt-4 font-black text-xs sm:text-sm text-slate-800 truncate max-w-[130px]">
                  {top2.name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  #{top2.code}
                </div>

                <div className="mt-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-black text-slate-700 flex items-center gap-1 shadow-2xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{top2.displayStars} ⭐</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  (Tổng: {top2.stars} ⭐)
                </div>

                <button
                  onClick={() => openRewardModalForStudent(top2)}
                  className="mt-2 text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thưởng</span>
                </button>

                {/* Silver Pillar */}
                <div className="w-full h-28 bg-gradient-to-t from-slate-300 via-slate-200 to-slate-100 rounded-t-2xl mt-3 flex flex-col items-center justify-center shadow-xs border-t border-slate-300/80">
                  <span className="font-black text-3xl text-slate-500">2</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Hạng Nhì</span>
                </div>
              </div>
            )}

            {/* RANK 1: GOLD (QUÁN QUÂN) - ELEVATED */}
            {top1 && (
              <div className="flex-1 flex flex-col items-center text-center -translate-y-4">
                <Crown className="w-9 h-9 text-amber-500 fill-amber-400 animate-bounce mb-1 drop-shadow-md" />

                <div className="relative group cursor-pointer" onClick={() => openRewardModalForStudent(top1)}>
                  <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-tr from-amber-200 via-amber-100 to-yellow-50 border-4 border-amber-400 ring-6 ring-amber-300/50 flex items-center justify-center text-4xl sm:text-5xl shadow-xl transition-transform group-hover:scale-105">
                    {top1.avatar}
                  </div>
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 text-[11px] font-black rounded-full shadow-md whitespace-nowrap border-2 border-white flex items-center gap-1">
                    👑 QUÁN QUÂN
                  </span>
                </div>

                <div className="mt-5 font-black text-sm sm:text-base text-slate-900 truncate max-w-[150px]">
                  {top1.name}
                </div>
                <div className="text-xs text-amber-600 font-extrabold flex items-center gap-1">
                  <span>#{top1.code}</span>
                  <span>•</span>
                  <span>Thủ khoa {periodLabel.title}</span>
                </div>

                <div className="mt-2 px-3.5 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md">
                  <Star className="w-4 h-4 fill-amber-950 text-amber-950" />
                  <span>{top1.displayStars} ⭐ Điểm</span>
                </div>
                <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                  (Tổng tích lũy: {top1.stars} ⭐)
                </div>

                <button
                  onClick={() => openRewardModalForStudent(top1)}
                  className="mt-2 text-xs text-amber-700 hover:text-amber-900 font-extrabold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thưởng thêm</span>
                </button>

                {/* Gold Pillar */}
                <div className="w-full h-36 bg-gradient-to-t from-amber-400 via-amber-300 to-amber-200 rounded-t-2xl mt-3 flex flex-col items-center justify-center shadow-md border-t-2 border-amber-300">
                  <span className="font-black text-4xl text-amber-700">1</span>
                  <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider">Xuất Sắc Nhất</span>
                </div>
              </div>
            )}

            {/* RANK 3: BRONZE (HẠNG BA) */}
            {top3 && (
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="relative group cursor-pointer" onClick={() => openRewardModalForStudent(top3)}>
                  <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-orange-100 to-white border-4 border-orange-300 ring-4 ring-orange-200/70 flex items-center justify-center text-3xl sm:text-4xl shadow-md transition-transform group-hover:scale-105">
                    {top3.avatar}
                  </div>
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-gradient-to-r from-amber-700 to-orange-700 text-white text-[10px] font-black rounded-full shadow-xs whitespace-nowrap border border-white">
                    🥉 HẠNG BA
                  </span>
                </div>

                <div className="mt-4 font-black text-xs sm:text-sm text-slate-800 truncate max-w-[130px]">
                  {top3.name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  #{top3.code}
                </div>

                <div className="mt-2 px-3 py-1 bg-white border border-orange-200 rounded-full text-xs font-black text-orange-800 flex items-center gap-1 shadow-2xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{top3.displayStars} ⭐</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  (Tổng: {top3.stars} ⭐)
                </div>

                <button
                  onClick={() => openRewardModalForStudent(top3)}
                  className="mt-2 text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thưởng</span>
                </button>

                {/* Bronze Pillar */}
                <div className="w-full h-20 bg-gradient-to-t from-amber-300 via-orange-200 to-orange-100 rounded-t-2xl mt-3 flex flex-col items-center justify-center shadow-xs border-t border-orange-200">
                  <span className="font-black text-2xl text-amber-700">3</span>
                  <span className="text-[10px] font-bold text-amber-800 uppercase">Hạng Ba</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. FULL LEADERBOARD TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-blue-600" />
            <span className="font-extrabold text-sm text-slate-800 uppercase">
              DANH SÁCH THI ĐUA {periodLabel.title} ({sorted.length} HỌC SINH)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Điểm xếp hạng: {periodLabel.title} ({periodLabel.sub})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4 w-16 text-center">HẠNG</th>
                <th className="py-3 px-4">HỌC SINH</th>
                <th className="py-3 px-4 w-52">TIẾN ĐỘ SO VỚI TOP 1</th>
                <th className="py-3 px-4 text-center w-40">SAO {periodLabel.title.toUpperCase()} ⭐</th>
                <th className="py-3 px-4 text-right w-28">KHEN THƯỞNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-sm">Không tìm thấy học sinh nào</p>
                    <p className="text-xs text-slate-400 mt-0.5">Thử chọn lớp khác hoặc xóa bộ lọc tìm kiếm</p>
                  </td>
                </tr>
              ) : (
                sorted.map((student, index) => {
                  const rank = index + 1;
                  const honor = getHonorTitle(student.displayStars, rank);
                  const percentOfMax = Math.round((student.displayStars / maxStars) * 100);

                  let rowBg = 'hover:bg-blue-50/40';
                  let rankBadge = (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black bg-slate-100 text-slate-600">
                      {rank}
                    </span>
                  );

                  if (rank === 1) {
                    rowBg = 'bg-amber-50/30 hover:bg-amber-50/60 font-semibold';
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black bg-gradient-to-tr from-amber-400 to-yellow-400 text-amber-950 shadow-xs ring-2 ring-amber-300">
                        🥇 1
                      </span>
                    );
                  } else if (rank === 2) {
                    rowBg = 'bg-slate-50/50 hover:bg-slate-100/60 font-semibold';
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black bg-gradient-to-tr from-slate-300 to-slate-200 text-slate-800 shadow-xs ring-2 ring-slate-300">
                        🥈 2
                      </span>
                    );
                  } else if (rank === 3) {
                    rowBg = 'bg-orange-50/30 hover:bg-orange-50/60 font-semibold';
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black bg-gradient-to-tr from-orange-300 to-amber-200 text-amber-950 shadow-xs ring-2 ring-orange-200">
                        🥉 3
                      </span>
                    );
                  }

                  return (
                    <tr key={student.id} className={`${rowBg} transition-colors`}>
                      {/* Rank */}
                      <td className="py-3 px-4 text-center">
                        {rankBadge}
                      </td>

                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                            {student.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {student.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                #{student.code}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${honor.color}`}>
                                {honor.title}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Progress to Top 1 */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                            <span>{percentOfMax}%</span>
                            <span>{student.displayStars}/{maxStars}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                rank === 1
                                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                                  : rank <= 3
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                  : 'bg-blue-400'
                              }`}
                              style={{ width: `${percentOfMax}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Stars for this period */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-black rounded-xl shadow-2xs">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                            <span className="text-sm font-black">{student.displayStars}</span>
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            Tổng: {student.stars} ⭐
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openRewardModalForStudent(student)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-xs shadow-emerald-600/20 cursor-pointer"
                          title={`Thưởng điểm sao cho ${student.name}`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Thưởng</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Recent Reward History */}
      {activityLogs && activityLogs.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="font-extrabold text-sm text-slate-800">
              NHẬT KÝ VINH DANH & KHEN THƯỞNG GẦN ĐÂY
            </h3>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {activityLogs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="shrink-0 p-3 rounded-xl bg-slate-50 border border-slate-200/70 max-w-xs flex items-center gap-2.5"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    log.points >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {log.points >= 0 ? `+${log.points}` : log.points}
                </div>
                <div className="truncate">
                  <div className="font-bold text-xs text-slate-800 truncate">
                    {log.studentName}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{log.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Honor Board Print & Preview Modal */}
      <HonorBoardPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        students={studentsForHonorBoard}
        currentClassName={currentClassName}
        departmentName={config?.departmentName || 'UBND XÃ NGUYỄN VIỆT KHÁI'}
        schoolName={config?.schoolName || 'TRƯỜNG TH-THCS RẠCH CHÈO'}
        teacherName={config?.teacherName || 'Thầy Nhân'}
        schoolYear={config?.schoolYear || '2026-2027'}
        periodTitle={honorTitles.title}
        periodSubtitle={honorTitles.subtitle}
      />
    </div>
  );
};