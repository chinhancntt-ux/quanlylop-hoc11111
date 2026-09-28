import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ThemePreset } from '../types';
import {
  X,
  UserCheck,
  Building2,
  Sparkles,
  Palette,
  Quote,
  Save,
  RotateCcw,
  Mail,
  Phone,
  Check,
  HeartHandshake,
  Image as ImageIcon
} from 'lucide-react';

const AVATAR_SUGGESTIONS = [
  { id: '1', label: 'Thầy giáo thân thiện', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { id: '2', label: 'Cô giáo tươi vui', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' },
  { id: '3', label: 'Thầy giáo năng động', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: '4', label: 'Cô giáo dịu dàng', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
  { id: '5', label: 'Biểu tượng Trái tim', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200&auto=format&fit=crop&q=80' },
];

const THEME_OPTIONS: { id: ThemePreset; name: string; desc: string; bgClass: string; textClass: string; borderClass: string }[] = [
  {
    id: 'amber',
    name: 'Vàng Nắng Ấm Áp',
    desc: 'Tươi sáng, năng động và rực rỡ như nắng mai',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-400'
  },
  {
    id: 'emerald',
    name: 'Xanh Ngọc Dịu Mát',
    desc: 'Thân thiện, tươi mới, tạo cảm giác an tâm',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-400'
  },
  {
    id: 'sky',
    name: 'Xanh Lam Hy Vọng',
    desc: 'Trực quan, thoáng đãng và chuyên nghiệp',
    bgClass: 'bg-sky-500',
    textClass: 'text-sky-700',
    borderClass: 'border-sky-400'
  },
  {
    id: 'rose',
    name: 'Hồng Đào Yêu Thương',
    desc: 'Gần gũi, ấm áp, lan tỏa tình yêu thương',
    bgClass: 'bg-rose-500',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-400'
  },
  {
    id: 'indigo',
    name: 'Tím Lavender Sáng Tạo',
    desc: 'Truyền cảm hứng, trang nhã và lịch thiệp',
    bgClass: 'bg-indigo-500',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-400'
  },
];

const MOTTO_PRESETS = [
  'Mỗi ngày đến trường là một ngày vui • Lớp học hạnh phúc',
  'Chăm ngoan - Sáng tạo - Tự tin - Yêu thương',
  'Học hết mình, chơi nhiệt tình, tôn trọng lẫn nhau',
  'Gieo hạt tri thức, ươm mầm ước mơ tương lai',
  'Lớp học thân thiện, học trò tích cực, thầy cô tâm huyết',
];

export const PersonalizationModal: React.FC = () => {
  const { profile, updateProfile, isPersonalizeModalOpen, setIsPersonalizeModalOpen } = useApp();

  const [formData, setFormData] = useState(profile);
  const [customAvatarInput, setCustomAvatarInput] = useState(profile.avatar);

  useEffect(() => {
    setFormData(profile);
    setCustomAvatarInput(profile.avatar);
  }, [profile, isPersonalizeModalOpen]);

  if (!isPersonalizeModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ...formData,
      avatar: customAvatarInput.trim() || formData.avatar,
    });
    setIsPersonalizeModalOpen(false);
  };

  const handleReset = () => {
    const defaultData = {
      teacherName: 'Thầy Chính An',
      teacherTitle: 'Giáo viên Chủ nhiệm & Quản lý',
      email: 'chinhancntt@gmail.com',
      phone: '0988.123.456',
      centerName: 'Lớp Học Thân Thiện',
      motto: 'Mỗi ngày đến trường là một ngày vui • Lớp học hạnh phúc',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      themePreset: 'amber' as ThemePreset,
    };
    setFormData(defaultData);
    setCustomAvatarInput(defaultData.avatar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-6 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs">
              <HeartHandshake className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Cá nhân hóa Lớp học Thân Thiện</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[11px] font-bold">
                  Riêng bạn
                </span>
              </div>
              <p className="text-xs text-slate-900/80 font-medium">
                Tùy chỉnh danh xưng, tên lớp, khẩu hiệu yêu thương và chủ đề giao diện
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPersonalizeModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="p-4 bg-amber-50/70 border-b border-amber-100/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={customAvatarInput || formData.avatar}
              alt={formData.teacherName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400 shadow-xs shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
              }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">{formData.teacherName || 'Tên Thầy/Cô'}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-semibold">
                  {formData.teacherTitle || 'Chức vụ'}
                </span>
                <span className="text-xs text-slate-500 font-medium">| {formData.centerName || 'Lớp Học'}</span>
              </div>
              <p className="text-xs text-slate-600 truncate italic mt-0.5">
                "{formData.motto || 'Mỗi ngày đến trường là một ngày vui'}"
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
            Xem trước thẻ của bạn
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Section 1: Teacher & Center Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-500" />
              1. Thông tin Giáo viên & Lớp học
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Thầy / Cô giáo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.teacherName}
                  onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                  placeholder="Ví dụ: Thầy Chính An, Cô Mai Hoa..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chức danh / Danh xưng
                </label>
                <input
                  type="text"
                  value={formData.teacherTitle}
                  onChange={(e) => setFormData({ ...formData, teacherTitle: e.target.value })}
                  placeholder="Ví dụ: Giáo viên Chủ nhiệm, Giảng dạy Toán..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <Building2 className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Tên Lớp học / Trung tâm / Trường
                </label>
                <input
                  type="text"
                  value={formData.centerName}
                  onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                  placeholder="Ví dụ: Lớp Học Thân Thiện, CLB Toán Học..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <Mail className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Email liên hệ
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="chinhancntt@gmail.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <Phone className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Số điện thoại giáo viên / tư vấn lớp
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ví dụ: 0988.123.456"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Motto & Encouragement */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Quote className="w-4 h-4 text-amber-500" />
              2. Khẩu hiệu & Tinh thần lớp học thân thiện
            </h3>
            <textarea
              rows={2}
              value={formData.motto}
              onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
              placeholder="Khẩu hiệu lớp học truyền cảm hứng..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[11px] text-slate-400 font-semibold py-0.5">Gợi ý nhanh:</span>
              {MOTTO_PRESETS.map((m, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setFormData({ ...formData, motto: m })}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-colors cursor-pointer"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Avatar Selection */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              3. Ảnh đại diện Thầy/Cô
            </h3>
            <div className="grid grid-cols-5 gap-2 mb-2">
              {AVATAR_SUGGESTIONS.map((av) => {
                const isSelected = customAvatarInput === av.url;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      setCustomAvatarInput(av.url);
                      setFormData({ ...formData, avatar: av.url });
                    }}
                    className={`relative rounded-xl p-1 border-2 transition-all cursor-pointer ${
                      isSelected ? 'border-amber-500 ring-2 ring-amber-300' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={av.url} alt={av.label} className="w-full h-12 object-cover rounded-lg" />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customAvatarInput}
                onChange={(e) => {
                  setCustomAvatarInput(e.target.value);
                  setFormData({ ...formData, avatar: e.target.value });
                }}
                placeholder="Hoặc dán đường dẫn ảnh (URL) đại diện của bạn vào đây..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Section 4: Color Theme Preset */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-500" />
              4. Tông màu giao diện yêu thích
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = formData.themePreset === theme.id;
                return (
                  <button
                    type="button"
                    key={theme.id}
                    onClick={() => setFormData({ ...formData, themePreset: theme.id })}
                    className={`text-left p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? `${theme.borderClass} bg-slate-50 shadow-xs ring-1 ring-amber-300`
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${theme.bgClass} text-white flex items-center justify-center shrink-0 mt-0.5`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{theme.name}</div>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{theme.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt lại ban đầu
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPersonalizeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-sm shadow-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu cá nhân hóa
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
