import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  Search,
  Check,
  Calendar,
  Menu,
  Edit2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import {
  MonthCalendar,
  DailyGoalsWidget,
  DailyBriefingCard,
} from './DashboardWidgets';
import type { Task, Priority } from '../types/task';
import { localDateKey, dueDateKey } from '../utils/date';

interface OverviewViewProps {
  tasks: Task[];
  onToggle: (id: number) => Promise<void>;
  onEdit: (task: Task) => void;
  onOpenNewTaskModal: () => void;
  onViewAllTasks: () => void;
  onOpenStudySpace?: () => void;
  selectedCalendarDate: string | null;
  onSelectCalendarDate: (dateStr: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenMobileMenu?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  tasks,
  onToggle,
  onEdit,
  onOpenNewTaskModal,
  onViewAllTasks,
  onOpenStudySpace,
  selectedCalendarDate,
  onSelectCalendarDate,
  searchQuery,
  setSearchQuery,
  onOpenMobileMenu,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [userName, setUserName] = useState(() => localStorage.getItem('otter_user_name') || 'Bạn');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const todayStr = localDateKey(new Date());

  // Filter by calendar date or today
  const targetDateKey = selectedCalendarDate || todayStr;
  const targetTasks = tasks.filter((t) => {
    if (!t.due_date) return !selectedCalendarDate;
    return dueDateKey(t.due_date) === targetDateKey;
  });

  const completedToday = targetTasks.filter((t) => t.is_completed).length;
  const totalToday = targetTasks.length;
  const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const visibleTasks = targetTasks.filter((t) => {
    if (statusFilter === 'pending') return !t.is_completed;
    if (statusFilter === 'done') return t.is_completed;
    return true;
  });

  // Real minutes sum from tasks
  const totalMinutesSpent = tasks.reduce((acc, t) => acc + (t.actual_minutes || 0), 0);
  const hours = Math.floor(totalMinutesSpent / 60);
  const mins = totalMinutesSpent % 60;
  const timeDisplay = `${hours}h ${mins}m`;

  // Streak calculation
  const streakDays = useMemo(() => {
    const completedDates = new Set(
      tasks
        .filter((t) => t.is_completed)
        .map((t) => dueDateKey(t.updated_at || t.created_at || ''))
        .filter(Boolean)
    );

    let count = 0;
    const checkDate = new Date();
    while (true) {
      const dateKey = localDateKey(checkDate);
      if (completedDates.has(dateKey)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (count === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayKey = localDateKey(checkDate);
          if (completedDates.has(yesterdayKey)) {
            count++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }
    return count;
  }, [tasks]);

  const urgentCount = tasks.filter((t) => !t.is_completed && t.priority === 'p1').length;

  const handleSaveName = () => {
    const trimmed = tempName.trim() || 'Bạn';
    setUserName(trimmed);
    localStorage.setItem('otter_user_name', trimmed);
    setIsEditingName(false);
  };

  const priorityMeta: Record<Priority, { label: string; class: string }> = {
    p1: { label: 'P1', class: 'bg-rose-50 text-rose-700 border-rose-200' },
    p2: { label: 'P2', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    p3: { label: 'P3', class: 'bg-slate-100 text-slate-700 border-slate-200' },
    p4: { label: 'P4', class: 'bg-stone-50 text-stone-600 border-stone-200' },
  };

  const todayFormatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="h-full flex flex-col overflow-hidden gap-3 max-w-7xl mx-auto w-full">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP UTILITY BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden transition-colors shrink-0"
              title="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công việc... (⌘K)"
              className="w-full pl-8 pr-8 py-1.5 text-xs font-medium bg-white rounded-lg border border-slate-200 shadow-2xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-slate-800 placeholder-slate-400 transition-all"
            />
          </div>
        </div>

        {/* Date, Streak, User Profile, Quick Add */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-2xs capitalize">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{todayFormatted}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>{streakDays} ngày</span>
          </div>

          <button
            onClick={onOpenNewTaskModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Thêm việc</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-emerald-950 border border-emerald-500/30 shrink-0">
              <img
                src="/otter-mascot.png"
                alt="Profile"
                className="w-full h-full object-cover object-top"
              />
            </div>
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="w-20 px-1.5 py-0.5 text-xs border border-slate-200 rounded outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="text-xs text-emerald-600 font-semibold hover:underline"
                >
                  Lưu
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setTempName(userName);
                  setIsEditingName(true);
                }}
                className="flex items-center gap-1 cursor-pointer group"
                title="Bấm để đổi tên hiển thị"
              >
                <span className="text-xs font-semibold text-slate-700 hidden md:inline group-hover:text-slate-900">
                  {userName}
                </span>
                <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600 hidden md:inline" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. KPI METRICS ROW (4 Cards) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hôm nay</p>
            <p className="text-lg font-bold text-slate-800 leading-tight mt-0.5">
              {completedToday}/{totalToday} <span className="text-xs font-normal text-slate-400">({completionRate}%)</span>
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Khẩn cấp (P1)</p>
            <p className="text-lg font-bold text-rose-600 leading-tight mt-0.5">
              {urgentCount} <span className="text-xs font-normal text-slate-400">việc</span>
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Thời gian tập trung</p>
            <p className="text-lg font-bold text-slate-800 leading-tight mt-0.5">
              {timeDisplay}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Chuỗi năng suất</p>
            <p className="text-lg font-bold text-amber-600 leading-tight mt-0.5">
              {streakDays} <span className="text-xs font-normal text-slate-400">ngày</span>
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN DASHBOARD CONTENT (Balanced 2-Column Layout) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT COLUMN (7/12): TODAY'S FOCUS & AGENDA */}
        {/* ========================================================= */}
        <div className="col-span-12 lg:col-span-7 h-full flex flex-col min-h-0 bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Header & Filter tabs */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span>Nhiệm vụ trọng tâm</span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {completedToday}/{totalToday}
                </span>
              </h3>
              {selectedCalendarDate && (
                <button
                  onClick={() => onSelectCalendarDate(null)}
                  className="text-xs font-medium text-emerald-600 hover:underline"
                  title="Xóa lọc theo ngày"
                >
                  [{selectedCalendarDate} ✕]
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'pending' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Chưa xong
              </button>
              <button
                onClick={() => setStatusFilter('done')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'done' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Đã xong
              </button>
            </div>
          </div>

          {/* Tasks List */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 pt-2">
            {visibleTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs font-semibold text-slate-600">
                  Không có công việc nào trong danh mục này!
                </p>
                <button
                  onClick={onOpenNewTaskModal}
                  className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
                >
                  + Thêm việc mới ngay
                </button>
              </div>
            ) : (
              visibleTasks.map((task) => {
                const priority = priorityMeta[task.priority] || priorityMeta.p3;
                const timeStr = task.due_date
                  ? new Date(task.due_date).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : null;

                return (
                  <div
                    key={task.id}
                    onClick={() => onEdit(task)}
                    className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 transition-all cursor-pointer group select-none text-xs"
                  >
                    {/* Checkbox & Title */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggle(task.id);
                        }}
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                          task.is_completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white group-hover:border-emerald-600'
                        }`}
                      >
                        {task.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <span
                        className={`truncate font-medium leading-tight ${
                          task.is_completed ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                      {timeStr && (
                        <span className="text-slate-400 font-mono hidden sm:inline">{timeStr}</span>
                      )}
                      <span
                        className={`font-semibold px-1.5 py-0.5 rounded-md border ${priority.class}`}
                      >
                        {priority.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN (5/12): CALENDAR, BRIEFING & DAILY GOALS */}
        {/* ========================================================= */}
        <div className="col-span-12 lg:col-span-5 h-full flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Top: Mini Month Calendar */}
          <MonthCalendar
            tasks={tasks}
            selectedDate={selectedCalendarDate}
            onSelectDate={onSelectCalendarDate}
          />

          {/* Middle: Smart Daily Briefing Card */}
          <DailyBriefingCard
            urgentCount={urgentCount}
            onViewList={onViewAllTasks}
            onOpenStudySpace={onOpenStudySpace}
          />

          {/* Bottom: Daily Goals Widget */}
          <DailyGoalsWidget />
        </div>
      </div>
    </div>
  );
};
