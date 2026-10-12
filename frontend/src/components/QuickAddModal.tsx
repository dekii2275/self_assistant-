import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Flame,
  AlertTriangle,
  Info,
  Coffee,
  Calendar,
  Clock,
  Tag,
  AlignLeft,
} from 'lucide-react';
import type { Priority, TaskCreateInput } from '../types/task';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: TaskCreateInput) => Promise<void>;
  defaultPriority?: Priority;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  defaultPriority = 'p3',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setPriority(defaultPriority);
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setEstimatedMinutes('');
      setTags('');
    }
  }, [isOpen, defaultPriority]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        tags: tags.trim() || undefined,
        status: 'todo',
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const setQuickDate = (daysFromNow: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    target.setHours(18, 0, 0, 0); // Default to 6:00 PM
    const localIso = new Date(target.getTime() - target.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDueDate(localIso);
  };

  const priorityItems: {
    value: Priority;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    classActive: string;
    classInactive: string;
  }[] = [
    {
      value: 'p1',
      label: 'P1 Khẩn cấp',
      icon: Flame,
      classActive: 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-200/50',
      classInactive: 'border-slate-200 text-slate-600 hover:border-slate-300',
    },
    {
      value: 'p2',
      label: 'P2 Quan trọng',
      icon: AlertTriangle,
      classActive: 'bg-amber-50 border-amber-300 text-amber-700 ring-2 ring-amber-200/50',
      classInactive: 'border-slate-200 text-slate-600 hover:border-slate-300',
    },
    {
      value: 'p3',
      label: 'P3 Tiêu chuẩn',
      icon: Info,
      classActive: 'bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-200/50',
      classInactive: 'border-slate-200 text-slate-600 hover:border-slate-300',
    },
    {
      value: 'p4',
      label: 'P4 Thấp',
      icon: Coffee,
      classActive: 'bg-slate-100 border-slate-300 text-slate-700 ring-2 ring-slate-200/50',
      classInactive: 'border-slate-200 text-slate-600 hover:border-slate-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Tạo công việc mới</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Title Input */}
            <div>
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tiêu đề việc cần làm..."
                className="w-full text-base sm:text-lg font-bold text-slate-900 placeholder-slate-400 bg-transparent border-0 outline-none"
              />
            </div>

            {/* Description Area */}
            <div className="flex items-start gap-2 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 focus-within:bg-white focus-within:border-indigo-300 transition-all">
              <AlignLeft className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú chi tiết, dàn ý hoặc các checklist con..."
                rows={3}
                className="w-full text-xs sm:text-sm text-slate-700 placeholder-slate-400 bg-transparent border-0 outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Độ ưu tiên
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {priorityItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = priority === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPriority(item.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected ? item.classActive : item.classInactive
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timing & Tags Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Hạn chót</span>
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-indigo-300"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    className="text-[10px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                  >
                    Hôm nay
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    className="text-[10px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                  >
                    Ngày mai
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(3)}
                    className="text-[10px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                  >
                    +3 ngày
                  </button>
                </div>
              </div>

              {/* Estimated Minutes & Tags */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Thời gian ước tính (phút)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="5"
                      value={estimatedMinutes}
                      onChange={(e) =>
                        setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')
                      }
                      placeholder="vd: 25"
                      className="w-24 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-indigo-300"
                    />
                    <div className="flex items-center gap-1">
                      {[15, 25, 45].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setEstimatedMinutes(m)}
                          className="text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
                        >
                          {m}p
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Thẻ nhãn (tags)</span>
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="congviec, hoc-tap, ca-nhan..."
                    className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-indigo-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Mẹo: Nhấn <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono text-[10px]">Enter</kbd> để tạo nhanh
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Thêm việc</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
