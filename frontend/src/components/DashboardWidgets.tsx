import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  ArrowRight,
  Laptop,
  Smartphone,
  Megaphone,
  Users,
} from 'lucide-react';
import type { Task } from '../types/task';

// -------------------------------------------------------------
// 1. Mini Month Calendar Widget
// -------------------------------------------------------------
interface MonthCalendarProps {
  tasks: Task[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  tasks,
  selectedDate,
  onSelectDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // First day of month (0 = Sun, 1 = Mon... convert to Mon=0)
  const firstDay = new Date(year, month, 1).getDay();
  const startingCol = firstDay === 0 ? 6 : firstDay - 1; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const dayHeaders = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  // Days with tasks
  const taskDates = new Set(
    tasks
      .filter((t) => t.due_date && !t.is_completed)
      .map((t) => t.due_date!.split('T')[0])
  );

  return (
    <div className="bg-white rounded-2xl p-3 border border-[#e0ebe0] shadow-2xs space-y-2">
      {/* Month & Arrows */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-[#1b3826]">
          Tháng {month + 1}, {year}
        </h3>
        <div className="flex items-center gap-0.5">
          <button
            onClick={prevMonth}
            className="p-1 rounded-lg text-[#558163] hover:bg-[#edf5ee] transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg text-[#558163] hover:bg-[#edf5ee] transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold text-[#558163]">
        {dayHeaders.map((dh) => (
          <div key={dh} className="py-0.5">
            {dh}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-0.5 text-center text-[11px]">
        {/* Leading empty cells */}
        {Array.from({ length: startingCol }).map((_, i) => (
          <div key={`empty-${i}`} className="h-6" />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isToday = dateStr === todayDateStr;
          const isSelected = selectedDate === dateStr;
          const hasTask = taskDates.has(dateStr);

          return (
            <button
              key={dayNum}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={`h-6 w-6 mx-auto rounded-full font-bold flex flex-col items-center justify-center relative transition-all ${
                isSelected
                  ? 'bg-[#3b754e] text-white shadow-2xs'
                  : isToday
                  ? 'bg-[#20442c] text-white shadow-2xs font-black'
                  : 'text-[#1e3c28] hover:bg-[#ebf4ec]'
              }`}
            >
              <span>{dayNum}</span>
              {hasTask && !isToday && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-emerald-600 -mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. Daily Habits & Goals Widget
// -------------------------------------------------------------
export const DailyGoalsWidget: React.FC<{ tasksCount: { done: number; total: number } }> = () => {
  const [goals, setGoals] = useState([
    { id: 1, title: 'Hoàn thành việc quan trọng', completed: true },
    { id: 2, title: 'Tập trung tối thiểu 3h', completed: true },
    { id: 3, title: 'Vận động thể thao 30p', completed: false },
    { id: 4, title: 'Đọc sách trước khi ngủ', completed: false },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('otter_daily_goals');
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch {
        // fallback
      }
    }
  }, []);

  const toggleGoal = (id: number) => {
    setGoals((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g));
      localStorage.setItem('otter_daily_goals', JSON.stringify(next));
      return next;
    });
  };

  const doneCount = goals.filter((g) => g.completed).length;
  const progressPercent = Math.round((doneCount / goals.length) * 100);

  return (
    <div className="bg-white rounded-2xl p-3 border border-[#e0ebe0] shadow-2xs space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-[#1b3826] flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-emerald-600" />
          <span>Mục tiêu hôm nay</span>
        </h3>
        <span className="text-[11px] font-black text-emerald-800">
          {doneCount}/{goals.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#ebf4ec] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Goals Checklist */}
      <div className="space-y-1.5 pt-0.5">
        {goals.map((goal) => (
          <label
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className="flex items-center gap-2 text-xs font-medium text-[#1f3f2a] cursor-pointer select-none group"
          >
            <div
              className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                goal.completed
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-emerald-300 bg-white group-hover:border-emerald-600'
              }`}
            >
              {goal.completed && (
                <svg className="w-2.5 h-2.5 fill-none stroke-current stroke-[3]" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
            <span
              className={`truncate leading-snug ${
                goal.completed ? 'line-through text-[#6d9478]' : 'text-[#1b3826]'
              }`}
            >
              {goal.title}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. Otter Assistant Interactive Card
// -------------------------------------------------------------
interface OtterAssistantCardProps {
  urgentCount: number;
  onViewList: () => void;
}

export const OtterAssistantCard: React.FC<OtterAssistantCardProps> = ({
  urgentCount,
  onViewList,
}) => {
  return (
    <div className="bg-gradient-to-br from-[#f8faf7] via-[#eff7f1] to-[#e4f3e7] rounded-2xl p-3 border border-[#d3e6d6] shadow-2xs relative overflow-hidden flex items-center justify-between gap-2.5">
      <div className="space-y-1.5 max-w-[70%] z-10">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 border border-emerald-200 text-[10px] font-black text-emerald-800">
          <span>✨ Trợ lý Otter</span>
        </div>
        <p className="text-xs font-bold text-[#1b3826] leading-snug">
          {urgentCount > 0 ? (
            <>
              Bạn còn <span className="text-rose-600 font-black">{urgentCount} việc gấp</span> hôm nay! 🍃 Cố lên nhé!
            </>
          ) : (
            <>Hôm nay bạn đang tiến bộ rất tốt! 🌿 Hãy duy trì nhịp độ này nhé!</>
          )}
        </p>
        <button
          onClick={onViewList}
          className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-[#224830] hover:bg-[#1a3825] px-2.5 py-1 rounded-lg shadow-2xs transition-colors"
        >
          <span>Xem danh sách</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Mascot Image */}
      <div className="w-16 h-16 shrink-0 relative">
        <img
          src="/otter-mascot.png"
          alt="Trợ lý Otter"
          className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform"
        />
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. Active Projects Widget
// -------------------------------------------------------------
export const ActiveProjectsWidget: React.FC<{ onSelectProjectTag: (tag: string) => void }> = ({
  onSelectProjectTag,
}) => {
  const projects = [
    {
      id: 1,
      name: 'Website mới',
      tag: 'website',
      icon: Laptop,
      iconColor: 'text-emerald-700 bg-emerald-100',
      progress: 70,
      tasks: '12/18',
      barColor: 'from-emerald-500 to-teal-500',
    },
    {
      id: 2,
      name: 'Ứng dụng di động',
      tag: 'mobile',
      icon: Smartphone,
      iconColor: 'text-purple-700 bg-purple-100',
      progress: 40,
      tasks: '8/20',
      barColor: 'from-purple-500 to-indigo-500',
    },
    {
      id: 3,
      name: 'Marketing Q1',
      tag: 'marketing',
      icon: Megaphone,
      iconColor: 'text-amber-700 bg-amber-100',
      progress: 60,
      tasks: '6/10',
      barColor: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-3 border border-[#e0ebe0] shadow-2xs space-y-2 flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-[#1b3826] flex items-center gap-1.5">
          <span>📁 Dự án đang làm</span>
        </h3>
        <button
          onClick={() => onSelectProjectTag('all')}
          className="text-[11px] font-bold text-[#3d6e4b] hover:underline flex items-center gap-0.5"
        >
          <span>Xem hết</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </button>
      </div>

      <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5">
        {projects.map((proj) => {
          const Icon = proj.icon;
          return (
            <div
              key={proj.id}
              onClick={() => onSelectProjectTag(proj.tag)}
              className="p-2 rounded-xl border border-[#e5efe5] hover:border-emerald-300 hover:bg-[#fafcfa] transition-all cursor-pointer space-y-1.5 select-none"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`p-1 rounded-lg ${proj.iconColor}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-[#1b3826] truncate">{proj.name}</span>
                </div>
                <span className="text-[10px] font-extrabold text-[#456d50]">{proj.progress}%</span>
              </div>

              <div className="w-full bg-[#ebf4ec] h-1 rounded-full overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${proj.barColor} h-full rounded-full transition-all`}
                  style={{ width: `${proj.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#558163]">
                <span>📋 {proj.tasks} việc</span>
                <span className="flex items-center gap-1 bg-[#f2f7f2] px-1.5 py-0.2 rounded-full font-bold">
                  <Users className="w-2.5 h-2.5" /> Team
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
