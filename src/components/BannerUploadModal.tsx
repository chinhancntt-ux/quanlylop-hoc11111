import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  AlertCircle
} from 'lucide-react';

interface BannerUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage?: string;
  currentOverlay?: number;
  onSave: (imageUrl: string, overlayOpacity: number) => void;
  onReset: () => void;
  teacherName?: string;
  className?: string;
}

// Curated high quality educational & classroom banner presets
const PRESET_BANNERS = [
  {
    id: 'ocean',
    title: 'Biển Xanh Vươn Xa',
    category: 'Đại dương',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80',
    tag: 'Đại dương'
  },
  {
    id: 'classroom-happy',
    title: 'Lớp Học Hạnh Phúc',
    category: 'Trường học',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&auto=format&fit=crop&q=80',
    tag: 'Học đường'
  },
  {
    id: 'chalkboard',
    title: 'Bảng Đen Phấn Trắng',
    category: 'Tri thức',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&auto=format&fit=crop&q=80',
    tag: 'Tri thức'
  },
  {
    id: 'universe',
    title: 'Khám Phá Vũ Trụ',
    category: 'Khoa học',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    tag: 'Vũ trụ'
  },
  {
    id: 'library-warm',
    title: 'Góc Đọc Sách Thân Yêu',
    category: 'Thư viện',
    url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&auto=format&fit=crop&q=80',
    tag: 'Sách vở'
  },
  {
    id: 'green-nature',
    title: 'Khu Vườn Ươm Mầm',
    category: 'Thiên nhiên',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&auto=format&fit=crop&q=80',
    tag: 'Tươi sáng'
  }
];

export const BannerUploadModal: React.FC<BannerUploadModalProps> = ({
  isOpen,
  onClose,
  currentImage = '',
  currentOverlay = 25,
  onSave,
  onReset,
  teacherName = 'Thầy Nhân',
  className = 'Lớp 5B'
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(currentImage);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(currentOverlay);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'presets'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedImage(currentImage);
      setOverlayOpacity(currentOverlay || 25);
      setErrorMessage('');
      setFileName('');
      setFileSize('');
    }
  }, [isOpen, currentImage, currentOverlay]);

  if (!isOpen) return null;

  // Process and compress image to avoid localStorage quota issues
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP, GIF).');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDimension = 1600;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setSelectedImage(compressedDataUrl);

            // Estimate compressed size
            const byteLength = Math.round((compressedDataUrl.length * 3) / 4);
            const kbSize = Math.round(byteLength / 1024);
            setFileSize(`${kbSize} KB (Đã tối ưu tải siêu nhanh)`);
          } else {
            setSelectedImage(event.target?.result as string);
          }
        } catch (err) {
          console.error(err);
          setSelectedImage(event.target?.result as string);
        } finally {
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        setErrorMessage('Không thể đọc dữ liệu hình ảnh. Vui lòng thử ảnh khác.');
        setIsProcessing(false);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      setErrorMessage('Lỗi khi tải tệp từ máy tính.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApply = () => {
    onSave(selectedImage, overlayOpacity);
    onClose();
  };

  const handleResetToDefault = () => {
    setSelectedImage('');
    onReset();
    onClose();
  };

  return (
    <div
      id="banner-upload-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="banner-upload-modal-card"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                TÙY CHỈNH BANNER LỚP HỌC
              </h3>
              <p className="text-xs text-sky-100 font-medium">
                Tải ảnh lên từ máy tính hoặc chọn ảnh bìa yêu thích cho lớp học
              </p>
            </div>
          </div>
          <button
            id="close-banner-modal-btn"
            onClick={onClose}
            className="p-2 hover:bg-white/20 text-white/90 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl">
            <button
              id="tab-upload-from-pc"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Tải Ảnh Từ Máy Tính</span>
            </button>
            <button
              id="tab-preset-banners"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'presets'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Ảnh Mẫu Học Đường</span>
            </button>
          </div>

          {/* TAB 1: Upload from Computer */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp, image/gif"
                className="hidden"
              />

              {/* Drag and drop upload zone */}
              <div
                id="banner-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30'
                }`}
              >
                <div className="w-14 h-14 mx-auto mb-3 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Nhấn để chọn ảnh từ máy tính hoặc kéo thả ảnh vào đây
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-3">
                  Hỗ trợ định dạng JPG, PNG, WEBP. Ảnh sẽ được tự động tối ưu hóa hiển thị sắc nét trên mọi màn hình.
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 inline-flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn Tệp Ảnh Từ Máy Tính</span>
                </button>
              </div>

              {isProcessing && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-medium flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý và nén ảnh để tải mượt mà...</span>
                </div>
              )}

              {fileName && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold truncate">{fileName}</span>
                    <span className="text-emerald-600 font-normal">({fileSize})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFileName('');
                      setFileSize('');
                      setSelectedImage('');
                    }}
                    className="text-rose-500 hover:text-rose-700 font-bold ml-2 text-xs"
                  >
                    Hủy ảnh
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Curated Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500">
                Chọn một ảnh nền chủ đề học đường sắc nét:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRESET_BANNERS.map((preset) => {
                  const isSelected = selectedImage === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedImage(preset.url);
                        setFileName(preset.title);
                        setFileSize('Mẫu HD');
                      }}
                      className={`group relative rounded-2xl overflow-hidden border-2 text-left transition-all aspect-16/9 flex flex-col justify-end p-2.5 ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-400 shadow-md'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.title}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="relative z-10">
                        <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wider block">
                          {preset.tag}
                        </span>
                        <span className="text-xs font-black text-white drop-shadow-xs block truncate">
                          {preset.title}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real-time Preview Area */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Xem Trước Banner Hiển Thị Thực Tế:</span>
              </span>
              {selectedImage ? (
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Ảnh tùy chỉnh đang chọn
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  Màu xanh biển mặc định
                </span>
              )}
            </div>

            {/* Banner Preview Box - Elevated & Radiant */}
            <div className="relative rounded-2xl overflow-hidden p-5 text-white border-2 border-white/80 ring-2 ring-sky-400/20 shadow-xl min-h-[150px] flex flex-col justify-between">
              {/* Top specular shine */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-white/80 to-transparent z-20 pointer-events-none" />

              {/* Background */}
              {selectedImage ? (
                <>
                  <img
                    src={selectedImage}
                    alt="Banner preview"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                  <div
                    className="absolute inset-0 transition-opacity"
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
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700">
                  <div className="absolute -right-8 -top-8 w-48 h-48 bg-sky-300/30 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-cyan-300/25 rounded-full blur-2xl pointer-events-none" />
                </div>
              )}

              {/* Streamlined foreground content preview */}
              <div className="relative z-10 flex items-end justify-between gap-4 mt-auto">
                <div className="space-y-1">
                  <h5 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    Xin chào {teacherName}! 🌊
                  </h5>
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-black/40 backdrop-blur-md rounded-full text-[11px] font-black text-amber-300 border border-white/30 shadow-xs">
                    ⭐ {className}
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-white/90 text-slate-900 font-extrabold text-[10px] rounded-lg shadow-xs">
                    Quản Lý Lớp
                  </span>
                  <span className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-[10px] rounded-lg shadow-xs">
                    + Thưởng Điểm
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Overlay Darkness Setting */}
          {selectedImage && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Độ mờ lớp phủ nền (giúp chữ nổi bật & ảnh vẫn sáng rực rỡ):</span>
                </span>
                <span className="font-black text-blue-600">{overlayOpacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="65"
                step="5"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>10% (Rực rỡ & siêu sáng)</span>
                <span className="text-blue-600">25% (Chuẩn đẹp, chữ nổi rõ)</span>
                <span>65% (Đậm nét)</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            id="reset-banner-default-btn"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi Phục Mặc Định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="cancel-banner-modal-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              id="save-banner-modal-btn"
              onClick={handleApply}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Áp Dụng Banner</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
