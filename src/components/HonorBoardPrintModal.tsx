import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Download,
  Image as ImageIcon,
  X,
  Star,
  Trophy,
  Award,
  Crown,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Student } from '../types';
import { drawHonorBoardToCanvas } from '../utils/honorBoardCanvas';

interface HonorBoardPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentClassName: string;
  departmentName?: string;
  schoolName?: string;
  teacherName?: string;
  schoolYear: string;
  periodTitle?: string;
  periodSubtitle?: string;
}

export const HonorBoardPrintModal: React.FC<HonorBoardPrintModalProps> = ({
  isOpen,
  onClose,
  students,
  currentClassName,
  departmentName: initialDept = 'UBND XÃ NGUYỄN VIỆT KHÁI',
  schoolName = 'TRƯỜNG TH-THCS RẠCH CHÈO',
  teacherName = 'Thầy Nhân',
  schoolYear,
  periodTitle,
  periodSubtitle,
}) => {
  const [printLimit, setPrintLimit] = useState<'top3' | 'top5' | 'top10' | 'top20' | 'all'>('top10');
  const [departmentName, setDepartmentName] = useState(initialDept || 'UBND XÃ NGUYỄN VIỆT KHÁI');
  const [currentSchoolName, setCurrentSchoolName] = useState(schoolName);
  const [title, setTitle] = useState(periodTitle || 'BẢNG VÀNG DANH DỰ');
  const [subtitle, setSubtitle] = useState(
    periodSubtitle ? `TUYÊN DƯƠNG HỌC SINH XUẤT SẮC & TIÊU BIỂU (${periodSubtitle})` : 'TUYÊN DƯƠNG HỌC SINH XUẤT SẮC & TIÊU BIỂU'
  );
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Image preview modal state
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (periodTitle) {
      setTitle(periodTitle);
    }
    if (periodSubtitle) {
      setSubtitle(`TUYÊN DƯƠNG HỌC SINH XUẤT SẮC & TIÊU BIỂU (${periodSubtitle})`);
    }
  }, [periodTitle, periodSubtitle, isOpen]);

  useEffect(() => {
    setCurrentSchoolName(schoolName || 'TRƯỜNG TH-THCS RẠCH CHÈO');
  }, [schoolName]);

  useEffect(() => {
    if (initialDept) {
      setDepartmentName(initialDept);
    }
  }, [initialDept]);

  if (!isOpen) return null;

  // Filter and sort students
  const sortedStudents = [...students].sort((a, b) => b.stars - a.stars);
  const limitCount =
    printLimit === 'top3'
      ? 3
      : printLimit === 'top5'
      ? 5
      : printLimit === 'top10'
      ? 10
      : printLimit === 'top20'
      ? 20
      : sortedStudents.length;

  const displayList = sortedStudents.slice(0, limitCount);

  // Current date
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateFormatted = `Ngày ${day} tháng ${month} năm ${year}`;

  const cleanClassName = currentClassName.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');

  // 1. Direct Print & PDF Function
  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Direct print blocked, trying popup print:', err);
      handleOpenPrintTab();
    }
  };

  // 2. Open Standalone Print Tab
  const handleOpenPrintTab = () => {
    const htmlContent = generatePrintHTML();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      // If popup blocked, download HTML file
      handleDownloadHTML();
    }
  };

  // 3. Reliable Native Canvas Image Generation & Download
  const handleDownloadImage = () => {
    setIsExportingImage(true);
    setNotification(null);

    // Give UI a micro-task to show loading state
    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        drawHonorBoardToCanvas(canvas, {
          students: displayList,
          schoolName: currentSchoolName,
          departmentName: departmentName,
          className: currentClassName,
          schoolYear,
          teacherName: teacherName || 'Thầy Nhân',
          dateStr: dateFormatted,
          title,
          subtitle,
        });

        canvas.toBlob((blob) => {
          if (!blob) {
            alert('Không thể tạo file ảnh. Thầy/Cô vui lòng thử lại.');
            setIsExportingImage(false);
            return;
          }

          const imgUrl = URL.createObjectURL(blob);
          setPreviewImageUrl(imgUrl);

          // Direct file download
          const link = document.createElement('a');
          link.href = imgUrl;
          link.download = `Bang_Vang_Danh_Du_${cleanClassName}_${day}_${month}_${year}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Try copying to clipboard
          let clipboardSuccess = false;
          if (navigator.clipboard && window.ClipboardItem) {
            try {
              navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
              clipboardSuccess = true;
            } catch {
              // Ignore clipboard failure in restricted contexts
            }
          }

          setNotification({
            type: 'success',
            message: clipboardSuccess
              ? 'Đã tải ảnh về máy & Sao chép vào Clipboard! Thầy/Cô có thể bấm Ctrl+V để gửi ngay vào Zalo.'
              : 'Đã tải ảnh về máy thành công! Thầy/Cô có thể xem hoặc gửi vào nhóm Zalo.',
          });

          setIsExportingImage(false);
        }, 'image/png');
      } catch (err) {
        console.error('Canvas export failed:', err);
        alert('Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại.');
        setIsExportingImage(false);
      }
    }, 50);
  };

  // Copy current image to clipboard
  const handleCopyToClipboard = async () => {
    try {
      const canvas = document.createElement('canvas');
      drawHonorBoardToCanvas(canvas, {
        students: displayList,
        schoolName: currentSchoolName,
        departmentName: departmentName,
        className: currentClassName,
        schoolYear,
        teacherName: teacherName || 'Thầy Nhân',
        dateStr: dateFormatted,
        title,
        subtitle,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 3000);
        } else {
          alert('Trình duyệt chưa hỗ trợ sao chép ảnh trực tiếp. Thầy/Cô hãy dùng nút "Tải Ảnh Gửi Zalo".');
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      alert('Không thể sao chép ảnh vào clipboard.');
    }
  };

  // Download Standalone HTML File
  const handleDownloadHTML = () => {
    const htmlContent = generatePrintHTML();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bang_Vang_${cleanClassName}_${day}_${month}_${year}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate self-contained, beautifully styled printable HTML
  const generatePrintHTML = () => {
    const rowsHTML = displayList
      .map((s, idx) => {
        const rank = idx + 1;
        let rankBadge = `<span style="font-weight:bold;color:#64748b;">#${rank}</span>`;
        if (rank === 1) rankBadge = `<span style="font-weight:bold;color:#b45309;background:#fef3c7;padding:3px 8px;border-radius:12px;">🥇 #1</span>`;
        else if (rank === 2) rankBadge = `<span style="font-weight:bold;color:#334155;background:#e2e8f0;padding:3px 8px;border-radius:12px;">🥈 #2</span>`;
        else if (rank === 3) rankBadge = `<span style="font-weight:bold;color:#c2410c;background:#ffedd5;padding:3px 8px;border-radius:12px;">🥉 #3</span>`;

        let honorTitle = 'Học Sinh Chăm Chỉ 🌟';
        if (rank === 1) honorTitle = 'Thủ Khoa Xuất Sắc 👑';
        else if (rank === 2) honorTitle = 'Á Khoa Gương Mẫu 🥈';
        else if (rank === 3) honorTitle = 'Hoa Sao Chăm Ngoan 🥉';
        else if (s.stars >= 40) honorTitle = 'Học Sinh Ưu Tú ⭐';
        else if (s.stars >= 25) honorTitle = 'Búp Măng Tích Cực 🌟';

        const bg = idx % 2 === 1 ? '#f8fafc' : '#ffffff';

        return `
          <tr style="background:${bg};border-bottom:1px solid #e2e8f0;height:44px;">
            <td style="text-align:center;padding:8px;font-size:14px;">${rankBadge}</td>
            <td style="padding:8px 12px;font-size:15px;font-weight:bold;color:#0f172a;">${s.avatar ? s.avatar + ' ' : ''}${s.name}</td>
            <td style="text-align:center;padding:8px;font-size:13px;color:#64748b;font-family:monospace;">${s.code || 'HS-' + (idx + 1)}</td>
            <td style="text-align:center;padding:8px;font-size:14px;color:#334155;font-weight:600;">${s.group || 'Tổ 1'}</td>
            <td style="text-align:center;padding:8px;font-size:15px;font-weight:bold;color:#d97706;">${s.stars} ⭐</td>
            <td style="padding:8px 12px;font-size:14px;font-weight:600;color:${rank === 1 ? '#b45309' : '#475569'};">${honorTitle}</td>
          </tr>
        `;
      })
      .join('');

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${currentSchoolName} - ${currentClassName}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #0f172a; }
    .cert-frame { border: 4px solid #1e3a8a; padding: 18px; position: relative; background: #fff; }
    .cert-inner { border: 2px solid #d97706; padding: 24px 20px; }
    .header-dept { text-align: center; font-size: 13px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .header-school { text-align: center; font-size: 20px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin-bottom: 6px; }
    .divider { width: 140px; height: 2px; background: #d97706; margin: 0 auto 16px auto; }
    .title-main { text-align: center; font-size: 30px; font-weight: 900; color: #b45309; letter-spacing: 0.5px; margin: 0 0 6px 0; }
    .title-sub { text-align: center; font-size: 14px; font-weight: 700; color: #334155; text-transform: uppercase; margin: 0 0 10px 0; }
    .meta-bar { text-align: center; font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 16px; }
    th { background: #f1f5f9; color: #1e293b; font-size: 13px; font-weight: bold; padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center; }
    td { border: 1px solid #e2e8f0; }
    .slogan-box { background: #fffbeb; border: 1px solid #fef3c7; padding: 12px 16px; text-align: center; font-style: italic; color: #92400e; font-size: 13px; margin-top: 10px; margin-bottom: 10px; border-radius: 4px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; display: flex; gap: 10px; justify-content: flex-end;">
    <button onclick="window.print()" style="background:#2563eb;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-weight:bold;cursor:pointer;">🖨️ In / Lưu PDF</button>
  </div>
  <div class="cert-frame">
    <div class="cert-inner">
      <div class="header-dept">${departmentName}</div>
      <div class="header-school">${currentSchoolName}</div>
      <div class="divider"></div>
      <div class="title-main">${title}</div>
      <div class="title-sub">${subtitle}</div>
      <div class="meta-bar">Lớp: <b>${currentClassName}</b> &nbsp;•&nbsp; Năm học: <b>${schoolYear}</b> &nbsp;•&nbsp; ${dateFormatted}</div>
      
      <table>
        <thead>
          <tr>
            <th style="width:70px;">HẠNG</th>
            <th style="text-align:left;padding-left:12px;">HỌ VÀ TÊN HỌC SINH</th>
            <th style="width:100px;">MÃ HS</th>
            <th style="width:80px;">TỔ</th>
            <th style="width:110px;">TỔNG SAO</th>
            <th style="text-align:left;padding-left:12px;width:180px;">DANH HIỆU</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>

      <div class="slogan-box">
        “Nhiệt liệt biểu dương tinh thần chăm ngoan, rèn luyện tích cực và thành tích xuất sắc của các em học sinh!”
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] my-auto">
        
        {/* 1. TOP CONTROL BAR (NO-PRINT) */}
        <div className="no-print p-4 sm:p-5 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Crown className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  Bảng Vàng Danh Dự
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                    {currentSchoolName}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Lớp: <span className="text-slate-200 font-semibold">{currentClassName}</span> • Năm học: {schoolYear}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* IN NGAY / LƯU PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              title="Mở hộp thoại In hoặc Lưu file PDF chuẩn A4"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay / Lưu PDF</span>
            </button>

            {/* TẢI ẢNH GỬI ZALO */}
            <button
              onClick={handleDownloadImage}
              disabled={isExportingImage}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
              title="Tải ảnh định dạng PNG sắc nét để gửi vào nhóm Zalo phụ huynh"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{isExportingImage ? 'Đang tạo ảnh...' : 'Tải Ảnh Gửi Zalo'}</span>
            </button>

            {/* SAO CHÉP ẢNH */}
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-600 transition-all cursor-pointer"
              title="Sao chép ảnh vào bộ nhớ tạm (dán trực tiếp Ctrl+V vào Zalo)"
            >
              <Copy className="w-4 h-4 text-slate-300" />
              <span>{copiedSuccess ? '✓ Đã chép!' : 'Sao Chép'}</span>
            </button>

            {/* MỞ TAB RIÊNG ĐỂ IN */}
            <button
              onClick={handleOpenPrintTab}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-600 transition-all cursor-pointer"
              title="Mở trang in trong thẻ mới để in độc lập"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Tab Mới</span>
            </button>

            {/* CLOSE BUTTON */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer ml-1"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. FILTER & SETTINGS BAR (NO-PRINT) */}
        <div className="no-print px-4 py-3 bg-slate-800/50 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Rank filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-slate-400 font-semibold mr-1">Hiển thị:</span>
            {(
              [
                { id: 'top3', label: 'Top 3 🥇' },
                { id: 'top5', label: 'Top 5' },
                { id: 'top10', label: 'Top 10' },
                { id: 'top20', label: 'Top 20' },
                { id: 'all', label: `Tất cả (${sortedStudents.length})` },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPrintLimit(opt.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  printLimit === opt.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Quick Edit School & Dept */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Cơ quan:</span>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="UBND XÃ NGUYỄN VIỆT KHÁI"
                className="px-2.5 py-1 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 font-bold text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden w-48 sm:w-56 truncate"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Trường:</span>
              <input
                type="text"
                value={currentSchoolName}
                onChange={(e) => setCurrentSchoolName(e.target.value)}
                placeholder="TRƯỜNG TH-THCS RẠCH CHÈO"
                className="px-2.5 py-1 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 font-bold text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden w-48 sm:w-56 truncate"
              />
            </div>
          </div>
        </div>

        {/* Notification Alert */}
        {notification && (
          <div className="no-print mx-4 mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-300 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-emerald-400 hover:text-emerald-200 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 3. PREVIEW & PRINTABLE CERTIFICATE AREA */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950 flex justify-center">
          
          {/* THE HONOR BOARD CERTIFICATE (PRINTABLE ELEMENT) */}
          <div
            id="printable-honor-board"
            ref={printAreaRef}
            className="w-full max-w-[850px] bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl border-4 border-blue-900 relative transition-all"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            }}
          >
            {/* Inner Gold Border */}
            <div className="border-2 border-amber-600 p-6 sm:p-8 rounded-lg relative">
              
              {/* Corner Star Ornaments */}
              <div className="absolute top-2 left-2 text-amber-600 font-bold text-lg leading-none">✦</div>
              <div className="absolute top-2 right-2 text-amber-600 font-bold text-lg leading-none">✦</div>
              <div className="absolute bottom-2 left-2 text-amber-600 font-bold text-lg leading-none">✦</div>
              <div className="absolute bottom-2 right-2 text-amber-600 font-bold text-lg leading-none">✦</div>

              {/* Institutional Header */}
              <div className="text-center mb-5">
                <div className="text-xs sm:text-sm font-bold tracking-widest text-slate-500 uppercase">
                  {departmentName}
                </div>
                <div className="text-lg sm:text-2xl font-black text-blue-900 uppercase tracking-tight mt-0.5">
                  {currentSchoolName}
                </div>
                <div className="w-32 sm:w-44 h-0.5 bg-amber-600 mx-auto mt-2 mb-4"></div>

                {/* Main Titles */}
                <h1 className="text-2xl sm:text-4xl font-black text-amber-700 tracking-wide uppercase mb-1">
                  {title}
                </h1>
                <h2 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {subtitle}
                </h2>

                {/* Badges Bar */}
                <div className="inline-flex items-center gap-2 sm:gap-4 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                  <span>Lớp: <strong className="text-blue-900">{currentClassName}</strong></span>
                  <span>•</span>
                  <span>Năm học: <strong className="text-blue-900">{schoolYear}</strong></span>
                  <span>•</span>
                  <span className="text-slate-500">{dateFormatted}</span>
                </div>
              </div>

              {/* Student Honor Table */}
              <div className="overflow-x-auto my-4">
                <table className="w-full text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 text-center w-16 border-r border-slate-300">HẠNG</th>
                      <th className="py-2.5 px-4 border-r border-slate-300">HỌ VÀ TÊN HỌC SINH</th>
                      <th className="py-2.5 px-3 text-center w-24 border-r border-slate-300">MÃ HS</th>
                      <th className="py-2.5 px-3 text-center w-20 border-r border-slate-300">TỔ</th>
                      <th className="py-2.5 px-3 text-center w-28 border-r border-slate-300">TỔNG SAO</th>
                      <th className="py-2.5 px-4">DANH HIỆU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayList.map((student, idx) => {
                      const rank = idx + 1;
                      const isFirst = rank === 1;
                      const isSecond = rank === 2;
                      const isThird = rank === 3;

                      let rowBg = idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white';
                      if (isFirst) rowBg = 'bg-amber-50/70';
                      else if (isSecond) rowBg = 'bg-slate-100/70';
                      else if (isThird) rowBg = 'bg-orange-50/60';

                      let honorTitle = 'Học Sinh Chăm Chỉ 🌟';
                      if (isFirst) honorTitle = 'Thủ Khoa Xuất Sắc 👑';
                      else if (isSecond) honorTitle = 'Á Khoa Gương Mẫu 🥈';
                      else if (isThird) honorTitle = 'Hoa Sao Chăm Ngoan 🥉';
                      else if (student.stars >= 40) honorTitle = 'Học Sinh Ưu Tú ⭐';
                      else if (student.stars >= 25) honorTitle = 'Búp Măng Tích Cực 🌟';

                      return (
                        <tr
                          key={student.id}
                          className={`${rowBg} border-b border-slate-200 text-xs sm:text-sm text-slate-800 transition-colors`}
                        >
                          {/* Rank */}
                          <td className="py-2.5 px-3 text-center font-bold border-r border-slate-200">
                            {isFirst && (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-black">
                                🥇 #1
                              </span>
                            )}
                            {isSecond && (
                              <span className="inline-flex items-center gap-1 text-slate-700 font-black">
                                🥈 #2
                              </span>
                            )}
                            {isThird && (
                              <span className="inline-flex items-center gap-1 text-orange-700 font-black">
                                🥉 #3
                              </span>
                            )}
                            {!isFirst && !isSecond && !isThird && (
                              <span className="text-slate-500 font-bold">#{rank}</span>
                            )}
                          </td>

                          {/* Student Name */}
                          <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200">
                            <div className="flex items-center gap-2">
                              {student.avatar && <span className="text-base">{student.avatar}</span>}
                              <span className={isFirst ? 'text-amber-900 font-black' : ''}>
                                {student.name}
                              </span>
                            </div>
                          </td>

                          {/* Code */}
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-xs border-r border-slate-200">
                            {student.code || `HS-${String(idx + 1).padStart(3, '0')}`}
                          </td>

                          {/* Group */}
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-700 border-r border-slate-200">
                            {student.group || 'Tổ 1'}
                          </td>

                          {/* Stars */}
                          <td className="py-2.5 px-3 text-center font-black text-amber-600 border-r border-slate-200">
                            <span className="inline-flex items-center gap-1 bg-amber-100/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm">
                              {student.stars} ⭐
                            </span>
                          </td>

                          {/* Honor */}
                          <td className={`py-2.5 px-4 font-bold ${isFirst ? 'text-amber-800' : 'text-slate-700'}`}>
                            {honorTitle}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Motivational Slogan */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg text-center text-xs sm:text-sm italic text-amber-900 font-medium my-4">
                “Nhiệt liệt biểu dương tinh thần chăm ngoan, rèn luyện tích cực và thành tích xuất sắc của các em học sinh!”
              </div>

            </div>
          </div>
        </div>

        {/* 4. MODAL FOOTER HELP (NO-PRINT) */}
        <div className="no-print p-3.5 bg-slate-800 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Mẹo: Thầy/Cô bấm <strong>"Tải Ảnh Gửi Zalo"</strong> để lưu ngay ảnh PNG độ nét cao gửi vào nhóm phụ huynh.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>

      {/* 5. IMAGE PREVIEW POPUP (WHEN IMAGE IS GENERATED) */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 text-white shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm sm:text-base">Ảnh Bảng Danh Dự Đã Sẵn Sàng!</h4>
              </div>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 text-xs text-slate-300 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              💡 <strong>File ảnh PNG đã được tải xuống máy tính của Thầy/Cô.</strong><br/>
              Thầy/Cô cũng có thể nhấn giữ vào ảnh bên dưới (hoặc nhấp chuột phải) chọn <strong>"Sao chép hình ảnh"</strong> để dán trực tiếp vào khung chat Zalo!
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-2 rounded-xl border border-slate-800 flex justify-center">
              <img
                src={previewImageUrl}
                alt="Bảng Vàng Danh Dự"
                className="max-w-full h-auto rounded-lg shadow-md"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                onClick={handleCopyToClipboard}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSuccess ? 'Đã Sao Chép!' : 'Sao Chép Ảnh'}</span>
              </button>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-xs text-white cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
