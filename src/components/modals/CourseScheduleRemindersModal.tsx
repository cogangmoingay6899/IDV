import React, { useState, useMemo } from 'react';
import {
  X,
  CalendarCheck2,
  Bell,
  GraduationCap,
  Clock,
  Copy,
  Check,
  Search,
  BookOpen,
  Users,
  ChevronRight,
  Sparkles,
  Calendar,
  AlertCircle,
  Building,
} from 'lucide-react';
import { ClassGroup } from '../../types';
import {
  COURSE_LEVEL_CONFIGS,
  CourseLevelKey,
  calculateCourseSchedule,
  generateTAReminderZaloMessage,
  generateExamReminderZaloMessage,
  generateCourseEndSummaryZaloMessage,
} from '../../utils/courseSchedule';

interface CourseScheduleRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassGroup[];
  onSelectClass?: (classId: string) => void;
}

export const CourseScheduleRemindersModal: React.FC<CourseScheduleRemindersModalProps> = ({
  isOpen,
  onClose,
  classes,
  onSelectClass,
}) => {
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Tính toán toàn bộ lịch trình và các mốc cho từng lớp
  const classSchedules = useMemo(() => {
    return classes.map((cls) => {
      const schedule = calculateCourseSchedule(
        cls.startDate,
        cls.schedule,
        cls.totalSessions,
        cls.offDates || [],
        cls.courseLevel || cls.courseName
      );

      const completed = cls.completedSessions || 0;
      const total = schedule.totalSessions;
      const remaining = Math.max(0, total - completed);

      // Trạng thái nhắc Trợ giảng (TA)
      const taAlertSession = schedule.config.taAlertSession || 29;
      let taStatus: 'needed_now' | 'upcoming' | 'passed' = 'upcoming';
      if (completed >= taAlertSession) {
        taStatus = 'passed';
      } else if (completed >= taAlertSession - 2 && completed < taAlertSession) {
        taStatus = 'needed_now';
      }

      // Trạng thái kiểm tra cuối khóa
      const firstExamSession = schedule.examSessions[0] || total;
      let examStatus: 'in_exam' | 'upcoming' | 'passed' = 'upcoming';
      if (completed >= total) {
        examStatus = 'passed';
      } else if (completed >= firstExamSession - 1) {
        examStatus = 'in_exam';
      }

      // Trạng thái sắp bế giảng
      const isFinishingSoon = remaining <= 4 && remaining > 0;

      return {
        cls,
        schedule,
        completed,
        total,
        remaining,
        taStatus,
        examStatus,
        isFinishingSoon,
        progressPercent: Math.min(100, Math.round((completed / total) * 100)),
      };
    });
  }, [classes]);

  // Bộ đếm tổng quan
  const stats = useMemo(() => {
    const totalClasses = classSchedules.length;
    const needTA = classSchedules.filter((item) => item.taStatus === 'needed_now').length;
    const inExam = classSchedules.filter((item) => item.examStatus === 'in_exam').length;
    const finishingSoon = classSchedules.filter((item) => item.isFinishingSoon).length;

    return { totalClasses, needTA, inExam, finishingSoon };
  }, [classSchedules]);

  // Lọc danh sách
  const filteredList = useMemo(() => {
    return classSchedules.filter((item) => {
      const { cls, schedule, taStatus, examStatus, isFinishingSoon } = item;

      // Lọc theo level
      if (selectedLevelFilter !== 'all' && schedule.courseLevel !== selectedLevelFilter) {
        return false;
      }

      // Lọc theo trạng thái
      if (selectedStatusFilter === 'need_ta' && taStatus !== 'needed_now') return false;
      if (selectedStatusFilter === 'in_exam' && examStatus !== 'in_exam') return false;
      if (selectedStatusFilter === 'finishing_soon' && !isFinishingSoon) return false;

      // Tìm kiếm
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = cls.className.toLowerCase().includes(term);
        const matchTeacher = (cls.teacherName || '').toLowerCase().includes(term);
        const matchBranch = (cls.branch || '').toLowerCase().includes(term);
        if (!matchName && !matchTeacher && !matchBranch) return false;
      }

      return true;
    });
  }, [classSchedules, selectedLevelFilter, selectedStatusFilter, searchTerm]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-4 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-400/20 text-amber-300 rounded-xl">
                <CalendarCheck2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
                  <span>Lịch Nhắc Nhở, Thi & Bế Giảng Lớp Học</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-bold border border-purple-400/30">
                    Chuẩn IELTS DƯƠNG VŨ
                  </span>
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Tự động căn cứ lịch 2 buổi/tuần, quản lý mốc nhắc Trợ giảng (TA) và kiểm tra cuối khóa
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Standard Course Rules Reference Banner */}
        <div className="bg-purple-50/70 border-b border-purple-100 p-3 sm:p-4 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Quy Chuẩn Kiểm Tra & Bế Giảng 4 Khóa Học:</span>
            </span>
            <span className="text-[10px] font-semibold text-purple-700">Tuần 2 buổi cố định</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Khóa 1 */}
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800">Khóa 1 (PRE)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  32 buổi
                </span>
              </div>
              <div className="text-[11px] text-slate-700 font-semibold mt-1">
                🎯 <strong>Kiểm tra Buổi 32</strong> (1 buổi)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                🔔 Nhắc TA Buổi 29 • ⏸️ Nghỉ 1 buổi lên K2
              </div>
            </div>

            {/* Khóa 2 */}
            <div className="bg-white p-2.5 rounded-xl border border-blue-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-800">Khóa 2 (INSPIRE)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  33 buổi
                </span>
              </div>
              <div className="text-[11px] text-slate-700 font-semibold mt-1">
                🎯 <strong>Kiểm tra Buổi 32 & 33</strong> (2 buổi)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                🔔 Nhắc TA Buổi 29 • ⏸️ Nghỉ 1 buổi lên K3
              </div>
            </div>

            {/* Khóa 3 */}
            <div className="bg-white p-2.5 rounded-xl border border-purple-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-800">Khóa 3 (DESIRE)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                  33 buổi
                </span>
              </div>
              <div className="text-[11px] text-slate-700 font-semibold mt-1">
                🎯 <strong>Kiểm tra Buổi 32 & 33</strong> (2 buổi)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                🔔 Nhắc TA Buổi 29 • ⏸️ Nghỉ 1 buổi lên K4
              </div>
            </div>

            {/* Khóa 4 */}
            <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900">Khóa 4 (DRILL)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full">
                  32 buổi
                </span>
              </div>
              <div className="text-[11px] text-slate-700 font-semibold mt-1">
                🎯 <strong>Kiểm tra Buổi 31 & 32</strong> (2 buổi)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                🔔 Nhắc TA Buổi 28-29 • 🎓 Tốt nghiệp (Không nghỉ)
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <button
            onClick={() => {
              setSelectedStatusFilter('all');
            }}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedStatusFilter === 'all'
                ? 'bg-white border-purple-600 shadow-sm ring-2 ring-purple-200'
                : 'bg-white/80 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
              <span>Tổng số lớp</span>
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg font-black text-slate-800 mt-0.5">{stats.totalClasses}</div>
            <div className="text-[10px] text-slate-400">Đang hoạt động</div>
          </button>

          <button
            onClick={() => {
              setSelectedStatusFilter(selectedStatusFilter === 'need_ta' ? 'all' : 'need_ta');
            }}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedStatusFilter === 'need_ta'
                ? 'bg-amber-50 border-amber-500 shadow-sm ring-2 ring-amber-200'
                : 'bg-white/80 border-slate-200 hover:bg-amber-50/50'
            }`}
          >
            <div className="text-[11px] font-bold text-amber-800 flex items-center justify-between">
              <span>Cần xếp Trợ giảng</span>
              <Bell className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            </div>
            <div className="text-lg font-black text-amber-700 mt-0.5">{stats.needTA}</div>
            <div className="text-[10px] text-amber-600 font-semibold">Buổi 27 - 29</div>
          </button>

          <button
            onClick={() => {
              setSelectedStatusFilter(selectedStatusFilter === 'in_exam' ? 'all' : 'in_exam');
            }}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedStatusFilter === 'in_exam'
                ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-2 ring-indigo-200'
                : 'bg-white/80 border-slate-200 hover:bg-indigo-50/50'
            }`}
          >
            <div className="text-[11px] font-bold text-indigo-800 flex items-center justify-between">
              <span>Đợt kiểm tra</span>
              <CalendarCheck2 className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-lg font-black text-indigo-700 mt-0.5">{stats.inExam}</div>
            <div className="text-[10px] text-indigo-600 font-semibold">Buổi thi cuối khóa</div>
          </button>

          <button
            onClick={() => {
              setSelectedStatusFilter(
                selectedStatusFilter === 'finishing_soon' ? 'all' : 'finishing_soon'
              );
            }}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedStatusFilter === 'finishing_soon'
                ? 'bg-purple-50 border-purple-500 shadow-sm ring-2 ring-purple-200'
                : 'bg-white/80 border-slate-200 hover:bg-purple-50/50'
            }`}
          >
            <div className="text-[11px] font-bold text-purple-800 flex items-center justify-between">
              <span>Sắp bế giảng</span>
              <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-lg font-black text-purple-700 mt-0.5">{stats.finishingSoon}</div>
            <div className="text-[10px] text-purple-600 font-semibold">Còn ≤ 4 buổi</div>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          {/* Level tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['all', 'Khóa 1', 'Khóa 2', 'Khóa 3', 'Khóa 4'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevelFilter(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedLevelFilter === lvl
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-800'
                }`}
              >
                {lvl === 'all' ? 'Tất cả khóa' : lvl}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên lớp, giáo viên, cơ sở..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Class List Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-100/60">
          {filteredList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-slate-700 text-sm">Không tìm thấy lớp học nào</div>
              <div className="text-xs text-slate-500 mt-1">
                Thử đổi bộ lọc cấp độ hoặc xóa từ khóa tìm kiếm
              </div>
            </div>
          ) : (
            filteredList.map((item) => {
              const { cls, schedule, completed, total, remaining, progressPercent, taStatus, examStatus } = item;
              const cfg = schedule.config;

              // Key cho copy toast
              const taCopyKey = `ta-${cls.id}`;
              const examCopyKey = `exam-${cls.id}`;
              const endCopyKey = `end-${cls.id}`;

              return (
                <div
                  key={cls.id}
                  className={`bg-white rounded-2xl p-4 border transition-all shadow-xs hover:shadow-md ${
                    taStatus === 'needed_now'
                      ? 'border-amber-300 ring-2 ring-amber-100'
                      : examStatus === 'in_exam'
                      ? 'border-indigo-300 ring-2 ring-indigo-100'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Top line: Class name, tags, and progress */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 text-base">{cls.className}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                          {schedule.courseLevel} ({cfg.name})
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {cls.branch ? cls.branch.split(' - ')[0] : 'Cơ sở 1'}
                        </span>
                        {taStatus === 'needed_now' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse flex items-center gap-1 shadow-xs">
                            <Bell className="w-3 h-3" />
                            <span>Cần xếp TA (Buổi 29)</span>
                          </span>
                        )}
                        {examStatus === 'in_exam' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white flex items-center gap-1 shadow-xs">
                            <CalendarCheck2 className="w-3 h-3" />
                            <span>Đợt thi cuối khóa</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>GV: <strong>{cls.teacherName || 'Chưa phân công'}</strong></span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Lịch: <strong>{cls.schedule}</strong></span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Khai giảng: <strong>{schedule.formattedStartDate}</strong></span>
                        </span>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="text-right sm:min-w-[140px]">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-purple-900">
                          Buổi {completed}/{total}
                        </span>
                        <span className="text-slate-400 font-semibold">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-1">
                        {remaining === 0 ? 'Đã hoàn thành khóa' : `Còn ${remaining} buổi nữa bế giảng`}
                      </div>
                    </div>
                  </div>

                  {/* Milestones grid: 4 Key Schedule Milestones */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 my-3">
                    {/* Milestone 1: TA Alert */}
                    <div
                      className={`p-2.5 rounded-xl border text-xs ${
                        taStatus === 'needed_now'
                          ? 'bg-amber-50/90 border-amber-300 shadow-xs'
                          : taStatus === 'passed'
                          ? 'bg-slate-50 border-slate-200 text-slate-400'
                          : 'bg-purple-50/40 border-purple-200/60'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                        <span className="flex items-center gap-1 text-amber-800">
                          <Bell className="w-3.5 h-3.5 text-amber-600" />
                          <span>Mốc Nhắc TA: Buổi 29</span>
                        </span>
                        {taStatus === 'passed' ? (
                          <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded-full font-bold">
                            Đã qua
                          </span>
                        ) : taStatus === 'needed_now' ? (
                          <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                            Cần nhắn ngay
                          </span>
                        ) : (
                          <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full font-bold">
                            Sắp tới
                          </span>
                        )}
                      </div>
                      <div className="font-extrabold text-slate-800 text-xs mt-0.5">
                        {schedule.formattedSession29Date || 'Chưa tính'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        Nhắn Quản lý xếp TA hỗ trợ thi
                      </div>
                    </div>

                    {/* Milestone 2: Exam Sessions */}
                    <div
                      className={`p-2.5 rounded-xl border text-xs ${
                        examStatus === 'in_exam'
                          ? 'bg-indigo-50 border-indigo-300 shadow-xs'
                          : examStatus === 'passed'
                          ? 'bg-slate-50 border-slate-200 text-slate-400'
                          : 'bg-indigo-50/40 border-indigo-200/60'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                        <span className="flex items-center gap-1 text-indigo-900">
                          <CalendarCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>
                            {schedule.courseLevel === 'Khóa 1'
                              ? 'Thi Buổi 32'
                              : schedule.courseLevel === 'Khóa 4'
                              ? 'Thi Buổi 31 & 32'
                              : 'Thi Buổi 32 & 33'}
                          </span>
                        </span>
                        <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full font-bold">
                          {schedule.examSessions.length} buổi thi
                        </span>
                      </div>
                      <div className="font-extrabold text-slate-800 text-xs mt-0.5">
                        {schedule.examDates.map((ed) => ed.formattedDate).join(' & ')}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {cfg.examRule}
                      </div>
                    </div>

                    {/* Milestone 3: End of Course */}
                    <div className="p-2.5 rounded-xl border border-purple-200/60 bg-purple-50/40 text-xs">
                      <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                        <span className="flex items-center gap-1 text-purple-900">
                          <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                          <span>Bế Giảng Khóa</span>
                        </span>
                        <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-bold">
                          Buổi {total}
                        </span>
                      </div>
                      <div className="font-extrabold text-slate-800 text-xs mt-0.5">
                        {schedule.formattedEstimatedEndDate}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {schedule.remainingDaysText}
                      </div>
                    </div>

                    {/* Milestone 4: Break & Next Course */}
                    <div className="p-2.5 rounded-xl border border-emerald-200/60 bg-emerald-50/40 text-xs">
                      <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                        <span className="flex items-center gap-1 text-emerald-900">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {cfg.breakAfterCourseSessions > 0 ? 'Nghỉ 1b & Khóa Mới' : 'Tốt Nghiệp'}
                          </span>
                        </span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                          {cfg.nextCourseName ? cfg.nextCourseName.split(' / ')[0] : 'Hoàn thành'}
                        </span>
                      </div>
                      <div className="font-extrabold text-slate-800 text-xs mt-0.5">
                        {schedule.breakDate
                          ? `Nghỉ ${schedule.formattedBreakDate}`
                          : 'Không nghỉ buổi'}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 line-clamp-1">
                        {cfg.nextCourseKey
                          ? `Khai giảng: ${schedule.formattedNextCourseStartDate}`
                          : 'Sẵn sàng thi IELTS quốc tế'}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Quick Zalo Message Copying */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500">Mẫu tin Zalo:</span>

                      {/* Button: Nhắc TA */}
                      <button
                        type="button"
                        onClick={() => {
                          const msg = generateTAReminderZaloMessage(
                            cls.className,
                            cls.teacherName || 'Giáo viên',
                            cls.courseLevel || cls.courseName,
                            schedule.config.taAlertSession || 29,
                            schedule.formattedSession29Date
                          );
                          copyToClipboard(msg, taCopyKey);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                          copiedKey === taCopyKey
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        }`}
                        title="Sao chép tin nhắn Zalo gửi Quản lý chuẩn bị Trợ giảng"
                      >
                        {copiedKey === taCopyKey ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã chép tin TA</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-amber-700" />
                            <span>Chép tin nhắc TA</span>
                          </>
                        )}
                      </button>

                      {/* Button: Lịch thi */}
                      <button
                        type="button"
                        onClick={() => {
                          const msg = generateExamReminderZaloMessage(
                            cls.className,
                            cls.courseLevel || cls.courseName,
                            cls.schedule,
                            schedule.examDates
                          );
                          copyToClipboard(msg, examCopyKey);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                          copiedKey === examCopyKey
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200'
                        }`}
                        title="Sao chép tin nhắn Zalo thông báo lịch thi gửi Lớp/Phụ huynh"
                      >
                        {copiedKey === examCopyKey ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã chép lịch thi</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-indigo-700" />
                            <span>Chép thông báo thi</span>
                          </>
                        )}
                      </button>

                      {/* Button: Bế giảng */}
                      <button
                        type="button"
                        onClick={() => {
                          const msg = generateCourseEndSummaryZaloMessage(
                            cls.className,
                            cls.courseLevel || cls.courseName,
                            schedule.formattedEstimatedEndDate,
                            schedule.formattedBreakDate,
                            schedule.formattedNextCourseStartDate,
                            cfg.nextCourseName
                          );
                          copyToClipboard(msg, endCopyKey);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                          copiedKey === endCopyKey
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                        }`}
                        title="Sao chép tin nhắn Zalo thông báo bế giảng & lên khóa mới"
                      >
                        {copiedKey === endCopyKey ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã chép bế giảng</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-purple-700" />
                            <span>Chép tin bế giảng</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Button: Chi tiết lớp */}
                    {onSelectClass && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectClass(cls.id);
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-white hover:bg-purple-900 font-bold text-[11px] flex items-center gap-1 transition-colors ml-auto"
                      >
                        <span>Vào lớp học</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Hệ thống tự động đồng bộ theo buổi dạy thực tế và dời ngày khi có buổi nghỉ.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Đóng bảng lịch
          </button>
        </div>
      </div>
    </div>
  );
};
