import React, { useState, useRef, useMemo } from 'react';
import { toPng, toBlob } from 'html-to-image';
import {
  Download,
  Copy,
  Check,
  X,
  Trophy,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Palette,
  Users,
  Award,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Medal,
  Crown,
  Share2,
} from 'lucide-react';
import { VocabTest, VocabTestSubmission, ClassGroup } from '../../types';

interface VocabLeaderboardExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: VocabTest | null;
  initialClassFilter?: string;
  classes?: ClassGroup[];
}

type ImageTheme = 'purple' | 'blue' | 'emerald';

export const VocabLeaderboardExportModal: React.FC<VocabLeaderboardExportModalProps> = ({
  isOpen,
  onClose,
  test,
  initialClassFilter = 'all',
  classes = [],
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<ImageTheme>('purple');
  const [selectedClass, setSelectedClass] = useState<string>(initialClassFilter);
  const [activeTab, setActiveTab] = useState<'image_preview' | 'text_zalo'>('image_preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState<'text' | 'image' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filter valid submissions (exclude demo placeholders)
  const validSubmissions = useMemo(() => {
    if (!test || !test.submissions) return [];
    return test.submissions.filter(
      (sub) =>
        sub.studentName &&
        sub.studentName !== 'Nguyễn Văn Minh' &&
        sub.studentName !== 'Phạm Nhật Nam' &&
        !sub.studentName.toLowerCase().includes('nguyễn văn minh') &&
        !sub.studentName.toLowerCase().includes('phạm nhật nam') &&
        sub.id !== 'sub-1' &&
        sub.id !== 'sub-rev-1'
    );
  }, [test]);

  // Unique classes from submissions
  const availableClassList = useMemo(() => {
    const fromSubs = validSubmissions
      .map((s) => (s.className || '').trim())
      .filter((c) => Boolean(c));
    const set = new Set(fromSubs);
    classes.forEach((c) => {
      if (c.name) set.add(c.name.trim());
    });
    return Array.from(set);
  }, [validSubmissions, classes]);

  // Filtered and sorted submissions
  const rankedSubmissions = useMemo(() => {
    let list = validSubmissions.filter((sub) => {
      if (!selectedClass || selectedClass === 'all') return true;
      const subClass = (sub.className || '').trim().toLowerCase();
      const filterVal = selectedClass.trim().toLowerCase();
      if (subClass === filterVal) return true;

      const subNum = subClass.match(/\d+/)?.[0];
      const filterNum = filterVal.match(/\d+/)?.[0];
      if (subNum && filterNum && subNum === filterNum) return true;

      return subClass.includes(filterVal) || filterVal.includes(subClass);
    });

    return list.sort((a, b) => {
      if (b.correctCount !== a.correctCount) {
        return b.correctCount - a.correctCount;
      }
      return a.timeSpentSeconds - b.timeSpentSeconds;
    });
  }, [validSubmissions, selectedClass]);

  // Statistics
  const stats = useMemo(() => {
    const total = rankedSubmissions.length;
    if (total === 0) {
      return { total: 0, avgScore: '0.0', maxScore: 0, perfectCount: 0 };
    }
    const sumScore = rankedSubmissions.reduce((acc, cur) => acc + (cur.score || 0), 0);
    const maxScore = Math.max(...rankedSubmissions.map((s) => s.score || 0));
    const perfectCount = rankedSubmissions.filter((s) => s.correctCount === s.totalQuestions).length;

    return {
      total,
      avgScore: (sumScore / total).toFixed(1),
      maxScore,
      perfectCount,
    };
  }, [rankedSubmissions]);

  if (!isOpen || !test) return null;

  // Format Zalo message text
  const generateZaloText = (): string => {
    const classTitle = selectedClass === 'all' ? 'TẤT CẢ CÁC LỚP' : `LỚP ${selectedClass}`;
    let text = `📢 IELTS DƯƠNG VŨ\n`;
    text += `🏆 BẢNG XẾP HẠNG BÀI KIỂM TRA TỪ VỰNG - ${classTitle}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📖 Bài kiểm tra: ${test.title}\n`;
    text += `📚 Khóa học: ${test.courseLevel} • ${test.unitName}\n`;
    text += `📊 Thống kê: ${stats.total} học viên tham gia | Điểm TB: ${stats.avgScore}/10 | Điểm cao nhất: ${stats.maxScore}/10\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (rankedSubmissions.length === 0) {
      text += `(Chưa có kết quả học viên nộp bài)\n`;
    } else {
      rankedSubmissions.forEach((sub, idx) => {
        let rankEmoji = `#${idx + 1}.`;
        if (idx === 0) rankEmoji = `🥇 Top 1.`;
        else if (idx === 1) rankEmoji = `🥈 Top 2.`;
        else if (idx === 2) rankEmoji = `🥉 Top 3.`;

        const clsTag = sub.className ? ` (Lớp: ${sub.className})` : '';
        const timeTag = `⏱️ ${sub.timeSpentSeconds}s`;
        const honestTag = sub.tabSwitchViolations > 0 ? ` [⚠️ Thoát ${sub.tabSwitchViolations} lần]` : ` [✅ Trung thực]`;

        text += `${rankEmoji} ${sub.studentName}${clsTag}: ${sub.correctCount}/${sub.totalQuestions} câu (${sub.score}/10đ) | ${timeTag}${honestTag}\n`;
      });
    }

    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👏 Xin chúc mừng các con đã hoàn thành xuất sắc bài kiểm tra!\n`;
    text += `❤️ Quý Phụ huynh vui lòng theo dõi và đồng hành cùng con chuẩn bị tốt cho các buổi học tiếp theo.\n`;
    text += `🏢 IELTS DƯƠNG VŨ • Hotline: 0798934698`;

    return text;
  };

  const handleCopyText = () => {
    const text = generateZaloText();
    navigator.clipboard.writeText(text);
    setCopiedStatus('text');
    setStatusMessage('Đã sao chép nội dung bảng xếp hạng Zalo!');
    setTimeout(() => {
      setCopiedStatus(null);
      setStatusMessage(null);
    }, 3000);
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      setStatusMessage('Đang kết xuất ảnh chất lượng cao HD...');
      await new Promise((resolve) => setTimeout(resolve, 120));

      const dataUrl = await toPng(cardRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: theme === 'purple' ? '#1e1b4b' : theme === 'blue' ? '#0f172a' : '#064e3b',
        cacheBust: true,
        skipFonts: true,
      });

      const fileName = `BangXepHang_${(test.title || 'VocabTest').replace(/[^a-zA-Z0-9]/g, '_')}_${
        selectedClass === 'all' ? 'All' : selectedClass
      }.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      setStatusMessage('Đã tải ảnh Bảng Xếp Hạng thành công!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setStatusMessage('Lỗi khi tạo ảnh. Vui lòng thử lại!');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      setStatusMessage('Đang sao chép ảnh vào Clipboard...');
      await new Promise((resolve) => setTimeout(resolve, 120));

      const blob = await toBlob(cardRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: theme === 'purple' ? '#1e1b4b' : theme === 'blue' ? '#0f172a' : '#064e3b',
        cacheBust: true,
        skipFonts: true,
      });

      if (!blob) throw new Error('Blob generation failed');

      if (navigator.clipboard && navigator.clipboard.write) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopiedStatus('image');
        setStatusMessage('Đã chép ảnh vào bộ nhớ tạm! Bạn có thể dán (Ctrl+V) ngay vào Zalo.');
        setTimeout(() => {
          setCopiedStatus(null);
          setStatusMessage(null);
        }, 4000);
      } else {
        // Fallback to download if clipboard write image not supported
        handleDownloadImage();
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Không thể dán trực tiếp, đang tự động tải ảnh về máy...');
      handleDownloadImage();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[94vh] overflow-y-auto space-y-4 my-auto relative">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-black text-xl shadow-md border border-amber-300 shrink-0">
              🏆
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <span>Tạo Ảnh Bảng Xếp Hạng Gửi Zalo Phụ Huynh</span>
                <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                  Dành cho GV & Quản lý
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {test.title} • {test.unitName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold hover:bg-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter by Class & Theme Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          {/* Class Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-700" />
              <span>Chọn Lớp xuất bảng xếp hạng:</span>
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedClass('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border cursor-pointer ${
                  selectedClass === 'all'
                    ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tất cả ({validSubmissions.length})
              </button>
              {availableClassList.map((cls) => {
                const count = validSubmissions.filter((s) => {
                  const sc = (s.className || '').toLowerCase();
                  const fc = cls.toLowerCase();
                  const sn = sc.match(/\d+/)?.[0];
                  const fn = fc.match(/\d+/)?.[0];
                  return sc === fc || (sn && fn && sn === fn) || sc.includes(fc) || fc.includes(sc);
                }).length;
                const isSel =
                  selectedClass.toLowerCase() === cls.toLowerCase() ||
                  (selectedClass.match(/\d+/)?.[0] &&
                    cls.match(/\d+/)?.[0] &&
                    selectedClass.match(/\d+/)?.[0] === cls.match(/\d+/)?.[0]);

                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border cursor-pointer ${
                      isSel
                        ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Lớp {cls} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Selector & View Switcher */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-600" />
              <span>Giao diện màu ảnh:</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme('purple')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === 'purple'
                    ? 'bg-purple-900 text-amber-300 border-purple-950 ring-2 ring-purple-400 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <span>👑 Tím Hoàng Gia</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('blue')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === 'blue'
                    ? 'bg-sky-900 text-sky-200 border-sky-950 ring-2 ring-sky-400 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <span>💎 Xanh Navy</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('emerald')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === 'emerald'
                    ? 'bg-emerald-900 text-emerald-200 border-emerald-950 ring-2 ring-emerald-400 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <span>🌿 Xanh Ngọc</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('image_preview')}
            className={`flex-1 py-2 px-3 rounded-lg font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'image_preview'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Xem & Xuất Ảnh Bảng Xếp Hạng HD</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text_zalo')}
            className={`flex-1 py-2 px-3 rounded-lg font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'text_zalo'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Văn Bản Gửi Tin Nhắn Zalo</span>
          </button>
        </div>

        {/* Notification / Status Message */}
        {statusMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* TAB 1: IMAGE PREVIEW & EXPORT */}
        {activeTab === 'image_preview' && (
          <div className="space-y-4">
            {/* Action Buttons Top */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-xs text-slate-500 font-semibold">
                Đang hiển thị: <strong>{rankedSubmissions.length} học viên</strong> ({selectedClass === 'all' ? 'Tất cả lớp' : `Lớp ${selectedClass}`})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleCopyImage}
                  className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {copiedStatus === 'image' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>Sao Chép Ảnh (Dán Zalo)</span>
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleDownloadImage}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Ảnh Về Máy (PNG)</span>
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER - CAPTURED BY HTML-TO-IMAGE */}
            <div className="border border-slate-200 rounded-2xl p-2 bg-slate-100 overflow-x-auto">
              <div
                ref={cardRef}
                className={`w-[680px] sm:w-[740px] mx-auto p-4 sm:p-5 rounded-2xl text-white shadow-2xl space-y-3.5 ${
                  theme === 'purple'
                    ? 'bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 border-2 border-purple-500/40'
                    : theme === 'blue'
                    ? 'bg-gradient-to-br from-slate-950 via-sky-950 to-blue-950 border-2 border-sky-500/40'
                    : 'bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border-2 border-emerald-500/40'
                }`}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {/* Brand Header - Compact & Elegant */}
                <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-amber-400 text-purple-950 border border-amber-300">
                        IELTS DƯƠNG VŨ
                      </span>
                      <span className="text-[11px] text-amber-200/90 font-bold">
                        • {test.courseLevel}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                      BẢNG XẾP HẠNG TỪ VỰNG & ÔN TẬP
                    </h2>
                    <p className="text-[11px] text-slate-300">
                      {test.title} • {test.unitName}
                    </p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 text-amber-300 text-[11px] font-black border border-white/20 inline-block">
                      {selectedClass === 'all' ? '🌐 TẤT CẢ CÁC LỚP' : `🏫 LỚP ${selectedClass}`}
                    </span>
                    <div className="text-[9px] text-slate-400 font-medium">
                      Cập nhật: {new Date().toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>

                {/* Summary Stat Cards - Compact */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/10">
                    <span className="text-[9px] text-slate-300 font-bold block uppercase tracking-wider">
                      Học sinh nộp bài
                    </span>
                    <span className="text-lg sm:text-xl font-black text-amber-300">{stats.total}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/10">
                    <span className="text-[9px] text-slate-300 font-bold block uppercase tracking-wider">
                      Điểm trung bình
                    </span>
                    <span className="text-lg sm:text-xl font-black text-emerald-400">{stats.avgScore}/10</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/10">
                    <span className="text-[9px] text-slate-300 font-bold block uppercase tracking-wider">
                      Điểm cao nhất
                    </span>
                    <span className="text-lg sm:text-xl font-black text-amber-400">{stats.maxScore}/10</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/10">
                    <span className="text-[9px] text-slate-300 font-bold block uppercase tracking-wider">
                      Điểm tuyệt đối
                    </span>
                    <span className="text-lg sm:text-xl font-black text-sky-400">{stats.perfectCount}</span>
                  </div>
                </div>

                {/* FULL LEADERBOARD TABLE - ALL STUDENTS RENDERED (NO SCROLLBAR IN CAPTURED IMAGE) */}
                <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 px-2 pb-1 border-b border-white/10">
                    <span className="w-14">Hạng</span>
                    <span className="flex-1 text-left">Học sinh & Lớp</span>
                    <span className="w-20 text-center">Số câu đúng</span>
                    <span className="w-16 text-center">Điểm số</span>
                    <span className="w-20 text-right">Thời gian</span>
                  </div>

                  {rankedSubmissions.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-xs font-bold">
                      Chưa có học sinh nào nộp bài cho tiêu chí lọc này.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {rankedSubmissions.map((sub, idx) => {
                        let rankStyle = 'bg-white/10 text-slate-200';
                        let rankText = `#${idx + 1}`;
                        if (idx === 0) {
                          rankStyle = 'bg-amber-400 text-purple-950 font-black';
                          rankText = '🥇 TOP 1';
                        } else if (idx === 1) {
                          rankStyle = 'bg-slate-200 text-slate-900 font-black';
                          rankText = '🥈 TOP 2';
                        } else if (idx === 2) {
                          rankStyle = 'bg-orange-300 text-orange-950 font-black';
                          rankText = '🥉 TOP 3';
                        }

                        return (
                          <div
                            key={sub.id}
                            className={`flex items-center justify-between py-1.5 px-2 rounded-lg border transition-all text-[11px] ${
                              idx === 0
                                ? 'bg-amber-400/15 border-amber-400/40 text-white shadow-2xs'
                                : idx === 1
                                ? 'bg-slate-200/15 border-slate-300/30 text-white'
                                : idx === 2
                                ? 'bg-orange-400/15 border-orange-400/30 text-white'
                                : 'bg-white/5 border-white/5 text-slate-200'
                            }`}
                          >
                            <div className="w-14 shrink-0">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] inline-block font-bold ${rankStyle}`}>
                                {rankText}
                              </span>
                            </div>

                            <div className="flex-1 text-left flex items-center gap-1.5 truncate pr-2">
                              <span className="font-extrabold text-white truncate">{sub.studentName}</span>
                              {sub.className && (
                                <span className="text-[9px] font-bold text-amber-300 bg-amber-400/20 px-1 py-0.2 rounded border border-amber-300/30 shrink-0">
                                  {sub.className}
                                </span>
                              )}
                            </div>

                            <div className="w-20 text-center font-bold text-emerald-400 shrink-0">
                              {sub.correctCount}/{sub.totalQuestions}
                            </div>

                            <div className="w-16 text-center font-black text-amber-300 shrink-0">
                              {sub.score}/10đ
                            </div>

                            <div className="w-20 text-right text-[10px] text-slate-300 font-mono shrink-0">
                              ⏱️ {sub.timeSpentSeconds}s
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Center Info - Compact */}
                <div className="flex items-center justify-between pt-1.5 border-t border-white/15 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hệ thống chấm điểm & chống gian lận tự động • IELTS DƯƠNG VŨ</span>
                  </div>
                  <div className="font-bold text-amber-300">
                    Hotline: 0798934698
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEXT ZALO MESSAGE */}
        {activeTab === 'text_zalo' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Nội dung tin nhắn Zalo định dạng sẵn (kèm biểu tượng vinh danh):
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                {copiedStatus === 'text' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>Sao Chép Nội Dung Zalo</span>
              </button>
            </div>

            <textarea
              readOnly
              rows={14}
              value={generateZaloText()}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 font-mono text-xs leading-relaxed focus:ring-2 focus:ring-purple-500/20 outline-none"
            />
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            💡 Gợi ý: Bấm <strong>"Sao Chép Ảnh"</strong> rồi nhấn <strong>Ctrl + V</strong> trực tiếp vào ô chat Zalo Phụ huynh để gửi nhanh nhất!
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
