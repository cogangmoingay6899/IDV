import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users2,
  Search,
  Plus,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Copy,
  Check,
  Building2,
  DoorOpen,
  GraduationCap,
  Star,
  Filter,
  UserCheck,
  Shuffle,
  Info,
  CalendarCheck,
  CalendarX,
  Send,
  BookOpen,
  ChevronRight,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { Teacher, ClassGroup, TeacherSubstituteRecord } from '../../types';

export interface TimeSlotDef {
  dayIndex: number; // 1: T2, 2: T3, 3: T4, 4: T5, 5: T6, 6: T7, 0: CN
  dayLabel: string; // "Thứ 2"
  dayShort: string; // "T2"
  shiftId: 'ca1' | 'ca2';
  shiftName: string; // "Ca 1", "Ca 2"
  timeRange: string; // "18:00 - 19:45"
  slotKey: string; // "1_ca1"
}

export const ALL_STANDARD_SLOTS: TimeSlotDef[] = [
  { dayIndex: 1, dayLabel: 'Thứ 2', dayShort: 'T2', shiftId: 'ca1', shiftName: 'Ca 1', timeRange: '18:00 - 19:45', slotKey: '1_ca1' },
  { dayIndex: 1, dayLabel: 'Thứ 2', dayShort: 'T2', shiftId: 'ca2', shiftName: 'Ca 2', timeRange: '19:45 - 21:30', slotKey: '1_ca2' },
  { dayIndex: 2, dayLabel: 'Thứ 3', dayShort: 'T3', shiftId: 'ca1', shiftName: 'Ca 1', timeRange: '18:00 - 19:45', slotKey: '2_ca1' },
  { dayIndex: 2, dayLabel: 'Thứ 3', dayShort: 'T3', shiftId: 'ca2', shiftName: 'Ca 2', timeRange: '19:45 - 21:30', slotKey: '2_ca2' },
  { dayIndex: 3, dayLabel: 'Thứ 4', dayShort: 'T4', shiftId: 'ca1', shiftName: 'Ca 1', timeRange: '18:00 - 19:45', slotKey: '3_ca1' },
  { dayIndex: 3, dayLabel: 'Thứ 4', dayShort: 'T4', shiftId: 'ca2', shiftName: 'Ca 2', timeRange: '19:45 - 21:30', slotKey: '3_ca2' },
  { dayIndex: 4, dayLabel: 'Thứ 5', dayShort: 'T5', shiftId: 'ca1', shiftName: 'Ca 1', timeRange: '18:00 - 19:45', slotKey: '4_ca1' },
  { dayIndex: 4, dayLabel: 'Thứ 5', dayShort: 'T5', shiftId: 'ca2', shiftName: 'Ca 2', timeRange: '19:45 - 21:30', slotKey: '4_ca2' },
  { dayIndex: 5, dayLabel: 'Thứ 6', dayShort: 'T6', shiftId: 'ca1', shiftName: 'Ca 1', timeRange: '18:00 - 19:45', slotKey: '5_ca1' },
  { dayIndex: 5, dayLabel: 'Thứ 6', dayShort: 'T6', shiftId: 'ca2', shiftName: 'Ca 2', timeRange: '19:45 - 21:30', slotKey: '5_ca2' },
  { dayIndex: 6, dayLabel: 'Thứ 7', dayShort: 'T7', shiftId: 'ca1', shiftName: 'Ca 1', timeRange: '18:00 - 19:45', slotKey: '6_ca1' },
  { dayIndex: 6, dayLabel: 'Thứ 7', dayShort: 'T7', shiftId: 'ca2', shiftName: 'Ca 2', timeRange: '19:45 - 21:30', slotKey: '6_ca2' },
  { dayIndex: 0, dayLabel: 'Chủ Nhật', dayShort: 'CN', shiftId: 'ca1', shiftName: 'Ca Sáng/Chiều', timeRange: '08:30 - 11:30', slotKey: '0_ca1' },
  { dayIndex: 0, dayLabel: 'Chủ Nhật', dayShort: 'CN', shiftId: 'ca2', shiftName: 'Ca Tối', timeRange: '18:00 - 20:00', slotKey: '0_ca2' },
];

export const DAYS_ORDER = [
  { dayIndex: 1, label: 'Thứ 2', short: 'T2' },
  { dayIndex: 2, label: 'Thứ 3', short: 'T3' },
  { dayIndex: 3, label: 'Thứ 4', short: 'T4' },
  { dayIndex: 4, label: 'Thứ 5', short: 'T5' },
  { dayIndex: 5, label: 'Thứ 6', short: 'T6' },
  { dayIndex: 6, label: 'Thứ 7', short: 'T7' },
  { dayIndex: 0, label: 'Chủ Nhật', short: 'CN' },
];

/**
 * Phân tích chuỗi schedule của một lớp học ra danh sách các slot (Thứ mấy + Ca mấy)
 */
export function parseClassSlots(scheduleStr: string): { dayIndex: number; shiftId: 'ca1' | 'ca2'; slotKey: string }[] {
  if (!scheduleStr) return [];
  const s = scheduleStr.toLowerCase();
  const results: { dayIndex: number; shiftId: 'ca1' | 'ca2'; slotKey: string }[] = [];

  // Xác định ca
  const hasCa1 = s.includes('ca 1') || s.includes('18:00') || s.includes('18h');
  const hasCa2 = s.includes('ca 2') || s.includes('19:45') || s.includes('21:30');

  let shiftId: 'ca1' | 'ca2' = 'ca1';
  if (hasCa2 && !hasCa1) {
    shiftId = 'ca2';
  } else if (hasCa1) {
    shiftId = 'ca1';
  }

  // Xác định các thứ
  const detectedDays: number[] = [];
  if (s.includes('thứ 2') || s.includes('t2')) detectedDays.push(1);
  if (s.includes('thứ 3') || s.includes('t3')) detectedDays.push(2);
  if (s.includes('thứ 4') || s.includes('t4')) detectedDays.push(3);
  if (s.includes('thứ 5') || s.includes('t5')) detectedDays.push(4);
  if (s.includes('thứ 6') || s.includes('t6')) detectedDays.push(5);
  if (s.includes('thứ 7') || s.includes('t7')) detectedDays.push(6);
  if (s.includes('chủ nhật') || s.includes('cn') || s.includes('sunday')) detectedDays.push(0);

  // Fallback cặp đôi chuẩn nếu viết tắt
  if (detectedDays.length === 0) {
    if (s.includes('2+5') || s.includes('2-5')) detectedDays.push(1, 4);
    else if (s.includes('3+6') || s.includes('3-6')) detectedDays.push(2, 5);
    else if (s.includes('4+7') || s.includes('4-7')) detectedDays.push(3, 6);
    else detectedDays.push(1, 4); // Mặc định Thứ 2 & Thứ 5
  }

  detectedDays.forEach((day) => {
    results.push({
      dayIndex: day,
      shiftId,
      slotKey: `${day}_${shiftId}`,
    });
    // Nếu lớp học cả 2 ca
    if (hasCa1 && hasCa2) {
      results.push({
        dayIndex: day,
        shiftId: 'ca2',
        slotKey: `${day}_ca2`,
      });
    }
  });

  return results;
}

/**
 * Kiểm tra lớp học có thuộc về giáo viên không
 */
export function isClassTaughtByTeacher(cls: ClassGroup, teacher: Teacher): boolean {
  if (!cls || !teacher) return false;
  if (cls.status === 'Đã kết thúc') return false;

  const tId = teacher.id;
  const tName = (teacher.name || '').trim().toLowerCase();

  if (cls.teacherId && cls.teacherId === tId) return true;

  if (cls.teacherName) {
    const clsTName = cls.teacherName.toLowerCase();
    if (clsTName.includes(tName) || tName.includes(clsTName)) return true;
    const parts = cls.teacherName.split(/[,+&;/]/).map((p) => p.trim().toLowerCase());
    if (parts.some((p) => p.includes(tName) || tName.includes(p))) return true;
  }

  if (cls.teacherNames && Array.isArray(cls.teacherNames)) {
    if (
      cls.teacherNames.some((tn) => {
        const lower = tn.trim().toLowerCase();
        return lower.includes(tName) || tName.includes(lower);
      })
    ) {
      return true;
    }
  }

  return false;
}

interface TeacherScheduleAvailabilityProps {
  teachers: Teacher[];
  classes: ClassGroup[];
  selectedTeacherId?: string;
  onSelectTeacher?: (teacherId: string) => void;
  onUpdateClass?: (updatedClass: ClassGroup) => void;
}

export const TeacherScheduleAvailability: React.FC<TeacherScheduleAvailabilityProps> = ({
  teachers,
  classes,
  selectedTeacherId: externalSelectedTeacherId,
  onSelectTeacher,
  onUpdateClass,
}) => {
  // Navigation subtabs inside Schedule view
  const [viewMode, setViewMode] = useState<'individual' | 'matrix' | 'substituteFinder' | 'substituteLogs'>('individual');
  const [internalSelectedTeacherId, setInternalSelectedTeacherId] = useState<string>(
    externalSelectedTeacherId || teachers[0]?.id || 'tch-tamvuong'
  );

  const activeTeacherId = externalSelectedTeacherId || internalSelectedTeacherId;

  // Substitute Finder Tool State
  const [finderMode, setFinderMode] = useState<'bySlot' | 'byClass'>('byClass');
  const [selectedFinderClassId, setSelectedFinderClassId] = useState<string>(classes[0]?.id || '');
  const [selectedFinderDay, setSelectedFinderDay] = useState<number>(1); // 1 = T2
  const [selectedFinderShift, setSelectedFinderShift] = useState<'ca1' | 'ca2'>('ca1');
  const [copiedInviteText, setCopiedInviteText] = useState<string | null>(null);

  // Substitute Assignment Modal
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subTargetTeacher, setSubTargetTeacher] = useState<Teacher | null>(null);
  const [subTargetClass, setSubTargetClass] = useState<ClassGroup | null>(null);
  const [subDate, setSubDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [subReason, setSubReason] = useState<string>('Giáo viên chính xin nghỉ bận việc đột xuất');
  const [subToast, setSubToast] = useState<string | null>(null);

  // Local substitute records state
  const [substituteLogs, setSubstituteLogs] = useState<TeacherSubstituteRecord[]>([
    {
      id: 'sub-01',
      classId: classes[0]?.id || 'cls-29',
      className: classes[0]?.name || 'Lớp 29 - IELTS Junior Khởi Động',
      classSchedule: classes[0]?.schedule || 'Thứ 2 + Thứ 5 (Ca 1: 18:00 - 19:45)',
      originalTeacherName: classes[0]?.teacherName || 'Tâm Vương',
      substituteTeacherId: 'tch-minhtam',
      substituteTeacherName: 'Hoàng Minh Tâm',
      date: '2026-05-18',
      shift: 'Ca 1: 18:00 - 19:45',
      sessionNumber: 14,
      reason: 'Giáo viên chính đi công tác',
      status: 'Đã hoàn thành',
      createdAt: '2026-05-16',
    },
  ]);

  // Master schedule calculation for all teachers
  const teachersScheduleMap = useMemo(() => {
    const map = new Map<
      string,
      {
        teacher: Teacher;
        classesTaught: ClassGroup[];
        busySlotsMap: Record<string, ClassGroup[]>;
        busySlotsCount: number;
        freeSlotsCount: number;
        freeSlotsList: TimeSlotDef[];
      }
    >();

    teachers.forEach((t) => {
      const taughtClasses = classes.filter((c) => isClassTaughtByTeacher(c, t));
      const busySlotsMap: Record<string, ClassGroup[]> = {};

      taughtClasses.forEach((cls) => {
        const slots = parseClassSlots(cls.schedule);
        slots.forEach((s) => {
          if (!busySlotsMap[s.slotKey]) busySlotsMap[s.slotKey] = [];
          busySlotsMap[s.slotKey].push(cls);
        });
      });

      const busySlotsCount = Object.keys(busySlotsMap).length;
      const freeSlotsList = ALL_STANDARD_SLOTS.filter((slot) => !busySlotsMap[slot.slotKey]);
      const freeSlotsCount = freeSlotsList.length;

      map.set(t.id, {
        teacher: t,
        classesTaught: taughtClasses,
        busySlotsMap,
        busySlotsCount,
        freeSlotsCount,
        freeSlotsList,
      });
    });

    return map;
  }, [teachers, classes]);

  // Active Teacher Schedule Data
  const currentTeacherData = useMemo(() => {
    return teachersScheduleMap.get(activeTeacherId) || teachersScheduleMap.values().next().value;
  }, [teachersScheduleMap, activeTeacherId]);

  // Handle teacher change
  const handleSelectTeacher = (id: string) => {
    setInternalSelectedTeacherId(id);
    if (onSelectTeacher) onSelectTeacher(id);
  };

  // Substitute Finder Logic
  const finderTargetSlotKey = useMemo(() => {
    if (finderMode === 'bySlot') {
      return `${selectedFinderDay}_${selectedFinderShift}`;
    } else {
      const targetClass = classes.find((c) => c.id === selectedFinderClassId);
      if (!targetClass) return '1_ca1';
      const slots = parseClassSlots(targetClass.schedule);
      return slots[0]?.slotKey || '1_ca1';
    }
  }, [finderMode, selectedFinderDay, selectedFinderShift, selectedFinderClassId, classes]);

  const finderTargetClassObj = useMemo(() => {
    return classes.find((c) => c.id === selectedFinderClassId) || classes[0];
  }, [selectedFinderClassId, classes]);

  // Teachers who are AVAILABLE (FREE) for this slot
  const availableTeachersForSlot = useMemo(() => {
    return teachers.filter((t) => {
      const scheduleInfo = teachersScheduleMap.get(t.id);
      if (!scheduleInfo) return true;
      // Must NOT be busy in this slot
      const isBusy = Boolean(scheduleInfo.busySlotsMap[finderTargetSlotKey]?.length);
      return !isBusy;
    });
  }, [teachers, teachersScheduleMap, finderTargetSlotKey]);

  // Teachers who are BUSY for this slot
  const busyTeachersForSlot = useMemo(() => {
    return teachers.filter((t) => {
      const scheduleInfo = teachersScheduleMap.get(t.id);
      if (!scheduleInfo) return false;
      return Boolean(scheduleInfo.busySlotsMap[finderTargetSlotKey]?.length);
    });
  }, [teachers, teachersScheduleMap, finderTargetSlotKey]);

  // Copy substitute request message
  const handleCopyInviteMessage = (teacher: Teacher, targetClass?: ClassGroup) => {
    const cls = targetClass || finderTargetClassObj;
    const targetSlotDef = ALL_STANDARD_SLOTS.find((s) => s.slotKey === finderTargetSlotKey);
    const dayName = targetSlotDef?.dayLabel || 'Thứ 2';
    const shiftName = targetSlotDef?.shiftName || 'Ca 1';
    const timeRange = targetSlotDef?.timeRange || '18:00 - 19:45';

    const text = `Kính gửi Thầy/Cô ${teacher.name},
Trung tâm IELTS DƯƠNG VŨ (IDV) nhờ Thầy/Cô hỗ trợ dạy thay lớp:
📌 Lớp: ${cls?.name || 'Lớp IELTS IDV'} (${cls?.code || 'IDV-L'})
⏰ Thời gian: ${dayName} • ${shiftName} (${timeRange})
📍 Phòng học: ${cls?.room || 'Phòng học cơ sở'}
🏢 Cơ sở: ${cls?.branch || 'Trung tâm IDV'}
👥 Sĩ số: ${cls?.currentStudents || 15} học viên (Tiến độ: Buổi ${cls?.completedSessions || 1}/${cls?.totalSessions || 32})
👤 Giáo viên chính: ${cls?.teacherName || 'Giáo viên phụ trách'} (bận việc xin phép)

Thầy/Cô xác nhận có thể nhận dạy thay buổi này giúp trung tâm qua tin nhắn nhé. Trân trọng cảm ơn Thầy/Cô!`;

    navigator.clipboard.writeText(text);
    setCopiedInviteText(teacher.id);
    setTimeout(() => setCopiedInviteText(null), 3000);
  };

  // Open substitute modal
  const handleOpenSubModal = (teacher: Teacher, targetClass?: ClassGroup) => {
    setSubTargetTeacher(teacher);
    setSubTargetClass(targetClass || finderTargetClassObj);
    setSubModalOpen(true);
  };

  // Submit substitute assignment
  const handleConfirmSubstitute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTargetTeacher || !subTargetClass) return;

    const targetSlotDef = ALL_STANDARD_SLOTS.find((s) => s.slotKey === finderTargetSlotKey);

    const newRecord: TeacherSubstituteRecord = {
      id: `sub-${Date.now()}`,
      classId: subTargetClass.id,
      className: subTargetClass.name,
      classSchedule: subTargetClass.schedule,
      originalTeacherId: subTargetClass.teacherId,
      originalTeacherName: subTargetClass.teacherName,
      substituteTeacherId: subTargetTeacher.id,
      substituteTeacherName: subTargetTeacher.name,
      date: subDate,
      shift: `${targetSlotDef?.dayLabel || 'Buổi học'} • ${targetSlotDef?.timeRange || '18:00 - 19:45'}`,
      sessionNumber: (subTargetClass.completedSessions || 0) + 1,
      reason: subReason,
      status: 'Đã lên lịch',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setSubstituteLogs((prev) => [newRecord, ...prev]);
    setSubModalOpen(false);
    setSubToast(`Đã ghi nhận phân công Thầy/Cô ${subTargetTeacher.name} dạy thay thành công!`);
    setTimeout(() => setSubToast(null), 4000);
  };

  // Quick assign teacher to take over class
  const handleAssignTeacherToClass = (teacher: Teacher, targetClass: ClassGroup) => {
    if (!onUpdateClass) {
      alert(`Đã chọn Thầy/Cô ${teacher.name} nhận phụ trách lớp ${targetClass.name}.`);
      return;
    }

    const currentNames = targetClass.teacherNames || (targetClass.teacherName ? [targetClass.teacherName] : []);
    const updatedNames = Array.from(new Set([teacher.name, ...currentNames]));

    const updated: ClassGroup = {
      ...targetClass,
      teacherId: teacher.id,
      teacherName: updatedNames.join(', '),
      teacherNames: updatedNames,
    };

    onUpdateClass(updated);
    setSubToast(`Đã phân công Thầy/Cô ${teacher.name} nhận phụ trách lớp ${targetClass.name}!`);
    setTimeout(() => setSubToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {subToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-emerald-500/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{subToast}</span>
        </div>
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Đội ngũ giảng viên</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{teachers.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">100% giáo viên chất lượng IELTS 8.0+</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Lớp học đang mở</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-900 mt-2">
            {classes.filter((c) => c.status !== 'Đã kết thúc').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Phân bổ đều các cơ sở Hải Phòng</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Ca dạy đã lấp đầy</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">
            {Array.from(teachersScheduleMap.values()).reduce((sum: number, item: any) => sum + (item?.busySlotsCount || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Tổng các ca dạy trong tuần</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/40 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Lịch trống sẵn sàng</span>
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {Array.from(teachersScheduleMap.values()).reduce((sum: number, item: any) => sum + (item?.freeSlotsCount || 0), 0)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Sẵn sàng nhận lớp mới & dạy thay</div>
        </div>
      </div>

      {/* View Mode Tabs Navigation */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setViewMode('individual')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'individual'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>👤 Lịch Dạy Từng Giáo Viên</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'matrix'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>📊 Ma Trận Lịch Toàn Đội Ngũ</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('substituteFinder')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'substituteFinder'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>🔍 Tìm GV Dạy Thay & Nhận Lớp Mới</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('substituteLogs')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'substituteLogs'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>📝 Sổ Ghi Nhận Dạy Thay ({substituteLogs.length})</span>
          </button>
        </div>

        {viewMode === 'individual' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Chọn Giáo Viên:</span>
            <select
              value={activeTeacherId}
              onChange={(e) => handleSelectTeacher(e.target.value)}
              className="text-xs font-bold bg-purple-50 text-purple-900 border border-purple-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              {teachers.map((t) => {
                const info = teachersScheduleMap.get(t.id);
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} ({info?.classesTaught.length || 0} lớp • Trống {info?.freeSlotsCount || 0} ca)
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: LỊCH DẠY & LỊCH TRỐNG CỦA TỪNG GIÁO VIÊN                         */}
      {/* ========================================================================= */}
      {viewMode === 'individual' && currentTeacherData && (
        <div className="space-y-6">
          {/* Teacher Profile Summary Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {currentTeacherData.teacher.name.split(' ').slice(-1)[0]?.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{currentTeacherData.teacher.name}</h2>
                  <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                    {currentTeacherData.teacher.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {currentTeacherData.teacher.type}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>Chuyên môn:</strong> {currentTeacherData.teacher.specialty} • {currentTeacherData.teacher.degrees}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {currentTeacherData.teacher.phone}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {currentTeacherData.teacher.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
              <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 text-center">
                <span className="text-[11px] font-semibold text-purple-700 block">Lớp phụ trách</span>
                <span className="text-lg font-black text-purple-900">{currentTeacherData.classesTaught.length} Lớp</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
                <span className="text-[11px] font-semibold text-emerald-700 block">Lịch trống</span>
                <span className="text-lg font-black text-emerald-800">{currentTeacherData.freeSlotsCount}/14 Ca</span>
              </div>
            </div>
          </div>

          {/* Section: Danh sách các lớp học giáo viên đang dạy */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-700" />
                <h3 className="font-bold text-sm text-slate-900">
                  Danh Sách Lớp Đang Dạy ({currentTeacherData.classesTaught.length} lớp)
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Tự động đồng bộ từ danh sách Lớp học IDV
              </span>
            </div>

            {currentTeacherData.classesTaught.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-bold text-slate-700">Giáo viên chưa được phân công lớp học nào.</p>
                <p className="text-slate-500 mt-1">
                  Hãy vào mục Lớp Học và chọn Thầy/Cô {currentTeacherData.teacher.name} làm giáo viên phụ trách.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentTeacherData.classesTaught.map((cls) => {
                  const slots = parseClassSlots(cls.schedule);
                  return (
                    <div key={cls.id} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                            {cls.code}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900">{cls.name}</h4>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {cls.courseLevel || cls.courseName}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                          <span className="flex items-center gap-1 text-slate-700 font-semibold">
                            <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                            {cls.room || 'Chưa xếp phòng'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-700">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {cls.branch || 'Cơ sở IDV'}
                          </span>
                          <span>•</span>
                          <span>Sĩ số: <strong className="text-slate-900">{cls.currentStudents}</strong> học viên</span>
                          <span>•</span>
                          <span>Tiến độ: <strong className="text-slate-900">{cls.completedSessions}/{cls.totalSessions}</strong> buổi</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Schedule Badge */}
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl px-3.5 py-2 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Clock className="w-3.5 h-3.5 text-purple-700" />
                            <span className="font-bold text-xs text-purple-900">
                              {cls.schedule}
                            </span>
                          </div>
                          <span className="text-[10px] text-purple-700 font-medium block mt-0.5">
                            Chiếm {slots.length} buổi/tuần
                          </span>
                        </div>

                        {/* Button: Find substitute for this class if teacher is absent */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFinderClassId(cls.id);
                            setViewMode('substituteFinder');
                          }}
                          className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all flex items-center gap-1"
                          title="Tìm người dạy thay cho lớp này nếu giáo viên xin nghỉ"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                          <span>Tìm người dạy thay</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Lưới thời khóa biểu hàng tuần (Weekly Timetable & Availability Grid) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-700" />
                  <span>Thời Khóa Biểu & Lịch Trống Trong Tuần (7 Ngày x 2 Ca)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các ô màu xanh lá là <strong className="text-emerald-700">LỊCH TRỐNG</strong>, có thể xếp nhận lớp mới hoặc dạy thay ngay lập tức
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-purple-700 inline-block"></span>
                  <span className="font-semibold text-slate-700">Bận dạy lớp ({currentTeacherData.busySlotsCount} ca)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                  <span className="font-semibold text-emerald-800">Trống lịch ({currentTeacherData.freeSlotsCount} ca)</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto p-4">
              <table className="w-full border-collapse border border-slate-200 text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                    <th className="p-2.5 border border-slate-300 w-32 bg-slate-200/70">Ca / Khung Giờ</th>
                    {DAYS_ORDER.map((d) => (
                      <th key={d.dayIndex} className="p-2.5 border border-slate-300">
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Row: Ca 1 (18:00 - 19:45) */}
                  <tr>
                    <td className="p-3 border border-slate-300 bg-slate-50 font-bold text-slate-800 text-center">
                      <div className="text-sm font-black text-purple-900">Ca 1</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">18:00 - 19:45</div>
                    </td>

                    {DAYS_ORDER.map((d) => {
                      const slotKey = `${d.dayIndex}_ca1`;
                      const busyClasses = currentTeacherData.busySlotsMap[slotKey] || [];
                      const isBusy = busyClasses.length > 0;

                      return (
                        <td
                          key={slotKey}
                          className={`p-2.5 border border-slate-300 align-top transition-all ${
                            isBusy
                              ? 'bg-purple-50/80 border-purple-300 text-purple-950'
                              : 'bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-900 cursor-pointer'
                          }`}
                        >
                          {isBusy ? (
                            <div className="space-y-1.5">
                              {busyClasses.map((cls) => (
                                <div
                                  key={cls.id}
                                  className="bg-purple-700 text-white p-2 rounded-xl shadow-2xs space-y-0.5"
                                >
                                  <div className="font-black text-xs leading-snug line-clamp-2">{cls.name}</div>
                                  <div className="text-[10px] text-purple-200 font-medium flex items-center justify-between">
                                    <span>{cls.code}</span>
                                    <span>{cls.room}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full min-h-[70px] flex flex-col items-center justify-center text-center p-1 rounded-lg border border-dashed border-emerald-300 bg-white/60">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                              <span className="font-bold text-[11px] text-emerald-800">Trống lịch</span>
                              <span className="text-[9px] text-emerald-600 font-medium">Sẵn sàng nhận lớp</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Ca 2 (19:45 - 21:30) */}
                  <tr>
                    <td className="p-3 border border-slate-300 bg-slate-50 font-bold text-slate-800 text-center">
                      <div className="text-sm font-black text-purple-900">Ca 2</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">19:45 - 21:30</div>
                    </td>

                    {DAYS_ORDER.map((d) => {
                      const slotKey = `${d.dayIndex}_ca2`;
                      const busyClasses = currentTeacherData.busySlotsMap[slotKey] || [];
                      const isBusy = busyClasses.length > 0;

                      return (
                        <td
                          key={slotKey}
                          className={`p-2.5 border border-slate-300 align-top transition-all ${
                            isBusy
                              ? 'bg-purple-50/80 border-purple-300 text-purple-950'
                              : 'bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-900 cursor-pointer'
                          }`}
                        >
                          {isBusy ? (
                            <div className="space-y-1.5">
                              {busyClasses.map((cls) => (
                                <div
                                  key={cls.id}
                                  className="bg-purple-700 text-white p-2 rounded-xl shadow-2xs space-y-0.5"
                                >
                                  <div className="font-black text-xs leading-snug line-clamp-2">{cls.name}</div>
                                  <div className="text-[10px] text-purple-200 font-medium flex items-center justify-between">
                                    <span>{cls.code}</span>
                                    <span>{cls.room}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full min-h-[70px] flex flex-col items-center justify-center text-center p-1 rounded-lg border border-dashed border-emerald-300 bg-white/60">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                              <span className="font-bold text-[11px] text-emerald-800">Trống lịch</span>
                              <span className="text-[9px] text-emerald-600 font-medium">Sẵn sàng nhận lớp</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Quick Summary of Free Slots */}
            <div className="p-4 bg-emerald-50/60 border-t border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <div className="text-xs text-emerald-900">
                  <strong>Các buổi rảnh của Thầy/Cô {currentTeacherData.teacher.name}:</strong>{' '}
                  {currentTeacherData.freeSlotsList.map((s) => `${s.dayLabel} (${s.shiftName})`).join(', ')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedFinderDay(currentTeacherData.freeSlotsList[0]?.dayIndex || 1);
                  setSelectedFinderShift(currentTeacherData.freeSlotsList[0]?.shiftId || 'ca1');
                  setFinderMode('bySlot');
                  setViewMode('substituteFinder');
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Xếp thêm lớp mới / dạy thay vào ca trống</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: MA TRẬN LỊCH TOÀN BỘ ĐỘI NGŨ GIÁO VIÊN (MASTER MATRIX)          */}
      {/* ========================================================================= */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-purple-700" />
                <span>Bảng Ma Trận Lịch Trống & Lịch Dạy Toàn Bộ Giáo Viên</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quan sát tổng thể toàn bộ giáo viên để chọn người rảnh phù hợp nhất khi phát sinh lớp mới hoặc giáo viên nghỉ
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Ghi chú:</span>
              <span className="px-2 py-0.5 rounded bg-purple-700 text-white font-bold">Bận dạy</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                🟢 Trống
              </span>
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full border-collapse border border-slate-300 text-xs min-w-[900px]">
              <thead>
                <tr className="bg-slate-200/80 text-slate-900 font-bold border-b border-slate-300 text-center">
                  <th className="p-2.5 border border-slate-300 text-left w-48 sticky left-0 bg-slate-200 z-10">
                    Giáo Viên
                  </th>
                  <th className="p-2.5 border border-slate-300 w-20">Lớp Đang Dạy</th>
                  <th className="p-2.5 border border-slate-300 w-20">Số Ca Trống</th>
                  {ALL_STANDARD_SLOTS.map((slot) => (
                    <th key={slot.slotKey} className="p-2 border border-slate-300 font-semibold min-w-[70px]">
                      <div className="font-bold text-slate-900">{slot.dayShort}</div>
                      <div className="text-[10px] text-slate-600 font-normal">{slot.shiftName}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teachers.map((t, idx) => {
                  const data = teachersScheduleMap.get(t.id);
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={t.id}
                      className={`${isEven ? 'bg-white' : 'bg-slate-50/60'} hover:bg-purple-50/30 transition-colors`}
                    >
                      {/* Teacher Column */}
                      <td className="p-2.5 border border-slate-300 font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectTeacher(t.id);
                              setViewMode('individual');
                            }}
                            className="text-left font-bold text-slate-900 hover:text-purple-700 hover:underline"
                          >
                            {t.name}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          {t.type} • {t.phone}
                        </div>
                      </td>

                      {/* Active Classes Count */}
                      <td className="p-2 border border-slate-300 text-center font-bold text-purple-900">
                        {data?.classesTaught.length || 0}
                      </td>

                      {/* Free Slots Count */}
                      <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/40">
                        {data?.freeSlotsCount || 0}
                      </td>

                      {/* All 14 Slots */}
                      {ALL_STANDARD_SLOTS.map((slot) => {
                        const busyClasses = data?.busySlotsMap[slot.slotKey] || [];
                        const isBusy = busyClasses.length > 0;

                        return (
                          <td
                            key={slot.slotKey}
                            className={`p-1.5 border border-slate-300 text-center transition-all ${
                              isBusy
                                ? 'bg-purple-100 border-purple-300 text-purple-950 font-bold'
                                : 'bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800'
                            }`}
                            title={
                              isBusy
                                ? `${t.name} bận dạy: ${busyClasses.map((c) => c.name).join(', ')}`
                                : `${t.name} hoàn toàn trống ca ${slot.dayLabel} (${slot.shiftName})`
                            }
                          >
                            {isBusy ? (
                              <div className="text-[10px] bg-purple-700 text-white px-1 py-0.5 rounded truncate font-medium max-w-[85px] mx-auto">
                                {busyClasses[0]?.code || 'Bận'}
                              </div>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-bold block">
                                Trống
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: CÔNG CỤ TÌM GIÁO VIÊN DẠY THAY & NHẬN LỚP MỚI                   */}
      {/* ========================================================================= */}
      {viewMode === 'substituteFinder' && (
        <div className="space-y-6">
          {/* Controls Box */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="w-48 h-48" />
            </div>

            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Trợ Lý Điều Phối Giảng Dạy & Xếp Dạy Thay</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Tìm Giáo Viên Đang Trống Lịch Để Xếp Dạy Thay Hoặc Nhận Lớp Mới
              </h2>
              <p className="text-xs sm:text-sm text-purple-200">
                Hệ thống tự động quét toàn bộ thời khóa biểu thực tế của các giáo viên để lọc ra những Thầy/Cô hoàn toàn rảnh vào ca học cần tìm, loại bỏ nguy cơ trùng lịch.
              </p>

              {/* Mode Selection */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFinderMode('byClass')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    finderMode === 'byClass'
                      ? 'bg-white text-purple-950 shadow-md font-extrabold'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  🏫 Tìm người dạy thay cho Lớp cụ thể
                </button>
                <button
                  type="button"
                  onClick={() => setFinderMode('bySlot')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    finderMode === 'bySlot'
                      ? 'bg-white text-purple-950 shadow-md font-extrabold'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  ⏰ Tìm theo Buổi & Ca học trong tuần
                </button>
              </div>

              {/* Form Controls */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {finderMode === 'byClass' ? (
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-bold text-white block">
                      Chọn lớp có giáo viên xin nghỉ cần tìm người dạy thay:
                    </label>
                    <select
                      value={selectedFinderClassId}
                      onChange={(e) => setSelectedFinderClassId(e.target.value)}
                      className="w-full bg-white text-slate-900 font-bold p-3 rounded-xl border-2 border-amber-400 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs sm:text-sm"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code}) • {c.schedule} • GV chính: {c.teacherName}
                        </option>
                      ))}
                    </select>
                    {finderTargetClassObj && (
                      <div className="text-[11px] text-amber-200 mt-1 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Lịch lớp này: <strong>{finderTargetClassObj.schedule}</strong> tại <strong>{finderTargetClassObj.room}</strong> ({finderTargetClassObj.branch})</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="font-bold text-white block">Chọn Thứ trong tuần:</label>
                      <select
                        value={selectedFinderDay}
                        onChange={(e) => setSelectedFinderDay(Number(e.target.value))}
                        className="w-full bg-white text-slate-900 font-bold p-2.5 rounded-xl border border-white/30 focus:outline-none"
                      >
                        {DAYS_ORDER.map((d) => (
                          <option key={d.dayIndex} value={d.dayIndex}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-white block">Chọn Ca học:</label>
                      <select
                        value={selectedFinderShift}
                        onChange={(e) => setSelectedFinderShift(e.target.value as 'ca1' | 'ca2')}
                        className="w-full bg-white text-slate-900 font-bold p-2.5 rounded-xl border border-white/30 focus:outline-none"
                      >
                        <option value="ca1">Ca 1: 18:00 - 19:45</option>
                        <option value="ca2">Ca 2: 19:45 - 21:30</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>Danh Sách Giáo Viên Hoàn Toàn Trống Lịch ({availableTeachersForSlot.length} Thầy/Cô)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các Thầy/Cô dưới đây không có lịch giảng dạy nào vào ca này, sẵn sàng tiếp nhận lớp hoặc dạy thay.
              </p>
            </div>
          </div>

          {/* Available Teachers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableTeachersForSlot.map((teacher) => {
              const data = teachersScheduleMap.get(teacher.id);
              const isCopied = copiedInviteText === teacher.id;

              return (
                <div
                  key={teacher.id}
                  className="bg-white rounded-2xl p-5 border-2 border-emerald-200 hover:border-emerald-400 shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white font-black text-base flex items-center justify-center shadow-xs">
                          {teacher.name.split(' ').slice(-1)[0]?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-slate-900">{teacher.name}</h4>
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Trống lịch
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-purple-700 font-bold">{teacher.code}</span>
                            <span>•</span>
                            <span>{teacher.type}</span>
                            <span>•</span>
                            <span>Đang phụ trách {data?.classesTaught.length || 0} lớp</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span className="text-xs font-bold text-amber-800">{teacher.rating}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div>
                        <span className="text-slate-400 font-semibold">Chuyên môn:</span>{' '}
                        <strong className="text-slate-800">{teacher.specialty}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Bằng cấp/Chứng chỉ:</span>{' '}
                        <span className="text-purple-700 font-medium">{teacher.degrees}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Điện thoại liên hệ:</span>{' '}
                        <strong className="text-slate-900 font-mono">{teacher.phone}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopyInviteMessage(teacher)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                        isCopied
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      title="Sao chép tin nhắn Zalo/SMS đầy đủ thông tin gửi giáo viên"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{isCopied ? 'Đã sao chép tin nhắn!' : 'Soạn tin mời dạy thay'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenSubModal(teacher)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-xs flex items-center gap-1"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Xếp dạy thay</span>
                      </button>

                      {finderMode === 'byClass' && finderTargetClassObj && (
                        <button
                          type="button"
                          onClick={() => handleAssignTeacherToClass(teacher, finderTargetClassObj)}
                          className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all"
                          title="Phân công Thầy/Cô này nhận lớp chính thức"
                        >
                          <span>Nhận lớp</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Busy Teachers Accordion */}
          {busyTeachersForSlot.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-600 mb-2">
                ⚠️ Giáo viên đang bận dạy lớp khác vào ca này ({busyTeachersForSlot.length} Thầy/Cô):
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {busyTeachersForSlot.map((t) => {
                  const scheduleInfo = teachersScheduleMap.get(t.id);
                  const busyClass = scheduleInfo?.busySlotsMap[finderTargetSlotKey]?.[0];
                  return (
                    <span
                      key={t.id}
                      className="text-xs bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg"
                    >
                      {t.name} (Đang dạy: <strong className="text-purple-700">{busyClass?.name || 'Bận'}</strong>)
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: SỔ GHI NHẬN DẠY THAY (SUBSTITUTE LOGS)                            */}
      {/* ========================================================================= */}
      {viewMode === 'substituteLogs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-purple-700" />
                <span>Sổ Theo Dõi Lịch Sử & Lịch Dạy Thay Trung Tâm</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Lưu trữ các ca dạy thay để kế toán đối soát thù lao giảng dạy và chấm công chính xác
              </p>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('substituteFinder')}
              className="px-3.5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm ca dạy thay mới</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Ngày Học & Ca</th>
                  <th className="p-3">Lớp Học</th>
                  <th className="p-3">Giáo Viên Chính (Nghỉ)</th>
                  <th className="p-3">Giáo Viên Dạy Thay</th>
                  <th className="p-3">Lý Do / Ghi Chú</th>
                  <th className="p-3 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {substituteLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-semibold text-slate-900">
                      <div className="font-bold text-purple-900">{log.date}</div>
                      <div className="text-[11px] text-slate-500">{log.shift}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{log.className}</div>
                      <div className="text-[11px] text-slate-500">{log.classSchedule}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-slate-700 font-medium line-through text-slate-400 mr-1">
                        {log.originalTeacherName}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-700">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {log.substituteTeacherName}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs">{log.reason || 'Dạy thay'}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          log.status === 'Đã hoàn thành'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: XÁC NHẬN XẾP GIÁO VIÊN DẠY THAY                                  */}
      {/* ========================================================================= */}
      {subModalOpen && subTargetTeacher && subTargetClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-purple-700" />
                <span>Xác Nhận Xếp Dạy Thay</span>
              </h3>
              <button
                type="button"
                onClick={() => setSubModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSubstitute} className="space-y-4 text-xs">
              <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-purple-700 font-semibold">Lớp học:</span>
                  <strong className="text-purple-950 text-sm">{subTargetClass.name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-700 font-semibold">Lịch học:</span>
                  <strong className="text-purple-900">{subTargetClass.schedule}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-700 font-semibold">Giáo viên chính xin nghỉ:</span>
                  <span className="text-slate-700 font-medium">{subTargetClass.teacherName}</span>
                </div>
                <div className="flex items-center justify-between border-t border-purple-200/60 pt-1.5">
                  <span className="text-emerald-800 font-bold">Giáo viên nhận dạy thay:</span>
                  <strong className="text-emerald-800 text-sm font-black bg-emerald-100 px-2 py-0.5 rounded">
                    {subTargetTeacher.name} ({subTargetTeacher.code})
                  </strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ngày dạy thay:</label>
                <input
                  type="date"
                  required
                  value={subDate}
                  onChange={(e) => setSubDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý do xin dạy thay / Ghi chú điều phối:</label>
                <textarea
                  rows={2}
                  value={subReason}
                  onChange={(e) => setSubReason(e.target.value)}
                  placeholder="VD: Giáo viên chính bị ốm hoặc bận việc gia đình..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs"
                >
                  Lưu Ca Dạy Thay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
