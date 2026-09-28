import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClassItem, Student } from '../types';
import { ClassModal } from './ClassModal';
import { ExcelImportModal } from './ExcelImportModal';
import { AddStudentToClassModal } from './AddStudentToClassModal';
import { exportClassStudentsToExcel, downloadStudentTemplateExcel } from '../utils/excelHelper';
import {
  Plus,
  Search,
  Users,
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  Edit2,
  Trash2,
  Eye,
  Check,
  FileSpreadsheet,
  UserPlus,
  Download,
  Upload,
  Star,
  X,
  Phone,
  Filter,
  Sun,
  Sunset,
} from 'lucide-react';

export const ClassManagement: React.FC = () => {
  const {
    classes,
    students,
    setActiveTab,
    setFilterClassId,
    deleteClass,
    profile,
    config,
    activeClassId,
    setActiveClassId,
    isAddClassModalOpen,
    setIsAddClassModalOpen,
    removeStudentFromClass,
    rewardStudent,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // Student roster preview / management modal for specific class
  const [viewingRosterClass, setViewingRosterClass] = useState<ClassItem | null>(null);

  // Add / Edit Student in Class modal state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentTargetClassId, setStudentTargetClassId] = useState<string>('');
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  // Excel Import modal state
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelTargetClassId, setExcelTargetClassId] = useState<string>('');

  // Roster internal search & filters
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterGenderFilter, setRosterGenderFilter] = useState('all');

  // Delete confirmation modal states
  const [studentToDelete, setStudentToDelete] = useState<{ student: Student; classItem: ClassItem } | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);

  const grades = Array.from(new Set(classes.map((c) => c.grade)));

  const filteredClasses = classes.filter((c) => {
    if (selectedGrade !== 'all' && c.grade !== selectedGrade) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.teacher.toLowerCase().includes(q) ||
        c.room.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAddClass = () => {
    setEditingClass(null);
    setIsAddClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassItem) => {
    setEditingClass(cls);
    setIsAddClassModalOpen(true);
  };

  const handleGoToAttendance = (classId: string) => {
    setActiveClassId(classId);
    setFilterClassId(classId);
    setActiveTab('attendance');
  };

  const handleOpenAddStudent = (targetClassId: string) => {
    setStudentToEdit(null);
    setStudentTargetClassId(targetClassId);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (stu: Student, targetClassId: string) => {
    setStudentToEdit(stu);
    setStudentTargetClassId(targetClassId);
    setIsStudentModalOpen(true);
  };

  const handleOpenExcelImport = (targetClassId: string) => {
    setExcelTargetClassId(targetClassId);
    setIsExcelModalOpen(true);
  };

  const handleDeleteStudent = (student: Student, cls: ClassItem) => {
    setStudentToDelete({ student, classItem: cls });
  };

  // Students in currently viewed roster modal
  const currentRosterStudents = viewingRosterClass
    ? students.filter((s) => s.classIds?.includes(viewingRosterClass.id))
    : [];

  const filteredRosterStudents = currentRosterStudents.filter((stu) => {
    if (rosterGenderFilter !== 'all' && stu.gender !== rosterGenderFilter) return false;
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      return (
        stu.name.toLowerCase().includes(q) ||
        stu.code.toLowerCase().includes(q) ||
        (stu.phone && stu.phone.includes(q)) ||
        (stu.parentName && stu.parentName.toLowerCase().includes(q)) ||
        (stu.parentPhone && stu.parentPhone.includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <span>{profile.centerName || 'Lớp Học Thân Thiện'}</span>
            <span>/</span>
            <span className="text-slate-500">Quản lý lớp học</span>
            <span>/</span>
            <span className="text-blue-800 font-bold">GV: {config.teacherName}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Danh Sách Lớp Học</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              {classes.length} lớp học
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý thông tin lớp, sĩ số học sinh, thêm/sửa/xóa học sinh và nhập xuất Excel theo từng lớp
          </p>
        </div>

        <button
          id="btn-add-class-main"
          onClick={handleOpenAddClass}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Thêm lớp học mới</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên lớp học, mã lớp, giáo viên, phòng..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500"
          >
            <option value="all">Tất cả khối lớp</option>
            {grades.map((gr) => (
              <option key={gr} value={gr}>
                {gr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClasses.map((cls) => {
          const classStudents = students.filter((s) => s.classIds?.includes(cls.id));
          const currentCount = classStudents.length;
          const capacityPercent = Math.min(100, Math.round((currentCount / cls.maxStudents) * 100));
          const isSelected = activeClassId === cls.id;

          return (
            <div
              key={cls.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-400/40 shadow-md shadow-blue-100'
                  : 'border-slate-200/80 hover:border-blue-200 hover:shadow-md'
              }`}
            >
              {/* Card top banner */}
              <div>
                <div
                  className="h-2.5 w-full"
                  style={{ backgroundColor: cls.color || '#0284c7' }}
                />
                <div className="p-5">
                  {/* Top Bar: Active Selector & Class Code (Phần trên phân loại đã được xóa theo yêu cầu) */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      {isSelected ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-600 text-white flex items-center gap-1 shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" /> Đang chọn
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveClassId(cls.id)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          Chọn lớp này
                        </button>
                      )}
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                      {cls.code}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-slate-900 text-base mb-1.5 line-clamp-1">
                    {cls.name}
                  </h3>

                  {cls.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {cls.description}
                    </p>
                  )}

                  {/* Teacher & Room info */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-semibold text-slate-800">GV: {cls.teacher}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{cls.room}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-medium text-blue-800">{cls.scheduleSummary}</span>
                      </div>
                      {(cls.morningTime || cls.afternoonTime) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {cls.morningTime && (cls.sessionShift === 'morning' || cls.sessionShift === 'full_day' || !cls.sessionShift) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold">
                              <Sun className="w-3 h-3 text-amber-600" />
                              <span>Sáng: {cls.morningTime}</span>
                            </span>
                          )}
                          {cls.afternoonTime && (cls.sessionShift === 'afternoon' || cls.sessionShift === 'full_day' || !cls.sessionShift) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-900 text-[10px] font-bold">
                              <Sunset className="w-3 h-3 text-sky-600" />
                              <span>Chiều: {cls.afternoonTime}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Student Capacity Progress Bar */}
                  <div className="space-y-1.5 mb-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Sĩ số lớp</span>
                      <span className="font-bold text-slate-800">
                        {currentCount} / {cls.maxStudents} em ({capacityPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${capacityPercent}%`,
                          backgroundColor:
                            capacityPercent >= 90
                              ? '#ef4444'
                              : capacityPercent >= 70
                              ? '#0284c7'
                              : '#10b981',
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Student Management Buttons directly on Card */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAddStudent(cls.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer border border-blue-200/60"
                      title="Thêm học sinh mới vào lớp này"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Thêm HS</span>
                    </button>
                    <button
                      onClick={() => handleOpenExcelImport(cls.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer border border-emerald-200/60"
                      title="Nhập danh sách học sinh từ file Excel"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Nhập Excel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setRosterSearch('');
                    setRosterGenderFilter('all');
                    setViewingRosterClass(cls);
                  }}
                  className="flex items-center gap-1 text-xs font-extrabold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>DS Học Sinh ({currentCount})</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleGoToAttendance(cls.id)}
                    className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                    title="Điểm danh lớp này"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditClass(cls)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Chỉnh sửa thông tin lớp"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setClassToDelete(cls)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Xóa lớp học"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Class Modal */}
      <ClassModal
        isOpen={isAddClassModalOpen}
        onClose={() => {
          setIsAddClassModalOpen(false);
          setEditingClass(null);
        }}
        classToEdit={editingClass}
      />

      {/* Class Roster Management Modal */}
      {viewingRosterClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 bg-gradient-to-r from-blue-50 to-sky-100 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-base">
                      {viewingRosterClass.name}
                    </h3>
                    <span className="font-mono text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                      {viewingRosterClass.code}
                    </span>
                  </div>
                  <p className="text-xs text-blue-800/80 mt-0.5">
                    Sĩ số: <strong>{currentRosterStudents.length} / {viewingRosterClass.maxStudents}</strong> học sinh • GV: {viewingRosterClass.teacher} • Phòng: {viewingRosterClass.room}
                  </p>
                </div>
              </div>

              {/* Action Buttons in Modal Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleOpenAddStudent(viewingRosterClass.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ Thêm học sinh</span>
                </button>
                <button
                  onClick={() => handleOpenExcelImport(viewingRosterClass.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Nhập Excel</span>
                </button>
                <button
                  onClick={() => exportClassStudentsToExcel(viewingRosterClass.name, currentRosterStudents)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  title="Xuất danh sách ra file Excel"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Xuất Excel</span>
                </button>
                <button
                  onClick={() => setViewingRosterClass(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors ml-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subheader: Filter & Search Bar */}
            <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Tìm học sinh theo tên, mã HS, SĐT..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={rosterGenderFilter}
                  onChange={(e) => setRosterGenderFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                >
                  <option value="all">Tất cả giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
            </div>

            {/* Students List in Roster */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {currentRosterStudents.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-blue-50/40 border border-dashed border-blue-200">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Users className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm mb-1">
                    Lớp học chưa có học sinh nào
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                    Thêm học sinh trực tiếp hoặc nhập danh sách học sinh từ file Excel (.xlsx) nhanh chóng
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => handleOpenAddStudent(viewingRosterClass.id)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Thêm học sinh đầu tiên</span>
                    </button>
                    <button
                      onClick={() => handleOpenExcelImport(viewingRosterClass.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Nhập từ file Excel</span>
                    </button>
                    <button
                      onClick={downloadStudentTemplateExcel}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tải file Excel mẫu</span>
                    </button>
                  </div>
                </div>
              ) : filteredRosterStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-xs">Không tìm thấy học sinh nào phù hợp với bộ lọc.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  {filteredRosterStudents.map((stu, index) => (
                    <div
                      key={stu.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-slate-50 transition-colors text-xs gap-3"
                    >
                      {/* Left: Info */}
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-400 w-5 text-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl shrink-0">
                          {stu.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{stu.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                stu.gender === 'Nữ'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                  : 'bg-blue-50 text-blue-600 border border-blue-100'
                              }`}
                            >
                              {stu.gender}
                            </span>
                          </div>

                          <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-3 flex-wrap">
                            <span className="font-mono text-slate-600 font-semibold">
                              Mã: {stu.code}
                            </span>
                            {stu.dob && <span>NS: {stu.dob}</span>}
                            {stu.parentPhone && (
                              <span className="flex items-center gap-1 text-slate-600">
                                <Phone className="w-3 h-3 text-slate-400" />
                                PH: {stu.parentName ? `${stu.parentName} - ` : ''}
                                {stu.parentPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Stars & Action Buttons */}
                      <div className="flex items-center gap-3 justify-end shrink-0 pl-8 sm:pl-0">
                        {/* Stars Pill with quick +1 */}
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span className="font-bold text-amber-800 text-xs">{stu.stars} sao</span>
                          <button
                            type="button"
                            onClick={() => rewardStudent(stu.id, 1, 'Thưởng thi đua')}
                            className="ml-1 w-4 h-4 rounded-full bg-amber-200 text-amber-800 font-black flex items-center justify-center text-[10px] hover:bg-amber-300 transition-colors cursor-pointer"
                            title="Thưởng +1 sao"
                          >
                            +
                          </button>
                        </div>

                        {/* Attendance Rate */}
                        <div className="text-right hidden md:block">
                          <span className="text-[10px] text-slate-400 block font-medium">Chuyên cần</span>
                          <span className="font-bold text-emerald-600">{stu.attendanceRate}%</span>
                        </div>

                        {/* Action buttons: Edit & Delete */}
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                          <button
                            onClick={() => handleOpenEditStudent(stu, viewingRosterClass.id)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Sửa thông tin học sinh"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(stu, viewingRosterClass)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Xóa học sinh khỏi lớp này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Bottom Bar */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-xs text-slate-500">
                Hiển thị <strong>{filteredRosterStudents.length}</strong> / <strong>{currentRosterStudents.length}</strong> học sinh trong lớp
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveClassId(viewingRosterClass.id);
                    setFilterClassId(viewingRosterClass.id);
                    setViewingRosterClass(null);
                    setActiveTab('attendance');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Điểm danh lớp này</span>
                </button>
                <button
                  onClick={() => setViewingRosterClass(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      <AddStudentToClassModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setStudentToEdit(null);
        }}
        targetClassId={studentTargetClassId}
        studentToEdit={studentToEdit}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        targetClassId={excelTargetClassId}
      />

      {/* Delete Student Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden p-6 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
              <Trash2 className="w-7 h-7 text-rose-600" />
            </div>
            
            <h3 className="font-black text-slate-900 text-lg mb-1.5">
              Xác Nhận Xóa Học Sinh
            </h3>
            
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 my-3.5 text-left flex items-center gap-3">
              <span className="text-2xl p-1.5 bg-white rounded-lg border border-slate-200 shadow-xs">
                {studentToDelete.student.avatar || '👤'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-slate-900 text-sm truncate">
                  {studentToDelete.student.name}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-blue-600">{studentToDelete.student.code}</span>
                  <span>•</span>
                  <span>{studentToDelete.student.gender}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa học sinh này khỏi lớp{' '}
              <strong className="text-blue-700 font-bold">{studentToDelete.classItem.name}</strong> không?
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  removeStudentFromClass(studentToDelete.student.id, studentToDelete.classItem.id);
                  setStudentToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Class Confirmation Modal */}
      {classToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden p-6 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
              <Trash2 className="w-7 h-7 text-rose-600" />
            </div>
            
            <h3 className="font-black text-slate-900 text-lg mb-1.5">
              Xác Nhận Xóa Lớp Học
            </h3>
            
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 my-3.5 text-left">
              <div className="font-extrabold text-slate-900 text-sm">
                {classToDelete.name}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-blue-600">{classToDelete.code}</span>
                <span>•</span>
                <span>GV: {classToDelete.teacher}</span>
                <span>•</span>
                <span>Phòng: {classToDelete.room}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa lớp học này không? Dữ liệu của lớp sẽ được gỡ bỏ khỏi hệ thống.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteClass(classToDelete.id);
                  setClassToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
