import React from 'react';
import { Search, Filter } from 'lucide-react';

interface FilterBarProps {
  currentTab: 'all' | 'active' | 'completed';
  setCurrentTab: (tab: 'all' | 'active' | 'completed') => void;
  selectedPriority: string;
  setSelectedPriority: (priority: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  counts: { all: number; active: number; completed: number };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentTab,
  setCurrentTab,
  selectedPriority,
  setSelectedPriority,
  searchQuery,
  setSearchQuery,
  counts,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setCurrentTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Tất cả</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 text-slate-700">
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('active')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'active'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Đang làm</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700">
            {counts.active}
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('completed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'completed'
              ? 'bg-white text-emerald-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Đã xong</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-700">
            {counts.completed}
          </span>
        </button>
      </div>

      {/* Search and Priority select */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:w-48">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm việc..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:bg-white text-slate-800 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs text-slate-700 bg-transparent outline-none cursor-pointer"
          >
            <option value="">Tất cả ưu tiên</option>
            <option value="p1">P1 - Khẩn cấp</option>
            <option value="p2">P2 - Quan trọng</option>
            <option value="p3">P3 - Tiêu chuẩn</option>
            <option value="p4">P4 - Thấp</option>
          </select>
        </div>
      </div>
    </div>
  );
};
