import React, { useState } from 'react';
import {
  X,
  CalendarCheck2,
  Bell,
  GraduationCap,
  Clock,
  Copy,
  Check,
  Calendar,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import { ClassGroup } from '../../types';
import {
  calculateCourseSchedule,
  generateTAReminderZaloMessage,
  generateExamReminderZaloMessage,
  generateCourseEndSummaryZaloMessage,
} from '../../utils/courseSchedule';

interface ClassFullScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  classGroup: ClassGroup;
}

export const ClassFullScheduleModal: React.FC<ClassFullScheduleModalProps> = ({
  isOpen,
  onClose,
  classGroup,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const schedule = calculateCourseSchedule(
    classGroup.startDate,
    classGroup.schedule,
    classGroup.totalSessions,
    classGroup.offDates || [],
    classGroup.courseLevel || classGroup.courseName
  );

  const completed = classGroup.completedSessions || 0;
  const cfg = schedule.config;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-4 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 bg-amber-400/20 text-amber-300 rounded-xl">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
                  <span>Toàn Bộ Lịch Trình Lớp: {classGroup.className}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-bold border border-purple-400/30">
                    {schedule.courseLevel} ({cfg.name} - {schedule.totalSessions} buổi)
                  </span>
                </h3>
                <p className="text-xs text-purple-200 mt-0.5 flex items-center gap-3 flex-wrap">
                  <span>Lịch: <strong>{classGroup.schedule}</strong></span>
                  <span>•</span>
                  <span>Khai giảng: <strong>{schedule.formattedStartDate}</strong></span>
                  <span>•</span>
                  <span>Dự kiến bế giảng: <strong>{schedule.formattedEstimatedEndDate}</strong></span>
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

        {/* Course Rules & Key Milestones Card */}
        <div className="p-3 sm:p-4 bg-purple-50/70 border-b border-purple-100 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* TA Reminder */}
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
              <div className="flex items-center justify-between font-bold text-amber-900 mb-1">
                <span className="flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Buổi 29: Nhắc Xếp TA</span>
                </span>
                <span className="text-[10px] bg-amber-200/80 text-amber-950 px-2 py-0.2 rounded-full font-bold">
                  {schedule.formattedSession29Date}
                </span>
              </div>
              <div className="text-[11px] text-amber-800">
                {schedule.courseLevel === 'Khóa 4'
                  ? 'Nhắc Quản lý xếp TA chuẩn bị thi Mock Test từ Buổi 31'
                  : 'Nhắc Quản lý xếp TA chuẩn bị coi thi cuối khóa'}
              </div>
            </div>

            {/* Exam Schedule */}
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs">
              <div className="flex items-center justify-between font-bold text-indigo-900 mb-1">
                <span className="flex items-center gap-1">
                  <CalendarCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Kiểm Tra Cuối Khóa</span>
                </span>
                <span className="text-[10px] bg-indigo-200/80 text-indigo-950 px-2 py-0.2 rounded-full font-bold">
                  Buổi {schedule.examSessions.join(' & ')}
                </span>
              </div>
              <div className="text-[11px] text-indigo-800">
                {cfg.examRule}
              </div>
            </div>

            {/* End of Course & Transition */}
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <div className="flex items-center justify-between font-bold text-emerald-900 mb-1">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bế Giảng & Khóa Tiếp</span>
                </span>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-950 px-2 py-0.2 rounded-full font-bold">
                  {schedule.formattedEstimatedEndDate}
                </span>
              </div>
              <div className="text-[11px] text-emerald-800">
                {cfg.breakAfterCourseSessions > 0
                  ? `Nghỉ 1 buổi (${schedule.formattedBreakDate}) rồi lên ${cfg.nextCourseName}`
                  : 'Tốt nghiệp toàn diện lộ trình IELTS'}
              </div>
            </div>
          </div>

          {/* Quick Copy Bar */}
          <div className="flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-purple-100 flex-wrap">
            <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Chép nhanh tin nhắn Zalo:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  const msg = generateTAReminderZaloMessage(
                    classGroup.className,
                    classGroup.teacherName || 'Giáo viên',
                    classGroup.courseLevel || classGroup.courseName,
                    cfg.taAlertSession || 29,
                    schedule.formattedSession29Date
                  );
                  copyToClipboard(msg, 'ta');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  copiedKey === 'ta'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
              >
                {copiedKey === 'ta' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                <span>Tin Nhắc TA (Gửi Quản lý)</span>
              </button>

              <button
                onClick={() => {
                  const msg = generateExamReminderZaloMessage(
                    classGroup.className,
                    classGroup.courseLevel || classGroup.courseName,
                    classGroup.schedule,
                    schedule.examDates
                  );
                  copyToClipboard(msg, 'exam');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  copiedKey === 'exam'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200'
                }`}
              >
                {copiedKey === 'exam' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-indigo-700" />}
                <span>Lịch Thi (Gửi Lớp)</span>
              </button>

              <button
                onClick={() => {
                  const msg = generateCourseEndSummaryZaloMessage(
                    classGroup.className,
                    classGroup.courseLevel || classGroup.courseName,
                    schedule.formattedEstimatedEndDate,
                    schedule.formattedBreakDate,
                    schedule.formattedNextCourseStartDate,
                    cfg.nextCourseName
                  );
                  copyToClipboard(msg, 'end');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  copiedKey === 'end'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                }`}
              >
                {copiedKey === 'end' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-purple-700" />}
                <span>Tin Bế Giảng</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Timeline List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {schedule.sessions.map((sess) => {
              const isPast = sess.sessionNumber < completed;
              const isCurrent = sess.sessionNumber === completed;
              const isUpcoming = sess.sessionNumber > completed;

              return (
                <div
                  key={sess.sessionNumber}
                  className={`p-3 rounded-xl border text-xs transition-all relative ${
                    sess.isExam
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 shadow-xs ring-2 ring-indigo-200/60'
                      : sess.isSession29TAAlert
                      ? 'bg-amber-50 border-amber-300 shadow-xs ring-2 ring-amber-200/60'
                      : sess.isFinalSession
                      ? 'bg-purple-50 border-purple-300 shadow-xs'
                      : isCurrent
                      ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-200'
                      : isPast
                      ? 'bg-white/70 border-slate-200 opacity-80'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-slate-800 text-xs">
                      Buổi {sess.sessionNumber}/{schedule.totalSessions}
                    </span>

                    {/* Status badge */}
                    {isCurrent && (
                      <span className="text-[10px] font-black bg-purple-700 text-white px-2 py-0.2 rounded-full">
                        Buổi hiện tại
                      </span>
                    )}
                    {isPast && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                        Đã học
                      </span>
                    )}
                    {isUpcoming && !isCurrent && (
                      <span className="text-[10px] font-semibold text-slate-400">
                        Chưa học
                      </span>
                    )}
                  </div>

                  <div className="font-bold text-slate-700 text-xs">
                    {sess.dayOfWeekName}, {sess.formattedDate}
                  </div>

                  {/* Special milestone highlights */}
                  {sess.isSession29TAAlert && (
                    <div className="mt-1.5 p-1.5 rounded-lg bg-amber-500/20 text-amber-950 font-bold text-[10px] flex items-center gap-1 border border-amber-300">
                      <Bell className="w-3 h-3 text-amber-700 shrink-0" />
                      <span>{sess.taAlertLabel || 'Nhắc Quản lý xếp Trợ giảng (TA)'}</span>
                    </div>
                  )}

                  {sess.isExam && (
                    <div className="mt-1.5 p-1.5 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs">
                      <CalendarCheck2 className="w-3 h-3 shrink-0" />
                      <span className="line-clamp-1">{sess.examLabel}</span>
                    </div>
                  )}

                  {sess.isFinalSession && !sess.isExam && (
                    <div className="mt-1.5 p-1.5 rounded-lg bg-purple-600 text-white font-bold text-[10px] flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 shrink-0" />
                      <span>Buổi cuối: Bế giảng khóa học</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Transition & Next Course Card at the bottom of the list */}
          {schedule.breakDate && (
            <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-purple-950 text-white border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Quy Chế Nghỉ Chuyển Tiếp:</span>
                </div>
                <div className="text-slate-200">
                  Lớp nghỉ 1 buổi vào ngày <strong>{schedule.formattedBreakDate}</strong> để tổng hợp kết quả và chuẩn bị giáo trình.
                </div>
              </div>

              <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-right sm:self-auto self-start">
                <div className="text-[10px] text-purple-200 font-medium">Dự kiến khai giảng khóa mới:</div>
                <div className="text-sm font-black text-amber-300">
                  {cfg.nextCourseName}: {schedule.formattedNextCourseStartDate}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            Tiến độ: <strong>Buổi {completed}/{schedule.totalSessions}</strong> ({schedule.remainingDaysText})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
