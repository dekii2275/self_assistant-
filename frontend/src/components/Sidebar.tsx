import React from 'react';
import {
  Inbox,
  Sun,
  CalendarDays,
  Flame,
  CheckCircle2,
  Tag,
  Clock,
  Sparkles,
  Server,
  Leaf,
  X,
  Compass,
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

  // Unique tags
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

  const totalTasks = tasks.length;
  const completedTasks = counts.completed;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalFocusMinutes = tasks
    .filter((t) => !t.is_completed && t.estimated_minutes)
    .reduce((acc, t) => acc + (t.estimated_minutes || 0), 0);

  // Mascot Encouragement speech
  let otterQuote = 'Chào bạn! Cùng bé Rái Cá lên kế hoạch ngày mới nhé! 🌱';
  if (completionRate > 0 && completionRate < 100) {
    otterQuote = 'Giỏi lắm! Đang vào guồng rồi, tiếp tục phát huy nào! 🦦✨';
  } else if (completionRate === 100 && totalTasks > 0) {
    otterQuote = 'Tuyệt đỉnh! Đã hoàn thành 100% việc hôm nay rồi! 🐟🎉';
  }

  const navItems = [
    {
      id: 'all' as NavView,
      label: 'Tất cả nhiệm vụ',
      icon: Inbox,
      count: counts.all,
      color: 'text-emerald-700',
    },
    {
      id: 'today' as NavView,
      label: 'Hôm nay',
      icon: Sun,
      count: counts.today,
      color: 'text-amber-500',
    },
    {
      id: 'upcoming' as NavView,
      label: 'Kế hoạch 7 ngày',
      icon: CalendarDays,
      count: counts.upcoming,
      color: 'text-teal-600',
    },
    {
      id: 'urgent' as NavView,
      label: 'Khẩn cấp (P1)',
      icon: Flame,
      count: counts.urgent,
      color: 'text-rose-500',
    },
    {
      id: 'completed' as NavView,
      label: 'Đã hoàn thành',
      icon: CheckCircle2,
      count: counts.completed,
      color: 'text-emerald-600',
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#fbfdfb] border-r border-emerald-100/90 w-72 select-none">
      {/* Brand & Mascot Profile */}
      <div className="p-4 border-b border-emerald-100/70 bg-gradient-to-b from-emerald-50/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Otter Avatar */}
            <div className="relative group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-emerald-100 ring-2 ring-emerald-300 ring-offset-2 shadow-md shadow-emerald-700/10 transition-transform group-hover:scale-105">
                <img
                  src="/otter-mascot.png"
                  alt="Rái Cá Trợ Lý Mascot"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white">
                🌱
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1">
                <h2 className="text-sm font-extrabold text-emerald-950 tracking-tight">
                  Rái Cá Trợ Lý
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Otter
                </span>
              </div>
              <p className="text-[11px] font-medium text-emerald-700/80 flex items-center gap-1 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                {isBackendOnline ? 'Rừng xanh online (8974)' : 'Offline'}
              </p>
            </div>
          </div>

          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Otter Speech Bubble */}
        <div className="mt-3.5 bg-white border border-emerald-200/80 rounded-2xl p-2.5 shadow-2xs relative">
          <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-t border-l border-emerald-200/80 transform rotate-45" />
          <p className="text-[11px] font-medium text-emerald-900 leading-snug">
            {otterQuote}
          </p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-emerald-800/60 uppercase flex items-center gap-1.5">
            <Compass className="w-3 h-3" />
            <span>Khu vực nhiệm vụ</span>
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold'
                      : 'text-emerald-900/80 hover:bg-emerald-100/60 hover:text-emerald-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive
                          ? 'bg-emerald-700/90 text-emerald-50'
                          : 'bg-emerald-100 text-emerald-800'
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
            <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-bold tracking-wider text-emerald-800/60 uppercase">
              <span className="flex items-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-600" />
                Thẻ rừng xanh (#tags)
              </span>
              <Tag className="w-3 h-3 text-emerald-500" />
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
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-emerald-900/80 hover:bg-emerald-100/50 hover:text-emerald-950'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isTagActive ? 'bg-white' : 'bg-emerald-500'
                        }`}
                      />
                      <span>#{tag}</span>
                    </div>
                    {tagCount > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isTagActive
                            ? 'bg-emerald-800 text-white'
                            : 'bg-emerald-100 text-emerald-800 font-bold'
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

      {/* Forest Productivity Progress */}
      <div className="p-3.5 border-t border-emerald-100/80 bg-emerald-50/50">
        <div className="bg-white rounded-2xl p-3 border border-emerald-200/70 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Năng lượng hôm nay
            </span>
            <span className="text-xs font-black text-emerald-700">{completionRate}%</span>
          </div>

          {/* Progress Bar with Nature Gradient */}
          <div className="w-full bg-emerald-100/70 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-400 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-800 font-medium border-t border-emerald-100">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{completedTasks}/{totalTasks} việc</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>{totalFocusMinutes}p cần tập trung</span>
            </div>
          </div>
        </div>

        {/* Server Info Pill */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-emerald-700/70 px-1 font-medium">
          <span className="flex items-center gap-1">
            <Server className="w-3 h-3 text-emerald-600" />
            DB: 5974
          </span>
          <span>Web: 5274</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen">{content}</aside>

      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-emerald-950/30 backdrop-blur-xs transition-opacity"
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
