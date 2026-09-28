import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ScheduleItem, DayOfWeek, ScheduleStatus, PRIMARY_SUBJECTS } from '../types';
import { X, Calendar, Clock, MapPin, User, BookOpen, AlertCircle, GraduationCap, Sun, Sunset } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleToEdit?: ScheduleItem | null;
  initialDay?: DayOfWeek;
}

const DAY_LABELS: { value: DayOfWeek; label: string }[] = [
  { value: 2, label: 'Thứ Hai (T2)' },
  { value: 3, label: 'Thứ Ba (T3)' },
  { value: 4, label: 'Thứ Tư (T4)' },
  { value: 5, label: 'Thứ Năm (T5)' },
  { value: 6, label: 'Thứ Sáu (T6)' },
  { value: 7, label: 'Thứ Bảy (T7)' },
  { value: 8, label: 'Chủ Nhật (CN)' },
];

const PRESET_COLORS = [
  { hex: '#f59e0b', name: 'Vàng mật ong' },
  { hex: '#0284c7', name: 'Xanh dương' },
  { hex: '#8b5cf6', name: 'Tím hoa cà' },
  { hex: '#10b981', name: 'Xanh lục bảo' },
  { hex: '#ec4899', name: 'Hồng sen' },
  { hex: '#ea580c', name: 'Cam đất' },
];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  scheduleToEdit,
  initialDay = 2,
}) => {
  const { classes, teachers, rooms, addSchedule, updateSchedule, deleteSchedule, schedules, profile } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [subject, setSubject] = useState<string>(PRIMARY_SUBJECTS[0]);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(initialDay);
  const [startTime, setStartTime] = useState<string>('17:30');
  const [endTime, setEndTime] = useState<string>('19:00');
  const [teacher, setTeacher] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [color, setColor] = useState<string>('#f59e0b');
  const [status, setStatus] = useState<ScheduleStatus>('upcoming');
  const [lessonTopic, setLessonTopic] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (scheduleToEdit) {
      setSelectedClassId(scheduleToEdit.classId);
      setSubject(scheduleToEdit.subject || PRIMARY_SUBJECTS[0]);
      setDayOfWeek(scheduleToEdit.dayOfWeek);
      setStartTime(scheduleToEdit.startTime);
      setEndTime(scheduleToEdit.endTime);
      setTeacher(scheduleToEdit.teacher);
      setRoom(scheduleToEdit.room);
      setColor(scheduleToEdit.color || '#f59e0b');
      setStatus(scheduleToEdit.status);
      setLessonTopic(scheduleToEdit.lessonTopic || '');
      setNote(scheduleToEdit.note || '');
    } else {
      const defaultClass = classes[0];
      if (defaultClass) {
        setSelectedClassId(defaultClass.id);
        setSubject(defaultClass.subject || PRIMARY_SUBJECTS[0]);
        setTeacher(defaultClass.teacher);
        setRoom(defaultClass.room);
        setColor(defaultClass.color);
      }
      setDayOfWeek(initialDay);
      // Ưu tiên lấy giờ ca học của lớp nếu có
      if (defaultClass?.morningTime) {
        const parts = defaultClass.morningTime.split('-');
        setStartTime(parts[0]?.trim() || '07:30');
        setEndTime(parts[1]?.trim() || '08:15');
      } else {
        setStartTime('07:30');
        setEndTime('08:15');
      }
      setStatus('upcoming');
      setLessonTopic('');
      setNote('');
    }
  }, [scheduleToEdit, initialDay, classes, isOpen]);

  // When class changes, auto-fill teacher and room if not set
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const targetClass = classes.find((c) => c.id === newClassId);
    if (targetClass) {
      if (!scheduleToEdit && targetClass.subject) {
        setSubject(targetClass.subject);
      }
      setTeacher(targetClass.teacher);
      setRoom(targetClass.room);
      setColor(targetClass.color);
    }
  };

  // Conflict detection
  useEffect(() => {
    if (!isOpen) return;

    // Check if another schedule has same room or same teacher at overlapping time on same day
    const conflicts = schedules.filter((s) => {
      if (scheduleToEdit && s.id === scheduleToEdit.id) return false;
      if (s.dayOfWeek !== dayOfWeek) return false;

      // Time overlap check: start1 < end2 && start2 < end1
      const isOverlap = startTime < s.endTime && s.startTime < endTime;
      if (!isOverlap) return false;

      return s.room === room || s.teacher === teacher;
    });

    if (conflicts.length > 0) {
      const c = conflicts[0];
      if (c.room === room && c.teacher === teacher) {
        setConflictWarning(`Trùng lịch: Phòng "${room}" và Giáo viên "${teacher}" đang có lớp ${c.className} (${c.startTime} - ${c.endTime})`);
      } else if (c.room === room) {
        setConflictWarning(`Trùng phòng: Phòng "${room}" đang có lớp ${c.className} (${c.startTime} - ${c.endTime})`);
      } else {
        setConflictWarning(`Trùng giáo viên: ${teacher} đang dạy lớp ${c.className} (${c.startTime} - ${c.endTime})`);
      }
    } else {
      setConflictWarning(null);
    }
  }, [dayOfWeek, startTime, endTime, room, teacher, scheduleToEdit, schedules, isOpen]);

  if (!isOpen) return null;

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass) return;

    const payload = {
      classId: currentClass.id,
      className: currentClass.name,
      subject: subject || currentClass.subject,
      room,
      teacher,
      dayOfWeek,
      startTime,
      endTime,
      color,
      status,
      lessonTopic: lessonTopic.trim() || undefined,
      note: note.trim() || undefined,
      session: scheduleToEdit?.session,
      period: scheduleToEdit?.period,
      isRed: scheduleToEdit?.isRed,
      shortCode: scheduleToEdit?.shortCode,
    };

    if (scheduleToEdit) {
      updateSchedule(scheduleToEdit.id, payload);
    } else {
      addSchedule(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-100/50 border-b border-amber-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {scheduleToEdit ? 'Chỉnh sửa buổi học' : 'Thêm buổi học vào thời khóa biểu'}
              </h3>
              <p className="text-xs text-slate-500">Quản lý lịch giảng dạy và phòng học BeeClass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
          {/* Conflict Warning */}
          {conflictWarning && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{conflictWarning} (Vẫn có thể lưu nếu là phòng học chung hoặc dự thính)</span>
            </div>
          )}

          {/* Chọn Lớp Học & Môn Học */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-500" />
                Lớp học <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium text-slate-800"
                required
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-500" />
                Môn học / Tiết học <span className="text-rose-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium text-slate-800"
                required
              >
                {!PRIMARY_SUBJECTS.includes(subject as any) && subject && (
                  <option value={subject}>{subject}</option>
                )}
                {PRIMARY_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Thứ trong tuần */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Thứ trong tuần</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value) as DayOfWeek)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium text-slate-800"
              >
                {DAY_LABELS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Trạng thái buổi học</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ScheduleStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium text-slate-800"
              >
                <option value="upcoming">Sắp tới (Chưa bắt đầu)</option>
                <option value="ongoing">Đang diễn ra</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Nghỉ / Hủy buổi</option>
              </select>
            </div>
          </div>

          {/* Khung giờ học: Làm rõ Ca Sáng & Ca Chiều */}
          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Khung giờ học (Ca Sáng / Ca Chiều)</span>
              </span>
              <span className="text-[10px] text-amber-800 font-semibold bg-amber-100/80 px-2 py-0.5 rounded">
                Tiết học chuẩn
              </span>
            </div>

            {/* Gợi ý chọn nhanh Ca Sáng & Ca Chiều */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1 bg-amber-100/60 px-1.5 py-0.5 rounded">
                  <Sun className="w-3 h-3 text-amber-600" /> Ca Sáng:
                </span>
                {[
                  { label: 'Tiết 1', start: '07:30', end: '08:15' },
                  { label: 'Tiết 2', start: '08:20', end: '09:05' },
                  { label: 'Tiết 3', start: '09:25', end: '10:10' },
                  { label: 'Tiết 4', start: '10:15', end: '11:00' },
                  { label: 'Cả sáng', start: '07:30', end: '11:15' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setStartTime(item.start);
                      setEndTime(item.end);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border transition-all cursor-pointer ${
                      startTime === item.start && endTime === item.end
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'bg-white border-amber-200 text-amber-900 hover:bg-amber-100/70'
                    }`}
                  >
                    {item.label} ({item.start} - {item.end})
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-sky-900 flex items-center gap-1 bg-sky-100/60 px-1.5 py-0.5 rounded">
                  <Sunset className="w-3 h-3 text-sky-600" /> Ca Chiều:
                </span>
                {[
                  { label: 'Tiết 1', start: '13:45', end: '14:30' },
                  { label: 'Tiết 2', start: '14:35', end: '15:20' },
                  { label: 'Tiết 3', start: '15:35', end: '16:20' },
                  { label: 'Cả chiều', start: '13:45', end: '16:30' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setStartTime(item.start);
                      setEndTime(item.end);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border transition-all cursor-pointer ${
                      startTime === item.start && endTime === item.end
                        ? 'bg-sky-600 text-white border-sky-700 shadow-2xs'
                        : 'bg-white border-sky-200 text-sky-900 hover:bg-sky-100/70'
                    }`}
                  >
                    {item.label} ({item.start} - {item.end})
                  </button>
                ))}
              </div>
            </div>

            {/* Giờ bắt đầu & Kết thúc */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Giờ bắt đầu
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 font-bold text-slate-800 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Giờ kết thúc
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 font-bold text-slate-800 text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Giáo viên & Phòng học */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  Giáo viên phụ trách
                </label>
                {profile.teacherName && teacher !== profile.teacherName && (
                  <button
                    type="button"
                    onClick={() => setTeacher(profile.teacherName)}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition-colors cursor-pointer"
                  >
                    + Chọn tôi ({profile.teacherName})
                  </button>
                )}
              </div>
              <input
                type="text"
                list="teachers-list"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                placeholder="VD: Thầy Chính An, Thầy Hoàng Long..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium text-slate-800"
                required
              />
              <datalist id="teachers-list">
                {profile.teacherName && <option value={profile.teacherName} />}
                {teachers.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                Phòng học
              </label>
              <input
                type="text"
                list="rooms-list"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="VD: Phòng 101 (Ong Vàng)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium text-slate-800"
                required
              />
              <datalist id="rooms-list">
                {rooms.map((r) => (
                  <option key={r.id} value={r.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Chuyên đề / Nội dung bài giảng */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Chuyên đề / Nội dung bài học (Tùy chọn)
            </label>
            <input
              type="text"
              value={lessonTopic}
              onChange={(e) => setLessonTopic(e.target.value)}
              placeholder="VD: Chuyên đề Bất Đẳng Thức Cauchy-Schwarz..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-800"
            />
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Ghi chú thêm (Kiểm tra, dặn dò...)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Kiểm tra 15 phút đầu giờ, phát đề mới..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-800"
            />
          </div>

          {/* Màu sắc thẻ */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Màu nhận diện thẻ lịch</label>
            <div className="flex items-center gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                    color === c.hex ? 'scale-115 border-slate-900 shadow-md' : 'border-white hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {scheduleToEdit ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn xóa buổi học này khỏi thời khóa biểu?')) {
                    deleteSchedule(scheduleToEdit.id);
                    onClose();
                  }
                }}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors cursor-pointer text-xs"
              >
                Xóa buổi học
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/25 transition-all cursor-pointer"
              >
                {scheduleToEdit ? 'Lưu thay đổi' : 'Thêm buổi học'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
