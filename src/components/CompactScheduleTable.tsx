import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ScheduleItem, DayOfWeek, PRIMARY_SUBJECTS } from '../types';
import {
  Printer,
  RotateCcw,
  Plus,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  Palette,
  Sparkles,
  BookOpen,
  User,
  MapPin,
  Clock,
  Download
} from 'lucide-react';

interface CellModalState {
  isOpen: boolean;
  session: 'morning' | 'afternoon';
  period: number;
  dayOfWeek: DayOfWeek;
  existingSchedule?: ScheduleItem | null;
}

export const CompactScheduleTable: React.FC = () => {
  const {
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    resetScheduleToTemplate,
    classes,
    config,
    setActiveTab,
    setFilterClassId,
    showToast,
  } = useApp();

  // Cell editing modal
  const [cellModal, setCellModal] = useState<CellModalState>({
    isOpen: false,
    session: 'morning',
    period: 1,
    dayOfWeek: 2,
    existingSchedule: null,
  });

  // Modal input fields
  const [formShortCode, setFormShortCode] = useState<string>('');
  const [formSubject, setFormSubject] = useState<string>('Tin học');
  const [formClassName, setFormClassName] = useState<string>('Lớp 3A2');
  const [formIsRed, setFormIsRed] = useState<boolean>(false);
  const [formRoom, setFormRoom] = useState<string>('Phòng Tin học');

  // Days shown: Monday to Friday (Thứ hai -> Thứ sáu) as in the ministerial school template
  const DAYS: { value: DayOfWeek; label: string }[] = [
    { value: 2, label: 'Thứ hai' },
    { value: 3, label: 'Thứ ba' },
    { value: 4, label: 'Thứ tư' },
    { value: 5, label: 'Thứ năm' },
    { value: 6, label: 'Thứ sáu' },
  ];

  // Helper to find schedule in slot
  const findSchedule = (session: 'morning' | 'afternoon', period: number, dayOfWeek: DayOfWeek): ScheduleItem | undefined => {
    return schedules.find((s) => {
      if (s.dayOfWeek !== dayOfWeek) return false;
      if (s.session && s.period) {
        return s.session === session && s.period === period;
      }
      // Fallback by start time
      const hour = parseInt(s.startTime.split(':')[0], 10);
      const isMorning = hour < 12;
      if (session === 'morning' && !isMorning) return false;
      if (session === 'afternoon' && isMorning) return false;

      if (session === 'morning') {
        if (s.startTime < '08:15') return period === 1;
        if (s.startTime < '09:00') return period === 2;
        if (s.startTime < '10:00') return period === 3;
        return period === 4;
      } else {
        if (s.startTime < '14:30') return period === 1;
        if (s.startTime < '15:20') return period === 2;
        return period === 3;
      }
    });
  };

  // Open modal for slot
  const handleOpenCell = (session: 'morning' | 'afternoon', period: number, dayOfWeek: DayOfWeek) => {
    const item = findSchedule(session, period, dayOfWeek);
    setCellModal({
      isOpen: true,
      session,
      period,
      dayOfWeek,
      existingSchedule: item || null,
    });

    if (item) {
      setFormShortCode(item.shortCode || `${item.subject === 'Tin học' ? 'TH' : item.subject === 'Công nghệ' ? 'CN' : item.subject} ${item.className.replace('Lớp ', '')}`);
      setFormSubject(item.subject);
      setFormClassName(item.className);
      setFormIsRed(!!item.isRed);
      setFormRoom(item.room || 'Phòng Tin học');
    } else {
      // Default new entry
      setFormShortCode('TH 3A2');
      setFormSubject('Tin học');
      setFormClassName('Lớp 3A2');
      setFormIsRed(false);
      setFormRoom('Phòng Tin học');
    }
  };

  // Save slot
  const handleSaveCell = () => {
    const { session, period, dayOfWeek, existingSchedule } = cellModal;

    // Time presets according to session and period
    const defaultTimes: Record<string, { start: string; end: string }> = {
      'morning-1': { start: '07:30', end: '08:10' },
      'morning-2': { start: '08:15', end: '08:55' },
      'morning-3': { start: '09:15', end: '09:55' },
      'morning-4': { start: '10:00', end: '10:40' },
      'afternoon-1': { start: '13:45', end: '14:25' },
      'afternoon-2': { start: '14:30', end: '15:10' },
      'afternoon-3': { start: '15:25', end: '16:05' },
    };

    const timePreset = defaultTimes[`${session}-${period}`] || { start: '07:30', end: '08:10' };

    // Auto-detect class or match class id
    const matchedClass = classes.find((c) =>
      c.name.toLowerCase().includes(formClassName.toLowerCase()) ||
      c.code.toLowerCase() === formClassName.toLowerCase()
    );

    const code = formShortCode.trim();

    if (!code) {
      showToast('Vui lòng nhập mã môn & lớp (ví dụ: TH 3A2)', 'error');
      return;
    }

    if (existingSchedule && updateSchedule) {
      updateSchedule(existingSchedule.id, {
        shortCode: code,
        subject: formSubject,
        className: formClassName,
        classId: matchedClass?.id || existingSchedule.classId,
        isRed: formIsRed,
        color: formIsRed ? '#dc2626' : '#0f172a',
        room: formRoom,
        session,
        period,
      });
    } else if (addSchedule) {
      addSchedule({
        classId: matchedClass?.id || 'cls-1',
        className: formClassName,
        subject: formSubject,
        room: formRoom,
        teacher: config.teacherName || 'Thầy Nhân',
        dayOfWeek,
        startTime: timePreset.start,
        endTime: timePreset.end,
        session,
        period,
        color: formIsRed ? '#dc2626' : '#0f172a',
        isRed: formIsRed,
        shortCode: code,
        status: 'upcoming',
        lessonTopic: `${formSubject} - ${formClassName}`,
      });
    }

    setCellModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Delete current cell schedule
  const handleDeleteCell = () => {
    if (cellModal.existingSchedule && deleteSchedule) {
      deleteSchedule(cellModal.existingSchedule.id);
      setCellModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Quick attendance for class in cell
  const handleQuickAttendance = (classId?: string) => {
    if (classId && setFilterClassId) {
      setFilterClassId(classId);
    }
    setActiveTab('attendance');
  };

  // Quick preset click in modal
  const handleQuickFill = (prefix: 'TH' | 'CN', gradeClass: string, isRed = false) => {
    setFormShortCode(`${prefix} ${gradeClass}`);
    setFormSubject(prefix === 'TH' ? 'Tin học' : 'Công nghệ');
    setFormClassName(`Lớp ${gradeClass}`);
    setFormIsRed(isRed);
  };

  const getDayName = (dayVal: DayOfWeek) => {
    return DAYS.find((d) => d.value === dayVal)?.label || `Thứ ${dayVal}`;
  };

  // Count total periods
  const morningCount = schedules.filter((s) => s.session === 'morning' || parseInt(s.startTime.split(':')[0], 10) < 12).length;
  const afternoonCount = schedules.filter((s) => s.session === 'afternoon' || parseInt(s.startTime.split(':')[0], 10) >= 12).length;

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
            📅
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Thời Khóa Biểu Tinh Gọn</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200">
                Chuẩn Mẫu BGH
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Tổng số: <strong className="text-slate-800 font-bold">{schedules.length} tiết</strong> (Sáng: {morningCount} tiết • Chiều: {afternoonCount} tiết)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (resetScheduleToTemplate) {
                if (confirm('Khôi phục thời khóa biểu về đúng mẫu gốc trong ảnh (18 tiết Tin học & Công nghệ)?')) {
                  resetScheduleToTemplate();
                }
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
            title="Nạp lại 18 tiết mẫu theo đúng ảnh gốc"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>Nạp mẫu theo ảnh</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="In bảng thời khóa biểu ra khổ A4"
          >
            <Printer className="w-4 h-4" />
            <span>In TKB (A4)</span>
          </button>
        </div>
      </div>

      {/* Printable / Display Table Container */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-300 shadow-sm print:p-0 print:border-0 print:shadow-none overflow-x-auto">
        {/* Formal School Header for Print / Display */}
        <div className="mb-4 text-center border-b border-slate-200 pb-3 print:pb-2">
          <div className="flex justify-between items-start text-[11px] uppercase tracking-wider text-slate-600 font-bold mb-1">
            <div className="text-left">
              <div>{config.departmentName || 'UBND XÃ NGUYỄN VIỆT KHÁI'}</div>
              <div className="text-slate-900 font-black">{config.schoolName || 'TRƯỜNG TIỂU HỌC & THCS RẠCH CHÈO'}</div>
            </div>
            <div className="text-right">
              <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="normal-case italic text-[10px] text-slate-500">Độc lập - Tự do - Hạnh phúc</div>
            </div>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-sky-800 uppercase tracking-wide mt-2">
            THỜI KHÓA BIỂU GIẢNG DẠY
          </h1>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">
            Giáo viên: <strong className="text-slate-900">{config.teacherName || 'Thầy Nhân'}</strong> • 
            Bộ môn: <strong className="text-slate-900">Tin học & Công nghệ</strong> • 
            Năm học: <strong className="text-slate-900">{config.schoolYear || '2026-2027'}</strong>
          </p>
        </div>

        {/* Minimalist Grid Table EXACTLY as in the user's uploaded image */}
        <table className="w-full border-collapse border-2 border-slate-800 text-center select-none min-w-[620px]">
          {/* Header row */}
          <thead>
            <tr className="bg-white border-b-2 border-slate-800">
              <th className="border border-slate-800 py-3 px-3 font-bold text-base sm:text-lg text-[#0284c7] w-[90px]">
                Buổi
              </th>
              <th className="border border-slate-800 py-3 px-2 font-bold text-base sm:text-lg text-[#0284c7] w-[65px]">
                Tiết
              </th>
              {DAYS.map((d) => (
                <th
                  key={d.value}
                  className="border border-slate-800 py-3 px-2 font-bold text-base sm:text-lg text-[#0284c7]"
                >
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* ===================== BUỔI SÁNG (4 TIẾT) ===================== */}
            {[1, 2, 3, 4].map((periodNum, pIdx) => (
              <tr key={`morning-${periodNum}`} className="h-14 sm:h-16 hover:bg-sky-50/20 transition-colors">
                {/* Spanning "Sáng" cell on first period */}
                {pIdx === 0 && (
                  <td
                    rowSpan={4}
                    className="border border-slate-800 px-3 py-4 font-bold italic text-lg sm:text-xl text-[#0284c7] align-middle bg-white tracking-wide"
                  >
                    Sáng
                  </td>
                )}

                {/* Period number (Tiết 1, 2, 3, 4) */}
                <td className="border border-slate-800 py-2 px-2 font-bold text-base sm:text-lg text-[#0284c7]">
                  {periodNum}
                </td>

                {/* Day cells (Thứ hai -> Thứ sáu) */}
                {DAYS.map((day) => {
                  const item = findSchedule('morning', periodNum, day.value);
                  const isRed = !!item?.isRed;
                  const displayCode = item?.shortCode || (item ? `${item.subject === 'Tin học' ? 'TH' : item.subject === 'Công nghệ' ? 'CN' : item.subject} ${item.className.replace('Lớp ', '')}` : '');

                  return (
                    <td
                      key={`m-${periodNum}-${day.value}`}
                      onClick={() => handleOpenCell('morning', periodNum, day.value)}
                      className="border border-slate-800 py-2 px-2 align-middle cursor-pointer hover:bg-sky-100/40 relative group transition-colors"
                      title={item ? `${item.subject} - ${item.className} (Bấm để sửa)` : `Sáng Tiết ${periodNum} ${day.label} (Bấm để thêm)`}
                    >
                      {item ? (
                        <div
                          className={`font-bold text-base sm:text-lg tracking-wide ${
                            isRed ? 'text-red-600' : 'text-slate-900'
                          }`}
                        >
                          {displayCode}
                        </div>
                      ) : (
                        <span className="opacity-0 group-hover:opacity-100 text-slate-300 font-bold text-xs transition-opacity print:hidden">
                          +
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* ===================== BUỔI CHIỀU (3 TIẾT) ===================== */}
            {[1, 2, 3].map((periodNum, pIdx) => (
              <tr key={`afternoon-${periodNum}`} className="h-14 sm:h-16 hover:bg-sky-50/20 transition-colors">
                {/* Spanning "Chiều" cell on first period */}
                {pIdx === 0 && (
                  <td
                    rowSpan={3}
                    className="border border-slate-800 px-3 py-4 font-bold italic text-lg sm:text-xl text-[#0284c7] align-middle bg-white tracking-wide"
                  >
                    Chiều
                  </td>
                )}

                {/* Period number (Tiết 1, 2, 3) */}
                <td className="border border-slate-800 py-2 px-2 font-bold text-base sm:text-lg text-[#0284c7]">
                  {periodNum}
                </td>

                {/* Day cells (Thứ hai -> Thứ sáu) */}
                {DAYS.map((day) => {
                  const item = findSchedule('afternoon', periodNum, day.value);
                  const isRed = !!item?.isRed;
                  const displayCode = item?.shortCode || (item ? `${item.subject === 'Tin học' ? 'TH' : item.subject === 'Công nghệ' ? 'CN' : item.subject} ${item.className.replace('Lớp ', '')}` : '');

                  return (
                    <td
                      key={`a-${periodNum}-${day.value}`}
                      onClick={() => handleOpenCell('afternoon', periodNum, day.value)}
                      className="border border-slate-800 py-2 px-2 align-middle cursor-pointer hover:bg-sky-100/40 relative group transition-colors"
                      title={item ? `${item.subject} - ${item.className} (Bấm để sửa)` : `Chiều Tiết ${periodNum} ${day.label} (Bấm để thêm)`}
                    >
                      {item ? (
                        <div
                          className={`font-bold text-base sm:text-lg tracking-wide ${
                            isRed ? 'text-red-600' : 'text-slate-900'
                          }`}
                        >
                          {displayCode}
                        </div>
                      ) : (
                        <span className="opacity-0 group-hover:opacity-100 text-slate-300 font-bold text-xs transition-opacity print:hidden">
                          +
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Print Signatures */}
        <div className="hidden print:grid grid-cols-2 gap-8 mt-8 text-center text-xs font-bold text-slate-800">
          <div>
            <p className="uppercase mb-12">DUYỆT CỦA BAN GIÁM HIỆU</p>
            <p className="italic text-slate-500 font-normal">(Ký và ghi rõ họ tên)</p>
          </div>
          <div>
            <p className="mb-1 italic font-normal">Ngày ..... tháng ..... năm 2026</p>
            <p className="uppercase mb-12">GIÁO VIÊN GIẢNG DẠY</p>
            <p className="font-black text-slate-900">{config.teacherName || 'Thầy Nhân'}</p>
          </div>
        </div>
      </div>

      {/* Guide note under table */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80 text-xs text-sky-900 print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-bold">💡 Hướng dẫn:</span>
          <span>Bấm trực tiếp vào bất kỳ ô nào để <strong>chỉnh sửa tiết học, đổi màu chữ Đỏ/Đen</strong> hoặc điểm danh nhanh cho lớp.</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 font-bold text-red-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Chữ đỏ: Tiết đặc thù / nhấn
          </span>
          <span className="flex items-center gap-1 font-bold text-slate-900">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span> Chữ đen: Tiết chuẩn
          </span>
        </div>
      </div>

      {/* MODAL: Edit / Add Period in Slot */}
      {cellModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-sky-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  <span>{cellModal.existingSchedule ? 'Sửa Tiết Học' : 'Thêm Tiết Học Vào Ô'}</span>
                </h3>
                <p className="text-xs text-sky-100 mt-0.5">
                  Buổi: <strong className="text-white">{cellModal.session === 'morning' ? 'Sáng' : 'Chiều'}</strong> • 
                  Tiết: <strong className="text-white">{cellModal.period}</strong> • 
                  {getDayName(cellModal.dayOfWeek)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCellModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-sky-200 hover:text-white hover:bg-sky-500/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Short Code Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã hiển thị trên bảng (Ví dụ: TH 3A2, CN 5A1) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formShortCode}
                  onChange={(e) => setFormShortCode(e.target.value)}
                  placeholder="Ví dụ: TH 3A2 hoặc CN 5A4"
                  className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl font-bold text-slate-900 text-base focus:border-sky-600 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Color Style Picker: Red vs Black */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Màu chữ hiển thị trên thời khóa biểu:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormIsRed(false)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 font-bold text-xs transition-all cursor-pointer ${
                      !formIsRed
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-slate-900 border border-white"></span>
                    <span>Chữ Đen (Chuẩn)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormIsRed(true)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 font-bold text-xs transition-all cursor-pointer ${
                      formIsRed
                        ? 'border-red-600 bg-red-600 text-white shadow-xs'
                        : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-red-600 border border-white"></span>
                    <span>Chữ Đỏ (Nổi bật)</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons for Tin học & Công nghệ */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  Chọn nhanh khối lớp giảng dạy:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['3A1', '3A2', '3A3', '4A1', '4A2', '5A1', '5A2', '5A3', '5A4'].map((clsCode) => (
                    <div key={clsCode} className="inline-flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                      <button
                        type="button"
                        onClick={() => handleQuickFill('TH', clsCode, formIsRed)}
                        className="px-2 py-1 bg-sky-50 text-sky-800 hover:bg-sky-100 font-bold border-r border-slate-200 cursor-pointer"
                        title={`Tin học lớp ${clsCode}`}
                      >
                        TH {clsCode}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('CN', clsCode, formIsRed)}
                        className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold cursor-pointer"
                        title={`Công nghệ lớp ${clsCode}`}
                      >
                        CN {clsCode}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject & Room detail */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Môn học</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="Tin học">Tin học</option>
                    <option value="Công nghệ">Công nghệ</option>
                    <option value="Toán">Toán</option>
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="Tiếng anh">Tiếng anh</option>
                    <option value="HĐTN">HĐTN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Phòng học</label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              {cellModal.existingSchedule ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteCell}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa tiết</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAttendance(cellModal.existingSchedule?.classId)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Điểm danh lớp</span>
                  </button>
                </div>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCellModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveCell}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  {cellModal.existingSchedule ? 'Cập nhật' : 'Lưu tiết học'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
