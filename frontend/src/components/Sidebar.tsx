import React from 'react';
import {
  Inbox,
  Calendar,
  CalendarDays,
  Flame,
  CheckCircle2,
  Tag,
  Clock,
  Sparkles,
  Server,
  Layers,
  X,
} from 'lucide-react';
import type { Task } from '../types/task';

export type NavView = 'all' | 'today' | 'upcoming' | 'urgent' | 'completed';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  tasks: Task[];
  isBackendOnline: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  selectedTag,
  onSelectTag,
  tasks,
  isBackendOnline,
  isOpenMobile,
  onCloseMobile,
}) => {
  // Counts
  const todayStr = new Date().toISOString().split('T')[0];
  const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const counts = {
    all: tasks.filter((t) => !t.is_completed).length,
    today: tasks.filter(
      (t) => !t.is_completed && (!t.due_date || t.due_date.startsWith(todayStr))
    ).length,
    upcoming: tasks.filter(
      (t) =>
        !t.is_completed &&
        t.due_date &&
        t.due_date.split('T')[0] >= todayStr &&
        t.due_date.split('T')[0] <= next7Days
    ).length,
    urgent: tasks.filter((t) => !t.is_completed && t.priority === 'p1').length,
    completed: tasks.filter((t) => t.is_completed).length,
  };

  // Extract unique tags
  const uniqueTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => {
      if (t.tags) {
        t.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }, [tasks]);

  // Productivity metrics
  const totalTasks = tasks.length;
  const completedTasks = counts.completed;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalFocusMinutes = tasks
    .filter((t) => !t.is_completed && t.estimated_minutes)
    .reduce((acc, t) => acc + (t.estimated_minutes || 0), 0);

  const navItems = [
    {
      id: 'all' as NavView,
      label: 'Tất cả công việc',
      icon: Inbox,
      count: counts.all,
      color: 'text-indigo-600',
    },
    {
      id: 'today' as NavView,
      label: 'Hôm nay',
      icon: Calendar,
      count: counts.today,
      color: 'text-amber-500',
    },
    {
      id: 'upcoming' as NavView,
      label: 'Kế hoạch 7 ngày',
      icon: CalendarDays,
      count: counts.upcoming,
      color: 'text-sky-500',
    },
    {
      id: 'urgent' as NavView,
      label: 'Ưu tiên khẩn cấp',
      icon: Flame,
      count: counts.urgent,
      color: 'text-rose-500',
    },
    {
      id: 'completed' as NavView,
      label: 'Đã hoàn thành',
      icon: CheckCircle2,
      count: counts.completed,
      color: 'text-emerald-500',
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 w-72 select-none">
      {/* Brand & Assistant Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-50">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              Self Assistant
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-[11px] font-medium text-slate-500">
                {isBackendOnline ? 'FastAPI 8974 Live' : 'Backend Offline'}
              </span>
            </div>
          </div>
        </div>

        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Góc nhìn công việc
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id && !selectedTag;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTag(null);
                    onSelectView(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50/80 text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-indigo-200/70 text-indigo-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tags Section */}
        {uniqueTags.length > 0 && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              <span>Thẻ phân loại</span>
              <Tag className="w-3 h-3 text-slate-400" />
            </div>
            <div className="space-y-1">
              {uniqueTags.map((tag) => {
                const isTagActive = selectedTag === tag;
                const tagCount = tasks.filter(
                  (t) => !t.is_completed && t.tags?.includes(tag)
                ).length;
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      onSelectTag(isTagActive ? null : tag);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isTagActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isTagActive ? 'bg-white' : 'bg-indigo-500'
                        }`}
                      />
                      <span>#{tag}</span>
                    </div>
                    {tagCount > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isTagActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {tagCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Productivity Widget */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Tiến độ hôm nay
            </span>
            <span className="text-xs font-extrabold text-indigo-600">{completionRate}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {completedTasks}/{totalTasks} việc
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{totalFocusMinutes}p cần làm</span>
            </div>
          </div>
        </div>

        {/* Server Info Pill */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Server className="w-3 h-3 text-slate-400" />
            Postgres: 5974
          </span>
          <span>Web: 5274</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen">{content}</aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
