import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  ArrowRight,
  FolderKanban,
  Plus,
  Trash2,
  PenTool,
  Clock,
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
    <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2">
      {/* Month & Arrows */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800">
          Tháng {month + 1}, {year}
        </h3>
        <div className="flex items-center gap-0.5">
          <button
            onClick={prevMonth}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Tháng trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Tháng sau"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-semibold text-slate-400">
        {dayHeaders.map((dh) => (
          <div key={dh} className="py-0.5">
            {dh}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
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
              className={`h-6 w-6 mx-auto rounded-md font-medium flex flex-col items-center justify-center relative transition-all text-xs ${
                isSelected
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : isToday
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{dayNum}</span>
              {hasTask && !isSelected && (
                <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-emerald-400' : 'bg-emerald-600'} -mt-0.5`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. Real Daily Goals Widget
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
    try {
      const updated = await goalApi.toggleGoal(id);
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    } catch {
      alert('Không thể cập nhật mục tiêu. Vui lòng thử lại.');
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
      alert('Không thể thêm mục tiêu. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await goalApi.deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch {
      alert('Không thể xóa mục tiêu. Vui lòng thử lại.');
    }
  };

  const doneCount = goals.filter((g) => g.is_completed).length;
  const progressPercent = goals.length > 0 ? Math.round((doneCount / goals.length) * 100) : 0;

  return (
    <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2 flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-emerald-600" />
          <span>Mục tiêu trong ngày</span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500">
            {doneCount}/{goals.length}
          </span>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Thêm mục tiêu mới"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-emerald-600 h-full rounded-full transition-all duration-300"
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
            placeholder="Nhập mục tiêu hôm nay..."
            autoFocus
            className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 bg-slate-50"
          />
          <button
            type="submit"
            className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Lưu
          </button>
        </form>
      )}

      {/* Goals Checklist */}
      <div className="space-y-1 pt-0.5 flex-1 min-h-0 overflow-y-auto pr-0.5">
        {goals.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            <p>Chưa thiết lập mục tiêu nào.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-1 font-semibold text-emerald-600 hover:underline"
            >
              + Thêm mục tiêu đầu tiên
            </button>
          </div>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className="flex items-center justify-between gap-2 group select-none text-xs p-1 rounded-md hover:bg-slate-50"
            >
              <label
                onClick={() => handleToggle(goal.id)}
                className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer flex-1 min-w-0"
              >
                <div
                  className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                    goal.is_completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 bg-white group-hover:border-emerald-600'
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
                    goal.is_completed ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {goal.title}
                </span>
              </label>

              <button
                type="button"
                onClick={() => handleDelete(goal.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-600 transition-opacity"
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
// 3. Smart Briefing Card (Replaces AI slop mascot card)
// -------------------------------------------------------------
interface DailyBriefingCardProps {
  urgentCount: number;
  onViewList: () => void;
  onOpenStudySpace?: () => void;
}

export const DailyBriefingCard: React.FC<DailyBriefingCardProps> = ({
  urgentCount,
  onViewList,
  onOpenStudySpace,
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-3.5 text-white shadow-xs flex items-center justify-between gap-3 relative overflow-hidden">
      <div className="space-y-1.5 z-10 max-w-[72%]">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>Tóm tắt ngày</span>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed font-normal">
          {urgentCount > 0 ? (
            <>
              Bạn có <span className="text-rose-400 font-bold">{urgentCount} việc khẩn cấp (P1)</span> cần ưu tiên hoàn thành trước.
            </>
          ) : (
            <>Tất cả các việc khẩn cấp đã được xử lý. Tiếp tục duy trì năng suất nhé!</>
          )}
        </p>

        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            onClick={onViewList}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-md transition-colors shadow-2xs"
          >
            <span>Xem danh sách</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          {onOpenStudySpace && (
            <button
              onClick={onOpenStudySpace}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded-md transition-colors"
            >
              <PenTool className="w-3 h-3 text-emerald-400" />
              <span>Không gian học</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtle Otter avatar badge */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center shadow-xs">
        <img
          src="/otter-mascot.png"
          alt="Otter Workspace"
          className="w-full h-full object-cover object-top opacity-90"
        />
      </div>
    </div>
  );
};

// Backward-compatible alias
export const OtterAssistantCard = DailyBriefingCard;

// -------------------------------------------------------------
// 4. Active Projects Widget
// -------------------------------------------------------------
export const ActiveProjectsWidget: React.FC<{
  tasks: Task[];
  onSelectProjectTag: (tag: string) => void;
}> = ({ tasks, onSelectProjectTag }) => {
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

    return Array.from(tagMap.entries()).map(([tag, stat]) => {
      const progress = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
      return {
        id: tag,
        name: tag.charAt(0).toUpperCase() + tag.slice(1),
        tag,
        progress,
        tasks: `${stat.done}/${stat.total}`,
      };
    });
  }, [tasks]);

  return (
    <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2 flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
          <span>Dự án theo nhãn</span>
        </h3>
        {projects.length > 0 && (
          <button
            onClick={() => onSelectProjectTag('all')}
            className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-0.5"
          >
            <span>Tất cả</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5">
        {projects.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400 px-2">
            <p>Chưa có dự án nào.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Thêm thẻ nhãn vào nhiệm vụ để tự động theo dõi dự án.
            </p>
          </div>
        ) : (
          projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onSelectProjectTag(proj.tag)}
              className="p-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all cursor-pointer space-y-1.5 select-none"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  #{proj.name}
                </span>
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  {proj.progress}%
                </span>
              </div>

              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{proj.tasks} hoàn thành</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
