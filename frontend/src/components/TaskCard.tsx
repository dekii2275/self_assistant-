import React from 'react';
import {
  Check,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  Edit3,
  AlignLeft,
  ListTodo,
  Repeat,
  Timer,
  Play,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Task, Priority } from '../types/task';

interface TaskCardProps {
  task: Task;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onEdit: (task: Task) => void;
  onStartPomodoro?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggle,
  onDelete,
  onEdit,
  onStartPomodoro,
}) => {
  const priorityStyles: Record<
    Priority,
    { border: string; badge: string; label: string; dot: string }
  > = {
    p1: {
      border: 'border-l-rose-500',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      label: 'P1 Khẩn cấp',
      dot: 'bg-rose-500',
    },
    p2: {
      border: 'border-l-amber-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'P2 Quan trọng',
      dot: 'bg-amber-500',
    },
    p3: {
      border: 'border-l-emerald-600',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      label: 'P3 Tiêu chuẩn',
      dot: 'bg-emerald-600',
    },
    p4: {
      border: 'border-l-stone-400',
      badge: 'bg-stone-100 text-stone-700 border-stone-200',
      label: 'P4 Việc nhẹ',
      dot: 'bg-stone-400',
    },
  };

  const style = priorityStyles[task.priority] || priorityStyles.p3;

  const recurrenceLabels: Record<string, string> = {
    daily: 'Mỗi ngày',
    weekdays: 'T2 - T6',
    weekly: 'Mỗi tuần',
    monthly: 'Mỗi tháng',
  };

  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const isOverdue = date.getTime() < now.getTime() && !task.is_completed;

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const formattedTime = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    let label = `${formattedDate} ${formattedTime}`;
    if (isToday) label = `Hôm nay ${formattedTime}`;

    return { label, isOverdue, isToday };
  };

  const dueInfo = formatDueDate(task.due_date);

  // Subtask progress
  const subtasksTotal = task.subtasks?.length || 0;
  const subtasksCompleted = task.subtasks?.filter((st) => st.is_completed).length || 0;
  const subtasksPercent =
    subtasksTotal > 0 ? Math.round((subtasksCompleted / subtasksTotal) * 100) : 0;

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.is_completed) {
      confetti({
        particleCount: 35,
        spread: 60,
        colors: ['#10b981', '#059669', '#f59e0b', '#34d399', '#84cc16', '#d97706'],
        origin: {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        },
      });
    }
    onToggle(task.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc muốn xóa công việc "${task.title}"?`)) {
      onDelete(task.id);
    }
  };

  return (
    <div
      onClick={() => onEdit(task)}
      className={`group relative bg-white rounded-3xl border border-emerald-100/90 border-l-[5px] ${
        task.is_completed
          ? 'border-l-emerald-200 opacity-60 bg-emerald-50/20'
          : style.border
      } p-4 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 cursor-pointer select-none`}
    >
      <div className="flex items-start gap-3.5">
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleToggleClick}
          className={`mt-0.5 w-5 h-5 rounded-xl border-2 flex items-center justify-center transition-all ${
            task.is_completed
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs animate-check-pop'
              : 'border-emerald-300 hover:border-emerald-600 hover:scale-105 bg-white'
          }`}
          title={task.is_completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
        >
          {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-bold tracking-tight transition-all leading-snug ${
                task.is_completed
                  ? 'line-through text-slate-400'
                  : 'text-emerald-950 group-hover:text-emerald-700'
              }`}
            >
              {task.title}
            </span>

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${style.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              <span>{style.label}</span>
            </span>

            {/* Recurrence Rule */}
            {task.recurrence_rule && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                <Repeat className="w-3 h-3 text-teal-600" />
                <span>{recurrenceLabels[task.recurrence_rule] || task.recurrence_rule}</span>
              </span>
            )}

            {/* Due Date */}
            {dueInfo && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                  dueInfo.isOverdue
                    ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                    : dueInfo.isToday
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {dueInfo.isOverdue ? (
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                ) : (
                  <Calendar className="w-3 h-3 text-emerald-600/70" />
                )}
                <span>{dueInfo.label}</span>
              </span>
            )}

            {/* Estimated vs Actual Time */}
            {task.estimated_minutes && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-50/70 border border-emerald-200/60 text-emerald-800 font-semibold">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>{task.estimated_minutes}p</span>
              </span>
            )}

            {task.actual_minutes > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                <Timer className="w-3 h-3 text-amber-600" />
                <span>Đã tập trung: {task.actual_minutes}p</span>
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-emerald-900/70 mt-1.5 line-clamp-2 leading-relaxed flex items-start gap-1 font-medium">
              <AlignLeft className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
              <span>{task.description}</span>
            </p>
          )}

          {/* Subtasks Progress Bar & Count if any */}
          {subtasksTotal > 0 && (
            <div className="mt-2.5 flex items-center gap-2 max-w-xs">
              <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                <ListTodo className="w-3 h-3 text-emerald-600" />
                <span>
                  {subtasksCompleted}/{subtasksTotal} bước ({subtasksPercent}%)
                </span>
              </span>
              <div className="flex-1 bg-emerald-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${subtasksPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && (
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              {task.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200/80 px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Hover Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Quick Focus Button */}
          {onStartPomodoro && !task.is_completed && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartPomodoro(task);
              }}
              className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 transition-colors flex items-center gap-1 text-[10px] font-extrabold"
              title="Bắt đầu phiên Pomodoro tập trung vào việc này"
            >
              <Play className="w-3 h-3 fill-emerald-600 text-emerald-600" />
              <span className="hidden sm:inline">Tập trung</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1.5 rounded-lg text-emerald-700/60 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
            title="Chỉnh sửa chi tiết"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDeleteClick}
            className="p-1.5 rounded-lg text-emerald-700/60 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Xóa công việc"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
