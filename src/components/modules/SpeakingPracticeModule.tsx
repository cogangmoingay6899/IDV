import React, { useEffect, useState, useRef } from 'react';
import { Bot, Clock, ArrowRight, User } from 'lucide-react';

interface SpeakingPracticeModuleProps {
  activeStudent: any;
  standalonePortalMode?: boolean;
}

export const SpeakingPracticeModule: React.FC<SpeakingPracticeModuleProps> = ({ 
  activeStudent: initialActiveStudent, 
  standalonePortalMode 
}) => {
  const [activeStudent, setActiveStudent] = useState(initialActiveStudent);
  const [seconds, setSeconds] = useState(0);
  const [loginName, setLoginName] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activeStudent) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        if (!timerRef.current) {
          timerRef.current = setInterval(() => {
            setSeconds((prev) => prev + 1);
          }, 1000);
        }
      }
    };

    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      const totalMinutes = Math.floor(seconds / 60);
      
      if (activeStudent && totalMinutes > 0) {
        navigator.sendBeacon('/api/log-study-time', JSON.stringify({
          studentId: activeStudent.id || 'unknown',
          studentName: activeStudent.name || activeStudent.studentName || 'unknown',
          durationMinutes: totalMinutes,
          course: "IELTS Speaking Trainer AI"
        }));
      }
    };
  }, [seconds, activeStudent]);

  if (standalonePortalMode && !activeStudent) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mt-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Đăng nhập luyện tập AI</h2>
          <p className="text-slate-500 mt-1">Vui lòng nhập họ tên để bắt đầu ghi nhận</p>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (loginName.trim()) {
            setActiveStudent({ name: loginName.trim(), id: 'portal-' + Date.now() });
          }
        }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Họ và tên học sinh:</label>
            <input
              type="text"
              required
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            Bắt đầu luyện tập
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes} phút ${secs} giây`;
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
          <Bot className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Luyện Speaking AI</h2>
          <p className="text-slate-500">Học viên: <span className="font-bold text-slate-900">{activeStudent?.name || activeStudent?.studentName}</span></p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 mb-8 flex items-center gap-4">
        <Clock className="w-6 h-6 text-indigo-500" />
        <div>
          <p className="text-sm text-slate-500 font-medium">Thời gian luyện tập thực tế:</p>
          <p className="text-xl font-bold text-indigo-700">{formatTime(seconds)}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 border border-slate-200 rounded-xl text-center">
        <h3 className="text-lg font-semibold mb-2">Bắt đầu luyện tập</h3>
        <p className="text-slate-600 mb-6">Nhấn vào link dưới đây để mở Custom GPT và bắt đầu luyện tập:</p>
        
        <a 
          href="https://chatgpt.com/g/g-6a7bf1b6300481919015f37ad8e49df3-ielts-speaking-trainer-idv" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 transition text-white font-semibold rounded-lg shadow-md"
        >
          Mở IELTS Speaking Trainer (Custom GPT)
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
