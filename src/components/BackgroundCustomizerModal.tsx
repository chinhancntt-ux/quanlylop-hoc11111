import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  AlertCircle,
  Eye,
  Trash2,
  Camera,
  Layers,
  Palette,
  Monitor,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { compressImageFile } from '../utils/imageUtils';

type BackgroundTargetTab = 'header-card' | 'wallpaper' | 'banner';

const WALLPAPER_PRESETS = [
  {
    id: 'classroom-sunshine',
    title: 'Lớp Học Nắng Mai',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&auto=format&fit=crop&q=80',
    tag: 'Trường học'
  },
  {
    id: 'blue-sky-clouds',
    title: 'Bầu Trời Ước Mơ',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
    tag: 'Bầu trời'
  },
  {
    id: 'chalkboard-green',
    title: 'Bảng Xanh Kỷ Niệm',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&auto=format&fit=crop&q=80',
    tag: 'Học tập'
  },
  {
    id: 'green-nature',
    title: 'Khu Vườn Ươm Mầm',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&auto=format&fit=crop&q=80',
    tag: 'Thiên nhiên'
  },
  {
    id: 'galaxy-stars',
    title: 'Dải Ngân Hà Tri Thức',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    tag: 'Vũ trụ'
  },
  {
    id: 'library-books',
    title: 'Góc Sách Thân Thương',
    url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&auto=format&fit=crop&q=80',
    tag: 'Thư viện'
  }
];

export const BackgroundCustomizerModal: React.FC = () => {
  const {
    config,
    updateConfig,
    activeClass,
    isBackgroundModalOpen,
    setIsBackgroundModalOpen,
    playSound,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<BackgroundTargetTab>('header-card');

  // Working state for Header Card Background
  const [headerCardBg, setHeaderCardBg] = useState<string>(config.headerCardBg || '');
  const [headerCardOverlay, setHeaderCardOverlay] = useState<number>(config.headerCardBgOverlay ?? 30);

  // Working state for App Wallpaper
  const [appWallpaper, setAppWallpaper] = useState<string>(config.appWallpaper || '');
  const [wallpaperOpacity, setWallpaperOpacity] = useState<number>(config.wallpaperOpacity ?? 20);
  const [wallpaperBlur, setWallpaperBlur] = useState<number>(config.wallpaperBlur ?? 0);

  // Working state for Classroom Banner
  const [bannerBg, setBannerBg] = useState<string>(activeClass?.coverImage || config.coverImage || '');
  const [bannerOverlay, setBannerOverlay] = useState<number>(config.bannerOverlay ?? 25);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isBackgroundModalOpen) {
      setHeaderCardBg(config.headerCardBg || '');
      setHeaderCardOverlay(config.headerCardBgOverlay ?? 30);
      setAppWallpaper(config.appWallpaper || '');
      setWallpaperOpacity(config.wallpaperOpacity ?? 20);
      setWallpaperBlur(config.wallpaperBlur ?? 0);
      setBannerBg(activeClass?.coverImage || config.coverImage || '');
      setBannerOverlay(config.bannerOverlay ?? 25);
      setErrorMsg('');
    }
  }, [isBackgroundModalOpen, config, activeClass]);

  if (!isBackgroundModalOpen) return null;

  const handleFilePicked = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP)!');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      // Compress image for safe local storage
      const compressedDataUrl = await compressImageFile(file, 1600, 0.85);

      if (activeTab === 'header-card') {
        setHeaderCardBg(compressedDataUrl);
      } else if (activeTab === 'wallpaper') {
        setAppWallpaper(compressedDataUrl);
      } else {
        setBannerBg(compressedDataUrl);
      }
      showToast('Đã nạp ảnh từ máy tính thành công! Hãy bấm Lưu thay đổi.', 'success');
    } catch (err) {
      console.error(err);
      setErrorMsg('Lỗi khi nén và xử lý hình ảnh từ máy tính. Vui lòng thử lại!');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFilePicked(file);
    }
  };

  const handleSaveAll = () => {
    updateConfig({
      headerCardBg: headerCardBg.trim(),
      headerCardBgOverlay: headerCardOverlay,
      appWallpaper: appWallpaper.trim(),
      wallpaperOpacity,
      wallpaperBlur,
      coverImage: bannerBg.trim(),
      bannerOverlay,
    });

    playSound('praise');
    showToast('Đã lưu cài đặt ảnh nền thành công! 🎉', 'success');
    setIsBackgroundModalOpen(false);
  };

  const handleResetCurrentTab = () => {
    if (activeTab === 'header-card') {
      setHeaderCardBg('');
      setHeaderCardOverlay(30);
    } else if (activeTab === 'wallpaper') {
      setAppWallpaper('');
      setWallpaperOpacity(20);
      setWallpaperBlur(0);
    } else {
      setBannerBg('');
      setBannerOverlay(25);
    }
    showToast('Đã đưa ảnh nền về mặc định ban đầu!', 'info');
  };

  const currentTeacherName = config.teacherName || 'Thầy Nhân';
  const currentClassName = activeClass?.name || config.className || 'Lớp 4A - Ngôi Sao Sáng';
  const currentAvatar =
    config.teacherAvatar && !config.teacherAvatar.includes('NgaTeacher')
      ? config.teacherAvatar
      : 'https://api.dicebear.com/7.x/bottts/svg?seed=ThayNhanTeacher&backgroundColor=bae6fd';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png, image/jpeg, image/webp, image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFilePicked(file);
          }}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 p-5 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <ImageIcon className="w-6 h-6 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Thay Đổi Ảnh Nền Từ Máy Tính</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-wider">
                  Mới
                </span>
              </div>
              <p className="text-xs text-sky-100 font-medium mt-0.5">
                Tải ảnh nền cho Thẻ lớp học, Hình nền toàn giao diện hoặc Banner lớp học
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsBackgroundModalOpen(false)}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center border-b border-slate-100 bg-slate-50/80 px-5 pt-2.5 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('header-card')}
            className={`pb-2.5 px-3.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'header-card'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Ảnh Nền Thẻ Lớp Học</span>
            {headerCardBg && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wallpaper')}
            className={`pb-2.5 px-3.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'wallpaper'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>2. Ảnh Nền Toàn Giao Diện (Wallpaper)</span>
            {appWallpaper && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banner')}
            className={`pb-2.5 px-3.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'banner'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>3. Ảnh Banner Bìa Lớp Học</span>
            {bannerBg && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: HEADER CARD BACKGROUND */}
          {activeTab === 'header-card' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span>Ảnh Nền Cho Thẻ "{config.appName || 'VƯỜN ƯỚC MƠ'}"</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold">
                      Góc trái Sidebar
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ảnh sẽ hiển thị trực tiếp làm nền cho thẻ tên lớp học ở thanh điều hướng bên trái
                  </p>
                </div>

                {headerCardBg && (
                  <button
                    type="button"
                    onClick={handleResetCurrentTab}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa ảnh nền thẻ</span>
                  </button>
                )}
              </div>

              {/* Upload Dropzone from Computer */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                    : 'border-blue-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                  {isProcessing ? (
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <h4 className="text-sm font-black text-blue-900 mb-1">
                  Bấm để chọn tệp hình ảnh từ máy tính của bạn
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hỗ trợ kéo & thả tệp <strong>PNG, JPG, WEBP, GIF</strong>. Tự động nén tối ưu để bảo đảm tốc độ siêu mượt.
                </p>
              </div>

              {/* Live Preview Box */}
              <div className="bg-slate-100/90 rounded-2xl p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Xem Trước Trực Quan Thẻ Sau Khi Đổi Ảnh Nền:</span>
                  </span>
                  {headerCardBg && (
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Đã có ảnh nền riêng</span>
                    </span>
                  )}
                </div>

                {/* Simulated Widget Card */}
                <div className="max-w-xs mx-auto py-2">
                  <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-blue-200 shadow-md relative overflow-hidden transition-all">
                    {/* Background layer */}
                    {headerCardBg && (
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-all"
                        style={{ backgroundImage: `url(${headerCardBg})` }}
                      >
                        {/* Overlay to ensure readability */}
                        <div
                          className="absolute inset-0 bg-white transition-opacity"
                          style={{ opacity: (100 - headerCardOverlay) / 100 }}
                        />
                      </div>
                    )}

                    {/* Card Content (Relative above background) */}
                    <div className="relative shrink-0 z-10">
                      <div className="w-12 h-12 rounded-full ring-2 ring-blue-400 p-0.5 bg-blue-100 flex items-center justify-center overflow-hidden shadow-xs">
                        <img
                          src={currentAvatar}
                          alt={currentTeacherName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>

                    <div className="flex-1 min-w-0 relative z-10">
                      <h1 className="text-base font-extrabold text-slate-900 truncate tracking-tight drop-shadow-xs">
                        {config.appName || 'VƯỜN ƯỚC MƠ'}
                      </h1>
                      <p className="text-xs text-blue-700 font-bold truncate">
                        {currentClassName}
                      </p>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">
                        GV: <span className="font-bold text-slate-900">{currentTeacherName}</span>
                      </p>
                    </div>

                    <div className="p-1.5 text-slate-500 bg-white/80 rounded-lg shadow-2xs relative z-10">
                      <Sliders className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Overlay Slider */}
                {headerCardBg && (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-4">
                    <div className="text-xs">
                      <span className="font-bold text-slate-700 block">Độ Rõ Của Ảnh Nền Thẻ:</span>
                      <span className="text-[11px] text-slate-500">
                        (Kéo tăng để ảnh nền rõ hơn, kéo giảm để nền nhạt hơn dễ đọc chữ)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="10"
                        max="85"
                        value={headerCardOverlay}
                        onChange={(e) => setHeaderCardOverlay(Number(e.target.value))}
                        className="w-32 accent-blue-600 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-black text-blue-700 w-9 text-right">
                        {headerCardOverlay}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: APP WALLPAPER BACKGROUND */}
          {activeTab === 'wallpaper' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span>Hình Nền Toàn Giao Diện Ứng Dụng (Wallpaper)</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 font-bold">
                      Toàn màn hình
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tạo không gian lớp học tràn đầy cảm hứng với ảnh nền mờ dịu mắt cho cả màn hình
                  </p>
                </div>

                {appWallpaper && (
                  <button
                    type="button"
                    onClick={handleResetCurrentTab}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa hình nền</span>
                  </button>
                )}
              </div>

              {/* Upload Dropzone from Computer */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                    : 'border-blue-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-blue-900 mb-1">
                  Chọn ảnh nền từ máy tính (ảnh lớp học, thiên nhiên, tranh vẽ)
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tự động làm mờ nhẹ nhàng để không làm mỏi mắt học sinh khi học tập.
                </p>
              </div>

              {/* Preset Wallpapers */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-700 block">
                  Hoặc chọn nhanh từ bộ sưu tập hình nền gợi ý:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {WALLPAPER_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAppWallpaper(p.url)}
                      className={`relative rounded-xl overflow-hidden h-20 border-2 transition-all cursor-pointer text-left group ${
                        appWallpaper === p.url
                          ? 'border-blue-600 ring-2 ring-blue-300 scale-[1.02]'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <img
                        src={p.url}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2">
                        <span className="text-[11px] font-bold text-white truncate drop-shadow-xs">
                          {p.title}
                        </span>
                      </div>
                      {appWallpaper === p.url && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallpaper Sliders */}
              {appWallpaper && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Độ Hiện Rõ Của Hình Nền (Opacity):</span>
                      <span className="text-[11px] text-slate-500">Khuyên dùng 15% - 25% để bảng điểm và chữ dễ đọc</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="5"
                        max="60"
                        value={wallpaperOpacity}
                        onChange={(e) => setWallpaperOpacity(Number(e.target.value))}
                        className="w-32 accent-blue-600 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-black text-blue-700 w-9 text-right">
                        {wallpaperOpacity}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200/80">
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Độ Làm Mờ (Blur):</span>
                      <span className="text-[11px] text-slate-500">Tạo chiều sâu không gian học tập mềm mại</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="8"
                        value={wallpaperBlur}
                        onChange={(e) => setWallpaperBlur(Number(e.target.value))}
                        className="w-32 accent-blue-600 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-black text-blue-700 w-9 text-right">
                        {wallpaperBlur}px
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLASSROOM BANNER */}
          {activeTab === 'banner' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span>Ảnh Banner Bìa Lớp Học (Overview)</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold">
                      Trang Tổng quan
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Banner rực rỡ ở đầu trang Tổng quan vinh danh lớp học
                  </p>
                </div>

                {bannerBg && (
                  <button
                    type="button"
                    onClick={handleResetCurrentTab}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Về mặc định</span>
                  </button>
                )}
              </div>

              {/* Upload Dropzone from Computer */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                    : 'border-blue-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-blue-900 mb-1">
                  Chọn ảnh banner từ máy tính
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Khuyên dùng ảnh phong cảnh hoặc ảnh tập thể lớp nằm ngang (tỷ lệ 16:9 hoặc 3:1).
                </p>
              </div>

              {/* Banner Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-36 bg-slate-100 shadow-inner">
                {bannerBg ? (
                  <img
                    src={bannerBg}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white">
                    <span className="text-sm font-bold">Banner Đại Dương Mặc Định</span>
                  </div>
                )}
                <div
                  className="absolute inset-0 bg-slate-950 pointer-events-none"
                  style={{ opacity: bannerOverlay / 100 }}
                />
                <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                  <span className="text-lg font-black tracking-tight">{currentClassName}</span>
                  <span className="text-xs text-sky-200 font-medium">GV: {currentTeacherName}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <FolderOpen className="w-4 h-4 text-blue-600" />
            <span>Mở Tệp Từ Máy Tính...</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBackgroundModalOpen(false)}
              className="px-4 py-2.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md shadow-blue-200 flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Áp Dụng & Lưu Thay Đổi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
