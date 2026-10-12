import React, { useState } from 'react';
import { Plus, SlidersHorizontal, Flame, AlertTriangle, Leaf, Coffee } from 'lucide-react';
import type { Priority, TaskCreateInput } from '../types/task';

interface TaskInputProps {
  onAddTask: (task: TaskCreateInput) => Promise<void>;
  onOpenDetailedModal: () => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, onOpenDetailedModal }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('p3');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddTask({
        title: title.trim(),
        priority,
        status: 'todo',
      });
      setTitle('');
      setPriority('p3');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityBadges: Record<
    Priority,
    { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
  > = {
    p1: { label: 'P1 Khẩn cấp', icon: Flame, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    p2: { label: 'P2 Quan trọng', icon: AlertTriangle, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    p3: { label: 'P3 Tiêu chuẩn', icon: Leaf, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    p4: { label: 'P4 Việc nhẹ', icon: Coffee, color: 'text-stone-700 bg-stone-100 border-stone-200' },
  };

  const cyclePriority = () => {
    const list: Priority[] = ['p1', 'p2', 'p3', 'p4'];
    const idx = list.indexOf(priority);
    setPriority(list[(idx + 1) % list.length]);
  };

  const CurrentPriorityIcon = priorityBadges[priority].icon;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-emerald-200/90 p-2.5 transition-all focus-within:border-emerald-500 focus-within:shadow-md focus-within:ring-3 focus-within:ring-emerald-200/50">
      <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
        <div className="pl-2.5 text-emerald-600">
          <Plus className="w-5 h-5 stroke-[3]" />
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thêm nhiệm vụ mới cho bé Rái Cá... (Nhấn Enter để lưu)"
          className="flex-1 text-sm font-bold text-emerald-950 placeholder-emerald-800/40 bg-transparent border-0 outline-none px-1"
        />

        {/* Priority cycle badge */}
        <button
          type="button"
          onClick={cyclePriority}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${priorityBadges[priority].color}`}
          title="Bấm để đổi độ ưu tiên"
        >
          <CurrentPriorityIcon className="w-3.5 h-3.5" />
          <span>{priorityBadges[priority].label}</span>
        </button>

        {/* Full Modal button */}
        <button
          type="button"
          onClick={onOpenDetailedModal}
          className="p-2 text-emerald-700/60 hover:text-emerald-800 rounded-xl hover:bg-emerald-50 transition-colors"
          title="Thêm chi tiết (hạn chót, thời gian, tags...)"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Submit */}
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs transition-all disabled:opacity-40 disabled:pointer-events-none shadow-xs shadow-emerald-700/20"
        >
          Thêm
        </button>
      </form>
    </div>
  );
};
