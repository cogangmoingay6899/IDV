/**
 * Tiện ích tính toán Lịch học, Ngày dự kiến kết thúc khóa & Lời nhắc Trợ giảng (TA) Buổi 29
 * Trung tâm Tiếng Anh IELTS DƯƠNG VŨ
 * 
 * Quy tắc:
 * 1. Mỗi lớp học tuần 2 buổi:
 *    - Khung 1: Thứ 2 + Thứ 5 (T2 & T5)
 *    - Khung 2: Thứ 3 + Thứ 6 (T3 & T6)
 *    - Khung 3: Thứ 4 + Thứ 7 (T4 & T7)
 *    - Ca 1: 18:00 - 19:45
 *    - Ca 2: 19:45 - 21:30
 * 
 * 2. Lộ trình 4 Khóa học chuẩn:
 *    - Khóa 1: 32 buổi (Buổi 32 kiểm tra, nghỉ 1 buổi mới lên Khóa 2)
 *    - Khóa 2: 33 buổi (Buổi 32 & 33 kiểm tra, nghỉ 1 buổi mới lên Khóa 3)
 *    - Khóa 3: 33 buổi (Buổi 32 & 33 kiểm tra, nghỉ 1 buổi mới lên Khóa 4)
 *    - Khóa 4: 32 buổi (Buổi 31 & 32 kiểm tra, không nghỉ)
 * 
 * 3. Nhắc nhở Giáo viên:
 *    - Buổi 29 mỗi khóa: Nhắn tin Quản lý sắp xếp Trợ giảng (TA)
 */

export type CourseLevelKey = 'Khóa 1' | 'Khóa 2' | 'Khóa 3' | 'Khóa 4';

export interface CourseLevelConfig {
  key: CourseLevelKey;
  label: string;
  name: string;
  totalSessions: number;
  examSessions: number[];
  breakAfterCourseSessions: number; // Số buổi nghỉ sau khi kết thúc khóa
  nextCourseKey?: CourseLevelKey;
  nextCourseName: string;
  description: string;
  examRule: string;
  breakRule: string;
  taAlertSession: number;
  taAlertRule: string;
  endRule: string;
}

export const COURSE_LEVEL_CONFIGS: Record<CourseLevelKey, CourseLevelConfig> = {
  'Khóa 1': {
    key: 'Khóa 1',
    label: 'Khóa 1: PRE',
    name: 'PRE',
    totalSessions: 32,
    examSessions: [32],
    breakAfterCourseSessions: 1,
    nextCourseKey: 'Khóa 2',
    nextCourseName: 'INSPIRE',
    description: '32 buổi • Buổi 32 kiểm tra cuối khóa • Nghỉ 1 buổi trước khi lên Khóa 2 (INSPIRE)',
    examRule: 'Kiểm tra cuối khóa vào Buổi thứ 32 (1 buổi thi tập trung)',
    breakRule: 'Nghỉ 1 buổi trong lịch học trước khi khai giảng Khóa 2 (INSPIRE)',
    taAlertSession: 29,
    taAlertRule: 'Buổi 29: Nhắn tin Quản lý sắp xếp Trợ giảng (TA) chuẩn bị thi Buổi 32',
    endRule: 'Bế giảng kết thúc khóa sau Buổi 32',
  },
  'Khóa 2': {
    key: 'Khóa 2',
    label: 'Khóa 2: INSPIRE',
    name: 'INSPIRE',
    totalSessions: 33,
    examSessions: [32, 33],
    breakAfterCourseSessions: 1,
    nextCourseKey: 'Khóa 3',
    nextCourseName: 'DESIRE',
    description: '33 buổi • Buổi 32 & 33 kiểm tra cuối khóa • Nghỉ 1 buổi trước khi lên Khóa 3 (DESIRE)',
    examRule: 'Kiểm tra cuối khóa vào Buổi thứ 32 & 33 (2 buổi: Đợt 1 Speaking/Writing & Đợt 2 Listening/Reading)',
    breakRule: 'Nghỉ 1 buổi trong lịch học trước khi khai giảng Khóa 3 (DESIRE)',
    taAlertSession: 29,
    taAlertRule: 'Buổi 29: Nhắn tin Quản lý sắp xếp Trợ giảng (TA) chuẩn bị thi 2 buổi 32 & 33',
    endRule: 'Bế giảng kết thúc khóa sau Buổi 33',
  },
  'Khóa 3': {
    key: 'Khóa 3',
    label: 'Khóa 3: DESIRE',
    name: 'DESIRE',
    totalSessions: 33,
    examSessions: [32, 33],
    breakAfterCourseSessions: 1,
    nextCourseKey: 'Khóa 4',
    nextCourseName: 'LUYỆN ĐỀ DRILL',
    description: '33 buổi • Buổi 32 & 33 kiểm tra cuối khóa • Nghỉ 1 buổi trước khi lên Khóa 4 (LUYỆN ĐỀ DRILL)',
    examRule: 'Kiểm tra cuối khóa vào Buổi thứ 32 & 33 (2 buổi: Đợt 1 Speaking/Writing & Đợt 2 Listening/Reading)',
    breakRule: 'Nghỉ 1 buổi trong lịch học trước khi khai giảng Khóa 4 (LUYỆN ĐỀ DRILL)',
    taAlertSession: 29,
    taAlertRule: 'Buổi 29: Nhắn tin Quản lý sắp xếp Trợ giảng (TA) chuẩn bị thi 2 buổi 32 & 33',
    endRule: 'Bế giảng kết thúc khóa sau Buổi 33',
  },
  'Khóa 4': {
    key: 'Khóa 4',
    label: 'Khóa 4: LUYỆN ĐỀ DRILL',
    name: 'LUYỆN ĐỀ DRILL',
    totalSessions: 32,
    examSessions: [31, 32],
    breakAfterCourseSessions: 0,
    nextCourseName: 'Tốt nghiệp / Thi chứng chỉ IELTS quốc tế',
    description: '32 buổi • Buổi 31 & 32 kiểm tra cuối khóa • Không nghỉ',
    examRule: 'Kiểm tra Mock Test cuối khóa vào Buổi thứ 31 & 32 (2 buổi thi thử đề thật Forecast)',
    breakRule: 'Không nghỉ • Hoàn thành toàn diện lộ trình IELTS',
    taAlertSession: 29,
    taAlertRule: 'Buổi 28 - 29: Nhắn tin Quản lý sắp xếp Trợ giảng (TA) chuẩn bị thi từ Buổi 31',
    endRule: 'Bế giảng tốt nghiệp lộ trình sau Buổi 32',
  },
};

export interface SchedulePreset {
  id: string;
  name: string;
  days: number[]; // 1: Thứ 2, 2: Thứ 3, 3: Thứ 4, 4: Thứ 5, 5: Thứ 6, 6: Thứ 7, 0: CN
  dayLabels: string;
  pairKey: 't2_t5' | 't3_t6' | 't4_t7';
  shift: 'Ca 1' | 'Ca 2';
  time: string;
}

export interface StandardDayPair {
  id: 't2_t5' | 't3_t6' | 't4_t7';
  label: string; // "Thứ 2 + Thứ 5"
  shortLabel: string; // "T2 & T5"
  days: number[]; // [1, 4]
  colorTheme: {
    bg: string;
    border: string;
    text: string;
    activeBg: string;
    activeBorder: string;
    activeText: string;
    badge: string;
  };
}

export const STANDARD_DAY_PAIRS: StandardDayPair[] = [
  {
    id: 't2_t5',
    label: 'Thứ 2 + Thứ 5',
    shortLabel: 'T2 & T5',
    days: [1, 4],
    colorTheme: {
      bg: 'bg-purple-50/70',
      border: 'border-purple-200',
      text: 'text-purple-900',
      activeBg: 'bg-purple-700',
      activeBorder: 'border-purple-700',
      activeText: 'text-white',
      badge: 'bg-purple-100 text-purple-800',
    },
  },
  {
    id: 't3_t6',
    label: 'Thứ 3 + Thứ 6',
    shortLabel: 'T3 & T6',
    days: [2, 5],
    colorTheme: {
      bg: 'bg-indigo-50/70',
      border: 'border-indigo-200',
      text: 'text-indigo-900',
      activeBg: 'bg-indigo-700',
      activeBorder: 'border-indigo-700',
      activeText: 'text-white',
      badge: 'bg-indigo-100 text-indigo-800',
    },
  },
  {
    id: 't4_t7',
    label: 'Thứ 4 + Thứ 7',
    shortLabel: 'T4 & T7',
    days: [3, 6],
    colorTheme: {
      bg: 'bg-teal-50/70',
      border: 'border-teal-200',
      text: 'text-teal-900',
      activeBg: 'bg-teal-700',
      activeBorder: 'border-teal-700',
      activeText: 'text-white',
      badge: 'bg-teal-100 text-teal-800',
    },
  },
];

export interface StandardTimeShift {
  id: 'ca1' | 'ca2';
  name: string;
  timeRange: string;
  startTime: string;
  endTime: string;
}

export const STANDARD_TIME_SHIFTS: StandardTimeShift[] = [
  {
    id: 'ca1',
    name: 'Ca 1',
    timeRange: '18:00 - 19:45',
    startTime: '18:00',
    endTime: '19:45',
  },
  {
    id: 'ca2',
    name: 'Ca 2',
    timeRange: '19:45 - 21:30',
    startTime: '19:45',
    endTime: '21:30',
  },
];

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  {
    id: 't2_t5_ca1',
    name: 'Thứ 2 + Thứ 5 (Ca 1: 18:00 - 19:45)',
    days: [1, 4],
    dayLabels: 'Thứ 2 & Thứ 5',
    pairKey: 't2_t5',
    shift: 'Ca 1',
    time: '18:00 - 19:45',
  },
  {
    id: 't2_t5_ca2',
    name: 'Thứ 2 + Thứ 5 (Ca 2: 19:45 - 21:30)',
    days: [1, 4],
    dayLabels: 'Thứ 2 & Thứ 5',
    pairKey: 't2_t5',
    shift: 'Ca 2',
    time: '19:45 - 21:30',
  },
  {
    id: 't3_t6_ca1',
    name: 'Thứ 3 + Thứ 6 (Ca 1: 18:00 - 19:45)',
    days: [2, 5],
    dayLabels: 'Thứ 3 & Thứ 6',
    pairKey: 't3_t6',
    shift: 'Ca 1',
    time: '18:00 - 19:45',
  },
  {
    id: 't3_t6_ca2',
    name: 'Thứ 3 + Thứ 6 (Ca 2: 19:45 - 21:30)',
    days: [2, 5],
    dayLabels: 'Thứ 3 & Thứ 6',
    pairKey: 't3_t6',
    shift: 'Ca 2',
    time: '19:45 - 21:30',
  },
  {
    id: 't4_t7_ca1',
    name: 'Thứ 4 + Thứ 7 (Ca 1: 18:00 - 19:45)',
    days: [3, 6],
    dayLabels: 'Thứ 4 & Thứ 7',
    pairKey: 't4_t7',
    shift: 'Ca 1',
    time: '18:00 - 19:45',
  },
  {
    id: 't4_t7_ca2',
    name: 'Thứ 4 + Thứ 7 (Ca 2: 19:45 - 21:30)',
    days: [3, 6],
    dayLabels: 'Thứ 4 & Thứ 7',
    pairKey: 't4_t7',
    shift: 'Ca 2',
    time: '19:45 - 21:30',
  },
];

/**
 * Kiểm tra xem lịch có vi phạm quy định (như 2-4-6 hay 3-5-7) không
 */
export function checkScheduleDisallowed(scheduleString: string): { isDisallowed: boolean; message?: string } {
  if (!scheduleString) return { isDisallowed: false };
  const s = scheduleString.toLowerCase();
  
  if (
    s.includes('2-4-6') ||
    s.includes('t2 - t4 - t6') ||
    s.includes('2,4,6') ||
    s.includes('2, 4, 6') ||
    (s.includes('thứ 2') && s.includes('thứ 4') && s.includes('thứ 6'))
  ) {
    return {
      isDisallowed: true,
      message: 'Trung tâm không mở lịch 2-4-6! Quy định bắt buộc: Chỉ học tuần 2 buổi (Thứ 2+5, Thứ 3+6 hoặc Thứ 4+7).',
    };
  }

  if (
    s.includes('3-5-7') ||
    s.includes('t3 - t5 - t7') ||
    s.includes('3,5,7') ||
    s.includes('3, 5, 7') ||
    (s.includes('thứ 3') && s.includes('thứ 5') && s.includes('thứ 7'))
  ) {
    return {
      isDisallowed: true,
      message: 'Trung tâm không mở lịch 3-5-7! Quy định bắt buộc: Chỉ học tuần 2 buổi (Thứ 2+5, Thứ 3+6 hoặc Thứ 4+7).',
    };
  }

  return { isDisallowed: false };
}

/**
 * Tách cặp thứ và khung giờ từ chuỗi lịch học
 */
export function parseScheduleComponents(scheduleString: string): {
  pairKey: 't2_t5' | 't3_t6' | 't4_t7';
  shiftId?: 'ca1' | 'ca2';
  customTime?: string;
  standardLabel: string;
} {
  const s = (scheduleString || '').toLowerCase();
  let pairKey: 't2_t5' | 't3_t6' | 't4_t7' = 't2_t5';

  if ((s.includes('thứ 3') || s.includes('t3')) && (s.includes('thứ 6') || s.includes('t6'))) {
    pairKey = 't3_t6';
  } else if ((s.includes('thứ 4') || s.includes('t4')) && (s.includes('thứ 7') || s.includes('t7'))) {
    pairKey = 't4_t7';
  } else {
    pairKey = 't2_t5';
  }

  let shiftId: 'ca1' | 'ca2' | undefined;
  if (s.includes('ca 1') || s.includes('18:00') || s.includes('18h')) {
    shiftId = 'ca1';
  } else if (s.includes('ca 2') || s.includes('19:45') || s.includes('21:30')) {
    shiftId = 'ca2';
  }

  const pair = STANDARD_DAY_PAIRS.find((p) => p.id === pairKey)!;
  const standardLabel = shiftId
    ? `${pair.label} (${shiftId === 'ca1' ? 'Ca 1: 18:00 - 19:45' : 'Ca 2: 19:45 - 21:30'})`
    : pair.label;

  return { pairKey, shiftId, standardLabel };
}

export const VIETNAMESE_DAYS = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

/**
 * Tự động nhận diện các thứ trong tuần từ chuỗi lịch học
 */
export function parseScheduleDays(scheduleString: string): number[] {
  if (!scheduleString) return [1, 4]; // Mặc định Thứ 2 & Thứ 5
  const s = scheduleString.toLowerCase();

  // Kiểm tra các cặp chuẩn trước
  if ((s.includes('thứ 2') || s.includes('t2')) && (s.includes('thứ 5') || s.includes('t5'))) {
    return [1, 4];
  }
  if ((s.includes('thứ 3') || s.includes('t3')) && (s.includes('thứ 6') || s.includes('t6'))) {
    return [2, 5];
  }
  if ((s.includes('thứ 4') || s.includes('t4')) && (s.includes('thứ 7') || s.includes('t7'))) {
    return [3, 6];
  }

  // Phân tích linh hoạt
  const days: number[] = [];
  if (s.includes('thứ 2') || s.includes('t2')) days.push(1);
  if (s.includes('thứ 3') || s.includes('t3')) days.push(2);
  if (s.includes('thứ 4') || s.includes('t4')) days.push(3);
  if (s.includes('thứ 5') || s.includes('t5')) days.push(4);
  if (s.includes('thứ 6') || s.includes('t6')) days.push(5);
  if (s.includes('thứ 7') || s.includes('t7')) days.push(6);
  if (s.includes('chủ nhật') || s.includes('cn')) days.push(0);

  return days.length > 0 ? Array.from(new Set(days)).sort() : [1, 4];
}

/**
 * Tự động phát hiện cấp độ Khóa (Khóa 1, Khóa 2, Khóa 3, Khóa 4)
 */
export function detectCourseLevel(
  courseNameOrTerm: string = '',
  totalSessions: number = 32
): CourseLevelKey {
  const s = courseNameOrTerm.toLowerCase();
  if (s.includes('pre') || s.includes('khóa 1') || s.includes('khoa 1') || s.includes('term 1') || s.includes('foundation') || s.includes('junior')) {
    return 'Khóa 1';
  }
  if (s.includes('inspire') || s.includes('khóa 2') || s.includes('khoa 2') || s.includes('term 2') || s.includes('pre-inter') || s.includes('pre-intermediate')) {
    return 'Khóa 2';
  }
  if (s.includes('desire') || s.includes('khóa 3') || s.includes('khoa 3') || s.includes('term 3') || s.includes('intermediate') || s.includes('5.5')) {
    return 'Khóa 3';
  }
  if (s.includes('drill') || s.includes('luyện đề') || s.includes('luyen de') || s.includes('khóa 4') || s.includes('khoa 4') || s.includes('term 4') || s.includes('intensive') || s.includes('master') || s.includes('6.5') || s.includes('7.0')) {
    return 'Khóa 4';
  }

  if (totalSessions === 33) return 'Khóa 2';
  return 'Khóa 1';
}

export interface SessionScheduleItem {
  sessionNumber: number;
  date: string; // YYYY-MM-DD
  formattedDate: string; // DD/MM/YYYY
  dayOfWeek: number; // 0..6
  dayOfWeekName: string; // Thứ 2, Thứ 5...
  isExam: boolean;
  examLabel?: string;
  isSession29TAAlert: boolean;
  taAlertLabel?: string;
  isPreExamAlert?: boolean;
  preExamAlertLabel?: string;
  isFinalSession?: boolean;
  isOffDay?: boolean;
  offReason?: string;
}

export interface CourseMilestone {
  id: string;
  type: 'ta_reminder' | 'pre_exam' | 'exam' | 'course_end' | 'break' | 'next_course';
  sessionNumber?: number;
  date: string;
  formattedDate: string;
  dayOfWeekName?: string;
  title: string;
  description: string;
  badgeColor: string;
  isCompleted?: boolean;
}

export interface CalculatedCourseSchedule {
  levelKey: CourseLevelKey;
  courseLevel: CourseLevelKey;
  config: CourseLevelConfig;
  startDate: string;
  formattedStartDate: string;
  estimatedEndDate: string;
  formattedEstimatedEndDate: string;
  session29Date: string;
  formattedSession29Date: string;
  breakDate?: string;
  formattedBreakDate?: string;
  nextCourseStartDate: string;
  formattedNextCourseStartDate: string;
  totalSessions: number;
  offDatesCount: number;
  offDates: string[];
  examSessions: number[];
  examDates: {
    sessionNumber: number;
    date: string;
    formattedDate: string;
    dayOfWeekName: string;
    label: string;
  }[];
  milestones: CourseMilestone[];
  breakSessionsCount: number;
  sessions: SessionScheduleItem[];
  scheduleDays: number[];
  scheduleDaysLabel: string;
  totalDays: number; // Tổng số ngày từ ngày khai giảng đến ngày kết thúc khóa (theo lịch tuần 2 buổi)
  totalWeeks: number; // Tổng số tuần học
  daysUntilEnd: number; // Số ngày còn lại đến khi kết thúc khóa học so với hôm nay
  isFinished: boolean; // Khóa học đã qua ngày kết thúc hay chưa
  durationSummary: string; // Tóm tắt thời lượng khóa: ví dụ "109 ngày (~16 tuần • 32 buổi tuần 2 buổi)"
  remainingDaysText: string; // ví dụ "Còn 34 ngày nữa kết thúc khóa" hoặc "Đã hoàn thành khóa học"
}

/**
 * Định dạng lại tất cả ngày tháng sang dd/mm/year chuẩn Việt Nam
 * Hỗ trợ mọi kiểu đầu vào: YYYY-MM-DD, ISO string, Date object, timestamp, v.v.
 */
export function formatDateVN(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    const d = String(dateInput.getDate()).padStart(2, '0');
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const y = dateInput.getFullYear();
    return `${d}/${m}/${y}`;
  }

  const str = String(dateInput).trim();
  if (!str) return '';

  // Đã đúng định dạng dd/mm/yyyy
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  }

  // Cắt bỏ phần giờ nếu có chữ T (ISO 8601: 2026-09-13T23:35:17)
  const cleanStr = str.split('T')[0];

  // Định dạng YYYY-MM-DD hoặc YYYY/MM/DD
  const ymdMatch = cleanStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }

  // Parse Date nếu là timestamp hoặc chuỗi ngày khác
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return str;
}

/**
 * Alias tương thích cho formatDateVN
 */
export const formatDate = formatDateVN;
export const formatDateDMY = formatDateVN;

/**
 * Helper thêm số ngày vào Date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Chuyển Date sang chuỗi YYYY-MM-DD
 */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Tính toán toàn bộ lộ trình ngày từng buổi học và Ngày dự kiến kết thúc khóa
 * Đầy đủ hỗ trợ:
 * - Tuần 2 buổi (T2+T5, T3+T6, T4+T7 hoặc cấu hình riêng)
 * - Tự động dời ngày nếu lớp có nghỉ buổi nào đó (offDates)
 * - Đánh dấu buổi kiểm tra cuối khóa cho từng Khóa (K1: 32; K2,K3: 32,33; K4: 31,32)
 * - Đánh dấu Buổi 29 nhắc nhở Giáo viên nhắn Quản lý sắp xếp Trợ giảng (TA)
 * - Tính ngày bắt đầu Khóa tiếp theo (nghỉ 1 buổi trước khi lên khóa mới cho K1, K2, K3)
 */
export function calculateCourseSchedule(
  startDateStr: string,
  scheduleStr: string,
  customTotalSessions?: number,
  offDates: string[] = [],
  courseLevelInput?: string
): CalculatedCourseSchedule {
  const validStartDate = startDateStr || new Date().toISOString().split('T')[0];
  const scheduleDays = parseScheduleDays(scheduleStr);
  const detectedLevel = detectCourseLevel(courseLevelInput || scheduleStr, customTotalSessions);
  const config = COURSE_LEVEL_CONFIGS[detectedLevel];
  const totalSessions = customTotalSessions || config.totalSessions;
  const examSessions = config.examSessions;

  // Lọc tập hợp các ngày nghỉ để tra cứu nhanh O(1)
  const offDateSet = new Set(offDates.filter(Boolean));

  const sessions: SessionScheduleItem[] = [];
  
  // Bắt đầu quét từ ngày khai giảng
  const startParts = validStartDate.split('-').map(Number);
  let currentDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  
  // Nếu ngày khai giảng rơi vào ngày không có trong lịch, tìm ngày học đầu tiên
  while (!scheduleDays.includes(currentDate.getDay())) {
    currentDate = addDays(currentDate, 1);
  }

  let sessionCount = 0;

  // Vòng lặp tìm đủ `totalSessions` buổi học hợp lệ (bỏ qua ngày nghỉ offDates)
  while (sessionCount < totalSessions) {
    const dayOfWeek = currentDate.getDay();
    if (scheduleDays.includes(dayOfWeek)) {
      const dateString = toDateString(currentDate);
      
      if (offDateSet.has(dateString)) {
        // Ngày này lớp được đánh dấu nghỉ/hoãn -> không tính vào số buổi, tiếp tục dời sang buổi sau
      } else {
        sessionCount++;
        const isExam = examSessions.includes(sessionCount);
        const isSession29 = detectedLevel === 'Khóa 4' ? (sessionCount === 28 || sessionCount === 29) : (sessionCount === 29);
        const isPreExam = detectedLevel === 'Khóa 4' ? (sessionCount === 30) : (sessionCount === 31);
        const isFinal = sessionCount === totalSessions;

        let examLabel: string | undefined;
        if (isExam) {
          if (detectedLevel === 'Khóa 1') {
            examLabel = 'Kiểm tra cuối Khóa 1 (PRE) - Đánh giá chuẩn đầu ra (Buổi 32)';
          } else if (detectedLevel === 'Khóa 2') {
            examLabel = sessionCount === 32
              ? 'Kiểm tra cuối Khóa 2 (INSPIRE) - Đợt 1 (Speaking & Writing)'
              : 'Kiểm tra cuối Khóa 2 (INSPIRE) - Đợt 2 (Listening & Reading) & Bế giảng';
          } else if (detectedLevel === 'Khóa 3') {
            examLabel = sessionCount === 32
              ? 'Kiểm tra cuối Khóa 3 (DESIRE) - Đợt 1 (Speaking & Writing)'
              : 'Kiểm tra cuối Khóa 3 (DESIRE) - Đợt 2 (Listening & Reading) & Bế giảng';
          } else if (detectedLevel === 'Khóa 4') {
            examLabel = sessionCount === 31
              ? 'Kiểm tra Mock Test Khóa 4 (DRILL) - Đợt 1 (Buổi 31)'
              : 'Kiểm tra Mock Test Khóa 4 (DRILL) - Đợt 2 (Buổi 32) & Tốt nghiệp';
          } else {
            examLabel = `Kiểm tra cuối khóa (Buổi ${sessionCount})`;
          }
        }

        let taAlertLabel: string | undefined;
        if (isSession29) {
          if (detectedLevel === 'Khóa 1') {
            taAlertLabel = 'Buổi 29: Nhắn Quản lý sắp xếp Trợ giảng (TA) chuẩn bị thi Buổi 32';
          } else if (detectedLevel === 'Khóa 4') {
            taAlertLabel = 'Buổi 28-29: Nhắn Quản lý sắp xếp Trợ giảng (TA) sớm chuẩn bị thi từ Buổi 31';
          } else {
            taAlertLabel = 'Buổi 29: Nhắn Quản lý sắp xếp Trợ giảng (TA) chuẩn bị thi 2 buổi 32 & 33';
          }
        }

        let preExamAlertLabel: string | undefined;
        if (isPreExam) {
          if (detectedLevel === 'Khóa 1') {
            preExamAlertLabel = 'Nhắc chuẩn bị phòng thi & ôn tập cho đợt thi Buổi 32';
          } else if (detectedLevel === 'Khóa 4') {
            preExamAlertLabel = 'Nhắc chuẩn bị thi Mock Test 2 buổi 31 & 32';
          } else {
            preExamAlertLabel = 'Nhắc chuẩn bị thi 2 buổi 32 & 33 (Đợt 1 & Đợt 2)';
          }
        }

        sessions.push({
          sessionNumber: sessionCount,
          date: dateString,
          formattedDate: formatDateVN(dateString),
          dayOfWeek,
          dayOfWeekName: VIETNAMESE_DAYS[dayOfWeek],
          isExam,
          examLabel,
          isSession29TAAlert: isSession29,
          taAlertLabel,
          isPreExamAlert: isPreExam,
          preExamAlertLabel,
          isFinalSession: isFinal,
        });
      }
    }

    if (sessionCount < totalSessions) {
      currentDate = addDays(currentDate, 1);
    }
  }

  const lastSession = sessions[sessions.length - 1];
  const estimatedEndDate = lastSession ? lastSession.date : validStartDate;
  
  const session29 = sessions.find((s) => s.sessionNumber === 29);
  const session29Date = session29 ? session29.date : '';

  // Tính ngày bắt đầu khóa tiếp theo:
  // Nếu có breakAfterCourseSessions = 1 -> bỏ qua 1 buổi học trong lịch học tiếp theo rồi mới bắt đầu khóa mới
  let nextDate = addDays(currentDate, 1);
  let breakSlotsPassed = 0;
  const breakTarget = config.breakAfterCourseSessions;
  let breakDateStr = '';

  while (breakSlotsPassed < breakTarget) {
    if (scheduleDays.includes(nextDate.getDay())) {
      breakSlotsPassed++;
      breakDateStr = toDateString(nextDate);
    }
    nextDate = addDays(nextDate, 1);
  }

  // Tìm ngày học tiếp theo trong lịch cho Khóa mới
  while (!scheduleDays.includes(nextDate.getDay())) {
    nextDate = addDays(nextDate, 1);
  }
  const nextCourseStartDate = toDateString(nextDate);

  const scheduleDaysLabel = scheduleDays.map((d) => VIETNAMESE_DAYS[d]).join(' + ');

  // Danh sách chi tiết các buổi kiểm tra
  const examDates = sessions
    .filter((s) => s.isExam)
    .map((s) => ({
      sessionNumber: s.sessionNumber,
      date: s.date,
      formattedDate: s.formattedDate,
      dayOfWeekName: s.dayOfWeekName,
      label: s.examLabel || `Kiểm tra Buổi ${s.sessionNumber}`,
    }));

  // Lập danh sách các mốc nhắc nhở & chuyển giao quan trọng (Milestones)
  const milestones: CourseMilestone[] = [];

  // Mốc 1: Nhắc xếp Trợ giảng (TA)
  if (session29) {
    milestones.push({
      id: 'milestone-ta',
      type: 'ta_reminder',
      sessionNumber: 29,
      date: session29.date,
      formattedDate: session29.formattedDate,
      dayOfWeekName: session29.dayOfWeekName,
      title: detectedLevel === 'Khóa 4' ? 'Buổi 28-29: Nhắc xếp Trợ giảng (TA)' : 'Buổi 29: Nhắc xếp Trợ giảng (TA)',
      description: detectedLevel === 'Khóa 4'
        ? 'Giáo viên nhắn Quản lý sắp xếp TA chuẩn bị cho đợt thi Mock Test Buổi 31 & 32'
        : detectedLevel === 'Khóa 1'
        ? 'Giáo viên nhắn Quản lý sắp xếp TA chuẩn bị cho đợt thi Buổi 32'
        : 'Giáo viên nhắn Quản lý sắp xếp TA chuẩn bị cho đợt thi 2 buổi 32 & 33',
      badgeColor: 'amber',
    });
  }

  // Mốc 2: Các buổi kiểm tra cuối khóa
  examDates.forEach((ed) => {
    milestones.push({
      id: `milestone-exam-${ed.sessionNumber}`,
      type: 'exam',
      sessionNumber: ed.sessionNumber,
      date: ed.date,
      formattedDate: ed.formattedDate,
      dayOfWeekName: ed.dayOfWeekName,
      title: `Buổi ${ed.sessionNumber}: ${ed.label}`,
      description: `Đánh giá năng lực theo chuẩn ${config.name}`,
      badgeColor: 'indigo',
    });
  });

  // Mốc 3: Bế giảng kết thúc khóa
  if (lastSession) {
    milestones.push({
      id: 'milestone-end',
      type: 'course_end',
      sessionNumber: lastSession.sessionNumber,
      date: lastSession.date,
      formattedDate: lastSession.formattedDate,
      dayOfWeekName: lastSession.dayOfWeekName,
      title: `Buổi ${lastSession.sessionNumber}: Bế giảng kết thúc ${config.label}`,
      description: config.endRule,
      badgeColor: 'purple',
    });
  }

  // Mốc 4: Nghỉ chuyển tiếp (nếu có)
  if (breakDateStr) {
    const breakDateObj = new Date(breakDateStr);
    milestones.push({
      id: 'milestone-break',
      type: 'break',
      date: breakDateStr,
      formattedDate: formatDateVN(breakDateStr),
      dayOfWeekName: VIETNAMESE_DAYS[breakDateObj.getDay()] || '',
      title: 'Nghỉ 1 buổi chuyển tiếp giữa 2 khóa',
      description: config.breakRule,
      badgeColor: 'slate',
    });
  }

  // Mốc 5: Khai giảng khóa tiếp theo
  if (config.nextCourseName) {
    const nextStartObj = new Date(nextCourseStartDate);
    milestones.push({
      id: 'milestone-next',
      type: 'next_course',
      date: nextCourseStartDate,
      formattedDate: formatDateVN(nextCourseStartDate),
      dayOfWeekName: VIETNAMESE_DAYS[nextStartObj.getDay()] || '',
      title: `Khai giảng ${config.nextCourseName}`,
      description: `Bắt đầu chương trình đào tạo tiếp theo trong lộ trình`,
      badgeColor: 'emerald',
    });
  }

  // Soi xét lịch học tuần 2 buổi: Tính chính xác số ngày diễn ra khóa học
  const startPartsForDiff = validStartDate.split('-').map(Number);
  const endPartsForDiff = estimatedEndDate.split('-').map(Number);
  const startDateObj = new Date(startPartsForDiff[0], startPartsForDiff[1] - 1, startPartsForDiff[2]);
  const endDateObj = new Date(endPartsForDiff[0], endPartsForDiff[1] - 1, endPartsForDiff[2]);
  
  const diffTime = endDateObj.getTime() - startDateObj.getTime();
  const totalDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

  // Tính số ngày còn lại đến khi kết thúc khóa so với hôm nay
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endCompare = new Date(endDateObj);
  endCompare.setHours(0, 0, 0, 0);
  const timeDiffFromToday = endCompare.getTime() - today.getTime();
  const daysUntilEnd = Math.round(timeDiffFromToday / (1000 * 60 * 60 * 24));
  const isFinished = daysUntilEnd < 0;

  const durationSummary = `${totalDays} ngày (~${totalWeeks} tuần • ${totalSessions} buổi tuần 2 buổi)`;
  let remainingDaysText = '';
  if (isFinished) {
    remainingDaysText = `Đã hoàn thành khóa học (${Math.abs(daysUntilEnd)} ngày trước)`;
  } else if (daysUntilEnd === 0) {
    remainingDaysText = 'Hôm nay là buổi kết thúc khóa!';
  } else {
    remainingDaysText = `Còn ${daysUntilEnd} ngày nữa kết thúc khóa`;
  }

  return {
    levelKey: detectedLevel,
    courseLevel: detectedLevel,
    config,
    startDate: validStartDate,
    formattedStartDate: formatDateVN(validStartDate),
    estimatedEndDate,
    formattedEstimatedEndDate: formatDateVN(estimatedEndDate),
    session29Date,
    formattedSession29Date: formatDateVN(session29Date),
    breakDate: breakDateStr || undefined,
    formattedBreakDate: breakDateStr ? formatDateVN(breakDateStr) : undefined,
    nextCourseStartDate,
    formattedNextCourseStartDate: formatDateVN(nextCourseStartDate),
    totalSessions,
    offDatesCount: offDates.length,
    offDates,
    examSessions,
    examDates,
    milestones,
    breakSessionsCount: config.breakAfterCourseSessions,
    sessions,
    scheduleDays,
    scheduleDaysLabel,
    totalDays,
    totalWeeks,
    daysUntilEnd,
    isFinished,
    durationSummary,
    remainingDaysText,
  };
}

export interface ClassEndInfo {
  startDate: string;
  formattedStartDate: string;
  endDate: string;
  formattedEndDate: string;
  courseLevel: CourseLevelKey;
  levelConfig: CourseLevelConfig;
  totalDays: number;
  totalWeeks: number;
  daysUntilEnd: number;
  isFinished: boolean;
  totalSessions: number;
  completedSessions: number;
  remainingSessions: number;
  examSessions: number[];
  examDates: { sessionNumber: number; date: string; formattedDate: string; label: string }[];
  session29Date: string;
  formattedSession29Date: string;
  breakDate?: string;
  formattedBreakDate?: string;
  nextCourseStartDate: string;
  formattedNextCourseStartDate: string;
  taAlertStatus: 'needed' | 'passed' | 'upcoming';
  examStatus: 'in_exam' | 'passed' | 'upcoming';
  examRuleBadge: string;
  durationSummary: string;
  remainingDaysText: string;
}

/**
 * Tiện ích lấy nhanh thông tin kết thúc khóa và số ngày của bất kỳ lớp học nào
 */
export function calculateClassEndInfo(classGroup: {
  startDate: string;
  schedule: string;
  totalSessions?: number;
  offDates?: string[];
  completedSessions?: number;
  courseLevel?: string;
  courseName?: string;
}): ClassEndInfo {
  const sched = calculateCourseSchedule(
    classGroup.startDate,
    classGroup.schedule,
    classGroup.totalSessions,
    classGroup.offDates || [],
    classGroup.courseLevel || classGroup.courseName
  );

  const completed = classGroup.completedSessions || 0;
  const remainingSessions = Math.max(0, sched.totalSessions - completed);

  // Trạng thái nhắc Trợ giảng
  let taAlertStatus: 'needed' | 'passed' | 'upcoming' = 'upcoming';
  if (completed >= 29) {
    taAlertStatus = 'passed';
  } else if (completed >= 27 && completed <= 29) {
    taAlertStatus = 'needed';
  }

  // Trạng thái kiểm tra cuối khóa
  const firstExamSession = sched.examSessions[0] || sched.totalSessions;
  let examStatus: 'in_exam' | 'passed' | 'upcoming' = 'upcoming';
  if (completed >= sched.totalSessions) {
    examStatus = 'passed';
  } else if (completed >= firstExamSession - 1) {
    examStatus = 'in_exam';
  }

  const examRuleBadge = sched.examSessions.length === 1
    ? `Thi B.${sched.examSessions[0]}`
    : `Thi B.${sched.examSessions.join(' & ')}`;

  return {
    startDate: sched.startDate,
    formattedStartDate: sched.formattedStartDate,
    endDate: sched.estimatedEndDate,
    formattedEndDate: sched.formattedEstimatedEndDate,
    courseLevel: sched.courseLevel,
    levelConfig: sched.config,
    totalDays: sched.totalDays,
    totalWeeks: sched.totalWeeks,
    daysUntilEnd: sched.daysUntilEnd,
    isFinished: sched.isFinished,
    totalSessions: sched.totalSessions,
    completedSessions: completed,
    remainingSessions,
    examSessions: sched.examSessions,
    examDates: sched.examDates,
    session29Date: sched.session29Date,
    formattedSession29Date: sched.formattedSession29Date,
    breakDate: sched.breakDate,
    formattedBreakDate: sched.formattedBreakDate,
    nextCourseStartDate: sched.nextCourseStartDate,
    formattedNextCourseStartDate: sched.formattedNextCourseStartDate,
    taAlertStatus,
    examStatus,
    examRuleBadge,
    durationSummary: sched.durationSummary,
    remainingDaysText: sched.remainingDaysText,
  };
}

/**
 * Sinh mẫu tin nhắn Zalo chuẩn để giáo viên nhắn cho Quản lý trung tâm sắp xếp Trợ giảng (TA)
 * Tự động phân loại chuẩn:
 * - Khóa 1: Kiểm tra vào Buổi 32
 * - Khóa 2 & 3: Kiểm tra vào Buổi 32 & 33
 * - Khóa 4: Kiểm tra Mock Test vào Buổi 31 & 32
 */
export function generateTAReminderZaloMessage(
  className: string,
  teacherName: string,
  courseLevelInput: string = 'Khóa 1',
  sessionNumber: number = 29,
  sessionDateFormatted?: string
): string {
  const detected = detectCourseLevel(courseLevelInput);
  const cfg = COURSE_LEVEL_CONFIGS[detected];
  const examText = cfg.examSessions.length === 1
    ? `Buổi ${cfg.examSessions[0]}`
    : `Buổi ${cfg.examSessions.join(' & ')}`;

  return `🔔 [IELTS DƯƠNG VŨ] - THÔNG BÁO SẮP XẾP TRỢ GIẢNG (TA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kính gửi: Quản lý Trung tâm IELTS DƯƠNG VŨ
Giáo viên phụ trách: ${teacherName || 'Giáo viên'}
Lớp học: ${className} (${cfg.label})

Lớp hiện đã giảng dạy đến Buổi ${sessionNumber} ${sessionDateFormatted ? `(Ngày: ${sessionDateFormatted})` : ''}.
Theo quy chế đào tạo chuẩn của trung tâm:
- Lớp sẽ bước vào đợt kiểm tra chất lượng cuối khóa vào ${examText}.
- Giáo viên gửi thông báo để Quản lý trung tâm sắp xếp TRỢ GIẢNG (TA) hỗ trợ lớp chuẩn bị đề thi, coi thi và đồng hành cùng học viên trong đợt thi này.

Trân trọng cảm ơn Quản lý!`;
}

/**
 * Sinh mẫu tin nhắn Zalo gửi Học sinh / Phụ huynh thông báo lịch thi cuối khóa
 */
export function generateExamReminderZaloMessage(
  className: string,
  courseLevelInput: string,
  scheduleStr: string,
  examDatesInfo: { sessionNumber: number; formattedDate: string; label: string }[]
): string {
  const detected = detectCourseLevel(courseLevelInput);
  const cfg = COURSE_LEVEL_CONFIGS[detected];
  const examLines = examDatesInfo.length > 0
    ? examDatesInfo.map((e) => `• Buổi ${e.sessionNumber} (${e.formattedDate}): ${e.label}`).join('\n')
    : `• Buổi ${cfg.examSessions.join(' & ')} theo lịch học ${scheduleStr}`;

  return `📢 [IELTS DƯƠNG VŨ] - THÔNG BÁO LỊCH KIỂM TRA ĐÁNH GIÁ CHẤT LƯỢNG CUỐI KHÓA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kính gửi: Quý Phụ huynh và các bạn Học viên lớp ${className} (${cfg.label})
Lịch học: ${scheduleStr}

Trung tâm IELTS DƯƠNG VŨ xin thông báo lịch kiểm tra cuối khóa như sau:
${examLines}

📌 QUY ĐỊNH KỲ THI:
1. Học viên có mặt đúng giờ trước ca thi 10 phút để ổn định vị trí.
2. Chuẩn bị đầy đủ bút viết, tài liệu ôn tập và thiết bị nghe (nếu có).
3. Kết quả bài kiểm tra là căn cứ đánh giá năng lực thực tế và xét điều kiện chuyển tiếp lên khóa học kế tiếp theo cam kết đào tạo.

Chúc các bạn học viên ôn tập chu đáo và đạt kết quả cao nhất!`;
}

/**
 * Sinh mẫu tin nhắn Zalo thông báo bế giảng và kế hoạch lên khóa mới
 */
export function generateCourseEndSummaryZaloMessage(
  className: string,
  courseLevelInput: string,
  endDateFormatted: string,
  breakDateFormatted?: string,
  nextCourseStartDateFormatted?: string,
  nextCourseName?: string
): string {
  const detected = detectCourseLevel(courseLevelInput);
  const cfg = COURSE_LEVEL_CONFIGS[detected];

  return `🎓 [IELTS DƯƠNG VŨ] - THÔNG BÁO BẾ GIẢNG & LÊN KHÓA MỚI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kính gửi: Quý Phụ huynh và toàn thể Học viên lớp ${className} (${cfg.label})

Trung tâm IELTS DƯƠNG VŨ xin thông báo kế hoạch kết thúc khóa học và lộ trình chuyển tiếp:
- 📅 Ngày bế giảng kết thúc khóa: ${endDateFormatted}
${breakDateFormatted ? `- ⏸️ Quy chế nghỉ chuyển giao: Nghỉ 1 buổi vào ngày ${breakDateFormatted} để trung tâm tổng hợp điểm số và chuẩn bị học liệu mới.` : '- 🚀 Khóa 4 không nghỉ: Học viên hoàn thành toàn bộ lộ trình và sẵn sàng cho kỳ thi IELTS quốc tế.'}
${nextCourseStartDateFormatted ? `- 🌟 Khai giảng khóa mới (${nextCourseName || cfg.nextCourseName}): ${nextCourseStartDateFormatted}` : ''}

Trân trọng chúc mừng sự nỗ lực và tiến bộ vượt bậc của các bạn học viên trong suốt khóa học vừa qua!`;
}
