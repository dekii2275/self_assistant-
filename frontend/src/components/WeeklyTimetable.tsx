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
  Leaf,
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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
    const monday = new Date(d.setDate(diff + offsetWeeks * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const monday = getMonday(currentWeekOffset);

  // Generate 7 days of the week (Mon -> Sun)
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });

  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  // Hour Blocks (Time slots)
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
    p3: { badge: 'bg-emerald-50 text-emerald-800', border: 'border-l-emerald-600', icon: Leaf },
    p4: { badge: 'bg-stone-100 text-stone-700', border: 'border-l-stone-400', icon: Coffee },
  };

  // Format week range title
  const weekStartStr = `${monday.getDate()}/${monday.getMonth() + 1}`;
  const sunday = daysOfWeek[6];
  const weekEndStr = `${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`;

  return (
    <div className="h-full flex flex-col overflow-hidden gap-2.5">
      {/* Timetable Header & Navigation (Compact ~42px) */}
      <div className="bg-white rounded-2xl p-2 px-3.5 border border-[#e0ebe0] shadow-2xs flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#edf4ee] flex items-center justify-center text-[#265337] border border-[#d2e4d4] shrink-0">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-[#1b3826] leading-tight">
              Thời gian biểu công việc cả tuần
            </h2>
            <p className="text-[10px] text-[#527d60] font-medium leading-tight">
              Tuần {weekStartStr} — {weekEndStr}
            </p>
          </div>
        </div>

        {/* Week Switcher Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
            className="p-1 rounded-lg text-[#345c43] hover:bg-[#edf4ee] border border-[#dce8dd] transition-colors"
            title="Tuần trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setCurrentWeekOffset(0)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
              currentWeekOffset === 0
                ? 'bg-[#29553a] text-white border-[#29553a]'
                : 'bg-white text-[#345c43] border-[#dce8dd] hover:bg-[#edf4ee]'
            }`}
          >
            Tuần này
          </button>

          <button
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
            className="p-1 rounded-lg text-[#345c43] hover:bg-[#edf4ee] border border-[#dce8dd] transition-colors"
            title="Tuần sau"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timetable Table Grid (Fills remaining height) */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-[#e0ebe0] shadow-2xs overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            {/* Days Header */}
            <thead className="sticky top-0 z-10 bg-[#f3f7f3] shadow-xs">
              <tr className="border-b border-[#e0ebe0]">
                <th className="w-28 p-2 text-[10px] font-black uppercase text-[#4d785b] tracking-wider text-center border-r border-[#e0ebe0]">
                  Khung giờ
                </th>
                {daysOfWeek.map((dayDate, idx) => {
                  const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
                  const isToday = dateKey === todayStr;

                  return (
                    <th
                      key={idx}
                      className={`p-1.5 text-center border-r last:border-r-0 border-[#e0ebe0] transition-colors ${
                        isToday ? 'bg-[#e4efe5]' : ''
                      }`}
                    >
                      <div className="text-[10px] font-bold text-[#558163]">
                        {dayNames[idx]}
                      </div>
                      <div
                        className={`inline-flex items-center justify-center w-6 h-6 mt-0.5 rounded-full text-[11px] font-black ${
                          isToday
                            ? 'bg-[#214730] text-white shadow-2xs'
                            : 'text-[#1b3826]'
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
                className={`border-b last:border-b-0 border-[#e0ebe0] transition-colors ${
                  sIdx % 2 === 0 ? 'bg-white' : 'bg-[#fafcfa]'
                }`}
              >
                {/* Time Slot Column */}
                <td className="p-2.5 text-[11px] font-black text-[#567f64] bg-[#f9fbf9] text-center border-r border-[#e0ebe0] font-mono">
                  {slot.label}
                </td>

                {/* 7 Days Cells */}
                {daysOfWeek.map((dayDate, dIdx) => {
                  const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
                  const isToday = dateKey === todayStr;

                  // Find tasks matching this day and hour block
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
                        className={`p-1 align-top border-r last:border-r-0 border-[#e0ebe0] min-w-[95px] min-h-[48px] relative group hover:bg-[#edf5ee]/50 transition-colors ${
                          isToday ? 'bg-[#f4f8f4]/60' : ''
                        }`}
                      >
                        <div className="space-y-1 h-full flex flex-col min-h-[42px]">
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
                                className={`p-1.5 rounded-lg bg-white border border-[#d8e6d9] border-l-[3px] ${
                                  style.border
                                } shadow-2xs hover:shadow-sm transition-all cursor-pointer select-none group/item ${
                                  task.is_completed ? 'opacity-50 line-through bg-[#f5f8f5]' : ''
                                }`}
                              >
                                <div className="flex items-start gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggle(task.id);
                                    }}
                                    className={`w-3 h-3 mt-0.5 rounded-md border flex items-center justify-center shrink-0 ${
                                      task.is_completed
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : 'border-emerald-300 bg-white hover:border-emerald-600'
                                    }`}
                                  >
                                    {task.is_completed && <Check className="w-2 h-2 stroke-[3]" />}
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-[#1b3826] leading-tight truncate">
                                      {task.title}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.2 text-[8px] text-[#558163] font-medium">
                                      <Clock className="w-2 h-2" />
                                      <span>{taskTime}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Quick Add Button in Cell on Hover */}
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
                            className="opacity-0 group-hover:opacity-100 transition-opacity mt-auto w-full py-0.5 rounded border border-dashed border-[#b6d4bc] text-[9px] font-bold text-[#3d6e4b] hover:bg-[#e4efe6] flex items-center justify-center gap-0.5"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Thêm</span>
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
