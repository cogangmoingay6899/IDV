import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Users,
  Layers,
  Award,
  Search,
  BookOpen,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { ClassGroup, Student, AttendanceRecord, Teacher, AuthUser } from '../../types';

interface TeacherSessionsModuleProps {
  classes: ClassGroup[];
  students: Student[];
  teachers: Teacher[];
  attendanceRecords: AttendanceRecord[];
  currentUser?: AuthUser;
}

export const TeacherSessionsModule: React.FC<TeacherSessionsModuleProps> = ({
  classes,
  students,
  teachers,
  attendanceRecords,
  currentUser,
}) => {
  // Determine if user is teacher, assistant, or admin
  const isTeacher = currentUser?.role === 'teacher';
  const isAssistant = currentUser?.role === 'assistant';
  const isAdmin = currentUser?.role === 'admin';

  // Find exact teacher profile if logged-in user is a teacher
  const loggedInTeacherProfile = useMemo(() => {
    if (!isTeacher) return null;
    return teachers.find(
      (t) =>
        t.id === currentUser?.teacherId ||
        t.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
        t.name?.toLowerCase() === currentUser?.name?.toLowerCase()
    );
  }, [isTeacher, currentUser, teachers]);

  // Fallback name for the logged-in teacher
  const loggedInTeacherName = useMemo(() => {
    if (!isTeacher) return '';
    return loggedInTeacherProfile?.name || currentUser?.name || '';
  }, [isTeacher, loggedInTeacherProfile, currentUser]);

  // Year and Month state - defaults to current month & year
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);

  // Selected teacher state for admin / assistant
  // Default to "all" (Tất cả giáo viên) for admins/assistants, or the logged-in teacher's name for teachers
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    isTeacher ? loggedInTeacherProfile?.id || 'logged-in' : 'all'
  );

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Safe Date parsing helper to handle "YYYY-MM-DD" and "DD/MM/YYYY"
  const parseYearMonth = (dateStr: string) => {
    if (!dateStr) return null;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (!isNaN(year) && !isNaN(month)) return { year, month };
      }
    }
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length >= 3) {
        const year = parseInt(parts[2], 10);
        const month = parseInt(parts[1], 10);
        if (!isNaN(year) && !isNaN(month)) return { year, month };
      }
    }
    return null;
  };

  // Extract all unique sessions from attendance records
  const processedSessions = useMemo(() => {
    const sessionsMap = new Map<
      string,
      {
        key: string;
        classId: string;
        className: string;
        courseName: string;
        branch: string;
        schedule: string;
        date: string;
        sessionNumber: number;
        teacherName: string;
        studentPresentCount: number;
        studentTotalCount: number;
        skillsTaught: string[];
      }
    >();

    attendanceRecords.forEach((record) => {
      // Parse year and month
      const dateParts = parseYearMonth(record.date);
      if (!dateParts) return;
      if (dateParts.year !== selectedYear || dateParts.month !== selectedMonth) return;

      const sessionKey = `${record.classId}_${record.date}_${record.sessionNumber}`;

      // Find class details
      const cls = classes.find((c) => c.id === record.classId);
      const className = cls ? cls.name : 'Lớp học đã ẩn';
      const courseName = cls ? cls.courseName : 'Khóa học';
      const branch = cls?.branch || 'Chưa rõ';
      const schedule = cls?.schedule || 'Chưa ghi nhận lịch';

      // Determine the teacher who taught this session.
      // We look at record.teacherName first. If not found, fall back to the class's teacherName
      let recordTeacher = record.teacherName?.trim() || '';
      if (!recordTeacher && cls) {
        recordTeacher = cls.teacherName || '';
      }
      if (!recordTeacher) {
        recordTeacher = 'IELTS DƯƠNG VŨ';
      }

      // Initialize session entry if not exists
      if (!sessionsMap.has(sessionKey)) {
        sessionsMap.set(sessionKey, {
          key: sessionKey,
          classId: record.classId,
          className,
          courseName,
          branch,
          schedule,
          date: record.date,
          sessionNumber: record.sessionNumber,
          teacherName: recordTeacher,
          studentPresentCount: 0,
          studentTotalCount: 0,
          skillsTaught: record.skillsTaught || (record.skillTaught ? [record.skillTaught] : []),
        });
      }

      const session = sessionsMap.get(sessionKey)!;
      session.studentTotalCount += 1;
      if (record.status === 'Có mặt' || record.status === 'Đi muộn' || record.status === 'Đi trễ') {
        session.studentPresentCount += 1;
      }
      // Combine skills
      if (record.skillsTaught && record.skillsTaught.length > 0) {
        record.skillsTaught.forEach((skill) => {
          if (!session.skillsTaught.includes(skill)) {
            session.skillsTaught.push(skill);
          }
        });
      } else if (record.skillTaught && !session.skillsTaught.includes(record.skillTaught)) {
        session.skillsTaught.push(record.skillTaught);
      }
    });

    return Array.from(sessionsMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceRecords, classes, selectedYear, selectedMonth]);

  // Helper to match a session with a selected teacher
  const isSessionForSelectedTeacher = (session: typeof processedSessions[0], teacherObj: Teacher | null | undefined, id: string) => {
    if (isTeacher) {
      // The teacher can only see their own sessions
      const nameMatch = loggedInTeacherName && session.teacherName.toLowerCase().includes(loggedInTeacherName.toLowerCase());
      const emailMatch = loggedInTeacherProfile?.email && session.teacherName.toLowerCase().includes(loggedInTeacherProfile.email.toLowerCase());
      return nameMatch || emailMatch;
    }

    if (id === 'all') return true;

    // Filter by specific teacher
    const targetTeacher = teachers.find((t) => t.id === id);
    if (!targetTeacher) return false;

    return (
      session.teacherName.toLowerCase().includes(targetTeacher.name.toLowerCase()) ||
      (targetTeacher.email && session.teacherName.toLowerCase().includes(targetTeacher.email.toLowerCase()))
    );
  };

  // Get current filtered teacher object (if a specific teacher is selected or logged in)
  const activeTeacher = useMemo(() => {
    if (isTeacher) return loggedInTeacherProfile;
    if (selectedTeacherId === 'all') return null;
    return teachers.find((t) => t.id === selectedTeacherId);
  }, [isTeacher, loggedInTeacherProfile, selectedTeacherId, teachers]);

  // Filtered sessions for the selected/active teacher
  const filteredSessions = useMemo(() => {
    return processedSessions.filter((session) => {
      // Verify teacher matching
      if (!isSessionForSelectedTeacher(session, activeTeacher, selectedTeacherId)) return false;

      // Apply search query (search by Class name, Course name, or branch)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          session.className.toLowerCase().includes(query) ||
          session.courseName.toLowerCase().includes(query) ||
          session.teacherName.toLowerCase().includes(query) ||
          session.branch.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [processedSessions, activeTeacher, selectedTeacherId, searchQuery, isTeacher, loggedInTeacherName]);

  // 1. Group stats: Sessions taught per class
  const classBreakdown = useMemo(() => {
    const breakdownMap = new Map<
      string,
      {
        classId: string;
        className: string;
        courseName: string;
        branch: string;
        schedule: string;
        totalSessions: number;
        sessions: { date: string; sessionNumber: number; presentCount: number; totalCount: number }[];
      }
    >();

    filteredSessions.forEach((session) => {
      if (!breakdownMap.has(session.classId)) {
        breakdownMap.set(session.classId, {
          classId: session.classId,
          className: session.className,
          courseName: session.courseName,
          branch: session.branch,
          schedule: session.schedule,
          totalSessions: 0,
          sessions: [],
        });
      }

      const entry = breakdownMap.get(session.classId)!;
      entry.totalSessions += 1;
      entry.sessions.push({
        date: session.date,
        sessionNumber: session.sessionNumber,
        presentCount: session.studentPresentCount,
        totalCount: session.studentTotalCount,
      });
    });

    // Sort dates within classes
    const list = Array.from(breakdownMap.values());
    list.forEach((item) => {
      item.sessions.sort((a, b) => a.date.localeCompare(b.date));
    });

    return list.sort((a, b) => b.totalSessions - a.totalSessions);
  }, [filteredSessions]);

  // 2. Global summary stats of ALL teachers (Only for Admin & Assistant when selecting "all")
  const globalTeachersSummary = useMemo(() => {
    if (isTeacher || selectedTeacherId !== 'all') return [];

    const summaryMap = new Map<
      string,
      {
        teacherName: string;
        teacherId: string | null;
        totalSessions: number;
        classesTaught: Set<string>;
        classesBreakdown: Record<string, number>; // classId -> count
      }
    >();

    processedSessions.forEach((session) => {
      // Identify corresponding teacher from system
      const tProfile = teachers.find(
        (t) =>
          session.teacherName.toLowerCase().includes(t.name.toLowerCase()) ||
          (t.email && session.teacherName.toLowerCase().includes(t.email.toLowerCase()))
      );

      const nameKey = tProfile ? tProfile.name : session.teacherName;
      const idKey = tProfile ? tProfile.id : null;

      if (!summaryMap.has(nameKey)) {
        summaryMap.set(nameKey, {
          teacherName: nameKey,
          teacherId: idKey,
          totalSessions: 0,
          classesTaught: new Set<string>(),
          classesBreakdown: {},
        });
      }

      const summary = summaryMap.get(nameKey)!;
      summary.totalSessions += 1;
      summary.classesTaught.add(session.classId);
      summary.classesBreakdown[session.classId] = (summary.classesBreakdown[session.classId] || 0) + 1;
    });

    return Array.from(summaryMap.values()).sort((a, b) => b.totalSessions - a.totalSessions);
  }, [processedSessions, teachers, isTeacher, selectedTeacherId]);

  // Overall key metrics
  const totalSessionsCount = filteredSessions.length;
  const uniqueClassesCount = classBreakdown.length;
  const averageAttendance = useMemo(() => {
    if (filteredSessions.length === 0) return 0;
    const totalPresent = filteredSessions.reduce((acc, s) => acc + s.studentPresentCount, 0);
    const totalStudents = filteredSessions.reduce((acc, s) => acc + s.studentTotalCount, 0);
    return totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;
  }, [filteredSessions]);

  // Estimated remuneration if rate is available (for visual interest)
  const estimatedPayroll = useMemo(() => {
    if (!activeTeacher || !activeTeacher.hourlyRate) return 0;
    // Assuming 1 session = 1.75 hours or simple flat rate per session
    return totalSessionsCount * activeTeacher.hourlyRate;
  }, [activeTeacher, totalSessionsCount]);

  // Format date display (e.g., 21/09/2026 -> 21/09)
  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
    }
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* 1. Header and Controls Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Thống kê số buổi dạy</h2>
              <p className="text-xs text-slate-500">
                {isTeacher
                  ? `Theo dõi số buổi trực tiếp đứng lớp của bạn trong tháng ${selectedMonth}/${selectedYear}`
                  : `Quản lý số ca dạy thực tế của giáo viên tại các cơ sở`}
              </p>
            </div>
          </div>

          {/* Month/Year Scroller */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 border border-slate-200 p-1 rounded-2xl">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white hover:text-purple-700 hover:shadow-xs rounded-xl text-slate-600 transition-all cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 font-bold text-xs text-slate-800 tracking-wide min-w-[120px] text-center">
              Tháng {selectedMonth} / {selectedYear}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white hover:text-purple-700 hover:shadow-xs rounded-xl text-slate-600 transition-all cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info or Teacher Selection Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 items-center">
          {/* Left: Role identification / Selector */}
          <div>
            {isTeacher ? (
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1.5 rounded-2xl text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tài khoản giảng viên:</span>
                <strong className="text-emerald-950 font-bold">{loggedInTeacherName || 'Giáo viên'}</strong>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-purple-600" />
                  Xem theo giáo viên:
                </span>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500/10 focus:outline-none cursor-pointer text-slate-800 min-w-[200px]"
                >
                  <option value="all">📊 Tất cả giáo viên</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      👨‍🏫 {t.name} ({t.type === 'Bản ngữ (Native)' ? 'Native' : 'VN'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right: Search Filter inside current view */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm nhanh theo mã lớp, khóa học, chi nhánh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>
      </div>

      {/* 2. Highlights Metrics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng số buổi dạy</span>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {totalSessionsCount} <span className="text-xs text-slate-400 font-bold">buổi</span>
            </div>
            <span className="text-[10px] text-slate-500">Số buổi điểm danh thực tế</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Số lớp phụ trách</span>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {uniqueClassesCount} <span className="text-xs text-slate-400 font-bold">lớp</span>
            </div>
            <span className="text-[10px] text-slate-500">Có phát sinh buổi dạy</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sĩ số trung bình</span>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {averageAttendance}%
            </div>
            <span className="text-[10px] text-slate-500">Tỷ lệ học sinh đi học đủ</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            {activeTeacher ? (
              <>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Thù lao ước tính</span>
                <div className="text-xl font-extrabold text-emerald-700 tracking-tight">
                  {estimatedPayroll > 0
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedPayroll)
                    : 'Chưa tính'}
                </div>
                <span className="text-[10px] text-slate-500 block">Đơn giá: {activeTeacher.hourlyRate ? `${new Intl.NumberFormat('vi-VN').format(activeTeacher.hourlyRate)}đ/buổi` : 'Chưa cập nhật'}</span>
              </>
            ) : (
              <>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Giáo viên tích cực</span>
                <div className="text-xl font-extrabold text-purple-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>IELTS DƯƠNG VŨ</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Đội ngũ chất lượng cao</span>
              </>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Main Views Grid (Summary of all teachers OR detail class breakdown) */}
      <div className="grid grid-cols-1 gap-6">
        {/* Case A: Showing all teachers table (Only for Admin/Assistant when selecting 'all') */}
        {!isTeacher && selectedTeacherId === 'all' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-700" />
                <span>Bảng tổng hợp buổi dạy của toàn bộ giáo viên</span>
              </h3>
              <span className="text-[11px] bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-full border border-purple-100">
                Tháng {selectedMonth}/{selectedYear}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-5 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Họ và tên giảng viên</th>
                    <th className="py-3 px-4 text-center">Tổng số buổi dạy</th>
                    <th className="py-3 px-4 text-center">Số lớp đứng dạy</th>
                    <th className="py-3 px-4">Danh sách các lớp giảng dạy</th>
                    <th className="py-3 px-4 text-center w-28">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {globalTeachersSummary.map((summary, idx) => {
                    const matchedProfile = teachers.find((t) => t.name === summary.teacherName);
                    return (
                      <tr key={summary.teacherName} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center">
                              {summary.teacherName.charAt(0)}
                            </div>
                            <div>
                              <span>{summary.teacherName}</span>
                              {matchedProfile && (
                                <span className={`ml-1.5 inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                  matchedProfile.type === 'Bản ngữ (Native)'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                    : 'bg-slate-50 text-slate-600 border border-slate-100'
                                }`}>
                                  {matchedProfile.type === 'Bản ngữ (Native)' ? 'Native' : 'VN'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-black rounded-lg border border-purple-100">
                            {summary.totalSessions} buổi
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-slate-800 font-bold">
                          {summary.classesTaught.size} lớp
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-lg">
                            {Array.from(summary.classesTaught).map((cId) => {
                              const targetClass = classes.find((c) => c.id === cId);
                              const count = summary.classesBreakdown[cId as string] || 0;
                              return (
                                <span
                                  key={cId}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-200"
                                >
                                  <strong>{targetClass ? targetClass.name : 'Lớp ẩn'}</strong>
                                  <span className="bg-slate-200/80 text-slate-800 px-1 py-0.1 rounded font-bold">
                                    {count}b
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => {
                              if (summary.teacherId) {
                                setSelectedTeacherId(summary.teacherId);
                              } else {
                                // Match by name
                                const matched = teachers.find((t) => t.name === summary.teacherName);
                                if (matched) setSelectedTeacherId(matched.id);
                              }
                            }}
                            className="text-[10px] font-bold text-purple-700 hover:text-white bg-purple-50 hover:bg-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {globalTeachersSummary.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600 text-xs">Không có dữ liệu buổi dạy trong tháng này</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Vui lòng kiểm tra lại bộ lọc thời gian hoặc lấy dữ liệu điểm danh lớp học.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Case B: Detailed breakdown for a selected teacher (or logged-in teacher) */}
        {(isTeacher || selectedTeacherId !== 'all') && (
          <div className="space-y-6">
            {/* Class Breakdown Grid / Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-purple-50/20 to-white">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-700" />
                  <span>Chi tiết số buổi đứng lớp giảng dạy</span>
                </h3>
                {selectedTeacherId !== 'all' && !isTeacher && (
                  <button
                    onClick={() => setSelectedTeacherId('all')}
                    className="text-[10px] font-black text-slate-600 hover:text-purple-700 border border-slate-200 hover:border-purple-300 bg-white px-2.5 py-1 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    ← Quay về bảng tổng hợp toàn bộ giáo viên
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-5 w-12 text-center">STT</th>
                      <th className="py-3 px-4 min-w-[150px]">Lớp học</th>
                      <th className="py-3 px-4 min-w-[180px]">Khóa học & Lịch học</th>
                      <th className="py-3 px-4 text-center min-w-[100px]">Chi nhánh</th>
                      <th className="py-3 px-4 text-center min-w-[120px]">Số buổi dạy trong tháng</th>
                      <th className="py-3 px-4">Chi tiết các ngày dạy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {classBreakdown.map((item, idx) => {
                      return (
                        <tr key={item.classId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-5 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-4 px-4 font-extrabold text-slate-900">
                            <div className="space-y-0.5">
                              <span className="text-xs font-black">{item.className}</span>
                              <div className="text-[9px] font-bold text-purple-700 font-mono tracking-wider">Mã: {item.classId.substring(0, 8).toUpperCase()}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-700">
                            <div className="space-y-0.5">
                              <span className="font-semibold block text-[11px] text-slate-800">{item.courseName}</span>
                              <span className="text-[10px] text-slate-400 block font-normal">{item.schedule}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                              <MapPin className="w-3 h-3 text-purple-500 shrink-0" />
                              <span>{item.branch}</span>
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 text-xs font-black rounded-lg border border-purple-100 animate-pulse">
                              {item.totalSessions} buổi
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1.5 max-w-md">
                              {item.sessions.map((sess, sIdx) => (
                                <span
                                  key={sess.date}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 hover:border-purple-300 text-[10px] text-slate-700 rounded-lg font-mono transition-colors"
                                  title={`Sĩ số đi học: ${sess.presentCount}/${sess.totalCount}`}
                                >
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{formatShortDate(sess.date)}</span>
                                  <span className="bg-slate-200 text-slate-800 text-[9px] px-1 rounded font-bold">
                                    B.{sess.sessionNumber}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {classBreakdown.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-600 text-xs">Không có lớp học phát sinh buổi dạy</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Vui lòng kiểm tra lại tháng đã chọn hoặc dữ liệu điểm danh.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Detailed History Log Table of All Sessions Taught */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Nhật ký chi tiết các buổi dạy ({filteredSessions.length} ca)</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">Thứ tự gần đây nhất xếp trên</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-5 w-12 text-center">STT</th>
                      <th className="py-3 px-4">Ngày dạy</th>
                      <th className="py-3 px-4">Lớp học</th>
                      <th className="py-3 px-4 text-center">Buổi số</th>
                      <th className="py-3 px-4">Nội dung / Kỹ năng giảng dạy</th>
                      <th className="py-3 px-4 text-center">Sĩ số lớp</th>
                      <th className="py-3 px-4">Giảng viên ghi nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredSessions.map((sess, idx) => {
                      return (
                        <tr key={sess.key} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-5 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <span className="font-mono text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">
                              {sess.date}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {sess.className}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              Buổi {sess.sessionNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {sess.skillsTaught && sess.skillsTaught.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {sess.skillsTaught.map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[9px] font-black border border-indigo-100 uppercase"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Chưa ghi nhận kỹ năng</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{sess.studentPresentCount}</span>
                              <span className="text-slate-300 font-normal">/</span>
                              <span className="text-slate-400 font-normal">{sess.studentTotalCount}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-semibold italic">
                            {sess.teacherName}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredSessions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-600 text-xs">Không có nhật ký buổi dạy nào</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Dữ liệu ghi chép đang trống trong thời gian đã chọn.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
