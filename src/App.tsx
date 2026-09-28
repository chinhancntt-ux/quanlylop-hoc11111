import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './components/OverviewView';
import { ClassManagement } from './components/ClassManagement';
import { AttendanceDailyView } from './components/AttendanceDailyView';
import { CriteriaView } from './components/CriteriaView';
import { LuckyWheelView } from './components/LuckyWheelView';
import { ClassroomGroupsView } from './components/ClassroomGroupsView';
import { GiftShopView } from './components/GiftShopView';
import { LeaderboardView } from './components/LeaderboardView';
import { NoiseMeterView } from './components/NoiseMeterView';
import { CountdownTimerView } from './components/CountdownTimerView';
import { SettingsBackupView } from './components/SettingsBackupView';
import { ScheduleView } from './components/ScheduleView';
import { WeeklyReviewsView } from './components/WeeklyReviewsView';
import { QuickRewardModal } from './components/QuickRewardModal';
import { BackgroundCustomizerModal } from './components/BackgroundCustomizerModal';
import { Plus } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, config, openRewardModalForStudent } = useApp();

  const wallpaper = config.appWallpaper;
  const wallpaperOpacity = (config.wallpaperOpacity ?? 20) / 100;

  return (
    <div className="flex h-screen w-full bg-[#f0f7ff]/40 text-slate-800 font-sans overflow-hidden select-none relative">
      {/* Background Wallpaper Layer from Computer or Preset */}
      {wallpaper && (
        <div
          className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center transition-all duration-300"
          style={{
            backgroundImage: `url(${wallpaper})`,
            opacity: wallpaperOpacity,
            filter: config.wallpaperBlur ? `blur(${config.wallpaperBlur}px)` : undefined,
          }}
        />
      )}

      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50/70 p-4 sm:p-6 lg:p-8 scrollbar-thin relative z-10">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && <OverviewView />}
          {activeTab === 'classes' && <ClassManagement />}
          {activeTab === 'attendance' && <AttendanceDailyView />}
          {activeTab === 'weekly-reviews' && <WeeklyReviewsView />}
          {activeTab === 'criteria' && <CriteriaView />}
          {activeTab === 'lucky-wheel' && <LuckyWheelView />}
          {activeTab === 'groups' && <ClassroomGroupsView />}
          {activeTab === 'gifts' && <GiftShopView />}
          {activeTab === 'leaderboard' && <LeaderboardView />}
          {activeTab === 'noise-meter' && <NoiseMeterView />}
          {activeTab === 'timer' && <CountdownTimerView />}
          {activeTab === 'settings' && <SettingsBackupView />}
          {activeTab === 'schedule' && <ScheduleView />}
        </div>
      </main>

      {/* Global Modals */}
      <QuickRewardModal />
      <BackgroundCustomizerModal />

      {/* Floating Action Button (FAB) at Bottom-Right */}
      <button
        id="floating-reward-fab-btn"
        onClick={() => openRewardModalForStudent()}
        title="Thưởng điểm nhanh cho học sinh"
        className="fixed bottom-6 right-6 z-40 group flex items-center justify-center transition-transform active:scale-95"
      >
        <div className="relative">
          {/* Avatar Ring */}
          <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-sky-400 to-blue-600 ring-4 ring-blue-200/70 shadow-lg flex items-center justify-center overflow-hidden hover:scale-105 transition-transform">
            <img
              src={config.teacherAvatar}
              alt={config.teacherName}
              className="w-full h-full object-cover rounded-full bg-white"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://api.dicebear.com/7.x/bottts/svg?seed=ThayNhanTeacher&backgroundColor=bae6fd';
              }}
            />
          </div>

          {/* Plus icon badge */}
          <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 group-hover:bg-blue-700 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
            <Plus className="w-3.5 h-3.5" />
          </span>
        </div>
      </button>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
