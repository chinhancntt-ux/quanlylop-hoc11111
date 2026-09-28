import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Volume1,
  Sparkles,
  Edit3,
  Sliders,
  Plus,
  Clock,
  CheckCircle2,
  Music
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { playTick, playAlarmSound, stopAlarmSound } from '../utils/audio';

type TickMode = 'always' | 'last10' | 'off';
type AlarmStyle = 'school_bell' | 'chime' | 'digital';

export const CountdownTimerView: React.FC = () => {
  const { config } = useApp();

  const [totalSeconds, setTotalSeconds] = useState<number>(300); // default 5 mins
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activityTitle, setActivityTitle] = useState<string>('Thảo luận nhóm');
  const [customMinutes, setCustomMinutes] = useState<number>(5);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [showSoundSettings, setShowSoundSettings] = useState<boolean>(true);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('timer_sound_enabled');
    return saved !== null ? saved === 'true' : (config.soundEnabled !== false);
  });
  const [tickMode, setTickMode] = useState<TickMode>(() => {
    const saved = localStorage.getItem('timer_tick_mode') as TickMode;
    return saved || 'always';
  });
  const [alarmStyle, setAlarmStyle] = useState<AlarmStyle>(() => {
    const saved = localStorage.getItem('timer_alarm_style') as AlarmStyle;
    return saved || 'school_bell';
  });
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('timer_volume');
    return saved ? parseFloat(saved) : 0.85;
  });
  const [isAlarmRinging, setIsAlarmRinging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // Save sound preferences
  const updateSoundEnabled = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('timer_sound_enabled', String(enabled));
    if (!enabled) {
      stopAlarmSound();
      setIsAlarmRinging(false);
    }
  };

  const updateTickMode = (mode: TickMode) => {
    setTickMode(mode);
    localStorage.setItem('timer_tick_mode', mode);
  };

  const updateAlarmStyle = (style: AlarmStyle) => {
    setAlarmStyle(style);
    localStorage.setItem('timer_alarm_style', style);
  };

  const updateVolume = (val: number) => {
    setVolume(val);
    localStorage.setItem('timer_volume', String(val));
  };

  const presets = [
    { label: '15 giây', seconds: 15 },
    { label: '30 giây', seconds: 30 },
    { label: '1 phút', seconds: 60 },
    { label: '2 phút', seconds: 120 },
    { label: '3 phút', seconds: 180 },
    { label: '5 phút', seconds: 300 },
    { label: '10 phút', seconds: 600 },
    { label: '15 phút', seconds: 900 },
  ];

  const handleSelectPreset = (secs: number) => {
    stopAlarmSound();
    setIsAlarmRinging(false);
    setIsRunning(false);
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
  };

  const handleSetCustomMinutes = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMinutes <= 0) return;
    const secs = customMinutes * 60;
    stopAlarmSound();
    setIsAlarmRinging(false);
    setIsRunning(false);
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
  };

  const handleAddExtraTime = (extraSeconds: number) => {
    stopAlarmSound();
    setIsAlarmRinging(false);
    setRemainingSeconds(prev => prev + extraSeconds);
    setTotalSeconds(prev => Math.max(prev, remainingSeconds + extraSeconds));
    playTick(soundEnabled, false, volume);
  };

  const handleStopAlarm = () => {
    stopAlarmSound();
    setIsAlarmRinging(false);
  };

  const toggleRun = () => {
    stopAlarmSound();
    setIsAlarmRinging(false);

    if (remainingSeconds <= 0) {
      setRemainingSeconds(totalSeconds);
      setIsRunning(true);
      playTick(soundEnabled, false, volume);
      return;
    }

    setIsRunning(prev => {
      const next = !prev;
      if (next) {
        playTick(soundEnabled, remainingSeconds <= 10, volume);
      }
      return next;
    });
  };

  const handleReset = () => {
    stopAlarmSound();
    setIsAlarmRinging(false);
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
    playTick(soundEnabled, false, volume);
  };

  // Timer interval tick
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          // HẾT GIỜ: Kích hoạt chuông reo cảnh báo
          setIsRunning(false);
          setIsAlarmRinging(true);
          playAlarmSound(soundEnabled, alarmStyle, volume);
          try {
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.6 }
            });
          } catch {
            // ignore
          }
          return 0;
        }

        const nextSec = prev - 1;

        // TIẾNG TÍT KHI THỜI GIAN GIẢM
        if (soundEnabled) {
          if (tickMode === 'always') {
            // Tít đều mỗi giây; khi còn <= 10s sẽ tự động chuyển sang âm tít khẩn cấp
            playTick(true, nextSec <= 10, volume);
          } else if (tickMode === 'last10' && nextSec <= 10) {
            // Chỉ tít dồn dập trong 10 giây cuối
            playTick(true, true, volume);
          }
        }

        return nextSec;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled, tickMode, alarmStyle, volume]);

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      stopAlarmSound();
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-rose-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <Timer className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              ĐỒNG HỒ ĐẾM NGƯỢC LỚP HỌC
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Hỗ trợ phát tiếng tít khi thời gian giảm và chuông reo cảnh báo báo hiệu hết giờ
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Sound Toggle */}
          <button
            type="button"
            onClick={() => updateSoundEnabled(!soundEnabled)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
            }`}
            title={soundEnabled ? 'Đang bật âm thanh' : 'Đang tắt âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>{soundEnabled ? 'BẬT ÂM THANH' : 'TẮT ÂM THANH'}</span>
          </button>

          <button
            id="timer-fullscreen-btn"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'THU NHỎ' : 'TOÀN MÀN HÌNH'}</span>
          </button>
        </div>
      </div>

      {/* Main Timer Stage */}
      <div
        ref={containerRef}
        className={`bg-white rounded-3xl border border-orange-100 p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center space-y-6 sm:space-y-8 text-center transition-all relative overflow-hidden ${
          isFullscreen
            ? 'h-screen justify-around bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-8'
            : ''
        } ${isAlarmRinging ? 'ring-4 ring-rose-500 ring-offset-4 ring-offset-rose-50' : ''}`}
      >
        {/* Fullscreen Floating Top Controls */}
        {isFullscreen && (
          <div className="w-full flex items-center justify-between px-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 text-amber-300 font-bold backdrop-blur-xs flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                <span>Trình chiếu lớp học</span>
              </span>
              <button
                type="button"
                onClick={() => updateSoundEnabled(!soundEnabled)}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold backdrop-blur-xs flex items-center gap-1.5 cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
                <span>{soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</span>
              </button>
            </div>

            <button
              onClick={toggleFullscreen}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold backdrop-blur-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Thu nhỏ (Esc)</span>
            </button>
          </div>
        )}

        {/* Activity Title (Editable) */}
        <div className="flex items-center justify-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              className="text-xl sm:text-2xl font-black text-center border-b-2 border-orange-500 focus:outline-hidden bg-transparent px-2"
            />
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center gap-2 cursor-pointer"
              title="Bấm để đổi tên hoạt động"
            >
              <h3 className={`text-xl sm:text-2xl font-black ${isFullscreen ? 'text-orange-300' : 'text-slate-800'}`}>
                {activityTitle}
              </h3>
              <Edit3 className="w-4 h-4 text-slate-400 group-hover:text-orange-500" />
            </div>
          )}
        </div>

        {/* Giant Digital Clock Display */}
        <div className="relative py-2">
          <div
            className={`font-mono text-7xl sm:text-9xl font-black tracking-tight select-none transition-transform duration-150 ${
              remainingSeconds === 0
                ? 'text-rose-600 scale-105 animate-bounce'
                : remainingSeconds <= 10 && isRunning
                ? 'text-rose-500 scale-102 animate-pulse'
                : isFullscreen
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            {formatTime(remainingSeconds)}
          </div>

          {/* Status Subtitle / Sound indicator */}
          <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold">
            {isRunning ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Đang đếm ngược ({tickMode === 'always' ? 'Tít mỗi giây' : tickMode === 'last10' ? 'Tít 10s cuối' : 'Tắt tiếng tít'})</span>
              </span>
            ) : remainingSeconds === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-300 font-bold animate-pulse">
                <BellRing className="w-4 h-4 text-rose-600 animate-spin" />
                <span>ĐÃ HẾT GIỜ LÀM BÀI!</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500">
                <span>Tạm dừng</span>
              </span>
            )}
          </div>

          {/* Alarm Ringing Banner & STOP ALARM BUTTON */}
          {isAlarmRinging && (
            <div className="mt-4 p-4 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white rounded-2xl shadow-xl animate-bounce flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <BellRing className="w-6 h-6 animate-spin text-amber-300" />
                <span className="text-base sm:text-lg font-black tracking-wide">
                  CHUÔNG BÁO HẾT GIỜ ĐANG REO!
                </span>
              </div>
              <button
                type="button"
                onClick={handleStopAlarm}
                className="px-5 py-2 bg-white text-rose-700 hover:bg-rose-50 font-black text-xs sm:text-sm rounded-xl shadow-md active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
              >
                <BellOff className="w-4 h-4 text-rose-600" />
                <span>TẮT CHUÔNG BÁO</span>
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              remainingSeconds <= 10
                ? 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                : 'bg-gradient-to-r from-amber-400 to-orange-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            id="timer-start-toggle-btn"
            onClick={toggleRun}
            className={`px-8 py-3.5 rounded-2xl font-black text-sm text-white shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            <span>{isRunning ? 'TẠM DỪNG' : 'BẮT ĐẦU'}</span>
          </button>

          <button
            id="timer-reset-btn"
            onClick={handleReset}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-md shadow-blue-200 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ĐẶT LẠI</span>
          </button>

          {/* Quick extra time button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleAddExtraTime(30)}
              className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
              title="Cộng thêm 30 giây"
            >
              +30s
            </button>
            <button
              type="button"
              onClick={() => handleAddExtraTime(60)}
              className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
              title="Cộng thêm 1 phút"
            >
              +1p
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        {!isFullscreen && (
          <div className="w-full max-w-xl pt-4 border-t border-slate-100 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cài đặt nhanh thời gian
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {presets.map((p) => (
                <button
                  key={p.seconds}
                  onClick={() => handleSelectPreset(p.seconds)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    totalSeconds === p.seconds
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600'
                  }`}
                >
                  ⚡ {p.label}
                </button>
              ))}
            </div>

            {/* Custom Minutes Input */}
            <form
              onSubmit={handleSetCustomMinutes}
              className="flex items-center justify-center gap-2 pt-2"
            >
              <span className="text-xs font-bold text-slate-500">Tùy chỉnh:</span>
              <input
                type="number"
                min={1}
                max={180}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(parseInt(e.target.value, 10) || 1)}
                className="w-16 px-2 py-1 text-xs font-bold text-center bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              />
              <span className="text-xs font-bold text-slate-500">phút</span>
              <button
                type="submit"
                className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Đặt thời gian
              </button>
            </form>
          </div>
        )}
      </div>

      {/* SOUND CONFIGURATION CARD (Cấu hình âm thanh tiếng tít & tiếng chuông reo) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sliders className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                THIẾT LẬP ÂM THANH ĐỒNG HỒ & CHUÔNG BÁO
              </h3>
              <p className="text-[11px] text-slate-500">
                Tùy chỉnh tiếng tít đếm nhịp khi giảm thời gian và chuông reo cảnh báo khi hết giờ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Test Tick Button */}
            <button
              type="button"
              onClick={() => playTick(true, false, volume)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Bấm để nghe thử tiếng tít mỗi giây"
            >
              <Volume1 className="w-3.5 h-3.5 text-blue-600" />
              <span>Thử tiếng tít</span>
            </button>

            {/* Test Urgent Tick Button */}
            <button
              type="button"
              onClick={() => playTick(true, true, volume)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Bấm để nghe thử tiếng tít 10 giây cuối"
            >
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span>Thử tít 10s cuối</span>
            </button>

            {/* Test Alarm Sound Button */}
            <button
              type="button"
              onClick={() => {
                setIsAlarmRinging(true);
                playAlarmSound(true, alarmStyle, volume);
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Bấm để nghe thử tiếng chuông reo cảnh báo"
            >
              <BellRing className="w-3.5 h-3.5 text-rose-600" />
              <span>Thử chuông reo</span>
            </button>

            {isAlarmRinging && (
              <button
                type="button"
                onClick={handleStopAlarm}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-xs animate-pulse cursor-pointer"
              >
                <BellOff className="w-3.5 h-3.5" />
                <span>Dừng chuông</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Section 1: Tiếng tít khi thời gian giảm */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Tiếng tít khi đếm thời gian:</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Phát tiếng tít nhịp điệu khi đồng hồ đếm ngược
            </p>

            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => updateTickMode('always')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                  tickMode === 'always'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>⏱️ Tít đều mỗi giây (Tự tăng âm 10s cuối)</span>
                {tickMode === 'always' && <CheckCircle2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => updateTickMode('last10')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                  tickMode === 'last10'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>⚡ Chỉ tít dồn dập ở 10 giây cuối</span>
                {tickMode === 'last10' && <CheckCircle2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => updateTickMode('off')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                  tickMode === 'off'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>🔕 Tắt tiếng tít (Chỉ reo khi hết giờ)</span>
                {tickMode === 'off' && <CheckCircle2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Section 2: Tiếng chuông reo cảnh báo khi hết giờ */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-rose-500" />
                <span>Tiếng chuông reo hết giờ:</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Kiểu chuông cảnh báo phát ra khi thời gian về 0:00
            </p>

            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => updateAlarmStyle('school_bell')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                  alarmStyle === 'school_bell'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>🔔 Chuông trường học (Reng reng reo vang dội)</span>
                {alarmStyle === 'school_bell' && <CheckCircle2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => updateAlarmStyle('chime')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                  alarmStyle === 'chime'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>🎵 Chuông ngân vang (Đing - đoong giai điệu)</span>
                {alarmStyle === 'chime' && <CheckCircle2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => updateAlarmStyle('digital')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                  alarmStyle === 'digital'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>🚨 Còi điện tử (Cấp báo nhanh dồn dập)</span>
                {alarmStyle === 'digital' && <CheckCircle2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Section 3: Âm lượng & Bật/Tắt âm thanh */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl space-y-3">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>Âm lượng & Trạng thái:</span>
            </label>
            <p className="text-[11px] text-slate-500">
              Điều chỉnh độ lớn âm thanh phù hợp với không gian phòng học
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Mức âm lượng:</span>
                <span className="font-mono text-emerald-600">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={volume}
                onChange={(e) => updateVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => updateVolume(0.4)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    Math.abs(volume - 0.4) < 0.05
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Êm dịu (40%)
                </button>
                <button
                  type="button"
                  onClick={() => updateVolume(0.7)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    Math.abs(volume - 0.7) < 0.05
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Vừa phải (70%)
                </button>
                <button
                  type="button"
                  onClick={() => updateVolume(1.0)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    Math.abs(volume - 1.0) < 0.05
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  To rõ (100%)
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => updateSoundEnabled(!soundEnabled)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    soundEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{soundEnabled ? 'Âm thanh: ĐANG BẬT' : 'Âm thanh: ĐANG TẮT'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

