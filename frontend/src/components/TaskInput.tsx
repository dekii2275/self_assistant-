import React, { useState } from 'react';
import { Plus, Clock, Tag, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { Priority, TaskCreateInput } from '../types/task';

interface TaskInputProps {
  onAddTask: (task: TaskCreateInput) => Promise<void>;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('p3');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('');
  const [tags, setTags] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddTask({
        title: title.trim(),
        priority,
        description: description.trim() || undefined,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        tags: tags.trim() || undefined,
        status: 'todo',
      });

      // Reset
      setTitle('');
      setDescription('');
      setDueDate('');
      setEstimatedMinutes('');
      setTags('');
      setPriority('p3');
      setIsExpanded(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 'p1', label: 'P1 Khẩn cấp', color: 'text-rose-600 border-rose-200 bg-rose-50' },
    { value: 'p2', label: 'P2 Quan trọng', color: 'text-amber-600 border-amber-200 bg-amber-50' },
    { value: 'p3', label: 'P3 Tiêu chuẩn', color: 'text-blue-600 border-blue-200 bg-blue-50' },
    { value: 'p4', label: 'P4 Thấp', color: 'text-slate-600 border-slate-200 bg-slate-50' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 transition-all focus-within:shadow-md focus-within:border-indigo-300">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Thêm công việc mới... (Nhấn Enter để lưu)"
            className="flex-1 text-slate-800 placeholder-slate-400 font-medium bg-transparent border-0 outline-none px-2 py-1.5 text-base"
          />

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Thêm chi tiết (Mô tả, hạn chót, tags...)"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm</span>
          </button>
        </div>

        {/* Priority quick selector */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-400">Độ ưu tiên:</span>
          {priorityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPriority(opt.value)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                priority === opt.value
                  ? `${opt.color} ring-2 ring-indigo-400/20 font-semibold shadow-xs`
                  : 'text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Expanded options */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú chi tiết hoặc các bước thực hiện..."
                rows={2}
                className="w-full text-sm text-slate-700 placeholder-slate-400 bg-slate-50 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-400 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs text-slate-700 bg-transparent outline-none"
                  title="Hạn chót"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="number"
                  min="1"
                  step="5"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Thời gian (phút)"
                  className="w-full text-xs text-slate-700 bg-transparent outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Tags (cách nhau dấu phẩy)"
                  className="w-full text-xs text-slate-700 bg-transparent outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
