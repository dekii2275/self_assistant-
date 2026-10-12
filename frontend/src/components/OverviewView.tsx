import React from 'react';
import {
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  BarChart2,
  Search,
  Bell,
  Check,
  Mail,
  FileText,
  Users,
  BookOpen,
  Dumbbell,
  Calendar,
  MoreHorizontal,
  Menu,
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
  const todayStr = new Date().toISOString().split('T')[0];

  // Today's tasks (or filtered by selected calendar date if clicked)
  const targetDateKey = selectedCalendarDate || todayStr;
  const targetTasks = tasks.filter((t) => {
    if (!t.due_date) return !selectedCalendarDate; // tasks without due date show today
    return t.due_date.startsWith(targetDateKey);
  });

  const completedToday = targetTasks.filter((t) => t.is_completed).length;
  const totalToday = targetTasks.length;

  // Actual minutes sum
  const totalMinutesSpent = tasks.reduce((acc, t) => acc + (t.actual_minutes || 0), 0);
  const hours = Math.floor(totalMinutesSpent / 60);
  const mins = totalMinutesSpent % 60;
  const timeDisplay = totalMinutesSpent > 0 ? `${hours}h ${mins}m` : '3h 20m';

  // Urgent count for Otter assistant card
  const urgentCount = tasks.filter((t) => !t.is_completed && t.priority === 'p1').length;

  const priorityMeta: Record<Priority, { label: string; class: string }> = {
    p1: { label: 'Cao', class: 'bg-rose-50 text-rose-700 border-rose-200' },
    p2: { label: 'Cao', class: 'bg-rose-50 text-rose-700 border-rose-200' },
    p3: { label: 'Trung bình', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    p4: { label: 'Thấp', class: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  };

  // Category Icon helper
  const getCategoryIcon = (task: Task) => {
    const titleLower = task.title.toLowerCase();
    const tagLower = (task.tags || '').toLowerCase();

    if (titleLower.includes('email') || titleLower.includes('thư') || tagLower.includes('mail')) {
      return <Mail className="w-3.5 h-3.5 text-slate-500" />;
    }
    if (titleLower.includes('dự án') || titleLower.includes('báo cáo') || tagLower.includes('doc')) {
      return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
    if (titleLower.includes('họp') || titleLower.includes('team') || tagLower.includes('team')) {
      return <Users className="w-3.5 h-3.5 text-slate-500" />;
    }
    if (titleLower.includes('sách') || titleLower.includes('đọc') || tagLower.includes('book')) {
      return <BookOpen className="w-3.5 h-3.5 text-slate-500" />;
    }
    if (titleLower.includes('tập') || titleLower.includes('thể dục') || tagLower.includes('gym')) {
      return <Dumbbell className="w-3.5 h-3.5 text-slate-500" />;
    }
    return <Calendar className="w-3.5 h-3.5 text-slate-500" />;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER BAR (as in Mockup) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Search input with ⌘K */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-md">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="p-2 -ml-1 rounded-xl text-[#20442c] hover:bg-[#e2ede4] lg:hidden transition-colors shrink-0"
              title="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#527e5e] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công việc, dự án, ghi chú..."
              className="w-full pl-9 pr-12 py-2 text-xs font-semibold bg-white rounded-2xl border border-[#dce8dc] shadow-2xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200/50 text-[#173321] placeholder-[#648c6f]"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#6c9477] bg-[#edf4ed] px-1.5 py-0.5 rounded border border-[#d2e2d3]">
              ⌘ K
            </kbd>
          </div>
        </div>

        {/* Date, Notification Bell, User Avatar */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="text-xs font-bold text-[#2d5639] flex items-center gap-1.5 bg-white/70 border border-[#d8e8d9] px-3 py-1.5 rounded-full shadow-2xs">
            <span>🌿</span>
            <span>Thứ Ba, 13 tháng 10, 2026</span>
          </div>

          <button className="relative p-2 rounded-full bg-white border border-[#d8e8d9] text-[#2d5639] hover:bg-[#edf5ee] shadow-2xs transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border border-white" />
          </button>

          <div className="flex items-center gap-2 pl-1 cursor-pointer">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-100 ring-2 ring-emerald-300">
              <img
                src="/otter-mascot.png"
                alt="User Profile"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <span className="text-xs font-extrabold text-[#173321] hidden md:inline">
              Nguyễn Minh Anh
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* HERO BANNER (as in Mockup with nature greeting) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#eaf4ec] via-[#f1f7f2] to-[#e4f1e6] border border-[#d3e5d5] rounded-3xl p-6 sm:p-7 shadow-sm">
        {/* Subtle watercolor nature backdrop lettering */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 select-none pointer-events-none opacity-20 hidden md:block text-right">
          <p className="font-serif italic text-3xl text-[#1e452b] tracking-wider font-bold">
            Work
          </p>
          <p className="font-serif italic text-3xl text-[#1e452b] tracking-wider font-bold">
            Flow
          </p>
          <p className="font-serif italic text-3xl text-[#1e452b] tracking-wider font-bold flex items-center justify-end gap-1">
            Grow 🍃
          </p>
        </div>

        <div className="relative z-10 max-w-xl space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-[#14321d] tracking-tight">
            Xin chào, hôm nay bạn muốn hoàn thành gì? 🍃
          </h2>
          <p className="text-xs sm:text-sm font-medium text-[#416f4d] leading-relaxed">
            Mỗi ngày là một cơ hội để gần hơn với phiên bản tốt hơn của chính bạn 🌿
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TOP 3 STATS CARDS (as in Mockup) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* 1. Công việc hoàn thành */}
        <div className="bg-white rounded-3xl p-5 border border-[#e0ebe0] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#568164]">Công việc hoàn thành</span>
            </div>
            <div className="text-2xl font-black text-[#14321d] tracking-tight pt-1">
              {completedToday} / {totalToday > 0 ? totalToday : 8}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700">
              <span>↗ +25%</span>
            </div>
          </div>
          <div className="text-emerald-300">
            <BarChart2 className="w-8 h-8 opacity-70" />
          </div>
        </div>

        {/* 2. Thời gian tập trung */}
        <div className="bg-white rounded-3xl p-5 border border-[#e0ebe0] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-blue-100 text-blue-800">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#568164]">Thời gian tập trung</span>
            </div>
            <div className="text-2xl font-black text-[#14321d] tracking-tight pt-1">
              {timeDisplay}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700">
              <span>↗ +40%</span>
            </div>
          </div>
          <div className="text-blue-300">
            <BarChart2 className="w-8 h-8 opacity-70" />
          </div>
        </div>

        {/* 3. Chuỗi ngày liên tục */}
        <div className="bg-white rounded-3xl p-5 border border-[#e0ebe0] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-amber-100 text-amber-800">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#568164]">Chuỗi ngày liên tục</span>
            </div>
            <div className="text-2xl font-black text-[#14321d] tracking-tight pt-1 flex items-center gap-1.5">
              <span>12 ngày</span>
              <span className="text-lg">🔥</span>
            </div>
            <div className="text-[11px] font-medium text-[#568164]">
              Giữ vững phong độ nhé! 🌿
            </div>
          </div>
          <div className="text-amber-300">
            <span className="text-3xl">🌱</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MIDDLE SECTION: TODAY TASKS (LEFT) & WIDGETS (RIGHT) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Today Tasks Table (7/12 width) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#e0ebe0] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#14321d] flex items-center gap-2">
                <span>☀️ Hôm nay</span>
                {selectedCalendarDate && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {selectedCalendarDate}
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#527d60] font-medium">
                {completedToday}/{totalToday} công việc đã hoàn thành
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenNewTaskModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#265035] hover:bg-[#1a3825] text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Thêm công việc</span>
              </button>
              <button
                onClick={onViewAllTasks}
                className="p-1.5 rounded-lg text-[#527d60] hover:bg-[#edf5ee] transition-colors"
                title="Xem tất cả"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tasks Table/List */}
          <div className="space-y-2 pt-1">
            {targetTasks.length === 0 ? (
              <div className="text-center py-10 px-4 border-2 border-dashed border-[#dce8dd] rounded-2xl">
                <p className="text-xs font-bold text-[#527d60]">
                  Chưa có công việc nào cho ngày này!
                </p>
                <button
                  onClick={onOpenNewTaskModal}
                  className="mt-2 text-xs font-black text-emerald-700 hover:underline"
                >
                  + Thêm công việc ngay
                </button>
              </div>
            ) : (
              targetTasks.map((task) => {
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
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-[#e5efe5] hover:border-emerald-300 hover:bg-[#fafcfa] transition-all cursor-pointer group select-none"
                  >
                    {/* Checkbox & Title */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggle(task.id);
                        }}
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                          task.is_completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-emerald-300 bg-white group-hover:border-emerald-600'
                        }`}
                      >
                        {task.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <span
                        className={`text-xs font-bold truncate leading-snug ${
                          task.is_completed
                            ? 'line-through text-[#7ba286]'
                            : 'text-[#173321]'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Meta info: Time, Priority, Icon */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-[#658e70]">
                        <Clock className="w-3 h-3 text-[#658e70]" />
                        <span>{timeStr}</span>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${priority.class}`}
                      >
                        {priority.label}
                      </span>

                      <div className="p-1 rounded-lg bg-[#f0f5f0] text-[#4f775c]">
                        {getCategoryIcon(task)}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(task);
                        }}
                        className="text-[#658e70] hover:text-[#173321]"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Widgets (5/12 width) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Mini Calendar Widget */}
          <MonthCalendar
            tasks={tasks}
            selectedDate={selectedCalendarDate}
            onSelectDate={onSelectCalendarDate}
          />

          {/* Daily Goals Habit Widget */}
          <DailyGoalsWidget
            tasksCount={{ done: completedToday, total: totalToday }}
          />

          {/* Otter Assistant Card */}
          <OtterAssistantCard
            urgentCount={urgentCount}
            onViewList={onViewAllTasks}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM SECTION: ACTIVE PROJECTS */}
      {/* ------------------------------------------------------------- */}
      <ActiveProjectsWidget onSelectProjectTag={() => onViewAllTasks()} />
    </div>
  );
};
