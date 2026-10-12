import React from 'react';
import { Menu, Search, Plus, LayoutList, Columns3, X, Sparkles } from 'lucide-react';
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
    all: { title: 'Tất cả nhiệm vụ', subtitle: 'Khu rừng công việc của bạn' },
    today: { title: 'Kế hoạch Hôm nay', subtitle: 'Tập trung vào những ưu tiên cần làm ngay' },
    upcoming: { title: 'Kế hoạch 7 ngày tới', subtitle: 'Lịch trình và hạn chót sắp đến' },
    urgent: { title: 'Ưu tiên khẩn cấp (P1)', subtitle: 'Những việc quan trọng cần giải quyết ngay' },
    completed: { title: 'Nhật ký hoàn thành', subtitle: 'Thành quả bạn và bé Rái Cá đã đạt được' },
  };

  const titleInfo = selectedTag
    ? { title: `#${selectedTag}`, subtitle: `Nhiệm vụ gắn thẻ #${selectedTag}` }
    : viewTitles[currentView];

  const todayFormatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const currentHour = new Date().getHours();
  let greeting = 'Chào buổi sáng';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Chào buổi chiều';
  if (currentHour >= 18) greeting = 'Chào buổi tối';

  return (
    <header className="sticky top-0 z-20 bg-[#f6f9f6]/90 backdrop-blur-md border-b border-emerald-100 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
          {/* Left Title & Mascot Pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="p-2 -ml-2 rounded-xl text-emerald-800 hover:bg-emerald-100 lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200/80 px-2.5 py-0.5 rounded-full capitalize flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {greeting} 🌿
                </span>
                <span className="text-xs text-emerald-800/60 font-medium capitalize">
                  {todayFormatted}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight flex items-center gap-2.5 mt-1">
                {titleInfo.title}
                <span className="text-xs font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {filteredCount}
                </span>
              </h1>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-emerald-700/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm việc..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-2xl border border-emerald-200 shadow-2xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200/50 transition-all text-emerald-950 placeholder-emerald-700/40 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Layout Switcher */}
            <div className="flex items-center bg-white p-1 rounded-2xl border border-emerald-200 shadow-2xs">
              <button
                onClick={() => setActiveLayout('list')}
                className={`p-1.5 rounded-xl text-xs font-medium transition-all ${
                  activeLayout === 'list'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-emerald-700/60 hover:text-emerald-950'
                }`}
                title="Dạng Danh sách"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveLayout('kanban')}
                className={`p-1.5 rounded-xl text-xs font-medium transition-all ${
                  activeLayout === 'kanban'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-emerald-700/60 hover:text-emerald-950'
                }`}
                title="Dạng Ma trận Rái Cá (Kanban)"
              >
                <Columns3 className="w-4 h-4" />
              </button>
            </div>

            {/* CTA Button */}
            <button
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs transition-all shadow-md shadow-emerald-700/20 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Việc mới</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
