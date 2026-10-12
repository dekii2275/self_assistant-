import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Timer,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Task } from '../types/task';

interface PomodoroTimerProps {
  tasks: Task[];
  activeTask: Task | null;
  onSelectTask: (task: Task | null) => void;
  onLogPomodoro: (taskId: number, minutes: number) => Promise<void>;
}

type Mode = 'pomodoro' | 'shortBreak' | 'longBreak';

const MODE_TIMES: Record<Mode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  tasks,
  activeTask,
  onSelectTask,
  onLogPomodoro,
}) => {
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(MODE_TIMES.pomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Play pleasant nature chime using Web Audio API
  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Harmonic pleasant chord (chime)
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // Audio fallback
    }
  };

  // Browser Notification
  const triggerNotification = (title: string, body: string) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/otter-mascot.png',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  };

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleCompleteSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, activeTask]);

  const handleCompleteSession = async () => {
    setIsRunning(false);
    playChimeSound();

    if (mode === 'pomodoro') {
      confetti({
        particleCount: 50,
        spread: 70,
        colors: ['#10b981', '#059669', '#f59e0b', '#34d399', '#84cc16'],
      });

      triggerNotification(
        '🎉 Hoàn thành phiên Pomodoro!',
        activeTask
          ? `Bé Rái Cá chúc mừng bạn hoàn thành 25 phút tập trung vào: ${activeTask.title}`
          : 'Bé Rái Cá chúc mừng bạn hoàn thành 25 phút tập trung!'
      );

      // Log 25 minutes to active task
      if (activeTask) {
        await onLogPomodoro(activeTask.id, 25);
      }

      // Switch to short break
      setMode('shortBreak');
      setTimeLeft(MODE_TIMES.shortBreak);
    } else {
      triggerNotification('☕ Hết giờ giải lao!', 'Hãy quay lại phiên tập trung tiếp theo cùng bé Rái Cá nhé.');
      setMode('pomodoro');
      setTimeLeft(MODE_TIMES.pomodoro);
    }
  };

  const changeMode = (newMode: Mode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_TIMES[newMode]);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODE_TIMES[mode]);
  };

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = Math.round(((MODE_TIMES[mode] - timeLeft) / MODE_TIMES[mode]) * 100);

  // Active incomplete tasks for selector
  const availableTasks = tasks.filter((t) => !t.is_completed);

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none">
      {/* Floating Collapsed Pill */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 bg-white/95 backdrop-blur-md border border-emerald-200/90 rounded-full px-4 py-2.5 shadow-xl hover:shadow-2xl hover:border-emerald-400 transition-all group"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-emerald-100 ring-2 ring-emerald-300">
            <img
              src="/otter-mascot.png"
              alt="Otter Pomodoro"
              className="w-full h-full object-cover object-top"
            />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                {mode === 'pomodoro' ? '🍅 Tập trung' : '☕ Giải lao'}
              </span>
              {isRunning && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <div className="text-sm font-black text-emerald-950 font-mono leading-none mt-0.5">
              {timeFormatted}
            </div>
          </div>

          <div className="p-1 rounded-full text-emerald-700/60 group-hover:text-emerald-900 group-hover:bg-emerald-50 transition-colors">
            <ChevronUp className="w-4 h-4" />
          </div>
        </button>
      ) : (
        /* Expanded Floating Widget */
        <div className="w-80 bg-white/95 backdrop-blur-md border border-emerald-200 rounded-3xl p-4 shadow-2xl space-y-4 animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl overflow-hidden bg-emerald-100 ring-1 ring-emerald-300">
                <img
                  src="/otter-mascot.png"
                  alt="Otter"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <span className="text-xs font-black text-emerald-950">Rái Cá Pomodoro</span>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-emerald-700/60 hover:text-emerald-950 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-emerald-50/70 p-1 rounded-2xl">
            <button
              onClick={() => changeMode('pomodoro')}
              className={`py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                mode === 'pomodoro'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800/70 hover:text-emerald-950'
              }`}
            >
              25p Tập trung
            </button>
            <button
              onClick={() => changeMode('shortBreak')}
              className={`py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                mode === 'shortBreak'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800/70 hover:text-emerald-950'
              }`}
            >
              5p Nghỉ ngắn
            </button>
            <button
              onClick={() => changeMode('longBreak')}
              className={`py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                mode === 'longBreak'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800/70 hover:text-emerald-950'
              }`}
            >
              15p Nghỉ dài
            </button>
          </div>

          {/* Big Time Display */}
          <div className="text-center py-2">
            <div className="text-4xl font-black text-emerald-950 tracking-tight font-mono">
              {timeFormatted}
            </div>
            <div className="w-full bg-emerald-100/60 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Task Link Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-emerald-800/60 uppercase flex items-center gap-1">
              <Timer className="w-3 h-3 text-emerald-600" />
              <span>Đang tập trung cho nhiệm vụ:</span>
            </label>
            <select
              value={activeTask?.id || ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                const found = tasks.find((t) => t.id === id) || null;
                onSelectTask(found);
              }}
              className="w-full text-xs font-semibold text-emerald-950 bg-emerald-50/60 border border-emerald-200 rounded-xl px-2.5 py-1.5 outline-none focus:bg-white focus:border-emerald-500"
            >
              <option value="">-- Tập trung tự do (Không gắn task) --</option>
              {availableTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.actual_minutes || 0}p đã làm)
                </option>
              ))}
            </select>
          </div>

          {/* Action Controls */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={resetTimer}
              className="p-2 text-emerald-700/60 hover:text-emerald-950 hover:bg-emerald-50 rounded-xl transition-colors"
              title="Đặt lại"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if ('Notification' in window && Notification.permission === 'default') {
                  Notification.requestPermission();
                }
                setIsRunning(!isRunning);
              }}
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-700/20 transition-all"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isRunning ? 'Tạm dừng' : 'Bắt đầu'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
