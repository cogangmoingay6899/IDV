import React, { useState, useRef, useMemo } from 'react';
import { toPng, toBlob } from 'html-to-image';
import {
  Download,
  Copy,
  Check,
  X,
  ArrowDownUp,
  Trophy,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Palette,
  Eye,
  Award,
  Calendar,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Coins,
} from 'lucide-react';
import { ClassGroup, Student } from '../../types';
import { StudentRowState } from '../modules/ClassDetailView';

interface ClassScoreExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classGroup: ClassGroup;
  classStudents: Student[];
  studentRows: Record<string, StudentRowState>;
  sessionNumber: number;
  currentDate: string;
  teacherName: string;
  lessonTopic: string;
  selectedSkills: string[];
  overallScoreType: 'ielts_band' | 'standard_10' | 'percentage' | 'average';
  enableOverallScore: boolean;
  hasWritingSkill: boolean;
  calculateStudentAverage: (row: StudentRowState | undefined) => string;
  skillTotalQuestions?: Record<string, string>;
  totalPenaltyAmount?: string;
  penaltyBankAccount?: string;
  selectedHomeworkItems?: string[];
}

type SortMode = 'score_desc' | 'default' | 'name_asc';
type ImageTheme = 'purple' | 'blue' | 'slate';

export const ClassScoreExportModal: React.FC<ClassScoreExportModalProps> = ({
  isOpen,
  onClose,
  classGroup,
  classStudents,
  studentRows,
  sessionNumber,
  currentDate,
  teacherName,
  lessonTopic,
  selectedSkills,
  overallScoreType,
  enableOverallScore,
  hasWritingSkill,
  calculateStudentAverage,
  skillTotalQuestions = {},
  totalPenaltyAmount = '0 đ',
  penaltyBankAccount = '',
  selectedHomeworkItems = [],
}) => {
  const reportCardRef = useRef<HTMLDivElement>(null);

  const [sortMode, setSortMode] = useState<SortMode>('score_desc');
  const [theme, setTheme] = useState<ImageTheme>('purple');
  const [activeTab, setActiveTab] = useState<'image_preview' | 'text_zalo'>('image_preview');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState<'text' | 'image' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Helper to extract numeric score for sorting
  const getNumericScore = (st: Student): number => {
    const row = studentRows[st.id];
    if (!row) return -1;
    if (row.status === 'Vắng có phép' || row.status === 'Vắng không phép') return -2;

    const avgStr = calculateStudentAverage(row);
    if (avgStr && avgStr !== '-') {
      const parsed = parseFloat(avgStr);
      if (!isNaN(parsed)) return parsed;
    }

    // Fallback: sum or average of skillScores
    if (row.skillScores) {
      const scores = Object.values(row.skillScores)
        .map((s) => parseFloat(String(s)))
        .filter((s) => !isNaN(s));
      if (scores.length > 0) {
        return scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }

    return -1;
  };

  // Sorted students based on active sortMode
  const sortedStudents = useMemo(() => {
    const list = [...classStudents];
    if (sortMode === 'score_desc') {
      return list.sort((a, b) => {
        const scoreA = getNumericScore(a);
        const scoreB = getNumericScore(b);
        if (scoreB !== scoreA) {
          return scoreB - scoreA; // High to low
        }
        return a.name.localeCompare(b.name, 'vi');
      });
    } else if (sortMode === 'name_asc') {
      return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }
    return list; // Default class roster order
  }, [classStudents, sortMode, studentRows]);

  // Statistics
  const classStats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let totalScore = 0;
    let validScoreCount = 0;
    let highestScore = 0;
    let topScorers: { name: string; score: number }[] = [];

    sortedStudents.forEach((st) => {
      const row = studentRows[st.id];
      const isAbsent = row?.status === 'Vắng có phép' || row?.status === 'Vắng không phép';
      if (isAbsent) {
        absentCount++;
      } else {
        presentCount++;
      }

      const numScore = getNumericScore(st);
      if (numScore >= 0) {
        validScoreCount++;
        totalScore += numScore;
        if (numScore > highestScore) {
          highestScore = numScore;
        }
      }
    });

    if (highestScore > 0) {
      topScorers = sortedStudents
        .filter((st) => getNumericScore(st) === highestScore)
        .map((st) => ({ name: st.name, score: highestScore }));
    }

    const average = validScoreCount > 0 ? (totalScore / validScoreCount).toFixed(1) : '-';

    return {
      total: sortedStudents.length,
      presentCount,
      absentCount,
      averageScore: average,
      highestScore: highestScore > 0 ? highestScore.toString() : '-',
      topScorers,
    };
  }, [sortedStudents, studentRows]);

  // Helper to parse penalty amount string
  const parsePenaltyAmount = (val?: string | number): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const str = val.toString().trim().toLowerCase();
    if (str === '0' || str === '0 đ' || str === '0đ' || str === '' || str === '-') return 0;
    if (str.endsWith('k')) {
      const n = parseFloat(str.replace('k', '').replace(/,/g, '.'));
      return isNaN(n) ? 0 : n * 1000;
    }
    const digits = str.replace(/[^\d]/g, '');
    const n = parseInt(digits, 10);
    return isNaN(n) ? 0 : n;
  };

  // Auto-calculated total penalty amount of the session
  const totalCalculatedPenalty = useMemo(() => {
    return classStudents.reduce((sum, st) => {
      const row = studentRows[st.id];
      const fee = row?.penaltyFee;
      return sum + parsePenaltyAmount(fee);
    }, 0);
  }, [classStudents, studentRows]);

  // Auto-calculated total unpaid previous debt of the class
  const totalCalculatedPrevDebt = useMemo(() => {
    return classStudents.reduce((sum, st) => {
      const row = studentRows[st.id];
      const fee = row?.previousDebt;
      return sum + parsePenaltyAmount(fee);
    }, 0);
  }, [classStudents, studentRows]);

  const grandTotalReceivable = totalCalculatedPenalty + totalCalculatedPrevDebt;
  const hasAnyPenalty = totalCalculatedPenalty > 0;
  const hasAnyReceivable = grandTotalReceivable > 0;
  const formattedTotalPenalty = totalCalculatedPenalty > 0 ? `${totalCalculatedPenalty.toLocaleString('vi-VN')} đ` : '0 đ';
  const formattedTotalPrevDebt = totalCalculatedPrevDebt > 0 ? `${totalCalculatedPrevDebt.toLocaleString('vi-VN')} đ` : '0 đ';

  // Generate formatted Zalo Text based on active sort order
  const generateSortedZaloText = (): string => {
    const sortLabel =
      sortMode === 'score_desc'
        ? '🏆 BẢNG VINH DANH & ĐIỂM SẮP XẾP TỪ CAO XUỐNG THẤP'
        : '📋 BẢNG ĐIỂM THEO DANH SÁCH LỚP';

    let text = `📢 IELTS DƯƠNG VŨ\n`;
    text += `🏆 BẢNG ĐIỂM BUỔI HỌC SỐ ${sessionNumber}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🏫 Lớp: ${classGroup.name} | Ngày: ${currentDate}\n`;
    text += `📚 Kỹ năng kiểm tra: ${selectedSkills.map((sk) => (skillTotalQuestions?.[sk] ? `${sk} (Tổng ${skillTotalQuestions[sk]} câu)` : sk)).join(', ')}\n`;
    if (hasAnyReceivable) {
      if (totalCalculatedPenalty > 0) {
        text += `💰 TIỀN PHẠT BUỔI NÀY: ${formattedTotalPenalty}\n`;
      }
      if (totalCalculatedPrevDebt > 0) {
        text += `📋 NỢ CÁC BUỔI TRƯỚC: ${formattedTotalPrevDebt}\n`;
      }
      if (totalCalculatedPenalty > 0 && totalCalculatedPrevDebt > 0) {
        text += `💵 TỔNG CẦN THU CỦA LỚP: ${grandTotalReceivable.toLocaleString('vi-VN')} đ\n`;
      }
      text += `⚠️ LƯU Ý QUAN TRỌNG: PH/HS chuyển khoản nộp phạt vào STK cá nhân của trợ lý, không chuyển khoản tiền nộp phạt vào STK công ty.\n`;
    }
    text += `📊 Thống kê: Sĩ số ${classStats.total} | Có mặt ${classStats.presentCount} | Điểm TB: ${classStats.averageScore} | Cao nhất: ${classStats.highestScore}\n`;
    text += `📌 Chế độ xem: ${sortLabel}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    sortedStudents.forEach((st, idx) => {
      const row = studentRows[st.id];
      const scoresArr: string[] = [];
      selectedSkills.forEach((sk) => {
        if (row?.skillScores?.[sk]) {
          const totalQ = skillTotalQuestions?.[sk];
          scoresArr.push(`${sk}: ${row.skillScores[sk]}${totalQ ? `/${totalQ} câu` : ''}`);
        }
      });
      const scoresStr = scoresArr.length > 0 ? scoresArr.join(' | ') : 'Chưa có điểm';
      const avg = calculateStudentAverage(row);
      const avgStr = avg !== '-' ? ` | ${overallScoreType === 'ielts_band' ? 'Band' : 'ĐTB'}: ${avg}` : '';
      
      const activeItems = selectedHomeworkItems && selectedHomeworkItems.length > 0 ? selectedHomeworkItems : [];
      const activeMissing = (row?.missingHomeworkItems || []).filter((i) => activeItems.includes(i));
      let hwStr = 'Đã làm';
      if (activeItems.length === 0) {
        hwStr = '-';
      } else if (row?.homeworkStatus === 'Chưa làm' || activeMissing.length >= activeItems.length) {
        hwStr = 'Chưa làm';
      } else if (activeMissing.length > 0) {
        hwStr = `Thiếu (${activeMissing.join(', ')})`;
      } else {
        hwStr = `Đủ (${activeItems.join(', ')})`;
      }
      const parsedPFee = parsePenaltyAmount(row?.penaltyFee);
      const parsedDebt = parsePenaltyAmount(row?.previousDebt);
      const studentTotalDue = parsedPFee + parsedDebt;
      const pFeeStr = parsedPFee > 0 ? ` | Tiền phạt: ${parsedPFee.toLocaleString('vi-VN')} đ` : '';
      const debtStr = parsedDebt > 0 ? ` | Nợ cũ: ${parsedDebt.toLocaleString('vi-VN')} đ` : '';
      const totalDueStr = (parsedPFee > 0 && parsedDebt > 0) ? ` [Tổng nộp: ${studentTotalDue.toLocaleString('vi-VN')} đ]` : '';
      const penaltyStr =
        hasWritingSkill && row?.penaltyCopies && Number(row.penaltyCopies) > 0
          ? ` | Chép phạt: ${row.penaltyCopies} lần`
          : '';
      const qzStr = row?.quizletStatus || 'Đã học';

      // Medal emojis for top ranks if sorted by score
      let rankEmoji = `${idx + 1}.`;
      if (sortMode === 'score_desc') {
        if (idx === 0) rankEmoji = `🥇 Top 1.`;
        else if (idx === 1) rankEmoji = `🥈 Top 2.`;
        else if (idx === 2) rankEmoji = `🥉 Top 3.`;
        else rankEmoji = `#${idx + 1}.`;
      }

      text += `${rankEmoji} ${st.name} (${row?.status || 'Có mặt'}): ${scoresStr}${avgStr} | BTVN: ${hwStr}${pFeeStr}${debtStr}${totalDueStr} | Quizlet: ${qzStr}${penaltyStr}\n`;
      if (row?.feedback && row.feedback.trim() !== '') {
        text += `   💬 Nhận xét: ${row.feedback.trim()}\n`;
      }
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `❤️ Quý Phụ huynh vui lòng theo dõi và đôn đốc các con chuẩn bị bài kỹ cho buổi tiếp theo!\n`;
    text += `🏢 IELTS DƯƠNG VŨ - Hotline: 0798934698`;

    return text;
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    const text = generateSortedZaloText();
    navigator.clipboard.writeText(text);
    setCopiedStatus('text');
    setStatusMessage('Đã sao chép nội dung bảng điểm gửi Zalo thành công!');
    setTimeout(() => {
      setCopiedStatus(null);
      setStatusMessage(null);
    }, 3000);
  };

  // Download image as PNG
  const handleDownloadImage = async () => {
    if (!reportCardRef.current) return;
    try {
      setIsGeneratingImage(true);
      setStatusMessage('Đang kết xuất ảnh chất lượng cao HD...');

      // Small delay to ensure rendering is complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toPng(reportCardRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: theme === 'purple' ? '#1e1b4b' : theme === 'blue' ? '#0f172a' : '#ffffff',
        cacheBust: true,
      });

      const fileName = `BangDiem_${classGroup.name.replace(/\s+/g, '_')}_Buoi${sessionNumber}_${currentDate.replace(/\//g, '-')}_${sortMode === 'score_desc' ? 'XepHang' : 'DanhSach'}.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      setStatusMessage('Đã tải ảnh bảng điểm thành công!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Error generating image:', err);
      setStatusMessage('Có lỗi khi tạo ảnh. Đã chuyển sang chế độ sao chép tin nhắn Zalo.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImageToClipboard = async () => {
    if (!reportCardRef.current) return;
    try {
      setIsGeneratingImage(true);
      setStatusMessage('Đang sao chép ảnh vào bộ nhớ tạm (Clipboard)...');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const blob = await toBlob(reportCardRef.current, {
        pixelRatio: 2.5,
        backgroundColor: theme === 'purple' ? '#1e1b4b' : theme === 'blue' ? '#0f172a' : '#ffffff',
        cacheBust: true,
      });

      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedStatus('image');
        setStatusMessage('Đã sao chép ảnh! Bạn có thể nhấn Ctrl+V để dán trực tiếp vào Zalo/Messenger.');
        setTimeout(() => {
          setCopiedStatus(null);
          setStatusMessage(null);
        }, 4000);
      } else {
        // Fallback to download if ClipboardItem not supported
        handleDownloadImage();
      }
    } catch (err) {
      console.error('Clipboard copy error, fallback to download:', err);
      handleDownloadImage();
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (!isOpen) return null;

  // Theme Styles
  const themeConfig = {
    purple: {
      cardBg: 'bg-gradient-to-b from-slate-900 via-indigo-950 to-purple-950 text-white',
      headerBg: 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white border-purple-500/30',
      accentColor: 'text-amber-300',
      tableHeaderBg: 'bg-purple-900/60 text-purple-200 border-purple-800/60',
      rowEvenBg: 'bg-white/[0.03]',
      rowHoverBg: 'hover:bg-purple-900/20',
      badgeBg: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
      statCardBg: 'bg-white/10 backdrop-blur-xs border-white/10 text-white',
      scoreHighlight: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
    },
    blue: {
      cardBg: 'bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white',
      headerBg: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white border-blue-500/30',
      accentColor: 'text-cyan-300',
      tableHeaderBg: 'bg-blue-900/60 text-blue-200 border-blue-800/60',
      rowEvenBg: 'bg-white/[0.03]',
      rowHoverBg: 'hover:bg-blue-900/20',
      badgeBg: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
      statCardBg: 'bg-white/10 backdrop-blur-xs border-white/10 text-white',
      scoreHighlight: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40',
    },
    slate: {
      cardBg: 'bg-white text-slate-800 border-slate-200',
      headerBg: 'bg-gradient-to-r from-slate-800 to-purple-900 text-white border-slate-700',
      accentColor: 'text-amber-400',
      tableHeaderBg: 'bg-slate-100 text-slate-700 border-slate-200',
      rowEvenBg: 'bg-slate-50/70',
      rowHoverBg: 'hover:bg-purple-50/50',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      statCardBg: 'bg-slate-50 border-slate-200 text-slate-800',
      scoreHighlight: 'bg-amber-100 text-amber-800 border-amber-300',
    },
  }[theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Xuất Bảng Điểm Buổi Học Gửi Phụ Huynh</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                  {sortMode === 'score_desc' ? 'Top Ranking Điểm' : 'Danh Sách Lớp'}
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5 font-medium">
                Lớp <strong className="text-white">{classGroup.name}</strong> • Buổi {sessionNumber} ({currentDate}) • {classStudents.length} học viên
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Filter Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left: Sorting options */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1">
              <ArrowDownUp className="w-4 h-4 text-purple-700" />
              <span>Sắp xếp:</span>
            </div>

            <button
              type="button"
              onClick={() => setSortMode('score_desc')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                sortMode === 'score_desc'
                  ? 'bg-purple-700 text-white shadow-purple-200 ring-2 ring-purple-600/30'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>Điểm cao xuống thấp (Top)</span>
            </button>

            <button
              type="button"
              onClick={() => setSortMode('default')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                sortMode === 'default'
                  ? 'bg-purple-700 text-white shadow-purple-200 ring-2 ring-purple-600/30'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Danh sách lớp mặc định</span>
            </button>

            <button
              type="button"
              onClick={() => setSortMode('name_asc')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                sortMode === 'name_asc'
                  ? 'bg-purple-700 text-white shadow-purple-200 ring-2 ring-purple-600/30'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Tên A → Z</span>
            </button>
          </div>

          {/* Right: Theme Selector and View Mode */}
          <div className="flex items-center gap-2">
            {activeTab === 'image_preview' && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-purple-600" /> Mẫu:
                </span>
                <button
                  type="button"
                  onClick={() => setTheme('purple')}
                  className={`w-6 h-6 rounded-lg bg-purple-900 border transition-all ${
                    theme === 'purple' ? 'ring-2 ring-purple-600 scale-110 border-white' : 'border-slate-300 opacity-70'
                  }`}
                  title="Theme Tím IDV Hoàng Gia"
                />
                <button
                  type="button"
                  onClick={() => setTheme('blue')}
                  className={`w-6 h-6 rounded-lg bg-blue-900 border transition-all ${
                    theme === 'blue' ? 'ring-2 ring-blue-600 scale-110 border-white' : 'border-slate-300 opacity-70'
                  }`}
                  title="Theme Xanh Chuyên Nghiệp"
                />
                <button
                  type="button"
                  onClick={() => setTheme('slate')}
                  className={`w-6 h-6 rounded-lg bg-slate-100 border transition-all ${
                    theme === 'slate' ? 'ring-2 ring-purple-600 scale-110 border-slate-400' : 'border-slate-300 opacity-70'
                  }`}
                  title="Theme Trắng Tối Giản"
                />
              </div>
            )}

            {/* View Switcher: Image Card vs Text Zalo */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('image_preview')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'image_preview'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-700" />
                <span>Ảnh Đồ Họa</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text_zalo')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'text_zalo'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-700" />
                <span>Tin Nhắn Zalo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status / Toast alert inside modal */}
        {statusMessage && (
          <div className="bg-purple-900 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-purple-200 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body: Scrollable Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          {activeTab === 'image_preview' ? (
            <div className="max-w-4xl mx-auto space-y-4">
              
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                  Xem trước ảnh chuẩn bị tải về (Bấm nút &quot;Tải ảnh&quot; hoặc &quot;Sao chép ảnh&quot; để gửi Zalo)
                </span>
                <span className="font-bold text-purple-800">
                  {sortMode === 'score_desc' ? '🔥 Đang xếp hạng điểm từ Cao → Thấp' : '📌 Đang xếp theo thứ tự lớp'}
                </span>
              </div>

              {/* THE IMAGE REPORT CARD (CAPTURED WITH HTML-TO-IMAGE) */}
              <div
                ref={reportCardRef}
                id="idv-class-score-card"
                className={`p-6 sm:p-8 rounded-3xl shadow-xl border overflow-hidden ${themeConfig.cardBg}`}
                style={{ minWidth: '700px' }}
              >
                {/* Brand Header */}
                <div className="flex items-center justify-between pb-5 border-b border-white/15">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg border border-amber-300">
                      DV
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-amber-400">
                        IELTS DƯƠNG VŨ
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        BẢNG ĐIỂM BUỔI HỌC SỐ {sessionNumber}
                        <Sparkles className="w-5 h-5 text-amber-300 inline" />
                      </h2>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-block px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-xs font-black text-amber-300">
                      IELTS DƯƠNG VŨ
                    </div>
                    <div className="text-[11px] text-white/70 mt-1 font-medium">
                      Ngày: <strong className="text-white">{currentDate}</strong>
                    </div>
                  </div>
                </div>

                {/* Session Meta Info Grid (3 columns - No Teacher, No Lesson Topic) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
                  <div className={`p-3.5 rounded-2xl border ${themeConfig.statCardBg}`}>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Lớp học
                    </div>
                    <div className="text-sm sm:text-base font-black mt-0.5 truncate text-white">
                      {classGroup.name}
                    </div>
                    <div className="text-[10px] text-amber-300 font-semibold truncate">
                      {classGroup.courseName || 'IELTS Preparation'}
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-2xl border ${themeConfig.statCardBg}`}>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 flex items-center gap-1">
                      <Award className="w-3 h-3" /> Điểm TB Cả Lớp
                    </div>
                    <div className="text-sm sm:text-base font-black mt-0.5 text-amber-300">
                      {classStats.averageScore} {overallScoreType === 'ielts_band' ? 'Band' : 'Điểm'}
                    </div>
                    <div className="text-[10px] opacity-75">
                      Cao nhất: <strong className="text-white">{classStats.highestScore}</strong>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-2xl border ${themeConfig.statCardBg}`}>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Sĩ số buổi học
                    </div>
                    <div className="text-sm sm:text-base font-black mt-0.5 text-emerald-400">
                      {classStats.presentCount}/{classStats.total} Học viên
                    </div>
                    <div className="text-[10px] opacity-75">
                      {classStats.absentCount > 0 ? `Vắng: ${classStats.absentCount}` : 'Đầy đủ 100%'}
                    </div>
                  </div>
                </div>

                {/* Tested Skills Strip (No Lesson Topic) */}
                <div className="p-3 rounded-2xl bg-white/[0.07] border border-white/10 mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold opacity-75">Kỹ năng kiểm tra:</span>
                    {selectedSkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-200 font-bold text-[11px] border border-purple-400/30"
                      >
                        {sk} {skillTotalQuestions?.[sk] ? `(${skillTotalQuestions[sk]} câu)` : ''}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] font-bold text-amber-300">
                    IELTS DƯƠNG VŨ
                  </div>
                </div>

                {/* Penalty Banner: Tổng tiền nộp phạt tự động cộng + Ghi chú to ở phiếu gửi phụ huynh ngay cạnh ô nộp phạt */}
                {hasAnyPenalty && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-2 border-amber-400/80 mb-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-400/30 flex items-center justify-center text-amber-300">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                          Tổng số tiền nộp phạt buổi học:
                        </span>
                        <strong className="text-lg font-black text-amber-200 font-mono">
                          {formattedTotalPenalty}
                        </strong>
                      </div>
                    </div>

                    {/* Ghi chú to ở phiếu gửi phụ huynh ngay cạnh ô nộp phạt */}
                    <div className="p-2.5 bg-rose-600 text-white font-extrabold text-xs rounded-xl border-2 border-rose-300 shadow-md flex items-center gap-2 leading-snug">
                      <span className="text-base shrink-0">⚠️</span>
                      <span>
                        LƯU Ý QUAN TRỌNG: PH/HS chuyển khoản nộp phạt vào STK cá nhân của trợ lý, không chuyển khoản tiền nộp phạt vào STK công ty.
                      </span>
                    </div>
                  </div>
                )}

                {/* TOP 3 PODIUM / HONORS (SHOW ONLY WHEN SORTING BY SCORE) */}
                {sortMode === 'score_desc' && sortedStudents.length >= 2 && (
                  <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-400/20">
                    <div className="text-xs font-black uppercase tracking-wider text-amber-300 mb-2.5 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Vinh Danh Học Sinh Có Thành Tích Cao Nhất Buổi Học:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {sortedStudents.slice(0, 3).map((topSt, rankIdx) => {
                        const row = studentRows[topSt.id];
                        const avg = calculateStudentAverage(row);
                        const medals = ['🥇 Top 1', '🥈 Top 2', '🥉 Top 3'];
                        const medalColors = [
                          'bg-amber-400/20 text-amber-300 border-amber-400/40',
                          'bg-slate-300/20 text-slate-200 border-slate-300/40',
                          'bg-amber-700/20 text-amber-200 border-amber-600/40',
                        ];

                        return (
                          <div
                            key={topSt.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between ${medalColors[rankIdx]}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black">{medals[rankIdx]}</span>
                              <div className="truncate">
                                <div className="font-bold text-xs text-white truncate">{topSt.name}</div>
                                <div className="text-[10px] opacity-75">Mã HV: {topSt.studentCode || topSt.id}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-black text-amber-300">
                                {avg !== '-' ? avg : 'Tốt'}
                              </div>
                              <div className="text-[9px] opacity-75">{overallScoreType === 'ielts_band' ? 'Band' : 'ĐTB'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Score Details Table */}
                <div className="rounded-2xl border border-white/10 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`${themeConfig.tableHeaderBg} border-b text-[11px] font-black uppercase tracking-wider`}>
                        <th className="py-2.5 px-3 w-12 text-center">Hạng/STT</th>
                        <th className="py-2.5 px-3 min-w-[140px]">Học Viên</th>
                        <th className="py-2.5 px-2 text-center w-20">Trạng Thái</th>
                        {selectedSkills.map((sk) => (
                          <th key={sk} className="py-2.5 px-2 text-center min-w-[70px]">
                            <div className="flex flex-col items-center">
                              <span>{sk}</span>
                              {skillTotalQuestions?.[sk] && (
                                <span className="text-[9px] font-bold text-amber-300 opacity-90 normal-case">
                                  ({skillTotalQuestions[sk]} câu)
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                        {enableOverallScore && (
                          <th className="py-2.5 px-3 text-center w-24 bg-amber-400/10 text-amber-300">
                            {overallScoreType === 'ielts_band' ? 'Band IELTS' : 'Điểm TB'}
                          </th>
                        )}
                        {selectedHomeworkItems && selectedHomeworkItems.length > 0 ? (
                          <th
                            colSpan={selectedHomeworkItems.length}
                            className="py-2.5 px-2 text-center bg-amber-400/20 text-amber-200 font-extrabold text-xs border-b border-white/10"
                          >
                            BTVN (Đề mục {selectedHomeworkItems.length})
                          </th>
                        ) : (
                          <th className="py-2.5 px-2 text-center w-20">BTVN</th>
                        )}
                        <th className="py-2.5 px-2 text-center min-w-[100px] bg-amber-400/10 text-amber-300">Tiền Phạt</th>
                        {totalCalculatedPrevDebt > 0 && (
                          <th className="py-2.5 px-2 text-center min-w-[100px] bg-rose-400/15 text-rose-300">Nợ Cũ</th>
                        )}
                        <th className="py-2.5 px-2 text-center w-20">Quizlet</th>
                        {hasWritingSkill && (
                          <th className="py-2.5 px-2 text-center w-20">Chép Phạt</th>
                        )}
                        <th className="py-2.5 px-3 min-w-[130px]">Nhận Xét</th>
                      </tr>

                      {/* SECOND HEADER ROW FOR BTVN SUB-ITEMS */}
                      {selectedHomeworkItems && selectedHomeworkItems.length > 0 && (
                        <tr className={`${themeConfig.tableHeaderBg} border-b border-white/10 text-[11px] font-extrabold tracking-wider`}>
                          {selectedHomeworkItems.map((item) => (
                            <th key={item} className="py-2 px-2 text-center min-w-[55px] text-amber-200">
                              {item}
                            </th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {sortedStudents.map((st, idx) => {
                        const row = studentRows[st.id];
                        const isAbsent = row?.status === 'Vắng có phép' || row?.status === 'Vắng không phép';
                        const avg = calculateStudentAverage(row);

                        let rankBadge = `${idx + 1}`;
                        let rankColor = 'text-white/70 font-bold';
                        if (sortMode === 'score_desc') {
                          if (idx === 0) {
                            rankBadge = '🥇 1';
                            rankColor = 'text-amber-400 font-black text-sm';
                          } else if (idx === 1) {
                            rankBadge = '🥈 2';
                            rankColor = 'text-slate-300 font-black text-sm';
                          } else if (idx === 2) {
                            rankBadge = '🥉 3';
                            rankColor = 'text-amber-600 font-black text-sm';
                          }
                        }

                        const pFee = row?.penaltyFee || totalPenaltyAmount || '0 đ';
                        const hasPenaltyFee = pFee && pFee !== '0 đ' && pFee !== '0' && pFee !== '0đ';
                        const pBank = row?.penaltyBankAccount || penaltyBankAccount || '-';

                        return (
                          <tr
                            key={st.id}
                            className={`transition-colors ${idx % 2 === 1 ? themeConfig.rowEvenBg : ''} ${themeConfig.rowHoverBg}`}
                          >
                            <td className={`py-2 px-3 text-center ${rankColor}`}>{rankBadge}</td>
                            
                            <td className="py-2 px-3 font-bold text-white">
                              <div className="truncate">{st.name}</div>
                              {st.phone && (
                                <div className="text-[10px] text-white/50 font-mono">{st.phone}</div>
                              )}
                            </td>

                            <td className="py-2 px-2 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isAbsent
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {row?.status || 'Có mặt'}
                              </span>
                            </td>

                            {selectedSkills.map((sk) => {
                              const val = row?.skillScores?.[sk];
                              const totalQ = skillTotalQuestions?.[sk];
                              return (
                                <td key={sk} className="py-2 px-2 text-center font-bold text-white">
                                  {val ? (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/10 font-mono text-xs">
                                      <span>{val}</span>
                                      {totalQ && (
                                        <span className="text-[10px] text-amber-300 font-semibold">/{totalQ}</span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-white/30">-</span>
                                  )}
                                </td>
                              );
                            })}

                            {enableOverallScore && (
                              <td className="py-2 px-3 text-center bg-amber-400/5">
                                {avg !== '-' ? (
                                  <span className="inline-block px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40 font-black text-xs font-mono">
                                    {avg}
                                  </span>
                                ) : (
                                  <span className="text-white/30">-</span>
                                )}
                              </td>
                            )}

                            {/* BTVN */}
                            {selectedHomeworkItems && selectedHomeworkItems.length > 0 ? (
                              selectedHomeworkItems.map((item) => {
                                const isMissing = row?.missingHomeworkItems?.includes(item);
                                return (
                                  <td key={item} className="py-2 px-2 text-center">
                                    {isMissing ? (
                                      <span className="inline-flex items-center justify-center font-black text-sm text-rose-400 font-mono tracking-tighter">
                                        (✘)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-600 text-white font-black text-xs shadow-2xs border border-emerald-500">
                                        ✓
                                      </span>
                                    )}
                                  </td>
                                );
                              })
                            ) : (
                              <td className="py-2 px-2 text-center">
                                {row?.homeworkStatus === 'Chưa làm' || row?.homeworkStatus === 'Thiếu' ? (
                                  <span className="inline-flex items-center justify-center font-black text-sm text-rose-400 font-mono tracking-tighter">
                                    (✘)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-600 text-white font-black text-xs shadow-2xs border border-emerald-500">
                                    ✓
                                  </span>
                                )}
                              </td>
                            )}

                            {/* CỘT TỔNG TIỀN PHẠT NGAY SAU CỘT BTVN */}
                            <td className="py-2 px-2 text-center">
                              {hasPenaltyFee ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400/25 text-amber-200 border border-amber-400/50 font-mono">
                                    {parsePenaltyAmount(pFee).toLocaleString('vi-VN')} đ
                                  </span>
                                  <span className="text-[9px] text-rose-300 font-bold whitespace-nowrap">
                                    (CK STK Trợ lý)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-white/40 text-[10px] font-mono">0 đ</span>
                              )}
                            </td>

                            {/* CỘT NỢ CÁC BUỔI TRƯỚC (NẾU CÓ NỢ) */}
                            {totalCalculatedPrevDebt > 0 && (
                              <td className="py-2 px-2 text-center">
                                {parsePenaltyAmount(row?.previousDebt) > 0 ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/25 text-rose-200 border border-rose-400/40 font-mono">
                                    {parsePenaltyAmount(row?.previousDebt).toLocaleString('vi-VN')} đ
                                  </span>
                                ) : (
                                  <span className="text-white/30 text-[10px] font-mono">-</span>
                                )}
                              </td>
                            )}

                            <td className="py-2 px-2 text-center">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  row?.quizletStatus === 'Chưa học'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {row?.quizletStatus || 'Đã học'}
                              </span>
                            </td>

                            {hasWritingSkill && (
                              <td className="py-2 px-2 text-center font-mono font-bold">
                                {row?.penaltyCopies && Number(row.penaltyCopies) > 0 ? (
                                  <span className="text-rose-400 font-bold bg-rose-500/20 px-1.5 py-0.5 rounded">
                                    {row.penaltyCopies} lần
                                  </span>
                                ) : (
                                  <span className="text-white/30">-</span>
                                )}
                              </td>
                            )}

                            <td className="py-2 px-3 text-[11px] text-white/80 italic max-w-[180px] truncate">
                              {row?.feedback && row.feedback.trim() !== '' ? row.feedback.trim() : (row?.note && row.note.trim() !== '' ? row.note.trim() : '-')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {hasAnyReceivable && (
                      <tfoot className="border-t-2 border-amber-400/50 bg-amber-500/15 text-white">
                        <tr>
                          <td
                            colSpan={selectedSkills.length + (enableOverallScore ? 4 : 3)}
                            className="py-2.5 px-3 text-right uppercase font-black text-amber-300 text-xs tracking-wide"
                          >
                            {totalCalculatedPrevDebt > 0 ? 'TỔNG CẦN THU (PHẠT + NỢ CŨ):' : 'TỔNG TIỀN NỘP PHẠT BUỔI HỌC:'}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-black text-amber-200 text-xs bg-amber-500/25 border-x border-amber-400/30">
                            {formattedTotalPenalty}
                          </td>
                          {totalCalculatedPrevDebt > 0 && (
                            <td className="py-2.5 px-2 text-center font-mono font-black text-rose-200 text-xs bg-rose-500/25 border-r border-rose-400/30">
                              {formattedTotalPrevDebt}
                            </td>
                          )}
                          <td colSpan={hasWritingSkill ? 3 : 2} className="py-2.5 px-3 text-left">
                            <span className="text-rose-300 font-black text-[11px] flex items-center gap-1.5 leading-snug">
                              <span className="text-sm shrink-0">⚠️</span>
                              <span>PH/HS chuyển khoản nộp phạt/nợ vào STK cá nhân của trợ lý, không chuyển khoản tiền nộp phạt vào STK công ty.</span>
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Footer of report card */}
                <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-[11px] text-white/80 space-y-1">
                    <p className="font-semibold text-amber-300">
                      ❤️ Cảm ơn Quý Phụ huynh đã luôn đồng hành cùng IELTS DƯƠNG VŨ!
                    </p>
                    <p className="text-white/60">
                      IELTS DƯƠNG VŨ • Hotline: 0798934698
                    </p>
                    {hasAnyReceivable && (
                      <p className="text-rose-300 font-extrabold text-[11px] flex items-center gap-1.5">
                        <span className="text-xs shrink-0">⚠️</span>
                        <span>Lưu ý quan trọng: PH/HS chuyển khoản nộp phạt/nợ vào STK cá nhân của trợ lý, không chuyển khoản tiền nộp phạt vào STK công ty.</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right text-[10px] text-white/50 font-mono">
                    Thời gian xuất: {new Date().toLocaleTimeString('vi-VN')} {currentDate}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Zalo Text View */
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span>Nội dung tin nhắn Zalo đã được tự động định dạng &amp; sắp xếp:</span>
                <span className="text-purple-700 font-bold">
                  {sortMode === 'score_desc' ? '🏆 Điểm cao xuống thấp' : '📋 Thứ tự lớp'}
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 shadow-sm select-all">
                {generateSortedZaloText()}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            {activeTab === 'image_preview' ? (
              <span>💡 Mẹo: Nhấn <strong>&quot;Sao chép ảnh&quot;</strong> sau đó vào Zalo/Messenger nhấn <strong>Ctrl+V</strong> để gửi ngay.</span>
            ) : (
              <span>💡 Mẹo: Nhấn <strong>&quot;Sao chép text&quot;</strong> để dán trực tiếp vào nhóm Zalo lớp.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Đóng
            </button>

            {/* Copy Zalo Text Button */}
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors shadow-2xs"
            >
              {copiedStatus === 'text' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Đã sao chép text!</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-purple-700" />
                  <span>Sao chép text Zalo</span>
                </>
              )}
            </button>

            {/* Copy Image Button */}
            <button
              type="button"
              disabled={isGeneratingImage}
              onClick={handleCopyImageToClipboard}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors shadow-2xs disabled:opacity-50"
            >
              {copiedStatus === 'image' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Đã chép ảnh vào Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-indigo-700" />
                  <span>Sao chép ảnh (Ctrl+V)</span>
                </>
              )}
            </button>

            {/* Download Image PNG Button */}
            <button
              type="button"
              disabled={isGeneratingImage}
              onClick={handleDownloadImage}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 rounded-xl shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>{isGeneratingImage ? 'Đang xuất ảnh...' : 'Lưu ảnh gửi Phụ huynh'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
