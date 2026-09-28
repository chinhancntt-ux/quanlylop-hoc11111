// Audio synthesis using Web Audio API (zero external assets needed)

let audioCtx: AudioContext | null = null;
let activeAlarmNodes: { stop: () => void }[] = [];
let alarmTimeoutId: number | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playChime(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'triangle';

  osc1.frequency.setValueAtTime(523.25, now); // C5
  osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
  osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3); // C6

  osc2.frequency.setValueAtTime(659.25, now); // E5
  osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.3); // E6

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.5);
  osc2.stop(now + 0.5);
}

export function playPenaltyChime(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(260, now + 0.25);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.35);
}

/**
 * Tiếng tít khi thời gian đếm ngược giảm dần
 * @param enabled Có bật âm thanh không
 * @param isUrgent Chế độ khẩn cấp (10s cuối - âm sắc cao hơn, dồn dập hơn)
 * @param volumeMultiplier Hệ số âm lượng (0.1 - 1.0)
 */
export function playTick(
  enabled: boolean = true,
  isUrgent: boolean = false,
  volumeMultiplier: number = 1
) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = Math.max(0.05, Math.min(1.0, volumeMultiplier));

  if (isUrgent) {
    // Tiếng tít khẩn cấp (10s cuối): Âm thanh sắc nét, 2 hòa âm thu hút sự chú ý
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, now); // E6
    osc1.frequency.exponentialRampToValueAtTime(1567.98, now + 0.05); // G6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1760.0, now); // A6

    gain.gain.setValueAtTime(0.14 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.08);
    osc2.stop(now + 0.08);
  } else {
    // Tiếng tít nhẹ nhàng chuẩn (mỗi giây): Gọn gàng, dễ chịu như nhịp đồng hồ kỹ thuật số
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5

    gain.gain.setValueAtTime(0.08 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }
}

/**
 * Dừng chuông reo cảnh báo ngay lập tức
 */
export function stopAlarmSound() {
  if (alarmTimeoutId !== null) {
    window.clearTimeout(alarmTimeoutId);
    alarmTimeoutId = null;
  }
  activeAlarmNodes.forEach((node) => {
    try {
      node.stop();
    } catch {
      // ignore
    }
  });
  activeAlarmNodes = [];
}

/**
 * Tiếng chuông reo cảnh báo khi hết thời gian
 * @param enabled Có bật âm thanh không
 * @param style Kiểu chuông: 'school_bell' (chuông trường học reng reng) | 'chime' (chuông ngân vang) | 'digital' (còi điện tử)
 * @param volumeMultiplier Hệ số âm lượng (0.1 - 1.0)
 */
export function playAlarmSound(
  enabled: boolean = true,
  style: 'school_bell' | 'chime' | 'digital' = 'school_bell',
  volumeMultiplier: number = 1
) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Dừng chuông cũ nếu đang reo
  stopAlarmSound();

  const now = ctx.currentTime;
  const vol = Math.max(0.1, Math.min(1.0, volumeMultiplier));

  if (style === 'school_bell') {
    // CHUÔNG TRƯỜNG HỌC (ELECTRIC SCHOOL BELL): Reng reng reng dồn vang
    // Mô phỏng búa gõ liên tục vào quả chuông đồng (16 lần/giây, chia 4 hồi reo)
    const bursts = [0, 1.1, 2.2, 3.3]; // 4 hồi chuông reo liên tục (~4.5s)
    const burstDuration = 0.85;

    bursts.forEach((burstStart) => {
      const startTime = now + burstStart;

      // 1. Tần số chuông kim loại chính và hòa âm
      const baseFreqs = [784, 1175, 1568, 2349]; // G5, D6, G6, D7
      baseFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const tremoloGain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        // LFO tạo hiệu ứng búa rung gõ chuông 18Hz (reng reng reng...)
        lfo.frequency.setValueAtTime(18, startTime);
        lfoGain.gain.setValueAtTime(0.5, startTime);
        lfo.connect(tremoloGain.gain);

        // Master gain cho hồi chuông
        const masterGain = ctx.createGain();
        const amp = (0.22 / (idx + 1)) * vol;
        masterGain.gain.setValueAtTime(amp, startTime);
        masterGain.gain.setValueAtTime(amp, startTime + burstDuration - 0.1);
        masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + burstDuration);

        osc.connect(tremoloGain);
        tremoloGain.connect(masterGain);
        masterGain.connect(ctx.destination);

        osc.start(startTime);
        lfo.start(startTime);
        osc.stop(startTime + burstDuration);
        lfo.stop(startTime + burstDuration);

        activeAlarmNodes.push({
          stop: () => {
            try {
              masterGain.gain.setValueAtTime(0, ctx.currentTime);
              osc.stop();
              lfo.stop();
            } catch {}
          },
        });
      });
    });

    // Tự động giải phóng sau khi hết 4.5s
    alarmTimeoutId = window.setTimeout(() => {
      stopAlarmSound();
    }, 4600);
  } else if (style === 'chime') {
    // CHUÔNG NGÂN VANG (CHIME BELL - DING DONG DING DONG)
    const notes = [
      { freq: 523.25, time: 0, dur: 1.2 },    // C5 (Đong)
      { freq: 659.25, time: 0.4, dur: 1.2 },  // E5 (Đing)
      { freq: 783.99, time: 0.8, dur: 1.2 },  // G5 (Đoong)
      { freq: 1046.5, time: 1.3, dur: 2.0 },  // C6 (Reo vang ngân dài)
      { freq: 1318.5, time: 1.35, dur: 2.0 }, // E6 hòa âm
    ];

    notes.forEach(({ freq, time, dur }) => {
      const startTime = now + time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25 * vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + dur);

      activeAlarmNodes.push({
        stop: () => {
          try {
            gain.gain.setValueAtTime(0, ctx.currentTime);
            osc.stop();
          } catch {}
        },
      });
    });

    alarmTimeoutId = window.setTimeout(() => {
      stopAlarmSound();
    }, 3600);
  } else {
    // DIGITAL BEEP ALARM (CÒI CẤP BÁO ĐIỆN TỬ)
    for (let i = 0; i < 8; i++) {
      const startTime = now + i * 0.25;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1046.5, startTime);
      osc.frequency.setValueAtTime(1318.5, startTime + 0.08);

      gain.gain.setValueAtTime(0.18 * vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.16);

      activeAlarmNodes.push({
        stop: () => {
          try {
            gain.gain.setValueAtTime(0, ctx.currentTime);
            osc.stop();
          } catch {}
        },
      });
    }

    alarmTimeoutId = window.setTimeout(() => {
      stopAlarmSound();
    }, 2200);
  }
}

