import React from 'react';
import { ClipboardList } from 'lucide-react';
import { TaskItem } from './TaskItem';
import type { Task } from '../types/task';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, isLoading, onToggle, onDelete }) => {
  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-white rounded-2xl border border-slate-200 animate-pulse p-4 flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
          <ClipboardList className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Không có công việc nào</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Nhập công việc vào ô bên trên để bắt đầu lập kế hoạch ngày hôm nay nhé!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
