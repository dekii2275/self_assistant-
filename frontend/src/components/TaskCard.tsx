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
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      label: 'P3 Tiêu chuẩn',
      dot: 'bg-emerald-600',
    },
    p4: {
      border: 'border-l-slate-300',
      badge: 'bg-stone-50 text-stone-600 border-stone-200',
      label: 'P4 Việc nhẹ',
      dot: 'bg-slate-400',
    },
  };

  const style = priorityStyles[task.priority] || priorityStyles.p3;

  const recurrenceLabels: Record<string, string> = {
    daily: 'Hằng ngày',
    weekdays: 'T2 - T6',
    weekly: 'Hằng tuần',
    monthly: 'Hằng tháng',
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
        particleCount: 25,
        spread: 50,
        colors: ['#10b981', '#059669', '#3b82f6', '#f59e0b'],
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
      className={`group relative bg-white rounded-xl border border-slate-200/90 border-l-[3.5px] ${
        task.is_completed
          ? 'border-l-slate-300 opacity-65 bg-slate-50/50'
          : style.border
      } p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all duration-150 cursor-pointer select-none`}
    >
      <div className="flex items-start gap-3">
        {/* Modern Checkbox */}
        <button
          type="button"
          onClick={handleToggleClick}
          className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
            task.is_completed
              ? 'bg-emerald-600 border-emerald-600 text-white animate-check-pop'
              : 'border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/30 bg-white'
          }`}
          title={task.is_completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
        >
          {task.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-semibold tracking-tight transition-all leading-snug ${
                task.is_completed
                  ? 'line-through text-slate-400'
                  : 'text-slate-900 group-hover:text-emerald-800'
              }`}
            >
              {task.title}
            </span>

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${style.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              <span>{style.label}</span>
            </span>

            {/* Recurrence Rule */}
            {task.recurrence_rule && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                <Repeat className="w-3 h-3 text-teal-600" />
                <span>{recurrenceLabels[task.recurrence_rule] || task.recurrence_rule}</span>
              </span>
            )}

            {/* Due Date */}
            {dueInfo && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                  dueInfo.isOverdue
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : dueInfo.isToday
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {dueInfo.isOverdue ? (
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                ) : (
                  <Calendar className="w-3 h-3 text-slate-500" />
                )}
                <span>{dueInfo.label}</span>
              </span>
            )}

            {/* Estimated vs Actual Time */}
            {task.estimated_minutes && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{task.estimated_minutes}p</span>
              </span>
            )}

            {task.actual_minutes > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                <Timer className="w-3 h-3 text-emerald-600" />
                <span>Đã làm: {task.actual_minutes}p</span>
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed flex items-start gap-1 font-normal">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span>{task.description}</span>
            </p>
          )}

          {/* Subtasks Progress Bar & Count if any */}
          {subtasksTotal > 0 && (
            <div className="mt-2 flex items-center gap-2 max-w-xs">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <ListTodo className="w-3 h-3 text-slate-400" />
                <span>
                  {subtasksCompleted}/{subtasksTotal} bước ({subtasksPercent}%)
                </span>
              </span>
              <div className="flex-1 bg-slate-100 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${subtasksPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {task.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md"
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
              className="p-1.5 rounded-md text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors flex items-center gap-1 text-[11px] font-semibold"
              title="Bắt đầu Pomodoro tập trung vào việc này"
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
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Chỉnh sửa chi tiết"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDeleteClick}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Xóa công việc"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
