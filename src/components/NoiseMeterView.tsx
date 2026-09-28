import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sliders,
  AlertTriangle,
  Play,
  Square,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NoiseMeterView: React.FC = () => {
  const { playSound } = useApp();

  const [isListening, setIsListening] = useState<boolean>(false);
  const [volumeLevel, setVolumeLevel] = useState<number>(10); // 0 to 100
  const [sensitivity, setSensitivity] = useState<number>(1.2); // multiplier
  const [threshold, setThreshold] = useState<number>(75); // alert threshold
  const [micError, setMicError] = useState<string | null>(null);
  const [useSimulation, setUseSimulation] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const simIntervalRef = useRef<number | null>(null);
  const lastAlertTimeRef = useRef<number>(0);

  const startMicrophone = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const microphone = audioCtx.createMediaStreamSource(stream);
      microphone.connect(analyser);
      microphoneRef.current = microphone;

      setIsListening(true);
      setUseSimulation(false);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Scale to 0-100 with sensitivity
        const scaled = Math.min(100, Math.round((average / 128) * 100 * sensitivity));
        setVolumeLevel(scaled);

        // Sound alert if exceeds threshold
        if (scaled > threshold && Date.now() - lastAlertTimeRef.current > 3000) {
          lastAlertTimeRef.current = Date.now();
          playSound('alarm');
        }

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.warn('Microphone error or permission denied:', err);
      setMicError('Không thể mở microphone. Bạn có thể dùng chế độ mô phỏng âm thanh bên dưới.');
      // Auto fallback to simulation
      startSimulation();
    }
  };

  const startSimulation = () => {
    setIsListening(true);
    setUseSimulation(true);
    setMicError(null);

    let base = 25;
    simIntervalRef.current = window.setInterval(() => {
      // simulate realistic classroom noise variation
      const jitter = (Math.random() - 0.48) * 20;
      base = Math.max(8, Math.min(95, base + jitter));
      setVolumeLevel(Math.round(base));

      if (base > threshold && Date.now() - lastAlertTimeRef.current > 3000) {
        lastAlertTimeRef.current = Date.now();
        playSound('alarm');
      }
    }, 150);
  };

  const stopListening = () => {
    setIsListening(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setVolumeLevel(10);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  // Determine state info
  let statusEmoji = '🤫';
  let statusText = 'Lớp học rất yên tĩnh!';
  let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let barGradient = 'from-emerald-400 to-emerald-500';

  if (volumeLevel > 75) {
    statusEmoji = '😱';
    statusText = 'Quá ồn ào! Cả lớp hãy giữ trật tự!';
    statusColor = 'text-rose-600 bg-rose-100 border-rose-300 animate-bounce';
    barGradient = 'from-rose-500 to-red-600';
  } else if (volumeLevel > 50) {
    statusEmoji = '😮';
    statusText = 'Hơi ồn, các bạn chú ý nói nhỏ lại!';
    statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
    barGradient = 'from-yellow-400 to-amber-500';
  } else if (volumeLevel > 25) {
    statusEmoji = '😊';
    statusText = 'Độ ồn vừa phải, thảo luận tốt!';
    statusColor = 'text-blue-600 bg-blue-50 border-blue-200';
    barGradient = 'from-blue-400 to-indigo-500';
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
            <Mic className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            ĐO TIẾNG ỒN LỚP HỌC
          </h2>
        </div>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Phân tích mức độ âm thanh thời gian thực để giữ trật tự và rèn luyện nền nếp
        </p>
      </div>

      {micError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{micError}</span>
          </div>
        </div>
      )}

      {/* Main Noise Meter Dashboard (Image 3 style) */}
      <div className="bg-white rounded-3xl border border-teal-100 p-8 shadow-sm space-y-8 max-w-3xl mx-auto text-center">
        {/* Animated Face / Emoji Status */}
        <div className="space-y-3">
          <div
            className={`w-36 h-36 mx-auto rounded-full flex items-center justify-center text-7xl shadow-lg border-4 transition-all duration-200 ${
              isListening ? 'scale-105' : 'opacity-80'
            } ${statusColor}`}
          >
            {statusEmoji}
          </div>

          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            {statusText}
          </h3>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            <span>Cường độ âm thanh:</span>
            <span className="font-black text-slate-900 text-sm">{volumeLevel} %</span>
            {useSimulation && (
              <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                Mô phỏng
              </span>
            )}
          </div>
        </div>

        {/* Big Volume Bar */}
        <div className="space-y-2">
          <div className="h-8 bg-slate-100 rounded-2xl overflow-hidden p-1 border border-slate-200 relative">
            {/* Threshold marker line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
              style={{ left: `${threshold}%` }}
              title={`Ngưỡng cảnh báo: ${threshold}%`}
            />
            {/* Dynamic Volume Bar */}
            <div
              className={`h-full rounded-xl transition-all duration-100 bg-gradient-to-r ${barGradient}`}
              style={{ width: `${volumeLevel}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1">
            <span>🤫 Yên lặng (0%)</span>
            <span>😊 Bình thường (50%)</span>
            <span className="text-rose-500 font-extrabold">😱 Quá ồn ({threshold}%)</span>
          </div>
        </div>

        {/* Controls and Sensitivities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              <span>Độ nhạy Micro: ({Math.round(sensitivity * 100)}%)</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Ngưỡng cảnh báo ồn: ({threshold}%)</span>
            </label>
            <input
              type="range"
              min="40"
              max="95"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Start / Stop Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {!isListening ? (
            <button
              id="start-noise-meter-btn"
              onClick={startMicrophone}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-sm rounded-2xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>BẮT ĐẦU ĐO</span>
            </button>
          ) : (
            <button
              id="stop-noise-meter-btn"
              onClick={stopListening}
              className="w-full sm:w-auto px-8 py-3 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black text-sm rounded-2xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>DỪNG LẠI</span>
            </button>
          )}

          {!isListening && (
            <button
              onClick={startSimulation}
              className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all"
            >
              Chạy Thử Nghiệm Mô Phỏng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
