import React from 'react';
import { CheckCircle2, Clock, Flame, ListTodo } from 'lucide-react';
import type { Task } from '../types/task';

interface StatsBarProps {
  tasks: Task[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.is_completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  const urgentP1Count = tasks.filter((t) => t.priority === 'p1' && !t.is_completed).length;

  const totalEstimatedMinutes = tasks
    .filter((t) => !t.is_completed && t.estimated_minutes)
    .reduce((acc, curr) => acc + (curr.estimated_minutes || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Progress */}
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Tiến độ hoàn thành
            </span>
            <span className="text-indigo-600 font-bold">{percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-4 text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 font-medium">Tổng việc</p>
              <p className="font-bold text-slate-800">{total}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 font-medium">Khẩn cấp (P1)</p>
              <p className="font-bold text-rose-600">{urgentP1Count}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 font-medium">Ước tính cần</p>
              <p className="font-bold text-blue-700">{totalEstimatedMinutes}p</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
