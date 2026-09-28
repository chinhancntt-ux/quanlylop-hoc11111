import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import { X, User, Phone, Calendar, HeartHandshake, CheckSquare } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
}

export const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, studentToEdit }) => {
  const { classes, addStudent, updateStudent, deleteStudent } = useApp();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [dob, setDob] = useState('2008-01-01');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'studying' | 'trial' | 'reserved'>('studying');

  useEffect(() => {
    if (studentToEdit) {
      setName(studentToEdit.name);
      setGender(studentToEdit.gender);
      setDob(studentToEdit.dob);
      setPhone(studentToEdit.phone);
      setParentName(studentToEdit.parentName);
      setParentPhone(studentToEdit.parentPhone);
      setSelectedClassIds(studentToEdit.classIds);
      setStatus(studentToEdit.status);
    } else {
      setName('');
      setGender('male');
      setDob('2008-05-15');
      setPhone('');
      setParentName('');
      setParentPhone('');
      setSelectedClassIds(classes[0] ? [classes[0].id] : []);
      setStatus('studying');
    }
  }, [studentToEdit, classes, isOpen]);

  if (!isOpen) return null;

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      gender,
      dob,
      phone: phone.trim() || 'Chưa cập nhật',
      parentName: parentName.trim() || 'Phụ huynh',
      parentPhone: parentPhone.trim() || 'Chưa cập nhật',
      classIds: selectedClassIds,
      status,
      avatar: gender === 'female'
        ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
    };

    if (studentToEdit) {
      updateStudent(studentToEdit.id, payload);
    } else {
      addStudent(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {studentToEdit ? 'Chỉnh sửa hồ sơ học sinh' : 'Thêm mới học sinh'}
              </h3>
              <p className="text-xs text-slate-500">Thông tin cá nhân, liên hệ phụ huynh & lớp học</p>
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
          {/* Họ tên & Giới tính */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1.5">
                Họ và tên học sinh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn Nam"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>
          </div>

          {/* Ngày sinh & SĐT học sinh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Ngày sinh
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-400" />
                Số ĐT học sinh (nếu có)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              />
            </div>
          </div>

          {/* Phụ huynh */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/60 space-y-3">
            <div className="font-semibold text-blue-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <HeartHandshake className="w-4 h-4 text-blue-600" />
              Thông tin liên hệ phụ huynh
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ tên phụ huynh
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Họ tên bố/mẹ..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SĐT Phụ huynh (Nhận Zalo/SMS)
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="0988..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Trạng thái học tập */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Trạng thái học viên</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'studying' | 'trial' | 'reserved')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            >
              <option value="studying">Đang theo học chính thức</option>
              <option value="trial">Đang học thử / Đánh giá đầu vào</option>
              <option value="reserved">Tạm thời bảo lưu khóa học</option>
            </select>
          </div>

          {/* Chọn lớp tham gia */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Đăng ký lớp học</span>
              <span className="text-xs text-blue-700 font-medium">Đã chọn {selectedClassIds.length} lớp</span>
            </label>
            <div className="max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              {classes.map((c) => {
                const isChecked = selectedClassIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleClass(c.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isChecked ? 'bg-blue-50 border border-blue-300 text-blue-950 font-semibold' : 'hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-xs">{c.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal">{c.scheduleSummary}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {studentToEdit ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Bạn có chắc chắn muốn xóa học sinh "${studentToEdit.name}"?`)) {
                    deleteStudent(studentToEdit.id);
                    onClose();
                  }
                }}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors cursor-pointer text-xs"
              >
                Xóa học sinh
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
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              >
                {studentToEdit ? 'Lưu hồ sơ' : 'Thêm học sinh'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
