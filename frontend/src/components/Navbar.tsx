import React from 'react';
import { CheckCircle2, Server } from 'lucide-react';

interface NavbarProps {
  isBackendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ isBackendOnline }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Self Assistant
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                To-Do Core
              </span>
            </h1>
            <p className="text-xs text-slate-500">Kế hoạch & Nhắc việc thông minh</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <span>Port: 8974</span>
            <span className="flex items-center gap-1.5 ml-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className={isBackendOnline ? 'text-emerald-700 font-semibold' : 'text-rose-700'}>
                {isBackendOnline ? 'Online' : 'Offline'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
