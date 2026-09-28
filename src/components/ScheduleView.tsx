import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ScheduleItem, DayOfWeek } from '../types';
import { ScheduleModal } from './ScheduleModal';
import { CompactScheduleTable } from './CompactScheduleTable';
import {
  CalendarDays,
  Plus,
  Filter,
  Search,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Printer,
  CheckCircle2,
  Calendar as CalendarIcon,
  Sparkles,
  Layers,
  BookOpen,
  Edit2,
  Trash2,
  ListFilter,
  SlidersHorizontal,
  Award,
  CheckSquare,
  HeartHandshake,
  Table,
  Sun,
  Sunset
} from 'lucide-react';

const DAYS: { value: DayOfWeek; name: string; short: string }[] = [
  { value: 2, name: 'Thứ Hai', short: 'T2' },
  { value: 3, name: 'Thứ Ba', short: 'T3' },
  { value: 4, name: 'Thứ Tư', short: 'T4' },
  { value: 5, name: 'Thứ Năm', short: 'T5' },
  { value: 6, name: 'Thứ Sáu', short: 'T6' },
  { value: 7, name: 'Thứ Bảy', short: 'T7' },
  { value: 8, name: 'Chủ Nhật', short: 'CN' },
];

export const ScheduleView: React.FC = () => {
  const {
    schedules,
    classes,
    teachers,
    rooms,
    setActiveTab,
    setFilterClassId,
    deleteSchedule,
    profile,
    setIsPersonalizeModalOpen,
    students,
  } = useApp();

  const [viewMode, setViewMode] = useState<'compact' | 'grid' | 'table' | 'agenda' | 'list'>('compact');
  const [showWeekend, setShowWeekend] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(2);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [initialDayForAdd, setInitialDayForAdd] = useState<DayOfWeek>(2);

  // Week offset state (0 = this week, -1 = previous, +1 = next)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Time-of-day personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return {
        text: `Chào buổi sáng, ${profile.teacherName || 'Thầy/Cô'}! ☀️`,
        sub: 'Chúc bạn một ngày giảng dạy tràn ngập niềm vui và năng lượng tích cực.',
      };
    }
    if (hour < 18) {
      return {
        text: `Chào buổi chiều, ${profile.teacherName || 'Thầy/Cô'}! 🌤️`,
        sub: 'Chúc các tiết dạy chiều nay của lớp học thật sôi nổi và nhiều tiến bộ.',
      };
    }
    return {
      text: `Chào buổi tối, ${profile.teacherName || 'Thầy/Cô'}! 🌙`,
      sub: 'Chúc buổi tối học tập ấm áp, tràn đầy cảm hứng cùng các học trò thân yêu.',
    };
  };

  // Compute today's day of week
  const getTodayDayOfWeek = (): DayOfWeek => {
    const day = new Date().getDay();
    return day === 0 ? 8 : ((day + 1) as DayOfWeek);
  };

  const todayDay = getTodayDayOfWeek();
  const todaySchedules = schedules.filter((s) => s.dayOfWeek === todayDay);
  const greeting = getGreeting();

  // Helper to format week date range
  const getWeekRange = (offset: number) => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday + offset * 7);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

    return `${formatDate(monday)} - ${formatDate(sunday)}/${sunday.getFullYear()}`;
  };

  // Filtered schedules
  const filteredSchedules = schedules.filter((s) => {
    if (filterClass !== 'all' && s.classId !== filterClass) return false;
    if (filterTeacher !== 'all' && s.teacher !== filterTeacher) return false;
    if (filterRoom !== 'all' && s.room !== filterRoom) return false;

    if (filterShift !== 'all') {
      const hour = parseInt(s.startTime.split(':')[0], 10);
      if (filterShift === 'morning' && hour >= 12) return false;
      if (filterShift === 'afternoon' && (hour < 12 || hour >= 18)) return false;
      if (filterShift === 'evening' && hour < 18) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        s.className.toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q) ||
        s.teacher.toLowerCase().includes(q) ||
        s.room.toLowerCase().includes(q) ||
        (s.lessonTopic && s.lessonTopic.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Check for room conflicts
  const conflicts = schedules.filter((s1) => {
    return schedules.some((s2) => {
      if (s1.id === s2.id) return false;
      if (s1.dayOfWeek !== s2.dayOfWeek) return false;
      const isOverlap = s1.startTime < s2.endTime && s2.startTime < s1.endTime;
      return isOverlap && (s1.room === s2.room || s1.teacher === s2.teacher);
    });
  });

  const handleOpenAddModal = (day: DayOfWeek = 2) => {
    setEditingSchedule(null);
    setInitialDayForAdd(day);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (schedule: ScheduleItem) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleQuickAttendance = (schedule: ScheduleItem) => {
    setFilterClassId(schedule.classId);
    setActiveTab('attendance');
  };

  const displayDays = showWeekend ? DAYS : DAYS.slice(0, 5);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Sleek Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Thời Khóa Biểu</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                {filteredSchedules.length} tiết
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Tuần: {getWeekRange(weekOffset)}
            </p>
          </div>
        </div>

        {/* Primary actions & week navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Week switcher */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-2.5 py-1 rounded-lg font-bold hover:bg-white text-slate-800 transition-colors cursor-pointer"
            >
              Tuần này
            </button>
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
              title="Tuần kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
            title="In thời khóa biểu"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">In TKB</span>
          </button>

          <button
            onClick={() => handleOpenAddModal(selectedDay)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm tiết học</span>
          </button>
        </div>
      </div>

      {/* Conflict Warning Banner if any */}
      {conflicts.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Cảnh báo trùng lịch:</strong> Phát hiện {conflicts.length} buổi học bị trùng phòng hoặc giáo viên cùng giờ.
            </span>
          </div>
        </div>
      )}

      {/* Clean Quick Filter & View Selector */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Class selector pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          <button
            onClick={() => setFilterClass('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              filterClass === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả lớp ({classes.length})
          </button>
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterClass(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                filterClass === c.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Right side controls: Shift filter, Weekend toggle, and View Mode */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          {/* Shift selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterShift('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterShift === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cả ngày
            </button>
            <button
              onClick={() => setFilterShift('morning')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterShift === 'morning' ? 'bg-white text-amber-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Sáng</span>
            </button>
            <button
              onClick={() => setFilterShift('afternoon')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterShift === 'afternoon' ? 'bg-white text-orange-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sunset className="w-3 h-3 text-orange-500" />
              <span>Chiều</span>
            </button>
          </div>

          {/* Weekend toggle */}
          <button
            onClick={() => setShowWeekend(!showWeekend)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showWeekend
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Bật hoặc ẩn Thứ Bảy và Chủ Nhật"
          >
            {showWeekend ? '✓ Hiện T7 & CN' : '+ Thứ 7 & CN'}
          </button>

          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('compact')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'compact' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Mẫu thời khóa biểu tinh gọn chuẩn trường học"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Mẫu tinh gọn</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Lưới tuần trực quan"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lưới tuần</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Bảng thời khóa biểu truyền thống"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Bảng TKB</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Danh sách"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 0: COMPACT STREAMLINED TABLE (Mẫu tinh gọn chuẩn trường học theo ảnh yêu cầu) */}
      {viewMode === 'compact' && <CompactScheduleTable />}

      {/* VIEW MODE 1: WEEKLY GRID (Chế độ Lưới Tuần) */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div
            className={`grid grid-cols-1 ${
              showWeekend ? 'md:grid-cols-7' : 'md:grid-cols-5'
            } divide-y md:divide-y-0 md:divide-x divide-slate-200`}
          >
            {displayDays.map((day) => {
              const daySchedules = filteredSchedules
                .filter((s) => s.dayOfWeek === day.value)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              return (
                <div key={day.value} className="min-h-[440px] flex flex-col bg-slate-50/40">
                  {/* Day header */}
                  <div className="p-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">{day.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {daySchedules.length} tiết
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenAddModal(day.value)}
                      title={`Thêm tiết vào ${day.name}`}
                      className="p-1 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Day items container */}
                  <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto">
                    {daySchedules.length === 0 ? (
                      <div className="h-36 flex flex-col items-center justify-center text-slate-400 text-center p-3 rounded-xl border border-dashed border-slate-200 bg-white/60">
                        <p className="text-xs font-medium text-slate-400">Không có tiết</p>
                        <button
                          onClick={() => handleOpenAddModal(day.value)}
                          className="mt-1 text-xs text-blue-600 hover:underline font-bold cursor-pointer"
                        >
                          + Thêm tiết
                        </button>
                      </div>
                    ) : (
                      daySchedules.map((schedule) => {
                        const isOngoing = schedule.status === 'ongoing';
                        const isMorning = parseInt(schedule.startTime.split(':')[0], 10) < 12;

                        return (
                          <div
                            key={schedule.id}
                            className={`group relative rounded-xl p-3 border transition-all hover:shadow-md bg-white ${
                              isOngoing
                                ? 'border-amber-400 ring-2 ring-amber-400/30'
                                : 'border-slate-200 hover:border-blue-400'
                            }`}
                            style={{ borderLeftColor: schedule.color || '#2563eb', borderLeftWidth: '4px' }}
                          >
                            {/* Line 1: Subject Name + Ongoing badge */}
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="font-black text-sm text-slate-800 tracking-tight truncate flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: schedule.color || '#2563eb' }}
                                />
                                {schedule.subject}
                              </span>
                              {isOngoing && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 animate-pulse shrink-0">
                                  Đang học
                                </span>
                              )}
                            </div>

                            {/* Line 2: Time & Shift badge (clean dedicated row) */}
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 mb-2 font-mono">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                {schedule.startTime} - {schedule.endTime}
                              </span>
                              <span className="text-[10px] font-sans font-medium text-slate-500">
                                {isMorning ? '☀️ Sáng' : '🌤️ Chiều'}
                              </span>
                            </div>

                            {/* Line 3: Class & Room & Teacher */}
                            <div className="text-[11px] text-slate-600 space-y-0.5 mb-2">
                              {filterClass === 'all' && (
                                <div className="font-bold text-blue-900 truncate">{schedule.className}</div>
                              )}
                              <div className="flex items-center justify-between text-slate-500">
                                <span className="truncate flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  {schedule.room}
                                </span>
                                <span className="truncate flex items-center gap-1 font-medium">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  {schedule.teacher}
                                </span>
                              </div>
                            </div>

                            {/* Line 4: Action footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                              <button
                                onClick={() => handleQuickAttendance(schedule)}
                                className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Điểm danh</span>
                              </button>

                              <div className="flex items-center gap-1 text-slate-400">
                                <button
                                  onClick={() => handleOpenEditModal(schedule)}
                                  className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                  title="Chỉnh sửa tiết học"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Xóa tiết học này khỏi thời khóa biểu?')) {
                                      deleteSchedule(schedule.id);
                                    }
                                  }}
                                  className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="Xóa tiết học"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CLASSIC TIMETABLE TABLE (Bảng TKB Truyền Thống) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-blue-50/70 border-b border-blue-100 text-slate-800">
                  <th className="p-3.5 font-bold uppercase text-[11px] text-blue-900 w-36 border-r border-blue-100">
                    Buổi học
                  </th>
                  {displayDays.map((day) => (
                    <th
                      key={day.value}
                      className="p-3.5 font-extrabold text-sm text-slate-900 border-r last:border-r-0 border-slate-200"
                    >
                      <div className="flex items-center justify-between">
                        <span>{day.name}</span>
                        <button
                          onClick={() => handleOpenAddModal(day.value)}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors cursor-pointer"
                          title={`Thêm tiết vào ${day.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Row 1: BUỔI SÁNG */}
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-3.5 font-bold bg-amber-50/40 border-r border-slate-200 align-top">
                    <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-sm mb-1">
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>BUỔI SÁNG</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 font-medium">07:30 - 11:30</span>
                  </td>
                  {displayDays.map((day) => {
                    const morningSchedules = filteredSchedules.filter((s) => {
                      if (s.dayOfWeek !== day.value) return false;
                      const hour = parseInt(s.startTime.split(':')[0], 10);
                      return hour < 12;
                    });

                    return (
                      <td
                        key={day.value}
                        className="p-2.5 border-r last:border-r-0 border-slate-200 align-top min-w-[150px]"
                      >
                        {morningSchedules.length === 0 ? (
                          <div className="h-20 flex items-center justify-center text-slate-300">
                            <button
                              onClick={() => handleOpenAddModal(day.value)}
                              className="text-[11px] text-slate-400 hover:text-blue-600 font-semibold cursor-pointer"
                            >
                              + Thêm
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {morningSchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all"
                                style={{ borderLeftColor: schedule.color || '#2563eb', borderLeftWidth: '3px' }}
                              >
                                <div className="font-extrabold text-xs text-slate-900 mb-0.5">
                                  {schedule.subject}
                                </div>
                                <div className="text-[11px] font-mono text-amber-800 font-bold mb-1">
                                  {schedule.startTime} - {schedule.endTime}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                                  <span>{schedule.room}</span>
                                  <span>{schedule.teacher}</span>
                                </div>
                                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                  <button
                                    onClick={() => handleQuickAttendance(schedule)}
                                    className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                                  >
                                    Điểm danh
                                  </button>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleOpenEditModal(schedule)}
                                      className="p-0.5 text-slate-400 hover:text-blue-600"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm('Xóa tiết học này?')) deleteSchedule(schedule.id);
                                      }}
                                      className="p-0.5 text-slate-400 hover:text-rose-600"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Row 2: BUỔI CHIỀU */}
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-3.5 font-bold bg-orange-50/40 border-r border-slate-200 align-top">
                    <div className="flex items-center gap-1.5 text-orange-900 font-extrabold text-sm mb-1">
                      <Sunset className="w-4 h-4 text-orange-500 shrink-0" />
                      <span>BUỔI CHIỀU</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 font-medium">13:30 - 17:00</span>
                  </td>
                  {displayDays.map((day) => {
                    const afternoonSchedules = filteredSchedules.filter((s) => {
                      if (s.dayOfWeek !== day.value) return false;
                      const hour = parseInt(s.startTime.split(':')[0], 10);
                      return hour >= 12;
                    });

                    return (
                      <td
                        key={day.value}
                        className="p-2.5 border-r last:border-r-0 border-slate-200 align-top min-w-[150px]"
                      >
                        {afternoonSchedules.length === 0 ? (
                          <div className="h-20 flex items-center justify-center text-slate-300">
                            <button
                              onClick={() => handleOpenAddModal(day.value)}
                              className="text-[11px] text-slate-400 hover:text-blue-600 font-semibold cursor-pointer"
                            >
                              + Thêm
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {afternoonSchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all"
                                style={{ borderLeftColor: schedule.color || '#ea580c', borderLeftWidth: '3px' }}
                              >
                                <div className="font-extrabold text-xs text-slate-900 mb-0.5">
                                  {schedule.subject}
                                </div>
                                <div className="text-[11px] font-mono text-orange-800 font-bold mb-1">
                                  {schedule.startTime} - {schedule.endTime}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                                  <span>{schedule.room}</span>
                                  <span>{schedule.teacher}</span>
                                </div>
                                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                  <button
                                    onClick={() => handleQuickAttendance(schedule)}
                                    className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                                  >
                                    Điểm danh
                                  </button>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleOpenEditModal(schedule)}
                                      className="p-0.5 text-slate-400 hover:text-blue-600"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm('Xóa tiết học này?')) deleteSchedule(schedule.id);
                                      }}
                                      className="p-0.5 text-slate-400 hover:text-rose-600"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: AGENDA BY DAY (Chế độ Theo Ngày) */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {/* Day selection pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {DAYS.map((d) => {
              const count = filteredSchedules.filter((s) => s.dayOfWeek === d.value).length;
              const isSelected = selectedDay === d.value;
              return (
                <button
                  key={d.value}
                  onClick={() => setSelectedDay(d.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{d.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      isSelected ? 'bg-amber-600 text-slate-950' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Schedules for the selected day */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSchedules
              .filter((s) => s.dayOfWeek === selectedDay)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((schedule) => {
                const targetClass = classes.find((c) => c.id === schedule.classId);
                return (
                  <div
                    key={schedule.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
                    style={{ borderTopColor: schedule.color, borderTopWidth: '4px' }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 font-mono font-bold text-amber-900 text-xs flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {schedule.subject}
                          </span>
                          {schedule.status === 'ongoing' && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              ● Đang diễn ra
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base">{schedule.className}</h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(schedule)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Xóa buổi học này?')) deleteSchedule(schedule.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {schedule.lessonTopic && (
                      <div className="mb-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs">
                        <span className="font-bold text-amber-900 block mb-0.5">Nội dung bài học hôm nay:</span>
                        <p className="text-slate-700">{schedule.lessonTopic}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                        <User className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Giáo viên</span>
                          <span className="font-semibold text-slate-800">{schedule.teacher}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Phòng học</span>
                          <span className="font-semibold text-slate-800">{schedule.room}</span>
                        </div>
                      </div>
                    </div>

                    {schedule.note && (
                      <p className="text-xs text-slate-500 italic mb-4">
                        💡 Lưu ý: {schedule.note}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500">
                        Sĩ số lớp: <strong className="text-slate-800">{targetClass?.currentStudents || 0} học sinh</strong>
                      </span>
                      <button
                        onClick={() => handleQuickAttendance(schedule)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Vào điểm danh ca này</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: TABULAR LIST (Chế độ Danh sách) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Thứ</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Lớp học</th>
                  <th className="px-4 py-3">Môn học</th>
                  <th className="px-4 py-3">Giáo viên</th>
                  <th className="px-4 py-3">Phòng học</th>
                  <th className="px-4 py-3">Chuyên đề bài học</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSchedules.map((schedule) => {
                  const dayName = DAYS.find((d) => d.value === schedule.dayOfWeek)?.name || 'T2';
                  return (
                    <tr key={schedule.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{dayName}</td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-700 whitespace-nowrap">
                        {schedule.startTime} - {schedule.endTime}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{schedule.className}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">
                          {schedule.subject}
                        </span>
                      </td>
                      <td className="px-4 py-3">{schedule.teacher}</td>
                      <td className="px-4 py-3">{schedule.room}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {schedule.lessonTopic || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleQuickAttendance(schedule)}
                            className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px]"
                          >
                            Điểm danh
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(schedule)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Xóa buổi học này?')) deleteSchedule(schedule.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scheduleToEdit={editingSchedule}
        initialDay={initialDayForAdd}
      />
    </div>
  );
};
