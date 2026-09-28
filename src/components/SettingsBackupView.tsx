import React, { useState, useRef } from 'react';
import {
  Settings,
  HardDrive,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  User,
  Sparkles,
  School,
  Camera,
  Image as ImageIcon,
  Trash2,
  Calendar,
  Archive,
  Eye,
  BookOpen,
  ArrowRight,
  History,
  FolderArchive,
  Clock,
  Star,
  Gift,
  X,
  FileJson,
  Users,
  Check,
  Plus,
  Edit2,
  Sun,
  Sunset,
  GraduationCap,
  Layers,
  FileUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { compressImageFile } from '../utils/imageUtils';
import { SchoolYearArchive, ClassItem } from '../types';
import { ClassModal } from './ClassModal';

export const SettingsBackupView: React.FC = () => {
  const {
    config,
    updateConfig,
    exportJSON,
    importJSON,
    exportCSV,
    resetAllData,
    saveStatus,
    triggerManualSave,
    schoolYearArchives,
    createSchoolYearArchive,
    deleteSchoolYearArchive,
    restoreSchoolYearArchive,
    startNewSchoolYear,
    classes,
    students,
    schedules,
    activeClassId,
    setActiveClassId,
    deleteClass,
    playSound,
    showToast,
    setIsBackgroundModalOpen,
  } = useApp();

  const [formAppName, setFormAppName] = useState(config.appName);
  const [formDepartmentName, setFormDepartmentName] = useState(config.departmentName || 'UBND XÃ NGUYỄN VIỆT KHÁI');
  const [formSchoolName, setFormSchoolName] = useState(config.schoolName || 'TRƯỜNG TH-THCS RẠCH CHÈO');
  const [formTeacherName, setFormTeacherName] = useState(
    config.teacherName === 'Cô Giáo Nga' ? 'Thầy Nhân' : config.teacherName || 'Thầy Nhân'
  );
  const [formClassName, setFormClassName] = useState(config.className);
  const [formSchoolYear, setFormSchoolYear] = useState(config.schoolYear || '2026-2027');
  const [formSlogans, setFormSlogans] = useState(config.slogans.join(', '));
  const [formAvatar, setFormAvatar] = useState(
    config.teacherAvatar && !config.teacherAvatar.includes('NgaTeacher')
      ? config.teacherAvatar
      : 'https://api.dicebear.com/7.x/bottts/svg?seed=ThayNhanTeacher&backgroundColor=bae6fd'
  );
  const [formCoverImage, setFormCoverImage] = useState(config.coverImage || '');
  const [formHeaderCardBg, setFormHeaderCardBg] = useState(config.headerCardBg || '');
  const [formAppWallpaper, setFormAppWallpaper] = useState(config.appWallpaper || '');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const settingsBannerInputRef = useRef<HTMLInputElement>(null);
  const settingsHeaderBgInputRef = useRef<HTMLInputElement>(null);
  const settingsWallpaperInputRef = useRef<HTMLInputElement>(null);

  // Class edit / add modal state
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);

  // File restore state & inspection
  const [selectedFileForRestore, setSelectedFileForRestore] = useState<{
    fileName: string;
    fileContent: string;
    schoolYear: string;
    classesCount: number;
    classNames: string[];
    studentsCount: number;
    schedulesCount: number;
    weeklyEvaluationsCount?: number;
    exportDate?: string;
  } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Archive & School Year State
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveYearInput, setArchiveYearInput] = useState(config.schoolYear || '2026-2027');
  const [archiveNotesInput, setArchiveNotesInput] = useState('');

  // New School Year modal state
  const [isNewYearModalOpen, setIsNewYearModalOpen] = useState(false);
  const [newYearInput, setNewYearInput] = useState('2027-2028');
  const [newYearAutoArchive, setNewYearAutoArchive] = useState(true);
  const [newYearCarryOverStudents, setNewYearCarryOverStudents] = useState(true);
  const [newYearResetStars, setNewYearResetStars] = useState(true);

  // Viewing archive state
  const [inspectingArchive, setInspectingArchive] = useState<SchoolYearArchive | null>(null);
  const [archiveViewerTab, setArchiveViewerTab] = useState<'students' | 'redemptions' | 'classes'>('students');

  const handleBannerUploadFromSettings = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setFormCoverImage(compressed);
    } catch (err) {
      console.error(err);
      alert('Lỗi tải hình ảnh từ máy tính');
    }
  };

  const handleHeaderBgUploadFromSettings = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1600, 0.85);
      setFormHeaderCardBg(compressed);
      showToast('Đã tải ảnh nền thẻ lớp học từ máy tính!', 'success');
    } catch (err) {
      console.error(err);
      alert('Lỗi tải hình ảnh từ máy tính');
    }
  };

  const handleWallpaperUploadFromSettings = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1600, 0.85);
      setFormAppWallpaper(compressed);
      showToast('Đã tải hình nền giao diện từ máy tính!', 'success');
    } catch (err) {
      console.error(err);
      alert('Lỗi tải hình ảnh từ máy tính');
    }
  };

  const teacherAvatars = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=ThayNhanTeacher&backgroundColor=bae6fd',
    'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherHung&backgroundColor=bfdbfe',
    'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherNhanCool&backgroundColor=dbeafe',
    'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherMai&backgroundColor=fed7aa',
    'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherLan&backgroundColor=bbf7d0',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  ];

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const slogansArray = formSlogans
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    updateConfig({
      appName: formAppName.trim() || 'VƯỜN ƯỚC MƠ',
      departmentName: formDepartmentName.trim() || 'UBND XÃ NGUYỄN VIỆT KHÁI',
      schoolName: formSchoolName.trim() || 'TRƯỜNG TH-THCS RẠCH CHÈO',
      teacherName: formTeacherName.trim() || 'Thầy Nhân',
      className: formClassName.trim() || 'Lớp 5A1',
      schoolYear: formSchoolYear.trim() || '2026-2027',
      slogans: slogansArray.length > 0 ? slogansArray : ['Đoàn kết yêu thương', 'Tự tin tỏa sáng'],
      teacherAvatar: formAvatar,
      coverImage: formCoverImage,
      headerCardBg: formHeaderCardBg,
      appWallpaper: formAppWallpaper,
    });

    setSaveSuccessNotice(true);
    triggerManualSave();
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  const processImportFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      alert('Vui lòng chọn tệp định dạng .JSON');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      try {
        const data = JSON.parse(content);
        const sy =
          data.schoolYear ||
          data.config?.schoolYear ||
          data.snapshot?.config?.schoolYear ||
          config.schoolYear ||
          '2026-2027';
        const classesArr = data.classes || data.snapshot?.classes || [];
        const studentsArr = data.students || data.snapshot?.students || [];
        const schedulesArr = data.schedules || data.snapshot?.schedules || [];
        const weeklyEvalsArr = data.weeklyEvaluations || data.snapshot?.weeklyEvaluations || [];
        const classNames = Array.isArray(classesArr) ? classesArr.map((c: any) => c.name || c.id) : [];

        setSelectedFileForRestore({
          fileName: file.name,
          fileContent: content,
          schoolYear: sy,
          classesCount: classesArr.length,
          classNames,
          studentsCount: studentsArr.length,
          schedulesCount: schedulesArr.length,
          weeklyEvaluationsCount: weeklyEvalsArr.length,
          exportDate: data.exportDate || data.createdAt,
        });
      } catch (err) {
        console.error(err);
        alert('Tệp đã chọn không đúng định dạng JSON hoặc bị lỗi. Vui lòng kiểm tra lại!');
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImportFile(file);
    }
    e.target.value = '';
  };

  const handleConfirmRestoreSelectedFile = () => {
    if (!selectedFileForRestore) return;
    const ok = importJSON(selectedFileForRestore.fileContent);
    if (ok) {
      setSelectedFileForRestore(null);
    }
  };

  const handleReset = () => {
    if (
      confirm(
        'CẢNH BÁO: Thao tác này sẽ khôi phục toàn bộ hệ thống về cài đặt ban đầu. Thầy có chắc chắn không?'
      )
    ) {
      resetAllData();
    }
  };

  // Archive handler
  const handleConfirmArchive = () => {
    if (!archiveYearInput.trim()) {
      alert('Vui lòng nhập tên năm học cần lưu trữ (ví dụ: 2026-2027)');
      return;
    }
    createSchoolYearArchive(archiveYearInput.trim(), archiveNotesInput.trim());
    setIsArchiveModalOpen(false);
    setArchiveNotesInput('');
  };

  // Start new school year
  const handleConfirmNewSchoolYear = () => {
    if (!newYearInput.trim()) {
      alert('Vui lòng nhập niên khóa năm học mới (ví dụ: 2027-2028)');
      return;
    }
    startNewSchoolYear(newYearInput.trim(), newYearAutoArchive, {
      carryOverStudents: newYearCarryOverStudents,
      resetStars: newYearResetStars,
      resetAttendance: true,
    });
    setFormSchoolYear(newYearInput.trim());
    setIsNewYearModalOpen(false);
  };

  // Export archive snapshot as JSON
  const handleDownloadArchiveJSON = (archive: SchoolYearArchive) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(archive, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Ho_So_Luu_Tru_Nam_Hoc_${archive.schoolYear.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-gradient-to-tr from-sky-500 to-blue-600 text-white rounded-xl shadow-xs">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>CÀI ĐẶT & SAO LƯU TOÀN BỘ LỚP HỌC</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                  Niên khóa {config.schoolYear || '2026-2027'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Cài đặt thông tin năm học, quản lý toàn bộ {classes.length} lớp học và sao lưu / khôi phục dữ liệu 100% bằng tệp .JSON
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportJSON}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Tệp Sao Lưu (.JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Nạp Lại Từ Tệp...</span>
          </button>

          <button
            onClick={() => {
              setArchiveYearInput(config.schoolYear || '2026-2027');
              setIsArchiveModalOpen(true);
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FolderArchive className="w-4 h-4 text-blue-600" />
            <span>Lưu Trữ Snapshot</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 KHU VỰC TRỌNG TÂM: SAO LƯU & NẠP LẠI TOÀN BỘ LỚP HỌC NĂM HỌC NÀY */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-white via-sky-50/40 to-blue-50/30 rounded-3xl border-2 border-blue-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-blue-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                  Sao Lưu & Nạp Lại Dữ Liệu Toàn Bộ Lớp Học
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold">
                  Năm học {config.schoolYear || '2026-2027'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Xuất tệp sao lưu bảo quản toàn bộ các lớp của năm học; khi cần nạp lại chỉ cần chọn tệp đã xuất là dữ liệu phục hồi nguyên vẹn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-xl border border-blue-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Định dạng JSON chuẩn 100%</span>
            </span>
          </div>
        </div>

        {/* 2 Big Action Cards: Backup & Restore */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: XUẤT TỆP SAO LƯU TOÀN BỘ LỚP */}
          <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Download className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      1. Sao Lưu Toàn Bộ Lớp Học Năm {config.schoolYear || '2026-2027'}
                    </h4>
                    <span className="text-[11px] text-slate-400">Đóng gói tất cả dữ liệu thành 1 tệp .JSON</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-200">
                  {classes.length} Lớp Học
                </span>
              </div>

              {/* Data Summary Pill Box */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
                <div className="text-xs text-slate-700 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-500">Danh sách các lớp:</span>
                    <span className="font-bold text-blue-700 font-mono">
                      {classes.map((c) => c.name).join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-500">Tổng số học sinh:</span>
                    <span className="font-bold text-slate-800">{students.length} em</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-500">Thời khóa biểu giảng dạy:</span>
                    <span className="font-bold text-slate-800">{schedules.length} tiết</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-500">Hạng mục bao gồm:</span>
                    <span className="font-bold text-emerald-700">
                      Cấu hình, Điểm sao, Đổi quà, Điểm danh, Nhận xét tuần (HHT/HT/CHT), Nhóm học tập
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tệp sao lưu này bảo vệ an toàn 100% dữ liệu toàn bộ các lớp của năm học {config.schoolYear || '2026-2027'}. Thầy Nhân có thể tải về lưu trên máy tính hoặc chia sẻ sang thiết bị khác.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={exportJSON}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 active:scale-98 text-white font-black text-xs rounded-xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Xuất Tệp Sao Lưu Toàn Bộ Lớp Học (.JSON)</span>
              </button>

              <button
                type="button"
                onClick={exportCSV}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Xuất Báo Cáo Thi Đua Excel (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Card 2: NẠP LẠI DỮ LIỆU TỪ TỆP ĐÃ XUẤT */}
          <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Upload className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      2. Nạp Lại Dữ Liệu Từ Tệp Đã Xuất
                    </h4>
                    <span className="text-[11px] text-slate-400">Chỉ cần chọn tệp đã xuất dữ liệu trước đó</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-200">
                  Phục Hồi Tự Động
                </span>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Drag and Drop / Click to select file box */}
              {!selectedFileForRestore ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processImportFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    isDraggingFile
                      ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                      : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/60 hover:border-blue-400'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-blue-800 block">
                    Bấm vào đây để chọn tệp .JSON đã xuất dữ liệu
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    (hoặc kéo thả tệp sao lưu .JSON từ máy tính vào khung này)
                  </span>
                </div>
              ) : (
                /* File Selected Preview Box */
                <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0">
                        <FileJson className="w-4 h-4" />
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-black text-emerald-900 block truncate">
                          {selectedFileForRestore.fileName}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Tệp sao lưu năm học: <strong>{selectedFileForRestore.schoolYear}</strong>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFileForRestore(null)}
                      className="p-1 text-emerald-700 hover:text-rose-600 hover:bg-emerald-100 rounded-lg cursor-pointer"
                      title="Hủy chọn tệp này"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Summary of parsed content */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                    <div className="p-2 bg-white rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-400 font-bold block">SỐ LỚP HỌC</span>
                      <span className="text-xs font-black text-blue-700">
                        {selectedFileForRestore.classesCount} lớp
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-400 font-bold block">HỌC SINH</span>
                      <span className="text-xs font-black text-emerald-700">
                        {selectedFileForRestore.studentsCount} em
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-400 font-bold block">THỜI KHÓA BIỂU</span>
                      <span className="text-xs font-black text-amber-700">
                        {selectedFileForRestore.schedulesCount} tiết
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-400 font-bold block">NHẬN XÉT TUẦN</span>
                      <span className="text-xs font-black text-indigo-700">
                        {selectedFileForRestore.weeklyEvaluationsCount ?? 0} lượt
                      </span>
                    </div>
                  </div>

                  {selectedFileForRestore.classNames.length > 0 && (
                    <div className="text-[11px] text-emerald-800">
                      <span className="font-bold">Các lớp trong tệp: </span>
                      <span>{selectedFileForRestore.classNames.join(', ')}</span>
                    </div>
                  )}

                  {/* Confirm restore button */}
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmRestoreSelectedFile}
                      className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-xl shadow-sm shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Xác Nhận Nạp Lại Toàn Bộ Dữ Liệu Ngay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Đổi Tệp
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Khi Thầy nạp lại tệp dữ liệu đã xuất, toàn bộ danh sách lớp học, điểm sao, thời khóa biểu và nhật ký của năm đó sẽ được phục hồi đầy đủ ngay tức khắc.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Chọn Tệp .JSON Để Nạp Lại Dữ Liệu</span>
                </div>
                <span className="text-[11px] text-blue-600 font-extrabold">Mở thư mục...</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🏫 KHU VỰC CÀI ĐẶT & DANH SÁCH TOÀN BỘ CÁC LỚP HỌC (NĂM {config.schoolYear}) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <span>Cài Đặt Toàn Bộ {classes.length} Lớp Học (Năm Học {config.schoolYear || '2026-2027'})</span>
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold border border-blue-200">
                  {classes.length} lớp
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Quản lý các lớp học được phân công giảng dạy trong năm học này
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingClass(null);
              setIsClassModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Lớp Mới Vào Năm Học</span>
          </button>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {classes.map((cls) => {
            const classStudents = students.filter((s) => s.classIds?.includes(cls.id));
            const isActive = cls.id === activeClassId;

            return (
              <div
                key={cls.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isActive
                    ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                    : 'bg-slate-50/80 hover:bg-white border-slate-200 hover:border-blue-200 hover:shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cls.color || '#2563eb' }}
                      />
                      <h4 className="text-sm font-black text-slate-800">{cls.name}</h4>
                    </div>

                    {isActive ? (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-lg">
                        Lớp Hiện Tại
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-white text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200">
                        {cls.grade}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mt-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Phòng học:</span>
                      <span className="font-bold text-slate-700">{cls.room || 'Phòng học'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Sĩ số học sinh:</span>
                      <span className="font-bold text-blue-700">{classStudents.length} em</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Buổi học:</span>
                      <span className="font-bold flex items-center gap-1 text-slate-700">
                        {cls.shift === 'afternoon' ? (
                          <>
                            <Sunset className="w-3 h-3 text-amber-500" />
                            <span>Buổi Chiều</span>
                          </>
                        ) : (
                          <>
                            <Sun className="w-3 h-3 text-amber-500" />
                            <span>Buổi Sáng</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Mã lớp:</span>
                      <span className="font-bold font-mono text-slate-700">{cls.code || 'LOP'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1.5">
                  {!isActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveClassId(cls.id);
                        showToast(`Đã chuyển sang không gian lớp ${cls.name}!`, 'success');
                      }}
                      className="flex-1 py-1.5 px-2 bg-white hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Chọn Lớp Này</span>
                    </button>
                  ) : (
                    <span className="flex-1 py-1.5 px-2 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold text-center">
                      Đang làm việc
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEditingClass(cls);
                      setIsClassModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg border border-slate-200 cursor-pointer transition-colors"
                    title="Chỉnh sửa thông tin lớp"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (classes.length <= 1) {
                        alert('Hệ thống cần duy trì ít nhất một lớp học!');
                        return;
                      }
                      if (
                        confirm(
                          `Thầy có chắc chắn muốn xóa lớp ${cls.name} khỏi năm học ${config.schoolYear || '2026-2027'} không?`
                        )
                      ) {
                        deleteClass(cls.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-slate-200 cursor-pointer transition-colors"
                    title="Xóa lớp này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================== MODAL CHỈNH SỬA / THÊM LỚP HỌC ===================== */}
      {isClassModalOpen && (
        <ClassModal
          isOpen={isClassModalOpen}
          onClose={() => {
            setIsClassModalOpen(false);
            setEditingClass(null);
          }}
          classToEdit={editingClass}
        />
      )}

      {/* ===================== KHU VỰC QUẢN LÝ LƯU TRỮ THEO NĂM HỌC ===================== */}
      <div className="bg-gradient-to-br from-white via-sky-50/30 to-blue-50/20 rounded-3xl border border-blue-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>KHO LƯU TRỮ HỒ SƠ TỪNG NĂM HỌC</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold">
                  {schoolYearArchives.length} năm học đã lưu
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Cho phép Thầy Nhân lưu trữ nguyên vẹn dữ liệu từng năm học (2026-2027,...) và xem lại bảng vàng, điểm sao, lịch sử bất kỳ lúc nào khi bước sang năm học mới.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setArchiveYearInput(config.schoolYear || '2026-2027');
                setIsArchiveModalOpen(true);
              }}
              className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>+ Tạo bản lưu trữ mới</span>
            </button>
          </div>
        </div>

        {/* Current Year Highlight Card */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center text-xl shadow-xs">
              ⭐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">NĂM HỌC ĐANG HOẠT ĐỘNG:</span>
                <span className="text-sm font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                  {config.schoolYear || '2026-2027'}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ● Đang mở
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Số lớp giảng dạy: <strong>{classes.length} lớp ({classes.map(c => c.name).join(', ')})</strong> • Giáo viên: <strong>{config.teacherName || 'Thầy Nhân'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                createSchoolYearArchive(config.schoolYear || '2026-2027', 'Bản lưu nhanh từ trang cài đặt');
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Chụp Nhanh Năm {config.schoolYear || '2026-2027'}</span>
            </button>

            <button
              onClick={() => setIsNewYearModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Chuyển sang năm mới...</span>
            </button>
          </div>
        </div>

        {/* List of Archived School Years */}
        {schoolYearArchives.length === 0 ? (
          <div className="bg-white/80 border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2">
            <FolderArchive className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Chưa có bản lưu trữ năm học nào trong kho</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Thầy Nhân hãy bấm <strong>"Lưu Chụp Nhanh Năm {config.schoolYear || '2026-2027'}"</strong> ở trên để bảo quản toàn bộ dữ liệu học sinh, sao thưởng và quà tặng của năm học này.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {schoolYearArchives.map((archive) => (
              <div
                key={archive.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-black text-sm border border-blue-200 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>Năm học {archive.schoolYear}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(archive.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {archive.notes && (
                    <p className="text-xs text-slate-500 italic line-clamp-1 mb-2">
                      "{archive.notes}"
                    </p>
                  )}

                  {/* Summary badges */}
                  <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">HỌC SINH</span>
                      <span className="text-xs font-black text-slate-700">{archive.studentCount} em</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">TỔNG SAO</span>
                      <span className="text-xs font-black text-amber-600">{archive.totalStarsAwarded} ⭐</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">ĐỔI QUÀ</span>
                      <span className="text-xs font-black text-pink-600">{archive.totalRedemptions} lượt</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => {
                      setInspectingArchive(archive);
                      setArchiveViewerTab('students');
                    }}
                    className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem lại</span>
                  </button>

                  <button
                    onClick={() => handleDownloadArchiveJSON(archive)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                    title="Tải file JSON năm học này"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc chắn muốn KHÔI PHỤC toàn bộ dữ liệu của năm học ${archive.schoolYear} vào không gian làm việc hiện tại không?`)) {
                        restoreSchoolYearArchive(archive.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                    title="Khôi phục năm học này vào hệ thống"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Xác nhận xóa bản lưu trữ năm học ${archive.schoolYear}?`)) {
                        deleteSchoolYearArchive(archive.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    title="Xóa bản lưu này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Settings Grid (2 boxes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Box 1: Thông Tin Lớp Học & Giáo Viên (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-blue-100 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <School className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-extrabold text-slate-800">
              Thông Tin Trường & Niên Khóa (Năm Học {config.schoolYear || '2026-2027'})
            </h3>
          </div>

          <form onSubmit={handleSaveInfo} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đơn Vị Chủ Quản (Phòng/UBND)
                </label>
                <input
                  type="text"
                  value={formDepartmentName}
                  onChange={(e) => setFormDepartmentName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Trường Học
                </label>
                <input
                  type="text"
                  value={formSchoolName}
                  onChange={(e) => setFormSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Lớp Mặc Định / Chủ Nhiệm
                </label>
                <input
                  type="text"
                  value={formClassName}
                  onChange={(e) => setFormClassName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Giáo Viên Phụ Trách
                </label>
                <input
                  type="text"
                  value={formTeacherName}
                  onChange={(e) => setFormTeacherName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Năm Học (Niên Khóa)</span>
                  <span className="text-[10px] text-blue-600 font-semibold">{config.schoolYear || '2026-2027'}</span>
                </label>
                <input
                  type="text"
                  value={formSchoolYear}
                  onChange={(e) => setFormSchoolYear(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khẩu Hiệu Lớp (cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  value={formSlogans}
                  onChange={(e) => setFormSlogans(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Teacher Avatar selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ảnh Đại Diện Giáo Viên
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full ring-2 ring-blue-400 overflow-hidden shrink-0">
                  <img src={formAvatar} alt="Teacher" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {teacherAvatars.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormAvatar(url)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform cursor-pointer ${
                        formAvatar === url ? 'border-blue-600 scale-110 shadow-sm' : 'border-slate-200'
                      }`}
                    >
                      <img src={url} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Background Studio Shortcut Banner */}
            <div className="pt-2 border-t border-slate-100">
              <div className="p-3.5 bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-600 rounded-2xl text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-sky-100" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black">Trung Tâm Tùy Chỉnh Ảnh Nền (Background Studio)</h4>
                    <p className="text-[11px] text-sky-100 font-medium">
                      Thay đổi ảnh từ máy tính cho Thẻ lớp, Hình nền giao diện & Banner với thanh chỉnh độ mờ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBackgroundModalOpen(true)}
                  className="px-3 py-1.5 bg-white hover:bg-sky-50 text-blue-700 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  Mở Studio Ảnh Nền
                </button>
              </div>
            </div>

            {/* 1. Header Card Background Image */}
            <div className="pt-2 border-t border-slate-100">
              <input
                type="file"
                ref={settingsHeaderBgInputRef}
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleHeaderBgUploadFromSettings}
                className="hidden"
              />

              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Ảnh Nền Cho Thẻ Lớp Học (Góc Trái Sidebar)</span>
                </label>
                {formHeaderCardBg ? (
                  <button
                    type="button"
                    onClick={() => setFormHeaderCardBg('')}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa ảnh thẻ</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">Màu trắng mặc định</span>
                )}
              </div>

              {/* Preview Thumbnail */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-20 bg-slate-50 flex items-center justify-center group mb-2.5">
                {formHeaderCardBg ? (
                  <>
                    <img
                      src={formHeaderCardBg}
                      alt="Header Card Bg Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => settingsHeaderBgInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Đổi ảnh khác</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3">
                    <span className="text-xs font-bold text-slate-600 block">Thẻ VƯỜN ƯỚC MƠ Chưa Có Ảnh Nền Riêng</span>
                    <span className="text-[10px] text-slate-400">Tải ảnh phong cảnh hoặc ảnh lớp để thẻ thêm sinh động</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => settingsHeaderBgInputRef.current?.click()}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải ảnh nền thẻ lớp từ máy tính (JPG, PNG)</span>
              </button>
            </div>

            {/* 2. App Wallpaper Background */}
            <div className="pt-2 border-t border-slate-100">
              <input
                type="file"
                ref={settingsWallpaperInputRef}
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleWallpaperUploadFromSettings}
                className="hidden"
              />

              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  <span>Hình Nền Toàn Giao Diện Ứng Dụng (Wallpaper)</span>
                </label>
                {formAppWallpaper ? (
                  <button
                    type="button"
                    onClick={() => setFormAppWallpaper('')}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa hình nền</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">Nền xám nhạt mặc định</span>
                )}
              </div>

              {/* Wallpaper Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-20 bg-slate-50 flex items-center justify-center group mb-2.5">
                {formAppWallpaper ? (
                  <>
                    <img
                      src={formAppWallpaper}
                      alt="Wallpaper Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => settingsWallpaperInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Đổi hình nền khác</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3">
                    <span className="text-xs font-bold text-slate-600 block">Chưa Cài Đặt Hình Nền Toàn Màn Hình</span>
                    <span className="text-[10px] text-slate-400">Hình nền sẽ hiển thị mờ dịu mắt dưới các bảng biểu</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => settingsWallpaperInputRef.current?.click()}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-bold text-xs rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                <span>Tải hình nền toàn màn hình từ máy tính</span>
              </button>
            </div>

            {/* 3. Classroom Banner Image */}
            <div className="pt-2 border-t border-slate-100">
              <input
                type="file"
                ref={settingsBannerInputRef}
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleBannerUploadFromSettings}
                className="hidden"
              />

              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span>Ảnh Banner Bìa Lớp Học (Trang Tổng Quan)</span>
                </label>
                {formCoverImage ? (
                  <button
                    type="button"
                    onClick={() => setFormCoverImage('')}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa ảnh banner</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">Màu xanh biển mặc định</span>
                )}
              </div>

              {/* Banner Preview Thumbnail */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-28 bg-slate-100 flex items-center justify-center group mb-2.5">
                {formCoverImage ? (
                  <>
                    <img
                      src={formCoverImage}
                      alt="Banner Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => settingsBannerInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Đổi ảnh khác</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 flex flex-col items-center justify-center text-white p-4">
                    <span className="text-xs font-bold mb-1">Banner Mặc Định (Màu Đại Dương)</span>
                    <span className="text-[11px] text-sky-100">Chưa tải ảnh riêng từ máy tính</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => settingsBannerInputRef.current?.click()}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải ảnh banner lên từ máy tính (JPG, PNG)</span>
              </button>
            </div>

            {saveSuccessNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đã lưu thông tin cài đặt thành công!</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xs rounded-xl shadow-sm shadow-blue-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Thay Đổi Cài Đặt</span>
              </button>
            </div>
          </form>
        </div>

        {/* Box 2: Trạng Thái Hệ Thống & Reset Cài Đặt (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-blue-100 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <History className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-extrabold text-slate-800">
                Thông Tin Trạng Thái
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Trạng thái lưu tự động:</span>
                  <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{saveStatus || 'Đã lưu an toàn'}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Phiên bản tệp sao lưu:</span>
                  <span className="font-mono font-bold text-blue-700">v3.0 (Toàn bộ lớp học)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Lớp đang chọn:</span>
                  <span className="font-bold text-slate-800">
                    {classes.find((c) => c.id === activeClassId)?.name || config.className}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống tự động đồng bộ mọi thay đổi vào bộ nhớ an toàn của trình duyệt. Thầy cũng có thể bấm <strong>"Xuất Tệp Sao Lưu Toàn Bộ Lớp Học"</strong> ở phía trên để có tệp lưu trữ dự phòng dài hạn.
              </p>
            </div>
          </div>

          {/* Danger zone reset */}
          <div className="pt-4 border-t border-slate-100">
            <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Khu Vực Đặt Lại Hệ Thống</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Thao tác này sẽ xóa dữ liệu tạm hiện thời và đưa toàn bộ danh sách lớp học, thời khóa biểu và điểm sao về trạng thái mẫu ban đầu.
              </p>
              <button
                onClick={handleReset}
                className="w-full py-2 px-3 bg-white hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-rose-300 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Khôi Phục Dữ Liệu Về Mặc Định Ban Đầu</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== MODAL 1: TẠO BẢN LƯU TRỮ NĂM HỌC ===================== */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-blue-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Archive className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Lưu Trữ Hồ Sơ Năm Học</h3>
                  <p className="text-xs text-slate-400">Đóng băng dữ liệu học sinh & điểm số vào kho</p>
                </div>
              </div>
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Niên Khóa Năm Học *
                </label>
                <input
                  type="text"
                  value={archiveYearInput}
                  onChange={(e) => setArchiveYearInput(e.target.value)}
                  placeholder="Ví dụ: 2026-2027"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú hoặc lời dặn (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={archiveNotesInput}
                  onChange={(e) => setArchiveNotesInput(e.target.value)}
                  placeholder="Ví dụ: Đã hoàn thành học kỳ 2, lưu trước khi lên lớp mới..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800 space-y-1">
                <span className="font-bold block">📦 Bản lưu trữ sẽ bao gồm:</span>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  • Toàn bộ học sinh cùng số sao tích lũy và bảng thành tích
                  <br />• Lịch sử đổi quà, nhật ký thi đua và chia nhóm lớp học
                  <br />• Có thể mở xem lại hoặc khôi phục bất cứ khi nào
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                Lưu Trữ Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: KHỞI TẠO NĂM HỌC MỚI ===================== */}
      {isNewYearModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-blue-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Bắt Đầu Năm Học Mới</h3>
                  <p className="text-xs text-slate-400">Thiết lập niên khóa mới cho hành trình rèn luyện</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewYearModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Niên Khóa Năm Học Mới *
                </label>
                <input
                  type="text"
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  placeholder="Ví dụ: 2027-2028"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Options */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-black text-slate-700 block">Tùy Chọn Chuyển Giao:</span>

                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newYearAutoArchive}
                    onChange={(e) => setNewYearAutoArchive(e.target.checked)}
                    className="mt-0.5 rounded-sm text-blue-600 focus:ring-blue-400"
                  />
                  <div>
                    <span className="font-bold">Tự động sao lưu & lưu trữ năm học hiện tại ({config.schoolYear || '2026-2027'})</span>
                    <p className="text-[11px] text-slate-400">
                      Bảo đảm 100% không mất dữ liệu, có thể bấm xem lại bất kỳ khi nào ở năm học mới.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newYearCarryOverStudents}
                    onChange={(e) => setNewYearCarryOverStudents(e.target.checked)}
                    className="mt-0.5 rounded-sm text-blue-600 focus:ring-blue-400"
                  />
                  <div>
                    <span className="font-bold">Giữ lại danh sách học sinh cho năm học mới</span>
                    <p className="text-[11px] text-slate-400">
                      Giữ tên, mã và thông tin học sinh hiện tại (bỏ chọn nếu Thầy muốn nạp lớp học sinh hoàn toàn mới).
                    </p>
                  </div>
                </label>

                {newYearCarryOverStudents && (
                  <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer pl-6">
                    <input
                      type="checkbox"
                      checked={newYearResetStars}
                      onChange={(e) => setNewYearResetStars(e.target.checked)}
                      className="mt-0.5 rounded-sm text-amber-600 focus:ring-amber-400"
                    />
                    <div>
                      <span className="font-bold text-amber-900">Đưa điểm sao của học sinh về 0 ⭐ để bắt đầu thi đua năm mới</span>
                      <p className="text-[11px] text-amber-700">
                        Số sao cũ đã được lưu an toàn trong bản lưu trữ năm {config.schoolYear || '2026-2027'}.
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewYearModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmNewSchoolYear}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Bắt Đầu Năm Học {newYearInput}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: XEM LẠI HỒ SƠ NĂM HỌC CŨ ===================== */}
      {inspectingArchive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl border border-blue-100 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <span>Hồ Sơ Lưu Trữ Năm Học {inspectingArchive.schoolYear}</span>
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">
                      Chế độ xem lại
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lưu trữ ngày: {new Date(inspectingArchive.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingArchive(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2.5 shrink-0">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold block">HỌC SINH</span>
                <span className="text-sm font-black text-slate-700">{inspectingArchive.studentCount} em</span>
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <span className="text-[10px] text-amber-700 font-bold block">TỔNG SAO</span>
                <span className="text-sm font-black text-amber-600">{inspectingArchive.totalStarsAwarded} ⭐</span>
              </div>
              <div className="p-2.5 bg-pink-50 border border-pink-200 rounded-xl text-center">
                <span className="text-[10px] text-pink-700 font-bold block">LƯỢT ĐỔI QUÀ</span>
                <span className="text-sm font-black text-pink-600">{inspectingArchive.totalRedemptions} lượt</span>
              </div>
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <span className="text-[10px] text-blue-700 font-bold block">SỐ LỚP</span>
                <span className="text-sm font-black text-blue-700">{inspectingArchive.classCount} lớp</span>
              </div>
            </div>

            {/* Subtabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 shrink-0">
              <button
                onClick={() => setArchiveViewerTab('students')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  archiveViewerTab === 'students'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Danh Sách Học Sinh ({inspectingArchive.snapshot.students?.length || 0})
              </button>
              <button
                onClick={() => setArchiveViewerTab('redemptions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  archiveViewerTab === 'redemptions'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Lịch Sử Đổi Quà ({inspectingArchive.snapshot.redemptions?.length || 0})
              </button>
              <button
                onClick={() => setArchiveViewerTab('classes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  archiveViewerTab === 'classes'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Thông Tin Lớp & Tiêu Chí
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0 pr-1">
              {archiveViewerTab === 'students' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {inspectingArchive.snapshot.students?.map((stu, idx) => (
                      <div
                        key={stu.id}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 text-center text-xs font-bold text-slate-400">#{idx + 1}</span>
                          <span className="text-xl">{stu.avatar}</span>
                          <div className="truncate">
                            <span className="text-xs font-black text-slate-800 block truncate">{stu.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{stu.code || 'HS'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-black rounded-lg">
                            {stu.stars} ⭐
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {archiveViewerTab === 'redemptions' && (
                <div className="space-y-2">
                  {(!inspectingArchive.snapshot.redemptions || inspectingArchive.snapshot.redemptions.length === 0) ? (
                    <p className="text-xs text-slate-400 text-center py-6">Chưa có lượt đổi quà nào được ghi nhận trong năm học này.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {inspectingArchive.snapshot.redemptions.map((red) => (
                        <div
                          key={red.id}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{red.giftIcon}</span>
                            <div>
                              <span className="font-extrabold text-slate-800">{red.studentName}</span>
                              <span className="text-slate-400 text-[11px] block">nhận {red.giftName} (-{red.cost} ⭐)</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(red.redeemedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {archiveViewerTab === 'classes' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <p><strong>Trường:</strong> {inspectingArchive.snapshot.config?.schoolName || 'TRƯỜNG TH-THCS RẠCH CHÈO'}</p>
                    <p><strong>Lớp:</strong> {inspectingArchive.snapshot.config?.className || 'Lớp 5A'}</p>
                    <p><strong>Giáo viên:</strong> {inspectingArchive.snapshot.config?.teacherName || 'Thầy Nhân'}</p>
                    <p><strong>Khẩu hiệu:</strong> {inspectingArchive.snapshot.config?.slogans?.join(' • ') || '—'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleDownloadArchiveJSON(inspectingArchive)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải File JSON Năm {inspectingArchive.schoolYear}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm(`Bạn có muốn nạp lại toàn bộ dữ liệu năm học ${inspectingArchive.schoolYear} vào hệ thống làm việc hiện tại?`)) {
                      restoreSchoolYearArchive(inspectingArchive.id);
                      setInspectingArchive(null);
                    }
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi Phục Năm Này Về Làm Việc</span>
                </button>
                <button
                  onClick={() => setInspectingArchive(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
