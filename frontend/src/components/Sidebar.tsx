import React from 'react';
import {
  Home,
  Sun,
  CalendarDays,
  CheckSquare,
  PenTool,
  X,
  Server,
  Tag,
} from 'lucide-react';
import type { Task } from '../types/task';
import { localDateKey, dueDateKey } from '../utils/date';

export type MainNavView =
  | 'overview'
  | 'today'
  | 'timetable'
  | 'study-space'
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
  const todayStr = localDateKey(new Date());

  const counts = {
    today: tasks.filter(
      (t) => !t.is_completed && (!t.due_date || dueDateKey(t.due_date) === todayStr)
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
    { id: 'timetable', label: 'Thời gian biểu', icon: CalendarDays },
    { id: 'study-space', label: 'Không gian học & vẽ', icon: PenTool },
    { id: 'tasks', label: 'Tất cả công việc', icon: CheckSquare, count: counts.all },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-200 w-64 select-none border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-emerald-950 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src="/otter-mascot.png"
              alt="Otter Workspace"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white tracking-tight">Otter Workspace</h2>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/20 px-1.5 py-0.2 rounded-md">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">Trợ lý & Quản lý nhiệm vụ</p>
          </div>
        </div>

        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1">
        <p className="px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Điều hướng chính
        </p>
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
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`}
                />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-emerald-700 text-emerald-100'
                      : 'bg-slate-800 text-slate-300'
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
          <div className="pt-4 mt-3 border-t border-slate-800">
            <div className="px-2 mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Thẻ nhãn</span>
              </span>
              {selectedTag && (
                <button
                  onClick={() => onSelectTag(null)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Xóa lọc
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {allTags.slice(0, 6).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    onSelectTag(selectedTag === tag ? null : tag);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    selectedTag === tag
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">#{tag}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {tasks.filter((t) => t.tags?.includes(tag)).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer & Server Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0 space-y-2">
        <div className="flex items-center justify-between text-xs px-1 text-slate-400">
          <span className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" />
            <span className="text-[11px]">Hệ thống</span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-rose-400'
              }`}
            />
            <span className={isBackendOnline ? 'text-emerald-400' : 'text-rose-400'}>
              {isBackendOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
            </span>
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
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
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
