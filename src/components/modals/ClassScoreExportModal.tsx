import React, { useState, useRef, useMemo, useEffect } from 'react';
import { toPng, toBlob } from 'html-to-image';
import QRCode from 'qrcode';
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
  CreditCard,
  Type,
  ZoomIn,
  ZoomOut,
  Sliders,
  Edit2,
  Info,
  QrCode,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { ClassGroup, Student } from '../../types';
import { StudentRowState } from '../modules/ClassDetailView';
import {
  ASSISTANT_PENALTY_BANK,
  COMPANY_TUITION_BANK,
  DEFAULT_PENALTY_BANK_STR,
  getPenaltyVietQrUrl,
  getPaymentSeparationNoticeText,
} from '../../utils/paymentConfig';

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
type FontSizePreset = 'compact' | 'normal' | 'large' | 'xl';
type BankFontSizePreset = 'normal' | 'large' | 'xl' | '2xl';

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
  const [copiedStatus, setCopiedStatus] = useState<'text' | 'image' | 'qr' | 'stk' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Flexible font size controls for overall card and penalty & debt account
  const [fontSizePreset, setFontSizePreset] = useState<FontSizePreset>('normal');
  const [bankFontSizePreset, setBankFontSizePreset] = useState<BankFontSizePreset>('large');
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [qrSize, setQrSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [qrImageError, setQrImageError] = useState(false);

  // Bank account for penalty and debt collection (Assistant Dang Kim Anh - Techcombank)
  const [currentPenaltyBank, setCurrentPenaltyBank] = useState<string>(() => {
    return penaltyBankAccount || localStorage.getItem('idv_penalty_bank_account') || DEFAULT_PENALTY_BANK_STR;
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (penaltyBankAccount) {
      setCurrentPenaltyBank(penaltyBankAccount);
    }
  }, [penaltyBankAccount]);

  // Pre-generate QR data URI to eliminate canvas tainting and CORS issues during clipboard copy
  useEffect(() => {
    let isMounted = true;
    const syntax = `${classGroup.name} nop phat B${sessionNumber}`;
    const vietQrSrc = getPenaltyVietQrUrl(undefined, syntax, 'compact2');

    // First attempt to convert the VietQR image to Base64 dataURL
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 400;
        canvas.height = img.naturalHeight || 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUri = canvas.toDataURL('image/png');
          if (isMounted) {
            setQrDataUrl(dataUri);
            return;
          }
        }
      } catch {
        // Fallback to local QR code generation if canvas is tainted
      }
      generateFallbackQr();
    };
    img.onerror = () => {
      generateFallbackQr();
    };
    img.src = vietQrSrc;

    function generateFallbackQr() {
      // Local clean QR code containing bank transfer info
      const rawBankText = `STK: 174293666666\nChu TK: DANG KIM ANH\nNgan hang: Techcombank\nNoi dung: ${classGroup.name} nop phat B${sessionNumber}`;
      QRCode.toDataURL(rawBankText, {
        margin: 1,
        width: 300,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((url) => {
          if (isMounted) setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('Error generating fallback QR:', err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [classGroup.name, sessionNumber]);

  const handleBankChange = (newVal: string) => {
    setCurrentPenaltyBank(newVal);
    localStorage.setItem('idv_penalty_bank_account', newVal);
  };

  const handleResetToDefaultAssistantBank = () => {
    setCurrentPenaltyBank(DEFAULT_PENALTY_BANK_STR);
    localStorage.setItem('idv_penalty_bank_account', DEFAULT_PENALTY_BANK_STR);
    setStatusMessage('Đã đặt lại STK nộp phạt trợ lý: 174293666666 - Techcombank (Đặng Kim Anh)');
    setTimeout(() => setStatusMessage(null), 3000);
  };

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

  // Active list of BTVN items to display in the image export and report
  const [activeHomeworkItems, setActiveHomeworkItems] = useState<string[]>(() => {
    if (selectedHomeworkItems && selectedHomeworkItems.length > 0) {
      return selectedHomeworkItems;
    }
    try {
      const saved = localStorage.getItem('idv_homework_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return ['Nghe', 'Nói', 'Đọc', 'Viết', 'Chép phạt', 'Chữa bài'];
  });

  // Keep active items in sync when selectedHomeworkItems prop or modal opening changes
  useEffect(() => {
    if (selectedHomeworkItems && selectedHomeworkItems.length > 0) {
      setActiveHomeworkItems(selectedHomeworkItems);
    } else {
      try {
        const saved = localStorage.getItem('idv_homework_items');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActiveHomeworkItems(parsed);
          }
        }
      } catch (e) {}
    }
  }, [selectedHomeworkItems, isOpen]);

  // All available suggested items (standard + current selection + any missing item recorded in student rows)
  const allAvailableHomeworkItems = useMemo(() => {
    const list = ['Nghe', 'Nói', 'Đọc', 'Viết', 'Từ vựng', 'Ngữ pháp', 'Chép phạt', 'Chữa bài', 'Luyện đề'];
    const set = new Set<string>(list);
    if (selectedHomeworkItems) {
      selectedHomeworkItems.forEach((i) => set.add(i));
    }
    activeHomeworkItems.forEach((i) => set.add(i));
    Object.values(studentRows).forEach((row: StudentRowState) => {
      if (row?.missingHomeworkItems) {
        row.missingHomeworkItems.forEach((i) => set.add(i));
      }
    });
    return Array.from(set);
  }, [selectedHomeworkItems, activeHomeworkItems, studentRows]);

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
  const hasAnyDebt = totalCalculatedPrevDebt > 0;
  const hasAnyReceivable = grandTotalReceivable > 0;
  const formattedTotalPenalty = totalCalculatedPenalty > 0 ? `${totalCalculatedPenalty.toLocaleString('vi-VN')} đ` : '0 đ';
  const formattedTotalPrevDebt = totalCalculatedPrevDebt > 0 ? `${totalCalculatedPrevDebt.toLocaleString('vi-VN')} đ` : '0 đ';
  const formattedGrandTotal = grandTotalReceivable > 0 ? `${grandTotalReceivable.toLocaleString('vi-VN')} đ` : '0 đ';

  // Count students with penalty or debt
  const countPenaltyStudents = useMemo(() => {
    return classStudents.filter((st) => parsePenaltyAmount(studentRows[st.id]?.penaltyFee) > 0).length;
  }, [classStudents, studentRows]);

  const countDebtStudents = useMemo(() => {
    return classStudents.filter((st) => parsePenaltyAmount(studentRows[st.id]?.previousDebt) > 0).length;
  }, [classStudents, studentRows]);

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

  // Font Size Styles Mapping
  const fontSizeConfig = {
    compact: {
      tableText: 'text-[10px]',
      tableHeader: 'text-[10px] py-1.5 px-2',
      tableCell: 'py-1 px-1.5',
      nameText: 'text-xs',
      badgeText: 'text-[9px] px-1.5 py-0.5',
      headerTitle: 'text-base',
      subText: 'text-[10px]',
    },
    normal: {
      tableText: 'text-xs',
      tableHeader: 'text-[11px] py-2.5 px-2.5',
      tableCell: 'py-2 px-2.5',
      nameText: 'text-xs sm:text-sm',
      badgeText: 'text-[10px] px-2 py-0.5',
      headerTitle: 'text-lg',
      subText: 'text-xs',
    },
    large: {
      tableText: 'text-sm',
      tableHeader: 'text-xs py-3 px-3',
      tableCell: 'py-2.5 px-3',
      nameText: 'text-sm sm:text-base',
      badgeText: 'text-xs px-2.5 py-1',
      headerTitle: 'text-xl',
      subText: 'text-sm',
    },
    xl: {
      tableText: 'text-base',
      tableHeader: 'text-sm py-3.5 px-3.5',
      tableCell: 'py-3 px-3.5',
      nameText: 'text-base sm:text-lg',
      badgeText: 'text-sm px-3 py-1',
      headerTitle: 'text-2xl',
      subText: 'text-base',
    },
  }[fontSizePreset];

  // Bank & Penalty Info Font Size Mapping
  const bankFontConfig = {
    normal: {
      accountText: 'text-sm font-bold',
      amountText: 'text-base font-black',
      label: 'text-[11px] font-bold',
      note: 'text-xs leading-relaxed',
      boxPadding: 'p-3',
    },
    large: {
      accountText: 'text-base sm:text-lg font-black tracking-wide',
      amountText: 'text-lg sm:text-xl font-black font-mono',
      label: 'text-xs font-black uppercase tracking-wider',
      note: 'text-xs sm:text-sm font-bold leading-relaxed',
      boxPadding: 'p-4',
    },
    xl: {
      accountText: 'text-lg sm:text-xl font-black tracking-wide font-mono',
      amountText: 'text-xl sm:text-2xl font-black font-mono text-amber-300',
      label: 'text-sm font-black uppercase tracking-wider',
      note: 'text-sm font-extrabold leading-snug',
      boxPadding: 'p-4 sm:p-5',
    },
    '2xl': {
      accountText: 'text-xl sm:text-2xl font-black tracking-wider font-mono text-amber-300',
      amountText: 'text-2xl sm:text-3xl font-black font-mono text-amber-200',
      label: 'text-base font-black uppercase tracking-widest',
      note: 'text-sm sm:text-base font-black leading-snug',
      boxPadding: 'p-5 sm:p-6',
    },
  }[bankFontSizePreset];

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
    if (activeHomeworkItems.length > 0) {
      text += `✍️ Đề mục BTVN kiểm tra (${activeHomeworkItems.length}): ${activeHomeworkItems.join(', ')}\n`;
    }
    
    text += `📊 Thống kê: Sĩ số ${classStats.total} | Có mặt ${classStats.presentCount} | Điểm TB: ${classStats.averageScore} | Cao nhất: ${classStats.highestScore}\n`;
    text += `📌 Chế độ xem: ${sortLabel}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    sortedStudents.forEach((st, idx) => {
      const row = studentRows[st.id];
      const isAbsent = row?.status === 'Vắng có phép' || row?.status === 'Vắng không phép';
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
      
      const activeItems = activeHomeworkItems;
      const activeMissing = (row?.missingHomeworkItems || []).filter((i) => activeItems.includes(i));
      let hwStr = 'Đã làm';
      if (isAbsent) {
        hwStr = 'Vắng';
      } else if (activeItems.length === 0) {
        hwStr = '-';
      } else if (row?.homeworkStatus === 'Chưa làm' || activeMissing.length >= activeItems.length) {
        hwStr = `Chưa làm (${activeItems.join(', ')})`;
      } else if (activeMissing.length > 0) {
        const doneItems = activeItems.filter((i) => !activeMissing.includes(i));
        hwStr = `Thiếu [${activeMissing.join(', ')}]${doneItems.length > 0 ? ` • Đã xong [${doneItems.join(', ')}]` : ''}`;
      } else {
        hwStr = `Đủ (${activeItems.join(', ')})`;
      }
      
      const parsedPFee = parsePenaltyAmount(row?.penaltyFee);
      const parsedDebt = parsePenaltyAmount(row?.previousDebt);
      const studentTotalDue = parsedPFee + parsedDebt;
      
      let pFeeStr = '';
      if (parsedPFee > 0 && parsedDebt > 0) {
        pFeeStr = ` | Phạt: ${parsedPFee.toLocaleString('vi-VN')}đ + Nợ cũ: ${parsedDebt.toLocaleString('vi-VN')}đ ➔ TỔNG NỘP: ${studentTotalDue.toLocaleString('vi-VN')}đ`;
      } else if (parsedPFee > 0) {
        pFeeStr = ` | Phạt: ${parsedPFee.toLocaleString('vi-VN')}đ`;
      } else if (parsedDebt > 0) {
        pFeeStr = ` | Nợ cũ: ${parsedDebt.toLocaleString('vi-VN')}đ`;
      }

      const penaltyCopiesStr =
        hasWritingSkill && row?.penaltyCopies && Number(row.penaltyCopies) > 0
          ? ` | Chép phạt: ${row.penaltyCopies} lần`
          : '';
      const qzStr = row?.quizletStatus || 'Đã học';

      // Medal emojis for top ranks if sorted by score
      let rankPrefix = `${idx + 1}.`;
      if (sortMode === 'score_desc') {
        if (idx === 0) rankPrefix = '🥇 1.';
        else if (idx === 1) rankPrefix = '🥈 2.';
        else if (idx === 2) rankPrefix = '🥉 3.';
      }

      const fb = row?.feedback && row.feedback.trim() !== '' ? row.feedback.trim() : (row?.note && row.note.trim() !== '' ? row.note.trim() : '');
      const fbStr = fb ? `\n   💬 Nhận xét: ${fb}` : '';

      text += `${rankPrefix} ${st.name} (${row?.status || 'Có mặt'}): ${scoresStr}${avgStr}${penaltyCopiesStr}${pFeeStr} | BTVN: ${hwStr} | Quizlet: ${qzStr}${fbStr}\n`;
    });

    if (hasAnyReceivable) {
      text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `⚠️ LƯU Ý QUAN TRỌNG:\n`;
      text += `   • Học phí khóa học: Chuyển khoản vào STK CÔNG TY (MB Bank).\n`;
      text += `   • Tiền phạt & nợ cũ: Chuyển khoản vào STK CÁ NHÂN TRỢ LÝ (Techcombank - 174293666666 - Đặng Kim Anh).\n`;
      text += `   (Xin Quý Phụ huynh/Học viên KHÔNG nộp tiền phạt vào STK công ty)\n`;
      text += `💳 THÔNG TIN NỘP PHẠT (STK TRỢ LÝ):\n`;
      text += `   • Số tài khoản: 174293666666\n`;
      text += `   • Ngân hàng: Techcombank\n`;
      text += `   • Chủ tài khoản: Đặng Kim Anh (Trợ lý lớp)\n`;
      text += `✍️ Cú pháp chuyển khoản: [Tên HS] + ${classGroup.name} - nộp phạt B${sessionNumber}\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📞 Hotline IELTS DƯƠNG VŨ: 0798934698\n`;
    text += `❤️ Cảm ơn Quý Phụ huynh đã luôn đồng hành cùng IELTS DƯƠNG VŨ!`;

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

      await new Promise((resolve) => setTimeout(resolve, 150));

      const dataUrl = await toPng(reportCardRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: theme === 'purple' ? '#1e1b4b' : theme === 'blue' ? '#0f172a' : '#ffffff',
        cacheBust: true,
        skipFonts: true,
      });

      const fileName = `BangDiem_${classGroup.name.replace(/\s+/g, '_')}_Buoi${sessionNumber}_${currentDate.replace(/\//g, '-')}_${sortMode === 'score_desc' ? 'XepHang' : 'DanhSach'}.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      setStatusMessage('✅ Đã tải ảnh bảng điểm thành công!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Error generating image:', err);
      setStatusMessage('Có lỗi khi tạo ảnh. Đã chuyển sang chế độ sao chép tin nhắn Zalo.');
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Copy Image to Clipboard with automatic fallback
  const handleCopyImageToClipboard = async () => {
    if (!reportCardRef.current) return;
    try {
      setIsGeneratingImage(true);
      setStatusMessage('Đang sao chép ảnh vào bộ nhớ tạm (Clipboard)...');

      await new Promise((resolve) => setTimeout(resolve, 150));

      const element = reportCardRef.current;
      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: theme === 'purple' ? '#1e1b4b' : theme === 'blue' ? '#0f172a' : '#ffffff',
        cacheBust: true,
        skipFonts: true,
      });

      // Convert dataURI to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopiedStatus('image');
          setStatusMessage('✅ Đã sao chép ảnh! Bạn có thể nhấn Ctrl+V để dán trực tiếp vào Zalo/Messenger.');
          setTimeout(() => {
            setCopiedStatus(null);
            setStatusMessage(null);
          }, 4000);
          return;
        } catch (clipboardErr) {
          console.warn('Direct clipboard write failed, attempting fallback download:', clipboardErr);
        }
      }

      // Fallback: Download file directly if browser restricts clipboard write permissions
      const fileName = `BangDiem_${classGroup.name.replace(/\s+/g, '_')}_Buoi${sessionNumber}_${currentDate.replace(/\//g, '-')}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      setStatusMessage('✅ Đã tải ảnh về máy (trình duyệt chặn ghi trực tiếp vào clipboard). Bạn có thể gửi file ảnh này qua Zalo.');
      setTimeout(() => setStatusMessage(null), 4000);
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
      tableHeaderBg: 'bg-purple-900/70 text-purple-100 border-purple-800/70',
      rowEvenBg: 'bg-white/[0.04]',
      rowHoverBg: 'hover:bg-purple-900/30',
      badgeBg: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
      statCardBg: 'bg-white/10 backdrop-blur-xs border-white/10 text-white',
      scoreHighlight: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
      bankBoxBg: 'bg-gradient-to-br from-amber-500/15 via-orange-950/40 to-purple-950/60 border-2 border-amber-400/70',
      bankText: 'text-amber-200',
    },
    blue: {
      cardBg: 'bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white',
      headerBg: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white border-blue-500/30',
      accentColor: 'text-cyan-300',
      tableHeaderBg: 'bg-blue-900/70 text-blue-100 border-blue-800/70',
      rowEvenBg: 'bg-white/[0.04]',
      rowHoverBg: 'hover:bg-blue-900/30',
      badgeBg: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
      statCardBg: 'bg-white/10 backdrop-blur-xs border-white/10 text-white',
      scoreHighlight: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40',
      bankBoxBg: 'bg-gradient-to-br from-cyan-500/15 via-blue-950/40 to-slate-950/60 border-2 border-cyan-400/70',
      bankText: 'text-cyan-200',
    },
    slate: {
      cardBg: 'bg-white text-slate-800 border-slate-200',
      headerBg: 'bg-gradient-to-r from-slate-800 to-purple-900 text-white border-slate-700',
      accentColor: 'text-amber-400',
      tableHeaderBg: 'bg-slate-100 text-slate-800 border-slate-300',
      rowEvenBg: 'bg-slate-50/80',
      rowHoverBg: 'hover:bg-purple-50/60',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      statCardBg: 'bg-slate-50 border-slate-200 text-slate-800',
      scoreHighlight: 'bg-amber-100 text-amber-800 border-amber-300',
      bankBoxBg: 'bg-amber-50/90 border-2 border-amber-400 text-slate-900 shadow-sm',
      bankText: 'text-amber-950',
    },
  }[theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner shrink-0">
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
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Filter Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left: Sorting & Mode */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1">
              <ArrowDownUp className="w-4 h-4 text-purple-700" />
              <span>Sắp xếp:</span>
            </div>

            <button
              type="button"
              onClick={() => setSortMode('score_desc')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                sortMode === 'score_desc'
                  ? 'bg-purple-700 text-white shadow-purple-200 ring-2 ring-purple-600/30'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>Điểm cao xuống thấp</span>
            </button>

            <button
              type="button"
              onClick={() => setSortMode('default')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                sortMode === 'default'
                  ? 'bg-purple-700 text-white shadow-purple-200 ring-2 ring-purple-600/30'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Danh sách gốc</span>
            </button>

            <button
              type="button"
              onClick={() => setSortMode('name_asc')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                sortMode === 'name_asc'
                  ? 'bg-purple-700 text-white shadow-purple-200 ring-2 ring-purple-600/30'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Tên A → Z</span>
            </button>
          </div>

          {/* Right: Theme & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'image_preview' && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-purple-600" /> Theme:
                </span>
                <button
                  type="button"
                  onClick={() => setTheme('purple')}
                  className={`w-6 h-6 rounded-lg bg-purple-900 border transition-all cursor-pointer ${
                    theme === 'purple' ? 'ring-2 ring-purple-600 scale-110 border-white' : 'border-slate-300 opacity-70'
                  }`}
                  title="Theme Tím IDV Hoàng Gia"
                />
                <button
                  type="button"
                  onClick={() => setTheme('blue')}
                  className={`w-6 h-6 rounded-lg bg-blue-900 border transition-all cursor-pointer ${
                    theme === 'blue' ? 'ring-2 ring-blue-600 scale-110 border-white' : 'border-slate-300 opacity-70'
                  }`}
                  title="Theme Xanh Chuyên Nghiệp"
                />
                <button
                  type="button"
                  onClick={() => setTheme('slate')}
                  className={`w-6 h-6 rounded-lg bg-slate-100 border transition-all cursor-pointer ${
                    theme === 'slate' ? 'ring-2 ring-purple-600 scale-110 border-slate-400' : 'border-slate-300 opacity-70'
                  }`}
                  title="Theme Trắng Tối Giản"
                />
              </div>
            )}

            {/* View Switcher */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('image_preview')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

        {/* FLEXIBLE FONT SIZE & BANK ACCOUNT SETTINGS TOOLBAR */}
        <div className="px-4 py-2.5 bg-indigo-50/70 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Font Size Flexibility Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950">
              <Type className="w-4 h-4 text-indigo-700" />
              <span>Cỡ chữ bảng điểm:</span>
            </div>

            <div className="inline-flex bg-white p-0.5 rounded-xl border border-indigo-200 shadow-2xs">
              {(
                [
                  { id: 'compact', label: 'Nhỏ gọn (85%)' },
                  { id: 'normal', label: 'Chuẩn (100%)' },
                  { id: 'large', label: 'Lớn (115%)' },
                  { id: 'xl', label: 'Rất lớn (130%)' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setFontSizePreset(preset.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    fontSizePreset === preset.id
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* QR Code Toggle for Penalty */}
            <div className="flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  showQrCode
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
                title="Bật/tắt hiển thị mã QR nộp phạt nhỏ ở chân trang"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Mã QR Nộp Phạt: {showQrCode ? 'BẬT' : 'TẮT'}</span>
              </button>
            </div>
          </div>

          {/* Quick Bank Account Edit & Reset Button */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300 shadow-2xs">
              <CreditCard className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span className="text-[11px] font-bold text-slate-600 shrink-0">STK Phạt:</span>
              <input
                type="text"
                value={currentPenaltyBank}
                onChange={(e) => handleBankChange(e.target.value)}
                placeholder="VD: 174293666666 - Techcombank (Đặng Kim Anh)..."
                className="text-xs font-bold text-purple-900 bg-transparent border-none focus:outline-none w-56 truncate"
                title="Thay đổi nhanh số tài khoản nộp phạt gửi phụ huynh"
              />
            </div>
            <button
              type="button"
              onClick={handleResetToDefaultAssistantBank}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl transition-all cursor-pointer"
              title="Đặt lại STK Trợ lý Đặng Kim Anh (Techcombank 174293666666)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* BTVN Items Selector Toolbar for Export */}
        <div className="px-4 py-2 bg-amber-50/80 border-b border-amber-200/70 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-amber-950 flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <span>Đề mục BTVN ({activeHomeworkItems.length} mục đã chọn):</span>
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {allAvailableHomeworkItems.map((item) => {
                const isSelected = activeHomeworkItems.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (activeHomeworkItems.length <= 1) return;
                        setActiveHomeworkItems(activeHomeworkItems.filter((i) => i !== item));
                      } else {
                        setActiveHomeworkItems([...activeHomeworkItems, item]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-amber-950 shadow-xs ring-1 ring-amber-400 font-black'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{isSelected ? '☑' : '☐'}</span>
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 text-[11px]">
            <span className="text-slate-400 font-medium">Chọn nhanh:</span>
            <button
              type="button"
              onClick={() => setActiveHomeworkItems(['Nghe', 'Viết'])}
              className="px-2 py-0.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold cursor-pointer"
            >
              Nghe + Viết
            </button>
            <button
              type="button"
              onClick={() => setActiveHomeworkItems(['Nghe', 'Nói', 'Đọc', 'Viết'])}
              className="px-2 py-0.5 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-bold cursor-pointer"
            >
              4 Kỹ năng
            </button>
            <button
              type="button"
              onClick={() => setActiveHomeworkItems(['Nghe', 'Nói', 'Đọc', 'Viết', 'Chép phạt', 'Chữa bài'])}
              className="px-2 py-0.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded font-bold cursor-pointer"
            >
              Đầy đủ 6 mục
            </button>
          </div>
        </div>

        {/* Status / Toast alert inside modal */}
        {statusMessage && (
          <div className="bg-purple-900 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-in fade-in shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-purple-200 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body: Scrollable Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          {activeTab === 'image_preview' ? (
            <div className="max-w-5xl mx-auto space-y-4">
              
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                  Xem trước ảnh phiếu điểm (Có thể tùy chỉnh cỡ chữ và STK phía trên)
                </span>
                <span className="font-bold text-purple-800">
                  {sortMode === 'score_desc' ? '🔥 Xếp hạng điểm: Cao → Thấp' : '📌 Thứ tự danh sách lớp'}
                </span>
              </div>

              {/* THE IMAGE REPORT CARD (CAPTURED WITH HTML-TO-IMAGE) */}
              <div
                ref={reportCardRef}
                id="idv-class-score-card"
                className={`p-6 sm:p-8 rounded-3xl shadow-xl border overflow-hidden ${themeConfig.cardBg}`}
                style={{ minWidth: '760px' }}
              >
                {/* Brand Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/15">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-md border border-amber-300 shrink-0">
                      DV
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                        IELTS DƯƠNG VŨ
                      </div>
                      <h2 className={`${fontSizeConfig.headerTitle} font-black tracking-tight text-white flex items-center gap-2`}>
                        BẢNG ĐIỂM BUỔI HỌC SỐ {sessionNumber}
                        <Sparkles className="w-4 h-4 text-amber-300 inline" />
                      </h2>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="inline-block px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs sm:text-sm font-black text-amber-300">
                      LỚP: {classGroup.name} {classGroup.courseName ? `• ${classGroup.courseName}` : ''}
                    </div>
                    <div className="text-xs text-white/75 font-medium">
                      Ngày: <strong className="text-white">{currentDate}</strong>
                    </div>
                  </div>
                </div>

                {/* Score Details Table with Flexible Font Scaling */}
                <div className="rounded-2xl border border-white/10 overflow-hidden shadow-sm">
                  <table className={`w-full text-left ${fontSizeConfig.tableText} border-collapse`}>
                    <thead>
                      <tr className={`${themeConfig.tableHeaderBg} border-b font-black uppercase tracking-wider`}>
                        <th rowSpan={activeHomeworkItems.length > 0 ? 2 : 1} className={`${fontSizeConfig.tableHeader} w-12 text-center`}>Hạng</th>
                        <th rowSpan={activeHomeworkItems.length > 0 ? 2 : 1} className={`${fontSizeConfig.tableHeader} min-w-[140px]`}>Học Viên</th>
                        <th rowSpan={activeHomeworkItems.length > 0 ? 2 : 1} className={`${fontSizeConfig.tableHeader} text-center w-20`}>Trạng Thái</th>
                        {selectedSkills.map((sk) => (
                          <th key={sk} rowSpan={activeHomeworkItems.length > 0 ? 2 : 1} className={`${fontSizeConfig.tableHeader} text-center min-w-[70px]`}>
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
                          <th rowSpan={activeHomeworkItems.length > 0 ? 2 : 1} className={`${fontSizeConfig.tableHeader} text-center w-24 bg-amber-400/10 text-amber-300`}>
                            {overallScoreType === 'ielts_band' ? 'Band IELTS' : 'Điểm TB'}
                          </th>
                        )}
                        {activeHomeworkItems.length > 0 ? (
                          <th
                            colSpan={activeHomeworkItems.length}
                            className={`${fontSizeConfig.tableHeader} text-center bg-amber-400/20 text-amber-200 font-extrabold border-b border-white/10`}
                          >
                            BTVN (Đề mục {activeHomeworkItems.length})
                          </th>
                        ) : (
                          <th className={`${fontSizeConfig.tableHeader} text-center w-20`}>BTVN</th>
                        )}
                        <th rowSpan={activeHomeworkItems.length > 0 ? 2 : 1} className={`${fontSizeConfig.tableHeader} text-center min-w-[105px] bg-amber-400/10 text-amber-300`}>Tiền Phạt</th>
                        {hasAnyDebt && (
                          <th rowSpan={activeHomeworkItems.length > 0 ? 2 : 1} className={`${fontSizeConfig.tableHeader} text-center min-w-[100px] bg-rose-400/15 text-rose-300`}>Nợ Cũ</th>
                        )}
                        <th rowSpan={activeHomeworkItems.length > 0 ? 2 : 1} className={`${fontSizeConfig.tableHeader} text-center w-20`}>Quizlet</th>
                        {hasWritingSkill && (
                          <th rowSpan={activeHomeworkItems.length > 0 ? 2 : 1} className={`${fontSizeConfig.tableHeader} text-center w-20`}>Chép Phạt</th>
                        )}
                        <th rowSpan={activeHomeworkItems.length > 0 ? 2 : 1} className={`${fontSizeConfig.tableHeader} min-w-[130px]`}>Nhận Xét</th>
                      </tr>

                      {/* SECOND HEADER ROW FOR BTVN SUB-ITEMS */}
                      {activeHomeworkItems.length > 0 && (
                        <tr className={`${themeConfig.tableHeaderBg} border-b border-white/10 text-[10px] sm:text-[11px] font-extrabold tracking-wider`}>
                          {activeHomeworkItems.map((item) => (
                            <th key={item} className="py-1.5 px-1.5 text-center min-w-[50px] text-amber-200 border-l border-white/10">
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
                        const hasPenaltyFee = parsePenaltyAmount(pFee) > 0;
                        const pDebt = row?.previousDebt || '0 đ';
                        const hasDebt = parsePenaltyAmount(pDebt) > 0;

                        return (
                          <tr
                            key={st.id}
                            className={`transition-colors ${idx % 2 === 1 ? themeConfig.rowEvenBg : ''} ${themeConfig.rowHoverBg}`}
                          >
                            <td className={`${fontSizeConfig.tableCell} text-center ${rankColor}`}>{rankBadge}</td>
                            
                            <td className={`${fontSizeConfig.tableCell} font-bold text-white`}>
                              <div className={`${fontSizeConfig.nameText} truncate font-bold`}>{st.name}</div>
                              {st.phone && (
                                <div className="text-[10px] text-white/50 font-mono">{st.phone}</div>
                              )}
                            </td>

                            <td className={`${fontSizeConfig.tableCell} text-center`}>
                              <span
                                className={`inline-block ${fontSizeConfig.badgeText} rounded-full font-bold ${
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
                                <td key={sk} className={`${fontSizeConfig.tableCell} text-center font-bold text-white`}>
                                  {val ? (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/10 font-mono">
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
                              <td className={`${fontSizeConfig.tableCell} text-center bg-amber-400/5`}>
                                {avg !== '-' ? (
                                  <span className="inline-block px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40 font-black font-mono">
                                    {avg}
                                  </span>
                                ) : (
                                  <span className="text-white/30">-</span>
                                )}
                              </td>
                            )}

                            {/* BTVN Items */}
                            {activeHomeworkItems && activeHomeworkItems.length > 0 ? (
                              activeHomeworkItems.map((item) => {
                                if (isAbsent) {
                                  return (
                                    <td key={item} className={`${fontSizeConfig.tableCell} text-center text-white/30`}>
                                      -
                                    </td>
                                  );
                                }
                                const isMissing =
                                  row?.homeworkStatus === 'Chưa làm' || row?.missingHomeworkItems?.includes(item);
                                return (
                                  <td key={item} className={`${fontSizeConfig.tableCell} text-center`}>
                                    {isMissing ? (
                                      <span className="inline-flex items-center justify-center font-black text-rose-400 font-mono tracking-tighter">
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
                              <td className={`${fontSizeConfig.tableCell} text-center`}>
                                {isAbsent ? (
                                  <span className="text-white/30">-</span>
                                ) : row?.homeworkStatus === 'Chưa làm' || row?.homeworkStatus === 'Thiếu' ? (
                                  <span className="inline-flex items-center justify-center font-black text-rose-400 font-mono tracking-tighter">
                                    (✘)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-600 text-white font-black text-xs shadow-2xs border border-emerald-500">
                                    ✓
                                  </span>
                                )}
                              </td>
                            )}

                            {/* CỘT TỔNG TIỀN PHẠT CHO TỪNG HỌC VIÊN */}
                            <td className={`${fontSizeConfig.tableCell} text-center`}>
                              {hasPenaltyFee ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="inline-block px-1.5 py-0.5 rounded font-black bg-amber-400/25 text-amber-200 border border-amber-400/50 font-mono">
                                    {parsePenaltyAmount(pFee).toLocaleString('vi-VN')} đ
                                  </span>
                                  <span className="text-[9px] text-amber-300/80 font-bold whitespace-nowrap">
                                    (STK Trợ lý)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-white/40 font-mono">0 đ</span>
                              )}
                            </td>

                            {/* CỘT NỢ CŨ CHƯA NỘP */}
                            {hasAnyDebt && (
                              <td className={`${fontSizeConfig.tableCell} text-center`}>
                                {hasDebt ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded font-black bg-rose-500/25 text-rose-200 border border-rose-400/40 font-mono">
                                    {parsePenaltyAmount(pDebt).toLocaleString('vi-VN')} đ
                                  </span>
                                ) : (
                                  <span className="text-white/30 font-mono">-</span>
                                )}
                              </td>
                            )}

                            <td className={`${fontSizeConfig.tableCell} text-center`}>
                              <span
                                className={`font-bold px-1.5 py-0.5 rounded-md ${
                                  row?.quizletStatus === 'Chưa học'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {row?.quizletStatus || 'Đã học'}
                              </span>
                            </td>

                            {hasWritingSkill && (
                              <td className={`${fontSizeConfig.tableCell} text-center font-mono font-bold`}>
                                {row?.penaltyCopies && Number(row.penaltyCopies) > 0 ? (
                                  <span className="text-rose-400 font-bold bg-rose-500/20 px-1.5 py-0.5 rounded">
                                    {row.penaltyCopies} lần
                                  </span>
                                ) : (
                                  <span className="text-white/30">-</span>
                                )}
                              </td>
                            )}

                            <td className={`${fontSizeConfig.tableCell} text-white/80 italic max-w-[180px] truncate`}>
                              {row?.feedback && row.feedback.trim() !== '' ? row.feedback.trim() : (row?.note && row.note.trim() !== '' ? row.note.trim() : '-')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer of report card with compact Assistant Bank & Important Notice */}
                <div className="mt-4 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Left: Important Separation Note (Top) & Assistant STK + Syntax (Bottom) */}
                  <div className="space-y-2 max-w-2xl">
                    {/* 1. Dòng Lưu ý khung đỏ lên trên */}
                    <div className="text-[10.5px] text-red-100 bg-red-950/60 border-2 border-red-500 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xs">
                      <span className="text-sm shrink-0">⚠️</span>
                      <span className="leading-snug">
                        <strong className="text-red-300 uppercase font-black tracking-wide">Lưu ý:</strong> Học phí gửi vào <strong className="text-white font-bold">STK Công ty (MB Bank)</strong>. Tiền phạt &amp; nợ cũ vui lòng chuyển khoản vào <strong className="text-amber-300 font-bold">STK cá nhân trợ lý (Đặng Kim Anh - Techcombank)</strong>.
                      </span>
                    </div>

                    {/* 2. STK Nộp phạt và cú pháp ở dưới */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/35 border border-amber-400/35 text-[11px] font-bold text-amber-300">
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        <span>STK Nộp phạt (Trợ lý): <strong className="text-white font-mono">{currentPenaltyBank}</strong></span>
                      </div>
                      <span className="text-[10.5px] text-white/80">
                        Cú pháp: <span className="text-amber-200 font-mono font-bold">[Tên HS] + {classGroup.name} - nộp phạt B{sessionNumber}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Large Double-Sized QR Code & Branding */}
                  <div className="flex items-center gap-3.5 shrink-0 self-end sm:self-center">
                    {showQrCode && (
                      <div className="bg-white p-1.5 rounded-xl border-2 border-amber-400 flex flex-col items-center gap-1 shadow-md">
                        <img
                          crossOrigin="anonymous"
                          src={qrDataUrl || getPenaltyVietQrUrl(
                            undefined,
                            `${classGroup.name} nop phat B${sessionNumber}`,
                            'compact2'
                          )}
                          alt="Mã QR nộp phạt trợ lý Đặng Kim Anh"
                          className="w-22 h-22 sm:w-24 sm:h-24 object-contain rounded-lg bg-white"
                        />
                        <div className="text-[9px] font-black text-purple-950 uppercase tracking-tight text-center px-1">
                          Quét QR Nộp Phạt
                        </div>
                      </div>
                    )}

                    <div className="text-right text-[10px] text-white/70 space-y-0.5">
                      <div className="font-extrabold text-amber-300 text-xs">IELTS DƯƠNG VŨ</div>
                      <div className="text-white/50 font-medium">Hotline: 0798934698</div>
                      <div className="text-white/40 font-mono text-[9px]">{currentDate}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Zalo Text View */
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span>Nội dung tin nhắn Zalo đã được tự động định dạng &amp; có đầy đủ thông tin STK phạt &amp; nợ:</span>
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {/* Copy Zalo Text Button */}
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
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
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 rounded-xl shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer"
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
