import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Student,
  CriteriaItem,
  GiftItem,
  GiftRedemptionRecord,
  RewardRecord,
  AttendanceRecord,
  AttendanceStatus,
  ClassroomConfig,
  AppTab,
  ClassItem,
  ScheduleItem,
  TeacherInfo,
  RoomInfo,
  ClassroomGroup,
  SchoolYearArchive,
  SchoolYearFullBackup,
  WeeklyEvaluationRecord,
  StudentYearEvaluation,
  EvaluationLevel,
} from '../types';
import {
  INITIAL_CONFIG,
  INITIAL_STUDENTS,
  INITIAL_CRITERIA,
  INITIAL_GIFTS,
  INITIAL_REDEMPTIONS,
  INITIAL_REWARDS,
  INITIAL_CLASSES,
  INITIAL_SCHEDULES,
  INITIAL_TEACHERS,
  INITIAL_ROOMS,
  INITIAL_WEEKLY_EVALUATIONS,
  INITIAL_YEAR_EVALUATIONS,
} from '../data/mockData';
import { playChime, playPenaltyChime, playTick, playAlarmSound } from '../utils/audio';
import { getCurrentSchoolWeek, getCurrentSchoolSemester } from '../utils/rankingPeriods';

export type ActiveTab = any;

interface AppContextType {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  config: ClassroomConfig;
  updateConfig: (newConfig: Partial<ClassroomConfig>) => void;
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => void;
  addStudentToClass: (student: Omit<Student, 'id'>, targetClassId: string) => Student;
  addMultipleStudentsToClass: (rows: Array<Partial<Student> & { name: string }>, targetClassId: string) => number;
  removeStudentFromClass: (studentId: string, classId: string) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  resetStudents: () => void;
  importStudentList: (studentNames: string[], groupName?: string) => void;
  criteria: CriteriaItem[];
  addCriteria: (item: Omit<CriteriaItem, 'id'>) => void;
  updateCriteria: (id: string, updates: Partial<CriteriaItem>) => void;
  deleteCriteria: (id: string) => void;
  gifts: GiftItem[];
  addGift: (item: Omit<GiftItem, 'id'>) => void;
  updateGift: (id: string, updates: Partial<GiftItem>) => void;
  deleteGift: (id: string) => void;
  redeemGift: (giftId: string, studentId: string, note?: string) => { success: boolean; message: string };
  redemptions: GiftRedemptionRecord[];
  cancelRedemption: (redemptionId: string, refundStars?: boolean) => void;
  deleteRedemptionRecord: (redemptionId: string) => void;
  clearRedemptionHistory: () => void;
  attendance: Record<string, AttendanceRecord[]>;
  saveAttendance: (date: string, records: { studentId: string; status: AttendanceStatus }[]) => void;
  getAttendanceForDate: (date: string) => Record<string, AttendanceStatus>;
  activityLogs: RewardRecord[];
  rewardStudent: (studentId: string, points: number, reason: string) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  playSound: (type: 'praise' | 'penalty' | 'tick' | 'alarm') => void;
  isQuickRewardOpen: boolean;
  setIsQuickRewardOpen: (open: boolean) => void;
  selectedStudentForReward: Student | null;
  setSelectedStudentForReward: (stu: Student | null) => void;
  openRewardModalForStudent: (stu?: Student) => void;
  saveStatus: string;
  triggerManualSave: () => void;
  exportJSON: () => void;
  importJSON: (jsonString: string) => boolean;
  exportCSV: () => void;
  resetAllData: () => void;
  classes: ClassItem[];
  activeClassId: string;
  setActiveClassId: (id: string) => void;
  activeClass: ClassItem | undefined;
  addClass: (newClass: Omit<ClassItem, 'id'>) => void;
  updateClass: (id: string, updates: Partial<ClassItem>) => void;
  deleteClass: (id: string) => void;
  isAddClassModalOpen: boolean;
  setIsAddClassModalOpen: (open: boolean) => void;
  schedules: ScheduleItem[];
  teachers: TeacherInfo[];
  rooms: RoomInfo[];
  addRoom: (name: string, capacity?: number) => void;
  profile?: any;
  setIsPersonalizeModalOpen?: (open: boolean) => void;
  setFilterClassId?: (id: string | null) => void;
  deleteSchedule?: (id: string) => void;
  addSchedule?: (item: any) => void;
  updateSchedule?: (id: string, item: any) => void;
  resetScheduleToTemplate?: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  saveAttendanceBatch: (records: AttendanceRecord[]) => void;
  classroomGroups: Record<string, ClassroomGroup[]>;
  saveClassGroups: (classId: string, groups: ClassroomGroup[]) => void;
  batchRewardStudents: (studentIds: string[], points: number, reason: string) => void;
  schoolYearArchives: SchoolYearArchive[];
  createSchoolYearArchive: (schoolYear?: string, notes?: string) => SchoolYearArchive;
  deleteSchoolYearArchive: (archiveId: string) => void;
  restoreSchoolYearArchive: (archiveId: string) => boolean;
  startNewSchoolYear: (
    newSchoolYear: string,
    archiveCurrent: boolean,
    options?: { resetStars?: boolean; resetAttendance?: boolean; carryOverStudents?: boolean }
  ) => void;
  viewingArchive: SchoolYearArchive | null;
  setViewingArchive: (archive: SchoolYearArchive | null) => void;
  isBackgroundModalOpen: boolean;
  setIsBackgroundModalOpen: (open: boolean) => void;
  // Weekly & Year Evaluation Features
  weeklyEvaluations: WeeklyEvaluationRecord[];
  yearEvaluations: StudentYearEvaluation[];
  setWeeklyEvaluation: (
    studentId: string,
    weekNumber: number,
    level: EvaluationLevel,
    note?: string,
    targetClassId?: string
  ) => void;
  batchSetWeeklyEvaluations: (
    weekNumber: number,
    level: EvaluationLevel,
    targetClassId?: string
  ) => void;
  copyWeeklyEvaluationsFromPrevious: (
    currentWeekNumber: number,
    targetClassId?: string
  ) => number;
  setStudentYearEvaluation: (
    studentId: string,
    overrideLevel?: EvaluationLevel,
    finalRemark?: string,
    targetClassId?: string
  ) => void;
  deleteWeeklyEvaluation: (
    studentId: string,
    weekNumber: number,
    targetClassId?: string
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'vuon_uoc_mo_classroom_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [saveStatus, setSaveStatus] = useState<string>('Đã lưu');
  const [isQuickRewardOpen, setIsQuickRewardOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [selectedStudentForReward, setSelectedStudentForReward] = useState<Student | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3500);
  };

  // Load initial states from localStorage
  const [config, setConfig] = useState<ClassroomConfig>(() => {
    try {
      const saved =
        localStorage.getItem(`${STORAGE_KEY}_config`) ||
        localStorage.getItem('vuon_uoc_mo_classroom_v2_config') ||
        localStorage.getItem('classroom_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.teacherName === 'Cô Giáo Nga' || !parsed.teacherName) {
          parsed.teacherName = 'Thầy Nhân';
          parsed.teacherAvatar =
            'https://api.dicebear.com/7.x/bottts/svg?seed=ThayNhanTeacher&backgroundColor=bae6fd';
        }
        return {
          ...INITIAL_CONFIG,
          ...parsed,
          departmentName: parsed.departmentName || 'UBND XÃ NGUYỄN VIỆT KHÁI',
          schoolName: parsed.schoolName || 'TRƯỜNG TH-THCS RẠCH CHÈO',
          teacherName:
            parsed.teacherName === 'Cô Giáo Nga'
              ? 'Thầy Nhân'
              : parsed.teacherName || 'Thầy Nhân',
          teacherAvatar:
            parsed.teacherAvatar && !parsed.teacherAvatar.includes('NgaTeacher')
              ? parsed.teacherAvatar
              : 'https://api.dicebear.com/7.x/bottts/svg?seed=ThayNhanTeacher&backgroundColor=bae6fd',
        };
      }
      return INITIAL_CONFIG;
    } catch {
      return INITIAL_CONFIG;
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_students`);
      if (saved) {
        const parsed: Student[] = JSON.parse(saved);
        const hasOtherClasses = parsed.some(s => s.classIds?.some(cid => cid !== 'cls-1'));
        const cleaned = parsed.map(s => {
          const { group, ...rest } = s;
          return rest as Student;
        });
        if (!hasOtherClasses) {
          return cleaned.map((s, idx) => ({
            ...s,
            classIds: Array.from(new Set([...(s.classIds || ['cls-1']), idx < 16 ? 'cls-2' : 'cls-3'])),
          }));
        }
        return cleaned;
      }
      return INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [criteria, setCriteria] = useState<CriteriaItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_criteria`);
      return saved ? JSON.parse(saved) : INITIAL_CRITERIA;
    } catch {
      return INITIAL_CRITERIA;
    }
  });

  const [gifts, setGifts] = useState<GiftItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_gifts`);
      return saved ? JSON.parse(saved) : INITIAL_GIFTS;
    } catch {
      return INITIAL_GIFTS;
    }
  });

  const [redemptions, setRedemptions] = useState<GiftRedemptionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_redemptions`);
      return saved ? JSON.parse(saved) : INITIAL_REDEMPTIONS;
    } catch {
      return INITIAL_REDEMPTIONS;
    }
  });

  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord[]>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_attendance`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activityLogs, setActivityLogs] = useState<RewardRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_logs`);
      return saved ? JSON.parse(saved) : INITIAL_REWARDS;
    } catch {
      return INITIAL_REWARDS;
    }
  });

  const [classes, setClasses] = useState<ClassItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_classes`);
      return saved ? JSON.parse(saved) : INITIAL_CLASSES;
    } catch {
      return INITIAL_CLASSES;
    }
  });

  const [activeClassId, setActiveClassIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_active_class_id`);
      return saved || 'cls-1';
    } catch {
      return 'cls-1';
    }
  });

  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);

  // Classroom Groups state
  const [classroomGroups, setClassroomGroups] = useState<Record<string, ClassroomGroup[]>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_classroom_groups`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveClassGroups = (classId: string, groups: ClassroomGroup[]) => {
    setClassroomGroups(prev => {
      const updated = { ...prev, [classId]: groups };
      try {
        localStorage.setItem(`${STORAGE_KEY}_classroom_groups`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const batchRewardStudents = (studentIds: string[], points: number, reason: string) => {
    studentIds.forEach(id => {
      rewardStudent(id, points, reason);
    });
  };

  // Weekly & Year Evaluation State
  const [weeklyEvaluations, setWeeklyEvaluations] = useState<WeeklyEvaluationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_weekly_evaluations`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_WEEKLY_EVALUATIONS;
    } catch {
      return INITIAL_WEEKLY_EVALUATIONS;
    }
  });

  const [yearEvaluations, setYearEvaluations] = useState<StudentYearEvaluation[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_year_evaluations`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_YEAR_EVALUATIONS;
    } catch {
      return INITIAL_YEAR_EVALUATIONS;
    }
  });

  const setWeeklyEvaluation = (
    studentId: string,
    weekNumber: number,
    level: EvaluationLevel,
    note?: string,
    targetClassId?: string
  ) => {
    const student = students.find(s => s.id === studentId);
    const resolvedClassId = targetClassId || student?.classIds?.[0] || activeClassId;
    const semester: 1 | 2 = weekNumber <= 18 ? 1 : 2;
    const schoolYear = config.schoolYear || '2026-2027';

    setWeeklyEvaluations(prev => {
      const existingIdx = prev.findIndex(
        e => e.studentId === studentId && e.weekNumber === weekNumber && (!resolvedClassId || e.classId === resolvedClassId)
      );
      const record: WeeklyEvaluationRecord = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `wev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentId,
        classId: resolvedClassId,
        weekNumber,
        semester,
        schoolYear,
        level,
        note: note !== undefined ? note : (existingIdx >= 0 ? prev[existingIdx].note : undefined),
        updatedAt: new Date().toISOString(),
      };

      let next: WeeklyEvaluationRecord[];
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = record;
      } else {
        next = [record, ...prev];
      }

      try {
        localStorage.setItem(`${STORAGE_KEY}_weekly_evaluations`, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });

    playSound('praise');
  };

  const batchSetWeeklyEvaluations = (
    weekNumber: number,
    level: EvaluationLevel,
    targetClassId?: string
  ) => {
    const cid = targetClassId || activeClassId;
    const targetStudents = students.filter(s => s.classIds?.includes(cid));
    const semester: 1 | 2 = weekNumber <= 18 ? 1 : 2;
    const schoolYear = config.schoolYear || '2026-2027';
    const nowIso = new Date().toISOString();

    setWeeklyEvaluations(prev => {
      const map = new Map<string, WeeklyEvaluationRecord>();
      prev.forEach(ev => {
        map.set(`${ev.studentId}-${ev.weekNumber}`, ev);
      });

      targetStudents.forEach(stu => {
        const existing = map.get(`${stu.id}-${weekNumber}`);
        map.set(`${stu.id}-${weekNumber}`, {
          id: existing ? existing.id : `wev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          studentId: stu.id,
          classId: cid,
          weekNumber,
          semester,
          schoolYear,
          level,
          note: existing?.note,
          updatedAt: nowIso,
        });
      });

      const next = Array.from(map.values());
      try {
        localStorage.setItem(`${STORAGE_KEY}_weekly_evaluations`, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });

    playSound('praise');
    showToast(`Đã gán nhanh tất cả học sinh Tuần ${weekNumber} là "${level}"!`, 'success');
  };

  const copyWeeklyEvaluationsFromPrevious = (
    currentWeekNumber: number,
    targetClassId?: string
  ): number => {
    if (currentWeekNumber <= 1) {
      showToast('Tuần 1 là tuần bắt đầu năm học, không có tuần trước để sao chép!', 'info');
      return 0;
    }
    const prevWeekNumber = currentWeekNumber - 1;
    const cid = targetClassId || activeClassId;
    const targetStudents = students.filter(s => s.classIds?.includes(cid));
    const semester: 1 | 2 = currentWeekNumber <= 18 ? 1 : 2;
    const schoolYear = config.schoolYear || '2026-2027';
    const nowIso = new Date().toISOString();

    let copiedCount = 0;
    setWeeklyEvaluations(prev => {
      const prevWeekMap = new Map<string, WeeklyEvaluationRecord>();
      prev
        .filter(e => e.weekNumber === prevWeekNumber && (!cid || e.classId === cid))
        .forEach(e => {
          prevWeekMap.set(e.studentId, e);
        });

      const map = new Map<string, WeeklyEvaluationRecord>();
      prev.forEach(ev => {
        map.set(`${ev.studentId}-${ev.weekNumber}`, ev);
      });

      targetStudents.forEach(stu => {
        const prevEval = prevWeekMap.get(stu.id);
        if (prevEval) {
          const existing = map.get(`${stu.id}-${currentWeekNumber}`);
          map.set(`${stu.id}-${currentWeekNumber}`, {
            id: existing ? existing.id : `wev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            studentId: stu.id,
            classId: cid,
            weekNumber: currentWeekNumber,
            semester,
            schoolYear,
            level: prevEval.level,
            note: prevEval.note,
            updatedAt: nowIso,
          });
          copiedCount++;
        }
      });

      const next = Array.from(map.values());
      try {
        localStorage.setItem(`${STORAGE_KEY}_weekly_evaluations`, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });

    playSound('praise');
    showToast(`Đã sao chép nhận xét từ Tuần ${prevWeekNumber} cho ${copiedCount} học sinh!`, 'success');
    return copiedCount;
  };

  const setStudentYearEvaluation = (
    studentId: string,
    overrideLevel?: EvaluationLevel,
    finalRemark?: string,
    targetClassId?: string
  ) => {
    const student = students.find(s => s.id === studentId);
    const resolvedClassId = targetClassId || student?.classIds?.[0] || activeClassId;
    const schoolYear = config.schoolYear || '2026-2027';

    setYearEvaluations(prev => {
      const existingIdx = prev.findIndex(
        y => y.studentId === studentId && (!resolvedClassId || y.classId === resolvedClassId)
      );

      const updatedRecord: StudentYearEvaluation = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `yev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentId,
        classId: resolvedClassId,
        schoolYear,
        overrideLevel,
        finalRemark,
        updatedAt: new Date().toISOString(),
      };

      let next: StudentYearEvaluation[];
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = updatedRecord;
      } else {
        next = [updatedRecord, ...prev];
      }

      try {
        localStorage.setItem(`${STORAGE_KEY}_year_evaluations`, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });

    playSound('praise');
    showToast('Đã lưu kết quả đánh giá cuối năm!', 'success');
  };

  const deleteWeeklyEvaluation = (
    studentId: string,
    weekNumber: number,
    targetClassId?: string
  ) => {
    const cid = targetClassId || activeClassId;
    setWeeklyEvaluations(prev => {
      const next = prev.filter(
        e => !(e.studentId === studentId && e.weekNumber === weekNumber && (!cid || e.classId === cid))
      );
      try {
        localStorage.setItem(`${STORAGE_KEY}_weekly_evaluations`, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
    showToast(`Đã hủy nhận xét Tuần ${weekNumber}.`, 'info');
  };

  // School Year Archives management
  const [schoolYearArchives, setSchoolYearArchives] = useState<SchoolYearArchive[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_school_year_archives`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [viewingArchive, setViewingArchive] = useState<SchoolYearArchive | null>(null);

  const createSchoolYearArchive = (targetSchoolYear?: string, notes?: string): SchoolYearArchive => {
    const yr = targetSchoolYear || config.schoolYear || '2026-2027';
    const totalStars = students.reduce((sum, s) => sum + s.stars, 0);
    const newArchive: SchoolYearArchive = {
      id: `archive-${Date.now()}`,
      schoolYear: yr,
      createdAt: new Date().toISOString(),
      notes: notes || `Lưu trữ hồ sơ năm học ${yr}`,
      studentCount: students.length,
      classCount: classes.length,
      totalStarsAwarded: totalStars,
      totalRedemptions: redemptions.length,
      snapshot: {
        config: { ...config, schoolYear: yr },
        students: JSON.parse(JSON.stringify(students)),
        classes: JSON.parse(JSON.stringify(classes)),
        criteria: JSON.parse(JSON.stringify(criteria)),
        gifts: JSON.parse(JSON.stringify(gifts)),
        redemptions: JSON.parse(JSON.stringify(redemptions)),
        rewards: JSON.parse(JSON.stringify(activityLogs)),
        classroomGroups: JSON.parse(JSON.stringify(classroomGroups)),
        schedules: JSON.parse(JSON.stringify(schedules)),
        weeklyEvaluations: JSON.parse(JSON.stringify(weeklyEvaluations)),
        yearEvaluations: JSON.parse(JSON.stringify(yearEvaluations)),
      },
    };

    setSchoolYearArchives(prev => {
      const filtered = prev.filter(a => a.id !== newArchive.id);
      const updated = [newArchive, ...filtered];
      try {
        localStorage.setItem(`${STORAGE_KEY}_school_year_archives`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    showToast(`Đã tạo bản lưu trữ thành công cho năm học ${yr}!`, 'success');
    return newArchive;
  };

  const deleteSchoolYearArchive = (archiveId: string) => {
    setSchoolYearArchives(prev => {
      const updated = prev.filter(a => a.id !== archiveId);
      try {
        localStorage.setItem(`${STORAGE_KEY}_school_year_archives`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    if (viewingArchive?.id === archiveId) {
      setViewingArchive(null);
    }
    showToast('Đã xóa bản lưu trữ năm học.', 'info');
  };

  const restoreSchoolYearArchive = (archiveId: string): boolean => {
    const archive = schoolYearArchives.find(a => a.id === archiveId);
    if (!archive) return false;

    const snap = archive.snapshot;
    if (snap.config) setConfig(snap.config);
    if (snap.students) setStudents(snap.students);
    if (snap.classes) setClasses(snap.classes);
    if (snap.criteria) setCriteria(snap.criteria);
    if (snap.gifts) setGifts(snap.gifts);
    if (snap.redemptions) setRedemptions(snap.redemptions);
    if (snap.rewards) setActivityLogs(snap.rewards);
    if (snap.classroomGroups) setClassroomGroups(snap.classroomGroups);
    if (snap.schedules && Array.isArray(snap.schedules)) setSchedules(snap.schedules);
    if (snap.weeklyEvaluations && Array.isArray(snap.weeklyEvaluations)) setWeeklyEvaluations(snap.weeklyEvaluations);
    if (snap.yearEvaluations && Array.isArray(snap.yearEvaluations)) setYearEvaluations(snap.yearEvaluations);

    try {
      localStorage.setItem(`${STORAGE_KEY}_config`, JSON.stringify(snap.config));
      localStorage.setItem(`${STORAGE_KEY}_students`, JSON.stringify(snap.students));
      localStorage.setItem(`${STORAGE_KEY}_classes`, JSON.stringify(snap.classes));
      localStorage.setItem(`${STORAGE_KEY}_criteria`, JSON.stringify(snap.criteria));
      localStorage.setItem(`${STORAGE_KEY}_gifts`, JSON.stringify(snap.gifts));
      localStorage.setItem(`${STORAGE_KEY}_redemptions`, JSON.stringify(snap.redemptions));
      localStorage.setItem(`${STORAGE_KEY}_logs`, JSON.stringify(snap.rewards));
      localStorage.setItem(`${STORAGE_KEY}_classroom_groups`, JSON.stringify(snap.classroomGroups || {}));
      if (snap.schedules && Array.isArray(snap.schedules)) {
        localStorage.setItem(`${STORAGE_KEY}_schedules`, JSON.stringify(snap.schedules));
      }
      if (snap.weeklyEvaluations && Array.isArray(snap.weeklyEvaluations)) {
        localStorage.setItem(`${STORAGE_KEY}_weekly_evaluations`, JSON.stringify(snap.weeklyEvaluations));
      }
      if (snap.yearEvaluations && Array.isArray(snap.yearEvaluations)) {
        localStorage.setItem(`${STORAGE_KEY}_year_evaluations`, JSON.stringify(snap.yearEvaluations));
      }
    } catch (e) {
      console.error(e);
    }

    showToast(`Đã khôi phục dữ liệu năm học ${archive.schoolYear}!`, 'success');
    return true;
  };

  const startNewSchoolYear = (
    newSchoolYear: string,
    archiveCurrent: boolean,
    options: { resetStars?: boolean; resetAttendance?: boolean; carryOverStudents?: boolean } = {
      resetStars: true,
      resetAttendance: true,
      carryOverStudents: true,
    }
  ) => {
    if (archiveCurrent) {
      createSchoolYearArchive(
        config.schoolYear || '2026-2027',
        `Tự động lưu trữ trước khi chuyển sang năm học mới ${newSchoolYear}`
      );
    }

    updateConfig({ schoolYear: newSchoolYear });

    setStudents(prev => {
      let updated: Student[] = [];
      if (options.carryOverStudents) {
        updated = prev.map(s => ({
          ...s,
          stars: options.resetStars ? 0 : s.stars,
          periodStars: {},
          attendanceRate: 100,
        }));
      }
      try {
        localStorage.setItem(`${STORAGE_KEY}_students`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    setRedemptions([]);
    setActivityLogs([]);
    try {
      localStorage.setItem(`${STORAGE_KEY}_redemptions`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_KEY}_logs`, JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }

    showToast(`Đã bắt đầu năm học mới ${newSchoolYear}! Dữ liệu cũ đã được lưu trữ an toàn.`, 'success');
  };

  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_schedules`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SCHEDULES;
  });

  const addSchedule = (newSchedule: Omit<ScheduleItem, 'id'>) => {
    const id = `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const created: ScheduleItem = {
      ...newSchedule,
      id,
    };
    setSchedules((prev) => {
      const updated = [...prev, created];
      try {
        localStorage.setItem(`${STORAGE_KEY}_schedules`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    playSound('praise');
    showToast(`Đã thêm tiết: ${created.shortCode || created.subject}!`, 'success');
  };

  const updateSchedule = (id: string, updates: Partial<ScheduleItem>) => {
    setSchedules((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      try {
        localStorage.setItem(`${STORAGE_KEY}_schedules`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    playSound('praise');
    showToast('Đã cập nhật tiết học!', 'success');
  };

  const deleteSchedule = (id: string) => {
    setSchedules((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(`${STORAGE_KEY}_schedules`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    playSound('penalty');
    showToast('Đã xóa tiết học.', 'info');
  };

  const resetScheduleToTemplate = () => {
    setSchedules(INITIAL_SCHEDULES);
    try {
      localStorage.setItem(`${STORAGE_KEY}_schedules`, JSON.stringify(INITIAL_SCHEDULES));
    } catch (e) {
      console.error(e);
    }
    playSound('praise');
    showToast('Đã nạp lại thời khóa biểu chuẩn mẫu!', 'success');
  };
  const [teachers] = useState<TeacherInfo[]>(INITIAL_TEACHERS);
  const [rooms, setRooms] = useState<RoomInfo[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_rooms`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ROOMS;
  });

  const addRoom = (roomName: string, capacity = 35) => {
    const trimmed = roomName.trim();
    if (!trimmed) return;
    setRooms((prev) => {
      if (prev.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) return prev;
      const newRoom: RoomInfo = {
        id: `room-${Date.now()}`,
        name: trimmed,
        capacity,
        equipment: ['Dàn máy vi tính', 'Máy chiếu'],
      };
      const updated = [newRoom, ...prev];
      try {
        localStorage.setItem(`${STORAGE_KEY}_rooms`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    showToast(`Đã thêm phòng học: "${trimmed}"`, 'success');
  };

  const activeClass = classes.find(c => c.id === activeClassId) || classes[0];

  const setActiveClassId = (id: string) => {
    setActiveClassIdState(id);
    try {
      localStorage.setItem(`${STORAGE_KEY}_active_class_id`, id);
      const target = classes.find(c => c.id === id);
      if (target) {
        setConfig(prev => ({ ...prev, className: target.name }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addClass = (newClass: Omit<ClassItem, 'id'>) => {
    const id = `cls-${Date.now()}`;
    const created: ClassItem = {
      ...newClass,
      id,
      currentStudents: 0,
      status: 'active',
      color: newClass.color || '#0284c7',
    };
    setClasses(prev => [...prev, created]);
    setActiveClassId(id);
    setConfig(prev => ({ ...prev, className: created.name }));
    playSound('praise');
  };

  const updateClass = (id: string, updates: Partial<ClassItem>) => {
    setClasses(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    if (activeClassId === id && updates.name) {
      setConfig(prev => ({ ...prev, className: updates.name! }));
    }
    playSound('praise');
  };

  const deleteClass = (id: string) => {
    if (classes.length <= 1) {
      alert('Không thể xóa lớp học duy nhất còn lại!');
      return;
    }
    setClasses(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (activeClassId === id && filtered.length > 0) {
        setActiveClassId(filtered[0].id);
      }
      return filtered;
    });
    playSound('penalty');
  };

  // Auto-save on state changes
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_config`, JSON.stringify(config));
      localStorage.setItem(`${STORAGE_KEY}_students`, JSON.stringify(students));
      localStorage.setItem(`${STORAGE_KEY}_criteria`, JSON.stringify(criteria));
      localStorage.setItem(`${STORAGE_KEY}_gifts`, JSON.stringify(gifts));
      localStorage.setItem(`${STORAGE_KEY}_redemptions`, JSON.stringify(redemptions));
      localStorage.setItem(`${STORAGE_KEY}_attendance`, JSON.stringify(attendance));
      localStorage.setItem(`${STORAGE_KEY}_logs`, JSON.stringify(activityLogs));
      localStorage.setItem(`${STORAGE_KEY}_classes`, JSON.stringify(classes));
      localStorage.setItem(`${STORAGE_KEY}_active_class_id`, activeClassId);
      localStorage.setItem(`${STORAGE_KEY}_weekly_evaluations`, JSON.stringify(weeklyEvaluations));
      localStorage.setItem(`${STORAGE_KEY}_year_evaluations`, JSON.stringify(yearEvaluations));
      setSaveStatus('Đã lưu');
    } catch {
      setSaveStatus('Lỗi lưu');
    }
  }, [config, students, criteria, gifts, redemptions, attendance, activityLogs, classes, activeClassId, weeklyEvaluations, yearEvaluations]);

  // Ensure teacherName is Thầy Nhân and sanitize avatar
  useEffect(() => {
    if (config.teacherName === 'Cô Giáo Nga' || !config.teacherName) {
      setConfig(prev => ({
        ...prev,
        teacherName: 'Thầy Nhân',
        teacherAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ThayNhanTeacher&backgroundColor=bae6fd',
      }));
    }
  }, [config.teacherName]);

  // If user had activeTab as 'students', redirect to 'overview'
  useEffect(() => {
    if ((activeTab as string) === 'students') {
      setActiveTab('overview');
    }
  }, [activeTab]);

  const triggerManualSave = () => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_config`, JSON.stringify(config));
      localStorage.setItem(`${STORAGE_KEY}_students`, JSON.stringify(students));
      localStorage.setItem(`${STORAGE_KEY}_criteria`, JSON.stringify(criteria));
      localStorage.setItem(`${STORAGE_KEY}_gifts`, JSON.stringify(gifts));
      localStorage.setItem(`${STORAGE_KEY}_redemptions`, JSON.stringify(redemptions));
      localStorage.setItem(`${STORAGE_KEY}_attendance`, JSON.stringify(attendance));
      localStorage.setItem(`${STORAGE_KEY}_logs`, JSON.stringify(activityLogs));
      localStorage.setItem(`${STORAGE_KEY}_classes`, JSON.stringify(classes));
      localStorage.setItem(`${STORAGE_KEY}_active_class_id`, activeClassId);
      localStorage.setItem(`${STORAGE_KEY}_weekly_evaluations`, JSON.stringify(weeklyEvaluations));
      localStorage.setItem(`${STORAGE_KEY}_year_evaluations`, JSON.stringify(yearEvaluations));
      playSound('praise');
      setSaveStatus('Đã lưu thành công!');
      setTimeout(() => setSaveStatus('Đã lưu'), 2500);
    } catch (e) {
      console.error(e);
      setSaveStatus('Lỗi lưu trữ');
    }
  };

  const playSound = (type: 'praise' | 'penalty' | 'tick' | 'alarm') => {
    if (!config.soundEnabled) return;
    if (type === 'praise') playChime(true);
    else if (type === 'penalty') playPenaltyChime(true);
    else if (type === 'tick') playTick(true);
    else if (type === 'alarm') playAlarmSound(true);
  };

  const toggleSound = () => {
    setConfig(prev => {
      const next = !prev.soundEnabled;
      return { ...prev, soundEnabled: next };
    });
  };

  const updateConfig = (newConfig: Partial<ClassroomConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const addStudent = (newStu: Omit<Student, 'id'>) => {
    const id = `stu-${Date.now()}`;
    const assignedClasses = newStu.classIds && newStu.classIds.length > 0 ? newStu.classIds : [activeClassId];
    setStudents(prev => [...prev, { ...newStu, id, classIds: assignedClasses }]);
    playSound('praise');
  };

  const addStudentToClass = (newStu: Omit<Student, 'id'>, targetClassId: string): Student => {
    const id = `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const classIds = Array.from(new Set([...(newStu.classIds || []), targetClassId]));
    const student: Student = {
      ...newStu,
      id,
      classIds,
    };
    setStudents(prev => [...prev, student]);
    setClasses(prev =>
      prev.map(c => (c.id === targetClassId ? { ...c, currentStudents: (c.currentStudents || 0) + 1 } : c))
    );
    playSound('praise');
    return student;
  };

  const addMultipleStudentsToClass = (
    rows: Array<Partial<Student> & { name: string }>,
    targetClassId: string
  ): number => {
    const cuteIcons = ['🐼', '🐨', '🐱', '🐻', '🦁', '🐰', '🐯', '🦊', '🐶', '🦄', '🐬', '🐧', '🐘', '🐥'];
    let count = 0;
    const newItems: Student[] = [];

    rows.forEach((row, index) => {
      if (!row.name || !row.name.trim()) return;
      const randomIcon = cuteIcons[Math.floor(Math.random() * cuteIcons.length)];
      const id = `stu-xl-${Date.now()}-${index}`;
      const code = row.code || `HS-${String(students.length + count + 1).padStart(3, '0')}`;

      const newStudent: Student = {
        id,
        code,
        name: row.name.trim(),
        gender: row.gender === 'Nữ' ? 'Nữ' : 'Nam',
        dob: row.dob,
        phone: row.phone,
        parentName: row.parentName,
        parentPhone: row.parentPhone,
        classIds: [targetClassId],
        stars: row.stars ?? 0,
        attendanceRate: 100,
        status: 'studying',
        avatar: row.avatar || randomIcon,
      };
      newItems.push(newStudent);
      count++;
    });

    if (newItems.length > 0) {
      setStudents(prev => [...prev, ...newItems]);
      setClasses(prev =>
        prev.map(c =>
          c.id === targetClassId
            ? { ...c, currentStudents: (c.currentStudents || 0) + newItems.length }
            : c
        )
      );
      playSound('praise');
    }
    return count;
  };

  const removeStudentFromClass = (studentId: string, classId: string) => {
    setStudents(prev =>
      prev
        .map(s => {
          if (s.id !== studentId) return s;
          return {
            ...s,
            classIds: s.classIds.filter(id => id !== classId),
          };
        })
        .filter(s => s.classIds.length > 0)
    );
    setClasses(prev =>
      prev.map(c =>
        c.id === classId
          ? { ...c, currentStudents: Math.max(0, (c.currentStudents || 1) - 1) }
          : c
      )
    );
    playSound('penalty');
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    playSound('penalty');
  };

  const resetStudents = () => {
    setStudents(INITIAL_STUDENTS);
  };

  const importStudentList = (studentNames: string[]) => {
    const cuteIcons = ['🐼', '🐨', '🐱', '🐻', '🦁', '🐰', '🐯', '🦊', '🐶', '🦄'];
    const newItems: Student[] = studentNames.map((name, index) => {
      const randomIcon = cuteIcons[Math.floor(Math.random() * cuteIcons.length)];
      return {
        id: `stu-imp-${Date.now()}-${index}`,
        code: `HS-${String(students.length + index + 1).padStart(3, '0')}`,
        name: name.trim(),
        gender: 'Nam',
        stars: 0,
        attendanceRate: 100,
        status: 'studying',
        avatar: randomIcon,
        classIds: [activeClassId],
      };
    });
    setStudents(prev => [...prev, ...newItems]);
    playSound('praise');
  };

  const addCriteria = (item: Omit<CriteriaItem, 'id'>) => {
    const id = `crit-${Date.now()}`;
    setCriteria(prev => [...prev, { ...item, id }]);
    playSound('praise');
  };

  const updateCriteria = (id: string, updates: Partial<CriteriaItem>) => {
    setCriteria(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCriteria = (id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
    playSound('penalty');
  };

  const addGift = (item: Omit<GiftItem, 'id'>) => {
    const id = `gift-${Date.now()}`;
    setGifts(prev => [...prev, { ...item, id, redeemedCount: 0 }]);
    playSound('praise');
  };

  const updateGift = (id: string, updates: Partial<GiftItem>) => {
    setGifts(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g)));
  };

  const deleteGift = (id: string) => {
    setGifts(prev => prev.filter(g => g.id !== id));
  };

  const redeemGift = (giftId: string, studentId: string, note?: string): { success: boolean; message: string } => {
    const gift = gifts.find(g => g.id === giftId);
    const student = students.find(s => s.id === studentId);

    if (!gift || !student) {
      return { success: false, message: 'Không tìm thấy quà hoặc học sinh.' };
    }

    if (student.stars < gift.cost) {
      playSound('penalty');
      return {
        success: false,
        message: `${student.name} còn thiếu ${gift.cost - student.stars} ⭐ để đổi phần thưởng này!`
      };
    }

    // Deduct stars
    setStudents(prev =>
      prev.map(s =>
        s.id === studentId ? { ...s, stars: Math.max(0, s.stars - gift.cost) } : s
      )
    );

    // Increment redeemed count
    setGifts(prev =>
      prev.map(g => (g.id === giftId ? { ...g, redeemedCount: (g.redeemedCount || 0) + 1 } : g))
    );

    // Record activity log and redemption history
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes} - ${day}/${month}/${year}`;

    const studentClass = classes.find(c => student.classIds?.includes(c.id)) || activeClass;

    const redemptionRecord: GiftRedemptionRecord = {
      id: `rdm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      giftId: gift.id,
      giftName: gift.name,
      giftIcon: gift.icon,
      cost: gift.cost,
      studentId: student.id,
      studentName: student.name,
      studentCode: student.code,
      studentAvatar: student.avatar,
      classId: studentClass?.id,
      className: studentClass?.name,
      redeemedAt: now.toISOString(),
      dateFormatted: timeStr,
      status: 'completed',
      note: note?.trim() || `Đổi bằng ${gift.cost} sao`,
    };

    setRedemptions(prev => [redemptionRecord, ...prev]);

    const currentWeek = getCurrentSchoolWeek(now);
    const currentMonth = now.getMonth() + 1;
    const currentSemester = getCurrentSchoolSemester(now);
    const dateStr = now.toISOString().split('T')[0];

    const log: RewardRecord = {
      id: `rew-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      type: 'reward',
      points: -gift.cost,
      reason: `Đổi quà: ${gift.name}`,
      createdAt: `Hôm nay, ${hours}:${minutes}`,
      timestamp: now.toISOString(),
      date: dateStr,
      weekNumber: currentWeek,
      month: currentMonth,
      semester: currentSemester,
    };
    setActivityLogs(prev => [log, ...prev]);

    playSound('praise');
    showToast(`Đã đổi quà "${gift.name}" cho ${student.name} (-${gift.cost} ⭐)!`, 'success');
    return {
      success: true,
      message: `Chúc mừng ${student.name} đã đổi thành công "${gift.name}"!`
    };
  };

  const cancelRedemption = (redemptionId: string, refundStars: boolean = true) => {
    const record = redemptions.find(r => r.id === redemptionId);
    if (!record) return;

    if (refundStars && record.status !== 'cancelled') {
      setStudents(prev =>
        prev.map(s => (s.id === record.studentId ? { ...s, stars: s.stars + record.cost } : s))
      );
      setGifts(prev =>
        prev.map(g => (g.id === record.giftId ? { ...g, redeemedCount: Math.max(0, (g.redeemedCount || 1) - 1) } : g))
      );
    }

    setRedemptions(prev =>
      prev.map(r => (r.id === redemptionId ? { ...r, status: 'cancelled' } : r))
    );
    playSound('praise');
    showToast(`Đã hủy đổi quà và hoàn lại ${record.cost} sao cho ${record.studentName}!`, 'info');
  };

  const deleteRedemptionRecord = (redemptionId: string) => {
    setRedemptions(prev => prev.filter(r => r.id !== redemptionId));
    showToast('Đã xóa dòng lịch sử đổi quà.', 'info');
  };

  const clearRedemptionHistory = () => {
    setRedemptions([]);
    showToast('Đã dọn sạch toàn bộ lịch sử đổi quà.', 'info');
  };

  const rewardStudent = (studentId: string, points: number, reason: string) => {
    const stu = students.find(s => s.id === studentId);
    if (!stu) return;

    const now = new Date();
    const currentWeek = getCurrentSchoolWeek(now);
    const currentMonth = now.getMonth() + 1;
    const currentSemester = getCurrentSchoolSemester(now);
    const dateStr = now.toISOString().split('T')[0];

    setStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          const updatedStars = Math.max(0, s.stars + points);

          // Update period stars for this student
          const prevWeekStars = s.periodStars?.week?.[`w${currentWeek}`] ?? Math.ceil(s.stars * 0.45);
          const prevMonthStars = s.periodStars?.month?.[`m${currentMonth}`] ?? s.stars;
          const prevSemStars = currentSemester === 1 
            ? (s.periodStars?.semester?.hk1 ?? s.stars)
            : (s.periodStars?.semester?.hk2 ?? 0);

          const updatedPeriodStars = {
            week: {
              ...(s.periodStars?.week || {}),
              [`w${currentWeek}`]: Math.max(0, prevWeekStars + points),
            },
            month: {
              ...(s.periodStars?.month || {}),
              [`m${currentMonth}`]: Math.max(0, prevMonthStars + points),
            },
            semester: {
              hk1: currentSemester === 1 ? Math.max(0, prevSemStars + points) : (s.periodStars?.semester?.hk1 || s.stars),
              hk2: currentSemester === 2 ? Math.max(0, prevSemStars + points) : (s.periodStars?.semester?.hk2 || 0),
            },
          };

          return { ...s, stars: updatedStars, periodStars: updatedPeriodStars };
        }
        return s;
      })
    );

    const timeStr = `Hôm nay, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const log: RewardRecord = {
      id: `rew-${Date.now()}`,
      studentId: stu.id,
      studentName: stu.name,
      type: points >= 0 ? 'reward' : 'penalty',
      points,
      reason,
      createdAt: timeStr,
      timestamp: now.toISOString(),
      date: dateStr,
      weekNumber: currentWeek,
      month: currentMonth,
      semester: currentSemester,
    };
    setActivityLogs(prev => [log, ...prev.slice(0, 199)]);

    if (points >= 0) playSound('praise');
    else playSound('penalty');
  };

  const saveAttendance = (date: string, records: { studentId: string; status: AttendanceStatus }[]) => {
    const formattedRecords: AttendanceRecord[] = records.map((r) => ({
      id: `att-${date}-${r.studentId}`,
      date,
      studentId: r.studentId,
      status: r.status,
      checkInTime: '07:30',
    }));

    setAttendance(prev => {
      const existing = prev[date] || [];
      const map = new Map<string, AttendanceRecord>();
      existing.forEach(rec => map.set(rec.studentId, rec));
      formattedRecords.forEach(rec => map.set(rec.studentId, rec));

      return {
        ...prev,
        [date]: Array.from(map.values()),
      };
    });

    playSound('praise');
    setSaveStatus('Đã lưu điểm danh!');
    setTimeout(() => setSaveStatus('Đã lưu'), 2500);
  };

  const saveAttendanceBatch = (records: AttendanceRecord[]) => {
    if (records.length === 0) return;
    const date = records[0].date;
    setAttendance(prev => {
      const existing = prev[date] || [];
      const map = new Map<string, AttendanceRecord>();
      existing.forEach(rec => map.set(rec.studentId, rec));
      records.forEach(rec => map.set(rec.studentId, rec));

      return {
        ...prev,
        [date]: Array.from(map.values()),
      };
    });

    playSound('praise');
    setSaveStatus('Đã lưu điểm danh!');
    setTimeout(() => setSaveStatus('Đã lưu'), 2500);
    showToast(`Đã lưu kết quả điểm danh cho ${records.length} học sinh!`, 'success');
  };

  const getAttendanceForDate = (date: string): Record<string, AttendanceStatus> => {
    const dayRecords = attendance[date] || [];
    const map: Record<string, AttendanceStatus> = {};
    dayRecords.forEach(r => {
      map[r.studentId] = r.status;
    });
    return map;
  };

  const openRewardModalForStudent = (stu?: Student) => {
    setSelectedStudentForReward(stu || null);
    setIsQuickRewardOpen(true);
  };

  const exportJSON = () => {
    const backupData: SchoolYearFullBackup = {
      version: '3.0',
      type: 'FULL_SCHOOL_YEAR_BACKUP',
      schoolYear: config.schoolYear || '2026-2027',
      schoolName: config.schoolName,
      departmentName: config.departmentName,
      teacherName: config.teacherName,
      exportDate: new Date().toISOString(),
      summary: {
        totalClasses: classes.length,
        classNames: classes.map(c => c.name),
        totalStudents: students.length,
        totalSchedules: schedules.length,
        totalCriteria: criteria.length,
        totalGifts: gifts.length,
        totalRedemptions: redemptions.length,
        totalActivityLogs: activityLogs.length,
        totalWeeklyEvaluations: weeklyEvaluations.length,
      },
      config,
      classes,
      students,
      schedules,
      attendance,
      classroomGroups,
      rooms,
      criteria,
      gifts,
      redemptions,
      activityLogs,
      weeklyEvaluations,
      yearEvaluations,
      schoolYearArchives,
      activeClassId,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const safeYear = (config.schoolYear || '2026-2027').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadAnchor.setAttribute('download', `Sao_Luu_Toan_Bo_Cac_Lop_Nam_${safeYear}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    playSound('praise');
    showToast(`Đã xuất tệp sao lưu toàn bộ ${classes.length} lớp học năm học ${config.schoolYear || '2026-2027'}!`, 'success');
  };

  const importJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      let targetConfig = data.config;
      let targetClasses = data.classes;
      let targetStudents = data.students;
      let targetSchedules = data.schedules;
      let targetAttendance = data.attendance;
      let targetGroups = data.classroomGroups;
      let targetRooms = data.rooms;
      let targetCriteria = data.criteria;
      let targetGifts = data.gifts;
      let targetRedemptions = data.redemptions;
      let targetActivityLogs = data.activityLogs || data.rewards;
      let targetWeeklyEvaluations = data.weeklyEvaluations;
      let targetYearEvaluations = data.yearEvaluations;
      let targetArchives = data.schoolYearArchives;
      let targetActiveClassId = data.activeClassId;

      // In case user imported an archive object directly
      if (data.snapshot) {
        targetConfig = data.snapshot.config || targetConfig;
        targetClasses = data.snapshot.classes || targetClasses;
        targetStudents = data.snapshot.students || targetStudents;
        targetSchedules = data.snapshot.schedules || targetSchedules;
        targetCriteria = data.snapshot.criteria || targetCriteria;
        targetGifts = data.snapshot.gifts || targetGifts;
        targetRedemptions = data.snapshot.redemptions || targetRedemptions;
        targetActivityLogs = data.snapshot.rewards || targetActivityLogs;
        targetGroups = data.snapshot.classroomGroups || targetGroups;
        targetWeeklyEvaluations = data.snapshot.weeklyEvaluations || targetWeeklyEvaluations;
        targetYearEvaluations = data.snapshot.yearEvaluations || targetYearEvaluations;
      }

      if (targetConfig) {
        setConfig(targetConfig);
        try {
          localStorage.setItem(`${STORAGE_KEY}_config`, JSON.stringify(targetConfig));
        } catch (e) {
          console.error(e);
        }
      }
      if (Array.isArray(targetClasses) && targetClasses.length > 0) {
        setClasses(targetClasses);
        try {
          localStorage.setItem(`${STORAGE_KEY}_classes`, JSON.stringify(targetClasses));
        } catch (e) {
          console.error(e);
        }
      }
      if (Array.isArray(targetStudents)) {
        setStudents(targetStudents);
        try {
          localStorage.setItem(`${STORAGE_KEY}_students`, JSON.stringify(targetStudents));
        } catch (e) {
          console.error(e);
        }
      }
      if (Array.isArray(targetSchedules)) {
        setSchedules(targetSchedules);
        try {
          localStorage.setItem(`${STORAGE_KEY}_schedules`, JSON.stringify(targetSchedules));
        } catch (e) {
          console.error(e);
        }
      }
      if (targetAttendance && typeof targetAttendance === 'object') {
        setAttendance(targetAttendance);
        try {
          localStorage.setItem(`${STORAGE_KEY}_attendance`, JSON.stringify(targetAttendance));
        } catch (e) {
          console.error(e);
        }
      }
      if (targetGroups && typeof targetGroups === 'object') {
        setClassroomGroups(targetGroups);
        try {
          localStorage.setItem(`${STORAGE_KEY}_classroom_groups`, JSON.stringify(targetGroups));
        } catch (e) {
          console.error(e);
        }
      }
      if (Array.isArray(targetRooms) && targetRooms.length > 0) {
        setRooms(targetRooms);
        try {
          localStorage.setItem(`${STORAGE_KEY}_rooms`, JSON.stringify(targetRooms));
        } catch (e) {
          console.error(e);
        }
      }
      if (Array.isArray(targetCriteria)) {
        setCriteria(targetCriteria);
        try {
          localStorage.setItem(`${STORAGE_KEY}_criteria`, JSON.stringify(targetCriteria));
        } catch (e) {
          console.error(e);
        }
      }
      if (Array.isArray(targetGifts)) {
        setGifts(targetGifts);
        try {
          localStorage.setItem(`${STORAGE_KEY}_gifts`, JSON.stringify(targetGifts));
        } catch (e) {
          console.error(e);
        }
      }
      if (Array.isArray(targetRedemptions)) {
        setRedemptions(targetRedemptions);
        try {
          localStorage.setItem(`${STORAGE_KEY}_redemptions`, JSON.stringify(targetRedemptions));
        } catch (e) {
          console.error(e);
        }
      }
      if (Array.isArray(targetActivityLogs)) {
        setActivityLogs(targetActivityLogs);
        try {
          localStorage.setItem(`${STORAGE_KEY}_logs`, JSON.stringify(targetActivityLogs));
        } catch (e) {
          console.error(e);
        }
      }
      if (Array.isArray(targetWeeklyEvaluations)) {
        setWeeklyEvaluations(targetWeeklyEvaluations);
        try {
          localStorage.setItem(`${STORAGE_KEY}_weekly_evaluations`, JSON.stringify(targetWeeklyEvaluations));
        } catch (e) {
          console.error(e);
        }
      }
      if (Array.isArray(targetYearEvaluations)) {
        setYearEvaluations(targetYearEvaluations);
        try {
          localStorage.setItem(`${STORAGE_KEY}_year_evaluations`, JSON.stringify(targetYearEvaluations));
        } catch (e) {
          console.error(e);
        }
      }
      if (Array.isArray(targetArchives)) {
        setSchoolYearArchives(targetArchives);
        try {
          localStorage.setItem(`${STORAGE_KEY}_school_year_archives`, JSON.stringify(targetArchives));
        } catch (e) {
          console.error(e);
        }
      }
      if (targetActiveClassId) {
        setActiveClassId(targetActiveClassId);
      } else if (Array.isArray(targetClasses) && targetClasses.length > 0) {
        setActiveClassId(targetClasses[0].id);
      }

      playSound('praise');
      const classCount = Array.isArray(targetClasses) ? targetClasses.length : 0;
      const studentCount = Array.isArray(targetStudents) ? targetStudents.length : 0;
      const year = targetConfig?.schoolYear || data.schoolYear || 'năm học';
      showToast(`Đã nạp lại thành công toàn bộ dữ liệu năm học ${year}! (${classCount} lớp, ${studentCount} học sinh)`, 'success');
      return true;
    } catch (e) {
      console.error(e);
      playSound('penalty');
      showToast('Lỗi: File JSON không đúng định dạng hoặc bị hỏng!', 'error');
      return false;
    }
  };

  const exportCSV = () => {
    // Generate CSV for students & scores
    const headers = ['STT,Mã HS,Họ và tên,Lớp,Giới tính,Điểm sao tích lũy,Số điện thoại PH\n'];
    const rows = students.map((s, idx) => {
      const cls = classes.find(c => s.classIds?.includes(c.id));
      return `"${idx + 1}","${s.code}","${s.name}","${cls?.name || config.className}","${s.gender}","${s.stars}","${s.parentPhone || ''}"\n`;
    });
    const blob = new Blob(['\uFEFF' + headers.concat(rows).join('')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeYear = (config.schoolYear || '2026-2027').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `Diem_Thi_Dua_Cac_Lop_Nam_${safeYear}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    playSound('praise');
    showToast('Đã xuất báo cáo Excel thành công!', 'success');
  };

  const resetAllData = () => {
    localStorage.removeItem(`${STORAGE_KEY}_config`);
    localStorage.removeItem(`${STORAGE_KEY}_students`);
    localStorage.removeItem(`${STORAGE_KEY}_criteria`);
    localStorage.removeItem(`${STORAGE_KEY}_gifts`);
    localStorage.removeItem(`${STORAGE_KEY}_redemptions`);
    localStorage.removeItem(`${STORAGE_KEY}_attendance`);
    localStorage.removeItem(`${STORAGE_KEY}_logs`);
    localStorage.removeItem(`${STORAGE_KEY}_classes`);
    localStorage.removeItem(`${STORAGE_KEY}_active_class_id`);
    localStorage.removeItem(`${STORAGE_KEY}_schedules`);
    localStorage.removeItem(`${STORAGE_KEY}_classroom_groups`);
    localStorage.removeItem(`${STORAGE_KEY}_rooms`);
    localStorage.removeItem(`${STORAGE_KEY}_school_year_archives`);
    localStorage.removeItem(`${STORAGE_KEY}_weekly_evaluations`);
    localStorage.removeItem(`${STORAGE_KEY}_year_evaluations`);

    setConfig(INITIAL_CONFIG);
    setStudents(INITIAL_STUDENTS);
    setCriteria(INITIAL_CRITERIA);
    setGifts(INITIAL_GIFTS);
    setRedemptions(INITIAL_REDEMPTIONS);
    setAttendance({});
    setActivityLogs(INITIAL_REWARDS);
    setClasses(INITIAL_CLASSES);
    setActiveClassId('cls-1');
    setSchedules(INITIAL_SCHEDULES);
    setClassroomGroups({});
    setRooms(INITIAL_ROOMS);
    setSchoolYearArchives([]);
    setWeeklyEvaluations(INITIAL_WEEKLY_EVALUATIONS);
    setYearEvaluations(INITIAL_YEAR_EVALUATIONS);
    playSound('praise');
    showToast('Đã khôi phục toàn bộ dữ liệu về mặc định ban đầu!', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        config,
        updateConfig,
        students,
        addStudent,
        addStudentToClass,
        addMultipleStudentsToClass,
        removeStudentFromClass,
        updateStudent,
        deleteStudent,
        resetStudents,
        importStudentList,
        criteria,
        addCriteria,
        updateCriteria,
        deleteCriteria,
        gifts,
        addGift,
        updateGift,
        deleteGift,
        redeemGift,
        redemptions,
        cancelRedemption,
        deleteRedemptionRecord,
        clearRedemptionHistory,
        attendance,
        saveAttendance,
        getAttendanceForDate,
        activityLogs,
        rewardStudent,
        soundEnabled: config.soundEnabled,
        toggleSound,
        playSound,
        isQuickRewardOpen,
        setIsQuickRewardOpen,
        selectedStudentForReward,
        setSelectedStudentForReward,
        openRewardModalForStudent,
        saveStatus,
        triggerManualSave,
        exportJSON,
        importJSON,
        exportCSV,
        resetAllData,
        classes,
        activeClassId,
        setActiveClassId,
        activeClass,
        addClass,
        updateClass,
        deleteClass,
        isAddClassModalOpen,
        setIsAddClassModalOpen,
        schedules,
        teachers,
        rooms,
        addRoom,
        weeklyEvaluations,
        yearEvaluations,
        setWeeklyEvaluation,
        batchSetWeeklyEvaluations,
        copyWeeklyEvaluationsFromPrevious,
        setStudentYearEvaluation,
        deleteWeeklyEvaluation,
        profile: {
          teacherName: config.teacherName,
          teacherTitle: config.teacherTitle,
          centerName: config.appName,
          motto: config.slogans.join(' • '),
          avatar: config.teacherAvatar,
          themePreset: 'sky',
        },
        setIsPersonalizeModalOpen: () => setActiveTab('settings'),
        setFilterClassId: () => {},
        deleteSchedule,
        addSchedule,
        updateSchedule,
        resetScheduleToTemplate,
        showToast,
        saveAttendanceBatch,
        classroomGroups,
        saveClassGroups,
        batchRewardStudents,
        schoolYearArchives,
        createSchoolYearArchive,
        deleteSchoolYearArchive,
        restoreSchoolYearArchive,
        startNewSchoolYear,
        viewingArchive,
        setViewingArchive,
        isBackgroundModalOpen,
      }}
    >
      {children}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-xl border border-slate-700/80 text-xs font-bold animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="text-base">{toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
