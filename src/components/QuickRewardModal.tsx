import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Sparkles,
  Plus,
  Minus,
  Award,
  AlertTriangle,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';

export const QuickRewardModal: React.FC = () => {
  const {
    isQuickRewardOpen,
    setIsQuickRewardOpen,
    selectedStudentForReward,
    setSelectedStudentForReward,
    students,
    criteria,
    rewardStudent,
  } = useApp();

  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [customPoints, setCustomPoints] = useState<number>(1);
  const [customReason, setCustomReason] = useState<string>('Học tập tốt');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStudentForReward) {
      setTargetStudentId(selectedStudentForReward.id);
    } else if (students.length > 0) {
      setTargetStudentId(students[0].id);
    }
  }, [selectedStudentForReward, students, isQuickRewardOpen]);

  if (!isQuickRewardOpen) return null;

  const handleApplyCriteria = (title: string, points: number) => {
    if (!targetStudentId) return;
    rewardStudent(targetStudentId, points, title);

    const studentObj = students.find(s => s.id === targetStudentId);
    setFeedback(`Đã ${points > 0 ? 'thưởng +' : 'trừ '}${points} ⭐ cho ${studentObj?.name || 'học sinh'}!`);

    setTimeout(() => {
      setFeedback(null);
      setIsQuickRewardOpen(false);
      setSelectedStudentForReward(null);
    }, 900);
  };

  const handleCustomReward = (isPositive: boolean) => {
    if (!targetStudentId) return;
    const finalPoints = isPositive ? Math.abs(customPoints) : -Math.abs(customPoints);
    const finalReason = customReason.trim() || (isPositive ? 'Khen thưởng rèn luyện' : 'Nhắc nhở');

    rewardStudent(targetStudentId, finalPoints, finalReason);

    const studentObj = students.find(s => s.id === targetStudentId);
    setFeedback(`Đã ${finalPoints > 0 ? 'thưởng +' : 'trừ '}${finalPoints} ⭐ cho ${studentObj?.name || 'học sinh'}!`);

    setTimeout(() => {
      setFeedback(null);
      setIsQuickRewardOpen(false);
      setSelectedStudentForReward(null);
    }, 900);
  };

  const currentStudent = students.find(s => s.id === targetStudentId);
  const rewardCriteria = criteria.filter(c => c.type === 'reward');
  const penaltyCriteria = criteria.filter(c => c.type === 'penalty');

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-blue-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-yellow-100 text-yellow-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <h3 className="text-base font-black text-slate-800">
              Khen Thưởng & Nhắc Nhở Học Sinh
            </h3>
          </div>
          <button
            onClick={() => {
              setIsQuickRewardOpen(false);
              setSelectedStudentForReward(null);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Selector / Active Student Card */}
        <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center text-2xl shadow-xs shrink-0">
              {currentStudent?.avatar || '🐼'}
            </div>
            <div className="min-w-0">
              <label className="block text-[11px] font-bold text-slate-400">
                Học sinh được chọn:
              </label>
              <select
                value={targetStudentId}
                onChange={(e) => setTargetStudentId(e.target.value)}
                className="bg-transparent font-black text-sm text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) — {s.stars} ⭐
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentStudent && (
            <div className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-black text-xs shrink-0 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{currentStudent.stars} ⭐</span>
            </div>
          )}
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black rounded-xl text-center flex items-center justify-center gap-1.5 animate-bounce">
            <Check className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Quick Criteria: Rewards */}
        <div className="space-y-2">
          <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Tiêu Chí Thưởng (+ Điểm)</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {rewardCriteria.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleApplyCriteria(item.title, item.points)}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-100 active:scale-95 transition-all text-left flex items-center justify-between text-xs group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span>{item.icon || '⭐'}</span>
                  <span className="font-bold text-slate-800 truncate">
                    {item.title}
                  </span>
                </div>
                <span className="font-black text-emerald-700 shrink-0 ml-1">
                  +{item.points} ⭐
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Criteria: Penalties */}
        <div className="space-y-2">
          <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Tiêu Chí Nhắc Nhở (- Điểm)</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {penaltyCriteria.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleApplyCriteria(item.title, item.points)}
                className="p-2 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-100 active:scale-95 transition-all text-left flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm">{item.icon || '⚠️'}</span>
                  <span className="font-bold text-slate-800 truncate text-[11px]">
                    {item.title}
                  </span>
                </div>
                <span className="font-black text-rose-700 shrink-0 text-[11px]">
                  {item.points} ⭐
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom points input */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-slate-600">
            Hoặc nhập điểm tự chọn:
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Lý do khen thưởng/nhắc nhở..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden"
            />
            <input
              type="number"
              min={1}
              max={10}
              value={customPoints}
              onChange={(e) => setCustomPoints(Math.abs(parseInt(e.target.value, 10) || 1))}
              className="w-14 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center focus:outline-hidden"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleCustomReward(true)}
              className="py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thưởng {customPoints} ⭐</span>
            </button>
            <button
              type="button"
              onClick={() => handleCustomReward(false)}
              className="py-1.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>- Trừ {customPoints} ⭐</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
