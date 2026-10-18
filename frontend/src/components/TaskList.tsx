import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Plus, Inbox } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task } from '../types/task';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onEdit: (task: Task) => void;
  onOpenNewTaskModal: () => void;
  onStartPomodoro?: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading,
  onToggle,
  onDelete,
  onEdit,
  onOpenNewTaskModal,
  onStartPomodoro,
}) => {
  const [showCompletedSection, setShowCompletedSection] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-2.5 py-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse p-3.5 flex items-center gap-3"
          >
            <div className="w-4 h-4 rounded-md bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-200 rounded w-1/3" />
              <div className="h-2.5 bg-slate-100 rounded w-1/5" />
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
      <div className="text-center py-16 px-6 bg-white rounded-xl border border-dashed border-slate-200 shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto mb-3 flex items-center justify-center">
          <Inbox className="w-6 h-6 stroke-[1.5]" />
        </div>

        <h3 className="text-sm font-bold text-slate-800">Không có công việc nào</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Không có nhiệm vụ nào trong danh sách này. Bạn có thể bắt đầu bằng cách thêm một việc cần làm mới.
        </p>

        <button
          onClick={onOpenNewTaskModal}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Tạo công việc đầu tiên</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-16">
      {/* Active Tasks */}
      <div className="space-y-2">
        {activeTasks.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
            <p className="font-semibold text-slate-700">Tất cả nhiệm vụ đã hoàn thành!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tuyệt vời, bạn không còn việc nào đang tồn đọng.</p>
          </div>
        ) : (
          activeTasks.map((task) => (
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

      {/* Completed Section */}
      {completedTasks.length > 0 && (
        <div className="pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowCompletedSection(!showCompletedSection)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {showCompletedSection ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Đã hoàn thành ({completedTasks.length})</span>
          </button>

          {showCompletedSection && (
            <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
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
