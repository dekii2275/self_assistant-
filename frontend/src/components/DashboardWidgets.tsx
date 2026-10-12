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
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e0ebe0] shadow-sm space-y-3">
      {/* Month & Arrows */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-black text-[#1b3826]">
          Lịch tháng {month + 1}, {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded-lg text-[#558163] hover:bg-[#edf5ee] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg text-[#558163] hover:bg-[#edf5ee] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#558163]">
        {dayHeaders.map((dh) => (
          <div key={dh} className="py-1">
            {dh}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {/* Leading empty cells */}
        {Array.from({ length: startingCol }).map((_, i) => (
          <div key={`empty-${i}`} className="h-7" />
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
              className={`h-7 w-7 mx-auto rounded-full font-bold flex flex-col items-center justify-center relative transition-all ${
                isSelected
                  ? 'bg-[#3b754e] text-white shadow-xs'
                  : isToday
                  ? 'bg-[#20442c] text-white shadow-xs font-black'
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
    { id: 1, title: 'Hoàn thành công việc quan trọng', completed: true },
    { id: 2, title: 'Duy trì tập trung tối thiểu 3 giờ', completed: true },
    { id: 3, title: 'Tập thể dục ít nhất 30 phút', completed: false },
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
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e0ebe0] shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-black text-[#1b3826] flex items-center gap-1.5">
          <Target className="w-4 h-4 text-emerald-600" />
          <span>Mục tiêu hôm nay</span>
        </h3>
        <span className="text-xs font-black text-emerald-800">
          {doneCount}/{goals.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#ebf4ec] h-2 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Goals Checklist */}
      <div className="space-y-2 pt-1">
        {goals.map((goal) => (
          <label
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className="flex items-center gap-2.5 text-xs font-semibold text-[#1f3f2a] cursor-pointer select-none group"
          >
            <div
              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                goal.completed
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-emerald-300 bg-white group-hover:border-emerald-600'
              }`}
            >
              {goal.completed && (
                <svg className="w-3 h-3 fill-none stroke-current stroke-[3]" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
            <span
              className={`leading-tight ${
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
    <div className="bg-gradient-to-br from-[#f8faf7] via-[#eff7f1] to-[#e4f3e7] rounded-3xl p-4 sm:p-5 border border-[#d3e6d6] shadow-sm relative overflow-hidden flex items-center justify-between gap-3">
      <div className="space-y-2 max-w-[65%] z-10">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 border border-emerald-200 text-[10px] font-black text-emerald-800">
          <span>✨ Trợ lý Otter</span>
        </div>
        <p className="text-xs font-bold text-[#1b3826] leading-snug">
          {urgentCount > 0 ? (
            <>
              Bạn còn <span className="text-rose-600 font-black">{urgentCount} việc quan trọng</span> hôm nay! 🍃 Cố lên nhé! Bạn đang làm rất tốt!
            </>
          ) : (
            <>Hôm nay bạn đang kiểm soát công việc rất tốt! 🌿 Hãy duy trì nhịp độ này nhé!</>
          )}
        </p>
        <button
          onClick={onViewList}
          className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-[#224830] hover:bg-[#1a3825] px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
        >
          <span>Xem danh sách</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Mascot Image */}
      <div className="w-24 h-24 shrink-0 relative">
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
      subtitle: 'Thiết kế và phát triển',
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
      subtitle: 'Phát triển tính năng mới',
      tag: 'mobile',
      icon: Smartphone,
      iconColor: 'text-purple-700 bg-purple-100',
      progress: 40,
      tasks: '8/20',
      barColor: 'from-purple-500 to-indigo-500',
    },
    {
      id: 3,
      name: 'Chiến dịch Marketing',
      subtitle: 'Quý 1 - 2026',
      tag: 'marketing',
      icon: Megaphone,
      iconColor: 'text-amber-700 bg-amber-100',
      progress: 60,
      tasks: '6/10',
      barColor: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-black text-[#1b3826] flex items-center gap-1.5">
          <span>📁 Dự án đang làm</span>
        </h3>
        <button
          onClick={() => onSelectProjectTag('all')}
          className="text-xs font-bold text-[#3d6e4b] hover:underline flex items-center gap-1"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {projects.map((proj) => {
          const Icon = proj.icon;
          return (
            <div
              key={proj.id}
              onClick={() => onSelectProjectTag(proj.tag)}
              className="bg-white rounded-3xl p-4 border border-[#e0ebe0] shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer space-y-3 select-none"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-2xl ${proj.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#1b3826]">{proj.name}</h4>
                    <p className="text-[10px] text-[#558163] font-medium">{proj.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-[#456d50] mb-1">
                  <span>Tiến độ</span>
                  <span>{proj.progress}%</span>
                </div>
                <div className="w-full bg-[#ebf4ec] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${proj.barColor} h-full rounded-full transition-all`}
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>

              {/* Tasks count & members */}
              <div className="flex items-center justify-between text-[11px] text-[#558163] font-medium pt-1 border-t border-[#f0f5f0]">
                <span>📋 {proj.tasks}</span>
                <span className="flex items-center gap-1 text-[10px] bg-[#f2f7f2] px-2 py-0.5 rounded-full text-[#386245] font-bold">
                  <Users className="w-3 h-3" /> Team
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
