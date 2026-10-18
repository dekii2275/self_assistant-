import React, { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Check,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Coffee,
} from 'lucide-react';
import type { Task, Priority } from '../types/task';

interface WeeklyTimetableProps {
  tasks: Task[];
  onToggle: (id: number) => Promise<void>;
  onEdit: (task: Task) => void;
  onQuickAddAtTime: (dateIso: string) => void;
}

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({
  tasks,
  onToggle,
  onEdit,
  onQuickAddAtTime,
}) => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Calculate Monday of current target week
  const getMonday = (offsetWeeks: number) => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff + offsetWeeks * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const monday = getMonday(currentWeekOffset);

  // 7 days of the week (Mon -> Sun)
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });

  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  // Time slots
  const timeSlots = [
    { label: '07:00 - 09:00', hour: 7 },
    { label: '09:00 - 11:00', hour: 9 },
    { label: '11:00 - 13:00', hour: 11 },
    { label: '13:00 - 15:00', hour: 13 },
    { label: '15:00 - 17:00', hour: 15 },
    { label: '17:00 - 19:00', hour: 17 },
    { label: '19:00 - 21:00', hour: 19 },
    { label: '21:00 - 23:00', hour: 21 },
  ];

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const priorityStyles: Record<
    Priority,
    { badge: string; border: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    p1: { badge: 'bg-rose-50 text-rose-700', border: 'border-l-rose-500', icon: Flame },
    p2: { badge: 'bg-amber-50 text-amber-700', border: 'border-l-amber-500', icon: AlertTriangle },
    p3: { badge: 'bg-slate-50 text-slate-700', border: 'border-l-emerald-600', icon: CheckCircle2 },
    p4: { badge: 'bg-stone-50 text-stone-600', border: 'border-l-slate-300', icon: Coffee },
  };

  const weekStartStr = `${monday.getDate()}/${monday.getMonth() + 1}`;
  const sunday = daysOfWeek[6];
  const weekEndStr = `${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`;

  return (
    <div className="h-full flex flex-col overflow-hidden gap-3 max-w-7xl mx-auto w-full">
      {/* Timetable Header & Navigation */}
      <div className="bg-white rounded-xl p-3 px-4 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200 shrink-0">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 leading-tight">
              Thời gian biểu tuần
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Từ {weekStartStr} đến {weekEndStr}
            </p>
          </div>
        </div>

        {/* Week Switcher Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentWeekOffset(0)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              currentWeekOffset === 0
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tuần này
          </button>

          <button
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Tuần sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timetable Table Grid */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            {/* Days Header */}
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
              <tr className="border-b border-slate-200">
                <th className="w-28 p-2.5 text-[11px] font-semibold uppercase text-slate-500 tracking-wider text-center border-r border-slate-200">
                  Khung giờ
                </th>
                {daysOfWeek.map((dayDate, idx) => {
                  const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
                  const isToday = dateKey === todayStr;

                  return (
                    <th
                      key={idx}
                      className={`p-2 text-center border-r last:border-r-0 border-slate-200 transition-colors ${
                        isToday ? 'bg-emerald-50/60' : ''
                      }`}
                    >
                      <div className="text-[11px] font-semibold text-slate-500">
                        {dayNames[idx]}
                      </div>
                      <div
                        className={`inline-flex items-center justify-center w-6 h-6 mt-0.5 rounded-full text-xs font-bold ${
                          isToday
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-800'
                        }`}
                      >
                        {dayDate.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Time Rows */}
            <tbody>
              {timeSlots.map((slot, sIdx) => (
                <tr
                  key={slot.hour}
                  className={`border-b last:border-b-0 border-slate-100 transition-colors ${
                    sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  {/* Time Slot Column */}
                  <td className="p-2 text-[11px] font-medium text-slate-500 bg-slate-50/70 text-center border-r border-slate-200 font-mono">
                    {slot.label}
                  </td>

                  {/* 7 Days Cells */}
                  {daysOfWeek.map((dayDate, dIdx) => {
                    const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
                    const isToday = dateKey === todayStr;

                    // Tasks for cell
                    const cellTasks = tasks.filter((t) => {
                      if (!t.due_date) return false;
                      const d = new Date(t.due_date);
                      const taskDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      if (taskDateKey !== dateKey) return false;
                      const h = d.getHours();
                      return h >= slot.hour && h < slot.hour + 2;
                    });

                    return (
                      <td
                        key={dIdx}
                        className={`p-1.5 align-top border-r last:border-r-0 border-slate-100 min-w-[100px] min-h-[52px] relative group hover:bg-slate-50 transition-colors ${
                          isToday ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <div className="space-y-1 h-full flex flex-col min-h-[46px]">
                          {cellTasks.map((task) => {
                            const style = priorityStyles[task.priority] || priorityStyles.p3;
                            const taskTime = task.due_date
                              ? new Date(task.due_date).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '';

                            return (
                              <div
                                key={task.id}
                                onClick={() => onEdit(task)}
                                className={`p-1.5 rounded-lg bg-white border border-slate-200 border-l-[3px] ${
                                  style.border
                                } shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none group/item ${
                                  task.is_completed ? 'opacity-50 line-through bg-slate-50' : ''
                                }`}
                              >
                                <div className="flex items-start gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggle(task.id);
                                    }}
                                    className={`w-3.5 h-3.5 mt-0.5 rounded border flex items-center justify-center shrink-0 ${
                                      task.is_completed
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : 'border-slate-300 bg-white hover:border-emerald-600'
                                    }`}
                                  >
                                    {task.is_completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold text-slate-800 leading-tight truncate">
                                      {task.title}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 font-mono">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>{taskTime}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Quick Add Button on Hover */}
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(dayDate);
                              d.setHours(slot.hour, 0, 0, 0);
                              const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                                .toISOString()
                                .slice(0, 16);
                              onQuickAddAtTime(localIso);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity mt-auto w-full py-1 rounded border border-dashed border-slate-300 text-[10px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-white flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm việc</span>
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
