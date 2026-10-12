import React, { useState } from 'react';
import { ClipboardCheck, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
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
            className="h-20 bg-white rounded-2xl border border-slate-200/80 animate-pulse p-4 flex items-center gap-3.5"
          >
            <div className="w-5 h-5 rounded-lg bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/5" />
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
      <div className="text-center py-20 px-4 bg-white/70 backdrop-blur-xs rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Không có công việc nào</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Tất cả nhiệm vụ trong góc nhìn này đã được giải quyết hoặc chưa được tạo. Hãy lên kế hoạch cho ngày làm việc mới!
        </p>
        <button
          onClick={onOpenNewTaskModal}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/20"
        >
          + Tạo công việc mới
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {/* Active Tasks List */}
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

      {/* Completed Section (Collapsible like Things 3) */}
      {completedTasks.length > 0 && (
        <div className="pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={() => setShowCompletedSection(!showCompletedSection)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {showCompletedSection ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <ClipboardCheck className="w-4 h-4 text-emerald-500" />
            <span>Đã hoàn thành ({completedTasks.length})</span>
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
