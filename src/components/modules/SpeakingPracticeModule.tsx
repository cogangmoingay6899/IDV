import React, { useEffect, useState } from 'react';
import { Bot, Clock, ArrowRight } from 'lucide-react';

export const SpeakingPracticeModule: React.FC<{ activeStudent: any }> = ({ activeStudent }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Bắt đầu đếm giây khi học sinh vào trang
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Khi học sinh thoát khỏi trang, tự động gửi dữ liệu thời gian về hệ thống
    return () => {
      clearInterval(timer);
      const totalMinutes = Math.floor(seconds / 60);
      
      // Gói dữ liệu gửi về backend hệ thống quản lý
      if (activeStudent) {
        navigator.sendBeacon('/api/log-study-time', JSON.stringify({
          studentId: activeStudent.id || 'unknown',
          durationMinutes: totalMinutes,
          course: "IELTS Speaking Trainer"
        }));
      }
    };
  }, [seconds, activeStudent]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes} phút ${secs} giây`;
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 text-green-700 rounded-xl">
          <Bot className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Phòng luyện Speaking cùng IDV AI</h2>
          <p className="text-slate-500">Luyện tập giao tiếp 1-1 với trợ lý ảo chuyên sâu IELTS</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 mb-8 flex items-center gap-4">
        <Clock className="w-6 h-6 text-indigo-500" />
        <div>
          <p className="text-sm text-slate-500 font-medium">Thời gian luyện tập phiên này:</p>
          <p className="text-xl font-bold text-indigo-700">{formatTime(seconds)}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 border border-slate-200 rounded-xl text-center">
        <h3 className="text-lg font-semibold mb-2">Sẵn sàng bắt đầu?</h3>
        <p className="text-slate-600 mb-6">Nhấn vào nút bên dưới để mở phòng luyện tập Speaking trong tab mới.</p>
        
        <a 
          href="https://chatgpt.com/g/g-6a7bf1b6300481919015f37ad8e49df3-ielts-speaking-trainer-idv" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 transition text-white font-semibold rounded-lg"
        >
          Mở phòng luyện tập Speaking (Tab mới)
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
