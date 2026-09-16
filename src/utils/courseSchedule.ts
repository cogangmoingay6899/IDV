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
  isOffDay?: boolean;
  offReason?: string;
}

export interface CalculatedCourseSchedule {
  courseLevel: CourseLevelKey;
  config: CourseLevelConfig;
  startDate: string;
  formattedStartDate: string;
  estimatedEndDate: string;
  formattedEstimatedEndDate: string;
  session29Date: string;
  formattedSession29Date: string;
  nextCourseStartDate: string;
  formattedNextCourseStartDate: string;
  totalSessions: number;
  offDatesCount: number;
  offDates: string[];
  examSessions: number[];
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
        const isSession29 = sessionCount === 29;

        let examLabel: string | undefined;
        if (isExam) {
          if (detectedLevel === 'Khóa 1') {
            examLabel = 'Kiểm tra cuối Khóa 1';
          } else if (detectedLevel === 'Khóa 2') {
            examLabel = sessionCount === 32 ? 'Kiểm tra cuối Khóa 2 (Phần 1)' : 'Kiểm tra cuối Khóa 2 (Phần 2)';
          } else if (detectedLevel === 'Khóa 3') {
            examLabel = sessionCount === 32 ? 'Kiểm tra cuối Khóa 3 (Phần 1)' : 'Kiểm tra cuối Khóa 3 (Phần 2)';
          } else if (detectedLevel === 'Khóa 4') {
            examLabel = sessionCount === 31 ? 'Kiểm tra cuối Khóa 4 (Phần 1)' : 'Kiểm tra cuối Khóa 4 (Phần 2)';
          } else {
            examLabel = `Kiểm tra cuối khóa (Buổi ${sessionCount})`;
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

  while (breakSlotsPassed < breakTarget) {
    if (scheduleDays.includes(nextDate.getDay())) {
      breakSlotsPassed++;
    }
    nextDate = addDays(nextDate, 1);
  }

  // Tìm ngày học tiếp theo trong lịch cho Khóa mới
  while (!scheduleDays.includes(nextDate.getDay())) {
    nextDate = addDays(nextDate, 1);
  }
  const nextCourseStartDate = toDateString(nextDate);

  const scheduleDaysLabel = scheduleDays.map((d) => VIETNAMESE_DAYS[d]).join(' + ');

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
    courseLevel: detectedLevel,
    config,
    startDate: validStartDate,
    formattedStartDate: formatDateVN(validStartDate),
    estimatedEndDate,
    formattedEstimatedEndDate: formatDateVN(estimatedEndDate),
    session29Date,
    formattedSession29Date: formatDateVN(session29Date),
    nextCourseStartDate,
    formattedNextCourseStartDate: formatDateVN(nextCourseStartDate),
    totalSessions,
    offDatesCount: offDates.length,
    offDates,
    examSessions,
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
  totalDays: number;
  totalWeeks: number;
  daysUntilEnd: number;
  isFinished: boolean;
  remainingSessions: number;
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

  return {
    startDate: sched.startDate,
    formattedStartDate: sched.formattedStartDate,
    endDate: sched.estimatedEndDate,
    formattedEndDate: sched.formattedEstimatedEndDate,
    totalDays: sched.totalDays,
    totalWeeks: sched.totalWeeks,
    daysUntilEnd: sched.daysUntilEnd,
    isFinished: sched.isFinished,
    remainingSessions,
    durationSummary: sched.durationSummary,
    remainingDaysText: sched.remainingDaysText,
  };
}

/**
 * Sinh mẫu tin nhắn Zalo chuẩn để giáo viên nhắn cho Quản lý trung tâm sắp xếp Trợ giảng (TA)
 */
export function generateTAReminderZaloMessage(
  className: string,
  teacherName: string,
  sessionNumber: number = 29,
  sessionDateFormatted?: string
): string {
  return `🔔 [IELTS DƯƠNG VŨ] - THÔNG BÁO SẮP XẾP TRỢ GIẢNG (TA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kính gửi: Quản lý Trung tâm IELTS DƯƠNG VŨ
Giáo viên phụ trách: ${teacherName || 'Giáo viên'}
Lớp học: ${className}

Lớp đã giảng dạy đến Buổi ${sessionNumber} ${sessionDateFormatted ? `(Ngày: ${sessionDateFormatted})` : ''}.
Theo quy chế đào tạo, em gửi thông báo để Quản lý trung tâm chuẩn bị và sắp xếp TRỢ GIẢNG (TA) hỗ trợ lớp chuẩn bị cho đợt thi kiểm tra chất lượng cuối khóa (Buổi 32 - 33).

Trân trọng cảm ơn Quản lý!`;
}
