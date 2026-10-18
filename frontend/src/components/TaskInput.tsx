import React, { useState } from 'react';
import { Plus, SlidersHorizontal, Flame, AlertTriangle, CheckCircle2, Coffee } from 'lucide-react';
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
    } catch {
      alert('Không thể thêm công việc. Vui lòng kiểm tra kết nối Backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions: {
    id: Priority;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    activeClass: string;
  }[] = [
    { id: 'p1', label: 'P1 Gấp', icon: Flame, activeClass: 'bg-rose-50 border-rose-300 text-rose-700' },
    { id: 'p2', label: 'P2 Quan trọng', icon: AlertTriangle, activeClass: 'bg-amber-50 border-amber-300 text-amber-700' },
    { id: 'p3', label: 'P3 Chuẩn', icon: CheckCircle2, activeClass: 'bg-slate-100 border-slate-300 text-slate-800' },
    { id: 'p4', label: 'P4 Nhẹ', icon: Coffee, activeClass: 'bg-stone-50 border-stone-300 text-stone-600' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-2 transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="pl-2 text-slate-400">
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thêm công việc mới... (Nhấn Enter để lưu)"
          className="flex-1 text-xs font-medium text-slate-900 placeholder-slate-400 bg-transparent border-0 outline-none px-1"
        />

        {/* Priority quick select */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
          {priorityOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = priority === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPriority(opt.id)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                  isSelected
                    ? `${opt.activeClass} shadow-2xs`
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
                title={`Độ ưu tiên ${opt.label}`}
              >
                <Icon className="w-3 h-3" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Full Modal button */}
        <button
          type="button"
          onClick={onOpenDetailedModal}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          title="Mở bảng chi tiết (Hạn chót, dự kiến, nhãn...)"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors disabled:opacity-40 disabled:pointer-events-none shadow-2xs"
        >
          Thêm việc
        </button>
      </form>
    </div>
  );
};
