import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Award, Sparkles, Trophy, ThumbsUp, ThumbsDown, Clock, Search, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

export const BeeRewardsView: React.FC = () => {
  const { students, classes, rewards, awardPoints, profile } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [pointAmount, setPointAmount] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [searchStudent, setSearchStudent] = useState<string>('');

  // Top students leaderboard sorted by stars descending
  const sortedStudents = [...students].sort((a, b) => b.stars - a.stars);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#fef08a', '#10b981', '#3b82f6'],
      });
    } catch {
      // safe fallback
    }
  };

  const handleGivePoints = (points: number, presetReason?: string) => {
    if (!selectedStudentId) return;
    const finalReason = presetReason || reason.trim() || 'Khen thưởng học tập tích cực';
    awardPoints(selectedStudentId, points, finalReason, selectedClassId);

    if (points > 0) {
      triggerConfetti();
    }
    setReason('');
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
            <span>{profile.centerName || 'Quản lí lớp học thân thiện'}</span>
            <span>/</span>
            <span className="text-slate-500">Khen thưởng & Nề nếp tích cực</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Bảng Vàng Khen Thưởng & Tích Lũy Sao
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Lớp học hạnh phúc ⭐
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Khích lệ học sinh phát biểu, tiến bộ học tập, làm việc nhóm và lan tỏa sự tử tế trong lớp học
          </p>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rank 2 */}
        {sortedStudents[1] && (
          <div className="bg-gradient-to-b from-slate-50 to-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center text-center order-2 md:order-1 mt-0 md:mt-4">
            <span className="text-2xl mb-1">🥈</span>
            <div className="relative mb-2">
              <img
                src={sortedStudents[1].avatar}
                alt={sortedStudents[1].name}
                className="w-14 h-14 rounded-full object-cover border-2 border-slate-300 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 bg-slate-300 text-slate-800 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                2
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{sortedStudents[1].name}</h3>
            <p className="text-xs text-slate-500 mb-2">{sortedStudents[1].code}</p>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs border border-amber-200 flex items-center gap-1">
              🐝 {sortedStudents[1].stars} Điểm Bee
            </span>
          </div>
        )}

        {/* Rank 1 (Champion) */}
        {sortedStudents[0] && (
          <div className="bg-gradient-to-b from-amber-100/60 via-amber-50 to-white p-6 rounded-2xl border-2 border-amber-400 shadow-md flex flex-col items-center text-center order-1 md:order-2 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-300/30 rounded-full blur-xl pointer-events-none" />
            <span className="text-3xl mb-1">👑</span>
            <div className="relative mb-2">
              <img
                src={sortedStudents[0].avatar}
                alt={sortedStudents[0].name}
                className="w-18 h-18 rounded-full object-cover border-4 border-amber-400 shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                1
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950 mb-1">
              Ong Chúa Chăm Chỉ
            </span>
            <h3 className="font-black text-slate-950 text-base">{sortedStudents[0].name}</h3>
            <p className="text-xs text-slate-600 mb-3">{sortedStudents[0].code}</p>
            <span className="px-4 py-1.5 rounded-full bg-amber-500 text-slate-950 font-black text-sm shadow-md shadow-amber-500/30 flex items-center gap-1.5">
              🐝 {sortedStudents[0].stars} Điểm Bee
            </span>
          </div>
        )}

        {/* Rank 3 */}
        {sortedStudents[2] && (
          <div className="bg-gradient-to-b from-amber-50/40 to-white p-5 rounded-2xl border border-amber-200 shadow-xs flex flex-col items-center text-center order-3 md:order-3 mt-0 md:mt-6">
            <span className="text-2xl mb-1">🥉</span>
            <div className="relative mb-2">
              <img
                src={sortedStudents[2].avatar}
                alt={sortedStudents[2].name}
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-600/40 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-700 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                3
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{sortedStudents[2].name}</h3>
            <p className="text-xs text-slate-500 mb-2">{sortedStudents[2].code}</p>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs border border-amber-200 flex items-center gap-1">
              🐝 {sortedStudents[2].stars} Điểm Bee
            </span>
          </div>
        )}
      </div>

      {/* Main Grid: Quick Action Panel & Realtime Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Quick Award Desk & Full Rankings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Reward Desk */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Bàn Khen Thưởng Nhanh</h3>
                  <p className="text-xs text-slate-500">Cộng hoặc trừ điểm Bee trực tiếp cho học sinh</p>
                </div>
              </div>

              {currentStudent && (
                <div className="text-right">
                  <span className="text-xs text-slate-500 block font-medium">Hiện có:</span>
                  <span className="font-black text-amber-700 text-sm">
                    🐝 {currentStudent.stars} điểm
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn học sinh:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500"
                >
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.name} ({stu.code} - {stu.stars} 🐝)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn lớp học:
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <span className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Khen thưởng 1 chạm:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleGivePoints(1, 'Hăng hái phát biểu xây dựng bài')}
                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>🙋‍♂️</span>
                    <span className="text-xs font-black text-amber-800">+1 🐝</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 block">Hăng hái phát biểu</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGivePoints(2, 'Hoàn thành bài tập xuất sắc')}
                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>📝</span>
                    <span className="text-xs font-black text-amber-800">+2 🐝</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 block">Bài tập xuất sắc</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGivePoints(3, 'Đạt điểm 10 bài kiểm tra')}
                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>💯</span>
                    <span className="text-xs font-black text-amber-800">+3 🐝</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 block">Điểm 10 xuất sắc</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGivePoints(1, 'Tương trợ, giúp đỡ bạn bè')}
                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>🤝</span>
                    <span className="text-xs font-black text-amber-800">+1 🐝</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 block">Giúp đỡ bạn</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGivePoints(-1, 'Mất trật tự trong giờ học')}
                  className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>🤫</span>
                    <span className="text-xs font-black text-rose-800">-1 🐝</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 block">Mất trật tự</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGivePoints(-1, 'Quên mang vở hoặc bài tập')}
                  className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>📖</span>
                    <span className="text-xs font-black text-rose-800">-1 🐝</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 block">Quên bài tập</span>
                </button>
              </div>
            </div>

            {/* Custom Reason Form */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="number"
                value={pointAmount}
                onChange={(e) => setPointAmount(Number(e.target.value))}
                className="w-18 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-xs"
              />
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do khen thưởng tùy chỉnh..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={() => handleGivePoints(pointAmount)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Ghi nhận
              </button>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Bảng Xếp Hạng Điểm Bee Toàn Trường</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Cập nhật tự động theo thời gian thực
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {sortedStudents.map((stu, index) => (
                <div
                  key={stu.id}
                  className="p-3.5 flex items-center justify-between hover:bg-amber-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                        index === 0
                          ? 'bg-amber-400 text-slate-950'
                          : index === 1
                          ? 'bg-slate-300 text-slate-800'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <img
                      src={stu.avatar}
                      alt={stu.name}
                      className="w-9 h-9 rounded-full object-cover border border-amber-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{stu.name}</div>
                      <div className="text-[11px] text-slate-500">{stu.code}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedStudentId(stu.id);
                        handleGivePoints(1, 'Khen ngợi nỗ lực học tập');
                      }}
                      className="px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200"
                    >
                      +1 🐝 Thưởng
                    </button>
                    <span className="font-black text-amber-800 text-sm w-16 text-right">
                      {stu.stars} 🐝
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Realtime Activity History Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-fit">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">Lịch Sử Thưởng & Kỷ Luật</h3>
          </div>

          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {rewards.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">Chưa có lịch sử khen thưởng nào.</p>
            ) : (
              rewards.map((r) => (
                <div
                  key={r.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    r.type === 'reward'
                      ? 'bg-amber-50/40 border-amber-200/70'
                      : 'bg-rose-50/40 border-rose-200/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{r.studentName}</span>
                    <span
                      className={`font-black px-1.5 py-0.5 rounded text-[11px] ${
                        r.type === 'reward'
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-rose-200 text-rose-900'
                      }`}
                    >
                      {r.points > 0 ? `+${r.points}` : r.points} 🐝
                    </span>
                  </div>
                  <p className="text-slate-600 italic">{r.reason}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>{r.className}</span>
                    <span>{r.createdAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
