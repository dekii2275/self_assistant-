import React, { useState } from 'react';
import { Check, Trash2, Calendar, Clock, Tag, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { Task, Priority } from '../types/task';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const priorityBadges: Record<Priority, { label: string; class: string }> = {
    p1: { label: 'P1 Khẩn cấp', class: 'bg-rose-100 text-rose-700 border-rose-200' },
    p2: { label: 'P2 Quan trọng', class: 'bg-amber-100 text-amber-700 border-amber-200' },
    p3: { label: 'P3 Tiêu chuẩn', class: 'bg-blue-100 text-blue-700 border-blue-200' },
    p4: { label: 'P4 Thấp', class: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const isOverdue = date.getTime() < Date.now() && !task.is_completed;
    const formatted = date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    return { formatted, isOverdue };
  };

  const dueDateInfo = formatDueDate(task.due_date);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    setIsDeleting(true);
    await onDelete(task.id);
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-200 ${
        task.is_completed
          ? 'border-slate-200/60 bg-slate-50/50 opacity-75'
          : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm'
      }`}
    >
      <div className="p-3.5 flex items-start gap-3">
        {/* Toggle Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
            task.is_completed
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
              : 'border-slate-300 hover:border-indigo-500 bg-white'
          }`}
          title={task.is_completed ? 'Đánh dấu chưa xong' : 'Đánh dấu đã hoàn thành'}
        >
          {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-semibold tracking-tight transition-all ${
                task.is_completed
                  ? 'line-through text-slate-400'
                  : 'text-slate-800 group-hover:text-slate-900'
              }`}
            >
              {task.title}
            </span>

            {/* Priority Tag */}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                priorityBadges[task.priority]?.class || 'bg-slate-100 text-slate-600'
              }`}
            >
              {priorityBadges[task.priority]?.label || task.priority}
            </span>

            {/* Due Date badge */}
            {dueDateInfo && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${
                  dueDateInfo.isOverdue
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {dueDateInfo.isOverdue ? (
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                ) : (
                  <Calendar className="w-3 h-3 text-slate-400" />
                )}
                <span>{dueDateInfo.formatted}</span>
              </span>
            )}

            {/* Estimated Minutes */}
            {task.estimated_minutes && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{task.estimated_minutes}p</span>
              </span>
            )}
          </div>

          {/* Description snippet if any */}
          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {task.tags.split(',').map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {task.description && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Xem chi tiết"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
            title="Xóa công việc"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full details expanded */}
      {showDetails && task.description && (
        <div className="px-10 pb-3 pt-1 border-t border-slate-100 text-xs text-slate-600 whitespace-pre-wrap">
          {task.description}
        </div>
      )}
    </div>
  );
};
