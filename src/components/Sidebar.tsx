import React, { useState, useRef } from 'react';
import {
  Home,
  School,
  GraduationCap,
  ClipboardCheck,
  Star,
  Sparkles,
  Trophy,
  Gift,
  BarChart3,
  Mic,
  Timer,
  Settings,
  Calendar,
  Volume2,
  VolumeX,
  Save,
  Sliders,
  Plus,
  ChevronDown,
  Users,
  Image as ImageIcon,
  Camera,
  Upload,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppTab } from '../types';
import { compressImageFile } from '../utils/imageUtils';

interface NavItem {
  id: AppTab;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    config,
    updateConfig,
    soundEnabled,
    toggleSound,
    triggerManualSave,
    saveStatus,
    students,
    classes,
    activeClassId,
    setActiveClassId,
    setIsAddClassModalOpen,
    redemptions,
    isBackgroundModalOpen,
    setIsBackgroundModalOpen,
    showToast,
    playSound,
  } = useApp();

  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const directFileInputRef = useRef<HTMLInputElement>(null);

  const activeClass = classes.find(c => c.id === activeClassId) || classes[0];

  const handleDirectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 1600, 0.85);
      updateConfig({
        headerCardBg: compressed,
        headerCardBgOverlay: config.headerCardBgOverlay ?? 30,
      });
      playSound('praise');
      showToast('Đã đổi ảnh nền thẻ lớp học từ máy tính thành công! 🎉', 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải ảnh từ máy tính!', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const currentTeacherName =
    config.teacherName && config.teacherName !== 'Cô Giáo Nga'
      ? config.teacherName
      : 'Thầy Nhân';

  const currentTeacherAvatar =
    config.teacherAvatar && !config.teacherAvatar.includes('NgaTeacher')
      ? config.teacherAvatar
      : 'https://api.dicebear.com/7.x/bottts/svg?seed=ThayNhanTeacher&backgroundColor=bae6fd';

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Tổng quan', icon: <Home className="w-5 h-5 text-sky-500" /> },
    { id: 'classes', label: 'Quản lý Lớp học', icon: <School className="w-5 h-5 text-blue-500" />, badge: classes.length },
    { id: 'attendance', label: 'Điểm danh', icon: <ClipboardCheck className="w-5 h-5 text-emerald-500" /> },
    { id: 'weekly-reviews', label: 'Sổ nhận xét (HHT/HT/CHT)', icon: <Award className="w-5 h-5 text-indigo-500" /> },
    { id: 'criteria', label: 'Tiêu chí thi đua', icon: <Star className="w-5 h-5 text-amber-500" /> },
    { id: 'lucky-wheel', label: 'Gọi tên may mắn', icon: <Sparkles className="w-5 h-5 text-purple-500" /> },
    { id: 'groups', label: 'Chia nhóm lớp học', icon: <Users className="w-5 h-5 text-indigo-500" /> },
    { id: 'gifts', label: 'Đổi quà', icon: <Gift className="w-5 h-5 text-pink-500" />, badge: redemptions.length > 0 ? redemptions.length : undefined },
    { id: 'leaderboard', label: 'Bảng xếp hạng', icon: <BarChart3 className="w-5 h-5 text-cyan-500" /> },
    { id: 'noise-meter', label: 'Đo tiếng ồn', icon: <Mic className="w-5 h-5 text-teal-500" /> },
    { id: 'timer', label: 'Đồng hồ đếm ngược', icon: <Timer className="w-5 h-5 text-orange-500" /> },
    { id: 'settings', label: 'Cài đặt & Sao lưu', icon: <Settings className="w-5 h-5 text-slate-500" /> },
    { id: 'schedule', label: 'Thời khóa biểu', icon: <Calendar className="w-5 h-5 text-blue-400" /> },
  ];

  return (
    <aside
      id="main-sidebar"
      className="w-72 bg-white border-r border-blue-100 flex flex-col h-screen shrink-0 select-none shadow-sm z-30"
    >
      {/* Top Branding & Teacher Card */}
      <div className="p-4 border-b border-blue-100/70 bg-gradient-to-b from-blue-50/70 to-white">
        {/* Hidden File Input for 1-Click Direct Upload */}
        <input
          type="file"
          ref={directFileInputRef}
          accept="image/png, image/jpeg, image/webp, image/gif"
          onChange={handleDirectImageUpload}
          className="hidden"
        />

        <div
          id="sidebar-classroom-branding-card"
          className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group transition-all"
        >
          {/* Custom Header Card Background Image if configured */}
          {config.headerCardBg && (
            <div
              className="absolute inset-0 bg-cover bg-center transition-all pointer-events-none"
              style={{ backgroundImage: `url(${config.headerCardBg})` }}
            >
              <div
                className="absolute inset-0 bg-white transition-opacity"
                style={{ opacity: (100 - (config.headerCardBgOverlay ?? 30)) / 100 }}
              />
            </div>
          )}

          {/* Teacher Avatar */}
          <div className="relative shrink-0 z-10">
            <div className="w-12 h-12 rounded-full ring-2 ring-blue-400 p-0.5 bg-blue-100 flex items-center justify-center overflow-hidden shadow-xs">
              <img
                src={currentTeacherAvatar}
                alt={currentTeacherName}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://api.dicebear.com/7.x/bottts/svg?seed=ThayNhanTeacher&backgroundColor=bae6fd';
                }}
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          {/* Branding Texts */}
          <div className="flex-1 min-w-0 z-10">
            <h1 className="text-base font-extrabold text-slate-900 truncate tracking-tight drop-shadow-2xs">
              {config.appName}
            </h1>
            <p className="text-xs text-blue-700 font-bold truncate">
              {activeClass?.name || config.className}
            </p>
            <p className="text-[11px] text-slate-600 truncate mt-0.5">
              GV: <span className="font-bold text-slate-900">{currentTeacherName}</span>
            </p>
          </div>

          {/* Action Buttons: Change Background + Class Settings */}
          <div className="flex items-center gap-1 z-10">
            <button
              id="sidebar-change-bg-btn"
              type="button"
              onClick={() => setIsBackgroundModalOpen(true)}
              title="Đổi ảnh nền từ máy tính (Thẻ lớp & Toàn màn hình)"
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100/70 bg-blue-50/70 rounded-lg transition-colors cursor-pointer border border-blue-200/60 shadow-2xs"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              id="sidebar-quick-config-btn"
              type="button"
              onClick={() => setActiveTab('settings')}
              title="Cài đặt thông tin lớp"
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Class Switcher Dropdown */}
        <div className="mt-2.5 relative">
          <div className="flex items-center gap-1.5">
            <button
              id="sidebar-class-switcher-btn"
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className="flex-1 flex items-center justify-between px-3 py-1.5 bg-blue-50/80 hover:bg-blue-100/70 border border-blue-200/70 rounded-xl text-xs font-semibold text-blue-800 transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeClass?.color || '#0284c7' }}
                />
                <span className="truncate">{activeClass?.name || config.className}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-blue-600 transition-transform ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <button
              id="sidebar-add-class-btn"
              onClick={() => setIsAddClassModalOpen(true)}
              title="Thêm lớp học mới"
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Class Select Menu */}
          {isClassDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-100 rounded-xl shadow-lg p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Chọn lớp giảng dạy
              </div>
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => {
                    setActiveClassId(cls.id);
                    setIsClassDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    activeClassId === cls.id
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cls.color || '#0284c7' }}
                    />
                    <span className="truncate">{cls.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {cls.grade}
                  </span>
                </button>
              ))}

              <button
                onClick={() => {
                  setIsClassDropdownOpen(false);
                  setIsAddClassModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 mt-1 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm lớp học mới</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 font-bold'
                  : 'text-slate-700 hover:bg-blue-50/80 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-transform ${isActive ? 'scale-110 text-white' : ''}`}>
                  {isActive ? React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5 text-white' }) : item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Controls */}
      <div className="p-3 border-t border-blue-100 bg-blue-50/40 space-y-2">
        {/* Sound toggle */}
        <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-blue-100 text-xs font-medium text-slate-700 shadow-2xs">
          <div className="flex items-center gap-2">
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
            <span>Âm thanh hiệu ứng</span>
          </div>
          <button
            id="sidebar-sound-toggle"
            onClick={toggleSound}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              soundEnabled
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {soundEnabled ? 'BẬT' : 'TẮT'}
          </button>
        </div>

        {/* Save button */}
        <button
          id="sidebar-manual-save-btn"
          onClick={triggerManualSave}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-200 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>LƯU DỮ LIỆU</span>
          <span className="text-[10px] bg-blue-800/40 px-2 py-0.5 rounded-full font-medium ml-1">
            {saveStatus}
          </span>
        </button>
      </div>
    </aside>
  );
};
