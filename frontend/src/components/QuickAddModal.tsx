import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Coffee,
  Calendar,
  Clock,
  Tag,
  AlignLeft,
  Repeat,
} from 'lucide-react';
import type { Priority, TaskCreateInput, RecurrenceRule, ReminderMinutes } from '../types/task';
import { prepareTaskText } from '../utils/taskDraft';
import { ReminderField } from './ReminderField';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: TaskCreateInput) => Promise<void>;
  defaultPriority?: Priority;
  defaultDueDate?: string;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  defaultPriority = 'p3',
  defaultDueDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | ''>('');
  const [reminderMinutes, setReminderMinutes] = useState<ReminderMinutes | null>(null);
  const [reminderEmail, setReminderEmail] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setFormError(null);
      setPriority(defaultPriority);
      if (defaultDueDate) {
        setDueDate(defaultDueDate.slice(0, 16));
      }
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setEstimatedMinutes('');
      setRecurrenceRule('');
      setReminderMinutes(null);
      setReminderEmail('');
      setTags('');
    }
  }, [isOpen, defaultPriority, defaultDueDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    const taskText = prepareTaskText(title, description);
    if (!taskText) {
      setFormError('Vui lòng nhập tên hoặc mô tả công việc.');
      inputRef.current?.focus();
      return;
    }
    if (reminderEmail.trim() && !reminderMinutes) {
      setFormError('Chọn thời điểm nhắc trước khi nhập email.');
      return;
    }

    try {
      setFormError(null);
      setIsSubmitting(true);
      await onAddTask({
        ...taskText,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        recurrence_rule: (recurrenceRule as RecurrenceRule) || null,
        reminder_minutes_before: reminderMinutes,
        email_reminder_to: reminderEmail.trim() || null,
        tags: tags.trim() || undefined,
        status: 'todo',
      });
      onClose();
    } catch {
      setFormError('Không thể tạo nhiệm vụ. Vui lòng kiểm tra kết nối Backend và thử lại.');
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
      classActive: 'bg-rose-50 border-rose-300 text-rose-700 ring-1 ring-rose-200',
      classInactive: 'border-slate-200 text-slate-600 hover:border-slate-300',
    },
    {
      value: 'p2',
      label: 'P2 Quan trọng',
      icon: AlertTriangle,
      classActive: 'bg-amber-50 border-amber-300 text-amber-700 ring-1 ring-amber-200',
      classInactive: 'border-slate-200 text-slate-600 hover:border-slate-300',
    },
    {
      value: 'p3',
      label: 'P3 Tiêu chuẩn',
      icon: CheckCircle2,
      classActive: 'bg-slate-100 border-slate-300 text-slate-800 ring-1 ring-slate-200',
      classInactive: 'border-slate-200 text-slate-600 hover:border-slate-300',
    },
    {
      value: 'p4',
      label: 'P4 Việc nhẹ',
      icon: Coffee,
      classActive: 'bg-stone-50 border-stone-300 text-stone-700 ring-1 ring-stone-200',
      classInactive: 'border-slate-200 text-slate-600 hover:border-slate-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 z-10 animate-in zoom-in-95 duration-150">
        <form onSubmit={handleSubmit} onKeyDown={(event) => {
          if (!(event.target instanceof HTMLButtonElement) && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            void handleSubmit();
          }
        }}>
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-2xs">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Tạo công việc mới</h3>
                <p className="text-[11px] text-slate-500 font-normal">Thêm nhiệm vụ vào lịch trình làm việc</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-3.5">
            {/* Title */}
            <div className="space-y-1">
              <label htmlFor="new-task-title" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Tên công việc
              </label>
              <input
                id="new-task-title"
                ref={inputRef}
                type="text"
                maxLength={255}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="Ví dụ: Soạn tài liệu thuyết trình quý 3"
                aria-invalid={Boolean(formError)}
                aria-describedby={formError ? 'new-task-error' : undefined}
                className={`w-full px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 bg-white border rounded-lg outline-none focus:ring-1 ${formError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'}`}
              />
              {formError && <p id="new-task-error" role="alert" className="text-xs text-rose-600 mt-1">{formError}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label htmlFor="new-task-description" className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <AlignLeft className="w-3 h-3" />
                <span>Mô tả</span>
                <span className="font-normal normal-case text-slate-400">(tùy chọn)</span>
              </label>
              <textarea
                id="new-task-description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="Ghi chú thêm chi tiết công việc..."
                rows={2}
                className="w-full px-3 py-2 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 resize-y leading-relaxed"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
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
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Hạn chót</span>
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (!e.target.value) {
                      setReminderMinutes(null);
                      setReminderEmail('');
                    }
                  }}
                  className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                  >
                    Hôm nay
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                  >
                    Ngày mai
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(3)}
                    className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                  >
                    +3 ngày
                  </button>
                </div>
              </div>

              {/* Estimated & Tags */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Dự kiến (phút)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      step="5"
                      value={estimatedMinutes}
                      onChange={(e) =>
                        setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')
                      }
                      placeholder="vd: 25"
                      className="w-20 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-500"
                    />
                    <div className="flex items-center gap-1">
                      {[15, 25, 45].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setEstimatedMinutes(m)}
                          className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-1 rounded transition-colors"
                        >
                          {m}p
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <Repeat className="w-3 h-3 text-slate-400" />
                    <span>Lặp lại</span>
                  </label>
                  <select
                    value={recurrenceRule}
                    onChange={(e) => setRecurrenceRule(e.target.value as RecurrenceRule | '')}
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-500"
                  >
                    <option value="">Không lặp</option>
                    <option value="daily">Hằng ngày</option>
                    <option value="weekdays">Thứ 2 - Thứ 6</option>
                    <option value="weekly">Hằng tuần</option>
                    <option value="monthly">Hằng tháng</option>
                  </select>
                </div>
              </div>
            </div>

            <ReminderField
              id="new-task-reminder"
              dueDate={dueDate}
              value={reminderMinutes}
              onChange={setReminderMinutes}
              email={reminderEmail}
              onEmailChange={setReminderEmail}
            />

            {/* Tags */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Thẻ nhãn (tags)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="toan, tienganh, mindmap (ngăn cách bởi dấu phẩy)..."
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Nhấn <kbd className="px-1 py-0.5 bg-slate-200/80 rounded text-slate-700 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-slate-200/80 rounded text-slate-700 font-mono text-[10px]">Enter</kbd> để tạo nhanh
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Tạo công việc</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
