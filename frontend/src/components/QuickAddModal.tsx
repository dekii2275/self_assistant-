import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Flame,
  AlertTriangle,
  Leaf,
  Coffee,
  Calendar,
  Clock,
  Tag,
  AlignLeft,
} from 'lucide-react';
import type { Priority, TaskCreateInput, RecurrenceRule } from '../types/task';
import { Repeat } from 'lucide-react';

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
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | ''>('');
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
        recurrence_rule: (recurrenceRule as RecurrenceRule) || null,
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
    target.setHours(18, 0, 0, 0);
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
      icon: Leaf,
      classActive: 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-200/50',
      classInactive: 'border-slate-200 text-slate-600 hover:border-slate-300',
    },
    {
      value: 'p4',
      label: 'P4 Việc nhẹ',
      icon: Coffee,
      classActive: 'bg-stone-100 border-stone-300 text-stone-700 ring-2 ring-stone-200/50',
      classInactive: 'border-slate-200 text-slate-600 hover:border-slate-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-emerald-950/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-950">Giao việc cho bé Rái Cá</h3>
                <p className="text-[10px] text-emerald-800/70 font-medium">Tạo nhiệm vụ mới trong khu rừng</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-emerald-700/60 hover:text-emerald-900 hover:bg-emerald-100/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Title */}
            <div>
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tiêu đề việc cần làm..."
                className="w-full text-base sm:text-lg font-black text-emerald-950 placeholder-emerald-800/30 bg-transparent border-0 outline-none"
              />
            </div>

            {/* Description */}
            <div className="flex items-start gap-2 bg-emerald-50/40 border border-emerald-200/70 rounded-2xl p-3 focus-within:bg-white focus-within:border-emerald-500 transition-all">
              <AlignLeft className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú chi tiết hoặc các bước thực hiện..."
                rows={3}
                className="w-full text-xs sm:text-sm text-emerald-950 placeholder-emerald-800/40 bg-transparent border-0 outline-none resize-none leading-relaxed font-medium"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-800/60 mb-2">
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
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
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

            {/* Timing & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-100">
              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-emerald-800/60 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hạn chót</span>
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs font-medium text-emerald-950 bg-emerald-50/50 border border-emerald-200 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-500"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition-colors"
                  >
                    Hôm nay
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition-colors"
                  >
                    Ngày mai
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(3)}
                    className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition-colors"
                  >
                    +3 ngày
                  </button>
                </div>
              </div>

              {/* Estimated & Tags */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-emerald-800/60 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
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
                      className="w-24 text-xs font-medium text-emerald-950 bg-emerald-50/50 border border-emerald-200 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-500"
                    />
                    <div className="flex items-center gap-1">
                      {[15, 25, 45].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setEstimatedMinutes(m)}
                          className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-md transition-colors"
                        >
                          {m}p
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-emerald-800/60 flex items-center gap-1">
                    <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lặp lại</span>
                  </label>
                  <select
                    value={recurrenceRule}
                    onChange={(e) => setRecurrenceRule(e.target.value as RecurrenceRule | '')}
                    className="w-full text-xs font-semibold text-emerald-950 bg-emerald-50/50 border border-emerald-200 rounded-xl px-2.5 py-2 outline-none focus:bg-white focus:border-emerald-500"
                  >
                    <option value="">Không lặp lại</option>
                    <option value="daily">Mỗi ngày</option>
                    <option value="weekdays">Thứ 2 - Thứ 6</option>
                    <option value="weekly">Mỗi tuần</option>
                    <option value="monthly">Mỗi tháng</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-emerald-800/60 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Thẻ rừng xanh (tags)</span>
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="rungxanh, duan, hoctap..."
                    className="w-full text-xs font-medium text-emerald-950 bg-emerald-50/50 border border-emerald-200 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-emerald-50/50 border-t border-emerald-100 flex items-center justify-between">
            <span className="text-[11px] text-emerald-800/60 font-medium hidden sm:inline">
              Mẹo: Nhấn <kbd className="px-1.5 py-0.5 bg-emerald-100 rounded text-emerald-900 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-emerald-100 rounded text-emerald-900 font-mono text-[10px]">Enter</kbd> để tạo nhanh
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 rounded-xl hover:bg-emerald-100/60 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs transition-all disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-emerald-700/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Thêm nhiệm vụ</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
