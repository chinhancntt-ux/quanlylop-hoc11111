import React, { useState } from 'react';
import {
  Users,
  Plus,
  FileSpreadsheet,
  Trash2,
  Search,
  Filter,
  Edit2,
  Star,
  X,
  Upload,
  UserPlus,
  School
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import { CUTE_AVATARS } from '../data/mockData';

export const StudentListView: React.FC = () => {
  const {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudentList,
    openRewardModalForStudent,
    classes,
    activeClassId,
    setActiveClassId,
    activeClass,
    setIsAddClassModalOpen,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState('all');
  const [classFilter, setClassFilter] = useState<string>(activeClassId || 'all');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [formAvatar, setFormAvatar] = useState('🐼');
  const [formPhone, setFormPhone] = useState('');
  const [formClassId, setFormClassId] = useState(activeClassId || 'cls-1');

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = selectedGender === 'all' || student.gender === selectedGender;
    const matchesClass = classFilter === 'all' || (student.classIds && student.classIds.includes(classFilter));
    return matchesSearch && matchesGender && matchesClass;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormName('');
    setFormGender('Nam');
    setFormAvatar(CUTE_AVATARS[Math.floor(Math.random() * CUTE_AVATARS.length)]);
    setFormPhone('');
    setFormClassId(activeClassId || 'cls-1');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (stu: Student) => {
    setEditingStudent(stu);
    setFormName(stu.name);
    setFormGender(stu.gender);
    setFormAvatar(stu.avatar);
    setFormPhone(stu.parentPhone || '');
    setFormClassId(stu.classIds?.[0] || activeClassId || 'cls-1');
    setIsAddEditOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        name: formName.trim(),
        gender: formGender,
        avatar: formAvatar,
        parentPhone: formPhone.trim(),
        classIds: [formClassId],
      });
    } else {
      addStudent({
        code: `HS-${String(students.length + 1).padStart(3, '0')}`,
        name: formName.trim(),
        gender: formGender,
        stars: 0,
        attendanceRate: 100,
        status: 'studying',
        avatar: formAvatar,
        parentPhone: formPhone.trim(),
        classIds: [formClassId],
      });
    }
    setIsAddEditOpen(false);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;

    const names = importText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (names.length > 0) {
      importStudentList(names);
      setImportText('');
      setIsImportOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              DANH SÁCH HỌC SINH
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Quản lý hồ sơ, điểm tích lũy sao và nề nếp thi đua ({filteredStudents.length} / {students.length} học sinh)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="student-import-btn"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Nhập DS Học Sinh</span>
          </button>

          <button
            id="student-add-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm shadow-blue-200 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Thêm Học Sinh</span>
          </button>
        </div>
      </div>

      {/* Class Selector Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-blue-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <School className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-700">Chọn lớp:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              setClassFilter('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              classFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            Tất cả các lớp
          </button>

          {classes.map((cls) => {
            const isSelected = classFilter === cls.id;
            return (
              <button
                key={cls.id}
                onClick={() => {
                  setClassFilter(cls.id);
                  setActiveClassId(cls.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
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
              </button>
            );
          })}

          <button
            onClick={() => setIsAddClassModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm lớp</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm học sinh theo tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-400 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc:</span>
          </div>

          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">Tất cả giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            id={`student-card-${student.id}`}
            className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 p-3.5 flex flex-col items-center justify-between text-center transition-all hover:shadow-md group relative"
          >
            {/* Action buttons (edit/delete) in top corner */}
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleOpenEdit(student)}
                title="Sửa thông tin"
                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xóa học sinh "${student.name}" không?`)) {
                    deleteStudent(student.id);
                  }
                }}
                title="Xóa học sinh"
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-3xl shadow-2xs mt-2 group-hover:scale-105 transition-transform">
              {student.avatar}
            </div>

            {/* Student Info */}
            <div className="mt-2.5 w-full">
              <h3 className="font-extrabold text-sm text-slate-800 truncate px-1" title={student.name}>
                {student.name}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                {student.code} • {student.gender}
              </p>
            </div>

            {/* Stars Count */}
            <div className="my-2.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full flex items-center gap-1 text-amber-700 font-black text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{student.stars} ⭐</span>
            </div>

            {/* Reward Button */}
            <button
              id={`reward-btn-${student.id}`}
              onClick={() => openRewardModalForStudent(student)}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thưởng Điểm</span>
            </button>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-blue-100 p-8 space-y-3">
          <div className="text-4xl">🔍</div>
          <h4 className="text-base font-bold text-slate-700">Không tìm thấy học sinh nào</h4>
          <p className="text-xs text-slate-400">Hãy thử thay đổi lớp học, từ khóa tìm kiếm hoặc bỏ chọn bộ lọc</p>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-blue-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-800">
                {editingStudent ? 'Chỉnh Sửa Học Sinh' : 'Thêm Học Sinh Mới'}
              </h3>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên học sinh *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lớp học *
                </label>
                <select
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Giới tính
                </label>
                <select
                  value={formGender}
                  onChange={(e) => setFormGender(e.target.value as 'Nam' | 'Nữ')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn biểu tượng Avatar
                </label>
                <div className="grid grid-cols-8 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {CUTE_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormAvatar(emoji)}
                      className={`h-9 flex items-center justify-center text-xl rounded-lg transition-transform ${
                        formAvatar === emoji
                          ? 'bg-blue-600 scale-110 shadow-sm text-white'
                          : 'hover:bg-slate-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại Phụ huynh (tùy chọn)
                </label>
                <input
                  type="tel"
                  placeholder="Ví dụ: 0912 345 678"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-200 cursor-pointer"
                >
                  {editingStudent ? 'Cập Nhật' : 'Thêm Học Sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-blue-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-800">
                  Nhập Danh Sách Học Sinh Hàng Loạt
                </h3>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dán danh sách tên học sinh (mỗi em một dòng):
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder={`Lưu Thành An\nCao Đức Anh\nNguyễn Đắc Gia Bảo\nTrần Thế Bảo...`}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Hệ thống sẽ tự động gán mã học sinh và avatar ngẫu nhiên dễ thương cho từng em vào lớp hiện tại.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-200 cursor-pointer"
                >
                  Nhập Danh Sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
