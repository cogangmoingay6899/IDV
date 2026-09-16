import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Save,
  Download,
  Copy,
  Printer,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Users,
  Edit3,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Building2,
  RefreshCw,
  Clock,
  DollarSign,
  Pin
} from 'lucide-react';
import { Student, ClassGroup, TuitionTransaction, AttendanceRecord } from '../../types';
import { saveDocument, fetchCollection } from '../../lib/firestoreService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface SpreadsheetLessonColumn {
  id: string;
  lessonLabel: string; // e.g. "L1", "L2", "L3", "L4"
  teacherAndDate: string; // e.g. "L1 6/8 DV", "10/8 M.Tâm", "DV 20/8"
  subSkill: string; // e.g. "Từ vựng và viết", "Viết Nghe", "Nghe 10", "Đọc 13"
  maxScore?: number;
  sessionNumber?: number;
  date?: string;
}

export interface SpreadsheetStudentRow {
  id: string;
  studentId?: string;
  no: number;
  fullName: string;
  email: string;
  hpStatus: string; // e.g. "CK 25/8", "CK 14/8", "CK 8/9", "3/9"
  hpHighlightColor?: 'default' | 'yellow' | 'pink' | 'green';
  scores: Record<string, string>; // columnId -> score value e.g. "9", "8", "x", "vắng", "start", "5"
  scoresHighlight?: Record<string, 'default' | 'yellow' | 'red' | 'green'>;
  note?: string;
}

export interface ClassSpreadsheetData {
  id: string;
  classId: string;
  classBanner: string; // e.g. "IELTS 88 (Mon-Thu 7.45-9.30) Phòng 4"
  tagText: string; // e.g. "INSPI"
  courseTuitionTag: string; // e.g. "5tr2"
  branch: string;
  columns: SpreadsheetLessonColumn[];
  rows: SpreadsheetStudentRow[];
  updatedAt: string;
}

interface Props {
  classes: ClassGroup[];
  students: Student[];
  attendanceRecords?: AttendanceRecord[];
  transactions?: TuitionTransaction[];
  initialClassId?: string;
  onOpenQuickTuition?: () => void;
}

// Default Seed Data that matches user's exact uploaded image
const DEFAULT_SAMPLE_SHEET: ClassSpreadsheetData = {
  id: 'sheet-ielts-88',
  classId: 'class-ielts-88',
  classBanner: 'IELTS 88 (Mon-Thu 7.45-9.30) Phòng 4',
  tagText: 'INSPI',
  courseTuitionTag: '5tr2',
  branch: 'Cơ sở 1 - Tô Hiệu',
  updatedAt: new Date().toISOString(),
  columns: [
    { id: 'c1', lessonLabel: 'L1', teacherAndDate: 'L1 6/8 DV', subSkill: 'Từ vựng và viết', maxScore: 10 },
    { id: 'c2', lessonLabel: 'L2', teacherAndDate: '10/8 M.Tâm', subSkill: 'Viết Nghe', maxScore: 10 },
    { id: 'c3', lessonLabel: 'L3', teacherAndDate: 'L3 DV', subSkill: 'Nghe 10', maxScore: 10 },
    { id: 'c4', lessonLabel: 'L4', teacherAndDate: 'M.Tâm', subSkill: 'Đọc 13', maxScore: 13 },
    { id: 'c5', lessonLabel: 'L4', teacherAndDate: 'M.Tâm', subSkill: 'Từ vựng 10', maxScore: 10 },
    { id: 'c6', lessonLabel: 'L5', teacherAndDate: 'DV 20/8', subSkill: 'Chuyên cần', maxScore: 10 },
    { id: 'c7', lessonLabel: 'L6', teacherAndDate: 'MTâm 24/8', subSkill: 'Đọc 11', maxScore: 11 },
    { id: 'c8', lessonLabel: 'L6', teacherAndDate: 'MTâm 24/8', subSkill: 'từ vựng 10', maxScore: 10 },
  ],
  rows: [
    { id: 'r1', no: 1, fullName: 'Nguyễn Sinh Toàn', email: 'toandung', hpStatus: 'CK 25/8', hpHighlightColor: 'default', scores: { c1: '9', c2: 'x', c3: '8', c4: '13', c5: '9', c6: 'x', c7: '10', c8: '10' } },
    { id: 'r2', no: 2, fullName: 'Đoàn Việt Hà', email: 'doanviet', hpStatus: 'CK 14/8', hpHighlightColor: 'default', scores: { c1: '8', c2: 'x', c3: '8', c4: '11', c5: '9.5', c6: 'x', c7: '9', c8: '9.5' } },
    { id: 'r3', no: 3, fullName: 'Phạm Lê Bảo Khánh', email: 'boichauti', hpStatus: 'CK 20/8', hpHighlightColor: 'default', scores: { c1: '7', c2: 'x', c3: '5', c4: '10', c5: '7.5', c6: 'x', c7: '10', c8: '8' }, scoresHighlight: { c3: 'yellow' } },
    { id: 'r4', no: 4, fullName: 'Nguyễn Minh Huyền', email: 'nminhhu', hpStatus: 'Ck 14/8', hpHighlightColor: 'default', scores: { c1: '7', c2: 'x', c3: '7', c4: '11', c5: '6', c6: 'x', c7: '10', c8: '10' } },
    { id: 'r5', no: 5, fullName: 'Hoàng Thế Vinh', email: 'hoangthe', hpStatus: 'CK 17/8', hpHighlightColor: 'default', scores: { c1: '8', c2: 'x', c3: '5', c4: '9', c5: '9.5', c6: 'x', c7: '9', c8: '9' }, scoresHighlight: { c3: 'yellow' } },
    { id: 'r6', no: 6, fullName: 'Vũ Nguyễn Bảo Phương', email: 'minhylud', hpStatus: 'CK 14/8', hpHighlightColor: 'default', scores: { c1: '8', c2: 'x', c3: '5', c4: '13', c5: '9', c6: 'x', c7: '11', c8: '9.5' }, scoresHighlight: { c3: 'yellow' } },
    { id: 'r7', no: 7, fullName: 'Nguyễn Việt Anh', email: 'nvanh20', hpStatus: 'CK 14/8', hpHighlightColor: 'default', scores: { c1: '9', c2: 'x', c3: '8', c4: '13', c5: '10', c6: 'x', c7: '9', c8: '10' } },
    { id: 'r8', no: 8, fullName: 'Nguyễn Hà Chi', email: 'Chih962', hpStatus: 'CK 25/8', hpHighlightColor: 'default', scores: { c1: '8', c2: 'x', c3: 'vắng', c4: '9', c5: '9', c6: 'x', c7: '8', c8: '10' } },
    { id: 'r9', no: 9, fullName: 'Hoàng Viết Nhật Minh', email: 'nhatminh', hpStatus: 'CK 15/8', hpHighlightColor: 'default', scores: { c1: '5', c2: 'x', c3: '7', c4: '10', c5: '5', c6: 'x', c7: '9', c8: '8' }, scoresHighlight: { c1: 'yellow', c5: 'yellow' } },
    { id: 'r10', no: 10, fullName: 'Trần Thị Kim Oanh', email: 'oanhtran', hpStatus: '3/9', hpHighlightColor: 'default', scores: { c1: '7', c2: 'x', c3: '6', c4: '8', c5: '8', c6: 'x', c7: '11', c8: '10' } },
    { id: 'r11', no: 11, fullName: 'Nguyễn Mạnh Trường Giang', email: 'nguynza', hpStatus: 'CK 28/8', hpHighlightColor: 'default', scores: { c1: '6', c2: 'x', c3: '8', c4: '12', c5: '9.5', c6: 'x', c7: '9', c8: '10' } },
    { id: 'r12', no: 12, fullName: 'Đào Hà Phương', email: 'annadao', hpStatus: 'CK 14/8', hpHighlightColor: 'default', scores: { c1: '7', c2: 'x', c3: '8', c4: '10', c5: '8', c6: 'x', c7: '9', c8: '9' } },
    { id: 'r13', no: 13, fullName: 'Trần Đình Khoa', email: 'kemi201', hpStatus: 'CK 27/8', hpHighlightColor: 'default', scores: { c1: '9', c2: 'x', c3: '9', c4: '11', c5: '9', c6: 'x', c7: '8', c8: '9' } },
    { id: 'r14', no: 14, fullName: 'Nguyễn Minh Phương', email: 'nguyenp', hpStatus: 'CK 17/8', hpHighlightColor: 'default', scores: { c1: '5', c2: 'x', c3: '5', c4: '12', c5: '6', c6: 'x', c7: '9', c8: '9' }, scoresHighlight: { c1: 'yellow', c3: 'yellow' } },
    { id: 'r15', no: 15, fullName: 'Nguyễn Ngọc Anh', email: 'ngocanh', hpStatus: 'CK 8/9', hpHighlightColor: 'yellow', scores: { c1: '', c2: 'start', c3: '6', c4: 'vắng', c5: '', c6: 'x', c7: '10', c8: '5' } },
    { id: 'r16', no: 16, fullName: 'Lê Ngọc Diệp', email: 'lengocdi', hpStatus: 'CK 25/8', hpHighlightColor: 'default', scores: { c1: '', c2: 'start', c3: 'vắng', c4: '11', c5: '9', c6: 'x', c7: '11', c8: '9' } },
    { id: 'r17', no: 17, fullName: 'Nguyễn Chí Bảo Khánh', email: 'khanhba', hpStatus: 'CK 15/8', hpHighlightColor: 'default', scores: { c1: '', c2: 'start', c3: '10', c4: '10', c5: '7.5', c6: 'x', c7: '8', c8: '9.5' } },
    { id: 'r18', no: 18, fullName: 'Trần Minh Đăng', email: '', hpStatus: 'CK 3/9 5tr', hpHighlightColor: 'pink', scores: { c1: '', c2: '', c3: '', c4: '8', c5: '7.5', c6: 'x', c7: '10', c8: '7' } },
  ],
};

// Helper to format short date "6/8", "14/8", etc.
const formatShortDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10);
      return `${day}/${month}`;
    }
  } catch (e) {
    // ignore
  }
  return dateStr;
};

export const ClassSpreadsheetGradebookModule: React.FC<Props> = ({
  classes,
  students,
  attendanceRecords = [],
  transactions = [],
  initialClassId,
  onOpenQuickTuition,
}) => {
  // Default selected class: use initialClassId, or first available class, or sample class
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (initialClassId) return initialClassId;
    if (classes && classes.length > 0) return classes[0].id;
    return 'class-ielts-88';
  });

  const [sheetData, setSheetData] = useState<ClassSpreadsheetData>(() => {
    const targetId = initialClassId || (classes && classes.length > 0 ? classes[0].id : 'class-ielts-88');
    const saved = localStorage.getItem(`idv_class_sheet_${targetId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_SAMPLE_SHEET;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isFreezeColumns, setIsFreezeColumns] = useState<boolean>(true);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);
  const [copySuccessToast, setCopySuccessToast] = useState(false);
  const [isAddingColumnModal, setIsAddingColumnModal] = useState(false);
  const [isEditingBannerModal, setIsEditingBannerModal] = useState(false);

  // New Column form state
  const [newColLesson, setNewColLesson] = useState('L7');
  const [newColTeacherDate, setNewColTeacherDate] = useState('28/8 DV');
  const [newColSubSkill, setNewColSubSkill] = useState('Nghe 10');
  const [newColMaxScore, setNewColMaxScore] = useState<number>(10);

  // Banner edit form state
  const [tempBanner, setTempBanner] = useState(sheetData.classBanner);
  const [tempTag, setTempTag] = useState(sheetData.tagText);
  const [tempTuitionTag, setTempTuitionTag] = useState(sheetData.courseTuitionTag);

  // Synchronize when initialClassId changes externally
  useEffect(() => {
    if (initialClassId && initialClassId !== selectedClassId) {
      setSelectedClassId(initialClassId);
    }
  }, [initialClassId]);

  // Core Builder Function: generates dynamic sheet from ClassGroup, Student[], AttendanceRecord[]
  const buildSheetForClass = (targetClassId: string, forceFreshSync: boolean = false): ClassSpreadsheetData => {
    if (targetClassId === 'class-ielts-88') {
      return DEFAULT_SAMPLE_SHEET;
    }

    const foundClass = classes.find((c) => c.id === targetClassId);
    if (!foundClass) {
      return DEFAULT_SAMPLE_SHEET;
    }

    // Load any saved custom overrides if not forcing a fresh sync
    let savedOverrides: ClassSpreadsheetData | null = null;
    if (!forceFreshSync) {
      const saved = localStorage.getItem(`idv_class_sheet_${targetClassId}`);
      if (saved) {
        try {
          savedOverrides = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }

    // 1. Get real enrolled students in this class
    const classStudents = students.filter(
      (s) => (s.classId === foundClass.id || s.className === foundClass.name) && s.status !== 'Đã nghỉ học'
    );

    // 2. Get real attendance and session records for this class
    const classAttendance = attendanceRecords.filter((r) => r.classId === foundClass.id);

    // Group attendance records by session (sessionNumber or date)
    const sessionMap = new Map<string, AttendanceRecord[]>();
    classAttendance.forEach((rec) => {
      const key = rec.sessionNumber ? `session_${rec.sessionNumber}` : `date_${rec.date}`;
      if (!sessionMap.has(key)) {
        sessionMap.set(key, []);
      }
      sessionMap.get(key)!.push(rec);
    });

    // Determine Columns
    let columns: SpreadsheetLessonColumn[] = [];

    if (savedOverrides && savedOverrides.columns && savedOverrides.columns.length > 0 && !forceFreshSync) {
      // Use preserved columns from previous edits
      columns = savedOverrides.columns;
    } else if (sessionMap.size > 0) {
      // Build columns from actual saved teaching sessions
      const sortedSessions = Array.from(sessionMap.entries()).sort(([, recsA], [, recsB]) => {
        const numA = recsA[0]?.sessionNumber || 0;
        const numB = recsB[0]?.sessionNumber || 0;
        if (numA !== numB) return numA - numB;
        return (recsA[0]?.date || '').localeCompare(recsB[0]?.date || '');
      });

      columns = sortedSessions.map(([key, recs], idx) => {
        const firstRec = recs[0];
        const sessNum = firstRec.sessionNumber || idx + 1;
        const shortDate = formatShortDate(firstRec.date);
        const teacherInitial = firstRec.teacherName
          ? firstRec.teacherName.split(' ').pop()
          : (foundClass.teacherName?.split(' ').pop() || 'GV');

        const skillText = firstRec.skillsTaught?.join(', ') || firstRec.skillTaught || 'Từ vựng & Viết';

        return {
          id: `col_sess_${sessNum}_${key}`,
          lessonLabel: `L${sessNum}`,
          teacherAndDate: `${shortDate ? shortDate + ' ' : ''}${teacherInitial}`,
          subSkill: skillText,
          maxScore: 10,
          sessionNumber: sessNum,
          date: firstRec.date,
        };
      });
    }

    // If still fewer than 4 columns, provide standard lesson templates so the sheet is complete
    if (columns.length === 0) {
      const teacherInit = foundClass.teacherName?.split(' ').pop() || 'DV';
      columns = [
        { id: 'c1', lessonLabel: 'L1', teacherAndDate: `L1 ${teacherInit}`, subSkill: 'Từ vựng & Viết', maxScore: 10 },
        { id: 'c2', lessonLabel: 'L2', teacherAndDate: `L2 ${teacherInit}`, subSkill: 'Viết & Nghe', maxScore: 10 },
        { id: 'c3', lessonLabel: 'L3', teacherAndDate: `L3 ${teacherInit}`, subSkill: 'Nghe 10', maxScore: 10 },
        { id: 'c4', lessonLabel: 'L4', teacherAndDate: `L4 ${teacherInit}`, subSkill: 'Đọc 13', maxScore: 13 },
      ];
    }

    // Determine Rows (Students)
    const rows: SpreadsheetStudentRow[] = (classStudents.length > 0 ? classStudents : []).map((st, idx) => {
      // Find matching saved row if exists
      const savedRow = savedOverrides?.rows?.find((r) => r.id === `row-${st.id}` || r.fullName.toLowerCase() === st.name.toLowerCase());

      // Compute tuition status from student / transactions
      let hpStatus = 'Chưa đóng';
      let hpHighlightColor: 'default' | 'yellow' | 'pink' | 'green' = 'default';

      // Check transaction logs for this student
      const stTx = transactions.find((t) => t.studentId === st.id || t.studentName?.toLowerCase() === st.name.toLowerCase());
      if (st.tuitionPaidDate) {
        hpStatus = `CK ${formatShortDate(st.tuitionPaidDate)}`;
      } else if (stTx) {
        hpStatus = `CK ${formatShortDate(stTx.date)}`;
      } else if (st.paidTuition && st.paidTuition > 0 && st.balanceOwed === 0) {
        hpStatus = `CK ${st.paidTuitionDate ? formatShortDate(st.paidTuitionDate) : 'Đã đóng'}`;
      } else if (st.balanceOwed && st.balanceOwed > 0) {
        hpStatus = `Nợ ${(st.balanceOwed / 1000000).toFixed(1)}tr`;
        hpHighlightColor = 'yellow';
      }

      // If user manually customized hpStatus before, preserve it
      if (savedRow && savedRow.hpStatus && !forceFreshSync) {
        hpStatus = savedRow.hpStatus;
        hpHighlightColor = savedRow.hpHighlightColor || hpHighlightColor;
      }

      // Compute scores for each column
      const scores: Record<string, string> = { ...(savedRow?.scores || {}) };
      const scoresHighlight: Record<string, 'default' | 'yellow' | 'red' | 'green'> = { ...(savedRow?.scoresHighlight || {}) };

      columns.forEach((col) => {
        // If already set manually and not forcing fresh sync, keep it
        if (!forceFreshSync && scores[col.id] !== undefined && scores[col.id] !== '') {
          return;
        }

        // Search attendance record for this student and session
        const rec = classAttendance.find(
          (r) =>
            r.studentId === st.id &&
            ((col.sessionNumber && r.sessionNumber === col.sessionNumber) ||
              (col.date && r.date === col.date) ||
              (r.sessionNumber && col.lessonLabel === `L${r.sessionNumber}`))
        );

        if (rec) {
          if (rec.score !== undefined && rec.score !== null && rec.score !== '') {
            scores[col.id] = String(rec.score);
            const num = parseFloat(String(rec.score));
            if (!isNaN(num) && num <= 5.5 && num > 0) {
              scoresHighlight[col.id] = 'yellow';
            }
          } else if (rec.skillScores && Object.keys(rec.skillScores).length > 0) {
            const vals = Object.values(rec.skillScores).filter((v) => v !== '' && v !== undefined);
            scores[col.id] = vals.join('/');
          } else if (rec.status === 'Có mặt') {
            scores[col.id] = 'x';
          } else if (rec.status === 'Đi muộn' || rec.status === 'Đi trễ') {
            scores[col.id] = 'trễ';
          } else if (rec.status?.includes('Nghỉ') || rec.status?.includes('vắng')) {
            scores[col.id] = 'vắng';
          }
        }
      });

      return {
        id: `row-${st.id}`,
        studentId: st.id,
        no: idx + 1,
        fullName: st.name,
        email: st.email ? st.email.split('@')[0] : (st.phone ? st.phone : ''),
        hpStatus: hpStatus,
        hpHighlightColor: hpHighlightColor,
        scores: scores,
        scoresHighlight: scoresHighlight,
      };
    });

    const tuitionFormatted = foundClass.tuitionFee ? `${(foundClass.tuitionFee / 1000000).toFixed(1)}tr` : '5tr2';
    const tagText = savedOverrides?.tagText || 'INSPI';

    return {
      id: `sheet-${foundClass.id}`,
      classId: foundClass.id,
      classBanner: savedOverrides?.classBanner || `${foundClass.name} (${foundClass.schedule || 'Lịch học linh hoạt'}) ${foundClass.room || 'Phòng 4'}`,
      tagText: tagText,
      courseTuitionTag: savedOverrides?.courseTuitionTag || tuitionFormatted,
      branch: foundClass.branch || 'Cơ sở 1 - Tô Hiệu',
      updatedAt: new Date().toISOString(),
      columns: columns,
      rows: rows.length > 0 ? rows : DEFAULT_SAMPLE_SHEET.rows,
    };
  };

  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => new Date().toLocaleTimeString('vi-VN'));

  // Real-time Cloud Database (Firestore onSnapshot) subscription across all 10 teachers, 2 assistants & management
  useEffect(() => {
    const docId = selectedClassId === 'class-ielts-88' ? 'sheet-ielts-88' : `sheet-${selectedClassId}`;
    const docRef = doc(db, 'class_spreadsheets', docId);

    setIsCloudSyncing(true);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setIsCloudSyncing(false);
        setLastSyncedTime(new Date().toLocaleTimeString('vi-VN'));
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as ClassSpreadsheetData;
          setSheetData(remoteData);
          setTempBanner(remoteData.classBanner);
          setTempTag(remoteData.tagText);
          setTempTuitionTag(remoteData.courseTuitionTag);
          try {
            localStorage.setItem(`idv_class_sheet_${selectedClassId}`, JSON.stringify(remoteData));
          } catch (e) {
            console.warn(e);
          }
        } else {
          // If document does not exist in Firestore yet, build dynamically and push to Firestore for all users
          const built = buildSheetForClass(selectedClassId, false);
          setSheetData(built);
          setTempBanner(built.classBanner);
          setTempTag(built.tagText);
          setTempTuitionTag(built.courseTuitionTag);
          saveDocument('class_spreadsheets', built).catch((err) => {
            console.error('Initial save of spreadsheet to Firestore failed:', err);
          });
        }
      },
      (error) => {
        setIsCloudSyncing(false);
        console.error('Firestore real-time subscription error for spreadsheet:', error);
        // Fallback to local builder if offline or permission error
        const built = buildSheetForClass(selectedClassId, false);
        setSheetData(built);
      }
    );

    return () => unsubscribe();
  }, [selectedClassId]);

  // Helper to persist sheet state to both Firestore and LocalStorage
  const persistSheet = (updated: ClassSpreadsheetData) => {
    setSheetData(updated);
    try {
      localStorage.setItem(`idv_class_sheet_${selectedClassId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    saveDocument('class_spreadsheets', updated).catch((err) => {
      console.error('Failed to sync spreadsheet changes to Firestore:', err);
    });
  };

  // Resync explicitly from teacher attendance records
  const handleResyncFromTeacherRecords = () => {
    const synced = buildSheetForClass(selectedClassId, true);
    persistSheet(synced);
    setTempBanner(synced.classBanner);
    setTempTag(synced.tagText);
    setTempTuitionTag(synced.courseTuitionTag);
    setSyncSuccessToast(true);
    setTimeout(() => setSyncSuccessToast(false), 3000);
  };

  // Handle cell edit
  const handleCellChange = (rowId: string, field: 'fullName' | 'email' | 'hpStatus', value: string) => {
    const updated: ClassSpreadsheetData = {
      ...sheetData,
      updatedAt: new Date().toISOString(),
      rows: sheetData.rows.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
    };
    persistSheet(updated);
  };

  const handleScoreChange = (rowId: string, colId: string, value: string) => {
    const updated: ClassSpreadsheetData = {
      ...sheetData,
      updatedAt: new Date().toISOString(),
      rows: sheetData.rows.map((r) => {
        if (r.id !== rowId) return r;
        const numVal = parseFloat(value);
        const shouldYellow = !isNaN(numVal) && numVal <= 5.5 && numVal > 0;
        const newHighlights = { ...(r.scoresHighlight || {}) };
        if (shouldYellow) {
          newHighlights[colId] = 'yellow';
        } else {
          delete newHighlights[colId];
        }

        return {
          ...r,
          scores: { ...r.scores, [colId]: value },
          scoresHighlight: newHighlights,
        };
      }),
    };
    persistSheet(updated);
  };

  const handleHpColorCycle = (rowId: string) => {
    const colors: ('default' | 'yellow' | 'pink' | 'green')[] = ['default', 'yellow', 'pink', 'green'];
    const updated: ClassSpreadsheetData = {
      ...sheetData,
      updatedAt: new Date().toISOString(),
      rows: sheetData.rows.map((r) => {
        if (r.id !== rowId) return r;
        const currIdx = colors.indexOf(r.hpHighlightColor || 'default');
        const nextColor = colors[(currIdx + 1) % colors.length];
        return { ...r, hpHighlightColor: nextColor };
      }),
    };
    persistSheet(updated);
  };

  // Add Row
  const handleAddStudentRow = () => {
    const newNo = sheetData.rows.length + 1;
    const newRow: SpreadsheetStudentRow = {
      id: `row-${Date.now()}`,
      no: newNo,
      fullName: `Học viên mới ${newNo}`,
      email: '',
      hpStatus: 'CK ...',
      hpHighlightColor: 'default',
      scores: {},
    };
    const updated: ClassSpreadsheetData = {
      ...sheetData,
      updatedAt: new Date().toISOString(),
      rows: [...sheetData.rows, newRow],
    };
    persistSheet(updated);
  };

  // Delete Row
  const handleDeleteRow = (rowId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa học viên này khỏi bảng điểm?')) return;
    const remaining = sheetData.rows.filter((r) => r.id !== rowId);
    const renumbered = remaining.map((r, idx) => ({ ...r, no: idx + 1 }));
    const updated: ClassSpreadsheetData = {
      ...sheetData,
      updatedAt: new Date().toISOString(),
      rows: renumbered,
    };
    persistSheet(updated);
  };

  // Add Column (Lesson)
  const handleAddColumn = () => {
    if (!newColLesson.trim()) return;
    const newCol: SpreadsheetLessonColumn = {
      id: `c_${Date.now()}`,
      lessonLabel: newColLesson.trim(),
      teacherAndDate: newColTeacherDate.trim(),
      subSkill: newColSubSkill.trim(),
      maxScore: newColMaxScore || 10,
    };
    const updated: ClassSpreadsheetData = {
      ...sheetData,
      updatedAt: new Date().toISOString(),
      columns: [...sheetData.columns, newCol],
    };
    persistSheet(updated);
    setIsAddingColumnModal(false);
  };

  // Delete Column
  const handleDeleteColumn = (colId: string) => {
    if (!window.confirm('Xóa cột buổi học này khỏi bảng?')) return;
    const updated: ClassSpreadsheetData = {
      ...sheetData,
      updatedAt: new Date().toISOString(),
      columns: sheetData.columns.filter((c) => c.id !== colId),
    };
    persistSheet(updated);
  };

  // Save to LocalStorage & Cloud
  const handleSaveSheet = () => {
    const updated = {
      ...sheetData,
      updatedAt: new Date().toISOString(),
    };
    persistSheet(updated);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  // Save Banner changes
  const handleSaveBanner = () => {
    const updated: ClassSpreadsheetData = {
      ...sheetData,
      classBanner: tempBanner,
      tagText: tempTag,
      courseTuitionTag: tempTuitionTag,
      updatedAt: new Date().toISOString(),
    };
    persistSheet(updated);
    setIsEditingBannerModal(false);
  };

  // Copy to Google Sheets (TSV format)
  const handleCopyGoogleSheets = async () => {
    const lines: string[] = [];

    // Line 1: Header Banner
    const row1 = [sheetData.tagText, sheetData.classBanner, '', ''];
    sheetData.columns.forEach((c) => row1.push(c.lessonLabel));
    lines.push(row1.join('\t'));

    // Line 2: Sub-headers (No, Full name, Email, HP, then Teacher/Date)
    const row2 = ['No.', 'Full name', 'Email', 'HP'];
    sheetData.columns.forEach((c) => row2.push(c.teacherAndDate));
    lines.push(row2.join('\t'));

    // Line 3: Third sub-headers (blank, blank, blank, 5tr2, then subskills)
    const row3 = ['', '', '', sheetData.courseTuitionTag];
    sheetData.columns.forEach((c) => row3.push(c.subSkill));
    lines.push(row3.join('\t'));

    // Data rows
    sheetData.rows.forEach((r) => {
      const row = [r.no, r.fullName, r.email, r.hpStatus];
      sheetData.columns.forEach((c) => {
        row.push(r.scores[c.id] || '');
      });
      lines.push(row.join('\t'));
    });

    const tsvContent = lines.join('\n');
    try {
      await navigator.clipboard.writeText(tsvContent);
      setCopySuccessToast(true);
      setTimeout(() => setCopySuccessToast(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Export CSV (Excel compatible with UTF-8 BOM)
  const handleExportCSV = () => {
    const lines: string[] = [];

    // Line 1
    const row1 = [`"${sheetData.tagText}"`, `"${sheetData.classBanner}"`, '', ''];
    sheetData.columns.forEach((c) => row1.push(`"${c.lessonLabel}"`));
    lines.push(row1.join('\t'));

    // Line 2
    const row2 = ['No.', 'Full name', 'Email', 'HP'];
    sheetData.columns.forEach((c) => row2.push(`"${c.teacherAndDate}"`));
    lines.push(row2.join('\t'));

    // Line 3
    const row3 = ['', '', '', `"${sheetData.courseTuitionTag}"`];
    sheetData.columns.forEach((c) => row3.push(`"${c.subSkill}"`));
    lines.push(row3.join('\t'));

    // Data rows
    sheetData.rows.forEach((r) => {
      const row = [r.no, `"${r.fullName}"`, `"${r.email}"`, `"${r.hpStatus}"`];
      sheetData.columns.forEach((c) => {
        row.push(`"${r.scores[c.id] || ''}"`);
      });
      lines.push(row.join('\t'));
    });

    const bom = '\uFEFF';
    const csvContent = bom + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bang_Diem_${sheetData.classBanner.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter rows by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return sheetData.rows;
    const q = searchQuery.toLowerCase();
    return sheetData.rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.hpStatus.toLowerCase().includes(q)
    );
  }, [sheetData.rows, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Toast Notifications */}
      {isSavedToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Đã lưu bảng điểm &amp; học phí của lớp lên hệ thống thành công!</span>
        </div>
      )}

      {syncSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-purple-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <RefreshCw className="w-4 h-4 text-purple-300 animate-spin" />
          <span>Đã đồng bộ học viên, điểm số và học phí từ nhật ký các buổi dạy của giáo viên!</span>
        </div>
      )}

      {copySuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-blue-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <Copy className="w-4 h-4 text-blue-300" />
          <span>Đã sao chép! Bạn chỉ cần bấm Ctrl+V để dán trực tiếp vào Google Sheets.</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Sổ Bảng Điểm &amp; Học Phí Từng Buổi
              </h2>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Chuẩn Google Sheets IELTS Dương Vũ</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi danh sách lớp, Gmail, tình trạng học phí và điểm số chi tiết từng buổi học (L1, L2, L3...)
            </p>
            {/* Real-time Multi-user sync badge */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className={`w-2 h-2 rounded-full ${isCloudSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                <span>{isCloudSyncing ? 'Đang đồng bộ dữ liệu...' : 'Đồng bộ trực tiếp Cloud (10 GV • 2 Trợ lý • Quản lý)'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Cập nhật lúc: {lastSyncedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Class Picker */}
          <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl">
            <Layers className="w-4 h-4 text-purple-700 shrink-0" />
            <span className="text-xs font-extrabold text-purple-900">Lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-950 px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="class-ielts-88">🌟 IELTS 88 (Mon-Thu 7.45-9.30) - Lớp mẫu</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code}) - {c.branch || 'Kiến An'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleResyncFromTeacherRecords}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
            title="Lấy dữ liệu danh sách học sinh từ tạo lớp và các buổi chấm điểm lưu của giáo viên"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Đồng bộ từ buổi dạy GV</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSheet}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
            title="Lưu toàn bộ thay đổi vào cơ sở dữ liệu"
          >
            <Save className="w-4 h-4" />
            <span>Lưu bảng điểm</span>
          </button>

          <button
            type="button"
            onClick={handleCopyGoogleSheets}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
            title="Sao chép toàn bộ bảng điểm để dán vào Google Sheets"
          >
            <Copy className="w-4 h-4" />
            <span>Dán Google Sheets</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            title="Tải về file Excel CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
            title="In bảng điểm khổ ngang"
          >
            <Printer className="w-4 h-4" />
            <span>In bảng</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Workspace Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-md overflow-hidden">
        
        {/* Spreadsheet Toolbar */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Search filter */}
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên học sinh, gmail, học phí..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="button"
              onClick={handleAddStudentRow}
              className="flex items-center gap-1 px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm học viên</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingColumnModal(true)}
              className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm buổi học (L)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditingBannerModal(true)}
              className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 rounded-lg shadow-2xs transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-purple-600" />
              <span>Đổi tiêu đề lớp / Học phí</span>
            </button>

            {/* Freeze Button */}
            <button
              type="button"
              onClick={() => setIsFreezeColumns(!isFreezeColumns)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                isFreezeColumns
                  ? 'bg-purple-100 text-purple-900 border-purple-400 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
              title="Cố định 3 hàng tiêu đề trên cùng và 2 cột STT, Tên học sinh khi cuộn trang"
            >
              <Pin className={`w-3.5 h-3.5 ${isFreezeColumns ? 'text-purple-700 fill-purple-700' : 'text-slate-400'}`} />
              <span>Freeze STT, Tên & 3 hàng đầu: {isFreezeColumns ? 'BẬT' : 'TẮT'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-amber-200 border border-amber-400 rounded-xs inline-block"></span>
              <span>Điểm cần chú ý (&le; 5.5) / Học phí cảnh báo</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-pink-200 border border-pink-400 rounded-xs inline-block"></span>
              <span>Đóng một phần / Ưu đãi</span>
            </span>
            <span className="font-bold text-slate-800">
              Sĩ số: {sheetData.rows.length} học viên
            </span>
          </div>
        </div>

        {/* SPREADSHEET TABLE (EXACT GOOGLE SHEETS REPLICATION) */}
        <div className="overflow-auto max-h-[75vh] select-text relative border-t border-slate-300">
          <table className="w-full border-collapse text-xs font-sans text-slate-900 border-spacing-0">
            
            {/* ROW 1: TOP BANNER (INSPI | Class Name / Schedule | L1 | L2 | L3 | L4 ...) */}
            <thead>
              <tr className="bg-white h-[38px]">
                {/* Cell A1: INSPI Tag */}
                <th
                  className={`border border-slate-400 py-1.5 px-2 text-center font-black text-emerald-900 bg-emerald-100 text-xs w-12 min-w-[48px] max-w-[48px] ${
                    isFreezeColumns ? 'sticky left-0 top-0 z-40' : 'sticky top-0 z-30'
                  }`}
                >
                  {sheetData.tagText}
                </th>

                {/* Cell B1: Class Banner */}
                {isFreezeColumns ? (
                  <>
                    <th
                      className="border border-slate-400 py-1.5 px-3 text-left font-black text-emerald-900 text-xs bg-emerald-100 min-w-[190px] max-w-[210px] truncate sticky left-12 top-0 z-40 border-r-2 border-r-slate-400 shadow-[3px_0_5px_-2px_rgba(0,0,0,0.15)]"
                      title={sheetData.classBanner}
                    >
                      <span className="truncate block">{sheetData.classBanner}</span>
                    </th>
                    <th
                      colSpan={2}
                      className="border border-slate-400 py-1.5 px-3 text-left font-semibold text-emerald-800 text-[11px] bg-emerald-50 min-w-[230px] sticky top-0 z-30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{sheetData.branch || 'Lịch học'}</span>
                        <span className="text-[10px] text-slate-500 font-normal italic">
                          (Click ô để sửa)
                        </span>
                      </div>
                    </th>
                  </>
                ) : (
                  <th
                    colSpan={3}
                    className="border border-slate-400 py-1.5 px-4 text-left font-black text-emerald-800 text-sm tracking-tight bg-emerald-50 sticky top-0 z-30"
                  >
                    <div className="flex items-center justify-between">
                      <span>{sheetData.classBanner}</span>
                      <span className="text-[10px] text-slate-500 font-normal italic">
                        (Nhấp vào bất kỳ ô nào bên dưới để sửa trực tiếp)
                      </span>
                    </div>
                  </th>
                )}

                {/* HÀNG 1: Lessons L1, L2, L3, L4, L5, L6... */}
                {sheetData.columns.map((col) => (
                  <th
                    key={col.id}
                    className="border border-slate-400 py-1.5 px-2 text-center font-black text-slate-900 bg-slate-200 min-w-[85px] sticky top-0 z-30"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{col.lessonLabel}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteColumn(col.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 rounded-sm"
                        title="Xóa cột buổi học này"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </th>
                ))}

                <th className="border border-slate-400 py-1.5 px-2 text-center bg-slate-200 w-10 sticky top-0 z-30 font-bold text-slate-600">
                  Xóa
                </th>
              </tr>

              {/* HÀNG 2: TÊN GIÁO VIÊN VÀ NGÀY DẠY (No. | Full name | Email | HP | Date + Teacher) */}
              <tr className="bg-white font-black text-slate-900 h-[34px]">
                <th
                  className={`border border-slate-400 py-1.5 px-2 text-center bg-slate-200 font-black w-12 min-w-[48px] ${
                    isFreezeColumns ? 'sticky left-0 top-[38px] z-40' : 'sticky top-[38px] z-30'
                  }`}
                >
                  No.
                </th>
                <th
                  className={`border border-slate-400 py-1.5 px-3 text-left bg-slate-200 font-black ${
                    isFreezeColumns
                      ? 'sticky left-12 top-[38px] z-40 min-w-[190px] border-r-2 border-r-slate-400 shadow-[3px_0_5px_-2px_rgba(0,0,0,0.15)]'
                      : 'min-w-[180px] sticky top-[38px] z-30'
                  }`}
                >
                  Full name
                </th>
                <th className="border border-slate-400 py-1.5 px-3 text-left bg-slate-100 font-black text-slate-900 min-w-[130px] sticky top-[38px] z-30">
                  Email
                </th>
                <th className="border border-slate-400 py-1.5 px-3 text-center bg-slate-100 font-black text-slate-900 min-w-[100px] sticky top-[38px] z-30">
                  HP
                </th>

                {/* TÊN GIÁO VIÊN & NGÀY */}
                {sheetData.columns.map((col) => (
                  <th
                    key={`th2-${col.id}`}
                    className="border border-slate-400 py-1.5 px-2 text-center bg-slate-100 font-black text-slate-900 sticky top-[38px] z-30"
                  >
                    {col.teacherAndDate}
                  </th>
                ))}

                <th className="border border-slate-400 py-1.5 px-2 text-center bg-slate-100 sticky top-[38px] z-30"></th>
              </tr>

              {/* HÀNG 3: TÊN KĨ NĂNG / SUB-TESTS (Blank | Blank | Blank | 5tr2 | Skills / Sub-tests) */}
              <tr className="bg-white font-bold text-slate-800 h-[34px]">
                <th
                  className={`border border-slate-400 py-1.5 px-2 text-center bg-slate-100 w-12 min-w-[48px] ${
                    isFreezeColumns ? 'sticky left-0 top-[72px] z-40' : 'sticky top-[72px] z-30'
                  }`}
                ></th>
                <th
                  className={`border border-slate-400 py-1.5 px-3 text-left bg-slate-100 text-[10px] text-slate-600 font-bold ${
                    isFreezeColumns
                      ? 'sticky left-12 top-[72px] z-40 min-w-[190px] border-r-2 border-r-slate-400 shadow-[3px_0_5px_-2px_rgba(0,0,0,0.15)]'
                      : 'min-w-[180px] sticky top-[72px] z-30'
                  }`}
                >
                  {isFreezeColumns ? 'Học viên (Cố định)' : ''}
                </th>
                <th className="border border-slate-400 py-1.5 px-3 text-left bg-slate-100 min-w-[130px] sticky top-[72px] z-30"></th>
                
                {/* Course Tuition Tag (e.g. 5tr2) */}
                <th className="border border-slate-400 py-1.5 px-3 text-center font-black text-slate-900 bg-slate-200 min-w-[100px] sticky top-[72px] z-30">
                  {sheetData.courseTuitionTag}
                </th>

                {/* TÊN KĨ NĂNG / SUB-SKILLS */}
                {sheetData.columns.map((col) => (
                  <th
                    key={`th3-${col.id}`}
                    className="border border-slate-400 py-1.5 px-2 text-center bg-slate-100 text-[11px] font-bold text-slate-800 sticky top-[72px] z-30"
                  >
                    {col.subSkill}
                  </th>
                ))}

                <th className="border border-slate-400 py-1.5 px-2 text-center bg-slate-100 sticky top-[72px] z-30"></th>
              </tr>
            </thead>

            {/* SPREADSHEET BODY (STUDENT ROWS) */}
            <tbody>
              {filteredRows.map((row) => {
                // HP Background styling
                let hpBgClass = 'bg-white hover:bg-slate-50';
                if (row.hpHighlightColor === 'yellow') {
                  hpBgClass = 'bg-yellow-300 font-black text-slate-950';
                } else if (row.hpHighlightColor === 'pink') {
                  hpBgClass = 'bg-pink-100 font-black text-pink-950';
                } else if (row.hpHighlightColor === 'green') {
                  hpBgClass = 'bg-emerald-100 font-black text-emerald-950';
                }

                return (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Col 1: No. */}
                    <td
                      className={`border border-slate-300 py-1.5 px-2 text-center font-semibold text-slate-700 bg-slate-50 w-12 min-w-[48px] ${
                        isFreezeColumns ? 'sticky left-0 z-20' : ''
                      }`}
                    >
                      {row.no}
                    </td>

                    {/* Col 2: Full Name (Inline Editable) */}
                    <td
                      className={`border border-slate-300 p-0 ${
                        isFreezeColumns
                          ? 'sticky left-12 z-20 min-w-[190px] bg-white group-hover:bg-slate-50 border-r-2 border-r-slate-400 shadow-[3px_0_5px_-2px_rgba(0,0,0,0.15)]'
                          : 'min-w-[180px] bg-white'
                      }`}
                    >
                      <input
                        type="text"
                        value={row.fullName}
                        onChange={(e) => handleCellChange(row.id, 'fullName', e.target.value)}
                        className="w-full h-full py-1.5 px-3 bg-transparent font-bold text-slate-900 focus:bg-amber-50 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </td>

                    {/* Col 3: Email (Inline Editable) */}
                    <td className="border border-slate-300 p-0 min-w-[130px] bg-white">
                      <input
                        type="text"
                        value={row.email}
                        placeholder="gmail..."
                        onChange={(e) => handleCellChange(row.id, 'email', e.target.value)}
                        className="w-full h-full py-1.5 px-2.5 bg-transparent text-slate-700 font-medium focus:bg-amber-50 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </td>

                    {/* Col 4: HP (Học Phí - Inline Editable + Click to Toggle Color Highlight) */}
                    <td className={`border border-slate-300 p-0 text-center ${hpBgClass} min-w-[100px]`}>
                      <div className="flex items-center h-full">
                        <input
                          type="text"
                          value={row.hpStatus}
                          onChange={(e) => handleCellChange(row.id, 'hpStatus', e.target.value)}
                          className="w-full h-full py-1.5 px-2 text-center font-extrabold bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleHpColorCycle(row.id)}
                          className="opacity-0 group-hover:opacity-100 text-[10px] px-1 text-slate-400 hover:text-slate-800 transition-opacity"
                          title="Đổi màu ô học phí (Vàng / Hồng / Xanh / Mặc định)"
                        >
                          🎨
                        </button>
                      </div>
                    </td>

                    {/* Columns for each lesson score */}
                    {sheetData.columns.map((col) => {
                      const scoreVal = row.scores[col.id] || '';
                      const isYellow = row.scoresHighlight?.[col.id] === 'yellow';

                      let cellBg = 'bg-white';
                      if (isYellow) {
                        cellBg = 'bg-amber-100/90 font-black text-amber-950';
                      } else if (scoreVal.toLowerCase() === 'vắng') {
                        cellBg = 'bg-rose-50 text-rose-700 font-extrabold';
                      } else if (scoreVal.toLowerCase() === 'start') {
                        cellBg = 'bg-blue-50 text-blue-700 font-extrabold';
                      } else if (scoreVal.toLowerCase() === 'x') {
                        cellBg = 'text-slate-500 font-medium';
                      }

                      return (
                        <td
                          key={`cell-${row.id}-${col.id}`}
                          className={`border border-slate-300 p-0 text-center ${cellBg}`}
                        >
                          <input
                            type="text"
                            value={scoreVal}
                            onChange={(e) => handleScoreChange(row.id, col.id, e.target.value)}
                            className="w-full h-full py-1.5 px-1 text-center font-bold bg-transparent focus:bg-amber-50 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </td>
                      );
                    })}

                    {/* Delete row action */}
                    <td className="border border-slate-300 py-1 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row.id)}
                        className="text-slate-300 hover:text-rose-600 transition-colors p-1 rounded-sm"
                        title="Xóa dòng học sinh này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={sheetData.columns.length + 5}
                    className="py-8 text-center text-slate-400 italic"
                  >
                    Không tìm thấy học viên phù hợp. Bấm &quot;Thêm học viên&quot; để thêm mới.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guide & Tips Section */}
      <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-purple-950">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-purple-200 text-purple-900 shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-purple-950 text-sm">
              Hướng Dẫn Sử Dụng Bảng Điểm &amp; Học Phí Google Sheets
            </h4>
            <p className="text-purple-800">
              • <strong>Sửa trực tiếp:</strong> Bấm vào bất kỳ ô nào để nhập điểm, sửa Gmail hoặc sửa ngày đóng học phí.
              <br />
              • <strong>Tô màu thông minh:</strong> Các điểm &le; 5.5 sẽ tự động được đánh dấu màu vàng để giáo viên dễ theo dõi học viên cần phụ đạo.
              <br />
              • <strong>Đổi màu ô Học phí:</strong> Di chuột vào ô học phí và bấm icon 🎨 để đổi màu highlight vàng/hồng (như CK 8/9, CK 3/9 5tr trong sổ).
              <br />
              • <strong>Đồng bộ Google Sheets:</strong> Bấm nút <strong>&quot;Dán Google Sheets&quot;</strong> rồi mở file Sheets bất kỳ và nhấn <code>Ctrl + V</code>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveSheet}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs shrink-0 self-end md:self-center"
        >
          Lưu tất cả thay đổi
        </button>
      </div>

      {/* MODAL: THÊM BUỔI HỌC (ADD LESSON COLUMN) */}
      {isAddingColumnModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-black text-slate-900">Thêm Cột Buổi Học Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingColumnModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  1. Tên buổi học (Header Hàng 1) <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: L7, L8, L9..."
                  value={newColLesson}
                  onChange={(e) => setNewColLesson(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  2. Ngày học &amp; Giáo viên (Header Hàng 2):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 28/8 DV, 30/8 M.Tâm, L7 DV..."
                  value={newColTeacherDate}
                  onChange={(e) => setNewColTeacherDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  3. Nội dung kiểm tra / Kỹ năng (Header Hàng 3):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nghe 10, Đọc 13, Từ vựng và viết..."
                  value={newColSubSkill}
                  onChange={(e) => setNewColSubSkill(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Thang điểm tối đa:</label>
                <input
                  type="number"
                  value={newColMaxScore}
                  onChange={(e) => setNewColMaxScore(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAddingColumnModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddColumn}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Xác nhận thêm cột
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SỬA TIÊU ĐỀ LỚP & HỌC PHÍ BANNER */}
      {isEditingBannerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-black text-slate-900">Tùy Chỉnh Tiêu Đề Bảng Điểm</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingBannerModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Logo / Ký hiệu góc trái:</label>
                <input
                  type="text"
                  value={tempTag}
                  onChange={(e) => setTempTag(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tên lớp &amp; Lịch học &amp; Phòng học:
                </label>
                <input
                  type="text"
                  value={tempBanner}
                  onChange={(e) => setTempBanner(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ký hiệu Mức học phí (Ô HP):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 5tr2, 14tr5, 6tr8..."
                  value={tempTuitionTag}
                  onChange={(e) => setTempTuitionTag(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditingBannerModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveBanner}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Lưu cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
