import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  UserCheck,
  Calendar,
  Sparkles,
  Link2,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Users,
  Send,
  HelpCircle,
  Layers,
  ArrowUpRight,
  Filter,
  GraduationCap,
  Mail,
  Phone,
  UserPlus,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Maximize2,
  Activity,
  Lock,
  X,
  Volume2,
  XCircle,
  AlertCircle,
  QrCode,
  Share2,
  Download,
  Globe,
  Trash2,
  FileSearch,
  Save,
  Edit3,
} from 'lucide-react';
import { PlacementTest, ClassGroup, Student, CurriculumCourse, AuthUser } from '../../types';
import { OnlinePlacementTestForm } from './OnlinePlacementTestForm';
import { formatDateVN } from '../../utils/courseSchedule';
import {
  evaluatePlacementResult,
  generateParentReportText,
  PRESET_COMMENTS,
} from '../../utils/placementEvaluation';
import {
  getPlacementTestUrl,
  getZaloShareMessage,
  getPlacementRawCopyWithTitle,
  getQrCodeImageUrl,
  getPublicBaseUrl,
  setPublicBaseUrl,
} from '../../utils/placementLink';

interface PlacementModuleProps {
  placementTests: PlacementTest[];
  classes: ClassGroup[];
  courses?: CurriculumCourse[];
  students?: Student[];
  onAddTest: (test: PlacementTest) => void;
  onAssignToClass?: (testId: string, classId: string, studentData?: Partial<Student>) => void;
  onUpdateTest?: (test: PlacementTest) => void;
  onDeleteTest?: (testId: string) => void;
  currentUser?: AuthUser;
  onOpenStudentPortalPreview?: () => void;
}

export const PlacementModule: React.FC<PlacementModuleProps> = ({
  placementTests,
  classes,
  courses = [],
  students = [],
  onAddTest,
  onAssignToClass,
  onUpdateTest,
  onDeleteTest,
  currentUser,
  onOpenStudentPortalPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'google_form_builder'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedStudentUrl, setCopiedStudentUrl] = useState(false);
  const [copiedZaloMsg, setCopiedZaloMsg] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Test Result Modal
  const [showManualModal, setShowManualModal] = useState(false);

  // Assign to Class / Waiting List Modal State
  const [assigningTest, setAssigningTest] = useState<PlacementTest | null>(null);
  const [viewingDetailTest, setViewingDetailTest] = useState<PlacementTest | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('waiting_list');
  const [assignFormData, setAssignFormData] = useState({
    name: '',
    dob: '2008-01-15',
    gender: 'Nam' as 'Nam' | 'Nữ',
    email: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    address: 'Hải Phòng',
  });

  // Google Form Link State (Linked to user's Google Form URL)
  const [googleFormUrl, setGoogleFormUrl] = useState(
    'https://docs.google.com/forms/d/e/1FAIpQLScNKToDFg0IoNjhOJl1SWQhc-sowh5olL2V3ejwSbMc6U6fCw/viewform?usp=header'
  );
  const [customFormTitle, setCustomFormTitle] = useState('BÀI KIỂM TRA ĐẦU VÀO IELTS CHUẨN QUỐC TẾ - IELTS DƯƠNG VŨ');

  // Anti-Cheat Monitoring States for Online Test
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [antiCheatLogs, setAntiCheatLogs] = useState<string[]>([]);
  const [showAntiCheatWarningModal, setShowAntiCheatWarningModal] = useState<boolean>(false);
  const [viewingAntiCheatTest, setViewingAntiCheatTest] = useState<PlacementTest | null>(null);

  // Interactive Online Form State
  const [onlineForm, setOnlineForm] = useState({
    candidateName: '',
    dob: '2008-05-15',
    gender: 'Nữ' as 'Nam' | 'Nữ',
    phone: '',
    email: '',
    parentName: '',
    parentPhone: '',
    address: 'Quận Kiến An, Hải Phòng',
    targetLevel: 'IELTS 6.5+ Bứt Phá',
    q1Grammar: 'B',
    q2Vocab: 'C',
    q3Reading: 'A',
    q4Listening: 'D',
    writingSelfIntro: '',
  });

  // Monitor Window Focus & Tab Visibility when taking test
  useEffect(() => {
    if (activeTab !== 'google_form_builder') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const timeStr = new Date().toLocaleTimeString('vi-VN');
        const logMsg = `[${timeStr}] ⚠️ Thí sinh chuyển sang tab khác hoặc thu nhỏ trình duyệt`;
        setTabSwitchCount((prev) => prev + 1);
        setAntiCheatLogs((prev) => [logMsg, ...prev]);
        setShowAntiCheatWarningModal(true);
      }
    };

    const handleWindowBlur = () => {
      const timeStr = new Date().toLocaleTimeString('vi-VN');
      const logMsg = `[${timeStr}] ⚠️ Thí sinh mất tập trung khỏi cửa sổ bài thi (Mở ứng dụng khác)`;
      setAntiCheatLogs((prev) => [logMsg, ...prev]);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [activeTab]);

  // Manual Test Result Form Data
  const [manualFormData, setManualFormData] = useState({
    candidateName: '',
    dob: '2008-01-01',
    gender: 'Nam' as 'Nam' | 'Nữ',
    phone: '',
    email: '',
    parentName: '',
    parentPhone: '',
    testDate: new Date().toISOString().split('T')[0],
    evaluatorName: 'Tâm Vương',
    listeningScore: 5.5,
    speakingScore: 5.0,
    readingScore: 6.0,
    writingScore: 5.0,
    targetLevel: 'IELTS 6.5+',
    recommendedCourse: 'IELTS Intensive 6.5+ Bứt Phá',
    comment: '',
    isFailed: false,
  });

  // Quick text/sheet import data
  const [sheetImportText, setSheetImportText] = useState(
    `Nguyễn Hoàng Hải\t2008-03-12\t0981234567\thoanghai@gmail.com\t6.0\t5.5\t6.5\t5.5\tIELTS Intensive 6.5+\nTrần Mai Chi\t2007-09-24\t0976543210\tmaichi.tran@gmail.com\t5.0\t4.5\t5.5\t5.0\tIELTS Pre-Intermediate`
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Change test status (e.g. Mark as 'Không đạt' or 'Đã có kết quả')
  const handleStatusChange = (test: PlacementTest, newStatus: PlacementTest['status']) => {
    let recommendedCourse = test.recommendedCourse;
    let comment = test.comment;

    if (newStatus === 'Không đạt') {
      recommendedCourse = 'Không Đạt';
      comment = PRESET_COMMENTS.FAILED;
    } else if (newStatus === 'Đã có kết quả' && test.status === 'Không đạt') {
      recommendedCourse = 'Khóa 1';
      comment = PRESET_COMMENTS.COURSE_1;
    }

    const updated: PlacementTest = {
      ...test,
      status: newStatus,
      recommendedCourse,
      comment,
    };

    if (onUpdateTest) {
      onUpdateTest(updated);
    }
    showToast(`Đã chuyển trạng thái bài test của ${test.candidateName} thành "${newStatus}"!`);
  };

  // Quick set recommended course to Khóa 1 or Khóa 2
  const handleSetCourse = (test: PlacementTest, courseName: 'Khóa 1' | 'Khóa 2') => {
    let comment = test.comment;
    if (!comment || comment === PRESET_COMMENTS.FAILED || comment === PRESET_COMMENTS.COURSE_1 || comment === PRESET_COMMENTS.COURSE_2) {
      comment = courseName === 'Khóa 1' ? PRESET_COMMENTS.COURSE_1 : PRESET_COMMENTS.COURSE_2;
    }
    const updated: PlacementTest = {
      ...test,
      recommendedCourse: courseName,
      status: test.status === 'Không đạt' ? 'Đã có kết quả' : test.status,
      comment,
    };
    if (onUpdateTest) {
      onUpdateTest(updated);
    }
    showToast(`Đã chuyển xếp lớp cho ${test.candidateName} thành "${courseName}"!`);
  };

  // Note Modal State & Handlers
  const [editingNoteTest, setEditingNoteTest] = useState<PlacementTest | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');

  const handleOpenNoteModal = (test: PlacementTest) => {
    setEditingNoteTest(test);
    setNoteInput(test.comment || '');
  };

  const handleSaveNote = () => {
    if (!editingNoteTest) return;
    const updated: PlacementTest = {
      ...editingNoteTest,
      comment: noteInput.trim(),
    };
    if (onUpdateTest) {
      onUpdateTest(updated);
    }
    showToast(`Đã lưu ghi chú cho bài test của ${editingNoteTest.candidateName}!`);
    setEditingNoteTest(null);
  };

  const [testToDelete, setTestToDelete] = useState<PlacementTest | null>(null);

  const handleDeleteTest = (test: PlacementTest) => {
    setTestToDelete(test);
  };

  const confirmDeleteTest = () => {
    if (!testToDelete) return;
    const test = testToDelete;
    if (onDeleteTest) {
      onDeleteTest(test.id);
    }
    showToast(`Đã xóa bài kiểm tra của ${test.candidateName} thành công!`);
    if (viewingDetailTest && viewingDetailTest.id === test.id) {
      setViewingDetailTest(null);
    }
    setTestToDelete(null);
  };

  const handleExportBackup = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(placementTests, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `ielts_placement_tests_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast(`Đã tải xuống file sao lưu ${placementTests.length} bài test (JSON) về máy thành công!`);
    } catch (err: any) {
      showToast('Lỗi khi tải file sao lưu: ' + err.message);
    }
  };

  // Copy Parent Report from Placement Test Card
  const handleCopyCardReport = (test: PlacementTest) => {
    const evalRes = evaluatePlacementResult(
      test.testAnswers?.vocab,
      test.testAnswers?.listening,
      test.testAnswers?.reading,
      test.testAnswers?.writingSentences
    );
    const reportText = generateParentReportText(test, evalRes);

    const onCopySuccess = () => {
      setCopiedReportId(test.id);
      showToast(`Đã sao chép kết quả bài làm báo cáo phụ huynh của em ${test.candidateName}!`);
      setTimeout(() => setCopiedReportId(null), 3000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reportText).then(onCopySuccess).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = reportText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        onCopySuccess();
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = reportText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      onCopySuccess();
    }
  };

  // Filtered placement tests
  const filteredTests = placementTests.filter((t) => {
    const matchSearch =
      t.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search) ||
      (t.email && t.email.toLowerCase().includes(search.toLowerCase())) ||
      t.recommendedCourse.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'course1') return t.recommendedCourse === 'Khóa 1';
    if (statusFilter === 'course2') return t.recommendedCourse === 'Khóa 2';
    if (statusFilter === 'waiting') return t.status === 'Chờ làm bài' || t.status === 'Chờ chấm điểm';
    if (statusFilter === 'evaluated') return t.status === 'Đã có kết quả';
    if (statusFilter === 'failed') return t.status === 'Không đạt';
    if (statusFilter === 'assigned') return t.status === 'Đã xếp lớp chờ' || t.status === 'Đã nhập học';
    return true;
  });

  // Configurable Public Base URL state for sharing
  const [publicBaseUrl, setLocalPublicBaseUrl] = useState<string>(() => getPublicBaseUrl());
  const [showDomainConfig, setShowDomainConfig] = useState<boolean>(false);
  const [customDomainInput, setCustomDomainInput] = useState<string>(() => getPublicBaseUrl());

  useEffect(() => {
    const handleBaseUrlChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const newUrl = customEvent.detail || getPublicBaseUrl();
      setLocalPublicBaseUrl(newUrl);
      setCustomDomainInput(newUrl);
    };
    window.addEventListener('ielts-base-url-changed', handleBaseUrlChange);
    return () => window.removeEventListener('ielts-base-url-changed', handleBaseUrlChange);
  }, []);

  const handleSaveCustomDomain = (e: React.FormEvent) => {
    e.preventDefault();
    setPublicBaseUrl(customDomainInput);
    setLocalPublicBaseUrl(getPublicBaseUrl());
    showToast('✅ Đã lưu cấu hình tên miền link làm bài cho học sinh!');
    setShowDomainConfig(false);
  };

  const handleResetCustomDomain = () => {
    setPublicBaseUrl('');
    const base = getPublicBaseUrl();
    setLocalPublicBaseUrl(base);
    setCustomDomainInput(base);
    showToast('🔄 Đã khôi phục tên miền về mặc định của hệ thống.');
  };

  // Copy student test link and templates
  const studentTestUrl = getPlacementTestUrl(publicBaseUrl);

  const handleCopyRawUrl = () => {
    const textWithTitle = getPlacementRawCopyWithTitle(studentTestUrl);
    navigator.clipboard.writeText(textWithTitle);
    setCopiedStudentUrl(true);
    showToast('✅ Đã sao chép link kèm tên bài test đầu vào IELTS Dương Vũ!');
    setTimeout(() => setCopiedStudentUrl(false), 2500);
  };

  const handleCopyZaloMessage = () => {
    const shareText = getZaloShareMessage(studentTestUrl);
    navigator.clipboard.writeText(shareText);
    setCopiedZaloMsg(true);
    showToast('Đã sao chép mẫu tin nhắn Zalo kèm link làm bài kiểm tra!');
    setTimeout(() => setCopiedZaloMsg(false), 2500);
  };

  // Copy shareable link
  const handleCopyShareLink = () => {
    handleCopyZaloMessage();
  };

  // Submit Online Form (Like Google Form submission)
  const handleOnlineFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onlineForm.candidateName || !onlineForm.phone) {
      alert('Vui lòng nhập đầy đủ Họ tên và Số điện thoại!');
      return;
    }

    // Calculate score based on answers
    let correctCount = 0;
    if (onlineForm.q1Grammar === 'B') correctCount++;
    if (onlineForm.q2Vocab === 'C') correctCount++;
    if (onlineForm.q3Reading === 'A') correctCount++;
    if (onlineForm.q4Listening === 'D') correctCount++;

    const baseScore = Math.min(9.0, Math.max(3.5, 4.0 + correctCount * 0.75));
    const cleanEmail = onlineForm.email || `${onlineForm.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

    const newTest: PlacementTest = {
      id: `pt-${Date.now()}`,
      code: `TEST-${Math.floor(100 + Math.random() * 900)}`,
      candidateName: onlineForm.candidateName,
      dob: onlineForm.dob,
      gender: onlineForm.gender,
      phone: onlineForm.phone,
      email: cleanEmail,
      parentName: onlineForm.parentName,
      parentPhone: onlineForm.parentPhone || onlineForm.phone,
      address: onlineForm.address,
      testDate: new Date().toISOString().split('T')[0],
      evaluatorName: 'Hệ thống AI Anti-Cheat & Auto-Grading',
      listeningScore: baseScore,
      speakingScore: Math.max(3.5, baseScore - 0.5),
      readingScore: baseScore,
      writingScore: Math.max(3.5, baseScore - 0.5),
      overallScore: baseScore,
      targetLevel: onlineForm.targetLevel,
      recommendedCourse:
        baseScore >= 6.5
          ? 'IELTS Intensive 6.5+ Bứt Phá'
          : baseScore >= 5.0
          ? 'IELTS Pre-Intermediate (4.5 - 5.5)'
          : 'IELTS Foundation (3.5 - 4.5)',
      status: 'Đã có kết quả',
      comment: `Thí sinh làm bài qua Form trực tuyến. Đúng ${correctCount}/4 câu trắc nghiệm. Giám sát Anti-Cheat: ${
        tabSwitchCount > 0
          ? `Cảnh báo ${tabSwitchCount} lần vi phạm rời tab/mở app`
          : 'Bài thi hoàn toàn nghiêm túc, 0 lần vi phạm rời tab'
      }.`,
      sourceType: 'form_online',
      tabSwitchCount: tabSwitchCount,
      antiCheatLogs: antiCheatLogs,
      googleFormLink: googleFormUrl,
    };

    onAddTest(newTest);
    showToast(`Đã lưu bài test của ${onlineForm.candidateName} (Rời tab: ${tabSwitchCount} lần) thành công!`);

    // Reset online form & anti-cheat counters
    setOnlineForm({
      candidateName: '',
      dob: '2008-05-15',
      gender: 'Nữ',
      phone: '',
      email: '',
      parentName: '',
      parentPhone: '',
      address: 'Quận Kiến An, Hải Phòng',
      targetLevel: 'IELTS 6.5+ Bứt Phá',
      q1Grammar: 'B',
      q2Vocab: 'C',
      q3Reading: 'A',
      q4Listening: 'D',
      writingSelfIntro: '',
    });
    setTabSwitchCount(0);
    setAntiCheatLogs([]);

    setActiveTab('list');
  };

  // Submit Manual Test Form
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const overall =
      Math.round(
        ((manualFormData.listeningScore +
          manualFormData.speakingScore +
          manualFormData.readingScore +
          manualFormData.writingScore) /
          4) *
          2
      ) / 2;

    const cleanEmail =
      manualFormData.email ||
      `${manualFormData.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

    const newTest: PlacementTest = {
      id: `pt-${Date.now()}`,
      code: `TEST-${Math.floor(100 + Math.random() * 900)}`,
      candidateName: manualFormData.candidateName,
      dob: manualFormData.dob,
      gender: manualFormData.gender,
      phone: manualFormData.phone,
      email: cleanEmail,
      parentName: manualFormData.parentName,
      parentPhone: manualFormData.parentPhone || manualFormData.phone,
      testDate: manualFormData.testDate,
      evaluatorName: manualFormData.evaluatorName,
      listeningScore: manualFormData.listeningScore,
      speakingScore: manualFormData.speakingScore,
      readingScore: manualFormData.readingScore,
      writingScore: manualFormData.writingScore,
      overallScore: overall,
      targetLevel: manualFormData.targetLevel,
      recommendedCourse: manualFormData.recommendedCourse,
      status: manualFormData.isFailed ? 'Không đạt' : 'Đã có kết quả',
      comment:
        manualFormData.comment ||
        'Học viên có nền tảng ngữ pháp khá, phản xạ tương tác tốt, cần tăng vốn Collocations.',
      sourceType: 'manual',
    };

    onAddTest(newTest);
    setShowManualModal(false);
    showToast(`Đã lưu phiếu kiểm tra của ${manualFormData.candidateName}!`);
  };

  // Quick import from Google Sheet text
  const handleSheetImport = () => {
    const lines = sheetImportText.trim().split('\n');
    let addedCount = 0;

    lines.forEach((line) => {
      const parts = line.split('\t').map((p) => p.trim());
      if (parts.length >= 3 && parts[0]) {
        const name = parts[0];
        const dob = parts[1] || '2008-01-01';
        const phone = parts[2] || '0912345678';
        const email = parts[3] || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
        const lis = parseFloat(parts[4]) || 5.0;
        const spk = parseFloat(parts[5]) || 5.0;
        const read = parseFloat(parts[6]) || 5.0;
        const wri = parseFloat(parts[7]) || 5.0;
        const course = parts[8] || 'IELTS Foundation (3.5 - 4.5)';
        const overall = Math.round(((lis + spk + read + wri) / 4) * 2) / 2;

        const newTest: PlacementTest = {
          id: `pt-${Date.now()}-${Math.random()}`,
          code: `TEST-${Math.floor(100 + Math.random() * 900)}`,
          candidateName: name,
          dob: dob,
          gender: 'Nam',
          phone: phone,
          email: email,
          testDate: new Date().toISOString().split('T')[0],
          evaluatorName: 'Nhập từ Google Sheet',
          listeningScore: lis,
          speakingScore: spk,
          readingScore: read,
          writingScore: wri,
          overallScore: overall,
          targetLevel: 'IELTS 6.5+',
          recommendedCourse: course,
          status: 'Đã có kết quả',
          comment: 'Đồng bộ tự động từ Google Form / Sheet bảng kết quả kiểm tra đầu vào.',
          sourceType: 'google_form_link',
        };

        onAddTest(newTest);
        addedCount++;
      }
    });

    showToast(`Đã nạp thành công ${addedCount} kết quả bài test vào hệ thống!`);
    setActiveTab('list');
  };

  // Open Assign to Class modal
  const handleOpenAssignModal = (test: PlacementTest) => {
    setAssigningTest(test);
    setSelectedClassId(test.recommendedClassId || 'waiting_list');
    setAssignFormData({
      name: test.candidateName,
      dob: test.dob || '2008-01-15',
      gender: test.gender || 'Nam',
      email:
        test.email ||
        `${test.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
      phone: test.phone,
      parentName: test.parentName || `PH ${test.candidateName}`,
      parentPhone: test.parentPhone || test.phone,
      address: test.address || 'Hải Phòng',
    });
  };

  // Confirm Assign to Class or Waiting List
  const handleConfirmAssign = () => {
    if (!assigningTest) return;

    if (onAssignToClass) {
      onAssignToClass(assigningTest.id, selectedClassId, assignFormData);
    }

    const targetClass = classes.find((c) => c.id === selectedClassId);
    const destinationName = targetClass ? targetClass.name : 'Lớp Chờ Xếp (Waiting List)';

    showToast(`Đã phân bổ học viên ${assignFormData.name} vào ${destinationName}!`);
    setAssigningTest(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Kiểm Tra Đầu Vào & Phân Lớp Chờ
              </h2>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Google Form Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tạo form làm bài trực tuyến, liên kết Google Form, lưu kết quả đầy đủ STT, Tên, DOB, Gmail, SĐT và phân vào lớp chờ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDomainConfig(!showDomainConfig)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border rounded-xl transition-all active:scale-95 ${
              showDomainConfig || publicBaseUrl.includes('ais-dev-')
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
            }`}
            title="Cấu hình link công khai/tên miền gửi học sinh"
          >
            <Globe className="w-4 h-4 text-purple-700" />
            <span>Cấu hình Link</span>
            {publicBaseUrl.includes('ais-dev-') && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyRawUrl}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all shadow-xs active:scale-95"
            title="Sao chép đường link kiểm tra đầu vào gửi học sinh"
          >
            {copiedStudentUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4 text-purple-600" />}
            <span>{copiedStudentUrl ? 'Đã chép link!' : 'Copy Link Test'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyZaloMessage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-xs active:scale-95"
            title="Sao chép mẫu tin nhắn Zalo kèm hướng dẫn làm bài"
          >
            {copiedZaloMsg ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-emerald-600" />}
            <span>{copiedZaloMsg ? 'Đã chép tin nhắn!' : 'Mẫu gửi Zalo'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all active:scale-95"
            title="Xem mã QR để quét bằng điện thoại"
          >
            <QrCode className="w-4 h-4 text-slate-600" />
            <span>Mã QR</span>
          </button>

          {onOpenStudentPortalPreview ? (
            <button
              type="button"
              onClick={onOpenStudentPortalPreview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all shadow-xs active:scale-95"
              title="Xem trước giao diện thí sinh làm bài"
            >
              <ExternalLink className="w-4 h-4 text-amber-800" />
              <span>Giao diện Thí sinh</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => window.open(studentTestUrl, '_blank')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all shadow-xs active:scale-95"
              title="Mở bài test trong tab mới"
            >
              <ExternalLink className="w-4 h-4 text-amber-800" />
              <span>Giao diện Thí sinh</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nhập phiếu thủ công</span>
          </button>
        </div>
      </div>

      {/* Domain / Public Link Config Panel */}
      {showDomainConfig && (
        <form
          onSubmit={handleSaveCustomDomain}
          className="p-4 bg-gradient-to-br from-purple-50 via-white to-amber-50 rounded-3xl border border-purple-200 shadow-sm space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-700" />
              <h4 className="font-extrabold text-xs text-slate-900">
                Cấu hình Tên miền / Link Share gửi Học sinh
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowDomainConfig(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-0.5"
            >
              ✕ Đóng
            </button>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            💡 <strong>Khắc phục lỗi 403 Google:</strong> Trong môi trường làm việc của AI Studio (link có chứa <code>ais-dev-</code>), chỉ tài khoản của bạn mới có quyền mở. Để học sinh bấm vào làm bài bình thường không bị lỗi 403, bạn chỉ cần nhấn <strong>Share (Chia sẻ)</strong> trên AI Studio, rồi copy link công khai hoặc tên miền riêng của trung tâm dán vào ô bên dưới:
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="url"
              value={customDomainInput}
              onChange={(e) => setCustomDomainInput(e.target.value)}
              placeholder="VD: https://ais-pre-...run.app hoặc https://ieltsduongvu.com"
              className="w-full sm:flex-1 text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                Lưu tên miền
              </button>
              {window.location.origin.includes('ais-dev-') && (
                <button
                  type="button"
                  onClick={() => {
                    const preUrl = window.location.origin.replace('ais-dev-', 'ais-pre-');
                    setCustomDomainInput(preUrl);
                    setPublicBaseUrl(preUrl);
                    setLocalPublicBaseUrl(preUrl);
                    showToast('✅ Đã chuyển sang link công khai (ais-pre-)!');
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                  title="Chuyển sang link Share công khai để học sinh mở trên điện thoại"
                >
                  Dùng ais-pre-
                </button>
              )}
              <button
                type="button"
                onClick={handleResetCustomDomain}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                title="Đặt lại về địa chỉ đang chạy"
              >
                Mặc định
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-2 bg-white/70 p-2 rounded-xl border border-purple-100">
            <span className="font-bold text-purple-900 shrink-0">Link kiểm tra đầu vào đang áp dụng:</span>
            <code className="text-purple-700 font-mono font-bold truncate">{studentTestUrl}</code>
          </div>
        </form>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'list'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Danh Sách Bài Test ({placementTests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('google_form_builder')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'google_form_builder'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>📝 Form Test Online (Questions & Responses)</span>
        </button>
      </div>

      {/* TAB 1: DANH SÁCH BÀI TEST & PHÂN LỚP CHỜ */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* LINK SHARING BANNER: Gửi học sinh làm bài & tự động lưu DB */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-3xl border border-purple-700/50 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-black shrink-0 shadow-md">
                <Link2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Bài kiểm tra đầu vào IELTS Dương Vũ
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Tự động lưu vào hệ thống
                  </span>
                </div>
                <p className="text-xs text-purple-200 leading-relaxed max-w-2xl">
                  Gửi đường link này cho học sinh qua Zalo/Facebook. Khi học sinh làm bài xong và bấm &quot;Nộp bài&quot;, toàn bộ kết quả, thông tin cá nhân và lịch học đăng ký sẽ được lưu tự động vào cơ sở dữ liệu để phòng Đào tạo phân lớp.
                </p>
                <div className="pt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-purple-300 font-semibold">Đường dẫn trực tuyến:</span>
                  <div className="px-3 py-1 bg-black/40 rounded-xl border border-white/10 text-xs font-mono text-amber-300 select-all break-all">
                    {studentTestUrl}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={handleCopyRawUrl}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                {copiedStudentUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedStudentUrl ? 'Đã chép link!' : 'Sao chép link'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyZaloMessage}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/20 active:scale-95"
                title="Mẫu tin nhắn Zalo kèm hướng dẫn"
              >
                {copiedZaloMsg ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4 text-emerald-300" />}
                <span>{copiedZaloMsg ? 'Đã chép Zalo!' : 'Mẫu Zalo'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/20 active:scale-95"
                title="Tải toàn bộ dữ liệu bài test về máy tính để lưu trữ vĩnh viễn (File JSON)"
              >
                <Download className="w-4 h-4 text-sky-300" />
                <span>Sao lưu</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/20 active:scale-95"
                title="Hiển thị mã QR"
              >
                <QrCode className="w-4 h-4" />
                <span>Mã QR</span>
              </button>

              {onOpenStudentPortalPreview ? (
                <button
                  type="button"
                  onClick={onOpenStudentPortalPreview}
                  className="px-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                  title="Xem giao diện học sinh làm bài"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Làm thử</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => window.open(studentTestUrl, '_blank')}
                  className="px-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                  title="Mở bài test trong tab mới"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Làm thử</span>
                </button>
              )}
            </div>
          </div>
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên thí sinh, ngày sinh, gmail, SĐT, mã test..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-medium">Lọc:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'course1', label: '📘 Khóa 1' },
                { id: 'course2', label: '🚀 Khóa 2' },
                { id: 'evaluated', label: 'Đã có điểm' },
                { id: 'failed', label: '❌ Không đạt' },
                { id: 'assigned', label: 'Đã phân lớp chờ' },
                { id: 'waiting', label: 'Chờ xử lý' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    statusFilter === f.id
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Placement Test Cards / List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTests.map((t, idx) => {
              const isAssigned = t.status === 'Đã xếp lớp chờ' || t.status === 'Đã nhập học';

              return (
                <div
                  key={t.id}
                  className={`bg-white rounded-3xl p-5 border shadow-xs transition-all flex flex-col justify-between ${
                    t.status === 'Không đạt'
                      ? 'border-rose-200 bg-rose-50/10'
                      : isAssigned
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : 'border-slate-200/80 hover:border-purple-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                          {t.code}
                        </span>
                        {t.sourceType === 'form_online' && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            Form Online
                          </span>
                        )}
                        {t.sourceType === 'google_form_link' && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            Google Form
                          </span>
                        )}

                        {/* Anti-Cheat Badge */}
                        {t.tabSwitchCount && t.tabSwitchCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setViewingAntiCheatTest(t)}
                            className="text-[10px] font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                            title="Bấm để xem lịch sử rời tab thi"
                          >
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>Rời tab: {t.tabSwitchCount} lần</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>0 vi phạm tab</span>
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          t.status === 'Không đạt'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isAssigned
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : t.status === 'Đã có kết quả'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {t.status === 'Không đạt' && <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>{t.status}</span>
                      </span>
                    </div>

                    {/* Candidate Identity */}
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                        <span>{t.candidateName}</span>
                        {t.gender && (
                          <span className="text-[11px] text-slate-400 font-normal">({t.gender})</span>
                        )}
                      </h3>
                      <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Ngày sinh: <strong>{formatDateVN(t.dob) || 'Chưa cập nhật'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>Gmail: <strong className="text-purple-700">{t.email || `${t.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>SĐT: <strong className="text-slate-900">{t.phone}</strong></span>
                        </div>
                        {t.parentName && (
                          <div className="text-[11px] text-slate-500 italic">
                            PH: {t.parentName} ({t.parentPhone || t.phone})
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4 Skill Scores */}
                    <div className="grid grid-cols-4 gap-1.5 text-center bg-slate-50 p-2 rounded-2xl border border-slate-200/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Nghe</span>
                        <span className="text-xs font-extrabold text-slate-800">{t.listeningScore}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Nói</span>
                        <span className="text-xs font-extrabold text-slate-800">{t.speakingScore}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Đọc</span>
                        <span className="text-xs font-extrabold text-slate-800">{t.readingScore}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Viết</span>
                        <span className="text-xs font-extrabold text-slate-800">{t.writingScore}</span>
                      </div>
                    </div>

                    {/* Overall & Recommendation */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-purple-50/70 border border-purple-100">
                      <span className="text-xs font-bold text-purple-900">Overall:</span>
                      <span className="text-base font-black text-purple-700">{t.overallScore}</span>
                    </div>

                    {(t.speakingAudioUrl || t.testAnswers?.speakingAudioUrl) ? (
                      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-2xl">
                        <div className="text-[11px] text-blue-900 font-extrabold mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Ghi âm bài nói Speaking:</span>
                          </span>
                          <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                            {t.speakingAudioDuration || t.testAnswers?.speakingAudioDuration || 45}s
                          </span>
                        </div>
                        <audio controls src={t.speakingAudioUrl || t.testAnswers?.speakingAudioUrl} className="w-full h-8 outline-none" />
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex items-center gap-2 text-slate-400 text-[11px]">
                        <Volume2 className="w-3.5 h-3.5 text-slate-300" />
                        <span>Chưa có file ghi âm Speaking</span>
                      </div>
                    )}

                    <div className="text-xs space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="text-slate-500 font-semibold">Khóa đề xuất:</span>
                        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleSetCourse(t, 'Khóa 1')}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                              t.recommendedCourse === 'Khóa 1'
                                ? 'bg-purple-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-purple-700 hover:bg-slate-50'
                            }`}
                            title="Xếp vào Khóa 1 (PRE)"
                          >
                            Khóa 1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetCourse(t, 'Khóa 2')}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                              t.recommendedCourse === 'Khóa 2'
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-50'
                            }`}
                            title="Xếp vào Khóa 2 (INSPIRE)"
                          >
                            Khóa 2
                          </button>
                        </div>
                      </div>
                      {t.assignedClassName && (
                        <div className="text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Lớp đã phân: {t.assignedClassName}</span>
                        </div>
                      )}
                      {t.comment ? (
                        <div
                          onClick={() => handleOpenNoteModal(t)}
                          className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 cursor-pointer hover:bg-amber-100/80 transition-colors"
                          title="Bấm để chỉnh sửa ghi chú"
                        >
                          <span className="font-bold flex items-center gap-1 text-amber-800 mb-0.5">
                            <FileText className="w-3 h-3 text-amber-600" />
                            <span>Ghi chú:</span>
                          </span>
                          <p className="italic line-clamp-2">"{t.comment}"</p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenNoteModal(t)}
                          className="w-full text-left py-1 px-2 rounded-xl border border-dashed border-slate-200 hover:border-amber-300 text-[11px] text-slate-400 hover:text-amber-700 hover:bg-amber-50/40 flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3 h-3 text-slate-300" />
                          <span>+ Thêm ghi chú cho thí sinh</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions: Assign to Class / Waiting List, Copy Report & Mark Status */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleCopyCardReport(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all"
                        title="Sao chép kết quả bài làm báo cáo phụ huynh"
                      >
                        {copiedReportId === t.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-purple-600" />
                        )}
                        <span>{copiedReportId === t.id ? 'Đã copy' : 'Báo cáo PH'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewingDetailTest(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all"
                        title="Xem chi tiết bài làm của học sinh"
                      >
                        <FileSearch className="w-3.5 h-3.5" />
                        <span>Chi tiết</span>
                      </button>

                      {(t.speakingAudioUrl || t.testAnswers?.speakingAudioUrl) && (
                        <button
                          type="button"
                          onClick={() => setViewingDetailTest(t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-xl transition-all shadow-2xs"
                          title="Bấm để nghe file ghi âm bài nói Speaking"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-sky-700 animate-pulse" />
                          <span>Nghe nói</span>
                        </button>
                      )}

                      {/* Khóa 1 & Khóa 2 quick buttons */}
                      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleSetCourse(t, 'Khóa 1')}
                          className={`px-2 py-1 rounded-lg font-bold text-xs transition-all ${
                            t.recommendedCourse === 'Khóa 1'
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-purple-700 hover:bg-white'
                          }`}
                          title="Xếp vào Khóa 1"
                        >
                          Khóa 1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetCourse(t, 'Khóa 2')}
                          className={`px-2 py-1 rounded-lg font-bold text-xs transition-all ${
                            t.recommendedCourse === 'Khóa 2'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-indigo-700 hover:bg-white'
                          }`}
                          title="Xếp vào Khóa 2"
                        >
                          Khóa 2
                        </button>
                      </div>

                      {/* Ghi chú button right next to Xóa button */}
                      <button
                        type="button"
                        onClick={() => handleOpenNoteModal(t)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                          t.comment
                            ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'
                            : 'text-slate-600 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 border-slate-200'
                        }`}
                        title="Thêm hoặc chỉnh sửa ghi chú"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ghi chú</span>
                        {t.comment && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>}
                      </button>

                      {t.status === 'Không đạt' ? (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(t, 'Đã có kết quả')}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
                          title="Chuyển trạng thái sang Đã đạt"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đạt</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(t, 'Không đạt')}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                          title="Đánh dấu học sinh làm bài không đạt"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>K.Đạt</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteTest(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl transition-all"
                        title="Xóa bài kiểm tra này khỏi hệ thống"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(t)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                        isAssigned
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-purple-700 hover:bg-purple-800 text-white'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isAssigned ? 'Đổi lớp / Xếp lại' : 'Phân vào lớp chờ'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTests.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
              Không tìm thấy bài test đầu vào nào. Hãy tạo form kiểm tra mới hoặc nạp từ Google Sheet!
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTERACTIVE GOOGLE FORM CLONE BUILDER (7 SECTIONS, QUESTIONS & RESPONSES, ANTI-CHEAT & CAMERA, GOOGLE SHEETS EXPORT) */}
      {activeTab === 'google_form_builder' && (
        <OnlinePlacementTestForm
          placementTests={placementTests}
          classes={classes}
          courses={courses}
          onAddTest={onAddTest}
          onAssignToClass={onAssignToClass}
          onUpdateTest={onUpdateTest}
          onDeleteTest={onDeleteTest}
          showToast={showToast}
          googleFormUrl={googleFormUrl}
          currentUser={currentUser}
        />
      )}

      {/* MODAL 1: NHẬP PHIẾU TEST THỦ CÔNG */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Phiếu Kết Quả Kiểm Tra Đầu Vào</h3>
            <p className="text-xs text-slate-500 mb-4">Ghi nhận thông tin, điểm 4 kỹ năng và đề xuất khóa học</p>

            <form onSubmit={handleManualSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ tên thí sinh:</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={manualFormData.candidateName}
                    onChange={(e) => setManualFormData({ ...manualFormData, candidateName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày sinh (DOB):</label>
                  <input
                    type="date"
                    required
                    value={manualFormData.dob}
                    onChange={(e) => setManualFormData({ ...manualFormData, dob: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gmail / Email:</label>
                  <input
                    type="email"
                    placeholder="student@gmail.com"
                    value={manualFormData.email}
                    onChange={(e) => setManualFormData({ ...manualFormData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại:</label>
                  <input
                    type="tel"
                    required
                    placeholder="0912 345 678"
                    value={manualFormData.phone}
                    onChange={(e) => setManualFormData({ ...manualFormData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ tên Phụ huynh:</label>
                  <input
                    type="text"
                    placeholder="Phụ huynh học sinh"
                    value={manualFormData.parentName}
                    onChange={(e) => setManualFormData({ ...manualFormData, parentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SĐT Phụ huynh:</label>
                  <input
                    type="tel"
                    placeholder="0912 334 455"
                    value={manualFormData.parentPhone}
                    onChange={(e) => setManualFormData({ ...manualFormData, parentPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200">
                <span className="font-bold text-purple-950 block mb-2">Điểm 4 kỹ năng:</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Listening</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      value={manualFormData.listeningScore}
                      onChange={(e) => setManualFormData({ ...manualFormData, listeningScore: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Speaking</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      value={manualFormData.speakingScore}
                      onChange={(e) => setManualFormData({ ...manualFormData, speakingScore: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Reading</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      value={manualFormData.readingScore}
                      onChange={(e) => setManualFormData({ ...manualFormData, readingScore: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Writing</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      value={manualFormData.writingScore}
                      onChange={(e) => setManualFormData({ ...manualFormData, writingScore: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kết quả đánh giá đầu vào:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualFormData({
                      ...manualFormData,
                      isFailed: false,
                      recommendedCourse: manualFormData.recommendedCourse === 'Không Đạt' ? 'Khóa 1' : manualFormData.recommendedCourse,
                      comment: manualFormData.comment || PRESET_COMMENTS.COURSE_1,
                    })}
                    className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                      !manualFormData.isFailed
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>🟢 Đạt Yêu Cầu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualFormData({
                      ...manualFormData,
                      isFailed: true,
                      recommendedCourse: 'Không Đạt',
                      comment: PRESET_COMMENTS.FAILED,
                    })}
                    className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                      manualFormData.isFailed
                        ? 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>🔴 Không Đạt</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Khóa học đề xuất:</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setManualFormData({
                        ...manualFormData,
                        isFailed: false,
                        recommendedCourse: 'Khóa 1',
                        comment: PRESET_COMMENTS.COURSE_1,
                      })}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                    >
                      Khóa 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualFormData({
                        ...manualFormData,
                        isFailed: false,
                        recommendedCourse: 'Khóa 2',
                        comment: PRESET_COMMENTS.COURSE_2,
                      })}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                    >
                      Khóa 2
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualFormData({
                        ...manualFormData,
                        isFailed: true,
                        recommendedCourse: 'Không Đạt',
                        comment: PRESET_COMMENTS.FAILED,
                      })}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    >
                      Không Đạt
                    </button>
                  </div>
                </div>
                <select
                  value={manualFormData.recommendedCourse}
                  onChange={(e) => {
                    const val = e.target.value;
                    let comment = manualFormData.comment;
                    let isFailed = manualFormData.isFailed;
                    if (val === 'Khóa 1') {
                      comment = PRESET_COMMENTS.COURSE_1;
                      isFailed = false;
                    } else if (val === 'Khóa 2') {
                      comment = PRESET_COMMENTS.COURSE_2;
                      isFailed = false;
                    } else if (val === 'Không Đạt' || val === 'Không đạt - Cần học bổ trợ Nền Tảng') {
                      comment = PRESET_COMMENTS.FAILED;
                      isFailed = true;
                    }
                    setManualFormData({ ...manualFormData, recommendedCourse: val, comment, isFailed });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                >
                  <option value="Khóa 1">Khóa 1</option>
                  <option value="Khóa 2">Khóa 2</option>
                  <option value="Không Đạt">Không Đạt</option>
                  <option value="IELTS Intensive 6.5+ Bứt Phá">IELTS Intensive 6.5+ Bứt Phá</option>
                  <option value="IELTS Pre-Intermediate (4.5 - 5.5)">IELTS Pre-Intermediate (4.5 - 5.5)</option>
                  <option value="IELTS Foundation (3.5 - 4.5)">IELTS Foundation (3.5 - 4.5)</option>
                  <option value="IELTS Master 7.5 - 8.0+">IELTS Master 7.5 - 8.0+</option>
                  <option value="Không đạt - Cần học bổ trợ Nền Tảng">Không đạt - Cần học bổ trợ Nền Tảng</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nhận xét chuyên môn:</label>
                <textarea
                  rows={2}
                  value={manualFormData.comment}
                  onChange={(e) => setManualFormData({ ...manualFormData, comment: e.target.value })}
                  placeholder="Ghi chú điểm mạnh, điểm yếu ngữ pháp, phản xạ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu Kết Quả Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT BÀI LÀM */}
      {viewingDetailTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileSearch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Chi tiết bài làm: {viewingDetailTest.candidateName}</h3>
                  <p className="text-xs text-slate-500">Mã bài: <span className="font-mono font-bold text-slate-700">{viewingDetailTest.code}</span> • Nộp lúc: {viewingDetailTest.testDate}</p>
                </div>
              </div>
              <button onClick={() => setViewingDetailTest(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Từ vựng</p>
                  <p className="text-xl font-black text-slate-800">{viewingDetailTest.vocabScore || viewingDetailTest.testAnswers?.vocab ? Object.keys(viewingDetailTest.testAnswers?.vocab || {}).length : 0}/10</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Nghe</p>
                  <p className="text-xl font-black text-slate-800">{viewingDetailTest.listeningScore}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Đọc</p>
                  <p className="text-xl font-black text-slate-800">{viewingDetailTest.readingScore}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Viết</p>
                  <p className="text-xl font-black text-slate-800">{viewingDetailTest.writingScore}</p>
                </div>
              </div>

              {(viewingDetailTest.speakingAudioUrl || viewingDetailTest.testAnswers?.speakingAudioUrl) ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-extrabold text-blue-900 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-blue-600" />
                      File ghi âm bài nói Speaking của thí sinh
                    </h4>
                    <span className="text-xs bg-blue-200 text-blue-900 px-2.5 py-0.5 rounded-full font-bold">
                      {viewingDetailTest.speakingAudioDuration || viewingDetailTest.testAnswers?.speakingAudioDuration || 45}s
                    </span>
                  </div>
                  <audio controls src={viewingDetailTest.speakingAudioUrl || viewingDetailTest.testAnswers?.speakingAudioUrl} className="w-full outline-none" />
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex items-center gap-2 text-slate-500 text-xs">
                  <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><strong>Phần thi Speaking:</strong> Chưa có file ghi âm (Thí sinh chưa thực hiện thu âm trên form hoặc làm bài trực tiếp).</span>
                </div>
              )}

              <div className="space-y-4">
                {viewingDetailTest.testAnswers?.vocab && (
                  <div className="border border-slate-200 rounded-2xl p-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Award className="w-4 h-4" /> Đáp án Từ vựng</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(viewingDetailTest.testAnswers.vocab).map(([k, v]) => (
                        <div key={k} className="flex gap-2 border-b border-slate-100 pb-1">
                          <span className="font-bold text-slate-500 min-w-8">Câu {k}:</span>
                          <span className="font-semibold text-slate-800">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewingDetailTest.testAnswers?.listening && (
                  <div className="border border-slate-200 rounded-2xl p-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Award className="w-4 h-4" /> Đáp án Nghe</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(viewingDetailTest.testAnswers.listening).map(([k, v]) => (
                        <div key={k} className="flex gap-2 border-b border-slate-100 pb-1">
                          <span className="font-bold text-slate-500 min-w-8">Câu {k}:</span>
                          <span className="font-semibold text-slate-800">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {viewingDetailTest.testAnswers?.reading && (
                  <div className="border border-slate-200 rounded-2xl p-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Award className="w-4 h-4" /> Đáp án Đọc</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(viewingDetailTest.testAnswers.reading).map(([k, v]) => (
                        <div key={k} className="flex gap-2 border-b border-slate-100 pb-1">
                          <span className="font-bold text-slate-500 min-w-8">Câu {k}:</span>
                          <span className="font-semibold text-slate-800">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {viewingDetailTest.testAnswers?.writingSentences && (
                  <div className="border border-slate-200 rounded-2xl p-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Award className="w-4 h-4" /> Viết câu</h4>
                    <div className="space-y-3 text-xs">
                      {Object.entries(viewingDetailTest.testAnswers.writingSentences).map(([k, v]) => (
                        <div key={k} className="border-b border-slate-100 pb-2">
                          <div className="font-bold text-slate-500 mb-1">Câu {k}:</div>
                          <div className="font-medium text-slate-900 bg-slate-50 p-2 rounded-lg">{v || '(Để trống)'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {viewingDetailTest.testAnswers?.writingParagraph && (
                  <div className="border border-slate-200 rounded-2xl p-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Award className="w-4 h-4" /> Viết đoạn văn</h4>
                    <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {viewingDetailTest.testAnswers.writingParagraph}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleDeleteTest(viewingDetailTest);
                  setViewingDetailTest(null);
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition-colors text-sm flex items-center gap-1.5"
                title="Xóa vĩnh viễn bài thi này khỏi hệ thống"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Xóa bài thi này</span>
              </button>
              <button
                onClick={() => setViewingDetailTest(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PHÂN VÀO CÁC LỚP CHỜ / XẾP LỚP */}
      {assigningTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Phân Thí Sinh Vào Lớp Chờ / Xếp Lớp</h3>
                  <p className="text-[11px] text-slate-500">Chuyển thông tin từ bài test sang danh sách học viên</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg">
                {assigningTest.code}
              </span>
            </div>

            {/* Candidate Summary Info */}
            <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Thí sinh:</span>
                <strong className="text-slate-900 text-sm">{assigningTest.candidateName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Điểm Overall:</span>
                <strong className="text-purple-700 font-extrabold text-sm">{assigningTest.overallScore}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Khóa đề xuất:</span>
                <span className="font-bold text-slate-800">{assigningTest.recommendedCourse}</span>
              </div>
            </div>

            {/* Target Class Selection */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-800 block">
                Chọn Lớp Chờ hoặc Lớp Học Phù Hợp:
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="waiting_list">
                  ⏳ [LỚP CHỜ TUYỂN SINH] Chờ Xếp Lớp (Waiting List)
                </option>
                <optgroup label="Danh Sách Lớp Đang Mở / Sắp Khai Giảng">
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.currentStudents}/{c.maxStudents} HV) - {c.schedule}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Verified Student Roster Fields (STT, Tên, DOB, Gmail, SĐT) */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Hồ sơ học viên chuẩn hóa (Chuyển sang danh sách lớp):</span>
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-600 block mb-0.5">Họ và tên:</label>
                  <input
                    type="text"
                    value={assignFormData.name}
                    onChange={(e) => setAssignFormData({ ...assignFormData, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-0.5">Ngày sinh (DOB):</label>
                  <input
                    type="date"
                    value={assignFormData.dob}
                    onChange={(e) => setAssignFormData({ ...assignFormData, dob: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-0.5">Gmail:</label>
                  <input
                    type="email"
                    value={assignFormData.email}
                    onChange={(e) => setAssignFormData({ ...assignFormData, email: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium text-purple-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-0.5">Số điện thoại:</label>
                  <input
                    type="tel"
                    value={assignFormData.phone}
                    onChange={(e) => setAssignFormData({ ...assignFormData, phone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setAssigningTest(null)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-xl shadow-md flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Xác Nhận Phân Lớp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ANTI-CHEAT WARNING MODAL FOR CANDIDATE */}
      {showAntiCheatWarningModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-500 animate-in zoom-in-95 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center border border-rose-200 shadow-inner">
              <ShieldAlert className="w-9 h-9 animate-bounce" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-rose-200">
                ⚠️ CẢNH BÁO GIÁM SÁT THI TRỰC TUYẾN
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Hệ Thống Phát Hiện Bạn Vừa Rời Khỏi Tab Thi!
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Hành động chuyển tab, mở phần mềm tra cứu hoặc thu nhỏ trình duyệt đã bị ghi nhận{' '}
                <strong className="text-rose-600 font-extrabold">(Lần thứ {tabSwitchCount})</strong>. Lịch sử vi phạm sẽ tự động đính kèm vào kết quả gửi về thầy cô!
              </p>
            </div>

            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100 text-left text-[11px] text-rose-900 font-medium space-y-1">
              <div className="font-bold flex items-center gap-1 text-rose-800">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Nội quy phòng thi trực tuyến:</span>
              </div>
              <p>• Không chuyển tab, không mở Google, ChatGPT hay từ điển.</p>
              <p>• Giữ màn hình làm bài liên tục cho đến khi nhấn "Nộp bài".</p>
            </div>

            <button
              type="button"
              onClick={() => setShowAntiCheatWarningModal(false)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md transition-all text-xs"
            >
              Tôi Đã Hiểu & Quay Lại Làm Bài Thi
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: TEACHER VIEW ANTI-CHEAT LOGS MODAL */}
      {viewingAntiCheatTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 font-bold flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Nhật Ký Vi Phạm Anti-Cheat</h3>
                  <p className="text-[11px] text-slate-500">Thí sinh: {viewingAntiCheatTest.candidateName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingAntiCheatTest(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <span className="text-slate-600 font-semibold">Tổng số lần rời tab/focus:</span>
                <span className="font-mono font-black text-rose-600 text-sm">
                  {viewingAntiCheatTest.tabSwitchCount || 0} lần
                </span>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-700">Chi tiết thời gian ghi nhận:</div>
                {viewingAntiCheatTest.antiCheatLogs && viewingAntiCheatTest.antiCheatLogs.length > 0 ? (
                  viewingAntiCheatTest.antiCheatLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] font-mono bg-rose-50/70 text-rose-900 p-2.5 rounded-xl border border-rose-100"
                    >
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center font-bold">
                    🛡️ Thí sinh thi hoàn toàn nghiêm túc, không ghi nhận bất kỳ vi phạm rời tab nào!
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingAntiCheatTest(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: QR CODE SHARING MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-left">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white font-black flex items-center justify-center text-sm shadow-xs border border-amber-400">
                  DV
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Mã QR Kiểm Tra Đầu Vào</h3>
                  <p className="text-[11px] text-slate-500">IELTS Dương Vũ • Hải Phòng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Phụ huynh và học sinh mở <strong>Camera điện thoại</strong> hoặc tính năng <strong>Quét mã Zalo</strong> để làm bài trực tuyến.
              </p>

              {/* QR Image Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
                <img
                  src={getQrCodeImageUrl(studentTestUrl, 260)}
                  alt="QR Code Test Dau Vao IELTS Duong Vu"
                  className="w-56 h-56 mx-auto rounded-xl shadow-xs"
                />
                <span className="block text-[10px] text-slate-400 font-mono mt-2">
                  Tự động đồng bộ kết quả vào Firestore
                </span>
              </div>

              {/* URL Display and Quick Copy */}
              <div className="space-y-1.5 text-left">
                <span className="text-[11px] font-bold text-slate-600 block">Bài kiểm tra đầu vào IELTS Dương Vũ:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={studentTestUrl}
                    className="flex-1 px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyRawUrl}
                    className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copiedStudentUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedStudentUrl ? 'Đã chép' : 'Chép'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyZaloMessage}
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>{copiedZaloMsg ? 'Đã chép mẫu Zalo!' : 'Mẫu gửi Zalo'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTE / GHI CHÚ MODAL */}
      {editingNoteTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Ghi chú bài kiểm tra</h3>
                  <p className="text-xs text-slate-500">
                    Thí sinh: <strong className="text-slate-800">{editingNoteTest.candidateName}</strong> ({editingNoteTest.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingNoteTest(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Khóa học đề xuất & Nguyện vọng:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNoteTest((prev) => (prev ? { ...prev, recommendedCourse: 'Khóa 1' } : null));
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      editingNoteTest.recommendedCourse === 'Khóa 1'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Khóa 1 (PRE)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNoteTest((prev) => (prev ? { ...prev, recommendedCourse: 'Khóa 2' } : null));
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      editingNoteTest.recommendedCourse === 'Khóa 2'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Khóa 2 (INSPIRE)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nội dung ghi chú & Lưu ý của giáo viên:
                </label>
                <textarea
                  rows={4}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Nhập ghi chú chi tiết về tình hình làm bài, nguyện vọng xếp lớp, thời gian học..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingNoteTest(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Lưu ghi chú</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE TEST MODAL */}
      {testToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Xác nhận xóa bài kiểm tra</h3>
                <p className="text-xs text-slate-500">Hành động này sẽ xóa vĩnh viễn khỏi danh sách và dữ liệu hệ thống</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Học viên / Thí sinh:</span>
                <strong className="text-slate-900 font-bold">{testToDelete.candidateName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã bài thi:</span>
                <span className="font-mono font-bold text-purple-700">{testToDelete.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-mono text-slate-700">{testToDelete.phone || 'Chưa cung cấp'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày làm bài:</span>
                <span className="text-slate-700">{testToDelete.submissionDate || testToDelete.testDate}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTestToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteTest}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa bài thi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
