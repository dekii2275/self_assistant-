import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  Search,
  Bell,
  Check,
  Mail,
  FileText,
  Users,
  BookOpen,
  Dumbbell,
  Calendar,
  Menu,
  Edit2,
} from 'lucide-react';
import {
  MonthCalendar,
  DailyGoalsWidget,
  OtterAssistantCard,
  ActiveProjectsWidget,
} from './DashboardWidgets';
import type { Task, Priority } from '../types/task';

interface OverviewViewProps {
  tasks: Task[];
  onToggle: (id: number) => Promise<void>;
  onEdit: (task: Task) => void;
  onOpenNewTaskModal: () => void;
  onViewAllTasks: () => void;
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

  const todayStr = new Date().toISOString().split('T')[0];

  // Today's tasks (or filtered by selected calendar date if clicked)
  const targetDateKey = selectedCalendarDate || todayStr;
  const targetTasks = tasks.filter((t) => {
    if (!t.due_date) return !selectedCalendarDate;
    return t.due_date.startsWith(targetDateKey);
  });

  const completedToday = targetTasks.filter((t) => t.is_completed).length;
  const totalToday = targetTasks.length;

  const visibleTasks = targetTasks.filter((t) => {
    if (statusFilter === 'pending') return !t.is_completed;
    if (statusFilter === 'done') return t.is_completed;
    return true;
  });

  // Real minutes sum from PostgreSQL tasks
  const totalMinutesSpent = tasks.reduce((acc, t) => acc + (t.actual_minutes || 0), 0);
  const hours = Math.floor(totalMinutesSpent / 60);
  const mins = totalMinutesSpent % 60;
  const timeDisplay = `${hours}h ${mins}m`;

  // Real productivity streak calculated from completed tasks
  const streakDays = useMemo(() => {
    const completedDates = new Set(
      tasks
        .filter((t) => t.is_completed)
        .map((t) => (t.updated_at || t.created_at || '').split('T')[0])
        .filter(Boolean)
    );

    let count = 0;
    const checkDate = new Date();
    while (true) {
      const dateKey = checkDate.toISOString().split('T')[0];
      if (completedDates.has(dateKey)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (count === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayKey = checkDate.toISOString().split('T')[0];
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

  // Urgent count for Otter assistant card
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
    p3: { label: 'P3', class: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    p4: { label: 'P4', class: 'bg-slate-50 text-slate-700 border-slate-200' },
  };

  // Category Icon helper
  const getCategoryIcon = (task: Task) => {
    const titleLower = task.title.toLowerCase();
    const tagLower = (task.tags || '').toLowerCase();

    if (titleLower.includes('email') || titleLower.includes('thư') || tagLower.includes('mail')) {
      return <Mail className="w-3 h-3 text-slate-500" />;
    }
    if (titleLower.includes('dự án') || titleLower.includes('báo cáo') || tagLower.includes('doc')) {
      return <FileText className="w-3 h-3 text-slate-500" />;
    }
    if (titleLower.includes('họp') || titleLower.includes('team') || tagLower.includes('team')) {
      return <Users className="w-3 h-3 text-slate-500" />;
    }
    if (titleLower.includes('sách') || titleLower.includes('đọc') || tagLower.includes('book')) {
      return <BookOpen className="w-3 h-3 text-slate-500" />;
    }
    if (titleLower.includes('tập') || titleLower.includes('thể dục') || tagLower.includes('gym')) {
      return <Dumbbell className="w-3 h-3 text-slate-500" />;
    }
    return <Calendar className="w-3 h-3 text-slate-500" />;
  };

  const todayFormatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="h-full flex flex-col overflow-hidden gap-2.5">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER BAR (Compact ~38px) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        {/* Search input with ⌘K */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="p-1.5 rounded-xl text-[#20442c] hover:bg-[#e2ede4] lg:hidden transition-colors shrink-0"
              title="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#527e5e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm việc, dự án..."
              className="w-full pl-8 pr-10 py-1.5 text-xs font-semibold bg-white rounded-xl border border-[#dce8dc] shadow-2xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 text-[#173321] placeholder-[#648c6f]"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#6c9477] bg-[#edf4ed] px-1 py-0.2 rounded border border-[#d2e2d3]">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Date, Streak, Bell, User Profile, Quick Add */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-[#2d5639] bg-white border border-[#d8e8d9] px-2.5 py-1 rounded-full shadow-2xs capitalize">
            <span>🌿</span>
            <span>{todayFormatted}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shadow-2xs">
            <span>🔥</span>
            <span>{streakDays} ngày</span>
          </div>

          <button className="relative p-1.5 rounded-full bg-white border border-[#d8e8d9] text-[#2d5639] hover:bg-[#edf5ee] shadow-2xs transition-colors">
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
          </button>

          <button
            onClick={onOpenNewTaskModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#265035] hover:bg-[#1a3825] text-white text-xs font-bold shadow-2xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm việc</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-1.5 pl-1">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-emerald-100 ring-2 ring-emerald-300 shrink-0">
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
                  className="w-20 px-1.5 py-0.5 text-xs border border-emerald-300 rounded outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="text-[10px] text-emerald-800 font-bold hover:underline"
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
                <span className="text-xs font-bold text-[#173321] hidden md:inline">
                  {userName}
                </span>
                <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-700 hidden md:inline" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. COMPACT HERO & STATS BANNER (~58px) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-[#eaf4ec] via-[#f1f7f2] to-[#e4f1e6] border border-[#d3e5d5] rounded-2xl p-2 px-3 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#244933] ring-1 ring-[#417053] shrink-0 hidden sm:block">
            <img
              src="/otter-mascot.png"
              alt="Mascot"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-[#14321d] leading-tight">
              Xin chào {userName}! Hôm nay bạn muốn hoàn thành gì? 🍃
            </h2>
            <p className="text-[10px] text-[#416f4d] font-medium leading-tight hidden sm:block">
              "Work Flow Grow" — Từng bước nhỏ mỗi ngày tạo nên hành trình lớn
            </p>
          </div>
        </div>

        {/* 3 Compact Real Stat Badges */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
          {/* Stat 1: Completed */}
          <div className="bg-white/90 border border-emerald-200/80 px-2 py-0.5 rounded-xl shadow-2xs flex items-center gap-1.5">
            <div className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#568164] uppercase leading-none">Hoàn thành</p>
              <p className="text-xs font-black text-[#14321d] leading-tight">
                {completedToday}/{totalToday}
              </p>
            </div>
          </div>

          {/* Stat 2: Focus Time */}
          <div className="bg-white/90 border border-blue-200/80 px-2 py-0.5 rounded-xl shadow-2xs flex items-center gap-1.5">
            <div className="p-1 rounded-lg bg-blue-100 text-blue-800">
              <Clock className="w-3 h-3" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#568164] uppercase leading-none">Tập trung</p>
              <p className="text-xs font-black text-[#14321d] leading-tight">{timeDisplay}</p>
            </div>
          </div>

          {/* Stat 3: Urgent */}
          <div className="bg-white/90 border border-rose-200/80 px-2 py-0.5 rounded-xl shadow-2xs flex items-center gap-1.5">
            <div className="p-1 rounded-lg bg-rose-100 text-rose-800">
              <Flame className="w-3 h-3" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-rose-700 uppercase leading-none">Cần gấp</p>
              <p className="text-xs font-black text-rose-800 leading-tight">{urgentCount} việc</p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BENTO 3-COLUMN GRID (Fills Remaining Space: flex-1 min-h-0) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-2.5 overflow-hidden">
        {/* ========================================================= */}
        {/* COLUMN 1 (5/12): TODAY'S TASKS LIST */}
        {/* ========================================================= */}
        <div className="col-span-12 lg:col-span-5 h-full flex flex-col min-h-0 bg-white rounded-2xl p-3 border border-[#e0ebe0] shadow-2xs overflow-hidden">
          {/* Header & Filter pills */}
          <div className="flex items-center justify-between pb-2 border-b border-[#f0f5f0] shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-[#14321d] flex items-center gap-1.5">
                <span>☀️ Hôm nay</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                  {completedToday}/{totalToday}
                </span>
              </h3>
              {selectedCalendarDate && (
                <button
                  onClick={() => onSelectCalendarDate(null)}
                  className="text-[10px] font-bold text-emerald-700 hover:underline"
                  title="Xóa lọc ngày"
                >
                  [{selectedCalendarDate} ✕]
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-0.5 bg-[#f0f5f0] p-0.5 rounded-xl text-[10px] font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  statusFilter === 'all' ? 'bg-white text-[#173321] shadow-2xs' : 'text-[#62896d]'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  statusFilter === 'pending' ? 'bg-white text-[#173321] shadow-2xs' : 'text-[#62896d]'
                }`}
              >
                Chưa xong
              </button>
              <button
                onClick={() => setStatusFilter('done')}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  statusFilter === 'done' ? 'bg-white text-[#173321] shadow-2xs' : 'text-[#62896d]'
                }`}
              >
                Đã xong
              </button>
            </div>
          </div>

          {/* Task List (Internally scrollable if long, window never scrolls) */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 pt-2">
            {visibleTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-6 text-center border border-dashed border-[#dce8dd] rounded-xl">
                <p className="text-xs font-bold text-[#527d60]">
                  Không có công việc nào trong danh mục này!
                </p>
                <button
                  onClick={onOpenNewTaskModal}
                  className="mt-1.5 text-xs font-black text-emerald-700 hover:underline"
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
                  : '09:00';

                return (
                  <div
                    key={task.id}
                    onClick={() => onEdit(task)}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl border border-[#e5efe5] hover:border-emerald-300 hover:bg-[#fafcfa] transition-all cursor-pointer group select-none text-xs"
                  >
                    {/* Checkbox & Title */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggle(task.id);
                        }}
                        className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                          task.is_completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-emerald-300 bg-white group-hover:border-emerald-600'
                        }`}
                      >
                        {task.is_completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </button>

                      <span
                        className={`truncate font-bold leading-tight ${
                          task.is_completed ? 'line-through text-[#7ba286]' : 'text-[#173321]'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                      <span className="text-[#658e70] font-mono hidden sm:inline">{timeStr}</span>
                      <span
                        className={`font-black px-1.5 py-0.2 rounded-md border ${priority.class}`}
                      >
                        {priority.label}
                      </span>
                      <div className="p-0.5 rounded-md bg-[#f0f5f0] text-[#4f775c]">
                        {getCategoryIcon(task)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2 (4/12): MONTH CALENDAR & OTTER ASSISTANT */}
        {/* ========================================================= */}
        <div className="col-span-12 lg:col-span-4 h-full flex flex-col gap-2.5 min-h-0 overflow-hidden">
          {/* Top: Compact Month Calendar */}
          <MonthCalendar
            tasks={tasks}
            selectedDate={selectedCalendarDate}
            onSelectDate={onSelectCalendarDate}
          />

          {/* Bottom: Otter Assistant Card */}
          <div className="flex-1 min-h-0 flex flex-col">
            <OtterAssistantCard urgentCount={urgentCount} onViewList={onViewAllTasks} />
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 3 (3/12): DAILY GOALS & ACTIVE PROJECTS */}
        {/* ========================================================= */}
        <div className="col-span-12 lg:col-span-3 h-full flex flex-col gap-2.5 min-h-0 overflow-hidden">
          {/* Top: Daily Goals Widget */}
          <DailyGoalsWidget />

          {/* Bottom: Active Projects Widget */}
          <ActiveProjectsWidget tasks={tasks} onSelectProjectTag={() => onViewAllTasks()} />
        </div>
      </div>
    </div>
  );
};
