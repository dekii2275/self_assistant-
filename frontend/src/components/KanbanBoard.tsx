import React from 'react';
import { Plus, Flame, AlertTriangle, Leaf, Coffee } from 'lucide-react';
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
      title: 'P1 Khẩn cấp & Sống còn',
      subtitle: 'Xử lý ngay cùng Rái Cá',
      icon: Flame,
      accentColor: 'text-rose-600',
      bgHeader: 'bg-rose-50 border-rose-200/80',
    },
    {
      priority: 'p2',
      title: 'P2 Quan trọng',
      subtitle: 'Lên kế hoạch chu đáo',
      icon: AlertTriangle,
      accentColor: 'text-amber-600',
      bgHeader: 'bg-amber-50 border-amber-200/80',
    },
    {
      priority: 'p3',
      title: 'P3 Tiêu chuẩn',
      subtitle: 'Dòng chảy công việc đều đặn',
      icon: Leaf,
      accentColor: 'text-emerald-700',
      bgHeader: 'bg-emerald-100/70 border-emerald-300/80',
    },
    {
      priority: 'p4',
      title: 'P4 Việc nhẹ',
      subtitle: 'Thong thả khi rảnh rỗi',
      icon: Coffee,
      accentColor: 'text-stone-700',
      bgHeader: 'bg-stone-100 border-stone-200',
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
            className="flex flex-col bg-emerald-50/30 rounded-3xl p-3 border border-emerald-100 min-h-[500px]"
          >
            {/* Header */}
            <div
              className={`p-3 rounded-2xl border ${col.bgHeader} mb-3 flex items-center justify-between shadow-2xs`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${col.accentColor}`} />
                <div>
                  <h3 className="text-xs font-black text-emerald-950 tracking-tight">
                    {col.title}
                  </h3>
                  <p className="text-[10px] text-emerald-800/70 font-medium">{col.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-emerald-900 shadow-2xs border border-emerald-100">
                  {colTasks.length}
                </span>
                <button
                  type="button"
                  onClick={() => onQuickAddWithPriority(col.priority)}
                  className="p-1 rounded-lg text-emerald-700 hover:text-emerald-950 hover:bg-white transition-colors"
                  title="Thêm việc vào cột này"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Tasks */}
            <div className="flex-1 space-y-2.5 overflow-y-auto">
              {colTasks.length === 0 ? (
                <div className="h-32 border-2 border-dashed border-emerald-200/70 rounded-3xl flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-[11px] font-bold text-emerald-700/60">Không có việc</p>
                  <button
                    onClick={() => onQuickAddWithPriority(col.priority)}
                    className="mt-1 text-[10px] font-black text-emerald-700 hover:underline"
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
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {colMinutes > 0 && (
              <div className="mt-2.5 pt-2 border-t border-emerald-100 text-[10px] text-emerald-800/70 flex items-center justify-between px-1 font-medium">
                <span>Ước tính cần:</span>
                <span className="font-extrabold text-emerald-900">{colMinutes} phút</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
