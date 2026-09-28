import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { downloadStudentTemplateExcel, parseStudentExcel, ParsedStudentRow } from '../utils/excelHelper';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClassId?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  defaultClassId,
}) => {
  const { classes, activeClassId, addMultipleStudentsToClass, playSound } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(
    defaultClassId || activeClassId || (classes[0] ? classes[0].id : '')
  );
  const [parsedList, setParsedList] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync defaultClassId when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedClassId(defaultClassId || activeClassId || (classes[0] ? classes[0].id : ''));
      setParsedList([]);
      setFileName('');
      setErrorMessage('');
      setIsSuccess(false);
      setImportedCount(0);
    }
  }, [isOpen, defaultClassId, activeClassId, classes]);

  if (!isOpen) return null;

  const targetClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleFileProcess = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMessage('Vui lòng chọn định dạng file Excel (.xlsx, .xls) hoặc .csv');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setFileName(file.name);

    try {
      const rows = await parseStudentExcel(file);
      if (rows.length === 0) {
        setErrorMessage('Không tìm thấy dữ liệu học sinh hợp lệ nào trong file. Thầy/Cô vui lòng xem file mẫu.');
        setParsedList([]);
      } else {
        setParsedList(rows);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra định dạng dữ liệu.');
      setParsedList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveRow = (index: number) => {
    setParsedList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = () => {
    if (!selectedClassId) {
      setErrorMessage('Vui lòng chọn lớp học để nhập danh sách');
      return;
    }

    if (parsedList.length === 0) {
      setErrorMessage('Chưa có học sinh nào để nhập');
      return;
    }

    const count = addMultipleStudentsToClass(parsedList, selectedClassId);
    setImportedCount(count);
    setIsSuccess(true);

    // Play chime & confetti
    playSound('praise');
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-sky-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md shadow-xs text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <span>Nhập Danh Sách Học Sinh Bằng File Excel</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  .xlsx / .xls
                </span>
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Thêm đồng thời nhiều học sinh vào lớp nhanh chóng và chính xác
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isSuccess ? (
            <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">Nhập Danh Sách Thành Công!</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Đã thêm thành công <span className="font-bold text-blue-600">{importedCount} học sinh</span> vào lớp{' '}
                  <span className="font-bold text-slate-800">{targetClass?.name}</span>.
                </p>
              </div>
              <div className="text-xs text-slate-400">Đang quay trở lại danh sách lớp học...</div>
            </div>
          ) : (
            <>
              {/* Step 1: Chọn lớp đích & Tải file mẫu */}
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/70">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    1. Chọn lớp học tiếp nhận học sinh <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code}) - GV: {c.teacher}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Upload Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">2. Chọn hoặc kéo thả tệp Excel</span>
                  <button
                    type="button"
                    onClick={downloadStudentTemplateExcel}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải file Excel mẫu (.xlsx)</span>
                  </button>
                </div>

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                      : fileName
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <UploadCloud className="w-6 h-6" />
                    </div>

                    {fileName ? (
                      <div>
                        <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4 stroke-[3]" /> {fileName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Nhấp vào đây nếu muốn chọn file khác</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Nhấp để tải tệp Excel lên hoặc kéo thả tệp vào đây
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Hỗ trợ định dạng .xlsx, .xls hoặc .csv (Chứa các cột: Họ và tên, Giới tính, Ngày sinh, SĐT...)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {isLoading && (
                  <div className="text-center py-2 text-xs font-medium text-blue-600 animate-pulse">
                    Đang xử lý và phân tích tệp Excel...
                  </div>
                )}

                {errorMessage && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Step 3: Preview Table */}
              {parsedList.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        Xem trước dữ liệu ({parsedList.length} học sinh)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Hợp lệ
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Sẽ thêm vào: <strong className="text-blue-700">{targetClass?.name}</strong>
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 sticky top-0 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-10 text-center">STT</th>
                          <th className="p-2.5">Họ và tên</th>
                          <th className="p-2.5 w-16 text-center">Giới tính</th>
                          <th className="p-2.5">Ngày sinh</th>
                          <th className="p-2.5">Phụ huynh</th>
                          <th className="p-2.5">SĐT</th>
                          <th className="p-2.5 w-10 text-center">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedList.map((stu, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                            <td className="p-2.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900">{stu.name}</td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  stu.gender === 'Nữ'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}
                              >
                                {stu.gender}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-600">{stu.dob || '—'}</td>
                            <td className="p-2.5 text-slate-600">{stu.parentName || '—'}</td>
                            <td className="p-2.5 text-slate-600 font-mono">{stu.parentPhone || stu.phone || '—'}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(idx)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Bỏ dòng này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              disabled={parsedList.length === 0}
              onClick={handleConfirmImport}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                parsedList.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Xác nhận nhập {parsedList.length} học sinh vào lớp</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
