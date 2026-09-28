import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import { StudentModal } from './StudentModal';
import { QuickRewardModal } from './QuickRewardModal';
import {
  Users,
  Plus,
  Search,
  Award,
  Phone,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  Download,
  Filter,
  Sparkles
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const { students, classes, deleteStudent, profile } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [rewardingStudent, setRewardingStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter((s) => {
    if (selectedClassFilter !== 'all' && !s.classIds.includes(selectedClassFilter)) return false;
    if (selectedStatusFilter !== 'all' && s.status !== selectedStatusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.parentName.toLowerCase().includes(q) ||
        s.parentPhone.includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEdit = (stu: Student) => {
    setEditingStudent(stu);
    setIsStudentModalOpen(true);
  };

  const handleOpenReward = (stu: Student) => {
    setRewardingStudent(stu);
    setIsRewardModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Mã HS,Họ và Tên,Giới tính,Ngày sinh,SĐT Học sinh,Phụ huynh,SĐT Phụ huynh,Điểm Bee,Chuyên cần %,Trạng thái'];
    const rows = filteredStudents.map((s) =>
      [
        s.code,
        `"${s.name}"`,
        s.gender === 'male' ? 'Nam' : 'Nữ',
        s.dob,
        s.phone,
        `"${s.parentName}"`,
        s.parentPhone,
        s.stars,
        `${s.attendanceRate}%`,
        s.status === 'studying' ? 'Đang học' : s.status === 'trial' ? 'Học thử' : 'Bảo lưu',
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_Sach_Hoc_Sinh_Lop_Hoc_Than_Thien_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <span>{profile.centerName || 'Lớp học Thầy Nhân'}</span>
            <span>/</span>
            <span className="text-slate-500">Hồ sơ học sinh</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hồ Sơ Học Sinh</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              {filteredStudents.length} học sinh
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý thông tin liên lạc phụ huynh, lớp tham gia, điểm sao khen thưởng và tỷ lệ chuyên cần
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Xuất file Excel/CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm học sinh mới</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên học sinh, mã số, SĐT phụ huynh..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500"
          >
            <option value="all">-- Lọc theo lớp học --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500"
          >
            <option value="all">-- Trạng thái học viên --</option>
            <option value="studying">Đang học chính thức</option>
            <option value="trial">Học thử</option>
            <option value="reserved">Bảo lưu</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-blue-50/60 text-slate-800 font-bold uppercase tracking-wider text-[11px] border-b border-blue-100">
              <tr>
                <th className="px-4 py-3">Học sinh</th>
                <th className="px-4 py-3">Mã học sinh</th>
                <th className="px-4 py-3">Lớp đang học</th>
                <th className="px-4 py-3">Liên hệ phụ huynh</th>
                <th className="px-4 py-3 text-center">Sao tích lũy</th>
                <th className="px-4 py-3 text-center">Chuyên cần</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => {
                  const enrolledClasses = classes.filter((c) => stu.classIds.includes(c.id));
                  return (
                    <tr key={stu.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={stu.avatar}
                            alt={stu.name}
                            className="w-9 h-9 rounded-full object-cover border border-blue-200 shadow-2xs"
                          />
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs">{stu.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {stu.gender === 'male' ? 'Nam' : 'Nữ'} • {stu.dob}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-600">
                        {stu.code}
                      </td>

                      {/* Classes */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {enrolledClasses.map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                              style={{
                                backgroundColor: `${c.color}15`,
                                borderColor: `${c.color}40`,
                                color: c.color,
                              }}
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Parent */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900">{stu.parentName}</div>
                        <a
                          href={`tel:${stu.parentPhone}`}
                          className="text-[11px] text-blue-700 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{stu.parentPhone}</span>
                        </a>
                      </td>

                      {/* Star points */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleOpenReward(stu)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 font-black text-xs transition-colors cursor-pointer border border-amber-200 shadow-2xs"
                          title="Tặng hoặc trừ sao rèn luyện"
                        >
                          <span>⭐</span>
                          <span>{stu.stars}</span>
                          <span className="text-[10px] text-amber-700 font-semibold">+ Thưởng</span>
                        </button>
                      </td>

                      {/* Attendance */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {stu.attendanceRate}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            stu.status === 'studying'
                              ? 'bg-emerald-100 text-emerald-800'
                              : stu.status === 'trial'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {stu.status === 'studying'
                            ? 'Chính thức'
                            : stu.status === 'trial'
                            ? 'Học thử'
                            : 'Bảo lưu'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenReward(stu)}
                            className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                            title="Khen thưởng nhanh"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(stu)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa học sinh "${stu.name}"?`)) {
                                deleteStudent(stu.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa học sinh"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Student Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        studentToEdit={editingStudent}
      />

      {/* Quick Reward Modal */}
      <QuickRewardModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        student={rewardingStudent}
      />
    </div>
  );
};
