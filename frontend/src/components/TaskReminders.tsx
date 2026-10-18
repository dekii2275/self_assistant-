import { useCallback, useEffect, useRef, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { taskApi } from '../services/api';
import type { Task } from '../types/task';

interface ReminderNotice {
  id: number;
  title: string;
  dueDate: string;
  isOverdue: boolean;
}

const INBOX_KEY = 'otter_reminder_inbox_v1';

function loadInbox(): ReminderNotice[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(INBOX_KEY) || '[]');
    if (Array.isArray(parsed)) {
      return parsed.filter((notice): notice is ReminderNotice =>
        notice !== null && typeof notice === 'object' &&
        typeof notice.id === 'number' && typeof notice.title === 'string' &&
        typeof notice.dueDate === 'string' && typeof notice.isOverdue === 'boolean'
      ).slice(0, 20);
    }
  } catch {
    // Browser storage may be unavailable.
  }
  return [];
}

async function showSystemNotification(task: Task): Promise<void> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const body = `Hạn chót: ${new Date(task.due_date!).toLocaleString('vi-VN')}`;
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/reminder-sw.js');
      await registration.showNotification(`Sắp đến hạn: ${task.title}`, {
        body,
        tag: `task-reminder-${task.id}`,
      });
      return;
    }
    const notification = new Notification(`Sắp đến hạn: ${task.title}`, { body });
    notification.onclick = () => window.focus();
  } catch {
    // The in-app inbox remains available if the system notification fails.
  }
}

interface TaskRemindersProps {
  enabled: boolean;
  onOpenTask: (id: number) => void;
}

export function TaskReminders({ enabled, onOpenTask }: TaskRemindersProps) {
  const [inbox, setInbox] = useState<ReminderNotice[]>(loadInbox);
  const isClaiming = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(INBOX_KEY, JSON.stringify(inbox));
    } catch {
      // The visible inbox still works for this session.
    }
  }, [inbox]);

  const checkReminders = useCallback(async () => {
    if (!enabled || isClaiming.current) return;
    isClaiming.current = true;
    try {
      const dueTasks = await taskApi.claimReminders();
      if (dueTasks.length) {
        setInbox((previous) => {
          const known = new Set(previous.map((notice) => notice.id));
          const incoming = dueTasks
            .filter((task) => task.due_date && !known.has(task.id))
            .map((task) => ({
              id: task.id,
              title: task.title,
              dueDate: task.due_date!,
              isOverdue: new Date(task.due_date!).getTime() < Date.now(),
            }));
          return [...incoming, ...previous].slice(0, 20);
        });
        for (const task of dueTasks) void showSystemNotification(task);
      }
    } catch {
      // Try again on the next poll or when the tab regains focus.
    } finally {
      isClaiming.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void checkReminders();
    const interval = window.setInterval(() => void checkReminders(), 30_000);
    const onFocus = () => void checkReminders();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void checkReminders();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, checkReminders]);

  if (!inbox.length) return null;

  return (
    <aside aria-label="Lời nhắc công việc" className="fixed bottom-4 right-4 z-[70] w-[min(22rem,calc(100vw-2rem))] max-h-[60vh] overflow-y-auto space-y-2">
      {inbox.map((notice) => (
        <div key={notice.id} role="alert" className="rounded-xl border border-amber-200 bg-white p-3 shadow-xl">
          <div className="flex items-start gap-2">
            <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900">{notice.isOverdue ? 'Đã quá hạn' : 'Sắp đến hạn'}</p>
              <p className="truncate text-sm font-medium text-slate-800">{notice.title}</p>
              <p className="text-xs text-slate-500">{new Date(notice.dueDate).toLocaleString('vi-VN')}</p>
              <button type="button" onClick={() => onOpenTask(notice.id)} className="mt-1 text-xs font-semibold text-emerald-700 hover:underline">
                Xem nhiệm vụ
              </button>
            </div>
            <button type="button" aria-label={`Đóng lời nhắc ${notice.title}`} onClick={() => setInbox((prev) => prev.filter((item) => item.id !== notice.id))} className="rounded p-1 text-slate-500 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
}
