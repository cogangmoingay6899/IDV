import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  Bot, 
  Clock, 
  Share2, 
  Check, 
  UserCheck, 
  Sparkles, 
  ExternalLink, 
  Users, 
  Calendar, 
  History, 
  X,
  ChevronDown
} from 'lucide-react';
import { Student, ClassGroup, SpeakingLog, AuthUser } from '../../types';

interface SpeakingPracticeModuleProps {
  classGroup?: ClassGroup;
  classes?: ClassGroup[];
  students?: Student[];
  currentUser?: AuthUser | null;
  standalonePortalMode?: boolean;
  showToast?: (msg: string) => void;
  activeStudent?: any;
}

export const SpeakingPracticeModule: React.FC<SpeakingPracticeModuleProps> = ({ 
  classGroup: initialClassGroup, 
  classes = [],
  students: initialStudents = [],
  currentUser,
  standalonePortalMode = false,
  showToast,
  activeStudent: propActiveStudent
}) => {
  // Class selection state (if in global module view)
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (initialClassGroup?.id) return initialClassGroup.id;
    if (classes.length > 0) return classes[0].id;
    return '';
  });

  const effectiveClass = useMemo(() => {
    if (initialClassGroup) return initialClassGroup;
    if (classes.length > 0) {
      return classes.find(c => c.id === selectedClassId) || classes[0];
    }
    return undefined;
  }, [initialClassGroup, classes, selectedClassId]);

  // Students for this class
  const classStudents = useMemo(() => {
    if (!effectiveClass) return initialStudents;
    return initialStudents.filter(s => s.classId === effectiveClass.id && s.status !== 'Đã nghỉ học');
  }, [initialStudents, effectiveClass]);

  // View Mode: 'teacher' or 'student'
  const [activeViewMode, setActiveViewMode] = useState<'teacher' | 'student'>(
    standalonePortalMode ? 'student' : 'teacher'
  );

  // Student authentication state
  const [activeStudent, setActiveStudent] = useState<any>(() => {
    if (propActiveStudent && propActiveStudent.id !== 'anonymous') {
      return propActiveStudent;
    }
    return null;
  });

  const [studentLoginName, setStudentLoginName] = useState('');
  const [studentLoginClassCode, setStudentLoginClassCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const fromUrl = new URLSearchParams(window.location.search).get('classCode');
      if (fromUrl) return fromUrl;
    }
    return effectiveClass?.code || effectiveClass?.name || 'IDV-CLASS';
  });

  // Keep class code updated when selected class changes
  useEffect(() => {
    if (effectiveClass) {
      setStudentLoginClassCode(effectiveClass.code || effectiveClass.name || 'IDV-CLASS');
    }
  }, [effectiveClass]);

  // Shareable link state
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  // Timer states
  const [practiceTimeSeconds, setPracticeTimeSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Storage logs state
  const [speakingLogs, setSpeakingLogs] = useState<SpeakingLog[]>([]);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<{
    student: Student;
    totalMinutes: number;
    monthlyVisits: number;
    logs: SpeakingLog[];
  } | null>(null);

  // Fetch logs
  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/storage/speaking_logs?_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSpeakingLogs(json.data);
        }
      }
    } catch (e) {
      console.warn('Could not fetch speaking logs:', e);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 8000);
    return () => clearInterval(interval);
  }, []);

  // Handle active student practice timer & live recording
  useEffect(() => {
    if (!activeStudent) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const logId = `spk-${activeStudent.id || 'std'}-${Date.now()}`;
    const code = activeStudent.classCode || effectiveClass?.code || 'IDV-CLASS';

    // Post initial active log entry
    fetch(`/api/storage/speaking_logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: logId,
        studentId: activeStudent.id || `std-${Date.now()}`,
        studentName: activeStudent.name || activeStudent.studentName || 'Học viên',
        classCode: code,
        entryTime: new Date().toISOString(),
        durationMinutes: 0,
        status: 'active'
      })
    }).catch(err => console.warn('Failed to record initial entry:', err));

    // Live timer
    timerRef.current = setInterval(() => {
      setPracticeTimeSeconds(prev => prev + 1);
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        if (!timerRef.current) {
          timerRef.current = setInterval(() => {
            setPracticeTimeSeconds(prev => prev + 1);
          }, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Save final practice session
      const finalMinutes = Math.max(1, Math.round(practiceTimeSeconds / 60));
      fetch(`/api/storage/speaking_logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: logId,
          studentId: activeStudent.id || `std-${Date.now()}`,
          studentName: activeStudent.name || activeStudent.studentName || 'Học viên',
          classCode: code,
          entryTime: new Date().toISOString(),
          durationMinutes: finalMinutes,
          status: 'completed'
        })
      }).catch(err => console.warn('Failed to record session end:', err));
    };
  }, [activeStudent]);

  // Copy shareable link for students
  const handleCopyShareableLink = () => {
    const classParam = effectiveClass?.code || effectiveClass?.name || 'IDV-CLASS';
    const link = `${window.location.origin}${window.location.pathname}?mode=speaking&classCode=${encodeURIComponent(classParam)}`;
    
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setIsLinkCopied(true);
    if (showToast) {
      showToast('Đã sao chép link Luyện Speaking AI cho Học sinh!');
    }
    setTimeout(() => setIsLinkCopied(false), 3000);
  };

  // Student login submission
  const handleStudentLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!studentLoginName.trim()) {
      if (showToast) showToast('Vui lòng nhập Họ và Tên học sinh!');
      return;
    }
    if (!studentLoginClassCode.trim()) {
      if (showToast) showToast('Vui lòng nhập Mã Lớp!');
      return;
    }

    const found = classStudents.find(
      s => s.name.trim().toLowerCase() === studentLoginName.trim().toLowerCase()
    );

    const studentObj = {
      id: found?.id || `std-guest-${Date.now()}`,
      name: studentLoginName.trim(),
      classCode: studentLoginClassCode.trim(),
    };

    setActiveStudent(studentObj);
    setActiveViewMode('student');
    setPracticeTimeSeconds(0);
    if (showToast) showToast(`Chào mừng ${studentObj.name} vào phòng Luyện Speaking AI!`);
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins} phút ${secs < 10 ? '0' : ''}${secs} giây`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. TOP HEADER & NAVIGATION BAR */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-2 sm:p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Navigation Tabs & Class Selector */}
        <div className="flex items-center flex-wrap gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <div className="px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 shadow-2xs whitespace-nowrap">
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>🗣️ Luyện Speaking cùng IDV AI</span>
          </div>

          {/* Class Selector Dropdown if multiple classes exist */}
          {!initialClassGroup && classes.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500">Lớp:</span>
              <div className="relative">
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="appearance-none bg-white text-slate-900 font-extrabold text-xs py-1 pl-2.5 pr-7 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Share Link & View Switcher */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {!standalonePortalMode && (
            <button
              type="button"
              onClick={handleCopyShareableLink}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isLinkCopied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isLinkCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{isLinkCopied ? 'Đã sao chép link!' : '🔗 Copy Link Cho Học Sinh'}</span>
            </button>
          )}

          {!standalonePortalMode && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveViewMode('teacher')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeViewMode === 'teacher'
                    ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Giáo viên
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveViewMode('student');
                  if (!activeStudent && classStudents.length > 0) {
                    setStudentLoginName(classStudents[0].name);
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeViewMode === 'student'
                    ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Học sinh
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. STUDENT LOGIN STATUS PANEL (DARK NAVY GRADIENT) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 text-white shadow-md border border-indigo-500/30">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-indigo-400/30 shrink-0">
              <UserCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                ĐĂNG NHẬP HỌC SINH LUYỆN TẬP:
              </div>
              {activeStudent ? (
                <div className="text-sm font-black text-white flex items-center gap-2 mt-0.5">
                  <span className="text-emerald-400">● Đang luyện:</span>
                  <span className="text-amber-300">{activeStudent.name || activeStudent.studentName}</span>
                  <span className="text-xs font-normal text-slate-300">
                    (Lớp: {activeStudent.classCode || effectiveClass?.name || 'IDV'})
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-300 mt-0.5">
                  Nhập Họ Tên & Mã Lớp bên dưới để bắt đầu luyện nói với AI và ghi nhận thời gian.
                </div>
              )}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleStudentLogin} className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <input
              type="text"
              placeholder="Họ và Tên học sinh..."
              value={studentLoginName}
              onChange={(e) => setStudentLoginName(e.target.value)}
              className="w-full sm:w-48 px-3 py-1.5 rounded-xl bg-slate-950 border border-indigo-500/40 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
            />
            <input
              type="text"
              placeholder="Mã Lớp..."
              value={studentLoginClassCode}
              onChange={(e) => setStudentLoginClassCode(e.target.value)}
              className="w-full sm:w-28 px-3 py-1.5 rounded-xl bg-slate-950 border border-indigo-500/40 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              Vào Lớp Luyện Speaking AI
            </button>
            {activeStudent && (
              <button
                type="button"
                onClick={() => {
                  setActiveStudent(null);
                  setPracticeTimeSeconds(0);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition-all cursor-pointer"
              >
                Thoát
              </button>
            )}
          </form>
        </div>
      </div>

      {/* 3. TEACHER DASHBOARD: DANH SÁCH HỌC SINH & THỜI GIAN LUYỆN TẬP */}
      {activeViewMode === 'teacher' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Thống Kê Số Phút Luyện Speaking AI Của Lớp {effectiveClass?.name || 'IDV'}
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Tổng số học viên: {classStudents.length}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-center w-16">STT</th>
                  <th className="py-3 px-4">Họ và Tên Học Viên</th>
                  <th className="py-3 px-4 text-center">Thời Gian Luyện (Phút)</th>
                  <th className="py-3 px-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium italic">
                      Lớp này chưa có danh sách học viên
                    </td>
                  </tr>
                ) : (
                  classStudents.map((st, idx) => {
                    const studentLogs = speakingLogs.filter(log => 
                      log.studentName?.trim().toLowerCase() === st.name.trim().toLowerCase()
                    );
                    
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    
                    const monthlyVisits = studentLogs.filter(log => {
                      const d = new Date(log.entryTime);
                      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    }).length;

                    const totalMinutes = studentLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

                    return (
                      <tr key={st.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900">{st.name}</div>
                          {st.code && <div className="text-[10px] text-slate-400 font-bold uppercase">{st.code}</div>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 font-black border border-amber-200 shadow-2xs">
                              {totalMinutes} Phút
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                              ({monthlyVisits} lượt trong tháng {currentMonth + 1})
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForDetail({
                              student: st,
                              totalMinutes,
                              monthlyVisits,
                              logs: studentLogs
                            })}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs cursor-pointer border border-indigo-200 transition-all active:scale-95"
                          >
                            Xem nhật ký
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PRACTICE WORKSPACE (CUSTOM GPT SPEAKING TRAINER) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md border border-indigo-400 shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                IELTS Speaking Trainer (Custom GPT IDV)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Luyện tập giao tiếp phản xạ 1-1 theo chuẩn tiêu chí chấm thi IELTS
              </p>
            </div>
          </div>

          {/* Active timer badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thời gian luyện thực tế:</div>
              <div className="text-base font-black text-indigo-700">
                {formatTimer(practiceTimeSeconds)}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Launch Card */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold border border-white/10 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Phiên bản huấn luyện độc quyền IDV</span>
            </div>

            <h4 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Bắt đầu phiên luyện nói cùng Trợ lý ảo AI
            </h4>

            <p className="text-indigo-200 text-sm leading-relaxed font-medium">
              Nhấn nút bên dưới để mở giao diện Custom GPT. Hãy nói trực tiếp vào micro trên máy tính hoặc điện thoại để AI phản hồi, sửa lỗi ngữ pháp, phát âm và gợi ý từ vựng Band 7.0+.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="https://chatgpt.com/g/g-6a7bf1b6300481919015f37ad8e49df3-ielts-speaking-trainer-idv"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (!activeStudent) {
                    // Auto activate student or prompt
                    const guest = {
                      id: `std-guest-${Date.now()}`,
                      name: currentUser?.name || 'Học viên',
                      classCode: effectiveClass?.code || 'IDV-CLASS'
                    };
                    setActiveStudent(guest);
                  }
                }}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <span>🚀 Mở IELTS Speaking Trainer (Custom GPT)</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={handleCopyShareableLink}
                className="px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Gửi link cho học sinh lớp này</span>
              </button>
            </div>
          </div>
        </div>

        {/* Practice Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-black text-slate-900 flex items-center gap-1.5">
              <span>🎯 Luyện Phản Xạ Part 1</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              Yêu cầu AI hỏi các chủ đề quen thuộc (Work/Study, Hobbies, Hometown) và trả lời trong 3-4 câu hoàn chỉnh.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-black text-slate-900 flex items-center gap-1.5">
              <span>⏱️ Mô Phỏng Part 2 (Cue Card)</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              Nhận đề bài Cue Card, dành 1 phút chuẩn bị dàn ý và nói liên tục 2 phút. Nhận xét phân tích sau bài nói.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-black text-slate-900 flex items-center gap-1.5">
              <span>💡 Nâng Cấp Từ Vựng & Ngữ Pháp</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              Sau mỗi câu trả lời, yêu cầu AI paraphrase lại sang phong cách Band 7.5+ với các collocations tự nhiên.
            </p>
          </div>
        </div>
      </div>

      {/* 5. MODAL: XEM NHẬT KÝ CHI TIẾT CỦA HỌC VIÊN */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Nhật Ký Luyện Speaking AI
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Học viên: <strong className="text-indigo-600">{selectedStudentForDetail.student.name}</strong> ({selectedStudentForDetail.student.code || effectiveClass?.name})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick stats badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-[10px] font-bold text-amber-700 uppercase">Tổng thời gian</div>
                <div className="text-lg font-black text-amber-900 mt-0.5">
                  {selectedStudentForDetail.totalMinutes} phút
                </div>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                <div className="text-[10px] font-bold text-indigo-700 uppercase">Lượt tháng này</div>
                <div className="text-lg font-black text-indigo-900 mt-0.5">
                  {selectedStudentForDetail.monthlyVisits} lần
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">Tổng số lượt</div>
                <div className="text-lg font-black text-emerald-900 mt-0.5">
                  {selectedStudentForDetail.logs.length} lần
                </div>
              </div>
            </div>

            {/* Session timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-600" />
                Lịch sử từng phiên luyện tập:
              </h4>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {selectedStudentForDetail.logs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    Chưa có lượt ghi nhận thời gian nào
                  </p>
                ) : (
                  selectedStudentForDetail.logs.map((log) => {
                    const date = new Date(log.entryTime);
                    return (
                      <div 
                        key={log.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800">
                            {date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Lúc: {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • Lớp: {log.classCode}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-indigo-600">
                            +{log.durationMinutes || 0} phút
                          </span>
                          <div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                              log.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {log.status === 'active' ? 'Đang học' : 'Hoàn thành'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStudentForDetail(null)}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
            >
              Đóng nhật ký
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
