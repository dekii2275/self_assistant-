import { useEffect, useState } from 'react';
import { Bell, Mail } from 'lucide-react';
import type { ReminderMinutes } from '../types/task';
import { taskApi } from '../services/api';

interface ReminderFieldProps {
  id: string;
  dueDate: string;
  value: ReminderMinutes | null;
  onChange: (value: ReminderMinutes | null) => void;
  email: string;
  onEmailChange: (value: string) => void;
}

export function ReminderField({ id, dueDate, value, onChange, email, onEmailChange }: ReminderFieldProps) {
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof Notification === 'undefined' || !window.isSecureContext
      ? 'unsupported'
      : Notification.permission
  );

  useEffect(() => {
    let active = true;
    void taskApi.getEmailReminderStatus()
      .then(({ configured }) => { if (active) setEmailConfigured(configured); })
      .catch(() => { if (active) setEmailConfigured(null); });
    return () => { active = false; };
  }, []);

  const enableSystemNotifications = async () => {
    if (permission !== 'default') return;
    try {
      setPermission(await Notification.requestPermission());
    } catch {
      setPermission('unsupported');
    }
  };

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
        <Bell className="w-3.5 h-3.5 text-slate-400" />
        Nhắc trước hạn
      </label>
      <select
        id={id}
        value={value ?? ''}
        disabled={!dueDate}
        onChange={(event) => {
          const next = event.target.value ? Number(event.target.value) as ReminderMinutes : null;
          onChange(next);
          if (!next) onEmailChange('');
        }}
        className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <option value="">Không nhắc</option>
        <option value="10">10 phút</option>
        <option value="60">1 giờ</option>
        <option value="1440">1 ngày</option>
      </select>
      {!dueDate ? (
        <p className="text-[11px] text-slate-500">Chọn hạn chót để bật nhắc.</p>
      ) : value ? (
        <div className="text-[11px] text-slate-500">
          <p>Nhắc khi ứng dụng đang mở.</p>
          {permission === 'default' && (
            <button type="button" onClick={() => void enableSystemNotifications()} className="text-emerald-700 underline underline-offset-2">
              Bật thông báo hệ thống
            </button>
          )}
          {permission === 'denied' && <p>Trình duyệt đã chặn thông báo hệ thống; lời nhắc vẫn hiện trong ứng dụng.</p>}
        </div>
      ) : null}
      <label htmlFor={`${id}-email`} className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1 pt-1">
        <Mail className="w-3.5 h-3.5 text-slate-400" />
        Gửi nhắc việc qua email
      </label>
      <input
        id={`${id}-email`}
        type="email"
        autoComplete="email"
        value={email}
        disabled={!dueDate || !value}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="tenban@example.com (để trống nếu không gửi)"
        className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
      />
      {value && emailConfigured === false && (
        <p className="text-[11px] text-amber-700">Email sẽ được gửi sau khi cấu hình SMTP trên backend.</p>
      )}
      {email && emailConfigured && (
        <p className="text-[11px] text-slate-500">Backend tự gửi email khi đến giờ, kể cả khi đã đóng ứng dụng.</p>
      )}
    </div>
  );
}
