import React, { useState } from 'react';
import { Plus, SlidersHorizontal, Flame, AlertTriangle, Info, Coffee } from 'lucide-react';
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

  const priorityBadges: Record<Priority, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    p1: { label: 'P1', icon: Flame, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    p2: { label: 'P2', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    p3: { label: 'P3', icon: Info, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    p4: { label: 'P4', icon: Coffee, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  };

  const cyclePriority = () => {
    const list: Priority[] = ['p1', 'p2', 'p3', 'p4'];
    const idx = list.indexOf(priority);
    setPriority(list[(idx + 1) % list.length]);
  };

  const CurrentPriorityIcon = priorityBadges[priority].icon;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-2.5 transition-all focus-within:border-indigo-400 focus-within:shadow-md focus-within:ring-2 focus-within:ring-indigo-100">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="pl-2 text-indigo-600">
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thêm nhanh việc cần làm... (Nhấn Enter để lưu)"
          className="flex-1 text-sm font-semibold text-slate-800 placeholder-slate-400 bg-transparent border-0 outline-none px-1"
        />

        {/* Priority cycle pill */}
        <button
          type="button"
          onClick={cyclePriority}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${priorityBadges[priority].color}`}
          title="Bấm để đổi độ ưu tiên"
        >
          <CurrentPriorityIcon className="w-3.5 h-3.5" />
          <span>{priorityBadges[priority].label}</span>
        </button>

        {/* Open Detailed Modal button */}
        <button
          type="button"
          onClick={onOpenDetailedModal}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          title="Mở thêm chi tiết (Hạn chót, thời gian, tags...)"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Submit */}
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-xs shadow-indigo-600/20"
        >
          Thêm
        </button>
      </form>
    </div>
  );
};
