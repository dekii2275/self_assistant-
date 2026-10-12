import React from 'react';
import { Plus, Flame, AlertTriangle, Info, Coffee } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task, Priority } from '../types/task';

interface KanbanBoardProps {
  tasks: Task[];
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onEdit: (task: Task) => void;
  onQuickAddWithPriority: (priority: Priority) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onToggle,
  onDelete,
  onEdit,
  onQuickAddWithPriority,
}) => {
  const columns: {
    priority: Priority;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    bgHeader: string;
  }[] = [
    {
      priority: 'p1',
      title: 'P1 Khẩn cấp & Quan trọng',
      subtitle: 'Làm ngay trong ngày',
      icon: Flame,
      accentColor: 'text-rose-600',
      bgHeader: 'bg-rose-50 border-rose-200/80',
    },
    {
      priority: 'p2',
      title: 'P2 Quan trọng',
      subtitle: 'Lên lịch & Chuẩn bị kỹ',
      icon: AlertTriangle,
      accentColor: 'text-amber-600',
      bgHeader: 'bg-amber-50 border-amber-200/80',
    },
    {
      priority: 'p3',
      title: 'P3 Tiêu chuẩn',
      subtitle: 'Nhiệm vụ thường lệ',
      icon: Info,
      accentColor: 'text-blue-600',
      bgHeader: 'bg-blue-50 border-blue-200/80',
    },
    {
      priority: 'p4',
      title: 'P4 Thấp',
      subtitle: 'Xử lý khi rảnh rỗi',
      icon: Coffee,
      accentColor: 'text-slate-600',
      bgHeader: 'bg-slate-100 border-slate-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pb-12">
      {columns.map((col) => {
        const Icon = col.icon;
        const colTasks = tasks.filter((t) => t.priority === col.priority);
        const colMinutes = colTasks
          .filter((t) => !t.is_completed && t.estimated_minutes)
          .reduce((acc, t) => acc + (t.estimated_minutes || 0), 0);

        return (
          <div
            key={col.priority}
            className="flex flex-col bg-slate-100/60 rounded-3xl p-3 border border-slate-200/60 min-h-[500px]"
          >
            {/* Column Header */}
            <div
              className={`p-3 rounded-2xl border ${col.bgHeader} mb-3 flex items-center justify-between shadow-2xs`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${col.accentColor}`} />
                <div>
                  <h3 className="text-xs font-black text-slate-800 tracking-tight">
                    {col.title}
                  </h3>
                  <p className="text-[10px] text-slate-500">{col.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-2xs">
                  {colTasks.length}
                </span>
                <button
                  type="button"
                  onClick={() => onQuickAddWithPriority(col.priority)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white transition-colors"
                  title="Thêm việc vào cột này"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Column Task List */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {colTasks.length === 0 ? (
                <div className="h-32 border-2 border-dashed border-slate-200/80 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-[11px] font-medium text-slate-400">Không có việc</p>
                  <button
                    onClick={() => onQuickAddWithPriority(col.priority)}
                    className="mt-1 text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    + Thêm ngay
                  </button>
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                  />
                ))
              )}
            </div>

            {/* Column Footer */}
            {colMinutes > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200/80 text-[10px] text-slate-400 flex items-center justify-between px-1">
                <span>Tổng thời gian ước tính:</span>
                <span className="font-bold text-slate-700">{colMinutes} phút</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
