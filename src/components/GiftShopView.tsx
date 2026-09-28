import React, { useState, useMemo } from 'react';
import {
  Gift,
  Plus,
  Star,
  Check,
  X,
  Edit2,
  Trash2,
  Sparkles,
  ShoppingBag,
  History,
  RotateCcw,
  Search,
  Filter,
  Download,
  Clock,
  User,
  Award,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  AlertTriangle,
  Users,
  CheckCheck,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GiftItem, GiftRedemptionRecord, Student } from '../types';
import { formatFullDateTime } from '../utils/dateUtils';

export const GiftShopView: React.FC = () => {
  const {
    gifts,
    students,
    classes,
    addGift,
    updateGift,
    deleteGift,
    redeemGift,
    redemptions,
    cancelRedemption,
    deleteRedemptionRecord,
    clearRedemptionHistory,
  } = useApp();

  // Tab: 'shop' | 'eligible' | 'history'
  const [activeSubTab, setActiveSubTab] = useState<'shop' | 'eligible' | 'history'>('shop');

  // Redeem modal state
  const [selectedGiftForRedeem, setSelectedGiftForRedeem] = useState<GiftItem | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [redeemNote, setRedeemNote] = useState<string>('');
  const [redeemFeedback, setRedeemFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [filterOnlyEligibleInModal, setFilterOnlyEligibleInModal] = useState<boolean>(true);
  const [modalStudentSearch, setModalStudentSearch] = useState<string>('');

  // Add / Edit Gift modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCost, setFormCost] = useState(10);
  const [formIcon, setFormIcon] = useState('🎁');
  const [formDesc, setFormDesc] = useState('');

  // History filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterGiftId, setFilterGiftId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'cancelled'>('all');

  // Eligible students tab filters & settings by teacher
  const [eligibleMode, setEligibleMode] = useState<'by_gift' | 'by_threshold'>('by_gift');
  const [eligibleSelectedGiftId, setEligibleSelectedGiftId] = useState<string>('all');
  const [teacherScoreThreshold, setTeacherScoreThreshold] = useState<number>(10);
  const [eligibleClassFilter, setEligibleClassFilter] = useState<string>('all');
  const [eligibleSearch, setEligibleSearch] = useState<string>('');

  // Confirmation dialogs
  const [confirmCancelRecord, setConfirmCancelRecord] = useState<GiftRedemptionRecord | null>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Modal open helpers
  const openAddGift = () => {
    setEditingGift(null);
    setFormName('');
    setFormCost(10);
    setFormIcon('🎁');
    setFormDesc('');
    setIsEditModalOpen(true);
  };

  const openEditGift = (gift: GiftItem) => {
    setEditingGift(gift);
    setFormName(gift.name);
    setFormCost(gift.cost);
    setFormIcon(gift.icon);
    setFormDesc(gift.description || '');
    setIsEditModalOpen(true);
  };

  const handleSaveGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingGift) {
      updateGift(editingGift.id, {
        name: formName.trim(),
        cost: formCost,
        icon: formIcon,
        description: formDesc.trim(),
      });
    } else {
      addGift({
        name: formName.trim(),
        cost: formCost,
        icon: formIcon,
        description: formDesc.trim(),
      });
    }
    setIsEditModalOpen(false);
  };

  const handleOpenRedeem = (gift: GiftItem, defaultStudentId?: string) => {
    setSelectedGiftForRedeem(gift);
    const eligible = students.filter((s) => s.stars >= gift.cost);
    if (defaultStudentId) {
      setSelectedStudentId(defaultStudentId);
    } else if (eligible.length > 0) {
      setSelectedStudentId(eligible[0].id);
    } else {
      setSelectedStudentId(students[0]?.id || '');
    }
    setFilterOnlyEligibleInModal(eligible.length > 0);
    setModalStudentSearch('');
    setRedeemNote('');
    setRedeemFeedback(null);
  };

  const handleConfirmRedeem = () => {
    if (!selectedGiftForRedeem || !selectedStudentId) return;

    const res = redeemGift(selectedGiftForRedeem.id, selectedStudentId, redeemNote);
    setRedeemFeedback(res);
    if (res.success) {
      setTimeout(() => {
        setSelectedGiftForRedeem(null);
        setRedeemFeedback(null);
        setRedeemNote('');
      }, 1800);
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  // Modal student list calculation
  const modalCandidateStudents = useMemo(() => {
    if (!selectedGiftForRedeem) return [];
    let list = students;
    if (filterOnlyEligibleInModal) {
      list = list.filter((s) => s.stars >= selectedGiftForRedeem.cost);
    }
    if (modalStudentSearch.trim()) {
      const q = modalStudentSearch.toLowerCase().trim();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q))
      );
    }
    return list;
  }, [students, selectedGiftForRedeem, filterOnlyEligibleInModal, modalStudentSearch]);

  const modalEligibleCount = useMemo(() => {
    if (!selectedGiftForRedeem) return 0;
    return students.filter((s) => s.stars >= selectedGiftForRedeem.cost).length;
  }, [students, selectedGiftForRedeem]);

  // Overall count of students with enough points for at least the lowest gift
  const minGiftCost = useMemo(() => {
    if (gifts.length === 0) return 0;
    return Math.min(...gifts.map((g) => g.cost));
  }, [gifts]);

  const studentsAbleToRedeemAnyGift = useMemo(() => {
    if (minGiftCost === 0) return [];
    return students.filter((s) => s.stars >= minGiftCost);
  }, [students, minGiftCost]);

  // Redemptions of the currently selected student in the modal
  const studentRecentRedemptions = useMemo(() => {
    if (!selectedStudentId) return [];
    return redemptions.filter((r) => r.studentId === selectedStudentId);
  }, [redemptions, selectedStudentId]);

  // ===================== ELIGIBLE STUDENTS TAB CALCULATION =====================
  const targetThreshold = useMemo(() => {
    if (eligibleMode === 'by_threshold') {
      return teacherScoreThreshold;
    }
    if (eligibleSelectedGiftId === 'all') {
      return minGiftCost;
    }
    const g = gifts.find((item) => item.id === eligibleSelectedGiftId);
    return g ? g.cost : minGiftCost;
  }, [eligibleMode, teacherScoreThreshold, eligibleSelectedGiftId, gifts, minGiftCost]);

  const eligibleStudentsList = useMemo(() => {
    return students
      .filter((s) => {
        // Star threshold check
        if (s.stars < targetThreshold) return false;

        // Class check
        if (eligibleClassFilter !== 'all' && s.classId !== eligibleClassFilter) {
          return false;
        }

        // Search check
        if (eligibleSearch.trim()) {
          const q = eligibleSearch.toLowerCase().trim();
          const matchName = s.name.toLowerCase().includes(q);
          const matchCode = s.code?.toLowerCase().includes(q);
          if (!matchName && !matchCode) return false;
        }

        return true;
      })
      .sort((a, b) => b.stars - a.stars);
  }, [students, targetThreshold, eligibleClassFilter, eligibleSearch]);

  // Export Eligible Students to CSV
  const handleExportEligibleCSV = () => {
    if (eligibleStudentsList.length === 0) {
      alert('Không có học sinh nào đủ điều kiện trong danh sách để xuất.');
      return;
    }
    const headers = ['STT,Mã HS,Họ Và Tên,Lớp,Số Sao Hiện Tại,Mốc Điểm Thiết Lập,Quà Có Thể Đổi\n'];
    const rows = eligibleStudentsList.map((stu, idx) => {
      const cls = classes.find((c) => c.id === stu.classId)?.name || 'Chưa phân lớp';
      const affordableGifts = gifts
        .filter((g) => g.cost <= stu.stars)
        .map((g) => `${g.name} (${g.cost}⭐)`)
        .join('; ');
      return `"${idx + 1}","${stu.code || ''}","${stu.name}","${cls}","${stu.stars}","${targetThreshold}","${affordableGifts}"\n`;
    });

    const blob = new Blob(['\uFEFF' + headers.concat(rows).join('')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Danh_Sach_Hoc_Sinh_Du_Diem_Doi_Qua_${targetThreshold}_Sao.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Filtered redemptions for History tab
  const filteredRedemptions = useMemo(() => {
    return redemptions.filter((record) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchStudent = record.studentName.toLowerCase().includes(q);
        const matchCode = record.studentCode?.toLowerCase().includes(q);
        const matchGift = record.giftName.toLowerCase().includes(q);
        const matchNote = record.note?.toLowerCase().includes(q);
        if (!matchStudent && !matchCode && !matchGift && !matchNote) {
          return false;
        }
      }

      // Filter class
      if (filterClassId !== 'all') {
        if (record.classId !== filterClassId) {
          return false;
        }
      }

      // Filter gift
      if (filterGiftId !== 'all') {
        if (record.giftId !== filterGiftId) {
          return false;
        }
      }

      // Filter status
      if (filterStatus !== 'all') {
        if (record.status !== filterStatus) {
          return false;
        }
      }

      return true;
    });
  }, [redemptions, searchQuery, filterClassId, filterGiftId, filterStatus]);

  // Statistics
  const completedRedemptions = useMemo(() => {
    return redemptions.filter((r) => r.status === 'completed');
  }, [redemptions]);

  const totalStarsRedeemed = useMemo(() => {
    return completedRedemptions.reduce((sum, r) => sum + r.cost, 0);
  }, [completedRedemptions]);

  // Most popular gift
  const mostPopularGift = useMemo(() => {
    if (completedRedemptions.length === 0) return null;
    const counts: Record<string, { count: number; name: string; icon: string }> = {};
    completedRedemptions.forEach((r) => {
      if (!counts[r.giftId]) {
        counts[r.giftId] = { count: 0, name: r.giftName, icon: r.giftIcon };
      }
      counts[r.giftId].count += 1;
    });
    const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
    return sorted[0] || null;
  }, [completedRedemptions]);

  // Top student redeemer
  const topStudentRedeemer = useMemo(() => {
    if (completedRedemptions.length === 0) return null;
    const counts: Record<string, { count: number; name: string; avatar?: string; starsSpent: number }> = {};
    completedRedemptions.forEach((r) => {
      if (!counts[r.studentId]) {
        counts[r.studentId] = {
          count: 0,
          name: r.studentName,
          avatar: r.studentAvatar,
          starsSpent: 0,
        };
      }
      counts[r.studentId].count += 1;
      counts[r.studentId].starsSpent += r.cost;
    });
    const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
    return sorted[0] || null;
  }, [completedRedemptions]);

  // Export Redemptions to CSV
  const handleExportCSV = () => {
    if (redemptions.length === 0) {
      alert('Chưa có lịch sử đổi quà nào để xuất file.');
      return;
    }

    const headers = ['STT,Thời Gian (Đầy Đủ),Mã HS,Họ Và Tên,Lớp,Phần Quà,Số Sao Đã Đổi,Trạng Thái,Ghi Chú\n'];
    const rows = redemptions.map((r, idx) => {
      const dt = formatFullDateTime(r.redeemedAt, r.dateFormatted);
      const statusLabel = r.status === 'completed' ? 'Đã nhận quà' : 'Đã hủy hoàn sao';
      const className = r.className || 'Chưa phân lớp';
      return `"${idx + 1}","${dt.detailed} (${dt.time} - ${dt.date})","${r.studentCode || ''}","${r.studentName}","${className}","${r.giftName}","${r.cost}","${statusLabel}","${r.note || ''}"\n`;
    });

    const blob = new Blob(['\uFEFF' + headers.concat(rows).join('')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Lich_Su_Doi_Qua_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-tr from-pink-500 to-rose-500 text-white rounded-xl shadow-xs">
              <Gift className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>CỬA HÀNG ĐỔI QUÀ & NHẬT KÝ</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200 font-bold">
                  Bé ngoan ⭐
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Quy đổi sao tích lũy lấy phần thưởng và tự động lưu trữ lịch sử đổi quà chi tiết
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 self-start md:self-auto">
          <button
            id="subtab-gift-shop-btn"
            onClick={() => setActiveSubTab('shop')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'shop'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cửa hàng ({gifts.length})</span>
          </button>

          <button
            id="subtab-gift-eligible-btn"
            onClick={() => setActiveSubTab('eligible')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer relative ${
              activeSubTab === 'eligible'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Học sinh đủ điểm đổi quà</span>
            {studentsAbleToRedeemAnyGift.length > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] font-extrabold rounded-full">
                {studentsAbleToRedeemAnyGift.length}
              </span>
            )}
          </button>

          <button
            id="subtab-gift-history-btn"
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer relative ${
              activeSubTab === 'history'
                ? 'bg-white text-pink-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch sử đổi quà</span>
            {redemptions.length > 0 && (
              <span className="px-1.5 py-0.2 bg-pink-500 text-white text-[10px] font-extrabold rounded-full">
                {redemptions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: SHOP ======================= */}
      {activeSubTab === 'shop' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-50/60 via-sky-50/40 to-white p-4 rounded-2xl border border-blue-100/80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600">
                Hiện có <strong className="text-blue-600 font-black">{gifts.length}</strong> món quà
              </span>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => setActiveSubTab('eligible')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline flex items-center gap-1 cursor-pointer"
              >
                <Users className="w-3 h-3" />
                <span>{studentsAbleToRedeemAnyGift.length} học sinh đủ điểm đổi quà</span>
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => setActiveSubTab('history')}
                className="text-xs font-bold text-pink-600 hover:text-pink-700 underline flex items-center gap-1 cursor-pointer"
              >
                <History className="w-3 h-3" />
                <span>Xem {redemptions.length} lượt đã đổi</span>
              </button>
            </div>

            <button
              id="add-gift-btn"
              onClick={openAddGift}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Phần Thưởng Mới</span>
            </button>
          </div>

          {/* Gifts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {gifts.map((gift) => {
              const eligibleForThisGift = students.filter((s) => s.stars >= gift.cost);
              const eligibleCount = eligibleForThisGift.length;

              return (
                <div
                  key={gift.id}
                  id={`gift-card-${gift.id}`}
                  className="bg-white rounded-3xl border border-blue-100 p-5 flex flex-col items-center justify-between text-center shadow-2xs hover:shadow-md transition-all group relative hover:border-blue-300"
                >
                  {/* Top actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditGift(gift)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                      title="Chỉnh sửa quà"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Xóa phần thưởng "${gift.name}"?`)) {
                          deleteGift(gift.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Xóa phần thưởng"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Redeemed count badge */}
                  {(gift.redeemedCount || 0) > 0 && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-black flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Đã đổi {gift.redeemedCount}</span>
                    </div>
                  )}

                  {/* Gift Icon */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-pink-50 via-sky-50 to-blue-50 border border-blue-100/50 flex items-center justify-center text-4xl shadow-inner mt-4 mb-2 group-hover:scale-105 transition-transform">
                    {gift.icon}
                  </div>

                  {/* Title & Cost */}
                  <div className="space-y-1 w-full">
                    <h3 className="font-extrabold text-sm text-slate-800 truncate" title={gift.name}>
                      {gift.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 min-h-[32px]">
                      {gift.description || 'Phần quà khích lệ bé ngoan học tốt'}
                    </p>
                  </div>

                  {/* Cost Badge */}
                  <div className="my-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full flex items-center gap-1 text-amber-800 font-black text-xs shadow-2xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{gift.cost} ⭐ Điểm đổi</span>
                  </div>

                  {/* Eligible Students Indicator */}
                  <div className="mb-3 w-full">
                    {eligibleCount > 0 ? (
                      <button
                        onClick={() => {
                          setEligibleMode('by_gift');
                          setEligibleSelectedGiftId(gift.id);
                          setActiveSubTab('eligible');
                        }}
                        className="w-full py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl text-[11px] font-bold text-emerald-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Xem danh sách học sinh có đủ điểm để đổi quà này"
                      >
                        <Users className="w-3 h-3 text-emerald-600" />
                        <span>{eligibleCount} em đủ điểm đổi</span>
                        <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
                      </button>
                    ) : (
                      <div className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[10px] font-medium text-slate-400 flex items-center justify-center gap-1">
                        <span>Chưa có em nào đủ {gift.cost} ⭐</span>
                      </div>
                    )}
                  </div>

                  {/* Redeem Button */}
                  <button
                    onClick={() => handleOpenRedeem(gift)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Đổi quà này</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================= TAB 2: ELIGIBLE STUDENTS (TỰ ĐỘNG LIỆT KÊ HỌC SINH ĐỦ ĐIỂM) ======================= */}
      {activeSubTab === 'eligible' && (
        <div className="space-y-6">
          {/* Settings & Configuration Bar */}
          <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                  <Sliders className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">
                    THIẾT LẬP LỌC & LIỆT KÊ HỌC SINH ĐỦ ĐIỂM ĐỔI QUÀ
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Hệ thống tự động rà soát điểm sao của học sinh theo tiêu chí và mốc do giáo viên lựa chọn
                  </p>
                </div>
              </div>

              {/* CSV Export Button */}
              <button
                onClick={handleExportEligibleCSV}
                disabled={eligibleStudentsList.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer self-start md:self-auto"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Xuất Danh Sách Excel ({eligibleStudentsList.length})</span>
              </button>
            </div>

            {/* Filter Modes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              {/* Mode Selection */}
              <div className="lg:col-span-4 space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Chế độ xét điều kiện điểm
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setEligibleMode('by_gift')}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      eligibleMode === 'by_gift'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Theo từng món quà
                  </button>
                  <button
                    onClick={() => setEligibleMode('by_threshold')}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      eligibleMode === 'by_threshold'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mốc sao giáo viên đặt
                  </button>
                </div>
              </div>

              {/* Criterion detail */}
              <div className="lg:col-span-4 space-y-1.5">
                {eligibleMode === 'by_gift' ? (
                  <>
                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                      Chọn món quà cần xét điều kiện
                    </label>
                    <select
                      value={eligibleSelectedGiftId}
                      onChange={(e) => setEligibleSelectedGiftId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                    >
                      <option value="all">Tất cả học sinh đủ đổi ít nhất 1 món quà ({minGiftCost}⭐)</option>
                      {gifts.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.icon} {g.name} — Cần {g.cost} ⭐ ({students.filter((s) => s.stars >= g.cost).length} em đủ)
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                      <span>Mốc sao tối thiểu do Thầy/Cô đặt</span>
                      <span className="text-emerald-700 font-black">{teacherScoreThreshold} ⭐</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={teacherScoreThreshold}
                        onChange={(e) => setTeacherScoreThreshold(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                      />
                      {/* Quick chips */}
                      <div className="flex flex-wrap items-center gap-1">
                        {[5, 10, 15, 20, 30, 50].map((val) => (
                          <button
                            key={val}
                            onClick={() => setTeacherScoreThreshold(val)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                              teacherScoreThreshold === val
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {val}⭐
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Class & Search filters */}
              <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Lọc theo lớp
                  </label>
                  <select
                    value={eligibleClassFilter}
                    onChange={(e) => setEligibleClassFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                  >
                    <option value="all">Tất cả lớp ({classes.length})</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Tìm tên / Mã HS
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={eligibleSearch}
                      onChange={(e) => setEligibleSearch(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Qualified Summary Banner */}
          <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 text-white p-5 rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shrink-0">
                <Sparkles className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <h4 className="text-base font-black flex items-center gap-2">
                  <span>Có {eligibleStudentsList.length} / {students.length} học sinh đủ điều kiện</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                    {students.length > 0 ? Math.round((eligibleStudentsList.length / students.length) * 100) : 0}% cả lớp
                  </span>
                </h4>
                <p className="text-xs text-white/80 font-medium mt-0.5">
                  Đang lọc các em đạt từ <strong className="text-amber-200 font-black">{targetThreshold} ⭐</strong> trở lên
                  {eligibleMode === 'by_gift' && eligibleSelectedGiftId !== 'all' && (
                    <span> (Phù hợp để đổi {gifts.find((g) => g.id === eligibleSelectedGiftId)?.name})</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
              <div className="text-center px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-xs">
                <span className="text-[11px] font-bold text-white/80 block uppercase">Mốc xét điểm</span>
                <span className="text-lg font-black text-amber-200">≥ {targetThreshold} ⭐</span>
              </div>
              <div className="text-center px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-xs">
                <span className="text-[11px] font-bold text-white/80 block uppercase">Đủ điều kiện</span>
                <span className="text-lg font-black text-white">{eligibleStudentsList.length} em</span>
              </div>
            </div>
          </div>

          {/* Qualified Students List */}
          {eligibleStudentsList.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto text-2xl">
                ⭐
              </div>
              <h4 className="text-base font-black text-slate-800">
                Chưa có học sinh nào đạt mốc {targetThreshold} ⭐
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Hiện tại trong lớp chưa có em nào đạt đủ số sao yêu cầu này.
                {students.length > 0 && (
                  <span>
                    {' '}Em đang dẫn đầu hiện tại là{' '}
                    <strong className="text-blue-600 font-bold">
                      {[...students].sort((a, b) => b.stars - a.stars)[0]?.name}
                    </strong>{' '}
                    với{' '}
                    <strong className="text-amber-600 font-bold">
                      {[...students].sort((a, b) => b.stars - a.stars)[0]?.stars} ⭐
                    </strong>.
                  </span>
                )}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setEligibleMode('by_threshold');
                    setTeacherScoreThreshold(minGiftCost || 5);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Hạ mốc điểm xuống {minGiftCost || 5} ⭐
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eligibleStudentsList.map((stu) => {
                const stuClass = classes.find((c) => c.id === stu.classId)?.name || 'Chưa phân lớp';
                // Gifts affordable by this student
                const affordableGifts = gifts.filter((g) => g.cost <= stu.stars);

                return (
                  <div
                    key={stu.id}
                    className="bg-white rounded-3xl border border-emerald-100/90 p-4 shadow-2xs hover:shadow-md transition-all space-y-3 relative group"
                  >
                    {/* Header with Avatar, Name & Stars */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl shrink-0">
                          {stu.avatar || '⭐'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-800 truncate" title={stu.name}>
                            {stu.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                            <span className="font-mono text-slate-500">{stu.code || 'HS'}</span>
                            <span>•</span>
                            <span className="truncate">{stuClass}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stars Badge */}
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-black shadow-2xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{stu.stars} ⭐</span>
                        </span>
                      </div>
                    </div>

                    {/* Affordable Gifts Chips */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Đủ điểm đổi {affordableGifts.length} phần quà:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto scrollbar-thin">
                        {affordableGifts.slice(0, 5).map((g) => (
                          <button
                            key={g.id}
                            onClick={() => handleOpenRedeem(g, stu.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                            title={`Nhấn để đổi ${g.name} cho em này (-${g.cost}⭐)`}
                          >
                            <span>{g.icon}</span>
                            <span className="truncate max-w-[90px]">{g.name}</span>
                            <span className="text-amber-600 font-extrabold">({g.cost}⭐)</span>
                          </button>
                        ))}
                        {affordableGifts.length > 5 && (
                          <span className="text-[10px] font-bold text-slate-400 px-1 py-0.5">
                            +{affordableGifts.length - 5} món khác
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action: Quick redeem */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          // Select the best gift or the selected gift in filter
                          const giftToRedeem =
                            (eligibleSelectedGiftId !== 'all' && gifts.find((g) => g.id === eligibleSelectedGiftId)) ||
                            affordableGifts[affordableGifts.length - 1] ||
                            gifts[0];
                          if (giftToRedeem) {
                            handleOpenRedeem(giftToRedeem, stu.id);
                          }
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Chọn Quà Đổi Cho Em Này</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 3: HISTORY ======================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Total redemptions */}
            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-xl shrink-0">
                <History className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tổng Lượt Đổi
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-800">
                    {completedRedemptions.length}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">lượt thành công</span>
                </div>
              </div>
            </div>

            {/* Stat 2: Total stars spent */}
            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tổng Sao Đã Quy Đổi
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-600">
                    {totalStarsRedeemed}
                  </span>
                  <span className="text-xs text-amber-700 font-semibold">⭐ sao</span>
                </div>
              </div>
            </div>

            {/* Stat 3: Most popular gift */}
            <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-2xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-2xl shrink-0">
                {mostPopularGift ? mostPopularGift.icon : '🎁'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Quà Được Đổi Nhiều Nhất
                </p>
                {mostPopularGift ? (
                  <div className="truncate">
                    <span className="text-sm font-extrabold text-slate-800 truncate block">
                      {mostPopularGift.name}
                    </span>
                    <span className="text-xs text-sky-600 font-bold">
                      {mostPopularGift.count} lượt đổi
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Chưa có dữ liệu</span>
                )}
              </div>
            </div>

            {/* Stat 4: Top student redeemer */}
            <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-2xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl shrink-0">
                {topStudentRedeemer ? topStudentRedeemer.avatar || '⭐' : <Award className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Học Sinh Đổi Nhiều Quà Nhất
                </p>
                {topStudentRedeemer ? (
                  <div className="truncate">
                    <span className="text-sm font-extrabold text-slate-800 truncate block">
                      {topStudentRedeemer.name}
                    </span>
                    <span className="text-xs text-purple-600 font-bold">
                      {topStudentRedeemer.count} quà ({topStudentRedeemer.starsSpent} ⭐)
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Chưa có dữ liệu</span>
                )}
              </div>
            </div>
          </div>

          {/* Filter and Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search box */}
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm học sinh, mã HS, quà..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Class Filter */}
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-400 cursor-pointer"
              >
                <option value="all">Tất cả các lớp ({classes.length})</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>

              {/* Gift Filter */}
              <select
                value={filterGiftId}
                onChange={(e) => setFilterGiftId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-400 cursor-pointer"
              >
                <option value="all">Tất cả phần quà ({gifts.length})</option>
                {gifts.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.icon} {g.name} ({g.cost} ⭐)
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-400 cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="completed">Đã nhận quà</option>
                <option value="cancelled">Đã hủy hoàn sao</option>
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="export-redemption-csv-btn"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Xuất danh sách ra file CSV / Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Xuất CSV</span>
              </button>

              {redemptions.length > 0 && (
                <button
                  id="clear-redemption-history-btn"
                  onClick={() => setIsConfirmClearOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Xóa toàn bộ lịch sử đổi quà"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa lịch sử</span>
                </button>
              )}
            </div>
          </div>

          {/* Redemptions Table / List */}
          <div className="bg-white rounded-3xl border border-blue-100 shadow-2xs overflow-hidden">
            {filteredRedemptions.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center mx-auto text-3xl">
                  📜
                </div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {redemptions.length === 0
                    ? 'Chưa có lịch sử đổi quà nào'
                    : 'Không tìm thấy lượt đổi quà nào phù hợp'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {redemptions.length === 0
                    ? 'Khi học sinh đổi quà bé ngoan tại cửa hàng, lịch sử sẽ tự động được ghi lại đầy đủ và chi tiết tại đây.'
                    : 'Thử điều chỉnh lại từ khóa tìm kiếm hoặc các tiêu chí bộ lọc phía trên.'}
                </p>
                {redemptions.length === 0 && (
                  <button
                    onClick={() => setActiveSubTab('shop')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer mt-2"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Đến cửa hàng đổi quà ngay</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Thời gian (Giờ & Ngày Tháng Năm)</th>
                      <th className="py-3.5 px-4">Học sinh nhận quà</th>
                      <th className="py-3.5 px-4">Lớp</th>
                      <th className="py-3.5 px-4">Phần quà</th>
                      <th className="py-3.5 px-4">Số sao đổi</th>
                      <th className="py-3.5 px-4">Ghi chú</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredRedemptions.map((record) => {
                      const isCompleted = record.status === 'completed';
                      return (
                        <tr
                          key={record.id}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                          {/* Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {(() => {
                              const dt = formatFullDateTime(record.redeemedAt, record.dateFormatted);
                              return (
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span className="font-mono text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-extrabold">
                                      {dt.time}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-xs font-bold text-slate-700">{dt.date}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium pl-5">
                                    {dt.detailed}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>

                          {/* Student */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl shrink-0">
                                {record.studentAvatar || '🐼'}
                              </span>
                              <div className="min-w-0">
                                <span className="font-black text-slate-800 block truncate">
                                  {record.studentName}
                                </span>
                                {record.studentCode && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {record.studentCode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Class */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                              {record.className || 'Lớp mặc định'}
                            </span>
                          </td>

                          {/* Gift */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{record.giftIcon}</span>
                              <span className="font-extrabold text-slate-800">
                                {record.giftName}
                              </span>
                            </div>
                          </td>

                          {/* Stars */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>-{record.cost} ⭐</span>
                            </span>
                          </td>

                          {/* Note */}
                          <td className="py-3.5 px-4">
                            <span className="text-slate-500 italic max-w-xs truncate block">
                              {record.note || '—'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Đã nhận quà</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200 line-through">
                                <RotateCcw className="w-3 h-3" />
                                <span>Đã hủy (Hoàn sao)</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isCompleted && (
                                <button
                                  onClick={() => setConfirmCancelRecord(record)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                                  title="Hủy lượt đổi quà và hoàn lại số sao cho học sinh"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Hoàn sao</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (confirm(`Xóa dòng lịch sử này của ${record.studentName}?`)) {
                                    deleteRedemptionRecord(record.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa dòng lịch sử này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= REDEEM GIFT MODAL ======================= */}
      {selectedGiftForRedeem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-blue-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl p-1 bg-pink-50 rounded-xl border border-pink-100">
                  {selectedGiftForRedeem.icon}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Đổi Quà: {selectedGiftForRedeem.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chi phí: <strong className="text-amber-600">{selectedGiftForRedeem.cost} ⭐ Sao</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGiftForRedeem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cost Banner */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span className="font-bold text-amber-900">Chi phí đổi quà:</span>
              </div>
              <span className="font-black text-amber-700 text-sm">
                {selectedGiftForRedeem.cost} ⭐
              </span>
            </div>

            {/* Select Student Section with Auto-Filter for Eligible Students */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Chọn học sinh nhận quà *
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFilterOnlyEligibleInModal(true)}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      filterOnlyEligibleInModal
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Chỉ em đủ điểm ({modalEligibleCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterOnlyEligibleInModal(false)}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      !filterOnlyEligibleInModal
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({students.length})
                  </button>
                </div>
              </div>

              {/* Search bar inside modal */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm nhanh học sinh theo tên hoặc mã..."
                  value={modalStudentSearch}
                  onChange={(e) => setModalStudentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
                {modalStudentSearch && (
                  <button
                    type="button"
                    onClick={() => setModalStudentSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* If no students match filter */}
              {modalCandidateStudents.length === 0 ? (
                <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-bold text-amber-900">
                    Không tìm thấy học sinh nào đủ {selectedGiftForRedeem.cost} ⭐ trong danh sách.
                  </p>
                  {filterOnlyEligibleInModal && (
                    <button
                      type="button"
                      onClick={() => setFilterOnlyEligibleInModal(false)}
                      className="px-3 py-1 bg-white border border-amber-300 text-amber-800 rounded-lg text-xs font-bold shadow-2xs hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      Bấm để hiển thị tất cả học sinh trong lớp
                    </button>
                  )}
                </div>
              ) : (
                /* Clickable list of candidate students */
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-1 bg-slate-50/80 border border-slate-200/80 rounded-2xl scrollbar-thin">
                  {modalCandidateStudents.map((stu) => {
                    const isSelected = stu.id === selectedStudentId;
                    const isEligible = stu.stars >= selectedGiftForRedeem.cost;

                    return (
                      <button
                        type="button"
                        key={stu.id}
                        onClick={() => setSelectedStudentId(stu.id)}
                        className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white hover:bg-blue-50/50 text-slate-700 border border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg">{stu.avatar || '⭐'}</span>
                          <div className="min-w-0">
                            <span
                              className={`text-xs font-extrabold truncate block ${
                                isSelected ? 'text-white' : 'text-slate-800'
                              }`}
                            >
                              {stu.name}
                            </span>
                            <span
                              className={`text-[10px] font-mono block ${
                                isSelected ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            >
                              {stu.code || 'HS'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : isEligible
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}
                          >
                            {stu.stars} ⭐ {isEligible ? '✓ Đủ' : 'Thiếu'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Standard Select as additional option */}
              <div className="pt-1">
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-400 cursor-pointer"
                >
                  <option value="" disabled>-- Hoặc chọn học sinh từ danh sách thả xuống --</option>
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.name} ({stu.code || 'HS'}) — Có {stu.stars} ⭐ {stu.stars < selectedGiftForRedeem.cost ? '(Thiếu sao)' : '(Đủ điểm ✓)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Student Preview */}
            {currentStudent && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{currentStudent.avatar}</span>
                    <div>
                      <span className="font-extrabold text-slate-800 block">
                        {currentStudent.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {currentStudent.code}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Số sao hiện tại</span>
                    <span
                      className={`font-black text-sm ${
                        currentStudent.stars >= selectedGiftForRedeem.cost
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {currentStudent.stars} ⭐
                    </span>
                  </div>
                </div>

                {/* Stars balance after redemption */}
                {currentStudent.stars >= selectedGiftForRedeem.cost ? (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl flex items-center justify-between font-bold">
                    <span>Số sao còn lại sau khi đổi:</span>
                    <span>{currentStudent.stars - selectedGiftForRedeem.cost} ⭐</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl flex items-center justify-between font-bold">
                    <span>Còn thiếu:</span>
                    <span>{selectedGiftForRedeem.cost - currentStudent.stars} ⭐ để đổi</span>
                  </div>
                )}
              </div>
            )}

            {/* Note input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú đổi quà (tùy chọn)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Bé ngoan tuần 2, Phần thưởng chăm chỉ..."
                value={redeemNote}
                onChange={(e) => setRedeemNote(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Student Recent Redemptions History */}
            {studentRecentRedemptions.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <History className="w-3 h-3 text-slate-400" />
                    <span>Lịch sử đổi quà gần đây của em ({studentRecentRedemptions.length} lần)</span>
                  </span>
                </div>
                <div className="space-y-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                  {studentRecentRedemptions.slice(0, 3).map((hist) => (
                    <div
                      key={hist.id}
                      className="p-1.5 px-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{hist.giftIcon}</span>
                        <span className="font-semibold text-slate-700">{hist.giftName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>-{hist.cost} ⭐</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">
                          {formatFullDateTime(hist.redeemedAt, hist.dateFormatted).full}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback alert */}
            {redeemFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  redeemFeedback.success
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {redeemFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{redeemFeedback.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedGiftForRedeem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRedeem}
                disabled={!currentStudent || currentStudent.stars < selectedGiftForRedeem.cost}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Đổi Quà (-{selectedGiftForRedeem.cost} ⭐)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= ADD / EDIT GIFT MODAL ======================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-blue-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-800">
                {editingGift ? 'Chỉnh Sửa Phần Thưởng' : 'Thêm Phần Thưởng Mới'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên phần thưởng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bút chì nhiều màu"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số sao cần đổi (⭐)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={formCost}
                    onChange={(e) => setFormCost(parseInt(e.target.value, 10) || 10)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Biểu tượng Icon
                  </label>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center text-lg focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả phần thưởng (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hình dán lấp lánh tặng bé ngoan"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  Lưu Phần Thưởng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= CONFIRM CANCEL / REFUND MODAL ======================= */}
      {confirmCancelRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-amber-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Xác Nhận Hủy & Hoàn Sao
                </h3>
                <p className="text-xs text-slate-400">
                  Hủy lượt đổi quà và hoàn điểm sao lại cho học sinh
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-slate-700 space-y-1.5">
              <p>
                Bạn có chắc muốn hủy lượt đổi quà <strong>"{confirmCancelRecord.giftName}"</strong> của học sinh{' '}
                <strong>{confirmCancelRecord.studentName}</strong>?
              </p>
              <p className="font-bold text-amber-800 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Số sao sẽ được hoàn lại: +{confirmCancelRecord.cost} ⭐</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmCancelRecord(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  cancelRedemption(confirmCancelRecord.id, true);
                  setConfirmCancelRecord(null);
                }}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Xác Nhận Hoàn Sao
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= CONFIRM CLEAR HISTORY MODAL ======================= */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-rose-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Xác Nhận Xóa Toàn Bộ Lịch Sử?
                </h3>
                <p className="text-xs text-slate-400">
                  Thao tác này không thể hoàn tác
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-rose-50 p-3 rounded-2xl border border-rose-100">
              Toàn bộ <strong>{redemptions.length}</strong> dòng lịch sử đổi quà sẽ bị xóa bỏ hoàn toàn.
              Điểm sao hiện tại của học sinh sẽ không bị thay đổi.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  clearRedemptionHistory();
                  setIsConfirmClearOpen(false);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Xóa Toàn Bộ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
