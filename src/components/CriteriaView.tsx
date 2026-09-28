import React, { useState, useMemo } from 'react';
import {
  Star,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Award,
  Sparkles,
  Check,
  Search,
  Copy,
  ArrowUpDown,
  Filter,
  Zap,
  CheckCircle2,
  LayoutGrid,
  List,
  Flame,
  ShieldCheck,
  TrendingUp,
  HeartHandshake,
  Lightbulb,
  BookOpenCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CriteriaItem } from '../types';

interface PresetIcon {
  icon: string;
  name: string;
  category: 'study' | 'positive' | 'penalty' | 'mascot';
}

const ICON_CATALOG: PresetIcon[] = [
  // Học tập & Khen thưởng
  { icon: '⭐', name: 'Ngôi sao', category: 'study' },
  { icon: '🌟', name: 'Tỏa sáng', category: 'study' },
  { icon: '🏆', name: 'Cúp vàng', category: 'study' },
  { icon: '🥇', name: 'Huy chương', category: 'study' },
  { icon: '🎯', name: 'Mục tiêu tốt', category: 'study' },
  { icon: '📚', name: 'Sách vở', category: 'study' },
  { icon: '📖', name: 'Đọc sách tốt', category: 'study' },
  { icon: '✍️', name: 'Viết bài nắn nót', category: 'study' },
  { icon: '💡', name: 'Sáng tạo / Ý tưởng hay', category: 'study' },
  { icon: '🧠', name: 'Tư duy logic', category: 'study' },
  { icon: '🎓', name: 'Học sinh xuất sắc', category: 'study' },
  { icon: '💯', name: 'Điểm mười tuyệt đối', category: 'study' },
  { icon: '🎨', name: 'Mỹ thuật khéo tay', category: 'study' },
  { icon: '🔬', name: 'Thí nghiệm khoa học', category: 'study' },
  { icon: '📐', name: 'Toán học hình học', category: 'study' },
  { icon: '🚀', name: 'Tiến bộ vượt bậc', category: 'study' },
  { icon: '🎵', name: 'Âm nhạc hát hay', category: 'study' },
  { icon: '⚽', name: 'Thể thao năng động', category: 'study' },

  // Nền nếp & Thái độ tích cực
  { icon: '🙋', name: 'Hăng hái phát biểu', category: 'positive' },
  { icon: '🙋‍♂️', name: 'Nam hăng hái', category: 'positive' },
  { icon: '🙋‍♀️', name: 'Nữ hăng hái', category: 'positive' },
  { icon: '👏', name: 'Vỗ tay / Tuyên dương', category: 'positive' },
  { icon: '🧹', name: 'Trực nhật sạch sẽ', category: 'positive' },
  { icon: '🤝', name: 'Giúp đỡ bạn bè', category: 'positive' },
  { icon: '💖', name: 'Yêu thương hòa đồng', category: 'positive' },
  { icon: '🕊️', name: 'Thân thiện hòa nhã', category: 'positive' },
  { icon: '🌱', name: 'Chăm ngoan mỗi ngày', category: 'positive' },
  { icon: '☀️', name: 'Năng nổ tích cực', category: 'positive' },
  { icon: '🌈', name: 'Vui tươi lễ phép', category: 'positive' },
  { icon: '👑', name: 'Gương mẫu tiêu biểu', category: 'positive' },
  { icon: '😇', name: 'Ngoan ngoãn', category: 'positive' },
  { icon: '🛡️', name: 'Chấp hành kỷ luật tốt', category: 'positive' },
  { icon: '⏱️', name: 'Đúng giờ chuẩn mực', category: 'positive' },
  { icon: '🌻', name: 'Bông hoa việc tốt', category: 'positive' },
  { icon: '🎁', name: 'Đóng góp tập thể', category: 'positive' },
  { icon: '🍀', name: 'May mắn tích cực', category: 'positive' },

  // Nhắc nhở & Kỷ luật (- điểm)
  { icon: '💬', name: 'Nói chuyện riêng', category: 'penalty' },
  { icon: '🤫', name: 'Mất trật tự', category: 'penalty' },
  { icon: '⏰', name: 'Đi học muộn', category: 'penalty' },
  { icon: '✏️', name: 'Quên đồ dùng học tập', category: 'penalty' },
  { icon: '💤', name: 'Ngủ gật trong giờ', category: 'penalty' },
  { icon: '📱', name: 'Dùng điện thoại riêng', category: 'penalty' },
  { icon: '🏃', name: 'Chạy nhảy xô đẩy', category: 'penalty' },
  { icon: '🍔', name: 'Ăn quà trong lớp', category: 'penalty' },
  { icon: '🗑️', name: 'Xả rác không đúng nơi', category: 'penalty' },
  { icon: '⚠️', name: 'Cảnh báo vi phạm', category: 'penalty' },
  { icon: '❌', name: 'Chưa hoàn thành bài', category: 'penalty' },
  { icon: '🛑', name: 'Dừng hành vi sai', category: 'penalty' },
  { icon: '💢', name: 'Gây gổ / Cãi vã', category: 'penalty' },
  { icon: '🩹', name: 'Bất cẩn / Va chạm', category: 'penalty' },
  { icon: '📉', name: 'Sa sút phong độ', category: 'penalty' },
  { icon: '🚫', name: 'Vi phạm nội quy lớp', category: 'penalty' },
  { icon: '🥱', name: 'Mất tập trung', category: 'penalty' },
  { icon: '🤦', name: 'Quên làm bài về nhà', category: 'penalty' },
  { icon: '⚡', name: 'Bất hòa trong tổ', category: 'penalty' },
  { icon: '🚯', name: 'Vứt rác bừa bãi', category: 'penalty' },

  // Linh vật & Động vật vui nhộn
  { icon: '🐼', name: 'Gấu trúc đáng yêu', category: 'mascot' },
  { icon: '🐨', name: 'Gấu Koala', category: 'mascot' },
  { icon: '🐱', name: 'Mèo con lanh lợi', category: 'mascot' },
  { icon: '🐶', name: 'Cún con trung thành', category: 'mascot' },
  { icon: '🦁', name: 'Sư tử dũng cảm', category: 'mascot' },
  { icon: '🐯', name: 'Hổ con mạnh mẽ', category: 'mascot' },
  { icon: '🐰', name: 'Thỏ trắng nhanh nhẹn', category: 'mascot' },
  { icon: '🦊', name: 'Cáo thông thái', category: 'mascot' },
  { icon: '🐻', name: 'Gấu nâu khỏe khoắn', category: 'mascot' },
  { icon: '🦉', name: 'Cú mèo chăm chỉ', category: 'mascot' },
  { icon: '🐝', name: 'Ong chăm ngoan', category: 'mascot' },
  { icon: '🐬', name: 'Cá heo thông minh', category: 'mascot' },
  { icon: '🦄', name: 'Kỳ lân ước mơ', category: 'mascot' },
  { icon: '🦖', name: 'Khủng long dũng mãnh', category: 'mascot' },
  { icon: '🐢', name: 'Rùa kiên trì', category: 'mascot' },
  { icon: '🐧', name: 'Cánh cụt dễ thương', category: 'mascot' },
  { icon: '🐘', name: 'Voi hiền lành', category: 'mascot' },
  { icon: '🐒', name: 'Khỉ thông minh', category: 'mascot' },
];

// Gợi ý một chạm khi thêm tiêu chí
const REWARD_PRESETS = [
  { title: 'Hăng hái phát biểu xây dựng bài', points: 1, icon: '🙋' },
  { title: 'Chuẩn bị sách vở và đồ dùng tốt', points: 1, icon: '📚' },
  { title: 'Làm bài tập đầy đủ, nắn nót', points: 2, icon: '✍️' },
  { title: 'Trực nhật lớp sạch sẽ gọn gàng', points: 2, icon: '🧹' },
  { title: 'Giúp đỡ bạn bè cùng tiến bộ', points: 1, icon: '🤝' },
  { title: 'Đạt điểm 10 trong giờ kiểm tra', points: 5, icon: '💯' },
  { title: 'Ý tưởng sáng tạo, giải bài hay', points: 2, icon: '💡' },
  { title: 'Chăm ngoan, gương mẫu cả tuần', points: 3, icon: '👑' },
  { title: 'Tiến bộ vượt bậc môn học', points: 3, icon: '🚀' },
  { title: 'Tích cực hoạt động văn thể mỹ', points: 2, icon: '🎨' },
];

const PENALTY_PRESETS = [
  { title: 'Nói chuyện riêng trong giờ học', points: -1, icon: '💬' },
  { title: 'Quên mang đồ dùng học tập / sách', points: -1, icon: '✏️' },
  { title: 'Đi học muộn hoặc vào lớp muộn', points: -1, icon: '⏰' },
  { title: 'Chưa làm bài tập về nhà', points: -2, icon: '❌' },
  { title: 'Mất trật tự, làm ồn trong lớp', points: -2, icon: '🤫' },
  { title: 'Xả rác bừa bãi trong lớp / sân', points: -1, icon: '🗑️' },
  { title: 'Ăn quà vặt trong giờ học', points: -1, icon: '🍔' },
  { title: 'Chạy nhảy, xô đẩy nguy hiểm', points: -2, icon: '🏃' },
  { title: 'Mất tập trung, ngủ gật trong giờ', points: -1, icon: '💤' },
  { title: 'Gây gổ, tranh cãi với bạn bè', points: -3, icon: '💢' },
];

export const CriteriaView: React.FC = () => {
  const { criteria, addCriteria, updateCriteria, deleteCriteria } = useApp();

  // Navigation & Search/Filter states
  const [activeTab, setActiveTab] = useState<'all' | 'reward' | 'penalty'>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'points-desc' | 'points-asc' | 'name'>('default');
  const [pointFilter, setPointFilter] = useState<'all' | '1' | '2' | '3+'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CriteriaItem | null>(null);
  const [modalType, setModalType] = useState<'reward' | 'penalty'>('reward');
  const [formTitle, setFormTitle] = useState('');
  const [formPoints, setFormPoints] = useState<number>(1);
  const [formIcon, setFormIcon] = useState('⭐');
  
  // Icon Picker Filter states
  const [iconCategory, setIconCategory] = useState<'all' | 'study' | 'positive' | 'penalty' | 'mascot'>('all');
  const [iconSearch, setIconSearch] = useState('');

  // Delete confirmation modal state
  const [criteriaToDelete, setCriteriaToDelete] = useState<CriteriaItem | null>(null);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Base lists
  const allRewards = useMemo(() => criteria.filter(c => c.type === 'reward'), [criteria]);
  const allPenalties = useMemo(() => criteria.filter(c => c.type === 'penalty'), [criteria]);

  // Summary Metrics
  const maxRewardPts = useMemo(() => {
    if (allRewards.length === 0) return 0;
    return Math.max(...allRewards.map(r => r.points));
  }, [allRewards]);

  const maxPenaltyPts = useMemo(() => {
    if (allPenalties.length === 0) return 0;
    return Math.min(...allPenalties.map(p => p.points));
  }, [allPenalties]);

  // Filter and sort criteria helper
  const processList = (items: CriteriaItem[]) => {
    let result = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) ||
        Math.abs(item.points).toString().includes(q)
      );
    }

    // Point level filter
    if (pointFilter === '1') {
      result = result.filter(item => Math.abs(item.points) === 1);
    } else if (pointFilter === '2') {
      result = result.filter(item => Math.abs(item.points) === 2);
    } else if (pointFilter === '3+') {
      result = result.filter(item => Math.abs(item.points) >= 3);
    }

    // Sorting
    if (sortBy === 'points-desc') {
      result.sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
    } else if (sortBy === 'points-asc') {
      result.sort((a, b) => Math.abs(a.points) - Math.abs(b.points));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    }

    return result;
  };

  const filteredRewards = useMemo(() => processList(allRewards), [allRewards, searchQuery, pointFilter, sortBy]);
  const filteredPenalties = useMemo(() => processList(allPenalties), [allPenalties, searchQuery, pointFilter, sortBy]);

  // Quick inline point adjustment
  const quickAdjustPoints = (item: CriteriaItem, delta: number) => {
    let newPts = item.points;
    if (item.type === 'reward') {
      newPts = Math.max(1, item.points + delta);
    } else {
      const currAbs = Math.abs(item.points);
      const newAbs = Math.max(1, currAbs + delta);
      newPts = -newAbs;
    }
    updateCriteria(item.id, { points: newPts });
    showToast(`Đã đổi điểm "${item.title}" thành ${newPts > 0 ? `+${newPts}` : newPts}đ`);
  };

  // Duplicate criteria
  const duplicateCriteria = (item: CriteriaItem) => {
    addCriteria({
      title: `${item.title} (Bản sao)`,
      points: item.points,
      type: item.type,
      icon: item.icon || (item.type === 'reward' ? '⭐' : '⚠️'),
    });
    showToast(`Đã sao chép tiêu chí "${item.title}"`);
  };

  const openAddModal = (type: 'reward' | 'penalty') => {
    setEditingItem(null);
    setModalType(type);
    setFormTitle('');
    setFormPoints(type === 'reward' ? 1 : 1);
    setFormIcon(type === 'reward' ? '⭐' : '💬');
    setIconCategory(type === 'reward' ? 'study' : 'penalty');
    setIconSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: CriteriaItem) => {
    setEditingItem(item);
    setModalType(item.type);
    setFormTitle(item.title);
    setFormPoints(Math.abs(item.points));
    setFormIcon(item.icon || (item.type === 'reward' ? '⭐' : '💬'));
    setIconCategory(item.type === 'reward' ? 'study' : 'penalty');
    setIconSearch('');
    setIsModalOpen(true);
  };

  const applyPreset = (preset: { title: string; points: number; icon: string }) => {
    setFormTitle(preset.title);
    setFormPoints(Math.abs(preset.points));
    setFormIcon(preset.icon);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let finalPoints = Math.abs(formPoints);
    if (modalType === 'penalty') {
      finalPoints = -Math.abs(formPoints);
    }

    if (editingItem) {
      updateCriteria(editingItem.id, {
        title: formTitle.trim(),
        points: finalPoints,
        type: modalType,
        icon: formIcon.trim() || (modalType === 'reward' ? '⭐' : '⚠️'),
      });
      showToast(`Đã cập nhật: "${formTitle.trim()}"`);
    } else {
      addCriteria({
        title: formTitle.trim(),
        points: finalPoints,
        type: modalType,
        icon: formIcon.trim() || (modalType === 'reward' ? '⭐' : '⚠️'),
      });
      showToast(`Đã thêm mới: "${formTitle.trim()}"`);
    }
    setIsModalOpen(false);
  };

  const filteredIcons = ICON_CATALOG.filter(item => {
    const matchCategory = iconCategory === 'all' || item.category === iconCategory;
    const matchSearch = !iconSearch.trim() || 
      item.name.toLowerCase().includes(iconSearch.toLowerCase()) || 
      item.icon.includes(iconSearch.trim());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[90] bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 text-xs font-bold flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Welcome Header Banner - Ocean Blue Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white p-6 sm:p-7 shadow-lg shadow-blue-500/15">
        {/* Background decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 right-1/3 w-48 h-48 bg-sky-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-sky-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>Hệ Thống Đánh Giá Thi Đua & Rèn Luyện Học Sinh</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>BẢNG TIÊU CHÍ LỚP HỌC</span>
            </h1>
            <p className="text-xs sm:text-sm text-sky-100/90 font-medium leading-relaxed">
              Khích lệ tinh thần học tập tích cực, xây dựng nề nếp kỷ luật thân thiện và khen thưởng công bằng cho từng em học sinh.
            </p>
          </div>

          {/* Quick Metrics Cards on the Right */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Reward Card */}
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 min-w-[130px] text-left shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-bold text-amber-200">Khen Thưởng</span>
                <span className="p-1 rounded-lg bg-amber-400/30 text-amber-200">
                  <Award className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-black text-white">{allRewards.length}</div>
              <div className="text-[10px] text-sky-100/80 font-medium mt-0.5">
                Cao nhất: +{maxRewardPts} điểm
              </div>
            </div>

            {/* Reminder Card */}
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 min-w-[130px] text-left shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-bold text-rose-200">Nhắc Nhở</span>
                <span className="p-1 rounded-lg bg-rose-400/30 text-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-black text-white">{allPenalties.length}</div>
              <div className="text-[10px] text-sky-100/80 font-medium mt-0.5">
                Mức trừ: {maxPenaltyPts} điểm
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: View Tabs + Search & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
          {/* Main Category Tabs */}
          <div className="inline-flex p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({criteria.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reward')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'reward'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/20'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Tiêu chí Thưởng ({allRewards.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('penalty')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'penalty'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-500/20'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Tiêu chí Nhắc nhở ({allPenalties.length})</span>
            </button>
          </div>

          {/* Right Action: Grid / List view toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                title="Xem dạng thẻ lưới"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewLayout === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('list')}
                title="Xem dạng danh sách gọn"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewLayout === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter bar: Search input + Point level chips + Sort */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box with clear button */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nhanh tiêu chí theo tên hoặc số điểm..."
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Point level filter chips */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 px-1.5">Mức:</span>
              <button
                type="button"
                onClick={() => setPointFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  pointFilter === 'all' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setPointFilter('1')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  pointFilter === '1' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                1 điểm
              </button>
              <button
                type="button"
                onClick={() => setPointFilter('2')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  pointFilter === '2' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                2 điểm
              </button>
              <button
                type="button"
                onClick={() => setPointFilter('3+')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  pointFilter === '3+' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                3+ điểm
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none outline-hidden cursor-pointer font-bold text-slate-700 text-xs"
              >
                <option value="default">Thứ tự chuẩn</option>
                <option value="points-desc">Điểm: Cao → Thấp</option>
                <option value="points-asc">Điểm: Thấp → Cao</option>
                <option value="name">Tên: A → Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections: Reward & Penalty */}
      <div className={`grid gap-7 ${activeTab === 'all' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* ================= SECTION 1: TIÊU CHÍ THƯỞNG (+ ĐIỂM) ================= */}
        {(activeTab === 'all' || activeTab === 'reward') && (
          <div className="bg-gradient-to-b from-amber-50/50 via-white to-amber-50/20 rounded-3xl border border-amber-200/80 p-6 sm:p-7 shadow-sm space-y-5">
            {/* Header with Title & Add button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">
                      Tiêu Chí Khen Thưởng
                    </h2>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-black text-xs rounded-full border border-amber-200">
                      +{filteredRewards.length}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/70 font-medium mt-0.5">
                    Tuyên dương việc tốt, tinh thần học tập và thái độ tích cực
                  </p>
                </div>
              </div>

              <button
                id="add-reward-criteria-btn"
                onClick={() => openAddModal('reward')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white rounded-2xl text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Tiêu Chí Thưởng</span>
              </button>
            </div>

            {/* List of Items */}
            {filteredRewards.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-amber-200/70 rounded-3xl text-slate-400 text-xs space-y-2.5 bg-white/60">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto text-xl">
                  ⭐
                </div>
                <p className="font-semibold text-slate-600">Không tìm thấy tiêu chí thưởng nào phù hợp.</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setPointFilter('all'); }}
                  className="text-amber-600 font-bold hover:underline cursor-pointer"
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              </div>
            ) : viewLayout === 'grid' ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredRewards.map((item) => (
                  <div
                    key={item.id}
                    className="relative bg-white rounded-2xl border border-amber-200/70 p-4 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between group"
                  >
                    {/* Top Row: Icon + Points Pill */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/80 border border-amber-200/80 flex items-center justify-center text-2xl shadow-2xs group-hover:scale-105 transition-transform">
                        {item.icon || '⭐'}
                      </div>

                      {/* Point Badge with Stepper */}
                      <div className="flex items-center gap-1 bg-emerald-50/90 border border-emerald-200 rounded-full px-1.5 py-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => quickAdjustPoints(item, -1)}
                          title="Giảm 1 điểm"
                          className="w-5 h-5 rounded-full text-emerald-700 hover:bg-emerald-200/70 flex items-center justify-center font-black text-xs transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-1.5 text-xs font-black text-emerald-800 min-w-[36px] text-center">
                          +{item.points}đ
                        </span>
                        <button
                          type="button"
                          onClick={() => quickAdjustPoints(item, 1)}
                          title="Tăng 1 điểm"
                          className="w-5 h-5 rounded-full text-emerald-700 hover:bg-emerald-200/70 flex items-center justify-center font-black text-xs transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Middle: Title */}
                    <div className="mb-3">
                      <h4 className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2">
                        {item.title}
                      </h4>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px] text-slate-400">
                      <span className="text-amber-700/80 font-bold flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        <span>Khen thưởng</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => duplicateCriteria(item)}
                          className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Nhân bản tiêu chí"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa tiêu chí"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCriteriaToDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa tiêu chí"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="space-y-2.5">
                {filteredRewards.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-amber-200/70 hover:border-amber-300 shadow-2xs hover:shadow-xs transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center flex-shrink-0">
                        {item.icon || '⭐'}
                      </span>
                      <span className="font-extrabold text-slate-800 text-sm truncate">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Stepper */}
                      <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        <button
                          type="button"
                          onClick={() => quickAdjustPoints(item, -1)}
                          className="w-5 h-5 rounded-full text-emerald-700 hover:bg-emerald-200/70 flex items-center justify-center font-black text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-1 text-xs font-black text-emerald-800 min-w-[34px] text-center">
                          +{item.points}đ
                        </span>
                        <button
                          type="button"
                          onClick={() => quickAdjustPoints(item, 1)}
                          className="w-5 h-5 rounded-full text-emerald-700 hover:bg-emerald-200/70 flex items-center justify-center font-black text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => duplicateCriteria(item)}
                          className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                          title="Nhân bản"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCriteriaToDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= SECTION 2: TIÊU CHÍ NHẮC NHỞ (- ĐIỂM) ================= */}
        {(activeTab === 'all' || activeTab === 'penalty') && (
          <div className="bg-gradient-to-b from-rose-50/50 via-white to-rose-50/20 rounded-3xl border border-rose-200/80 p-6 sm:p-7 shadow-sm space-y-5">
            {/* Header with Title & Add button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rose-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">
                      Tiêu Chí Nhắc Nhở
                    </h2>
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 font-black text-xs rounded-full border border-rose-200">
                      -{filteredPenalties.length}
                    </span>
                  </div>
                  <p className="text-xs text-rose-800/70 font-medium mt-0.5">
                    Rèn luyện nề nếp, chấn chỉnh kỷ luật và khắc phục thiếu sót
                  </p>
                </div>
              </div>

              <button
                id="add-penalty-criteria-btn"
                onClick={() => openAddModal('penalty')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:scale-95 text-white rounded-2xl text-xs font-black shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Tiêu Chí Nhắc Nhở</span>
              </button>
            </div>

            {/* List of Items */}
            {filteredPenalties.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-rose-200/70 rounded-3xl text-slate-400 text-xs space-y-2.5 bg-white/60">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-xl">
                  ⚠️
                </div>
                <p className="font-semibold text-slate-600">Không tìm thấy tiêu chí nhắc nhở nào phù hợp.</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setPointFilter('all'); }}
                  className="text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              </div>
            ) : viewLayout === 'grid' ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredPenalties.map((item) => (
                  <div
                    key={item.id}
                    className="relative bg-white rounded-2xl border border-rose-200/70 p-4 shadow-xs hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between group"
                  >
                    {/* Top Row: Icon + Points Pill */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/80 border border-rose-200/80 flex items-center justify-center text-2xl shadow-2xs group-hover:scale-105 transition-transform">
                        {item.icon || '⚠️'}
                      </div>

                      {/* Point Badge with Stepper */}
                      <div className="flex items-center gap-1 bg-rose-50/90 border border-rose-200 rounded-full px-1.5 py-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => quickAdjustPoints(item, -1)}
                          title="Bớt trừ 1 điểm"
                          className="w-5 h-5 rounded-full text-rose-700 hover:bg-rose-200/70 flex items-center justify-center font-black text-xs transition-colors cursor-pointer"
                        >
                          +
                        </button>
                        <span className="px-1.5 text-xs font-black text-rose-800 min-w-[36px] text-center">
                          {item.points}đ
                        </span>
                        <button
                          type="button"
                          onClick={() => quickAdjustPoints(item, 1)}
                          title="Trừ thêm 1 điểm"
                          className="w-5 h-5 rounded-full text-rose-700 hover:bg-rose-200/70 flex items-center justify-center font-black text-xs transition-colors cursor-pointer"
                        >
                          -
                        </button>
                      </div>
                    </div>

                    {/* Middle: Title */}
                    <div className="mb-3">
                      <h4 className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2">
                        {item.title}
                      </h4>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px] text-slate-400">
                      <span className="text-rose-700/80 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Nhắc nhở</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => duplicateCriteria(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Nhân bản tiêu chí"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa tiêu chí"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCriteriaToDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa tiêu chí"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="space-y-2.5">
                {filteredPenalties.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-rose-200/70 hover:border-rose-300 shadow-2xs hover:shadow-xs transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center flex-shrink-0">
                        {item.icon || '⚠️'}
                      </span>
                      <span className="font-extrabold text-slate-800 text-sm truncate">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Stepper */}
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5">
                        <button
                          type="button"
                          onClick={() => quickAdjustPoints(item, -1)}
                          className="w-5 h-5 rounded-full text-rose-700 hover:bg-rose-200/70 flex items-center justify-center font-black text-xs cursor-pointer"
                        >
                          +
                        </button>
                        <span className="px-1 text-xs font-black text-rose-800 min-w-[34px] text-center">
                          {item.points}đ
                        </span>
                        <button
                          type="button"
                          onClick={() => quickAdjustPoints(item, 1)}
                          className="w-5 h-5 rounded-full text-rose-700 hover:bg-rose-200/70 flex items-center justify-center font-black text-xs cursor-pointer"
                        >
                          -
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => duplicateCriteria(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Nhân bản"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCriteriaToDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Add/Edit with Refined Aesthetics & Smooth Icon Picker */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className={`px-6 py-4 flex items-center justify-between text-white ${
              modalType === 'reward' 
                ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700' 
                : 'bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-xs">
                  {modalType === 'reward' ? <Award className="w-5 h-5 text-amber-100" /> : <AlertTriangle className="w-5 h-5 text-rose-100" />}
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {editingItem 
                      ? `Chỉnh Sửa Tiêu Chí ${modalType === 'reward' ? 'Thưởng (+)' : 'Nhắc Nhở (-)'}` 
                      : `Thêm Tiêu Chí ${modalType === 'reward' ? 'Thưởng (+ Điểm)' : 'Nhắc Nhở (- Điểm)'}`}
                  </h3>
                  <p className="text-xs text-white/85 font-medium">
                    {modalType === 'reward' ? 'Khen ngợi nề nếp và thành tích học tập tốt' : 'Nhắc nhở học sinh vi phạm quy định lớp học'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-2xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Separate Banner */}
              {modalType === 'reward' ? (
                <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center font-bold">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-amber-900">
                        Phần Tiêu Chí: Khen Thưởng Học Sinh
                      </div>
                      <div className="text-[11px] text-amber-700 font-medium">
                        Cộng điểm thi đua khi học sinh có việc tốt, học tốt
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-500 text-white font-black text-xs rounded-xl shadow-xs">
                    + Điểm
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-rose-50 to-rose-100/50 border border-rose-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-200/80 text-rose-800 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-rose-900">
                        Phần Tiêu Chí: Nhắc Nhở Nền Nếp
                      </div>
                      <div className="text-[11px] text-rose-700 font-medium">
                        Trừ điểm thi đua khi học sinh vi phạm quy định
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-rose-500 text-white font-black text-xs rounded-xl shadow-xs">
                    - Điểm
                  </span>
                </div>
              )}

              {/* Fast 1-Touch Suggestions */}
              {!editingItem && (
                <div className="p-3.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Gợi ý mẫu phổ biến (Chạm để tự động điền):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {(modalType === 'reward' ? REWARD_PRESETS : PENALTY_PRESETS).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100/80 border border-slate-200/90 rounded-xl text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <span className="text-sm">{preset.icon}</span>
                        <span>{preset.title}</span>
                        <span className={`font-black ${modalType === 'reward' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ({preset.points > 0 ? `+${preset.points}` : preset.points})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên tiêu chí rèn luyện <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={modalType === 'reward' ? 'Ví dụ: Hăng hái phát biểu, Chuẩn bị bài tốt...' : 'Ví dụ: Nói chuyện riêng, Quên đồ dùng...'}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              {/* Points input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mức điểm ({modalType === 'reward' ? '+ điểm thưởng' : '- điểm nhắc nhở'})
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    {[1, 2, 3, 5, 10].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setFormPoints(pts)}
                        className={`flex-1 py-2.5 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                          Math.abs(formPoints) === pts
                            ? modalType === 'reward'
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-rose-500 text-white border-rose-600 shadow-xs'
                            : 'bg-slate-50/90 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {modalType === 'reward' ? `+${pts}` : `-${pts}`}
                      </button>
                    ))}
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={Math.abs(formPoints)}
                      onChange={(e) => setFormPoints(Math.abs(parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-black text-center focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      title="Nhập số điểm tùy chọn"
                    />
                  </div>
                </div>
              </div>

              {/* Rich Icon Selector Section */}
              <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/70 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Chọn Biểu Tượng Icon Minh Họa</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Đang chọn:</span>
                    <span className="text-2xl p-2 bg-white rounded-2xl border border-slate-300/80 shadow-xs font-bold inline-block">
                      {formIcon || '⭐'}
                    </span>
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIconCategory('all')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      iconCategory === 'all'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setIconCategory('study')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      iconCategory === 'study'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🏆 Học tập</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIconCategory('positive')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      iconCategory === 'positive'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🙋 Nền nếp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIconCategory('penalty')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      iconCategory === 'penalty'
                        ? 'bg-rose-500 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>⚠️ Nhắc nhở</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIconCategory('mascot')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      iconCategory === 'mascot'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🐼 Linh vật</span>
                  </button>
                </div>

                {/* Quick Search & Custom Input */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm biểu tượng (vd: sao, bút, gấu, nói, sách...)"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="w-28">
                    <input
                      type="text"
                      placeholder="Emoji khác"
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs text-center font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                      title="Nhập emoji tùy chọn"
                    />
                  </div>
                </div>

                {/* Grid of Icons */}
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-44 overflow-y-auto p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-inner">
                  {filteredIcons.map((item, idx) => {
                    const isSelected = formIcon === item.icon;
                    return (
                      <button
                        key={`${item.icon}-${idx}`}
                        type="button"
                        onClick={() => setFormIcon(item.icon)}
                        title={item.name}
                        className={`p-2 rounded-2xl text-2xl flex flex-col items-center justify-center transition-all cursor-pointer group relative ${
                          isSelected
                            ? 'bg-blue-50 border-2 border-blue-500 scale-105 shadow-xs'
                            : 'hover:bg-slate-100 border border-transparent hover:scale-105'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span className="text-[9px] text-slate-400 font-medium truncate max-w-full group-hover:text-slate-700 block mt-0.5 leading-tight text-center">
                          {item.name.split(' ')[0]}
                        </span>
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {filteredIcons.length === 0 && (
                    <div className="col-span-full py-4 text-center text-xs text-slate-400">
                      Không tìm thấy icon phù hợp. Bạn có thể tự dán biểu tượng vào ô &quot;Emoji khác&quot;.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 text-white text-xs font-black rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                    modalType === 'reward'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20'
                      : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/20'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Cập Nhật Tiêu Chí' : 'Lưu Tiêu Chí'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {criteriaToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden p-6 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
              <Trash2 className="w-7 h-7 text-rose-600" />
            </div>

            <h3 className="font-black text-slate-900 text-lg mb-1.5">
              Xác Nhận Xóa Tiêu Chí
            </h3>

            {/* Criteria preview card */}
            <div className={`p-4 rounded-2xl border my-3.5 text-left flex items-center justify-between ${
              criteriaToDelete.type === 'reward'
                ? 'bg-amber-50/60 border-amber-200'
                : 'bg-rose-50/60 border-rose-200'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
                  {criteriaToDelete.icon || (criteriaToDelete.type === 'reward' ? '⭐' : '⚠️')}
                </span>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {criteriaToDelete.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {criteriaToDelete.type === 'reward' ? 'Tiêu chí thưởng học sinh' : 'Tiêu chí nhắc nhở nề nếp'}
                  </div>
                </div>
              </div>

              <span className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-xs ${
                criteriaToDelete.type === 'reward'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {criteriaToDelete.points > 0 ? `+${criteriaToDelete.points}` : criteriaToDelete.points}đ
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa tiêu chí này không? Tiêu chí sẽ được gỡ khỏi bảng thi đua của lớp học.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCriteriaToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCriteria(criteriaToDelete.id);
                  setCriteriaToDelete(null);
                  showToast(`Đã xóa tiêu chí "${criteriaToDelete.title}"`);
                }}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
