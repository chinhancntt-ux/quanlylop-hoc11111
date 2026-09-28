import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, Loader2, CheckCircle2 } from 'lucide-react';
import { getSyncStatus, subscribeSync, retrySyncNow, SyncStatus } from '../utils/cloudSync';

export const SyncBadge: React.FC = () => {
  const [s, setS] = useState<SyncStatus>(getSyncStatus());
  useEffect(() => subscribeSync(setS), []);

  const styles: Record<string, string> = {
    disabled: 'bg-slate-100 text-slate-600 border-slate-200',
    loading: 'bg-sky-50 text-sky-700 border-sky-200',
    saving: 'bg-amber-50 text-amber-700 border-amber-200',
    synced: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const Icon =
    s.state === 'synced' ? CheckCircle2 : s.state === 'error' || s.state === 'disabled' ? CloudOff : s.state === 'saving' || s.state === 'loading' ? Loader2 : Cloud;

  return (
    <button
      type="button"
      onClick={s.state === 'error' ? retrySyncNow : undefined}
      title={s.message}
      className={`fixed bottom-3 right-3 z-[60] flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${styles[s.state]}`}
    >
      <Icon className={`h-3.5 w-3.5 ${s.state === 'saving' || s.state === 'loading' ? 'animate-spin' : ''}`} />
      <span className="max-w-[220px] truncate">{s.message}</span>
      {s.state === 'error' && <span className="underline">Thử lại</span>}
    </button>
  );
};
