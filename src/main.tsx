import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {SyncBadge} from './components/SyncBadge.tsx';
import {initCloudSync} from './utils/cloudSync.ts';
import './index.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <div className="flex h-screen w-full items-center justify-center bg-[#f0f7ff] text-slate-600 font-sans">
    Đang tải dữ liệu lớp học từ Google Sheet...
  </div>,
);

// Tải dữ liệu từ Google Sheet về trước rồi mới hiển thị app
initCloudSync()
  .catch(console.error)
  .finally(() => {
    root.render(
      <StrictMode>
        <App />
        <SyncBadge />
      </StrictMode>,
    );
  });
