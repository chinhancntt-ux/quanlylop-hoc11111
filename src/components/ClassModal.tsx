import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ClassItem, ClassSessionShift } from '../types';
import { X, GraduationCap, Users, MapPin, User, DollarSign, BookOpen, Sun, Sunset, Clock, Calendar, Sparkles, RefreshCw, Plus, ChevronDown } from 'lucide-react';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classToEdit?: ClassItem | null;
}

const PRESET_GRADES = ['Khối 1', 'Khối 2', 'Khối 3', 'Khối 4', 'Khối 5', 'Khối 6', 'Khối 7', 'Khối 8', 'Khối 9'];

const PRESET_COLORS = ['#0284c7', '#0ea5e9', '#2563eb', '#0891b2', '#4f46e5', '#059669', '#d97706'];

/**
 * Hàm tự động sinh mã lớp học thông minh từ tên lớp
 * Ví dụ: "Lớp 5B" -> "LOP-5B", "Lớp 4A1" -> "LOP-4A1", "1A" -> "LOP-1A"
 */
export const autoGenerateClassCode = (className: string): string => {
  const trimmed = className.trim();
  if (!trimmed) {
    return `LOP-${Math.floor(10 + Math.random() * 90)}`;
  }

  // Loại bỏ dấu tiếng Việt để tạo mã chuẩn
  const normalized = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  // Bắt các mẫu lớp học phổ biến như "5A", "5B", "4A1", "4/2", "Lớp 5B", "Lop 5B"
  const classMatch = normalized.match(/(?:Lop\s*)?(\d+\s*[\/_-]?\s*[A-Za-z0-9]+)/i);
  if (classMatch && classMatch[1]) {
    const rawCode = classMatch[1].replace(/[\s\/-]+/g, '').toUpperCase();
    return `LOP-${rawCode}`;
  }

  // Nếu không khớp mẫu số + chữ thông thường, lấy các chữ cái đầu từ
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const acronym = words.map((w) => w[0]).join('').toUpperCase().slice(0, 4);
    const num = (normalized.match(/\d+/) || [''])[0];
    return `LOP-${acronym}${num ? `-${num}` : ''}`;
  }

  return `LOP-${Math.floor(10 + Math.random() * 90)}`;
};

export const ClassModal: React.FC<ClassModalProps> = ({ isOpen, onClose, classToEdit }) => {
  const { addClass, updateClass, teachers, rooms, addRoom, config } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isCodeCustom, setIsCodeCustom] = useState(false);
  const [grade, setGrade] = useState('Khối 5');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('Phòng Tin học');
  const [isAddingNewRoom, setIsAddingNewRoom] = useState(false);
  const [customRoomInput, setCustomRoomInput] = useState('');
  const [maxStudents, setMaxStudents] = useState<number>(35);
  const [feePerSession, setFeePerSession] = useState<number>(0);

  // Thời gian học: phân rõ buổi sáng và buổi chiều
  const [sessionShift, setSessionShift] = useState<ClassSessionShift>('full_day');
  const [morningTime, setMorningTime] = useState('07:30 - 11:15');
  const [afternoonTime, setAfternoonTime] = useState('13:45 - 16:30');
  const [scheduleDays, setScheduleDays] = useState('Thứ 2 - Thứ 6');
  const [scheduleSummary, setScheduleSummary] = useState('');

  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0284c7');

  const updateAutoSummary = (
    shift: ClassSessionShift,
    days: string,
    mTime: string,
    aTime: string
  ) => {
    const d = days.trim() || 'Thứ 2 - Thứ 6';
    let text = '';
    if (shift === 'morning') {
      text = `${d} • Buổi Sáng (${mTime.trim() || '07:30 - 11:15'})`;
    } else if (shift === 'afternoon') {
      text = `${d} • Buổi Chiều (${aTime.trim() || '13:45 - 16:30'})`;
    } else if (shift === 'full_day') {
      text = `${d} • Sáng (${mTime.trim() || '07:30 - 11:15'}) & Chiều (${aTime.trim() || '13:45 - 16:30'})`;
    } else {
      text = `${d} (${mTime.trim() || '07:30'} - ${aTime.trim() || '16:30'})`;
    }
    setScheduleSummary(text);
  };

  useEffect(() => {
    if (classToEdit) {
      setName(classToEdit.name);
      setCode(classToEdit.code);
      setIsCodeCustom(true);
      setGrade(classToEdit.grade);
      setTeacher(classToEdit.teacher);
      setRoom(classToEdit.room || 'Phòng Tin học');
      setIsAddingNewRoom(false);
      setCustomRoomInput('');
      setMaxStudents(classToEdit.maxStudents);
      setFeePerSession(classToEdit.feePerSession);
      setDescription(classToEdit.description || '');
      setColor(classToEdit.color);

      // Phân tích ca học buổi sáng / buổi chiều nếu có
      let initialShift: ClassSessionShift = classToEdit.sessionShift || 'full_day';
      let mTime = classToEdit.morningTime || '07:30 - 11:15';
      let aTime = classToEdit.afternoonTime || '13:45 - 16:30';
      let days = classToEdit.scheduleDays || 'Thứ 2 - Thứ 6';

      if (!classToEdit.sessionShift && classToEdit.scheduleSummary) {
        const sum = classToEdit.scheduleSummary;
        const hasMorning = sum.toLowerCase().includes('sáng') || /0[78]:/.test(sum);
        const hasAfternoon = sum.toLowerCase().includes('chiều') || /(13|14|15|16):/.test(sum);
        if (hasMorning && hasAfternoon) initialShift = 'full_day';
        else if (hasAfternoon) initialShift = 'afternoon';
        else if (hasMorning) initialShift = 'morning';

        if (sum.includes('Thứ 2, 4, 6') || sum.includes('2, 4, 6')) days = 'Thứ 2, 4, 6';
        else if (sum.includes('Thứ 3, 5, 7') || sum.includes('3, 5, 7')) days = 'Thứ 3, 5, 7';
        else if (sum.includes('Thứ 2 - Thứ 6')) days = 'Thứ 2 - Thứ 6';
      }

      setSessionShift(initialShift);
      setMorningTime(mTime);
      setAfternoonTime(aTime);
      setScheduleDays(days);
      setScheduleSummary(classToEdit.scheduleSummary || '');
    } else {
      setName('');
      setCode(autoGenerateClassCode(''));
      setIsCodeCustom(false);
      setGrade('Khối 5');
      setTeacher(config.teacherName || 'Thầy Nhân');
      const defaultRoom = rooms.find((r) => r.name.toLowerCase().includes('tin học'))?.name || 'Phòng Tin học';
      setRoom(defaultRoom);
      setIsAddingNewRoom(false);
      setCustomRoomInput('');
      setMaxStudents(35);
      setFeePerSession(0);
      setSessionShift('full_day');
      setMorningTime('07:30 - 11:15');
      setAfternoonTime('13:45 - 16:30');
      setScheduleDays('Thứ 2 - Thứ 6');
      setScheduleSummary('Thứ 2 - Thứ 6 • Sáng (07:30 - 11:15) & Chiều (13:45 - 16:30)');
      setDescription('');
      setColor('#0284c7');
    }
  }, [classToEdit, teachers, rooms, isOpen, config.teacherName]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    // Tự động sinh mã lớp theo tên nếu người dùng chưa tự sửa tay
    if (!isCodeCustom) {
      setCode(autoGenerateClassCode(val));
    }

    // Tự động nhận diện Khối lớp từ tên (ví dụ: "Lớp 3A" -> Khối 3)
    const gradeMatch = val.match(/(?:Lớp\s*|Khối\s*)?([1-9])/i);
    if (gradeMatch && gradeMatch[1]) {
      const detectedGrade = `Khối ${gradeMatch[1]}`;
      if (PRESET_GRADES.includes(detectedGrade)) {
        setGrade(detectedGrade);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCode = (code.trim() || autoGenerateClassCode(name)).toUpperCase();
    const finalRoom = (isAddingNewRoom ? customRoomInput.trim() : room.trim()) || 'Phòng Tin học';

    // Đảm bảo phòng học mới được tự động thêm vào danh sách hệ thống
    addRoom(finalRoom);

    const payload = {
      name: name.trim(),
      code: finalCode,
      subject: classToEdit?.subject || '',
      grade,
      teacher: teacher.trim() || config.teacherName,
      room: finalRoom,
      maxStudents: Number(maxStudents) || 35,
      feePerSession: Number(feePerSession) || 0,
      sessionShift,
      morningTime: (sessionShift === 'morning' || sessionShift === 'full_day' || sessionShift === 'custom') ? morningTime.trim() : '',
      afternoonTime: (sessionShift === 'afternoon' || sessionShift === 'full_day' || sessionShift === 'custom') ? afternoonTime.trim() : '',
      scheduleDays: scheduleDays.trim(),
      scheduleSummary: scheduleSummary.trim() || 'Thứ 2 - Thứ 6',
      description: description.trim(),
      color,
      status: 'active' as const,
    };

    if (classToEdit) {
      updateClass(classToEdit.id, payload);
    } else {
      addClass(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 via-sky-50 to-blue-100/50 border-b border-blue-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {classToEdit ? 'Chỉnh sửa thông tin lớp học' : 'Thêm lớp học mới'}
              </h3>
              <p className="text-xs text-blue-700/80">Thiết lập thông tin lớp, khối, giáo viên chủ nhiệm & phòng học</p>
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
          {/* Tên & Mã lớp (Tự sinh) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-500" />
                Tên lớp học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="VD: Lớp 5B hoặc 5B - Khám Phá"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-800"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  Mã lớp
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> Tự sinh
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCodeCustom(false);
                    setCode(autoGenerateClassCode(name));
                  }}
                  title="Tạo lại mã tự động theo tên lớp"
                  className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  Làm mới
                </button>
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setIsCodeCustom(true);
                  setCode(e.target.value.toUpperCase());
                }}
                placeholder="VD: LOP-5B"
                className="w-full px-3.5 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono font-bold text-slate-800"
                required
              />
            </div>
          </div>

          {/* Khối lớp & Sĩ số tối đa (Đã bỏ Môn học / Chương trình theo yêu cầu) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-500" />
                Khối lớp
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
              >
                {PRESET_GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                Sĩ số tối đa (học sinh)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={maxStudents}
                onChange={(e) => setMaxStudents(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                required
              />
            </div>
          </div>

          {/* Giáo viên & Phòng học */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                Giáo viên phụ trách
              </label>
              <input
                type="text"
                list="cls-teachers"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                placeholder="Thầy Nhân"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                required
              />
              <datalist id="cls-teachers">
                {teachers.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  Phòng học
                </label>
                {!isAddingNewRoom ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewRoom(true);
                      setCustomRoomInput('');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm phòng tùy ý
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewRoom(false);
                      setRoom(room || 'Phòng Tin học');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Chọn từ danh sách
                  </button>
                )}
              </div>

              {!isAddingNewRoom ? (
                <div className="relative">
                  <select
                    value={room}
                    onChange={(e) => {
                      if (e.target.value === '__add_custom_room__') {
                        setIsAddingNewRoom(true);
                        setCustomRoomInput('');
                      } else {
                        setRoom(e.target.value);
                      }
                    }}
                    className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium appearance-none cursor-pointer"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} {r.name.toLowerCase() === 'phòng tin học' ? '★ (Mặc định)' : ''}
                      </option>
                    ))}
                    {room && !rooms.some((r) => r.name.toLowerCase() === room.toLowerCase()) && (
                      <option value={room}>{room} (Hiện tại)</option>
                    )}
                    <option value="__add_custom_room__" className="text-blue-600 font-semibold">
                      ➕ Thêm phòng tùy ý khác...
                    </option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      value={customRoomInput}
                      onChange={(e) => {
                        setCustomRoomInput(e.target.value);
                        setRoom(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customRoomInput.trim()) {
                            addRoom(customRoomInput.trim());
                            setRoom(customRoomInput.trim());
                            setIsAddingNewRoom(false);
                          }
                        }
                      }}
                      placeholder="Nhập tên phòng mới (VD: Phòng Tin học 3, STEM...)"
                      className="flex-1 px-3.5 py-2.5 bg-blue-50/50 border border-blue-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium text-sm placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customRoomInput.trim()) {
                          addRoom(customRoomInput.trim());
                          setRoom(customRoomInput.trim());
                          setIsAddingNewRoom(false);
                        }
                      }}
                      disabled={!customRoomInput.trim()}
                      className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shadow-sm"
                    >
                      Thêm & Chọn
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    💡 Tên phòng này sẽ được lưu vào danh sách hệ thống để tiện chọn lại.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Học phí */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-slate-400" />
              Học phí / Buổi (VNĐ) <span className="text-xs font-normal text-slate-400">(Để 0 nếu là lớp phổ thông công lập)</span>
            </label>
            <input
              type="number"
              step="10000"
              min="0"
              value={feePerSession}
              onChange={(e) => setFeePerSession(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-semibold"
            />
          </div>

          {/* Thời gian học: Làm rõ Buổi Sáng và Buổi Chiều */}
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Thời gian học & Ca học</span>
              </label>
              <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                Phân rõ Buổi Sáng & Buổi Chiều
              </span>
            </div>

            {/* 1. Chọn hình thức buổi học */}
            <div>
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">Hình thức ca học:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSessionShift('morning');
                    updateAutoSummary('morning', scheduleDays, morningTime, afternoonTime);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    sessionShift === 'morning'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Học buổi Sáng</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSessionShift('afternoon');
                    updateAutoSummary('afternoon', scheduleDays, morningTime, afternoonTime);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    sessionShift === 'afternoon'
                      ? 'bg-sky-600 text-white border-sky-700 shadow-xs ring-2 ring-sky-400/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <Sunset className="w-3.5 h-3.5" />
                  <span>Học buổi Chiều</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSessionShift('full_day');
                    updateAutoSummary('full_day', scheduleDays, morningTime, afternoonTime);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    sessionShift === 'full_day'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-400/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <span>🏫 Cả Sáng & Chiều</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSessionShift('custom');
                    updateAutoSummary('custom', scheduleDays, morningTime, afternoonTime);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    sessionShift === 'custom'
                      ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <span>⚙️ Tùy chỉnh</span>
                </button>
              </div>
            </div>

            {/* 2. Ngày học trong tuần */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Ngày học trong tuần:
                </span>
                <div className="flex items-center gap-1">
                  {['Thứ 2 - Thứ 6', 'Thứ 2, 4, 6', 'Thứ 3, 5, 7'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setScheduleDays(d);
                        updateAutoSummary(sessionShift, d, morningTime, afternoonTime);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        scheduleDays === d
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={scheduleDays}
                onChange={(e) => {
                  setScheduleDays(e.target.value);
                  updateAutoSummary(sessionShift, e.target.value, morningTime, afternoonTime);
                }}
                placeholder="VD: Thứ 2 - Thứ 6 hoặc Thứ 2, 4, 6"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>

            {/* 3. Khung giờ chi tiết Buổi Sáng & Buổi Chiều */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Khung giờ Buổi Sáng */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  sessionShift === 'morning' || sessionShift === 'full_day' || sessionShift === 'custom'
                    ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-400/20'
                    : 'bg-slate-100/50 border-slate-200 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    <span>Buổi Sáng</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    Ca Sáng
                  </span>
                </div>
                <input
                  type="text"
                  value={morningTime}
                  disabled={sessionShift === 'afternoon'}
                  onChange={(e) => {
                    setMorningTime(e.target.value);
                    updateAutoSummary(sessionShift, scheduleDays, e.target.value, afternoonTime);
                  }}
                  placeholder="07:30 - 11:15"
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100 disabled:text-slate-400"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {['07:15 - 11:15', '07:30 - 11:15', '07:30 - 11:30'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      disabled={sessionShift === 'afternoon'}
                      onClick={() => {
                        setMorningTime(time);
                        updateAutoSummary(sessionShift, scheduleDays, time, afternoonTime);
                      }}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 cursor-pointer disabled:opacity-40"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Khung giờ Buổi Chiều */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  sessionShift === 'afternoon' || sessionShift === 'full_day' || sessionShift === 'custom'
                    ? 'bg-sky-50/90 border-sky-300 ring-1 ring-sky-400/20'
                    : 'bg-slate-100/50 border-slate-200 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                    <Sunset className="w-3.5 h-3.5 text-sky-600" />
                    <span>Buổi Chiều</span>
                  </label>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-md">
                    Ca Chiều
                  </span>
                </div>
                <input
                  type="text"
                  value={afternoonTime}
                  disabled={sessionShift === 'morning'}
                  onChange={(e) => {
                    setAfternoonTime(e.target.value);
                    updateAutoSummary(sessionShift, scheduleDays, morningTime, e.target.value);
                  }}
                  placeholder="13:45 - 16:30"
                  className="w-full px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-100 disabled:text-slate-400"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {['13:30 - 16:30', '13:45 - 16:30', '14:00 - 16:30', '14:00 - 17:00'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      disabled={sessionShift === 'morning'}
                      onClick={() => {
                        setAfternoonTime(time);
                        updateAutoSummary(sessionShift, scheduleDays, morningTime, time);
                      }}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-white hover:bg-sky-100 text-sky-900 font-bold border border-sky-200 cursor-pointer disabled:opacity-40"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Dòng tóm tắt thời gian học tổng hợp */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Tóm tắt thời gian học:</label>
                <span className="text-[10px] text-slate-400">Tự động tạo hoặc chỉnh sửa trực tiếp</span>
              </div>
              <input
                type="text"
                value={scheduleSummary}
                onChange={(e) => setScheduleSummary(e.target.value)}
                placeholder="VD: Thứ 2 - Thứ 6 • Sáng (07:30 - 11:15) & Chiều (13:45 - 16:30)"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Khẩu hiệu & Mô tả */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Khẩu hiệu / Mục tiêu thi đua lớp</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Khẩu hiệu lớp, mục tiêu học tập và rèn luyện đạo đức..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 resize-none"
            />
          </div>

          {/* Màu sắc nhận diện */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Màu nhận diện lớp học</label>
            <div className="flex items-center gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                    color === c ? 'scale-115 border-slate-900 shadow-md ring-2 ring-blue-300' : 'border-white hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              {classToEdit ? 'Lưu thông tin' : 'Tạo lớp học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
