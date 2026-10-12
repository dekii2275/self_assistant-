import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  ArrowRight,
  Laptop,
  Smartphone,
  Megaphone,
  Users,
  Plus,
  Trash2,
} from 'lucide-react';
import type { Task, Goal } from '../types/task';
import { goalApi } from '../services/api';

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
// 2. Real Backend-Connected Daily Goals Widget (Zero Mock Data)
// -------------------------------------------------------------
export const DailyGoalsWidget: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchGoals = async () => {
    try {
      const data = await goalApi.getGoals();
      setGoals(data);
    } catch (err) {
      console.error('Error fetching goals:', err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleToggle = async (id: number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, is_completed: !g.is_completed } : g))
    );
    try {
      const updated = await goalApi.toggleGoal(id);
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    } catch {
      await fetchGoals();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    try {
      const created = await goalApi.createGoal(newGoalTitle.trim());
      setGoals((prev) => [...prev, created]);
      setNewGoalTitle('');
      setIsAdding(false);
    } catch (err) {
      console.error('Error creating goal:', err);
    }
  };

  const handleDelete = async (id: number) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      await goalApi.deleteGoal(id);
    } catch {
      await fetchGoals();
    }
  };

  const doneCount = goals.filter((g) => g.is_completed).length;
  const progressPercent = goals.length > 0 ? Math.round((doneCount / goals.length) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl p-3 border border-[#e0ebe0] shadow-2xs space-y-2 flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-[#1b3826] flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-emerald-600" />
          <span>Mục tiêu hôm nay</span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-emerald-800">
            {doneCount}/{goals.length}
          </span>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
            title="Thêm mục tiêu"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#ebf4ec] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Add Goal Input */}
      {isAdding && (
        <form onSubmit={handleCreate} className="flex items-center gap-1.5 pt-1">
          <input
            type="text"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            placeholder="Nhập mục tiêu mới..."
            autoFocus
            className="flex-1 px-2.5 py-1 text-xs border border-emerald-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 bg-[#f9fbf9]"
          />
          <button
            type="submit"
            className="px-2 py-1 text-[11px] font-bold bg-[#265035] text-white rounded-lg hover:bg-[#1a3825]"
          >
            Lưu
          </button>
        </form>
      )}

      {/* Goals Checklist */}
      <div className="space-y-1.5 pt-0.5 flex-1 min-h-0 overflow-y-auto pr-0.5">
        {goals.length === 0 ? (
          <div className="py-4 text-center text-[11px] text-[#638a6e]">
            <p>Chưa có mục tiêu ngày.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-1 font-bold text-emerald-800 hover:underline"
            >
              + Thêm mục tiêu ngay
            </button>
          </div>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className="flex items-center justify-between gap-1.5 group select-none text-xs"
            >
              <label
                onClick={() => handleToggle(goal.id)}
                className="flex items-center gap-2 font-medium text-[#1f3f2a] cursor-pointer flex-1 min-w-0"
              >
                <div
                  className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                    goal.is_completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-emerald-300 bg-white group-hover:border-emerald-600'
                  }`}
                >
                  {goal.is_completed && (
                    <svg className="w-2.5 h-2.5 fill-none stroke-current stroke-[3]" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <span
                  className={`truncate leading-snug ${
                    goal.is_completed ? 'line-through text-[#6d9478]' : 'text-[#1b3826]'
                  }`}
                >
                  {goal.title}
                </span>
              </label>

              <button
                type="button"
                onClick={() => handleDelete(goal.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                title="Xóa mục tiêu"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
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
// 4. Real Projects Widget (Derived Directly From Backend Tasks)
// -------------------------------------------------------------
export const ActiveProjectsWidget: React.FC<{
  tasks: Task[];
  onSelectProjectTag: (tag: string) => void;
}> = ({ tasks, onSelectProjectTag }) => {
  // Compute real projects dynamically from tasks' tags
  const projects = useMemo(() => {
    const tagMap = new Map<string, { total: number; done: number }>();

    tasks.forEach((t) => {
      if (!t.tags) return;
      const splitTags = t.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      splitTags.forEach((tag) => {
        const cur = tagMap.get(tag) || { total: 0, done: 0 };
        cur.total += 1;
        if (t.is_completed) cur.done += 1;
        tagMap.set(tag, cur);
      });
    });

    const icons = [Laptop, Smartphone, Megaphone];
    const colors = [
      { color: 'text-emerald-700 bg-emerald-100', bar: 'from-emerald-500 to-teal-500' },
      { color: 'text-purple-700 bg-purple-100', bar: 'from-purple-500 to-indigo-500' },
      { color: 'text-amber-700 bg-amber-100', bar: 'from-amber-500 to-orange-500' },
    ];

    return Array.from(tagMap.entries()).map(([tag, stat], idx) => {
      const progress = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
      const chosenIcon = icons[idx % icons.length];
      const chosenColor = colors[idx % colors.length];

      return {
        id: tag,
        name: tag.charAt(0).toUpperCase() + tag.slice(1),
        tag,
        icon: chosenIcon,
        iconColor: chosenColor.color,
        barColor: chosenColor.bar,
        progress,
        tasks: `${stat.done}/${stat.total}`,
      };
    });
  }, [tasks]);

  return (
    <div className="bg-white rounded-2xl p-3 border border-[#e0ebe0] shadow-2xs space-y-2 flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-[#1b3826] flex items-center gap-1.5">
          <span>📁 Dự án từ thẻ nhãn</span>
        </h3>
        {projects.length > 0 && (
          <button
            onClick={() => onSelectProjectTag('all')}
            className="text-[11px] font-bold text-[#3d6e4b] hover:underline flex items-center gap-0.5"
          >
            <span>Xem hết</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5">
        {projects.length === 0 ? (
          <div className="py-4 text-center text-[11px] text-[#638a6e] px-2">
            <p>Chưa có dự án nào.</p>
            <p className="text-[10px] text-[#7da388] mt-0.5">
              Gắn thẻ nhãn (vd: <span className="font-mono font-bold">#du-an</span>, <span className="font-mono font-bold">#website</span>) vào công việc để tự động theo dõi dự án!
            </p>
          </div>
        ) : (
          projects.map((proj) => {
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
                    <Users className="w-2.5 h-2.5" /> Dự án
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
