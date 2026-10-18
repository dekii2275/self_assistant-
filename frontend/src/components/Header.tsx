import React from 'react';
import { Menu, Search, Plus, LayoutList, Columns3, X } from 'lucide-react';
import type { NavView } from './Sidebar';

interface HeaderProps {
  currentView: NavView;
  selectedTag: string | null;
  onOpenMobileMenu: () => void;
  onOpenNewTaskModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeLayout: 'list' | 'kanban';
  setActiveLayout: (layout: 'list' | 'kanban') => void;
  filteredCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  selectedTag,
  onOpenMobileMenu,
  onOpenNewTaskModal,
  searchQuery,
  setSearchQuery,
  activeLayout,
  setActiveLayout,
  filteredCount,
}) => {
  const viewTitles: Record<NavView, { title: string; subtitle: string }> = {
    overview: { title: 'Tổng quan công việc', subtitle: 'Tiến độ và nhiệm vụ trọng tâm' },
    today: { title: 'Kế hoạch Hôm nay', subtitle: 'Tập trung vào những ưu tiên cần làm ngay' },
    timetable: { title: 'Thời gian biểu tuần', subtitle: 'Lịch trình làm việc theo từng khung giờ' },
    'study-space': { title: 'Không gian học & vẽ', subtitle: 'Bảng vẽ tư duy và ghi chép học tập' },
    tasks: { title: 'Tất cả công việc', subtitle: 'Quản lý toàn bộ danh sách nhiệm vụ' },
    projects: { title: 'Dự án', subtitle: 'Tiến độ các dự án và mục tiêu' },
    stats: { title: 'Thống kê & Năng suất', subtitle: 'Báo cáo thời gian và hiệu suất' },
    settings: { title: 'Cài đặt', subtitle: 'Cấu hình hệ thống và dữ liệu' },
  };

  const titleInfo = selectedTag
    ? { title: `#${selectedTag}`, subtitle: `Nhiệm vụ gắn thẻ #${selectedTag}` }
    : viewTitles[currentView];

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all shrink-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {titleInfo.title}
                </h1>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  {filteredCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal">
                {titleInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm việc... (⌘K)"
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-lg border border-slate-200 shadow-2xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-slate-800 placeholder-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Segmented Layout Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveLayout('list')}
                className={`p-1.5 rounded-md text-xs transition-all flex items-center gap-1 ${
                  activeLayout === 'list'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dạng danh sách"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveLayout('kanban')}
                className={`p-1.5 rounded-md text-xs transition-all flex items-center gap-1 ${
                  activeLayout === 'kanban'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dạng Kanban"
              >
                <Columns3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CTA Button */}
            <button
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Việc mới</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
