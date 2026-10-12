import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Check,
  Flame,
  AlertTriangle,
  Leaf,
  Coffee,
  Save,
} from 'lucide-react';
import type { Task, Priority, TaskStatus, TaskUpdateInput } from '../types/task';

interface TaskDetailDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: TaskUpdateInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggle: (id: number) => Promise<void>;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onToggle,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('p3');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setEstimatedMinutes(task.estimated_minutes ?? '');
      setTags(task.tags || '');

      if (task.due_date) {
        const d = new Date(task.due_date);
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDueDate(localIso);
      } else {
        setDueDate('');
      }
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    if (!title.trim() || isSaving) return;
    try {
      setIsSaving(true);
      await onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        tags: tags.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const priorityItems: {
    value: Priority;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { value: 'p1', label: 'P1 Khẩn cấp', icon: Flame },
    { value: 'p2', label: 'P2 Quan trọng', icon: AlertTriangle },
    { value: 'p3', label: 'P3 Tiêu chuẩn', icon: Leaf },
    { value: 'p4', label: 'P4 Việc nhẹ', icon: Coffee },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-emerald-950/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-emerald-100 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onToggle(task.id)}
                className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                  task.is_completed
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-emerald-300 hover:border-emerald-600 bg-white'
                }`}
                title={task.is_completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã xong'}
              >
                {task.is_completed && <Check className="w-4 h-4 stroke-[3]" />}
              </button>
              <span className="text-xs font-mono font-bold text-emerald-800/60">
                OTTER-{task.id}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (confirm('Bạn chắc chắn muốn xóa nhiệm vụ này?')) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                className="p-1.5 rounded-lg text-emerald-700/60 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Xóa công việc"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-emerald-700/60 hover:text-emerald-950 hover:bg-emerald-100/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-800/60 mb-1">
                Tiêu đề nhiệm vụ
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-base font-extrabold text-emerald-950 bg-emerald-50/50 border border-emerald-200 rounded-2xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-800/60 mb-1">
                Ghi chú & Chi tiết
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Ghi chú chi tiết, tài liệu..."
                className="w-full text-xs sm:text-sm text-emerald-950 bg-emerald-50/50 border border-emerald-200 rounded-2xl p-3.5 outline-none focus:bg-white focus:border-emerald-500 transition-all leading-relaxed font-medium"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-800/60 mb-1.5">
                Độ ưu tiên
              </label>
              <div className="grid grid-cols-2 gap-2">
                {priorityItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = priority === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPriority(item.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-emerald-100/90 border-emerald-400 text-emerald-900 font-extrabold shadow-2xs'
                          : 'border-emerald-200 text-emerald-800/70 hover:border-emerald-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-800/60 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hạn chót</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs font-medium text-emerald-950 bg-emerald-50/50 border border-emerald-200 rounded-2xl px-3 py-2.5 outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>

            {/* Estimated Minutes */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-800/60 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Thời gian ước tính (phút)</span>
              </label>
              <input
                type="number"
                min="1"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')}
                placeholder="25"
                className="w-full text-xs font-medium text-emerald-950 bg-emerald-50/50 border border-emerald-200 rounded-2xl px-3 py-2.5 outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-800/60 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Thẻ rừng xanh (tags)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="work, personal, study..."
                className="w-full text-xs font-medium text-emerald-950 bg-emerald-50/50 border border-emerald-200 rounded-2xl px-3 py-2.5 outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-emerald-100 bg-emerald-50/40 flex items-center justify-between">
            <span className="text-[11px] text-emerald-800/60 font-medium">
              Cập nhật: {new Date(task.updated_at).toLocaleTimeString('vi-VN')}
            </span>
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu nhiệm vụ'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
