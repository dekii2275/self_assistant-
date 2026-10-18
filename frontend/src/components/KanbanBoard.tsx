import React from 'react';
import { Plus, Flame, AlertTriangle, CheckCircle2, Coffee } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task, Priority } from '../types/task';

interface KanbanBoardProps {
  tasks: Task[];
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onEdit: (task: Task) => void;
  onQuickAddWithPriority: (priority: Priority) => void;
  onStartPomodoro?: (task: Task) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onToggle,
  onDelete,
  onEdit,
  onQuickAddWithPriority,
  onStartPomodoro,
}) => {
  const columns: {
    priority: Priority;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    bgBadge: string;
  }[] = [
    {
      priority: 'p1',
      title: 'P1 Khẩn cấp',
      subtitle: 'Cần giải quyết ngay',
      icon: Flame,
      accentColor: 'text-rose-600',
      bgBadge: 'bg-rose-100 text-rose-800',
    },
    {
      priority: 'p2',
      title: 'P2 Quan trọng',
      subtitle: 'Lên kế hoạch thực hiện',
      icon: AlertTriangle,
      accentColor: 'text-amber-600',
      bgBadge: 'bg-amber-100 text-amber-800',
    },
    {
      priority: 'p3',
      title: 'P3 Tiêu chuẩn',
      subtitle: 'Công việc hàng ngày',
      icon: CheckCircle2,
      accentColor: 'text-emerald-600',
      bgBadge: 'bg-emerald-100 text-emerald-800',
    },
    {
      priority: 'p4',
      title: 'P4 Việc nhẹ',
      subtitle: 'Thực hiện khi rảnh',
      icon: Coffee,
      accentColor: 'text-slate-600',
      bgBadge: 'bg-slate-200 text-slate-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 pb-12">
      {columns.map((col) => {
        const Icon = col.icon;
        const colTasks = tasks.filter((t) => t.priority === col.priority);
        const colMinutes = colTasks
          .filter((t) => !t.is_completed && t.estimated_minutes)
          .reduce((acc, t) => acc + (t.estimated_minutes || 0), 0);

        return (
          <div
            key={col.priority}
            className="flex flex-col bg-slate-100/60 rounded-xl p-3 border border-slate-200 min-h-[500px]"
          >
            {/* Header */}
            <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 mb-2.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${col.accentColor}`} />
                <div>
                  <h3 className="text-xs font-bold text-slate-800 leading-tight">
                    {col.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">{col.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.bgBadge}`}>
                  {colTasks.length}
                </span>
                <button
                  type="button"
                  onClick={() => onQuickAddWithPriority(col.priority)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Thêm việc vào cột này"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Tasks */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {colTasks.length === 0 ? (
                <div className="h-28 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-3 text-center bg-white/40">
                  <p className="text-[11px] text-slate-400 font-medium">Chưa có nhiệm vụ</p>
                  <button
                    onClick={() => onQuickAddWithPriority(col.priority)}
                    className="mt-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    + Thêm nhiệm vụ
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
                    onStartPomodoro={onStartPomodoro}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {colMinutes > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between px-1">
                <span>Ước tính cần:</span>
                <span className="font-semibold text-slate-700">{colMinutes} phút</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
