import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  Trophy,
  Users,
  CheckCircle2,
  Plus,
  Award,
  Filter,
  SlidersHorizontal,
  Star,
  Trash2,
  UserCheck,
  Disc,
  Layers,
  Flame,
  Check,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { Student } from '../types';

interface PickHistoryItem {
  id: string;
  timestamp: string;
  timeFormatted: string;
  students: Student[];
  mode: 'single' | 'multiple';
  count: number;
}

const WHEEL_COLORS = [
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#e11d48', // rose
];

export const LuckyWheelView: React.FC = () => {
  const {
    students,
    classes,
    activeClassId,
    classroomGroups,
    setActiveTab,
    openRewardModalForStudent,
    rewardStudent,
    playSound,
    showToast,
  } = useApp();

  // 1. Basic Filters
  const [selectedClassId, setSelectedClassId] = useState<string>(activeClassId || 'all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<'all' | 'Nam' | 'Nữ'>('all');

  // 2. Quantity & Picking Options (Gọi 1 hoặc nhiều tùy chọn)
  const [pickQuantity, setPickQuantity] = useState<number>(1);
  const [excludeAlreadyPicked, setExcludeAlreadyPicked] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'cards' | 'wheel'>('cards'); // Cards flip or Wheel spin
  const [customReason, setCustomReason] = useState<string>('Phát biểu tích cực & hoàn thành nhiệm vụ');
  const [batchStarAmount, setBatchStarAmount] = useState<number>(1);

  // 3. State for Picks & Animation
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [selectedWinners, setSelectedWinners] = useState<Student[]>([]);
  const [displayedCandidates, setDisplayedCandidates] = useState<Student[]>([]);
  const [pickedHistory, setPickedHistory] = useState<PickHistoryItem[]>([]);
  const [sessionPickedIds, setSessionPickedIds] = useState<Set<string>>(new Set());

  // Refs for animation
  const spinTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelAngleRef = useRef<number>(0);
  const wheelAnimationRef = useRef<number | null>(null);

  // Get current class object
  const currentClass = classes.find((c) => c.id === selectedClassId);

  // Active classroom groups for selected class
  const activeClassGroups = useMemo(() => {
    if (selectedClassId === 'all') {
      const all: { id: string; name: string; studentIds: string[] }[] = [];
      Object.values(classroomGroups || {}).forEach((grps) => {
        if (Array.isArray(grps)) {
          all.push(...grps);
        }
      });
      return all;
    }
    return classroomGroups?.[selectedClassId] || [];
  }, [classroomGroups, selectedClassId]);

  // Compute the total eligible candidate pool based on class, classroom group, and gender
  const basePool = useMemo(() => {
    return students.filter((s) => {
      // Filter by Class
      if (selectedClassId !== 'all' && !s.classIds.includes(selectedClassId)) {
        return false;
      }
      // Filter by Classroom Group
      if (selectedGroupId !== 'all') {
        const targetGroup = activeClassGroups.find((g) => g.id === selectedGroupId);
        if (targetGroup && !targetGroup.studentIds.includes(s.id)) {
          return false;
        }
      }
      // Filter by Gender
      if (selectedGender !== 'all') {
        const isMale = s.gender === 'Nam' || (s.gender as string) === 'male';
        if (selectedGender === 'Nam' && !isMale) return false;
        if (selectedGender === 'Nữ' && isMale) return false;
      }
      return true;
    });
  }, [students, selectedClassId, selectedGroupId, activeClassGroups, selectedGender]);

  // Active pool taking into account exclusion of already picked students
  const candidatePool = useMemo(() => {
    if (!excludeAlreadyPicked) return basePool;
    return basePool.filter((s) => !sessionPickedIds.has(s.id));
  }, [basePool, excludeAlreadyPicked, sessionPickedIds]);

  // Ensure pickQuantity does not exceed candidatePool length
  const maxPossiblePicks = Math.max(1, candidatePool.length);
  const safePickCount = Math.min(pickQuantity, maxPossiblePicks);

  // Quick preset counts
  const presetCounts = [1, 2, 3, 4, 5];

  // Confetti helper
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // Ignore
    }
  };

  // -------------------------------------------------------------
  // CANVAS WHEEL DRAWING (For 'wheel' view mode)
  // -------------------------------------------------------------
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 16;

    ctx.clearRect(0, 0, width, height);

    const itemsToDraw = candidatePool.slice(0, 24); // Draw up to 24 slices for clarity
    if (itemsToDraw.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Không có học sinh trong danh sách', centerX, centerY);
      return;
    }

    const numSlices = itemsToDraw.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    // Draw outer glow/ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let i = 0; i < numSlices; i++) {
      const sliceStart = angle + i * sliceAngle;
      const sliceEnd = sliceStart + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sliceStart, sliceEnd);
      ctx.closePath();

      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Slice text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(sliceStart + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;

      const studentName = itemsToDraw[i].name;
      const displayName = studentName.length > 14 ? studentName.substring(0, 13) + '…' : studentName;
      ctx.fillText(displayName, radius - 18, 4);
      ctx.restore();
    }

    // Center pin / hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', centerX, centerY);

    // Pointer / Arrow indicator at Top (pointing down at 12 o'clock)
    ctx.beginPath();
    ctx.moveTo(centerX - 14, 6);
    ctx.lineTo(centerX + 14, 6);
    ctx.lineTo(centerX, 28);
    ctx.closePath();
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  };

  useEffect(() => {
    if (viewMode === 'wheel') {
      drawWheel(wheelAngleRef.current);
    }
  }, [viewMode, candidatePool]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      if (wheelAnimationRef.current) cancelAnimationFrame(wheelAnimationRef.current);
    };
  }, []);

  // -------------------------------------------------------------
  // SHUFFLE & SELECTION ENGINE
  // -------------------------------------------------------------
  const handleStartPick = () => {
    if (candidatePool.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setSelectedWinners([]);

    const neededCount = Math.min(safePickCount, candidatePool.length);

    // If wheel mode is active and we're picking 1 student, run physics wheel spin
    if (viewMode === 'wheel' && neededCount === 1) {
      let speed = 0.35 + Math.random() * 0.15;
      const friction = 0.985;
      let currentAngle = wheelAngleRef.current;

      const animateWheel = () => {
        currentAngle += speed;
        speed *= friction;
        wheelAngleRef.current = currentAngle;
        drawWheel(currentAngle);

        if (Math.random() < 0.3) {
          playSound('tick');
        }

        if (speed > 0.003) {
          wheelAnimationRef.current = requestAnimationFrame(animateWheel);
        } else {
          // Finished spin
          setIsSpinning(false);
          const numSlices = Math.min(candidatePool.length, 24);
          const sliceAngle = (2 * Math.PI) / numSlices;
          // Calculate winner from angle relative to top pointer (3*PI/2)
          const normalized = (currentAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
          const pointerAngle = (3 * Math.PI) / 2;
          let winningSlice = Math.floor(((pointerAngle - normalized + 2 * Math.PI) % (2 * Math.PI)) / sliceAngle);
          if (winningSlice >= numSlices) winningSlice = numSlices - 1;

          const chosen = candidatePool[winningSlice] || candidatePool[0];
          finalizeWinners([chosen]);
        }
      };

      wheelAnimationRef.current = requestAnimationFrame(animateWheel);
      return;
    }

    // Card slots shuffle mode (supports 1 or any N multiple students)
    let stepCount = 0;
    const totalFlips = 28 + Math.floor(Math.random() * 12);
    let intervalDelay = 45;

    const runStep = () => {
      stepCount++;

      // Pick random distinct candidates for display preview
      const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
      const tempDisplay = shuffled.slice(0, neededCount);
      setDisplayedCandidates(tempDisplay);

      playSound('tick');

      if (stepCount < totalFlips) {
        if (stepCount > totalFlips - 10) {
          intervalDelay += 28; // Deceleration effect
        }
        spinTimerRef.current = window.setTimeout(runStep, intervalDelay);
      } else {
        // Selection complete! Pick definitive random distinct winners
        const finalWinners = [...candidatePool].sort(() => 0.5 - Math.random()).slice(0, neededCount);
        setIsSpinning(false);
        finalizeWinners(finalWinners);
      }
    };

    runStep();
  };

  // Finalize winners, trigger sounds, confetti, and update session tracking
  const finalizeWinners = (winners: Student[]) => {
    setSelectedWinners(winners);
    setDisplayedCandidates(winners);

    // Update session exclusion set
    setSessionPickedIds((prev) => {
      const updated = new Set(prev);
      winners.forEach((w) => updated.add(w.id));
      return updated;
    });

    // Add to history
    const now = new Date();
    const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newHistoryItem: PickHistoryItem = {
      id: `pick-${Date.now()}`,
      timestamp: now.toISOString(),
      timeFormatted,
      students: winners,
      mode: winners.length > 1 ? 'multiple' : 'single',
      count: winners.length,
    };
    setPickedHistory((prev) => [newHistoryItem, ...prev.slice(0, 15)]);

    // Sound and confetti celebration
    playSound('praise');
    triggerConfetti();

    if (winners.length === 1) {
      showToast(`🎉 Xin chúc mừng ${winners[0].name} đã may mắn được gọi tên!`, 'success');
    } else {
      showToast(`🎉 Đã chọn ngẫu nhiên ${winners.length} học sinh may mắn!`, 'success');
    }
  };

  // Reset current selection
  const handleResetSelection = () => {
    setSelectedWinners([]);
    setDisplayedCandidates([]);
  };

  // Reset entire session pool (clear exclusion list)
  const handleResetSessionExclusions = () => {
    setSessionPickedIds(new Set());
    showToast('Đã làm mới danh sách chờ gọi (tất cả học sinh có thể được gọi lại)', 'info');
  };

  // Batch reward all winners
  const handleBatchReward = (points: number) => {
    if (selectedWinners.length === 0) return;

    selectedWinners.forEach((stu) => {
      rewardStudent(stu.id, points, customReason || 'Gọi tên may mắn phát biểu tích cực');
    });

    playSound('praise');
    triggerConfetti();
    showToast(`⭐ Đã cộng +${points} sao cho tất cả ${selectedWinners.length} học sinh được gọi!`, 'success');
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200 select-none">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 p-6 sm:p-7 text-white shadow-xl border border-blue-500/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-black tracking-wider uppercase backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CÔNG CỤ TƯƠNG TÁC LỚP HỌC</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Gọi Tên May Mắn</span>
              <span className="text-amber-300 text-2xl">🎲</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
              Quay ngẫu nhiên chọn <strong>1 hoặc nhiều học sinh cùng lúc</strong> cho phát biểu, kiểm tra bài, hoạt động nhóm hoặc khen thưởng tức thì.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Display Mode Toggle */}
            <div className="flex items-center bg-white/10 p-1 rounded-2xl backdrop-blur-xs border border-white/20 text-xs font-bold">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-100 hover:text-white'
                }`}
                title="Giao diện Thẻ Lật Đa Năng"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Thẻ Kỳ Diệu</span>
              </button>

              <button
                onClick={() => {
                  setViewMode('wheel');
                  if (pickQuantity > 1) setPickQuantity(1); // Wheel best for 1 student
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'wheel' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-100 hover:text-white'
                }`}
                title="Giao diện Vòng Quay Bánh Xe"
              >
                <Disc className="w-3.5 h-3.5" />
                <span>Bánh Xe May Mắn</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Control Panel & Options (Chọn 1 hoặc nhiều tùy chọn) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        {/* Row 1: Quantity selector (Core Request: Gọi 1 hoặc nhiều tùy chọn) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Số lượng học sinh cần gọi:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs">
                {safePickCount} em
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Chọn gọi 1 em đơn lẻ hoặc gọi theo nhóm nhiều em cùng một lượt
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Presets: 1, 2, 3, 4, 5 em */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1">
              {presetCounts.map((num) => (
                <button
                  key={num}
                  disabled={isSpinning || num > candidatePool.length}
                  onClick={() => setPickQuantity(num)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    pickQuantity === num
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  {num === 1 ? '1 em (Đơn)' : `${num} em`}
                </button>
              ))}
            </div>

            {/* Stepper for custom quantity */}
            <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50 p-0.5">
              <button
                disabled={isSpinning || pickQuantity <= 1}
                onClick={() => setPickQuantity((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-black disabled:opacity-30 cursor-pointer"
                title="Giảm 1 em"
              >
                -
              </button>

              <div className="px-3 text-xs font-black text-blue-900 min-w-[50px] text-center">
                {safePickCount} / {candidatePool.length}
              </div>

              <button
                disabled={isSpinning || pickQuantity >= candidatePool.length}
                onClick={() => setPickQuantity((prev) => Math.min(candidatePool.length, prev + 1))}
                className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-black disabled:opacity-30 cursor-pointer"
                title="Tăng 1 em"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Advanced filters & Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-xs">
          {/* Filter 1: Lớp học */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600 flex items-center gap-1.5">
              <span>Lớp học:</span>
            </label>
            <select
              value={selectedClassId}
              disabled={isSpinning}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="all">Tất cả lớp ({students.length} HS)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({students.filter((s) => s.classIds.includes(cls.id)).length} HS)
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Nhóm học tập (Chia nhóm) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-600 flex items-center gap-1.5">
                <span>Nhóm học tập:</span>
              </label>
              {activeClassGroups.length === 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('groups')}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                >
                  + Chia nhóm
                </button>
              )}
            </div>

            {activeClassGroups.length > 0 ? (
              <select
                value={selectedGroupId}
                disabled={isSpinning}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              >
                <option value="all">Tất cả các nhóm ({activeClassGroups.length} nhóm)</option>
                {activeClassGroups.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    {grp.name} ({grp.studentIds.length} HS)
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('groups')}
                className="w-full px-3 py-2 bg-blue-50/70 border border-blue-200/80 rounded-xl font-bold text-blue-700 hover:bg-blue-100/70 text-left flex items-center justify-between transition-colors cursor-pointer"
                title="Bấm để chuyển tới trang Chia nhóm lớp học"
              >
                <span>Chưa chia nhóm</span>
                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md">Chia ngay</span>
              </button>
            )}
          </div>

          {/* Filter 3: Giới tính */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600 flex items-center gap-1.5">
              <span>Giới tính:</span>
            </label>
            <select
              value={selectedGender}
              disabled={isSpinning}
              onChange={(e) => setSelectedGender(e.target.value as 'all' | 'Nam' | 'Nữ')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="all">Tất cả (Nam & Nữ)</option>
              <option value="Nam">Chỉ gọi học sinh Nam 👦</option>
              <option value="Nữ">Chỉ gọi học sinh Nữ 👧</option>
            </select>
          </div>

          {/* Option 4: Exclusion of already picked students */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={excludeAlreadyPicked}
                disabled={isSpinning}
                onChange={(e) => setExcludeAlreadyPicked(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
              />
              <div className="leading-tight">
                <span className="font-bold text-slate-800 block">Không gọi lại</span>
                <span className="text-[10px] text-slate-400">Trừ em đã trúng buổi này</span>
              </div>
            </label>
          </div>
        </div>

        {/* Row 3: Live pool status bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>
              Danh sách có thể gọi:{' '}
              <strong className="text-blue-900 font-extrabold">{candidatePool.length}</strong> /{' '}
              {basePool.length} học sinh
            </span>
            {sessionPickedIds.size > 0 && excludeAlreadyPicked && (
              <span className="text-[11px] text-slate-500 ml-1">
                (Đã gọi <strong className="text-emerald-700">{sessionPickedIds.size}</strong> em trong buổi)
              </span>
            )}
          </div>

          {sessionPickedIds.size > 0 && (
            <button
              onClick={handleResetSessionExclusions}
              disabled={isSpinning}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-200 hover:bg-blue-100/50 text-blue-700 font-bold text-[11px] cursor-pointer"
              title="Cho phép tất cả học sinh đã trúng được quay lại"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Làm mới danh sách chờ</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Stage: Stage Display & Action Buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Main Stage - 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-gradient-to-b from-blue-500/10 via-sky-50/30 to-white rounded-3xl border border-blue-100 p-6 sm:p-8 flex flex-col items-center justify-center min-h-[460px] text-center shadow-xs relative overflow-hidden">
            {/* Background Glow */}
            {selectedWinners.length > 0 && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
              </div>
            )}

            {/* A. WHEEL VIEW MODE */}
            {viewMode === 'wheel' && (
              <div className="relative flex flex-col items-center justify-center w-full">
                <div className="relative w-80 h-80 sm:w-96 sm:h-96">
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={380}
                    className="w-full h-full drop-shadow-md"
                  />
                </div>

                {selectedWinners.length > 0 && !isSpinning && (
                  <div className="mt-4 p-4 rounded-2xl bg-white border-2 border-amber-400 shadow-lg animate-in zoom-in-95 duration-300 max-w-sm w-full">
                    <div className="flex items-center justify-center gap-2 text-amber-800 font-black text-xs">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>HỌC SINH MAY MẮN TRÚNG THƯỞNG!</span>
                    </div>
                    <div className="mt-2 text-3xl">{selectedWinners[0].avatar}</div>
                    <h3 className="text-xl font-black text-slate-800 mt-1">{selectedWinners[0].name}</h3>
                    <p className="text-xs text-slate-400 font-bold">
                      #{selectedWinners[0].code} • {selectedWinners[0].stars} ⭐
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        onClick={() => openRewardModalForStudent(selectedWinners[0])}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thưởng Sao</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* B. CARD SLOTS VIEW MODE */}
            {viewMode === 'cards' && (
              <div className="w-full">
                {/* 1. When spinning: show rotating cards for each slot */}
                {isSpinning && (
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 font-black text-xs animate-pulse">
                      <Zap className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>ĐANG CHỌN NGẪU NHIÊN {safePickCount} HỌC SINH...</span>
                    </div>

                    <div
                      className={`grid gap-4 max-w-2xl mx-auto ${
                        safePickCount === 1
                          ? 'grid-cols-1 max-w-xs'
                          : safePickCount === 2
                          ? 'grid-cols-1 sm:grid-cols-2'
                          : safePickCount === 3
                          ? 'grid-cols-1 sm:grid-cols-3'
                          : 'grid-cols-2 sm:grid-cols-4'
                      }`}
                    >
                      {displayedCandidates.map((cand, idx) => (
                        <div
                          key={`spin-${cand.id}-${idx}`}
                          className="p-5 bg-white rounded-3xl border-2 border-blue-400 shadow-md space-y-3 transform scale-95 transition-transform"
                        >
                          <div className="text-4xl animate-bounce">{cand.avatar}</div>
                          <div className="font-black text-slate-800 text-base truncate">{cand.name}</div>
                          <div className="text-xs text-slate-400 font-bold">#{cand.code}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. When selection is finished: display all picked winners */}
                {!isSpinning && selectedWinners.length > 0 && (
                  <div className="space-y-6 w-full max-w-3xl mx-auto animate-in zoom-in-95 duration-300">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs shadow-xs">
                      <Trophy className="w-4 h-4 text-amber-600" />
                      <span>
                        {selectedWinners.length === 1
                          ? 'HỌC SINH MAY MẮN NHẤT!'
                          : `DANH SÁCH ${selectedWinners.length} HỌC SINH MAY MẮN!`}
                      </span>
                    </div>

                    {/* Winners Cards Grid */}
                    <div
                      className={`grid gap-4 ${
                        selectedWinners.length === 1
                          ? 'grid-cols-1 max-w-sm mx-auto'
                          : selectedWinners.length === 2
                          ? 'grid-cols-1 sm:grid-cols-2'
                          : selectedWinners.length === 3
                          ? 'grid-cols-1 sm:grid-cols-3'
                          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                      }`}
                    >
                      {selectedWinners.map((winner, idx) => (
                        <div
                          key={winner.id}
                          className="p-5 bg-white rounded-3xl border-2 border-amber-400 shadow-lg space-y-3 relative group hover:border-amber-500 transition-all text-center"
                        >
                          {/* Order Badge */}
                          <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs flex items-center justify-center">
                            {idx + 1}
                          </div>

                          <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 border-3 border-amber-300 flex items-center justify-center text-4xl shadow-sm">
                            {winner.avatar}
                          </div>

                          <div>
                            <h4 className="text-base font-black text-slate-800 truncate" title={winner.name}>
                              {winner.name}
                            </h4>
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                              #{winner.code} • {winner.gender} •{' '}
                              <span className="text-amber-600 font-extrabold">{winner.stars} ⭐</span>
                            </p>
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={() => openRewardModalForStudent(winner)}
                              className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Thưởng sao</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Batch Reward Section (Thưởng đồng loạt cho các em vừa chọn) */}
                    <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span>Thưởng nhanh cho cả nhóm ({selectedWinners.length} em):</span>
                        </span>
                        <p className="text-[11px] text-amber-800">
                          Cộng điểm thi đua cùng lúc cho tất cả các em vừa được gọi tên
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <button
                          onClick={() => handleBatchReward(1)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>+1 ⭐</span>
                        </button>
                        <button
                          onClick={() => handleBatchReward(2)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>+2 ⭐</span>
                        </button>
                        <button
                          onClick={() => handleBatchReward(5)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>+5 ⭐</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Initial Idle State */}
                {!isSpinning && selectedWinners.length === 0 && (
                  <div className="p-8 bg-white/85 backdrop-blur-xs rounded-3xl border border-dashed border-blue-300 shadow-xs space-y-4 max-w-md mx-auto">
                    <div className="w-20 h-20 mx-auto rounded-full bg-blue-100/70 border border-blue-200 flex items-center justify-center text-4xl shadow-inner">
                      🎁
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-800">
                        Sẵn sàng gọi tên {safePickCount > 1 ? `${safePickCount} học sinh` : 'học sinh'}!
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Đang có <strong>{candidatePool.length}</strong> học sinh đủ điều kiện quay trong danh sách.
                        Nhấn nút bên dưới để bắt đầu!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons: Play & Reset */}
            <div className="mt-8 flex items-center justify-center gap-3 w-full max-w-sm">
              <button
                id="start-lucky-wheel-btn"
                disabled={isSpinning || candidatePool.length === 0}
                onClick={handleStartPick}
                className="flex-1 py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 active:scale-95 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>
                  {isSpinning
                    ? 'Đang quay ngẫu nhiên...'
                    : safePickCount === 1
                    ? 'QUAY GỌI 1 EM'
                    : `QUAY GỌI ${safePickCount} EM`}
                </span>
              </button>

              {selectedWinners.length > 0 && !isSpinning && (
                <button
                  onClick={handleResetSelection}
                  className="p-3.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-2xl transition-colors cursor-pointer border border-slate-200"
                  title="Đặt lại lượt quay"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Picks & History (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  LỊCH SỬ GỌI TÊN
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold">
                  {pickedHistory.length} lượt
                </span>
                {pickedHistory.length > 0 && (
                  <button
                    onClick={() => {
                      setPickedHistory([]);
                      showToast('Đã xóa lịch sử các lượt gọi gần đây', 'info');
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Xóa lịch sử"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List of Recent Pick Rounds */}
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
              {pickedHistory.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                  <div className="text-3xl opacity-50">📋</div>
                  <p>Chưa có lượt gọi nào trong phiên làm việc này.</p>
                </div>
              ) : (
                pickedHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span className="inline-flex items-center gap-1 font-bold text-blue-700">
                        {item.mode === 'multiple' ? `Nhóm ${item.count} em` : 'Gọi đơn (1 em)'}
                      </span>
                      <span>{item.timeFormatted}</span>
                    </div>

                    <div className="space-y-1.5">
                      {item.students.map((stu) => (
                        <div
                          key={stu.id}
                          className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">{stu.avatar}</span>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-800 truncate">{stu.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                #{stu.code} • {stu.stars} ⭐
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => openRewardModalForStudent(stu)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg shrink-0 transition-colors"
                            title="Thưởng sao cho em này"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Guide Footer */}
          <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 leading-relaxed space-y-1">
            <span className="font-black block">💡 Mẹo cho thầy cô:</span>
            <p className="text-slate-600">
              Bật tính năng <strong>"Không gọi lại"</strong> để đảm bảo mọi học sinh trong lớp đều có lượt tham gia trước khi lặp lại.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
