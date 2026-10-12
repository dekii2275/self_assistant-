import React, { useState } from 'react';
import { ClipboardCheck, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task } from '../types/task';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onEdit: (task: Task) => void;
  onOpenNewTaskModal: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading,
  onToggle,
  onDelete,
  onEdit,
  onOpenNewTaskModal,
}) => {
  const [showCompletedSection, setShowCompletedSection] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 bg-white rounded-3xl border border-emerald-100 animate-pulse p-4 flex items-center gap-3.5"
          >
            <div className="w-5 h-5 rounded-xl bg-emerald-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-emerald-100 rounded-lg w-1/3" />
              <div className="h-3 bg-emerald-50 rounded-lg w-1/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-white/90 backdrop-blur-xs rounded-3xl border border-emerald-100 shadow-sm">
        {/* Otter Mascot Highlight */}
        <div className="relative w-36 h-36 mx-auto mb-4 group cursor-pointer">
          <div className="absolute inset-0 bg-emerald-100/60 rounded-full blur-xl transform group-hover:scale-110 transition-transform" />
          <img
            src="/otter-mascot.png"
            alt="Rái Cá Trợ Lý"
            className="relative w-full h-full object-contain drop-shadow-md hover-wiggle transition-transform"
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
          <span>🐾 Bé Rái Cá đồng hành cùng bạn</span>
        </div>

        <h3 className="text-lg font-black text-emerald-950">Không có nhiệm vụ nào còn trống</h3>
        <p className="text-xs text-emerald-800/70 mt-1.5 max-w-sm mx-auto leading-relaxed font-medium">
          Mọi việc đã được giải quyết hoặc chưa có công việc mới. Hãy thêm nhiệm vụ để cùng bé Rái Cá hoàn thành nhé!
        </p>

        <button
          onClick={onOpenNewTaskModal}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black transition-all shadow-md shadow-emerald-700/20"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tạo nhiệm vụ đầu tiên</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {/* Active Tasks */}
      <div className="space-y-2.5">
        {activeTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* Completed Section */}
      {completedTasks.length > 0 && (
        <div className="pt-4 border-t border-emerald-200/70">
          <button
            type="button"
            onClick={() => setShowCompletedSection(!showCompletedSection)}
            className="flex items-center gap-2 text-xs font-extrabold text-emerald-800/70 hover:text-emerald-950 px-2 py-1.5 rounded-xl hover:bg-emerald-100/60 transition-colors"
          >
            {showCompletedSection ? (
              <ChevronDown className="w-4 h-4 text-emerald-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-emerald-600" />
            )}
            <ClipboardCheck className="w-4 h-4 text-emerald-600" />
            <span>Nhiệm vụ đã hoàn thành ({completedTasks.length})</span>
          </button>

          {showCompletedSection && (
            <div className="mt-2.5 space-y-2 animate-in fade-in duration-200">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
