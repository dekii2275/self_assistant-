import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Timer,
  Clock,
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
  const completionHandledRef = useRef(false);

  // Play pleasant chime using Web Audio API
  const playChimeSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // Audio fallback
    }
  }, []);

  // Browser Notification
  const triggerNotification = useCallback((title: string, body: string) => {
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
  }, []);

  const handleCompleteSession = useCallback(async () => {
    setIsRunning(false);
    playChimeSound();

    if (mode === 'pomodoro') {
      confetti({
        particleCount: 40,
        spread: 60,
        colors: ['#10b981', '#059669', '#3b82f6', '#f59e0b'],
      });

      triggerNotification(
        'Hoàn thành phiên tập trung!',
        activeTask
          ? `Bạn đã hoàn thành 25 phút tập trung vào: ${activeTask.title}`
          : 'Bạn đã hoàn thành 25 phút tập trung hiệu quả!'
      );

      // Log 25 minutes to active task
      if (activeTask) {
        await onLogPomodoro(activeTask.id, 25);
      }

      // Switch to short break
      setMode('shortBreak');
      setTimeLeft(MODE_TIMES.shortBreak);
    } else {
      triggerNotification('Hết giờ giải lao!', 'Hãy quay lại phiên tập trung tiếp theo.');
      setMode('pomodoro');
      setTimeLeft(MODE_TIMES.pomodoro);
    }
  }, [mode, activeTask, onLogPomodoro, playChimeSound, triggerNotification]);

  useEffect(() => {
    if (!isRunning) return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || timeLeft !== 0 || completionHandledRef.current) return;
    completionHandledRef.current = true;
    void handleCompleteSession();
  }, [isRunning, timeLeft, handleCompleteSession]);

  const changeMode = (newMode: Mode) => {
    completionHandledRef.current = false;
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_TIMES[newMode]);
  };

  const resetTimer = () => {
    completionHandledRef.current = false;
    setIsRunning(false);
    setTimeLeft(MODE_TIMES[mode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = Math.round(((MODE_TIMES[mode] - timeLeft) / MODE_TIMES[mode]) * 100);

  const availableTasks = tasks.filter((t) => !t.is_completed);

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none">
      {/* Floating Collapsed Pill */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2.5 bg-white border border-slate-200/90 rounded-full px-3.5 py-2 shadow-lg hover:shadow-xl hover:border-slate-300 transition-all group"
        >
          <div className="w-6 h-6 rounded-full overflow-hidden bg-emerald-950 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                {mode === 'pomodoro' ? 'Tập trung' : 'Giải lao'}
              </span>
              {isRunning && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <div className="text-xs font-bold text-slate-900 font-mono leading-none mt-0.5">
              {timeFormatted}
            </div>
          </div>

          <div className="p-0.5 rounded-full text-slate-400 group-hover:text-slate-700 transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
          </div>
        </button>
      ) : (
        /* Expanded Floating Widget */
        <div className="w-80 bg-white border border-slate-200 rounded-xl p-4 shadow-xl space-y-3.5 animate-in slide-in-from-bottom-3 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-900">Đồng hồ Pomodoro</span>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => changeMode('pomodoro')}
              className={`py-1.5 rounded-md transition-all ${
                mode === 'pomodoro'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              25p Làm việc
            </button>
            <button
              onClick={() => changeMode('shortBreak')}
              className={`py-1.5 rounded-md transition-all ${
                mode === 'shortBreak'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              5p Nghỉ ngắn
            </button>
            <button
              onClick={() => changeMode('longBreak')}
              className={`py-1.5 rounded-md transition-all ${
                mode === 'longBreak'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              15p Nghỉ dài
            </button>
          </div>

          {/* Big Time Display */}
          <div className="text-center py-1">
            <div className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {timeFormatted}
            </div>
            <div className="w-full bg-slate-100 h-1 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Task Link Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Timer className="w-3 h-3 text-slate-400" />
              <span>Gắn với công việc:</span>
            </label>
            <select
              value={activeTask?.id || ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                const found = tasks.find((t) => t.id === id) || null;
                onSelectTask(found);
              }}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500"
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
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={resetTimer}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Đặt lại"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (!isRunning) completionHandledRef.current = false;
                if ('Notification' in window && Notification.permission === 'default') {
                  Notification.requestPermission();
                }
                setIsRunning(!isRunning);
              }}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
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
