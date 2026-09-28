import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Student, ClassroomGroup } from '../types';
import {
  Users,
  Sparkles,
  Shuffle,
  RotateCcw,
  Trash2,
  Crown,
  Plus,
  Copy,
  Printer,
  Edit2,
  Check,
  X,
  Dice5,
  ArrowRightLeft,
  ChevronDown,
  Award,
  Flame,
  CheckCircle2,
  HelpCircle,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';

const GROUP_PALETTES = [
  { bg: 'bg-blue-50/80', border: 'border-blue-300', header: 'bg-blue-600 text-white', accent: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  { bg: 'bg-emerald-50/80', border: 'border-emerald-300', header: 'bg-emerald-600 text-white', accent: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  { bg: 'bg-amber-50/80', border: 'border-amber-300', header: 'bg-amber-500 text-white', accent: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  { bg: 'bg-purple-50/80', border: 'border-purple-300', header: 'bg-purple-600 text-white', accent: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  { bg: 'bg-rose-50/80', border: 'border-rose-300', header: 'bg-rose-500 text-white', accent: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
  { bg: 'bg-orange-50/80', border: 'border-orange-300', header: 'bg-orange-500 text-white', accent: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  { bg: 'bg-cyan-50/80', border: 'border-cyan-300', header: 'bg-cyan-600 text-white', accent: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800' },
  { bg: 'bg-lime-50/80', border: 'border-lime-300', header: 'bg-lime-600 text-white', accent: 'text-lime-700', badge: 'bg-lime-100 text-lime-800' },
];

const THEMES: Record<string, string[]> = {
  numbers: ['Nhóm 1', 'Nhóm 2', 'Nhóm 3', 'Nhóm 4', 'Nhóm 5', 'Nhóm 6', 'Nhóm 7', 'Nhóm 8'],
  animals: [
    '🐝 Nhóm Ong Chăm Chỉ',
    '🐿️ Nhóm Sóc Nhanh Nhẹn',
    '🐰 Nhóm Thỏ Trắng',
    '🦁 Nhóm Sư Tử Dũng Mãnh',
    '🐼 Nhóm Gấu Trúc Đáng Yêu',
    '🐯 Nhóm Hổ Con Tinh Anh',
    '🐬 Nhóm Cá Heo Thông Minh',
    '🦅 Nhóm Đại Bàng Vươn Cao',
  ],
  traits: [
    '💡 Nhóm Sáng Tạo',
    '⭐ Nhóm Tự Tin',
    '🤝 Nhóm Đoàn Kết',
    '🚀 Nhóm Vươn Xa',
    '🎯 Nhóm Tiên Phong',
    '🔥 Nhóm Bứt Phá',
    '🏆 Nhóm Quyết Thắng',
    '💎 Nhóm Tinh Anh',
  ],
  colors: [
    '🌈 Nhóm Cầu Vồng',
    '☀️ Nhóm Ánh Dương',
    '✨ Nhóm Sao Băng',
    '🌊 Nhóm Biển Xanh',
    '⚡ Nhóm Tia Chớp',
    '🌸 Nhóm Hoa Mai',
    '🍀 Nhóm Cỏ May Mắn',
    '🍁 Nhóm Lá Thu',
  ],
};

export const ClassroomGroupsView: React.FC = () => {
  const {
    students,
    classes,
    activeClassId,
    setActiveClassId,
    activeClass,
    classroomGroups,
    saveClassGroups,
    rewardStudent,
    batchRewardStudents,
    showToast,
    playSound,
    openRewardModalForStudent,
  } = useApp();

  // Class Selection
  const [selectedClassId, setSelectedClassId] = useState<string>(activeClassId || classes[0]?.id || 'cls-1');

  // Eligible students for the current class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classIds && s.classIds.includes(selectedClassId));
  }, [students, selectedClassId]);

  // Current groups for this class
  const currentGroups = useMemo(() => {
    return classroomGroups[selectedClassId] || [];
  }, [classroomGroups, selectedClassId]);

  // Division Configuration
  const [splitMode, setSplitMode] = useState<'by_groups' | 'by_size'>('by_groups');
  const [targetGroupCount, setTargetGroupCount] = useState<number>(4);
  const [targetGroupSize, setTargetGroupSize] = useState<number>(4);
  const [criteria, setCriteria] = useState<'random' | 'gender_balance' | 'star_balance'>('gender_balance');
  const [themeKey, setThemeKey] = useState<string>('animals');
  const [autoAssignLeader, setAutoAssignLeader] = useState<boolean>(true);

  // Modals and editing state
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState<string>('');
  const [isMoveStudentModalOpen, setIsMoveStudentModalOpen] = useState<boolean>(false);
  const [movingStudent, setMovingStudent] = useState<Student | null>(null);
  const [sourceGroupId, setSourceGroupId] = useState<string>('');

  // Random Team Picker Modal
  const [isPickTeamModalOpen, setIsPickTeamModalOpen] = useState<boolean>(false);
  const [isPickingTeam, setIsPickingTeam] = useState<boolean>(false);
  const [pickedGroup, setPickedGroup] = useState<ClassroomGroup | null>(null);
  const [pickedStudentFromGroup, setPickedStudentFromGroup] = useState<Student | null>(null);

  // Trigger Confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      });
    } catch {}
  };

  // -------------------------------------------------------------
  // ALGORITHM: DIVIDE INTO GROUPS
  // -------------------------------------------------------------
  const handleDivideGroups = () => {
    if (classStudents.length === 0) {
      showToast('Lớp học này chưa có học sinh nào để chia nhóm!', 'error');
      return;
    }

    let numGroups = targetGroupCount;
    if (splitMode === 'by_size') {
      const size = Math.max(1, targetGroupSize);
      numGroups = Math.max(1, Math.round(classStudents.length / size));
    }
    numGroups = Math.max(1, Math.min(numGroups, classStudents.length));

    // Prepare list of student objects to distribute
    let studentsToDistribute = [...classStudents];

    if (criteria === 'random') {
      // Complete random shuffle
      studentsToDistribute.sort(() => 0.5 - Math.random());
    } else if (criteria === 'gender_balance') {
      // Separate males and females, shuffle each, then alternate distribute
      const males = studentsToDistribute.filter((s) => s.gender === 'Nam').sort(() => 0.5 - Math.random());
      const females = studentsToDistribute.filter((s) => s.gender === 'Nữ').sort(() => 0.5 - Math.random());
      
      const combined: Student[] = [];
      const maxLength = Math.max(males.length, females.length);
      for (let i = 0; i < maxLength; i++) {
        if (i < males.length) combined.push(males[i]);
        if (i < females.length) combined.push(females[i]);
      }
      studentsToDistribute = combined;
    } else if (criteria === 'star_balance') {
      // Sort by stars descending, then snake-draft across groups
      studentsToDistribute.sort((a, b) => b.stars - a.stars);
    }

    // Initialize empty groups
    const themeNames = THEMES[themeKey] || THEMES.animals;
    const newGroups: ClassroomGroup[] = Array.from({ length: numGroups }, (_, i) => {
      const palette = GROUP_PALETTES[i % GROUP_PALETTES.length];
      const defaultName = themeNames[i] || `Nhóm ${i + 1}`;
      return {
        id: `grp-${Date.now()}-${i + 1}`,
        name: defaultName,
        color: palette.header,
        studentIds: [],
      };
    });

    // Distribute students
    if (criteria === 'star_balance') {
      // Snake-draft distribution for equal star balance
      let groupIndex = 0;
      let direction = 1;
      studentsToDistribute.forEach((student) => {
        newGroups[groupIndex].studentIds.push(student.id);
        groupIndex += direction;
        if (groupIndex >= numGroups) {
          groupIndex = numGroups - 1;
          direction = -1;
        } else if (groupIndex < 0) {
          groupIndex = 0;
          direction = 1;
        }
      });
    } else {
      // Round-robin distribution
      studentsToDistribute.forEach((student, index) => {
        const groupIndex = index % numGroups;
        newGroups[groupIndex].studentIds.push(student.id);
      });
    }

    // Auto assign leader if enabled
    if (autoAssignLeader) {
      newGroups.forEach((group) => {
        if (group.studentIds.length > 0) {
          const randomLeaderIndex = Math.floor(Math.random() * group.studentIds.length);
          group.leaderStudentId = group.studentIds[randomLeaderIndex];
        }
      });
    }

    saveClassGroups(selectedClassId, newGroups);
    playSound('praise');
    triggerConfetti();
    showToast(`🎉 Đã chia ${classStudents.length} học sinh thành ${newGroups.length} nhóm thành công!`, 'success');
  };

  // Re-shuffle keeping the current groups count
  const handleReshuffle = () => {
    if (currentGroups.length === 0) {
      handleDivideGroups();
      return;
    }
    setTargetGroupCount(currentGroups.length);
    handleDivideGroups();
  };

  // Clear groups
  const handleClearGroups = () => {
    if (confirm('Bạn có chắc muốn xóa danh sách chia nhóm hiện tại của lớp này không?')) {
      saveClassGroups(selectedClassId, []);
      showToast('Đã xóa danh sách nhóm của lớp.', 'info');
    }
  };

  // Inline Rename Group
  const handleStartRename = (group: ClassroomGroup) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
  };

  const handleSaveRename = () => {
    if (!editingGroupId || !editGroupName.trim()) {
      setEditingGroupId(null);
      return;
    }
    const updated = currentGroups.map((g) =>
      g.id === editingGroupId ? { ...g, name: editGroupName.trim() } : g
    );
    saveClassGroups(selectedClassId, updated);
    setEditingGroupId(null);
    showToast('Đã cập nhật tên nhóm!', 'success');
  };

  // Change leader
  const handleToggleLeader = (groupId: string, studentId: string) => {
    const updated = currentGroups.map((g) => {
      if (g.id === groupId) {
        const newLeader = g.leaderStudentId === studentId ? undefined : studentId;
        return { ...g, leaderStudentId: newLeader };
      }
      return g;
    });
    saveClassGroups(selectedClassId, updated);
    const stu = classStudents.find((s) => s.id === studentId);
    showToast(
      stu ? `👑 ${stu.name} đã được chọn làm Trưởng nhóm!` : 'Đã thay đổi Trưởng nhóm!',
      'success'
    );
  };

  // Move student to another group
  const handleOpenMove = (student: Student, groupId: string) => {
    setMovingStudent(student);
    setSourceGroupId(groupId);
    setIsMoveStudentModalOpen(true);
  };

  const handleExecuteMove = (targetGroupId: string) => {
    if (!movingStudent || targetGroupId === sourceGroupId) {
      setIsMoveStudentModalOpen(false);
      return;
    }

    const updated = currentGroups.map((g) => {
      if (g.id === sourceGroupId) {
        return {
          ...g,
          studentIds: g.studentIds.filter((id) => id !== movingStudent.id),
          leaderStudentId: g.leaderStudentId === movingStudent.id ? undefined : g.leaderStudentId,
        };
      }
      if (g.id === targetGroupId) {
        return {
          ...g,
          studentIds: [...g.studentIds, movingStudent.id],
        };
      }
      return g;
    });

    saveClassGroups(selectedClassId, updated);
    setIsMoveStudentModalOpen(false);
    showToast(`Đã chuyển ${movingStudent.name} sang nhóm mới!`, 'success');
  };

  // Reward entire group
  const handleRewardGroup = (group: ClassroomGroup, points: number) => {
    if (group.studentIds.length === 0) return;
    batchRewardStudents(
      group.studentIds,
      points,
      `Thưởng hoạt động nhóm: ${group.name}`
    );
    playSound('praise');
    triggerConfetti();
    showToast(`⭐ Đã cộng +${points} sao cho toàn bộ thành viên ${group.name}!`, 'success');
  };

  // Pick 1 random student from a group
  const handlePickRandomStudentFromGroup = (group: ClassroomGroup) => {
    if (group.studentIds.length === 0) return;
    const randomIndex = Math.floor(Math.random() * group.studentIds.length);
    const chosenStudentId = group.studentIds[randomIndex];
    const chosenStudent = classStudents.find((s) => s.id === chosenStudentId);
    if (chosenStudent) {
      setPickedGroup(group);
      setPickedStudentFromGroup(chosenStudent);
      setIsPickTeamModalOpen(true);
      playSound('praise');
      triggerConfetti();
    }
  };

  // Pick 1 random group among all groups
  const handlePickRandomGroup = () => {
    if (currentGroups.length === 0) return;
    setIsPickTeamModalOpen(true);
    setIsPickingTeam(true);
    setPickedGroup(null);
    setPickedStudentFromGroup(null);

    let counter = 0;
    const maxSteps = 15;
    const interval = setInterval(() => {
      counter++;
      const randomGrp = currentGroups[Math.floor(Math.random() * currentGroups.length)];
      setPickedGroup(randomGrp);
      playSound('tick');

      if (counter >= maxSteps) {
        clearInterval(interval);
        setIsPickingTeam(false);
        const finalGrp = currentGroups[Math.floor(Math.random() * currentGroups.length)];
        setPickedGroup(finalGrp);
        // also pick representative
        if (finalGrp.studentIds.length > 0) {
          const randomStuId = finalGrp.studentIds[Math.floor(Math.random() * finalGrp.studentIds.length)];
          setPickedStudentFromGroup(classStudents.find((s) => s.id === randomStuId) || null);
        }
        playSound('praise');
        triggerConfetti();
      }
    }, 100);
  };

  // Copy all groups to clipboard
  const handleCopyAllGroups = () => {
    if (currentGroups.length === 0) return;

    let text = `📋 DANH SÁCH CHIA NHÓM - ${activeClass?.name || 'LỚP HỌC'}\n`;
    text += `Tổng số học sinh: ${classStudents.length} • Số nhóm: ${currentGroups.length}\n`;
    text += `------------------------------------\n\n`;

    currentGroups.forEach((group, idx) => {
      text += `📌 ${group.name} (${group.studentIds.length} thành viên):\n`;
      group.studentIds.forEach((sid, sIdx) => {
        const stu = classStudents.find((s) => s.id === sid);
        if (stu) {
          const isLeader = group.leaderStudentId === sid ? ' 👑 (Trưởng nhóm)' : '';
          text += `   ${sIdx + 1}. ${stu.name} [${stu.gender}] - ${stu.stars}⭐${isLeader}\n`;
        }
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    showToast('Đã sao chép danh sách chia nhóm vào Clipboard!', 'success');
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 select-none animate-in fade-in duration-200">
      {/* 1. Header Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-sky-600 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-black tracking-wider uppercase backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CÔNG CỤ HOẠT ĐỘNG NHÓM TIỂU HỌC</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Chia Nhóm Lớp Học</span>
              <span className="text-2xl">👥</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              Tạo các nhóm học tập linh hoạt theo tiêu chí ngẫu nhiên, cân bằng Nam/Nữ hoặc cân bằng học lực.
              Thưởng sao cho cả nhóm, chọn nhóm đại diện và in phiếu làm việc nhóm nhanh chóng.
            </p>
          </div>

          {/* Class Switcher & Quick Stats */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 min-w-[200px]">
              <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block mb-1">
                Lớp Đang Chọn:
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setActiveClassId(e.target.value);
                }}
                className="w-full bg-white text-slate-800 font-extrabold text-xs px-3 py-2 rounded-xl border border-blue-200 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({students.filter((s) => s.classIds.includes(c.id)).length} HS)
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex items-center gap-4 text-center justify-center">
              <div>
                <span className="text-[11px] text-blue-200 block font-bold">Sĩ số lớp</span>
                <span className="text-lg font-black text-amber-300">{classStudents.length}</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <span className="text-[11px] text-blue-200 block font-bold">Số nhóm</span>
                <span className="text-lg font-black text-white">{currentGroups.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Control Panel: Chia Nhóm Tùy Chọn */}
      <div className="bg-white rounded-3xl border border-blue-100 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Thiết Lập Quy Tắc Chia Nhóm</h3>
              <p className="text-xs text-slate-400">Tùy chỉnh số lượng, tiêu chí cân đối và chủ đề tên gọi</p>
            </div>
          </div>

          {currentGroups.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePickRandomGroup}
                className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                title="Quay ngẫu nhiên 1 nhóm để lên bảng hoặc trả lời"
              >
                <Dice5 className="w-4 h-4" />
                <span>Gọi Nhóm Ngẫu Nhiên</span>
              </button>

              <button
                onClick={handleCopyAllGroups}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Sao chép toàn bộ danh sách nhóm"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao Chép</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                title="In phiếu nhóm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Phiếu</span>
              </button>
            </div>
          )}
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Option 1: Chế độ chia & số nhóm */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
              <span>Phương thức chia:</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
              <button
                onClick={() => setSplitMode('by_groups')}
                className={`py-1.5 rounded-lg font-bold transition-all ${
                  splitMode === 'by_groups'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Theo số nhóm
              </button>
              <button
                onClick={() => setSplitMode('by_size')}
                className={`py-1.5 rounded-lg font-bold transition-all ${
                  splitMode === 'by_size'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Số HS / nhóm
              </button>
            </div>

            {/* Stepper value */}
            <div className="pt-1 flex items-center justify-between">
              <span className="text-slate-500 font-medium">
                {splitMode === 'by_groups' ? 'Số lượng nhóm:' : 'Học sinh mỗi nhóm:'}
              </span>
              <div className="flex items-center gap-1 border border-slate-200 rounded-xl bg-white p-0.5">
                <button
                  onClick={() => {
                    if (splitMode === 'by_groups') {
                      setTargetGroupCount((p) => Math.max(2, p - 1));
                    } else {
                      setTargetGroupSize((p) => Math.max(2, p - 1));
                    }
                  }}
                  className="w-7 h-7 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  -
                </button>
                <span className="px-2 font-black text-blue-900 min-w-[32px] text-center">
                  {splitMode === 'by_groups' ? targetGroupCount : targetGroupSize}
                </span>
                <button
                  onClick={() => {
                    if (splitMode === 'by_groups') {
                      setTargetGroupCount((p) => Math.min(10, p + 1));
                    } else {
                      setTargetGroupSize((p) => Math.min(12, p + 1));
                    }
                  }}
                  className="w-7 h-7 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Option 2: Tiêu chí thông minh */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
              <span>Tiêu chí sắp xếp:</span>
            </label>
            <select
              value={criteria}
              onChange={(e) => setCriteria(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            >
              <option value="gender_balance">⚖️ Cân bằng Nam - Nữ</option>
              <option value="random">🎲 Ngẫu nhiên hoàn toàn</option>
              <option value="star_balance">⭐ Cân bằng Hoa sao / Học lực</option>
            </select>
            <p className="text-[11px] text-slate-400 leading-snug">
              {criteria === 'gender_balance'
                ? 'Tự động rải đều học sinh Nam và Nữ vào các nhóm.'
                : criteria === 'star_balance'
                ? 'Trộn đều bạn nhiều sao với bạn cần hỗ trợ để học tập tương trợ.'
                : 'Xáo trộn ngẫu nhiên tự do giữa tất cả học sinh.'}
            </p>
          </div>

          {/* Option 3: Tên nhóm theo chủ đề */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
              <span>Chủ đề tên nhóm:</span>
            </label>
            <select
              value={themeKey}
              onChange={(e) => setThemeKey(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            >
              <option value="animals">🐝 Động vật vui nhộn (Ong, Sóc, Thỏ...)</option>
              <option value="traits">🚀 Tỏa sáng (Sáng Tạo, Tự Tin, Đoàn Kết...)</option>
              <option value="colors">🌈 Màu sắc (Cầu Vồng, Ánh Dương, Sao Băng...)</option>
              <option value="numbers">🔢 Số thứ tự (Nhóm 1, Nhóm 2, Nhóm 3...)</option>
            </select>
            <p className="text-[11px] text-slate-400 leading-snug">
              Tên gọi sinh động kích thích sự hứng thú và thi đua giữa các đội.
            </p>
          </div>

          {/* Option 4: Bầu Trưởng Nhóm */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <label className="font-extrabold text-slate-700 block mb-1.5">
                Trưởng nhóm:
              </label>
              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={autoAssignLeader}
                  onChange={(e) => setAutoAssignLeader(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                />
                <div className="leading-tight">
                  <span className="font-bold text-slate-800 text-xs block">
                    👑 Tự chọn Trưởng nhóm
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Chọn ngẫu nhiên 1 em làm nhóm trưởng
                  </span>
                </div>
              </label>
            </div>

            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Có thể đổi trưởng nhóm bất cứ lúc nào</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDivideGroups}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Shuffle className="w-4 h-4" />
              <span>{currentGroups.length > 0 ? 'Chia Nhóm Mới' : 'Bắt Đầu Chia Nhóm'}</span>
            </button>

            {currentGroups.length > 0 && (
              <button
                onClick={handleReshuffle}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm rounded-2xl flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Trộn lại các thành viên"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Xáo Trộn Lại</span>
              </button>
            )}
          </div>

          {currentGroups.length > 0 && (
            <button
              onClick={handleClearGroups}
              className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200/80 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hủy Bỏ Nhóm</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Empty State or Groups Grid */}
      {currentGroups.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-blue-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-4xl shadow-inner text-blue-600">
            👥
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-800">Lớp học chưa được chia nhóm</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hãy chọn số nhóm mong muốn và bấm nút <strong>"Bắt Đầu Chia Nhóm"</strong> ở phía trên để hệ thống tự động sắp xếp học sinh vào các nhóm.
            </p>
          </div>
          <button
            onClick={handleDivideGroups}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
          >
            <Shuffle className="w-4 h-4" />
            <span>Chia Nhóm Ngay</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <span>Danh Sách Các Nhóm ({currentGroups.length} Nhóm)</span>
              <span className="text-xs font-bold text-slate-400">
                • {classStudents.length} học sinh
              </span>
            </h3>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Nhấp vào 👑 để đổi trưởng nhóm • Nhấp vào ✏️ để đổi tên nhóm
            </span>
          </div>

          {/* Groups Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {currentGroups.map((group, gIdx) => {
              const palette = GROUP_PALETTES[gIdx % GROUP_PALETTES.length];
              const groupStudents = group.studentIds
                .map((sid) => classStudents.find((s) => s.id === sid))
                .filter(Boolean) as Student[];

              const totalStars = groupStudents.reduce((sum, s) => sum + s.stars, 0);
              const maleCount = groupStudents.filter((s) => s.gender === 'Nam').length;
              const femaleCount = groupStudents.filter((s) => s.gender === 'Nữ').length;

              return (
                <div
                  key={group.id}
                  className={`rounded-3xl border-2 ${palette.border} ${palette.bg} shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md group`}
                >
                  {/* Card Header */}
                  <div className={`px-5 py-3.5 ${palette.header} flex items-center justify-between gap-2 shadow-xs`}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {editingGroupId === group.id ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editGroupName}
                            onChange={(e) => setEditGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                            autoFocus
                            className="w-full px-2 py-1 bg-white text-slate-900 rounded-lg text-xs font-black focus:outline-hidden"
                          />
                          <button
                            onClick={handleSaveRename}
                            className="p-1 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingGroupId(null)}
                            className="p-1 bg-rose-500 hover:bg-rose-600 rounded-lg text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-black shrink-0">
                            {gIdx + 1}
                          </span>
                          <h4 className="font-black text-sm truncate" title={group.name}>
                            {group.name}
                          </h4>
                          <button
                            onClick={() => handleStartRename(group)}
                            title="Sửa tên nhóm"
                            className="p-1 rounded-md hover:bg-white/20 opacity-70 hover:opacity-100 transition-opacity"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-black tracking-wide">
                        {groupStudents.length} HS
                      </span>
                    </div>
                  </div>

                  {/* Summary Bar: Gender ratio & stars */}
                  <div className="px-5 py-2 bg-white/60 border-b border-slate-200/50 flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>
                      👦 {maleCount} Nam • 👧 {femaleCount} Nữ
                    </span>
                    <span className="text-amber-600 font-extrabold">
                      ⭐ Tổng: {totalStars} sao
                    </span>
                  </div>

                  {/* Student List in this group */}
                  <div className="p-4 space-y-2 flex-1 max-h-[360px] overflow-y-auto scrollbar-thin">
                    {groupStudents.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                        Chưa có học sinh trong nhóm
                      </div>
                    ) : (
                      groupStudents.map((stu, sIdx) => {
                        const isLeader = group.leaderStudentId === stu.id;

                        return (
                          <div
                            key={stu.id}
                            className={`p-2.5 rounded-2xl flex items-center justify-between gap-2.5 border transition-all ${
                              isLeader
                                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/30'
                                : 'bg-white border-slate-200/70 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {/* Avatar */}
                              <div className="relative shrink-0">
                                <div className="w-9 h-9 rounded-full bg-blue-50 border border-slate-200 flex items-center justify-center text-xl shadow-2xs">
                                  {stu.avatar}
                                </div>
                                {isLeader && (
                                  <span
                                    className="absolute -top-1.5 -right-1.5 text-amber-500 text-xs"
                                    title="Trưởng nhóm"
                                  >
                                    👑
                                  </span>
                                )}
                              </div>

                              {/* Info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-xs text-slate-800 truncate" title={stu.name}>
                                    {stu.name}
                                  </span>
                                  {isLeader && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-200/70 text-amber-900 font-black shrink-0">
                                      Trưởng nhóm
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  #{stu.code} • {stu.gender} •{' '}
                                  <span className="text-amber-600 font-bold">{stu.stars} ⭐</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions: Leader Toggle, Move Group, Reward */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleToggleLeader(group.id, stu.id)}
                                title={isLeader ? 'Hủy quyền Trưởng nhóm' : 'Chọn làm Trưởng nhóm'}
                                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                  isLeader
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                    : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'
                                }`}
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenMove(stu, group.id)}
                                title="Chuyển sang nhóm khác"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 text-xs transition-colors cursor-pointer"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => openRewardModalForStudent(stu)}
                                title="Thưởng riêng cho học sinh này"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 text-xs transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Group Action Footer */}
                  <div className="p-3.5 bg-white border-t border-slate-200/70 space-y-2">
                    {/* Batch Reward Buttons */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        <span>Thưởng cả nhóm:</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRewardGroup(group, 1)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-[11px] rounded-lg active:scale-95 transition-all cursor-pointer"
                          title="Cộng 1 sao cho tất cả thành viên trong nhóm"
                        >
                          +1 ⭐
                        </button>
                        <button
                          onClick={() => handleRewardGroup(group, 2)}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] rounded-lg active:scale-95 transition-all cursor-pointer shadow-2xs"
                          title="Cộng 2 sao cho tất cả thành viên trong nhóm"
                        >
                          +2 ⭐
                        </button>
                        <button
                          onClick={() => handleRewardGroup(group, 5)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg active:scale-95 transition-all cursor-pointer shadow-2xs"
                          title="Cộng 5 sao cho tất cả thành viên trong nhóm"
                        >
                          +5 ⭐
                        </button>
                      </div>
                    </div>

                    {/* Single member random caller */}
                    <button
                      onClick={() => handlePickRandomStudentFromGroup(group)}
                      className="w-full py-1.5 px-2.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-extrabold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Dice5 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Gọi ngẫu nhiên 1 bạn trong nhóm</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Modal: Move Student to Another Group */}
      {isMoveStudentModalOpen && movingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-blue-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <span>Chuyển Nhóm Học Sinh</span>
              </h3>
              <button
                onClick={() => setIsMoveStudentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 flex items-center gap-3 border border-blue-100">
              <div className="text-3xl">{movingStudent.avatar}</div>
              <div>
                <h4 className="font-black text-sm text-slate-800">{movingStudent.name}</h4>
                <p className="text-xs text-slate-400">#{movingStudent.code} • {movingStudent.gender}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Chọn nhóm chuyển tới:</label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {currentGroups.map((grp) => {
                  const isCurrent = grp.id === sourceGroupId;
                  return (
                    <button
                      key={grp.id}
                      disabled={isCurrent}
                      onClick={() => handleExecuteMove(grp.id)}
                      className={`w-full p-2.5 rounded-xl border text-left font-bold text-xs flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-800 cursor-pointer'
                      }`}
                    >
                      <span>{grp.name}</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {isCurrent ? '(Nhóm hiện tại)' : `${grp.studentIds.length} HS`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Picked Random Team or Member Announcement */}
      {isPickTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-amber-400 text-center space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-amber-400/20 blur-2xl" />

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>
                {isPickingTeam
                  ? 'ĐANG QUAY CHỌN NHÓM...'
                  : pickedStudentFromGroup
                  ? 'ĐẠI DIỆN NHÓM ĐƯỢC CHỌN!'
                  : 'NHÓM MAY MẮN ĐƯỢC CHỌN!'}
              </span>
            </div>

            {pickedGroup && (
              <div className="space-y-4">
                <div className="p-5 rounded-3xl bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200 shadow-inner">
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800">
                    {pickedGroup.name}
                  </h3>
                  <p className="text-xs font-bold text-amber-800 mt-1">
                    {pickedGroup.studentIds.length} thành viên trong nhóm
                  </p>
                </div>

                {/* Picked student representative */}
                {pickedStudentFromGroup && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center gap-3">
                    <div className="text-3xl">{pickedStudentFromGroup.avatar}</div>
                    <div className="text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                        Bạn đại diện phát biểu:
                      </span>
                      <h4 className="text-base font-black text-slate-800">
                        {pickedStudentFromGroup.name}
                      </h4>
                      <span className="text-xs text-slate-500 font-semibold">
                        #{pickedStudentFromGroup.code} • {pickedStudentFromGroup.stars} ⭐
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => handleRewardGroup(pickedGroup, 2)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thưởng +2 ⭐ cho nhóm</span>
                  </button>

                  <button
                    onClick={() => setIsPickTeamModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
