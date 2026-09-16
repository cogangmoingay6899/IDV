import { Student, ClassGroup, TuitionTransaction } from '../types';

export interface StudentPaymentArchiveRow {
  stt: number;
  classCode: string;
  className: string;
  branch: string;
  teacherName: string;
  studentCode: string;
  studentName: string;
  studentPhone: string;
  parentName: string;
  parentPhone: string;
  courseTuitionFee: number;
  tuitionPaid: number;
  balanceOwed: number;
  tuitionStatus: string;
  paymentDates: string; // List of exact payment dates, e.g. "12/09/2026 (14,500,000đ - Chuyển khoản QR)"
  paymentReceipts: string; // List of receipt codes
  paymentMethods: string;
  lastPaymentDate: string;
  collectorName: string;
  note: string;
}

export interface ClassArchiveGroup {
  classInfo: ClassGroup;
  students: StudentPaymentArchiveRow[];
}

export function buildMonthlyArchiveData(
  students: Student[],
  classes: ClassGroup[],
  transactions: TuitionTransaction[],
  selectedMonth: string, // 'all' or 'YYYY-MM' (e.g. '2026-09')
  selectedBranch: string = 'all',
  selectedClassId: string = 'all'
): {
  rows: StudentPaymentArchiveRow[];
  totalExpectedTuition: number;
  totalPaidTuition: number;
  totalDebt: number;
  totalTransactionsInPeriod: number;
  classGrouped: Record<string, ClassArchiveGroup>;
} {
  // Filter classes
  const filteredClasses = classes.filter((c) => {
    if (selectedBranch !== 'all' && c.branch !== selectedBranch) return false;
    if (selectedClassId !== 'all' && c.id !== selectedClassId) return false;
    return true;
  });

  const classMap = new Map<string, ClassGroup>();
  classes.forEach((c) => classMap.set(c.id, c));

  const rows: StudentPaymentArchiveRow[] = [];
  const classGrouped: Record<string, ClassArchiveGroup> = {};

  let totalExpectedTuition = 0;
  let totalPaidTuition = 0;
  let totalDebt = 0;
  let totalTransactionsInPeriod = 0;
  let sttCounter = 1;

  filteredClasses.forEach((cls) => {
    const classStudents = students.filter(
      (s) => s.classId === cls.id || s.className === cls.name
    );

    if (!classGrouped[cls.id]) {
      classGrouped[cls.id] = {
        classInfo: cls,
        students: [],
      };
    }

    classStudents.forEach((student) => {
      // Find all transactions for this student
      const studentTxs = transactions.filter(
        (tx) =>
          tx.status === 'Thành công' &&
          (tx.studentId === student.id ||
            tx.studentCode === student.code ||
            (tx.studentName.toLowerCase() === student.name.toLowerCase() &&
              (tx.classId === cls.id || tx.className === cls.name)))
      );

      // Filter transactions by month if specific month selected
      const monthTxs = studentTxs.filter((tx) => {
        if (selectedMonth === 'all') return true;
        // Parse transaction date: could be "12/09/2026 14:30" or "2026-09-12" or "12/09/2026"
        if (tx.date.includes('/')) {
          const parts = tx.date.split(' ')[0].split('/');
          if (parts.length === 3) {
            // parts: [DD, MM, YYYY]
            const txMonth = `${parts[2]}-${parts[1].padStart(2, '0')}`;
            return txMonth === selectedMonth;
          }
        }
        return tx.date.startsWith(selectedMonth);
      });

      const fee = student.tuitionPayable || student.courseTuitionFee || cls.tuitionFee || 14500000;
      const debt = student.balanceOwed !== undefined ? student.balanceOwed : Math.max(0, fee);
      const studentTotalPaid = Math.max(0, fee - debt);

      // Format payment details string
      let paymentDatesStr = '';
      let paymentReceiptsStr = '';
      let paymentMethodsStr = '';
      let lastDateStr = student.tuitionPaidDate || 'Chưa đóng';
      let collectorStr = '';

      if (studentTxs.length > 0) {
        paymentDatesStr = studentTxs
          .map(
            (tx) =>
              `${tx.date} (${new Intl.NumberFormat('vi-VN').format(tx.amount)}đ - ${tx.paymentMethod})`
          )
          .join('; ');

        paymentReceiptsStr = studentTxs.map((tx) => tx.receiptCode).join(', ');
        paymentMethodsStr = Array.from(new Set(studentTxs.map((tx) => tx.paymentMethod))).join(', ');
        collectorStr = Array.from(new Set(studentTxs.map((tx) => tx.collectorName))).join(', ');
        lastDateStr = studentTxs[studentTxs.length - 1].date;
      } else if (student.tuitionPaidDate) {
        paymentDatesStr = `${student.tuitionPaidDate} (${new Intl.NumberFormat('vi-VN').format(studentTotalPaid)}đ)`;
      } else {
        paymentDatesStr = 'Chưa có giao dịch';
      }

      // Calculate paid in selected month (if month filter active)
      const paidAmount =
        selectedMonth === 'all'
          ? studentTotalPaid
          : monthTxs.reduce((sum, t) => sum + t.amount, 0);

      totalExpectedTuition += fee;
      totalPaidTuition += paidAmount;
      totalDebt += debt;
      totalTransactionsInPeriod += monthTxs.length;

      const archiveRow: StudentPaymentArchiveRow = {
        stt: sttCounter++,
        classCode: cls.code,
        className: cls.name,
        branch: cls.branch || 'Cơ sở 1 - Tô Hiệu',
        teacherName: cls.teacherName || 'Chưa phân công',
        studentCode: student.code || `HV-${student.id.slice(0, 5)}`,
        studentName: student.name,
        studentPhone: student.phone || 'Chưa có',
        parentName: student.parentName || student.name,
        parentPhone: student.parentPhone || student.phone || 'Chưa có',
        courseTuitionFee: fee,
        tuitionPaid: studentTotalPaid,
        balanceOwed: debt,
        tuitionStatus: student.tuitionStatus || (debt === 0 ? 'Đã đóng đủ' : 'Còn nợ'),
        paymentDates: paymentDatesStr,
        paymentReceipts: paymentReceiptsStr,
        paymentMethods: paymentMethodsStr,
        lastPaymentDate: lastDateStr,
        collectorName: collectorStr || 'Kế toán trung tâm',
        note: student.tuitionPromiseNote || student.tuitionReminderNote || '',
      };

      rows.push(archiveRow);
      classGrouped[cls.id].students.push(archiveRow);
    });
  });

  return {
    rows,
    totalExpectedTuition,
    totalPaidTuition,
    totalDebt,
    totalTransactionsInPeriod,
    classGrouped,
  };
}

/**
 * Download CSV with UTF-8 BOM for Microsoft Excel compatibility in Vietnamese
 */
export function exportMonthlyTuitionToCSV(
  rows: StudentPaymentArchiveRow[],
  monthLabel: string
) {
  const headers = [
    'STT',
    'Mã lớp',
    'Tên lớp học',
    'Cơ sở',
    'Giáo viên phụ trách',
    'Mã học viên',
    'Họ và tên học viên',
    'SĐT học viên',
    'Phụ huynh',
    'SĐT phụ huynh',
    'Mức học phí quy định (VND)',
    'Đã nộp (VND)',
    'Còn nợ (VND)',
    'Trạng thái học phí',
    'Lịch sử & Ngày đóng học phí chi tiết',
    'Mã phiếu thu/Biên lai',
    'Hình thức thanh toán',
    'Ngày nộp gần nhất',
    'Người thu tiền',
    'Ghi chú',
  ];

  const csvRows = [headers.join('\t')];

  rows.forEach((r) => {
    const rowData = [
      r.stt,
      `"${r.classCode}"`,
      `"${r.className}"`,
      `"${r.branch}"`,
      `"${r.teacherName}"`,
      `"${r.studentCode}"`,
      `"${r.studentName}"`,
      `"${r.studentPhone}"`,
      `"${r.parentName}"`,
      `"${r.parentPhone}"`,
      r.courseTuitionFee,
      r.tuitionPaid,
      r.balanceOwed,
      `"${r.tuitionStatus}"`,
      `"${r.paymentDates.replace(/"/g, '""')}"`,
      `"${r.paymentReceipts}"`,
      `"${r.paymentMethods}"`,
      `"${r.lastPaymentDate}"`,
      `"${r.collectorName}"`,
      `"${r.note.replace(/"/g, '""')}"`,
    ];
    csvRows.push(rowData.join('\t'));
  });

  // UTF-8 BOM for Excel
  const bom = '\uFEFF';
  const csvContent = bom + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanMonth = monthLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `IELTS_DUONGVU_Bao_Cao_Hoc_Phi_Lop_${cleanMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy to clipboard as TSV for instant Paste into Google Sheets
 */
export async function copyMonthlyTuitionToGoogleSheets(
  rows: StudentPaymentArchiveRow[]
): Promise<boolean> {
  const headers = [
    'STT',
    'Mã lớp',
    'Tên lớp',
    'Cơ sở',
    'Giáo viên',
    'Mã HV',
    'Họ tên học viên',
    'SĐT học viên',
    'Phụ huynh',
    'SĐT phụ huynh',
    'Học phí quy định',
    'Đã nộp',
    'Còn nợ',
    'Trạng thái',
    'Lịch sử & Ngày đóng tiền',
    'Mã phiếu thu',
    'Hình thức đóng',
    'Ngày nộp gần nhất',
    'Người thu',
    'Ghi chú',
  ];

  const lines = [headers.join('\t')];
  rows.forEach((r) => {
    lines.push(
      [
        r.stt,
        r.classCode,
        r.className,
        r.branch,
        r.teacherName,
        r.studentCode,
        r.studentName,
        r.studentPhone,
        r.parentName,
        r.parentPhone,
        r.courseTuitionFee,
        r.tuitionPaid,
        r.balanceOwed,
        r.tuitionStatus,
        r.paymentDates,
        r.paymentReceipts,
        r.paymentMethods,
        r.lastPaymentDate,
        r.collectorName,
        r.note,
      ].join('\t')
    );
  });

  const tsvText = lines.join('\n');
  try {
    await navigator.clipboard.writeText(tsvText);
    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

/**
 * Export complete system database backup to a JSON file for safety
 */
export function exportFullSystemBackup(data: Record<string, any>) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonStr = JSON.stringify(
    {
      centerName: 'IELTS DƯƠNG VŨ - HẢI PHÒNG',
      exportedAt: new Date().toLocaleString('vi-VN'),
      version: '2.0.0',
      data,
    },
    null,
    2
  );

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IELTS_DUONGVU_FULL_BACKUP_${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
