import React from 'react';
import {
  Home,
  Sun,
  CalendarDays,
  CheckSquare,
  FolderKanban,
  BarChart3,
  Settings,
  X,
  Server,
  BookOpen,
} from 'lucide-react';
import type { Task } from '../types/task';

export type MainNavView =
  | 'overview'
  | 'today'
  | 'timetable'
  | 'tasks'
  | 'projects'
  | 'stats'
  | 'settings';

export type NavView = MainNavView;

interface SidebarProps {
  currentView: MainNavView;
  onSelectView: (view: MainNavView) => void;
  tasks: Task[];
  isBackendOnline: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  selectedTag?: string | null;
  onSelectTag?: (tag: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  tasks,
  isBackendOnline,
  isOpenMobile,
  onCloseMobile,
  selectedTag,
  onSelectTag,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const counts = {
    today: tasks.filter(
      (t) => !t.is_completed && (!t.due_date || t.due_date.startsWith(todayStr))
    ).length,
    all: tasks.filter((t) => !t.is_completed).length,
  };

  const allTags = Array.from(
    new Set(
      tasks
        .flatMap((t) => (t.tags ? t.tags.split(',') : []))
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    )
  );

  const navItems: {
    id: MainNavView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }[] = [
    { id: 'overview', label: 'Tổng quan', icon: Home },
    { id: 'today', label: 'Hôm nay', icon: Sun, count: counts.today },
    { id: 'timetable', label: 'Thời gian biểu tuần', icon: CalendarDays },
    { id: 'tasks', label: 'Công việc', icon: CheckSquare, count: counts.all },
    { id: 'projects', label: 'Dự án', icon: FolderKanban },
    { id: 'stats', label: 'Thống kê', icon: BarChart3 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#1e392a] text-[#e3efe6] w-64 select-none relative overflow-hidden">
      {/* Subtle organic leaves background pattern overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#80c294_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Brand & Mascot Logo */}
      <div className="p-5 border-b border-[#2d4e3b]/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-[#2a4e39] ring-2 ring-[#4d7d5f] shadow-md shrink-0">
            <img
              src="/otter-mascot.png"
              alt="OtterTodo Mascot"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight leading-tight flex items-center gap-1.5">
              OtterTodo
            </h2>
            <p className="text-[11px] text-[#a4c5ae] font-medium leading-tight">
              Làm nhiều hơn, sống an nhiên hơn
            </p>
          </div>
        </div>

        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-[#a4c5ae] hover:text-white hover:bg-[#2d4e3b] lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectView(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#3b664b] text-white shadow-sm'
                  : 'text-[#bcd5c4] hover:bg-[#284936] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-[#a6e6b8]' : 'text-[#8cb899]'}`}
                />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-[#284a35] text-[#b8f0ca]'
                      : 'bg-[#294a37] text-[#9fc7ad]'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Tags section */}
        {allTags.length > 0 && onSelectTag && (
          <div className="pt-3 mt-2 border-t border-[#2d4e3b]/50">
            <p className="px-3 text-[10px] font-bold text-[#8cb899] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Thẻ nhãn</span>
              {selectedTag && (
                <button
                  onClick={() => onSelectTag(null)}
                  className="text-[10px] text-[#a6e6b8] hover:underline normal-case"
                >
                  Xóa lọc
                </button>
              )}
            </p>
            <div className="space-y-0.5">
              {allTags.slice(0, 5).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    onSelectTag(selectedTag === tag ? null : tag);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors ${
                    selectedTag === tag
                      ? 'bg-[#3b664b] text-white font-bold'
                      : 'text-[#bcd5c4] hover:bg-[#284936]'
                  }`}
                >
                  <span className="truncate">#{tag}</span>
                  <span className="text-[10px] text-[#8cb899]">
                    {tasks.filter((t) => t.tags?.includes(tag)).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Scene & Quote (as in Mockup) */}
      <div className="p-4 border-t border-[#2d4e3b]/80 bg-[#172e21]/70">
        <div className="bg-[#244533] border border-[#345c45] rounded-2xl p-3 shadow-inner relative overflow-hidden group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#2f553f] shrink-0 border border-[#48785c]">
              <img
                src="/otter-mascot.png"
                alt="Otter mascot reading"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <p className="text-[10px] text-[#8cb899] font-bold uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-2.5 h-2.5" />
                <span>Châm ngôn ngày</span>
              </p>
              <p className="text-[11px] text-[#e0efe4] font-medium italic leading-snug mt-0.5">
                "Những việc nhỏ mỗi ngày tạo nên hành trình lớn." 🍃
              </p>
            </div>
          </div>
        </div>

        {/* Server & Port indicator */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#78a586] px-1 font-mono">
          <span className="flex items-center gap-1">
            <Server className="w-2.5 h-2.5" />
            Port: 8974
          </span>
          <span className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBackendOnline ? 'bg-[#4ade80] animate-pulse' : 'bg-rose-400'
              }`}
            />
            {isBackendOnline ? 'Live' : 'Offline'}
          </span>
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
            className="fixed inset-0 bg-[#0f2117]/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-64 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
