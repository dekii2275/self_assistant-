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
  CheckCircle2,
  Coffee,
  Save,
  Plus,
  ListTodo,
  Repeat,
  Timer,
} from 'lucide-react';
import type { Task, Priority, TaskStatus, TaskUpdateInput, RecurrenceRule, Subtask } from '../types/task';

interface TaskDetailDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: TaskUpdateInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggle: (id: number) => Promise<void>;
  onAddSubtask: (taskId: number, title: string) => Promise<Subtask | void>;
  onToggleSubtask: (taskId: number, subtaskId: number) => Promise<Subtask | void>;
  onDeleteSubtask: (taskId: number, subtaskId: number) => Promise<void>;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onToggle,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('p3');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | ''>('');
  const [tags, setTags] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setEstimatedMinutes(task.estimated_minutes ?? '');
      setRecurrenceRule(task.recurrence_rule || '');
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
        description: description.trim() || null,
        priority,
        status,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
        recurrence_rule: (recurrenceRule as RecurrenceRule) || null,
        tags: tags.trim() || null,
      });
      onClose();
    } catch {
      alert('Không thể lưu công việc. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const created = await onAddSubtask(task.id, newSubtaskTitle.trim());
    if (created) setNewSubtaskTitle('');
  };

  const priorityItems: {
    value: Priority;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { value: 'p1', label: 'P1 Khẩn cấp', icon: Flame },
    { value: 'p2', label: 'P2 Quan trọng', icon: AlertTriangle },
    { value: 'p3', label: 'P3 Tiêu chuẩn', icon: CheckCircle2 },
    { value: 'p4', label: 'P4 Việc nhẹ', icon: Coffee },
  ];

  const subtasks = task.subtasks || [];
  const subtasksTotal = subtasks.length;
  const subtasksDone = subtasks.filter((s) => s.is_completed).length;
  const subtasksPercent = subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onToggle(task.id)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  task.is_completed
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 hover:border-emerald-600 bg-white'
                }`}
                title={task.is_completed ? 'Đánh dấu chưa xong' : 'Đánh dấu đã hoàn thành'}
              >
                {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
              <span className="text-xs font-mono font-semibold text-slate-500">
                #TASK-{task.id}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (confirm('Bạn chắc chắn muốn xóa nhiệm vụ này?')) {
                    onDelete(task.id);
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Xóa công việc"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Tên công việc
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Ghi chú & Chi tiết
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Ghi chú chi tiết, tài liệu tham khảo..."
                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all leading-relaxed font-normal"
              />
            </div>

            {/* Subtasks Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-slate-500" />
                  <span>Các bước thực hiện ({subtasksDone}/{subtasksTotal})</span>
                </label>
                {subtasksTotal > 0 && (
                  <span className="text-xs font-semibold text-emerald-600">{subtasksPercent}%</span>
                )}
              </div>

              {subtasksTotal > 0 && (
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${subtasksPercent}%` }}
                  />
                </div>
              )}

              {/* Subtasks List */}
              <div className="space-y-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 group text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleSubtask(task.id, st.id)}
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                        st.is_completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-emerald-600 bg-white'
                      }`}
                    >
                      {st.is_completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </button>

                    <span
                      className={`flex-1 text-xs font-medium ${
                        st.is_completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-800'
                      }`}
                    >
                      {st.title}
                    </span>

                    <button
                      type="button"
                      onClick={() => onDeleteSubtask(task.id, st.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 rounded transition-all"
                      title="Xóa bước này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add subtask input */}
              <form onSubmit={handleCreateSubtask} className="flex items-center gap-1.5 pt-0.5">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="+ Thêm bước mới... (Nhấn Enter)"
                  className="flex-1 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim()}
                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </form>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Độ ưu tiên
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {priorityItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = priority === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPriority(item.value)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recurrence Rule */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-slate-500" />
                <span>Lặp lại</span>
              </label>
              <select
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value as RecurrenceRule | '')}
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
              >
                <option value="">Không lặp lại</option>
                <option value="daily">Mỗi ngày</option>
                <option value="weekdays">Thứ 2 đến Thứ 6</option>
                <option value="weekly">Mỗi tuần</option>
                <option value="monthly">Mỗi tháng</option>
              </select>
            </div>

            {/* Timing row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hạn chót</span>
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ước tính (phút)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="5"
                  value={estimatedMinutes}
                  onChange={(e) =>
                    setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')
                  }
                  placeholder="25"
                  className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Thẻ nhãn (tags)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="work, personal, study..."
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Focus time logged badge */}
            {task.actual_minutes > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center gap-2 text-xs text-emerald-900 font-medium">
                <Timer className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thời gian đã tập trung: <strong className="font-bold">{task.actual_minutes} phút</strong></span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              Cập nhật: {new Date(task.updated_at).toLocaleTimeString('vi-VN')}
            </span>
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-2xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
