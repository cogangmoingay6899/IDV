export type UserRole = 'teacher' | 'assistant' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
  teacherId?: string;
  phone?: string;
  title?: string;
  pinCode?: string;
}

export type ModuleId =
  | 'dashboard'
  | 'finance'
  | 'sheet_gradebook'
  | 'hr'
  | 'admissions'
  | 'trial'
  | 'placement'
  | 'students'
  | 'contact_book'
  | 'attendance'
  | 'reports'
  | 'exams'
  | 'teacher_sessions'
  | 'kpi'
  | 'curriculum'
  | 'inventory';

export interface Student {
  id: string;
  code: string; // e.g. HV-2026-001
  name: string;
  dob: string;
  gender: 'Nam' | 'Nữ';
  phone: string;
  email: string;
  parentName: string;
  parentPhone: string;
  address: string;
  classId: string;
  className: string;
  courseName: string;
  status: 'Đang học' | 'Bảo lưu' | 'Đã tốt nghiệp' | 'Chờ xếp lớp' | 'Đã nghỉ học';
  joinDate: string;
  avatar?: string;
  tuitionStatus: 'Đã đóng đủ' | 'Còn nợ' | 'Chưa đóng';
  balanceOwed: number;
  studentCategory?: 'Thường' | 'Học lại' | 'Thêm mới' | 'Học sinh ngoài';
  isExternalStudent?: boolean; // Đánh dấu học sinh ngoài (đăng ký thẳng Khóa 4, không học từ các khóa trước)
  customTuitionFee?: number; // Học phí tùy chỉnh khác mặc định của khóa
  droppedClassId?: string;
  droppedClassName?: string;
  droppedDate?: string;
  droppedReason?: string;
  waitingForClassId?: string;
  waitingNote?: string;
  // Quản lý ngày học riêng từng học viên & Học phí khóa học
  startDate?: string; // Ngày bắt đầu học riêng từng bạn (nếu khác ngày khai giảng chung của lớp)
  endDate?: string; // Ngày kết thúc khóa riêng từng bạn (dự kiến hoặc thực tế)
  registeredSessions?: number; // Số buổi học đăng ký / kết thúc sớm (< 32 buổi)
  earlyEndSessions?: number; // Số buổi kết thúc sớm (< 32 buổi)
  proRatedTuitionFee?: number; // Học phí tự tính theo số buổi (< 32 buổi)
  previousDebt?: number; // Nợ học phí khóa trước / chu kỳ trước cộng dồn sang chu kỳ mới
  carriedOverDebt?: number; // Tiền nợ khóa trước đã cộng dồn
  isNewCycleDebtCarriedOver?: boolean; // Đánh dấu đã cộng dồn nợ khóa trước
  courseTuitionFee?: number;
  joinedLateSessions?: number;
  tuitionDiscountLate?: number;
  tuitionPayable?: number;
  tuitionPaidDate?: string; // Ngày nộp học phí riêng từng bạn
  tuitionAmountPaid?: number; // Số tiền học phí đã nộp thực tế
  tuitionDeadlineDate?: string; // Hạn nộp học phí quy định
  tuitionReminderCount?: number;
  tuitionReminderNote?: string;
  tuitionPromiseDate?: string;
  tuitionPromiseNote?: string;
  // Thông tin thi chứng chỉ / thi cuối khóa & Ghi chú cá nhân
  examDate?: string; // Ngày thi (IELTS / Cambridge / Cuối khóa)
  examRegisterDate?: string; // Ngày đăng ký thi
  note?: string; // Ghi chú cá nhân / học tập
}

export interface ClassGroup {
  id: string;
  code: string; // e.g. ENG-IELTS-01
  name: string;
  courseId: string;
  courseName: string;
  branch?: string;
  teacherId?: string;
  teacherName: string; // Tên 1 hoặc nhiều giáo viên (ví dụ: "Tâm Vương, Minh Tâm")
  teacherNames?: string[]; // Danh sách các giáo viên cùng phụ trách lớp
  assistantTeacherName?: string;
  room: string;
  schedule: string; // e.g. "Thứ 2 + Thứ 5 (Ca 1: 18:00 - 19:45)"
  startDate: string;
  endDate: string;
  totalSessions: number;
  completedSessions: number;
  maxStudents: number;
  currentStudents: number;
  tuitionFee?: number;
  currentTerm?: number; // e.g. 1, 2, 3, 4, 5...
  currentTermName?: string; // e.g. "Khóa 1", "Khóa 2"...
  courseLevel?: 'Khóa 1' | 'Khóa 2' | 'Khóa 3' | 'Khóa 4' | string;
  shift?: 'Ca 1' | 'Ca 2' | string;
  offDates?: string[]; // Danh sách các ngày nghỉ của lớp học để tự động dời ngày dự kiến kết thúc
  termHistory?: {
    term: number;
    startDate: string;
    endDate: string;
    tuitionFee: number;
    completedSessions: number;
    totalSessions: number;
    teacherId?: string;
    teacherName: string;
    studentCount: number;
  }[];
  status: 'Đang diễn ra' | 'Sắp khai giảng' | 'Đã kết thúc';
}

export interface Teacher {
  id: string;
  code: string;
  name: string;
  type: 'Bản ngữ (Native)' | 'Việt Nam';
  nationality: string;
  email: string;
  phone: string;
  specialty: string; // e.g. "IELTS 8.5+, Pronunciation"
  degrees: string; // e.g. "CELTA, TESOL, Master in TESOL"
  activeClassesCount: number;
  hourlyRate: number;
  rateRegularStudent?: number; // Đơn giá HS thường / HS / buổi
  rateRetakeStudent?: number;  // Đơn giá HS học lại / HS / buổi
  rateNewStudent?: number;     // Đơn giá HS thêm mới / HS / buổi
  rating: number; // e.g. 4.9
  status: 'Đang giảng dạy' | 'Nghỉ phép' | 'Tạm ngưng';
}

export interface TeacherSubstituteRecord {
  id: string;
  classId: string;
  className: string;
  classSchedule: string;
  originalTeacherId?: string;
  originalTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  date: string;
  shift: string;
  sessionNumber?: number;
  reason?: string;
  status: 'Đã lên lịch' | 'Đã hoàn thành' | 'Đã hủy';
  notes?: string;
  createdAt: string;
}

export interface LeadAdmission {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  source: 'Facebook Ads' | 'Google' | 'Giới thiệu' | 'Trực tiếp tại cơ sở' | 'TikTok' | 'Form Test Online';
  targetCourse: string;
  consultantName: string;
  stage: 'Tiếp cận mới' | 'Đã liên hệ' | 'Hẹn test đầu vào' | 'Hẹn học thử' | 'Chờ đóng phí' | 'Đã nhập học' | 'Hủy tư vấn';
  notes: string;
  createdAt: string;
  expectedRevenue: number;
}

export interface PlacementTest {
  id: string;
  code: string;
  candidateName: string;
  dob?: string;
  gender?: 'Nam' | 'Nữ';
  phone: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  testDate: string;
  evaluatorName: string;
  listeningScore: number;
  speakingScore: number;
  readingScore: number;
  writingScore: number;
  overallScore: number;
  targetLevel: string;
  recommendedCourse: string;
  recommendedClassId?: string;
  assignedClassId?: string;
  assignedClassName?: string;
  status: 'Đã có kết quả' | 'Chờ chấm điểm' | 'Chờ làm bài' | 'Đã xếp lớp chờ' | 'Đã nhập học' | 'Không đạt';
  comment: string;
  sourceType?: 'form_online' | 'manual' | 'google_form_link';
  submittedAt?: string;
  googleFormLink?: string;
  tabSwitchCount?: number;
  antiCheatLogs?: string[];
  school?: string;
  facebookLink?: string;
  targetExamDate?: string;
  preferredCampus?: string;
  preferredSchedule?: string;
  previousIeltsExperience?: string;
  referralSource?: string;
  cameraEnabled?: boolean;
  speakingAudioUrl?: string;
  speakingAudioDuration?: number;
  testDurationMinutes?: number;
  timeSpentSeconds?: number;
  isOverdue?: boolean;
  overdueSeconds?: number;
  overdueText?: string;
  timeSpentFormatted?: string;
  testAnswers?: {
    vocab?: Record<string, string>;
    listening?: Record<string, string>;
    reading?: Record<string, string>;
    writingSentences?: Record<string, string>;
    writingParagraph?: string;
    speakingAudioUrl?: string;
    speakingAudioDuration?: number;
  };
}

export interface TrialStudent {
  id: string;
  studentName: string;
  phone: string;
  parentName?: string;
  targetCourse: string;
  classId: string;
  className: string;
  trialDate: string;
  trialTime: string;
  teacherName: string;
  attendanceStatus: 'Đã tham gia' | 'Vắng mặt' | 'Chờ học thử';
  feedbackStatus: 'Rất thích - Đăng ký ngay' | 'Đang cân nhắc' | 'Không phù hợp';
  notes: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string;
  sessionNumber: number;
  studentId: string;
  studentName: string;
  status: 'Có mặt' | 'Đi muộn' | 'Đi trễ' | 'Nghỉ có phép' | 'Nghỉ không phép';
  note?: string;
  teacherNote?: string;
  teacherName?: string;
  skillTaught?: string;
  skillsTaught?: string[]; // Multiple skills tested in the session e.g. ['Từ vựng', 'Nghe', 'Đọc']
  skillScores?: Record<string, string | number>; // e.g. { 'Từ vựng': 9, 'Nghe': 8.5, 'Đọc': 8 }
  score?: number | string;
  rawScore?: string;
  correctCount?: number;
  totalQuestions?: number;
  penaltyCopies?: number; // Số lần chép phạt (khi học Viết)
  penaltyFee?: number | string; // Số tiền nộp phạt (VNĐ)
  previousDebt?: number | string; // Nợ chưa nộp các buổi trước (VNĐ)
  penaltyBankAccount?: string; // STK nộp phạt
  skillTotalQuestions?: Record<string, string | number>; // e.g. { 'Từ vựng': 30, 'Nghe': 40 }
  homeworkItems?: string[]; // Danh sách đề mục BTVN (Nghe, Nói, Đọc, Viết, Chép phạt, Chữa bài...)
  missingHomeworkItems?: string[]; // Danh sách đề mục học viên bị thiếu
  homeworkStatus?: 'Đã làm' | 'Chưa làm' | 'Thiếu';
  quizletStatus?: 'Đã học' | 'Chưa học';
}

export interface TeachingSession {
  id: string;
  classId: string;
  className: string;
  date: string;
  sessionNumber: number;
  teacherName: string;
  skillTaught?: string;
  skillsTaught?: string[];
  lessonTopic: string;
  homeworkAssigned?: string;
  homeworkItems?: string[];
  quizletAssigned?: string;
  studentScores: {
    studentId: string;
    studentName: string;
    status: 'Có mặt' | 'Đi muộn' | 'Đi trễ' | 'Nghỉ có phép' | 'Nghỉ không phép';
    score?: number | string;
    skillScores?: Record<string, string | number>;
    penaltyCopies?: number;
    feedback?: string;
    homeworkDone?: boolean;
    homeworkItems?: string[];
    missingHomeworkItems?: string[];
    homeworkStatus?: 'Đã làm' | 'Chưa làm' | 'Thiếu';
    quizletStatus?: 'Đã học' | 'Chưa học';
  }[];
}

export interface TuitionTransaction {
  id: string;
  receiptCode: string; // e.g. PT-2026-089
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  classId?: string;
  amount: number;
  paymentMethod: 'Chuyển khoản QR' | 'Tiền mặt' | 'Thẻ tín dụng (POS)' | 'Trả góp 0%' | string;
  transactionType: 'Thu học phí' | 'Thu giáo trình/đồng phục' | 'Chi hoàn phí' | 'Phí kiểm tra' | string;
  date: string;
  collectorName: string;
  status: 'Thành công' | 'Chờ xác nhận' | string;
  notes: string;
}

export interface ContactBookNote {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string;
  lessonTopic: string;
  attitude: 'Hăng hái, tập trung' | 'Khá tốt' | 'Cần tập trung hơn';
  homeworkStatus: 'Hoàn thành 100%' | 'Hoàn thành một phần' | 'Chưa làm bài';
  quizletStatus?: 'Đã học' | 'Chưa học';
  penaltyCopies?: number; // Số lần chép phạt nếu có
  teacherFeedback: string;
  sentVia: 'Zalo & App Phụ Huynh' | 'SMS' | 'Chưa gửi';
  parentAcknowledged: boolean;
}

export interface MilestoneEvaluationReport {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classId: string;
  className: string;
  milestonePeriod: string; // e.g. "Buổi 1 - 10" | "Buổi 11 - 20" | "Buổi 21 - 30"
  createdDate: string;
  teacherName: string;
  parentName?: string;
  parentPhone?: string;

  // 3 Core criteria on 100-point scale:
  attendanceScore: number; // Max 30 pts (Đi học đầy đủ)
  attendanceDetails: string; // e.g. "10/10 buổi (100%)"

  homeworkScore: number;   // Max 30 pts (Làm đủ bài tập)
  homeworkDetails: string; // e.g. "10/10 bài tập đạt 100%"

  examScore: number;       // Max 40 pts (Điểm số kiểm tra & tương tác)
  examDetails: string;     // e.g. "Điểm TB 8.8/10 -> 35.2/40"

  totalScore: number;      // Max 100 pts (= attendanceScore + homeworkScore + examScore)
  gradeRank: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Cần rèn luyện';

  teacherComments: string; // Nhận xét giáo viên
  parentAdvice: string;    // Lời khuyên/đề xuất phụ huynh
  sentToParent: boolean;
  sentDate?: string;
}

export interface ExamScore {
  id: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  classId: string;
  className: string;
  examName: string; // e.g. "Mid-term IELTS 6.5", "Final Test Starters", "Test Từ Vựng"
  examDate: string;
  listening?: number;
  speaking?: number;
  reading?: number;
  writing?: number;
  totalScore: number;
  rank?: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Cần rèn luyện';
  certificateGranted?: boolean;
  teacherComment?: string;
}

export interface CurriculumCourse {
  id: string;
  code: string;
  name: string;
  level: string; // e.g. "A1-A2", "B1-B2", "IELTS 5.5 - 6.5"
  durationHours?: number;
  durationMonths?: number;
  totalSessions: number;
  tuitionFee: number;
  mainTextbook?: string;
  modulesCount?: number;
  description: string;
  targetAudience?: string;
  syllabus?: { session: number; topic: string; skill: string }[];
}

export interface KPITarget {
  id: string;
  staffName: string;
  role: 'Tư vấn tuyển sinh' | 'Trưởng phòng tuyển sinh' | 'CSKH';
  month: string;
  revenueTarget: number;
  revenueAchieved: number;
  leadsTarget: number;
  leadsConverted: number;
  bonusRate: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: 'Giáo trình & Sách' | 'Đồng phục áo phông' | 'Balo trung tâm' | 'Quà tặng vinh danh';
  unit: string;
  inStock: number;
  unitPrice: number;
  costPrice: number;
  minAlert: number;
}

export interface VocabQuestion {
  id: string;
  word: string;
  phonetic?: string;
  meaning: string;
  options: string[]; // 4 multiple choice options
  correctOptionIndex: number;
  timeLimitSeconds?: number; // e.g. 15s or 20s per question
  questionType?: 'multiple_choice' | 'matching' | 'type_input';
}

export interface VocabTestSubmission {
  id: string;
  testId: string;
  studentId?: string;
  studentName: string;
  studentPhone?: string;
  className?: string; // Tên lớp / Số lớp học sinh nhập
  classId?: string;
  score: number; // e.g. 9/10 or score out of 10
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number; // total completion time in seconds
  tabSwitchViolations: number;
  submittedAt: string;
}

export interface VocabTest {
  id: string;
  title: string;
  classId?: string;
  className?: string;
  courseLevel: 'Khóa 1' | 'Khóa 2' | 'Khóa 3' | 'Khóa 4';
  unitName: string; // e.g. "Bài 1: Environment & Education", "Bài 2: Technology"
  timePerQuestionSeconds: number;
  questions: VocabQuestion[];
  createdDate: string;
  isActive: boolean;
  submissions: VocabTestSubmission[];
}
