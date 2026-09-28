import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import { UserPlus, Edit2, X, HeartHandshake, Phone, Calendar, Users, Sparkles, Star } from 'lucide-react';

interface StudentClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClassId: string;
  studentToEdit?: Student | null;
}

const CUTE_AVATARS = ['🦁', '🐼', '🐱', '🐰', '🐯', '🐶', '🦊', '🐨', '🦄', '🐬', '🐧', '🐘', '🐥', '🦉', '🐢'];

export const AddStudentToClassModal: React.FC<StudentClassModalProps> = ({
  isOpen,
  onClose,
  targetClassId,
  studentToEdit,
}) => {
  const { classes, addStudentToClass, updateStudent, playSound } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [dob, setDob] = useState('2014-05-15');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [stars, setStars] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState(CUTE_AVATARS[0]);
  const [classId, setClassId] = useState(targetClassId);

  useEffect(() => {
    if (isOpen) {
      if (studentToEdit) {
        setName(studentToEdit.name);
        setCode(studentToEdit.code || '');
        setGender(studentToEdit.gender === 'Nữ' ? 'Nữ' : 'Nam');
        setDob(studentToEdit.dob || '2014-05-15');
        setPhone(studentToEdit.phone || '');
        setParentName(studentToEdit.parentName || '');
        setParentPhone(studentToEdit.parentPhone || '');
        setStars(studentToEdit.stars || 0);
        setSelectedAvatar(studentToEdit.avatar || CUTE_AVATARS[0]);
        setClassId(targetClassId || studentToEdit.classIds?.[0] || '');
      } else {
        setName('');
        setCode('');
        setGender('Nam');
        setDob('2014-05-15');
        setPhone('');
        setParentName('');
        setParentPhone('');
        setStars(0);
        setSelectedAvatar(CUTE_AVATARS[Math.floor(Math.random() * CUTE_AVATARS.length)]);
        setClassId(targetClassId);
      }
    }
  }, [isOpen, targetClassId, studentToEdit]);

  if (!isOpen) return null;

  const currentClass = classes.find((c) => c.id === classId) || classes[0];
  const isEditing = !!studentToEdit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && studentToEdit) {
      updateStudent(studentToEdit.id, {
        name: name.trim(),
        code: code.trim() || studentToEdit.code,
        gender,
        dob: dob || undefined,
        phone: phone.trim() || undefined,
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        stars: Number(stars) || 0,
        avatar: selectedAvatar,
      });
      playSound('click');
    } else {
      addStudentToClass(
        {
          code: code.trim() || `HS-${Date.now().toString().slice(-4)}`,
          name: name.trim(),
          gender,
          dob: dob || undefined,
          phone: phone.trim() || undefined,
          parentName: parentName.trim() || undefined,
          parentPhone: parentPhone.trim() || undefined,
          classIds: [classId],
          stars: Number(stars) || 0,
          attendanceRate: 100,
          status: 'studying',
          avatar: selectedAvatar,
        },
        classId
      );
      playSound('praise');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-sky-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 text-white">
              {isEditing ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                {isEditing ? 'Chỉnh Sửa Thông Tin Học Sinh' : 'Thêm Học Sinh Mới Vào Lớp'}
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Lớp: <strong className="text-white font-bold">{currentClass?.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Lớp học tiếp nhận */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lớp học <span className="text-rose-500">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - GV: {c.teacher}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Họ và tên & Mã & Giới tính */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên học sinh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nguyễn Tuấn Kiệt"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính</label>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setGender('Nam')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    gender === 'Nam' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  Nam
                </button>
                <button
                  type="button"
                  onClick={() => setGender('Nữ')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    gender === 'Nữ' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  Nữ
                </button>
              </div>
            </div>
          </div>

          {/* Mã học sinh & Điểm sao (nếu đang sửa) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã học sinh</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={isEditing ? 'Mã HS' : 'Tự động tạo nếu để trống'}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Số sao thi đua</span>
                <span className="text-amber-500 font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" /> {stars}
                </span>
              </label>
              <input
                type="number"
                min={0}
                value={stars}
                onChange={(e) => setStars(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>

          {/* Ngày sinh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Chọn linh vật / Avatar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Biểu tượng linh vật đại diện</span>
              <span className="text-xl">{selectedAvatar}</span>
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {CUTE_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`text-2xl p-1.5 rounded-lg transition-transform ${
                    selectedAvatar === emoji ? 'bg-blue-200 scale-125 shadow-xs' : 'hover:bg-white hover:scale-110'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Thông tin phụ huynh */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60 space-y-3">
            <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-blue-600" />
              <span>Thông tin liên hệ phụ huynh (Tùy chọn)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Họ tên phụ huynh</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="VD: Anh Nam / Chị Mai"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">SĐT phụ huynh</label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isEditing ? 'Lưu thay đổi' : 'Thêm vào lớp ngay'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
