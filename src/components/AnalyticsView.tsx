import React from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  Users,
  GraduationCap,
  CalendarDays,
  Award,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { classes, students, schedules, attendance, rewards, profile } = useApp();

  const totalClasses = classes.length;
  const totalStudents = students.length;
  const totalWeeklySessions = schedules.length;

  const totalStars = students.reduce((acc, s) => acc + s.stars, 0);

  // Overall attendance rate
  const totalAttendanceRecords = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const overallAttendanceRate =
    totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 95;

  // Day distribution
  const dayCounts = [2, 3, 4, 5, 6, 7, 8].map((day) => {
    const names = ['', '', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const count = schedules.filter((s) => s.dayOfWeek === day).length;
    return { name: names[day], count };
  });

  const maxDayCount = Math.max(...dayCounts.map((d) => d.count), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <span>{profile.centerName || 'Lớp học Thầy Nhân'}</span>
            <span>/</span>
            <span className="text-slate-500">Báo cáo & Phân tích</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Thống Kê Đào Tạo</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Tổng quan hiệu suất 📊
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp dữ liệu thời khóa biểu, chuyên cần, phân bổ lớp học và mức độ khen thưởng của học sinh
          </p>
        </div>
      </div>

      {/* 4 Big KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Tổng lớp học đang mở</span>
            <span className="text-2xl font-black text-slate-900">{totalClasses} lớp</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-sky-50 text-sky-700 font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Tổng số học sinh</span>
            <span className="text-2xl font-black text-slate-900">{totalStudents} học sinh</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Tỷ lệ chuyên cần chung</span>
            <span className="text-2xl font-black text-emerald-600">{overallAttendanceRate}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Sao đã khen thưởng</span>
            <span className="text-2xl font-black text-slate-900">⭐ {totalStars} sao</span>
          </div>
        </div>
      </div>

      {/* Grid: Weekly Schedule Density & Class Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Schedule Density */}
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Mật Độ Buổi Học Trong Tuần ({totalWeeklySessions} buổi/tuần)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Phân bố ca dạy</span>
          </div>

          <div className="space-y-3 pt-2">
            {dayCounts.map((d) => {
              const pct = Math.round((d.count / maxDayCount) * 100);
              return (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{d.name}</span>
                    <span className="font-black text-slate-900">
                      {d.count} buổi ({d.count > 0 ? `${d.count * 1.5} giờ` : 'Trống'})
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all bg-gradient-to-r from-blue-500 to-sky-400"
                      style={{ width: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Class Capacity Utilization */}
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Tỷ Lệ Lấp Đầy Lớp Học (Sĩ Số / Sức Chứa)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Tối ưu phòng học</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {classes.map((cls) => {
              const classStudents = students.filter((s) => s.classIds.includes(cls.id));
              const count = classStudents.length || cls.currentStudents;
              const pct = Math.min(100, Math.round((count / cls.maxStudents) * 100));

              return (
                <div key={cls.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{cls.name}</span>
                      <span className="text-[11px] text-slate-500 ml-2">({cls.room})</span>
                    </div>
                    <span className="font-bold text-slate-800">
                      {count} / {cls.maxStudents} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cls.color || '#f59e0b',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
