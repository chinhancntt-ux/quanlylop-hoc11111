/**
 * Đồng bộ dữ liệu giữa localStorage <-> Google Sheet (qua Google Apps Script).
 *
 * Ý tưởng: giữ nguyên toàn bộ code cũ (đọc/ghi localStorage), lớp này "nghe" mọi lần ghi
 * vào các khoá của app rồi tự đẩy lên Google Sheet. Khi mở app, dữ liệu được tải từ Sheet về.
 * localStorage đóng vai trò bộ nhớ đệm nên app vẫn chạy mượt và không mất dữ liệu khi mất mạng.
 */

const PREFIX = 'vuon_uoc_mo_classroom_v2_';
// Các khoá chỉ có ý nghĩa trên từng máy, không đồng bộ
const EXCLUDED = new Set<string>([PREFIX + 'active_class_id']);
const PENDING_KEY = 'beeclass_sync_pending'; // danh sách khoá chưa kịp đẩy lên Sheet

const GAS_URL = (import.meta.env.VITE_GAS_URL || '').trim();
const GAS_TOKEN = (import.meta.env.VITE_GAS_TOKEN || '').trim();

export type SyncState = 'disabled' | 'loading' | 'synced' | 'saving' | 'error';
export interface SyncStatus {
  state: SyncState;
  message: string;
}

const rawSet = Storage.prototype.setItem;
const rawRemove = Storage.prototype.removeItem;
const rawGet = Storage.prototype.getItem;

const isSynced = (key: string) => key.startsWith(PREFIX) && !EXCLUDED.has(key);

let status: SyncStatus = { state: 'disabled', message: 'Chưa kết nối Google Sheet' };
const listeners = new Set<(s: SyncStatus) => void>();
const setStatus = (state: SyncState, message: string) => {
  status = { state, message };
  listeners.forEach(fn => fn(status));
};
export const getSyncStatus = () => status;
export const subscribeSync = (fn: (s: SyncStatus) => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

// Giá trị mới nhất mà Google Sheet đang có (để bỏ qua các lần ghi không thay đổi)
const cloudValues = new Map<string, string>();
// Thay đổi đang chờ đẩy: khoá -> giá trị (null = xoá)
const pending = new Map<string, string | null>();
let timer: number | undefined;
let inFlight = false;
let retryTimer: number | undefined;

function persistPending() {
  try {
    rawSet.call(localStorage, PENDING_KEY, JSON.stringify([...pending.keys()]));
  } catch {
    /* bỏ qua */
  }
}

function loadPendingKeys(): string[] {
  try {
    const raw = rawGet.call(localStorage, PENDING_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function callGas(payload: unknown, timeoutMs = 60000): Promise<any> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      // text/plain để tránh preflight CORS (Apps Script không hỗ trợ OPTIONS)
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: GAS_TOKEN, ...(payload as object) }),
      signal: ctrl.signal,
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Google Script báo lỗi');
    return json;
  } finally {
    window.clearTimeout(t);
  }
}

async function pullAll(): Promise<Record<string, string>> {
  const url = `${GAS_URL}${GAS_URL.includes('?') ? '&' : '?'}action=pull&token=${encodeURIComponent(GAS_TOKEN)}`;
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Không tải được dữ liệu');
    return json.data as Record<string, string>;
  } finally {
    window.clearTimeout(t);
  }
}

function schedule(delay = 1500) {
  window.clearTimeout(timer);
  timer = window.setTimeout(flush, delay);
}

/** Chia các thay đổi thành nhiều gói (~1.5MB) để không gửi quá lớn một lần */
function buildBatches(entries: [string, string | null][]) {
  const batches: { set: Record<string, string>; del: string[] }[] = [];
  let cur = { set: {} as Record<string, string>, del: [] as string[] };
  let size = 0;
  for (const [k, v] of entries) {
    if (v === null) {
      cur.del.push(k);
      continue;
    }
    if (size > 0 && size + v.length > 1_500_000) {
      batches.push(cur);
      cur = { set: {}, del: [] };
      size = 0;
    }
    cur.set[k] = v;
    size += v.length;
  }
  batches.push(cur);
  return batches.filter(b => Object.keys(b.set).length || b.del.length);
}

async function flush() {
  if (inFlight || pending.size === 0) return;
  inFlight = true;
  window.clearTimeout(retryTimer);
  setStatus('saving', 'Đang lưu lên Google Sheet...');

  const snapshot = new Map(pending);
  try {
    for (const batch of buildBatches([...snapshot.entries()])) {
      await callGas(batch);
      for (const [k, v] of Object.entries(batch.set)) {
        cloudValues.set(k, v);
        if (pending.get(k) === v) pending.delete(k);
      }
      for (const k of batch.del) {
        cloudValues.delete(k);
        if (pending.get(k) === null) pending.delete(k);
      }
    }
    persistPending();
    setStatus('synced', 'Đã lưu trên Google Sheet');
  } catch (e: any) {
    console.error('[cloudSync] Lỗi đẩy dữ liệu:', e);
    setStatus('error', 'Chưa lưu được lên Google Sheet – sẽ tự thử lại');
    retryTimer = window.setTimeout(flush, 15000);
  } finally {
    inFlight = false;
    if (pending.size > 0 && status.state !== 'error') schedule(500);
  }
}

function queue(key: string, value: string | null) {
  if (value !== null && cloudValues.get(key) === value) {
    pending.delete(key); // giống hệt bản trên Sheet
  } else if (value === null && !cloudValues.has(key)) {
    pending.delete(key);
  } else {
    pending.set(key, value);
  }
  persistPending();
  if (pending.size > 0) {
    setStatus('saving', 'Đang chờ lưu lên Google Sheet...');
    schedule();
  }
}

function patchLocalStorage() {
  Storage.prototype.setItem = function (this: Storage, key: string, value: string) {
    rawSet.call(this, key, value);
    if (this === window.localStorage && isSynced(key)) queue(key, String(value));
  };
  Storage.prototype.removeItem = function (this: Storage, key: string) {
    rawRemove.call(this, key);
    if (this === window.localStorage && isSynced(key)) queue(key, null);
  };
}

function bindLifecycle() {
  const flushNow = () => {
    if (pending.size === 0) return;
    // Cố gắng gửi gói nhỏ khi đóng tab; nếu không kịp, khoá vẫn nằm trong PENDING_KEY
    // và sẽ được đẩy lên ở lần mở app kế tiếp.
    try {
      const set: Record<string, string> = {};
      const del: string[] = [];
      let size = 0;
      pending.forEach((v, k) => {
        if (v === null) del.push(k);
        else {
          set[k] = v;
          size += v.length;
        }
      });
      if (size < 60000) {
        navigator.sendBeacon(GAS_URL, new Blob([JSON.stringify({ token: GAS_TOKEN, set, del })], { type: 'text/plain;charset=utf-8' }));
      }
    } catch {
      /* bỏ qua */
    }
  };
  window.addEventListener('pagehide', flushNow);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushNow();
  });
  window.addEventListener('online', () => schedule(500));
}

/** Gọi 1 lần trước khi render app */
export async function initCloudSync(): Promise<void> {
  if (!GAS_URL || !GAS_TOKEN) {
    setStatus('disabled', 'Chưa kết nối Google Sheet (thiếu VITE_GAS_URL / VITE_GAS_TOKEN)');
    console.warn('[cloudSync] Thiếu VITE_GAS_URL hoặc VITE_GAS_TOKEN – app chỉ lưu trên trình duyệt.');
    return;
  }

  setStatus('loading', 'Đang tải dữ liệu từ Google Sheet...');
  const unsyncedKeys = new Set(loadPendingKeys());

  try {
    const cloud = await pullAll();
    const cloudKeys = Object.keys(cloud).filter(isSynced);
    const hasCloudData = cloudKeys.length > 0;

    cloudKeys.forEach(k => cloudValues.set(k, cloud[k]));

    if (hasCloudData) {
      // Sheet là nguồn dữ liệu chuẩn, trừ những khoá máy này sửa mà chưa kịp đẩy lên
      cloudKeys.forEach(k => {
        if (!unsyncedKeys.has(k)) rawSet.call(localStorage, k, cloud[k]);
      });
      // Xoá khoá cũ ở máy mà Sheet không còn (trừ khoá đang chờ đẩy)
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && isSynced(k) && !(k in cloud) && !unsyncedKeys.has(k)) rawRemove.call(localStorage, k);
      }
    }

    // Đẩy lên: (1) lần đầu Sheet còn trống -> chuyển toàn bộ dữ liệu cũ của máy này lên,
    //          (2) các khoá còn dang dở từ lần trước.
    const toPush: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !isSynced(k)) continue;
      if (!hasCloudData || unsyncedKeys.has(k)) toPush.push(k);
    }
    patchLocalStorage();
    bindLifecycle();
    toPush.forEach(k => {
      const v = rawGet.call(localStorage, k);
      if (v !== null) pending.set(k, v);
    });
    persistPending();
    if (pending.size > 0) {
      setStatus('saving', hasCloudData ? 'Đang lưu thay đổi chưa đồng bộ...' : 'Đang chuyển dữ liệu lên Google Sheet...');
      schedule(300);
    } else {
      setStatus('synced', 'Đã đồng bộ với Google Sheet');
    }
  } catch (e: any) {
    console.error('[cloudSync] Không tải được dữ liệu:', e);
    // Vẫn chạy bằng dữ liệu trong máy; mọi thay đổi sẽ được đẩy lên khi kết nối lại
    patchLocalStorage();
    bindLifecycle();
    unsyncedKeys.forEach(k => {
      const v = rawGet.call(localStorage, k);
      if (v !== null) pending.set(k, v);
    });
    setStatus('error', 'Không kết nối được Google Sheet – đang dùng dữ liệu trong máy');
    retryTimer = window.setTimeout(flush, 15000);
  }
}

/** Cho nút "Thử lại" */
export function retrySyncNow() {
  flush();
}
