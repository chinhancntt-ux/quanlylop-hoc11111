import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Users,
  Timer,
  Volume2,
  VolumeX,
  Award,
  ChevronRight,
  Shuffle,
  Clock,
  CheckCircle2,
  BellRing,
  BellOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playTick, playAlarmSound, stopAlarmSound } from '../utils/audio';

const WHEEL_COLORS = [
  '#f59e0b',
  '#0284c7',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#ea580c',
  '#06b6d4',
  '#84cc16',
];

const TEAM_NAMES = [
  '🐝 Đội Ong Vàng',
  '🍯 Đội Ong Mật',
  '🌻 Đội Hướng Dương',
  '👑 Đội Ong Chúa',
  '⚡ Đội Ong Thợ',
  '🚀 Đội Siêu Trí Tuệ',
];

export const InteractiveTools: React.FC = () => {
  const { classes, students, awardPoints, profile } = useApp();

  const [activeTool, setActiveTool] = useState<'wheel' | 'timer' | 'teams'>('wheel');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');

  const classStudents = students.filter((s) => s.classIds.includes(selectedClassId));

  // -------------------------------------------------------------
  // TOOL 1: LUCKY WHEEL (VÒNG QUAY MAY MẮN GỌI HỌC SINH)
  // -------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Student | null>(null);
  const rotationAngleRef = useRef(0);
  const spinVelocityRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 15;

    ctx.clearRect(0, 0, size, size);

    const items = classStudents.length > 0 ? classStudents : [{ id: '0', name: 'Chưa có học sinh' }];
    const arc = (2 * Math.PI) / items.length;

    // Draw wheel segments
    items.forEach((stu, i) => {
      const segmentAngle = angle + i * arc;

      ctx.beginPath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, segmentAngle, segmentAngle + arc);
      ctx.lineTo(center, center);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(segmentAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      const displayName = stu.name.length > 14 ? stu.name.slice(0, 13) + '...' : stu.name;
      ctx.fillText(displayName, radius - 20, 5);
      ctx.restore();
    });

    // Center hub
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Center bee icon
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐝', center, center);
  };

  useEffect(() => {
    drawWheel(rotationAngleRef.current);
  }, [classStudents]);

  const spinWheel = () => {
    if (isSpinning || classStudents.length === 0) return;

    setWinner(null);
    setIsSpinning(true);

    const fullRotations = (5 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
    const randomOffset = Math.random() * 2 * Math.PI;
    const targetDistance = fullRotations + randomOffset;

    let currentDistance = 0;
    const duration = 4500; // ms
    const startTime = performance.now();
    const initialAngle = rotationAngleRef.current;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);

      currentDistance = targetDistance * easeOut;
      const currentAngle = initialAngle + currentDistance;
      rotationAngleRef.current = currentAngle;
      drawWheel(currentAngle);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);

        // Calculate winning index (pointer is at top: 3*PI/2)
        const totalItems = classStudents.length;
        const arc = (2 * Math.PI) / totalItems;
        const normalizedAngle = (currentAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        // Pointer is at 3*PI/2 (top)
        const pointerAngle = (3 * Math.PI / 2);
        let relativeAngle = (pointerAngle - normalizedAngle) % (2 * Math.PI);
        if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

        const winningIndex = Math.floor(relativeAngle / arc) % totalItems;
        const selected = classStudents[winningIndex];
        setWinner(selected);

        // Fireworks celebration
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // -------------------------------------------------------------
  // TOOL 2: CLASSROOM COUNTDOWN TIMER (ĐỒNG HỒ ĐẾM NGƯỢC)
  // -------------------------------------------------------------
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // 5 mins
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [initialSeconds, setInitialSeconds] = useState<number>(300);
  const [isAlarmRinging, setIsAlarmRinging] = useState<boolean>(false);
  const [timerSoundEnabled, setTimerSoundEnabled] = useState<boolean>(true);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setIsAlarmRinging(true);
            playAlarmSound(timerSoundEnabled, 'school_bell');
            try {
              confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
            } catch {}
            return 0;
          }
          const next = prev - 1;
          playTick(timerSoundEnabled, next <= 10);
          return next;
        });
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, timerSoundEnabled]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSetPresetTimer = (seconds: number) => {
    stopAlarmSound();
    setIsAlarmRinging(false);
    setIsTimerRunning(false);
    setInitialSeconds(seconds);
    setTimerSeconds(seconds);
  };

  // -------------------------------------------------------------
  // TOOL 3: TEAM RANDOMIZER (CHIA NHÓM NGẪU NHIÊN)
  // -------------------------------------------------------------
  const [teamCount, setTeamCount] = useState<number>(3);
  const [teams, setTeams] = useState<{ name: string; members: Student[] }[]>([]);

  const handleShuffleTeams = () => {
    if (classStudents.length === 0) return;

    // Shuffle copy of students
    const shuffled = [...classStudents].sort(() => Math.random() - 0.5);
    const newTeams: { name: string; members: Student[] }[] = Array.from(
      { length: teamCount },
      (_, i) => ({
        name: TEAM_NAMES[i % TEAM_NAMES.length],
        members: [],
      })
    );

    shuffled.forEach((student, index) => {
      const targetTeam = index % teamCount;
      newTeams[targetTeam].members.push(student);
    });

    setTeams(newTeams);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
            <span>{profile.centerName || 'Quản lí lớp học thân thiện'}</span>
            <span>/</span>
            <span className="text-slate-500">Công cụ hỗ trợ giảng dạy</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Góc Tương Tác Lớp Học</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              3 Công cụ thông minh 🎡
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Vòng quay may mắn gọi tên, đồng hồ đếm ngược hoạt động nhóm, và chia nhóm học tập tự động
          </p>
        </div>

        {/* Pick active class */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Lớp áp dụng:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.grade})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tool Selector Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          onClick={() => setActiveTool('wheel')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTool === 'wheel'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Vòng quay may mắn (Gọi tên ngẫu nhiên)</span>
        </button>

        <button
          onClick={() => setActiveTool('timer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTool === 'timer'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>Đồng hồ đếm ngược</span>
        </button>

        <button
          onClick={() => setActiveTool('teams')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTool === 'teams'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>Chia nhóm ngẫu nhiên</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: LUCKY WHEEL */}
      {/* ------------------------------------------------------------- */}
      {activeTool === 'wheel' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wheel Canvas Display */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center">
            <div className="relative mb-6">
              {/* Pointer indicator at the top */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-x-12 border-x-transparent border-t-20 border-t-rose-600 filter drop-shadow-md"></div>

              {/* Canvas wheel */}
              <canvas
                ref={canvasRef}
                width={380}
                height={380}
                className="max-w-full rounded-full shadow-lg border-4 border-amber-300"
              />
            </div>

            {/* Spin Trigger Button */}
            <button
              type="button"
              onClick={spinWheel}
              disabled={isSpinning || classStudents.length === 0}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                isSpinning
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:brightness-105 shadow-amber-500/30'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>{isSpinning ? 'Đang quay số...' : 'Quay Số Gọi Học Sinh'}</span>
            </button>
          </div>

          {/* Winner and Student Pool */}
          <div className="space-y-4">
            {/* Winner Box */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 p-6 rounded-2xl shadow-md border border-amber-400">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900/80">
                  🎉 Người may mắn được chọn
                </span>
                <span className="text-xl">🏆</span>
              </div>

              {winner ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={winner.avatar}
                      alt={winner.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-950 shadow-md"
                    />
                    <div>
                      <h3 className="font-black text-xl text-slate-950">{winner.name}</h3>
                      <p className="text-xs font-semibold text-slate-900/80">
                        Mã: {winner.code} • {winner.stars} 🐝
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-amber-400/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-950">Mời em trả lời bài!</span>
                    <button
                      onClick={() => awardPoints(winner.id, 1, 'Trả lời bài theo vòng quay may mắn', selectedClassId)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 text-amber-400 hover:bg-slate-900 font-bold text-xs shadow-xs cursor-pointer"
                    >
                      +1 🐝 Thưởng ngay
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-900/70 font-semibold text-xs">
                  Bấm nút &quot;Quay Số Gọi Học Sinh&quot; để chọn ngẫu nhiên một em lên bảng trả lời bài!
                </div>
              )}
            </div>

            {/* Students in wheel */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-slate-800">
                  Danh sách trong vòng quay ({classStudents.length})
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {classStudents.map((stu, i) => (
                  <div
                    key={stu.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400 w-4">{i + 1}</span>
                      <span className="font-semibold text-slate-800">{stu.name}</span>
                    </div>
                    <span className="text-[11px] text-amber-700 font-bold">{stu.stars} 🐝</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 2: COUNTDOWN TIMER */}
      {/* ------------------------------------------------------------- */}
      {activeTool === 'timer' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-6">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
              Đồng hồ lớp học BeeClass
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">
              Đếm Ngược Thời Gian Hoạt Động & Làm Bài
            </h2>
          </div>

          {/* Huge Digital Clock */}
          <div className="w-64 h-64 rounded-full border-8 border-amber-400/40 flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white shadow-xl relative">
            <span className="text-6xl font-black text-slate-900 font-mono tracking-tight">
              {formatTimer(timerSeconds)}
            </span>
            <span className="text-xs font-semibold text-slate-500 mt-1">
              {isTimerRunning ? '● Đang đếm ngược' : 'Tạm dừng'}
            </span>
          </div>

          {/* Alarm Ringing Banner */}
          {isAlarmRinging && (
            <div className="p-3.5 bg-rose-600 text-white rounded-xl shadow-lg animate-bounce flex items-center justify-between gap-3 w-full max-w-sm">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 animate-spin text-amber-300" />
                <span className="text-xs font-black">HẾT GIỜ! CHUÔNG ĐANG REO</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopAlarmSound();
                  setIsAlarmRinging(false);
                }}
                className="px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold cursor-pointer"
              >
                Tắt chuông
              </button>
            </div>
          )}

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {[60, 180, 300, 600, 900].map((sec) => (
              <button
                key={sec}
                onClick={() => handleSetPresetTimer(sec)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  initialSeconds === sec && !isTimerRunning
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {sec / 60} Phút
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                stopAlarmSound();
                setIsAlarmRinging(false);
                if (timerSeconds <= 0) {
                  setTimerSeconds(initialSeconds);
                  setIsTimerRunning(true);
                  playTick(timerSoundEnabled, false);
                  return;
                }
                setIsTimerRunning(!isTimerRunning);
                if (!isTimerRunning) {
                  playTick(timerSoundEnabled, timerSeconds <= 10);
                }
              }}
              className={`px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                isTimerRunning
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
              }`}
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isTimerRunning ? 'Tạm Dừng' : 'Bắt Đầu'}</span>
            </button>

            <button
              onClick={() => {
                stopAlarmSound();
                setIsAlarmRinging(false);
                setIsTimerRunning(false);
                setTimerSeconds(initialSeconds);
                playTick(timerSoundEnabled, false);
              }}
              className="p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
              title="Đặt lại thời gian"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setTimerSoundEnabled(!timerSoundEnabled);
                if (timerSoundEnabled) {
                  stopAlarmSound();
                  setIsAlarmRinging(false);
                }
              }}
              className={`p-3 rounded-xl border font-bold transition-colors cursor-pointer ${
                timerSoundEnabled
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-slate-100 text-slate-400'
              }`}
              title={timerSoundEnabled ? 'Đang bật âm thanh (tít & chuông)' : 'Đang tắt âm thanh'}
            >
              {timerSoundEnabled ? <Volume2 className="w-5 h-5 text-amber-600" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 3: TEAM RANDOMIZER */}
      {/* ------------------------------------------------------------- */}
      {activeTool === 'teams' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Số lượng nhóm cần chia:</label>
              <select
                value={teamCount}
                onChange={(e) => setTeamCount(Number(e.target.value))}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value={2}>2 Nhóm</option>
                <option value={3}>3 Nhóm</option>
                <option value={4}>4 Nhóm</option>
                <option value={5}>5 Nhóm</option>
                <option value={6}>6 Nhóm</option>
              </select>
            </div>

            <button
              onClick={handleShuffleTeams}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all"
            >
              <Shuffle className="w-4 h-4" />
              <span>Xáo Trộn & Chia Nhóm Ngay</span>
            </button>
          </div>

          {teams.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400">
              <span className="text-3xl mb-2 block">🐝</span>
              <h3 className="font-bold text-slate-700 text-sm mb-1">Chưa có nhóm nào được chia</h3>
              <p className="text-xs">
                Chọn số lượng nhóm và bấm nút &quot;Xáo Trộn & Chia Nhóm Ngay&quot; để chia {classStudents.length} học sinh của lớp!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden"
                >
                  <div className="bg-amber-500/15 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-900">{team.name}</h4>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      {team.members.length} thành viên
                    </span>
                  </div>

                  <div className="p-4 divide-y divide-slate-100">
                    {team.members.map((member, mIdx) => (
                      <div key={member.id} className="py-2 flex items-center gap-2.5 text-xs">
                        <span className="font-bold text-slate-400 w-4">{mIdx + 1}</span>
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-7 h-7 rounded-full object-cover border border-amber-300"
                        />
                        <div className="flex-1">
                          <span className="font-bold text-slate-800 block leading-tight">
                            {member.name}
                          </span>
                          <span className="text-[10px] text-slate-500">{member.code}</span>
                        </div>
                        <span className="font-bold text-amber-700">{member.stars} 🐝</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
