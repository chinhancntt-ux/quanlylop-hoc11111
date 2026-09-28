import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, AttendanceRecord } from '../types';
import {
  CheckSquare,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  Save,
  CheckCircle2,
  Users,
  Search,
  MessageSquare
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { classes, students, schedules, filterClassId, setFilterClassId, attendance, saveAttendanceBatch, showToast, profile } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(
    filterClassId !== 'all' ? filterClassId : classes[0]?.id || ''
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local attendance state for the current session
  const [sessionAttendance, setSessionAttendance] = useState<
    Record<string, { status: AttendanceStatus; note: string }>
  >({});

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = activeClass
    ? students.filter((s) => s.classIds.includes(activeClass.id))
    : [];

  // Find if there is a schedule for this class today
  const classSchedules = activeClass
    ? schedules.filter((s) => s.classId === activeClass.id)
    : [];

  // Load existing attendance from context when class or date changes
  useEffect(() => {
    if (!activeClass) return;

    const initial: Record<string, { status: AttendanceStatus; note: string }> = {};

    classStudents.forEach((stu) => {
      const existing = attendance.find(
        (a) => a.classId === activeClass.id && a.date === selectedDate && a.studentId === stu.id
      );

      if (existing) {
        initial[stu.id] = {
          status: existing.status,
          note: existing.note || '',
        };
      } else {
        // Default to present for convenience
        initial[stu.id] = {
          status: 'present',
          note: '',
        };
      }
    });

    setSessionAttendance(initial);
  }, [selectedClassId, selectedDate, attendance, activeClass]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setSessionAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setSessionAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    const updated = { ...sessionAttendance };
    classStudents.forEach((s) => {
      updated[s.id] = {
        status: 'present',
        note: updated[s.id]?.note || '',
      };
    });
    setSessionAttendance(updated);

    if (activeClass && classStudents.length > 0) {
      const records: AttendanceRecord[] = classStudents.map((stu) => {
        const current = updated[stu.id] || { status: 'present', note: '' };
        return {
          id: `att-${Date.now()}-${stu.id}`,
          classId: activeClass.id,
          date: selectedDate,
          studentId: stu.id,
          status: 'present',
          note: current.note.trim() || undefined,
          checkInTime: '07:30',
        };
      });
      saveAttendanceBatch(records);
    }
    showToast('✅ Đã đánh dấu tất cả học sinh CÓ MẶT và lưu thành công!', 'success');
  };

  const handleSaveAttendance = () => {
    if (!activeClass) return;

    const records: AttendanceRecord[] = classStudents.map((stu) => {
      const current = sessionAttendance[stu.id] || { status: 'present', note: '' };
      return {
        id: `att-${Date.now()}-${stu.id}`,
        classId: activeClass.id,
        date: selectedDate,
        studentId: stu.id,
        status: current.status,
        note: current.note.trim() || undefined,
        checkInTime: current.status === 'present' || current.status === 'late' ? '17:30' : undefined,
      };
    });

    saveAttendanceBatch(records);
  };

  // Stats
  const total = classStudents.length;
  const attendanceList = Object.values(sessionAttendance) as { status: AttendanceStatus; note: string }[];
  const presentCount = attendanceList.filter((v) => v.status === 'present').length;
  const lateCount = attendanceList.filter((v) => v.status === 'late').length;
  const excusedCount = attendanceList.filter((v) => v.status === 'excused').length;
  const unexcusedCount = attendanceList.filter((v) => v.status === 'unexcused').length;
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  const filteredStudents = classStudents.filter((stu) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return stu.name.toLowerCase().includes(q) || stu.code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
            <span>{profile.centerName || 'Quản lí lớp học thân thiện'}</span>
            <span>/</span>
            <span className="text-slate-500">Quản lý chuyên cần</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Điểm Danh Lớp Học</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {presentCount + lateCount}/{total} có mặt ({attendanceRate}%)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận học sinh có mặt, đi muộn, nghỉ phép và lưu trữ báo cáo chuyên cần
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleMarkAllPresent}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Tất cả có mặt</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Lưu kết quả điểm danh</span>
          </button>
        </div>
      </div>

      {/* Control bar: Pick Class & Date */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Lớp học cần điểm danh:</label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setFilterClassId(e.target.value);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.scheduleSummary})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Ngày học:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Tìm học sinh trong lớp:</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên học sinh..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Có mặt đúng giờ</span>
            <span className="text-xl font-black text-emerald-700">{presentCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Đi muộn</span>
            <span className="text-xl font-black text-amber-700">{lateCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-100 text-sky-800 font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Vắng có phép</span>
            <span className="text-xl font-black text-sky-700">{excusedCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800 font-bold">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Vắng không phép</span>
            <span className="text-xl font-black text-rose-700">{unexcusedCount}</span>
          </div>
        </div>
      </div>

      {/* Student Attendance List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900">
              Danh sách điểm danh ({classStudents.length} học sinh)
            </span>
            {activeClass && (
              <span className="text-xs text-slate-500 font-medium">
                • Giáo viên: {activeClass.teacher} • Phòng: {activeClass.room}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Ngày: <strong className="text-slate-800">{selectedDate}</strong>
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Không có học sinh nào trong lớp này hoặc không khớp với từ khóa tìm kiếm.
            </div>
          ) : (
            filteredStudents.map((stu, index) => {
              const current = sessionAttendance[stu.id] || { status: 'present', note: '' };

              return (
                <div
                  key={stu.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <span className="text-xs font-bold text-slate-400 w-5">{index + 1}</span>
                    <img
                      src={stu.avatar}
                      alt={stu.name}
                      className="w-10 h-10 rounded-full object-cover border border-amber-300 shadow-2xs"
                    />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">{stu.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {stu.code} • Phụ huynh: {stu.parentName} ({stu.parentPhone})
                      </p>
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(stu.id, 'present')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        current.status === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      ✓ Có mặt
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(stu.id, 'late')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        current.status === 'late'
                          ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                          : 'bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-800'
                      }`}
                    >
                      ⏰ Đi muộn
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(stu.id, 'excused')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        current.status === 'excused'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-800'
                      }`}
                    >
                      ✉️ Nghỉ phép
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(stu.id, 'unexcused')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        current.status === 'unexcused'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-800'
                      }`}
                    >
                      ✗ Vắng mặt
                    </button>
                  </div>

                  {/* Note input */}
                  <div className="w-full md:w-64">
                    <input
                      type="text"
                      value={current.note}
                      onChange={(e) => handleNoteChange(stu.id, e.target.value)}
                      placeholder="Ghi chú (lý do vắng, thái độ học...)"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-amber-500"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Save bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            * Dữ liệu điểm danh sẽ được cập nhật vào lịch sử chuyên cần của học sinh
          </span>
          <button
            onClick={handleSaveAttendance}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/25 cursor-pointer"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Lưu Điểm Danh Ngày {selectedDate}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
