import React, { useState } from 'react';
import { useApp, ActiveTab } from '../context/AppContext';
import {
  CalendarDays,
  GraduationCap,
  Users,
  CheckSquare,
  Award,
  Sparkles,
  BarChart3,
  RotateCcw,
  Clock,
  ChevronRight,
  Menu,
  X,
  SlidersHorizontal,
  HeartHandshake
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    resetToDefaultData,
    classes,
    schedules,
    students,
    profile,
    setIsPersonalizeModalOpen,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Current time display
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'schedule', label: 'Thời khóa biểu', icon: CalendarDays, badge: schedules.length },
    { id: 'classes', label: 'Lớp học', icon: GraduationCap, badge: classes.length },
    { id: 'students', label: 'Học sinh', icon: Users, badge: students.length },
    { id: 'attendance', label: 'Điểm danh', icon: CheckSquare },
    { id: 'rewards', label: 'Khen thưởng', icon: Award },
    { id: 'tools', label: 'Góc tương tác', icon: Sparkles },
    { id: 'analytics', label: 'Thống kê', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs">
      {/* Top utility ribbon */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-1.5 text-xs font-medium flex items-center justify-between">
        <div className="flex items-center space-x-3 truncate">
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-bold">{profile.centerName || 'Quản lí lớp học thân thiện'}</span>
          </span>
          <span className="hidden md:inline text-amber-950/40">•</span>
          <span className="hidden md:inline text-slate-900 font-medium truncate max-w-md italic">
            "{profile.motto || 'Mỗi ngày đến trường là một ngày vui'}"
          </span>
          <span className="hidden xl:inline text-amber-950/40">•</span>
          <span className="hidden xl:flex items-center gap-1 text-slate-800">
            <Clock className="w-3.5 h-3.5" />
            <span className="capitalize">{dateStr}</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsPersonalizeModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 hover:bg-slate-900 font-bold transition-all text-[11px] shadow-xs cursor-pointer"
            title="Tùy chỉnh thông tin giáo viên, tên lớp và phong cách giao diện"
          >
            <SlidersHorizontal className="w-3 h-3 text-amber-400" />
            <span>Cá nhân hóa</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Bạn có muốn khôi phục dữ liệu mẫu ban đầu không?')) {
                resetToDefaultData();
              }
            }}
            title="Khôi phục dữ liệu mẫu"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-600/20 hover:bg-amber-600/30 text-slate-900 transition-colors cursor-pointer text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Đặt lại mẫu</span>
          </button>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setActiveTab('schedule')}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black shadow-md shadow-amber-400/30 border border-amber-300">
              <span className="text-xl">🌸</span>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900">
                  Quản lí lớp học <span className="text-amber-600">thân thiện</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded-md border border-amber-200">
                  Hạnh phúc
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Dễ dùng • Trực quan • Gắn kết Thầy & Trò
              </p>
            </div>
          </div>

          {/* Desktop tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-xs shadow-amber-500/20 font-bold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-amber-600 text-slate-950'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Personalized User profile button & mobile trigger */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPersonalizeModalOpen(true)}
              className="group hidden sm:flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 transition-all cursor-pointer text-left"
              title="Nhấn để đổi tên, ảnh và thông tin của bạn"
            >
              <img
                src={profile.avatar}
                alt={profile.teacherName}
                className="w-8 h-8 rounded-full border border-amber-400 object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                }}
              />
              <div className="leading-tight hidden md:block">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                    {profile.teacherName}
                  </span>
                  <SlidersHorizontal className="w-3 h-3 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </div>
                <span className="text-[10px] text-amber-700 font-medium block">
                  {profile.teacherTitle}
                </span>
              </div>
            </button>

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {/* Mobile Profile bar */}
          <div
            onClick={() => {
              setIsPersonalizeModalOpen(true);
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 mb-2 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={profile.avatar}
                alt={profile.teacherName}
                className="w-9 h-9 rounded-full object-cover border border-amber-400"
              />
              <div>
                <div className="text-xs font-bold text-slate-900">{profile.teacherName}</div>
                <div className="text-[10px] text-amber-700 font-medium">{profile.teacherTitle}</div>
              </div>
            </div>
            <span className="text-xs text-amber-800 font-bold bg-amber-200 px-2.5 py-1 rounded-lg">
              Tùy chỉnh
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge !== undefined && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
