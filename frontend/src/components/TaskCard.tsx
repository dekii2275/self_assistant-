import React from 'react';
import {
  Check,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  Edit3,
  AlignLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Task, Priority } from '../types/task';

interface TaskCardProps {
  task: Task;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onEdit: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete, onEdit }) => {
  const priorityStyles: Record<
    Priority,
    { border: string; badge: string; label: string; dot: string }
  > = {
    p1: {
      border: 'border-l-rose-500',
      badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
      label: 'P1 Khẩn cấp',
      dot: 'bg-rose-500',
    },
    p2: {
      border: 'border-l-amber-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
      label: 'P2 Quan trọng',
      dot: 'bg-amber-500',
    },
    p3: {
      border: 'border-l-blue-500',
      badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
      label: 'P3 Tiêu chuẩn',
      dot: 'bg-blue-500',
    },
    p4: {
      border: 'border-l-slate-400',
      badge: 'bg-slate-100 text-slate-600 border-slate-200',
      label: 'P4 Thấp',
      dot: 'bg-slate-400',
    },
  };

  const style = priorityStyles[task.priority] || priorityStyles.p3;

  // Format Due Date
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

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.is_completed) {
      // Fire confetti celebration on task completion
      confetti({
        particleCount: 30,
        spread: 50,
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
      className={`group relative bg-white rounded-2xl border border-slate-200/80 border-l-4 ${
        task.is_completed ? 'border-l-slate-300 opacity-60 bg-slate-50/50' : style.border
      } p-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer select-none`}
    >
      <div className="flex items-start gap-3.5">
        {/* Animated Checkbox */}
        <button
          type="button"
          onClick={handleToggleClick}
          className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
            task.is_completed
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs animate-check-pop'
              : 'border-slate-300 hover:border-indigo-500 hover:scale-105 bg-white'
          }`}
          title={task.is_completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã xong'}
        >
          {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-semibold tracking-tight transition-all leading-snug ${
                task.is_completed
                  ? 'line-through text-slate-400'
                  : 'text-slate-800 group-hover:text-indigo-600'
              }`}
            >
              {task.title}
            </span>

            {/* Priority Tag */}
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              <span>{style.label}</span>
            </span>

            {/* Due Date Badge */}
            {dueInfo && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                  dueInfo.isOverdue
                    ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                    : dueInfo.isToday
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {dueInfo.isOverdue ? (
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                ) : (
                  <Calendar className="w-3 h-3 text-slate-400" />
                )}
                <span>{dueInfo.label}</span>
              </span>
            )}

            {/* Estimated Minutes */}
            {task.estimated_minutes && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{task.estimated_minutes}p</span>
              </span>
            )}
          </div>

          {/* Description Snippet */}
          {task.description && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed flex items-start gap-1">
              <AlignLeft className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
              <span>{task.description}</span>
            </p>
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
                    className="text-[10px] font-medium text-indigo-600 bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Hover Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Chỉnh sửa chi tiết"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDeleteClick}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Xóa công việc"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
