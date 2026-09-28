import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Check,
  School,
  Plus,
  UserCheck,
  Sparkles,
  Users,
  UserPlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus } from '../types';

export const AttendanceDailyView: React.FC = () => {
  const {
    students,
    attendance,
    saveAttendance,
    getAttendanceForDate,
    classes,
    activeClassId,
    setActiveClassId,
    activeClass,
    setIsAddClassModalOpen,
    updateStudent,
    showToast,
    playSound,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [classFilter, setClassFilter] = useState<string>(activeClassId || 'all');
  const [justMarkedAll, setJustMarkedAll] = useState(false);

  // Synchronize when activeClassId changes externally
  useEffect(() => {
    if (activeClassId && activeClassId !== classFilter) {
      setClassFilter(activeClassId);
    }
  }, [activeClassId]);

  // Filter students by selected class
  const displayStudents = students.filter(stu => {
    if (classFilter === 'all') return true;
    return stu.classIds && stu.classIds.includes(classFilter);
  });

  // Local record state for the selected date
  const [dailyStatus, setDailyStatus] = useState<Record<string, AttendanceStatus>>({});
  const [isSaved, setIsSaved] = useState(false);

  // Check if attendance records exist in storage for the selected date
  const existingRecords = getAttendanceForDate(selectedDate);
  const isDateRecorded = Object.keys(existingRecords).length > 0;

  // Initialize or load from context when date or student list changes
  useEffect(() => {
    const existing = getAttendanceForDate(selectedDate);
    const initial: Record<string, AttendanceStatus> = {};

    students.forEach(stu => {
      // Default to 'present' if not set
      initial[stu.id] = existing[stu.id] || 'present';
    });

    setDailyStatus(initial);
    setIsSaved(Object.keys(existing).length > 0);
  }, [selectedDate, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setDailyStatus(prev => ({
      ...prev,
      [studentId]: status,
    }));
    setIsSaved(false);
  };

  // Mark all currently displayed students as present AND IMMEDIATELY SAVE
  const handleMarkAllPresent = () => {
    if (displayStudents.length === 0) {
      showToast('Lớp học này hiện chưa có học sinh nào để điểm danh!', 'info');
      return;
    }

    const updated: Record<string, AttendanceStatus> = { ...dailyStatus };
    displayStudents.forEach(stu => {
      updated[stu.id] = 'present';
    });
    setDailyStatus(updated);

    // Save ALL records for this date so no students are dropped
    const records = Object.entries(updated).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    saveAttendance(selectedDate, records);
    setIsSaved(true);
    setJustMarkedAll(true);
    playSound('praise');
    setTimeout(() => setJustMarkedAll(false), 3000);

    const currentClass = classes.find(c => c.id === classFilter);
    const scopeName = classFilter === 'all' ? 'toàn bộ các lớp' : `lớp ${currentClass?.name || ''}`;
    showToast(`✅ Đã điểm danh TẤT CẢ ${displayStudents.length} học sinh (${scopeName}) CÓ MẶT và đã lưu thành công!`, 'success');
  };

  const handleSave = () => {
    if (displayStudents.length === 0) {
      showToast('Không có học sinh nào để lưu điểm danh!', 'info');
      return;
    }

    const records = Object.entries(dailyStatus).map(([studentId, status]) => ({
      studentId,
      status,
    }));
    saveAttendance(selectedDate, records);
    setIsSaved(true);
    playSound('praise');
    setTimeout(() => setIsSaved(false), 3000);

    showToast(`Đã lưu kết quả điểm danh ngày ${selectedDate} thành công!`, 'success');
  };

  // Helper to assign all students to current class if empty
  const handleAssignAllToClass = () => {
    if (classFilter === 'all') return;
    students.forEach(stu => {
      const current = stu.classIds || [];
      if (!current.includes(classFilter)) {
        updateStudent(stu.id, { classIds: [...current, classFilter] });
      }
    });
    const cls = classes.find(c => c.id === classFilter);
    showToast(`Đã phân bổ tất cả học sinh vào lớp ${cls?.name || ''}!`, 'success');
  };

  // Count metrics for currently displayed students
  let presentCount = 0;
  let excusedCount = 0;
  let unexcusedCount = 0;
  let lateCount = 0;

  displayStudents.forEach(stu => {
    const status = dailyStatus[stu.id] || 'present';
    if (status === 'present') presentCount++;
    else if (status === 'excused') excusedCount++;
    else if (status === 'unexcused') unexcusedCount++;
    else if (status === 'late') lateCount++;
  });

  const currentClassObj = classes.find(c => c.id === classFilter);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              ĐIỂM DANH HẰNG NGÀY
            </h2>
            {isDateRecorded ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Đã chốt điểm danh
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Chưa chốt điểm danh
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Ghi nhận tình hình hiện diện của học sinh theo từng ngày (
            <strong className="text-slate-700">{displayStudents.length} học sinh</strong>
            {currentClassObj ? ` • ${currentClassObj.name}` : ' • Tất cả lớp'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-hidden cursor-pointer text-slate-800 font-bold"
            />
          </div>

          {/* Primary Action: Điểm danh tất cả có mặt */}
          <button
            id="attendance-mark-all-btn"
            type="button"
            onClick={handleMarkAllPresent}
            disabled={displayStudents.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              justMarkedAll
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-md scale-102'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{justMarkedAll ? '✓ ĐÃ ĐIỂM DANH TẤT CẢ!' : 'TẤT CẢ CÓ MẶT'}</span>
          </button>

          {/* Save Button */}
          <button
            id="attendance-save-btn"
            type="button"
            onClick={handleSave}
            disabled={displayStudents.length === 0}
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
            }`}
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>{isSaved ? 'ĐÃ LƯU!' : 'LƯU ĐIỂM DANH'}</span>
          </button>
        </div>
      </div>

      {/* Class Selector Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-blue-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <School className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700">Điểm danh theo lớp:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              setClassFilter('all');
              setActiveClassId('');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              classFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            Tất cả lớp ({students.length})
          </button>

          {classes.map((cls) => {
            const isSelected = classFilter === cls.id;
            const countInClass = students.filter(s => s.classIds?.includes(cls.id)).length;
            return (
              <button
                key={cls.id}
                onClick={() => {
                  setClassFilter(cls.id);
                  setActiveClassId(cls.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cls.color || '#0284c7' }}
                />
                <span>{cls.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {countInClass}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setIsAddClassModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm lớp</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
        <div className="flex items-center gap-3 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div>
            <div className="text-xs font-bold text-slate-500">Có mặt</div>
            <div className="text-lg font-black text-emerald-700">{presentCount} em</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <div>
            <div className="text-xs font-bold text-slate-500">Có phép</div>
            <div className="text-lg font-black text-amber-700">{excusedCount} em</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-rose-50/70 border border-rose-100 rounded-xl">
          <XCircle className="w-5 h-5 text-rose-600" />
          <div>
            <div className="text-xs font-bold text-slate-500">Không phép</div>
            <div className="text-lg font-black text-rose-700">{unexcusedCount} em</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
          <Clock className="w-5 h-5 text-purple-600" />
          <div>
            <div className="text-xs font-bold text-slate-500">Đi muộn</div>
            <div className="text-lg font-black text-purple-700">{lateCount} em</div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4 w-14 text-center">STT</th>
                <th className="py-3 px-4">HỌ VÀ TÊN</th>
                <th className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span>TRẠNG THÁI ĐIỂM DANH</span>
                    {displayStudents.length > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllPresent}
                        title="Đánh dấu tất cả học sinh hiển thị là Có mặt và lưu lại"
                        className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                      >
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Tất cả có mặt</span>
                      </button>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayStudents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="font-extrabold text-sm text-slate-800">
                          Lớp này chưa có học sinh nào
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Thầy cô có thể phân bổ học sinh vào lớp này để thực hiện điểm danh hoặc xem ở chế độ &quot;Tất cả lớp&quot;.
                        </p>
                      </div>
                      {classFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={handleAssignAllToClass}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Gán học sinh vào lớp này</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayStudents.map((student, index) => {
                  const currentStatus = dailyStatus[student.id] || 'present';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-lg shrink-0">
                            {student.avatar}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-800">
                              {student.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {student.gender} • {student.code}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'present')}
                            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-emerald-500 text-white shadow-xs scale-105'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Có mặt</span>
                          </button>

                          {/* Excused */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'excused')}
                            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                              currentStatus === 'excused'
                                ? 'bg-amber-400 text-amber-950 shadow-xs scale-105'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            <span>🟡 Có phép</span>
                          </button>

                          {/* Unexcused */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'unexcused')}
                            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                              currentStatus === 'unexcused'
                                ? 'bg-rose-500 text-white shadow-xs scale-105'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            <span>🔴 Không phép</span>
                          </button>

                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'late')}
                            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                              currentStatus === 'late'
                                ? 'bg-purple-500 text-white shadow-xs scale-105'
                                : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700'
                            }`}
                          >
                            <span>🟣 Đi muộn</span>
                          </button>
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
  );
};

