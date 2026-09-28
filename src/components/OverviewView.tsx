import React, { useState, useRef } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Sparkles,
  Trophy,
  ArrowRight,
  Plus,
  Star,
  Image as ImageIcon,
  Heart,
  School,
  ChevronRight,
  Camera,
  Upload,
  Trash2,
  Check,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BannerUploadModal } from './BannerUploadModal';
import { compressImageFile } from '../utils/imageUtils';
import { getCurrentSchoolWeek } from '../utils/rankingPeriods';

export const OverviewView: React.FC = () => {
  const {
    config,
    updateConfig,
    students,
    activityLogs,
    setActiveTab,
    openRewardModalForStudent,
    getAttendanceForDate,
    classes,
    activeClassId,
    setActiveClassId,
    activeClass,
    updateClass,
    setIsAddClassModalOpen,
    setIsBackgroundModalOpen,
    weeklyEvaluations,
  } = useApp();

  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isDraggingOverBanner, setIsDraggingOverBanner] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const bannerImage = activeClass?.coverImage || config.coverImage || '';
  const overlayOpacity = config.bannerOverlay ?? 25;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveBanner = (imageUrl: string, overlay: number) => {
    updateConfig({
      coverImage: imageUrl,
      bannerOverlay: overlay
    });
    if (activeClassId) {
      updateClass(activeClassId, { coverImage: imageUrl });
    }
    showToast('Đã cập nhật ảnh banner lớp học thành công! 🎉');
  };

  const handleResetBanner = () => {
    updateConfig({
      coverImage: '',
      bannerOverlay: 25
    });
    if (activeClassId) {
      updateClass(activeClassId, { coverImage: '' });
    }
    showToast('Đã khôi phục banner về mặc định!');
  };

  const handleBannerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverBanner(true);
  };

  const handleBannerDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverBanner(false);
  };

  const handleBannerDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverBanner(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng kéo thả tệp hình ảnh hợp lệ (PNG, JPG, WEBP)!');
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      handleSaveBanner(compressed, overlayOpacity);
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải hình ảnh từ máy tính!');
    }
  };

  const handleDirectFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file);
      handleSaveBanner(compressed, overlayOpacity);
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải hình ảnh từ máy tính!');
    } finally {
      e.target.value = '';
    }
  };

  // Current class students
  const classStudents = students.filter(s => s.classIds?.includes(activeClassId));
  const displayStudents = classStudents.length > 0 ? classStudents : students;

  // Calculate today's attendance metrics
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAtt = getAttendanceForDate(todayStr);

  let presentCount = 0;
  let excusedCount = 0;
  let unexcusedCount = 0;
  let lateCount = 0;

  Object.entries(todayAtt).forEach(([studentId, status]) => {
    // Only count if student is in this class
    if (displayStudents.some(s => s.id === studentId)) {
      if (status === 'present') presentCount++;
      else if (status === 'excused') excusedCount++;
      else if (status === 'unexcused') unexcusedCount++;
      else if (status === 'late') lateCount++;
    }
  });

  // Calculate today's stars awarded
  const todayRewards = activityLogs.filter(log => log.createdAt.includes('Hôm nay'));
  const todayStarsTotal = todayRewards.reduce((sum, log) => (log.points > 0 ? sum + log.points : sum), 0);

  // Top 3 students sorted by stars in active class
  const sortedStudents = [...displayStudents].sort((a, b) => b.stars - a.stars);
  const topStudents = sortedStudents.slice(0, 3);

  // Current school week evaluation metrics
  const currentWeek = getCurrentSchoolWeek();
  const currentWeekEvaluations = weeklyEvaluations.filter(
    e => e.weekNumber === currentWeek && (!activeClassId || e.classId === activeClassId)
  );
  const weekEvaluatedCount = displayStudents.filter(s =>
    currentWeekEvaluations.some(e => e.studentId === s.id)
  ).length;
  const weekHHT = currentWeekEvaluations.filter(e => e.level === 'HHT').length;
  const weekHT = currentWeekEvaluations.filter(e => e.level === 'HT').length;
  const weekCHT = currentWeekEvaluations.filter(e => e.level === 'CHT').length;

  const kpiCards = [
    {
      id: 'kpi-total',
      label: 'SĨ SỐ LỚP HỌC',
      value: displayStudents.length,
      unit: 'học sinh',
      icon: <Users className="w-5 h-5 text-blue-500" />,
      bg: 'bg-blue-50/70',
      border: 'border-blue-100',
      textColor: 'text-blue-700',
      onClick: () => setActiveTab('classes'),
    },
    {
      id: 'kpi-present',
      label: 'CÓ MẶT',
      value: presentCount,
      unit: 'em',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-100',
      textColor: 'text-emerald-700',
      onClick: () => setActiveTab('attendance'),
    },
    {
      id: 'kpi-excused',
      label: 'CÓ PHÉP',
      value: excusedCount,
      unit: 'em',
      icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
      bg: 'bg-amber-50/70',
      border: 'border-amber-100',
      textColor: 'text-amber-700',
      onClick: () => setActiveTab('attendance'),
    },
    {
      id: 'kpi-unexcused',
      label: 'KHÔNG PHÉP',
      value: unexcusedCount,
      unit: 'em',
      icon: <XCircle className="w-5 h-5 text-rose-500" />,
      bg: 'bg-rose-50/70',
      border: 'border-rose-100',
      textColor: 'text-rose-700',
      onClick: () => setActiveTab('attendance'),
    },
    {
      id: 'kpi-late',
      label: 'ĐI MUỘN',
      value: lateCount,
      unit: 'em',
      icon: <Clock className="w-5 h-5 text-purple-500" />,
      bg: 'bg-purple-50/70',
      border: 'border-purple-100',
      textColor: 'text-purple-700',
      onClick: () => setActiveTab('attendance'),
    },
    {
      id: 'kpi-stars',
      label: 'ĐIỂM SAO HÔM NAY',
      value: todayStarsTotal,
      unit: 'sao ⭐',
      icon: <Sparkles className="w-5 h-5 text-yellow-500" />,
      bg: 'bg-yellow-50/70',
      border: 'border-yellow-100',
      textColor: 'text-yellow-700',
      onClick: () => setActiveTab('leaderboard'),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700/60 backdrop-blur-md flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Welcome Banner - Elevated 3D Floating Ocean Theme */}
      <div className="relative group">
        {/* Luminous ambient backglow for physical elevation */}
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-400/30 via-blue-500/30 to-indigo-600/30 rounded-[28px] blur-xl -z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-500" />

        <div
          id="overview-hero-banner"
          onDragOver={handleBannerDragOver}
          onDragLeave={handleBannerDragLeave}
          onDrop={handleBannerDrop}
          className={`relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 lg:p-9 border-2 border-white/80 ring-4 ring-sky-400/20 shadow-[0_20px_50px_-10px_rgba(2,132,199,0.38),0_10px_25px_-5px_rgba(30,58,138,0.25)] hover:shadow-[0_25px_60px_-10px_rgba(2,132,199,0.48),0_15px_30px_-5px_rgba(30,58,138,0.35)] transition-all duration-300 min-h-[220px] sm:min-h-[260px] md:min-h-[280px] flex flex-col justify-between ${
            isDraggingOverBanner
              ? 'ring-6 ring-yellow-400 scale-[0.99] shadow-2xl'
              : 'hover:-translate-y-0.5'
          }`}
        >
          {/* Top specular glass shine highlight */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/90 to-transparent z-20 pointer-events-none" />

          {/* Hidden File Input for fast direct PC upload */}
          <input
            type="file"
            ref={bannerFileInputRef}
            accept="image/png, image/jpeg, image/webp, image/gif"
            onChange={handleDirectFileInput}
            className="hidden"
          />

          {/* Background: Custom Uploaded Image or Radiant Ocean Gradient */}
          {bannerImage ? (
            <>
              <img
                src={bannerImage}
                alt="Banner lớp học"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-transform duration-700 group-hover:scale-[1.01]"
              />
              {/* Ultra-soft gradient at bottom & left so 90% of photo is crystal clear and vivid */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                  background: `linear-gradient(to top, rgba(0, 0, 0, ${Math.min(
                    0.65,
                    (overlayOpacity / 100) * 0.7 + 0.15
                  )}) 0%, rgba(0, 0, 0, ${(overlayOpacity / 100) * 0.25}) 50%, transparent 100%), linear-gradient(to right, rgba(0, 0, 0, ${Math.min(
                    0.55,
                    (overlayOpacity / 100) * 0.6 + 0.1
                  )}) 0%, transparent 60%)`,
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 pointer-events-none">
              {/* Luminous dynamic ambient orbs */}
              <div className="absolute -right-12 -top-12 w-80 h-80 bg-sky-300/35 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute -left-12 -bottom-12 w-80 h-80 bg-cyan-300/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 top-0 w-64 h-36 bg-white/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          {/* Drag & Drop Active Visual Cue */}
          {isDraggingOverBanner && (
            <div className="absolute inset-0 z-30 bg-blue-600/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white border-4 border-dashed border-yellow-300 rounded-3xl animate-in fade-in duration-150">
              <Upload className="w-14 h-14 mb-3 text-yellow-300 animate-bounce" />
              <h4 className="text-2xl font-black mb-1 drop-shadow-md">Thả ảnh vào đây</h4>
              <p className="text-xs text-blue-100 font-bold text-center max-w-md">
                Ảnh sẽ được tự động tối ưu hóa và đặt làm ảnh bìa nổi bật cho lớp học!
              </p>
            </div>
          )}

          {/* Top-Right Floating Banner Controls */}
          <div className="relative z-20 flex items-center justify-end gap-2">
            {bannerImage && (
              <button
                id="overview-remove-banner-btn"
                onClick={handleResetBanner}
                title="Khôi phục nền mặc định"
                className="p-2 bg-black/45 hover:bg-rose-600 text-white backdrop-blur-md rounded-xl text-xs transition-all border border-white/25 shadow-md active:scale-95 hover:scale-105 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              id="overview-wallpaper-studio-badge"
              onClick={() => setIsBackgroundModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black/45 hover:bg-black/65 text-white backdrop-blur-md rounded-xl text-xs font-bold border border-white/25 shadow-md transition-all active:scale-95 hover:scale-105 hover:border-white/50 cursor-pointer"
              title="Mở bảng điều khiển đổi ảnh nền từ máy tính (Thẻ lớp, Wallpaper, Banner)"
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-300" />
              <span>Studio Ảnh Nền</span>
            </button>

            <button
              id="overview-banner-quick-badge"
              onClick={() => setIsBannerModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black/45 hover:bg-black/65 text-white backdrop-blur-md rounded-xl text-xs font-bold border border-white/25 shadow-md transition-all active:scale-95 hover:scale-105 hover:border-white/50 cursor-pointer"
              title="Tải ảnh lên từ máy tính hoặc chọn mẫu"
            >
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              <span>Đổi ảnh banner</span>
            </button>
          </div>

          {/* Streamlined Main Content inside Banner - Positioned at bottom so the full panoramic photo shines */}
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mt-auto">
            {/* Left: Concise Greeting & Class Badge */}
            <div className="space-y-1.5 max-w-xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] flex items-center gap-2">
                <span>Xin chào {config.teacherName}!</span>
                <span className="inline-block animate-wave origin-bottom-right">🌊</span>
              </h2>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="px-3.5 py-1 bg-black/40 hover:bg-black/55 backdrop-blur-md text-amber-300 font-black rounded-full text-xs sm:text-sm flex items-center gap-1.5 border border-white/30 shadow-md">
                  ⭐ {activeClass?.name || config.className}
                </span>
                {activeClass?.room && (
                  <span className="px-3 py-1 bg-black/30 backdrop-blur-md text-white/95 font-semibold rounded-full text-xs border border-white/20 shadow-xs">
                    {activeClass.room}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Sleek Action Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                id="overview-change-cover-btn"
                onClick={() => setActiveTab('classes')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/90 hover:bg-white text-slate-900 font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 hover:scale-105 border border-white/80 cursor-pointer"
              >
                <School className="w-4 h-4 text-blue-600" />
                <span>Quản Lý Lớp</span>
              </button>

              <button
                id="overview-weekly-reviews-btn"
                onClick={() => setActiveTab('weekly-reviews')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600/90 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 hover:scale-105 border border-indigo-400/80 cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Sổ Nhận Xét</span>
              </button>

              <button
                id="overview-quick-reward-btn"
                onClick={() => openRewardModalForStudent()}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl transition-all active:scale-95 hover:scale-105 border border-amber-200 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>+ Thưởng Điểm</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Class Quick-Switch Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-blue-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <School className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800">Lớp học hiện tại:</span>
            <span className="text-xs text-blue-600 font-extrabold ml-1.5">{activeClass?.name}</span>
            <span className="text-[11px] text-slate-400 ml-1.5 hidden sm:inline">
              ({displayStudents.length} học sinh • {activeClass?.grade})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {classes.map((cls) => {
            const isSelected = activeClassId === cls.id;
            return (
              <button
                key={cls.id}
                onClick={() => setActiveClassId(cls.id)}
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
            id="overview-add-class-btn"
            onClick={() => setIsAddClassModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm lớp</span>
          </button>
        </div>
      </div>

      {/* Weekly Evaluation Fast Quick Widget */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-white p-4 rounded-2xl border border-indigo-100/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
            <Award className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800">
                NHẬN XÉT TUẦN NÀY (TUẦN {currentWeek}):
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold text-[11px]">
                {weekEvaluatedCount} / {displayStudents.length} học sinh
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium pt-0.5">
              <span className="text-emerald-700 font-bold">🌟 HHT: {weekHHT}</span>
              <span>•</span>
              <span className="text-sky-700 font-bold">✅ HT: {weekHT}</span>
              <span>•</span>
              <span className="text-rose-700 font-bold">⚠️ CHT: {weekCHT}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('weekly-reviews')}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Vào Sổ Nhận Xét Tuần {currentWeek}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {kpiCards.map((kpi) => (
          <button
            key={kpi.id}
            id={kpi.id}
            onClick={kpi.onClick}
            className={`p-4 rounded-2xl border ${kpi.border} ${kpi.bg} flex flex-col justify-between text-left transition-all hover:scale-[1.02] hover:shadow-sm cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 truncate">{kpi.label}</span>
              {kpi.icon}
            </div>
            <div>
              <div className={`text-2xl font-black ${kpi.textColor}`}>
                {kpi.value}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {kpi.unit}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 2 Columns: Top Students and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Top Students (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-blue-100 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-xl text-yellow-600">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  TOP HỌC SINH NỔI BẬT ({activeClass?.name})
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Học sinh tích lũy sao cao nhất
                </p>
              </div>
            </div>

            <button
              id="view-all-leaderboard-btn"
              onClick={() => setActiveTab('leaderboard')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Chưa có học sinh nào trong lớp này.
              </div>
            ) : (
              topStudents.map((student, index) => {
                const medalColors = [
                  'bg-amber-100 text-amber-700 border-amber-300 ring-2 ring-amber-200',
                  'bg-slate-100 text-slate-700 border-slate-300',
                  'bg-orange-100 text-orange-700 border-orange-300',
                ];

                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border ${medalColors[index] || 'bg-slate-100'}`}
                      >
                        {index + 1}
                      </div>

                      <div className="w-10 h-10 rounded-full bg-white border border-blue-200 flex items-center justify-center text-xl shadow-2xs">
                        {student.avatar}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-800 truncate max-w-[150px]">
                          {student.name}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          {student.code} • {student.gender}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 font-extrabold text-xs flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{student.stars} ⭐</span>
                      </div>

                      <button
                        onClick={() => openRewardModalForStudent(student)}
                        title="Thưởng sao cho học sinh này"
                        className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => setActiveTab('classes')}
              className="w-full py-2.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-100/70 hover:bg-blue-50 rounded-xl transition-all"
            >
              Quản lý danh sách lớp học ({displayStudents.length} học sinh)
            </button>
          </div>
        </div>

        {/* Right Column: Recent Activity (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-blue-100 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  HOẠT ĐỘNG GẦN ĐÂY
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Nhật ký thưởng phạt và đổi quà của học sinh
                </p>
              </div>
            </div>

            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 font-bold rounded-full">
              {activityLogs.length} sự kiện
            </span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
            {activityLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Chưa có hoạt động khen thưởng nào gần đây.
              </div>
            ) : (
              activityLogs.map((log) => {
                const isPositive = log.points > 0;
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-100 bg-white hover:bg-slate-50/80 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        {isPositive ? <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" /> : <Heart className="w-4 h-4 text-rose-500" />}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">
                          {log.studentName}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate">
                          {log.reason}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <div
                        className={`font-black text-xs ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+${log.points} ⭐` : `${log.points} ⭐`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.createdAt}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Banner Upload / Customizer Modal */}
      <BannerUploadModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        currentImage={bannerImage}
        currentOverlay={overlayOpacity}
        onSave={handleSaveBanner}
        onReset={handleResetBanner}
        teacherName={config.teacherName}
        className={activeClass?.name || config.className}
      />
    </div>
  );
};
