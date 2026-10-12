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
  // Title mapping
  const viewTitles: Record<NavView, { title: string; subtitle: string }> = {
    all: { title: 'Tất cả công việc', subtitle: 'Tổng quan toàn bộ nhiệm vụ của bạn' },
    today: { title: 'Kế hoạch Hôm nay', subtitle: 'Tập trung vào những ưu tiên cần làm ngay' },
    upcoming: { title: 'Kế hoạch 7 ngày tới', subtitle: 'Lịch trình và hạn chót sắp đến' },
    urgent: { title: 'Ưu tiên khẩn cấp (P1)', subtitle: 'Những việc sống còn cần giải quyết ngay' },
    completed: { title: 'Nhật ký đã hoàn thành', subtitle: 'Những thành quả và micro-wins bạn đã đạt được' },
  };

  const titleInfo = selectedTag
    ? { title: `#${selectedTag}`, subtitle: `Lọc theo thẻ phân loại #${selectedTag}` }
    : viewTitles[currentView];

  // Vietnamese date string
  const todayFormatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Greeting
  const currentHour = new Date().getHours();
  let greeting = 'Chào buổi sáng';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Chào buổi chiều';
  if (currentHour >= 18) greeting = 'Chào buổi tối';

  return (
    <header className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/60 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top row: Greeting & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full capitalize">
                  {greeting} 👋
                </span>
                <span className="text-xs text-slate-400 capitalize">{todayFormatted}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
                {titleInfo.title}
                <span className="text-xs font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                  {filteredCount}
                </span>
              </h1>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm công việc..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-xl border border-slate-200 shadow-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Layout Toggle (List vs Kanban) */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setActiveLayout('list')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeLayout === 'list'
                    ? 'bg-indigo-50 text-indigo-600 shadow-2xs font-semibold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Dạng Danh sách"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveLayout('kanban')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeLayout === 'kanban'
                    ? 'bg-indigo-50 text-indigo-600 shadow-2xs font-semibold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Dạng Ma trận Kanban"
              >
                <Columns3 className="w-4 h-4" />
              </button>
            </div>

            {/* New Task Button */}
            <button
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/20 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Việc mới</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
