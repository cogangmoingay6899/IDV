import * as XLSX from 'xlsx';
import { ClassGroup, Student, Teacher, TuitionTransaction } from '../types';

/**
 * Clean sheet name to conform to Excel limits:
 * - Max 31 chars
 * - Remove invalid characters: \ / ? * : [ ]
 */
function sanitizeSheetName(rawName: string, existingNames: Set<string>): string {
  let clean = rawName
    .replace(/[\\/?*:[\]]/g, '')
    .trim();
  if (!clean) clean = 'Sheet';
  if (clean.length > 28) {
    clean = clean.substring(0, 28);
  }

  let finalName = clean;
  let counter = 1;
  while (existingNames.has(finalName.toLowerCase())) {
    finalName = `${clean}_${counter}`;
    counter++;
  }
  existingNames.add(finalName.toLowerCase());
  return finalName;
}

/**
 * Format currency number to standard string
 */
function formatVND(amount: number): string {
  if (isNaN(amount) || amount === undefined || amount === null) return '0 VNĐ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

/**
 * Export full center data to an Excel file with multiple sheets:
 * - Sheet 1: Tổng quan Trung tâm (Summary)
 * - Sheet 2..N: Each Class gets its own sheet (Mỗi lớp 1 sheet!) with Class Info & Student List
 * - Sheet N+1: Danh sách Giáo viên & Trợ lý
 * - Sheet N+2: Toàn bộ Học sinh Trung tâm
 */
export function exportCenterDataToExcel({
  classes,
  students,
  teachers = [],
  transactions = [],
}: {
  classes: ClassGroup[];
  students: Student[];
  teachers?: Teacher[];
  transactions?: TuitionTransaction[];
}) {
  const wb = XLSX.utils.book_new();
  const existingSheetNames = new Set<string>();

  const currentDateStr = new Date().toLocaleDateString('vi-VN');

  // ==========================================
  // SHEET 1: TỔNG QUAN TRUNG TÂM
  // ==========================================
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 'Đang học').length;
  const totalClasses = classes.length;
  const totalCollected = transactions
    .filter((t) => t.status === 'Thành công')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalDebt = students.reduce((sum, s) => sum + (s.balanceOwed || 0), 0);

  const overviewRows: (string | number)[][] = [
    ['HE THONG QUAN LY TRUNG TAM ANH NGU - IELTS DUONG VU'],
    [`NGAY XUAT BAO CAO: ${currentDateStr}`],
    [],
    ['--- THONG KE TONG QUAN TRUNG TAM ---'],
    ['Tong so lop hoc:', totalClasses],
    ['Tong so hoc vien:', totalStudents],
    ['Hoc vien dang hoc:', activeStudents],
    ['Tong hoc phi da thu:', formatVND(totalCollected)],
    ['Tong no hoc phi:', formatVND(totalDebt)],
    [],
    ['--- DANH SACH DANH MUC CAC LOP HOC ---'],
    [
      'STT',
      'Ma Lop',
      'Ten Lop',
      'Khoa Hoc',
      'Co So',
      'Giao Vien Phuu Trach',
      'Lich Hoc',
      'Phong',
      'Si So',
      'Ngay Khai Giang',
      'Nguoi Phu Trach',
      'Hoc Phi Khoa',
      'Tong Da Thu (Lop)',
      'Tong No (Lop)',
      'Trang Thai',
    ],
  ];

  classes.forEach((c, idx) => {
    const classStudents = students.filter(
      (s) => s.classId === c.id || (s.className && s.className.trim() === c.name.trim())
    );
    const classCollected = transactions
      .filter((t) => t.status === 'Thành công' && (t.classId === c.id || t.className === c.name))
      .reduce((sum, t) => sum + t.amount, 0);
    const classDebt = classStudents.reduce((sum, s) => sum + (s.balanceOwed || 0), 0);

    overviewRows.push([
      idx + 1,
      c.code || c.id,
      c.name,
      c.courseName || '',
      c.branch || 'Cơ sở 1 - Tô Hiệu (Hải Phòng)',
      c.teacherName || '',
      c.schedule || '',
      c.room || '',
      `${classStudents.length}/${c.maxStudents || 25}`,
      c.startDate || '',
      c.assistantTeacherName || '',
      c.tuitionFee ? formatVND(c.tuitionFee) : 'Theo khóa',
      formatVND(classCollected),
      formatVND(classDebt),
      c.status || 'Đang diễn ra',
    ]);
  });

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  const overviewSheetName = sanitizeSheetName('Tong Quan Center', existingSheetNames);
  XLSX.utils.book_append_sheet(wb, wsOverview, overviewSheetName);

  // ==========================================
  // SHEETS FOR EACH CLASS (MOI LOP 1 SHEET)
  // ==========================================
  classes.forEach((c) => {
    const classStudents = students.filter(
      (s) => s.classId === c.id || (s.className && s.className.trim() === c.name.trim())
    );

    const classCollected = transactions
      .filter((t) => t.status === 'Thành công' && (t.classId === c.id || t.className === c.name))
      .reduce((sum, t) => sum + t.amount, 0);
    const classDebt = classStudents.reduce((sum, s) => sum + (s.balanceOwed || 0), 0);

    const sheetTitle = `Lop ${c.name}`;
    const safeSheetName = sanitizeSheetName(sheetTitle, existingSheetNames);

    const classRows: (string | number)[][] = [
      ['THONG TIN CHI TIET LOP HOC - IELTS DUONG VU'],
      [`Lớp: ${c.name}`, `Mã lớp: ${c.code || c.id}`, `Khóa học: ${c.courseName || ''}`],
      [
        `Cơ sở: ${c.branch || 'Cơ sở 1 - Tô Hiệu (Hải Phòng)'}`,
        `Phòng học: ${c.room || ''}`,
        `Lịch học: ${c.schedule || ''}`,
      ],
      [
        `Giáo viên chính: ${c.teacherName || 'Chưa phân công'}`,
        `Trợ lý lớp: ${c.assistantTeacherName || 'Chưa phân công'}`,
        `Sĩ số: ${classStudents.length}/${c.maxStudents || 25} HV`,
      ],
      [
        `Học phí khóa: ${c.tuitionFee ? formatVND(c.tuitionFee) : 'Mặc định'}`,
        `Đã thu lớp: ${formatVND(classCollected)}`,
        `Còn nợ lớp: ${formatVND(classDebt)}`,
      ],
      [],
      [`DANH SACH HOC VIEN LOP ${c.name.toUpperCase()} (${classStudents.length} HOC VIEN)`],
      [
        'STT',
        'Ma HV',
        'Ho va Ten',
        'Ngay Sinh',
        'Gioi Tinh',
        'SDT Hoc Sinh',
        'Ho Ten Phung Huynh',
        'SDT Phu Huynh',
        'Dia Chi',
        'Trang Thai Hoc',
        'Ngay Nhap Hoc',
        'Hoc Phi Phai Nop',
        'Hoc Phi Da Dong',
        'Con No Học Phi',
        'Han Dong',
        'Trang Thai Hoc Phi',
        'Ghi Chu / Thi CC',
      ],
    ];

    if (classStudents.length === 0) {
      classRows.push(['(Lớp hiện chưa có học viên nào)']);
    } else {
      classStudents.forEach((st, sIdx) => {
        const payable = st.tuitionPayable ?? st.courseTuitionFee ?? c.tuitionFee ?? 0;
        const paid = st.tuitionAmountPaid ?? (payable - (st.balanceOwed || 0));
        const debt = st.balanceOwed ?? 0;

        classRows.push([
          sIdx + 1,
          st.code || st.id,
          st.name,
          st.dob || '',
          st.gender || 'Nam',
          st.phone || '',
          st.parentName || '',
          st.parentPhone || '',
          st.address || '',
          st.status || 'Đang học',
          st.joinDate || st.startDate || '',
          payable ? formatVND(payable) : '0 VNĐ',
          paid ? formatVND(paid) : '0 VNĐ',
          debt ? formatVND(debt) : '0 VNĐ',
          st.tuitionDeadlineDate || '',
          st.tuitionStatus || (debt > 0 ? 'Còn nợ' : 'Đã đóng đủ'),
          st.note || st.examDate ? `Thi: ${st.examDate || ''} | ${st.note || ''}` : '',
        ]);
      });
    }

    const wsClass = XLSX.utils.aoa_to_sheet(classRows);
    XLSX.utils.book_append_sheet(wb, wsClass, safeSheetName);
  });

  // ==========================================
  // SHEET: DANH SÁCH GIÁO VIÊN
  // ==========================================
  if (teachers && teachers.length > 0) {
    const teacherRows: (string | number)[][] = [
      ['DANH SACH GIAO VIEN TRUNG TAM - IELTS DUONG VU'],
      [`Ngay xuat: ${currentDateStr}`],
      [],
      [
        'STT',
        'Ma GV',
        'Ho va Ten',
        'Loai GV',
        'Quoc Tich',
        'So Dien Thoai',
        'Email',
        'Chuyen Mon',
        'Bang Cap',
        'So Lop Dang Day',
        'Don Gia / Buoi',
        'Trang Thai',
      ],
    ];

    teachers.forEach((t, tIdx) => {
      teacherRows.push([
        tIdx + 1,
        t.code || t.id,
        t.name,
        t.type || 'Việt Nam',
        t.nationality || 'Việt Nam',
        t.phone || '',
        t.email || '',
        t.specialty || '',
        t.degrees || '',
        t.activeClassesCount || 0,
        t.hourlyRate ? formatVND(t.hourlyRate) : '---',
        t.status || 'Đang giảng dạy',
      ]);
    });

    const wsTeachers = XLSX.utils.aoa_to_sheet(teacherRows);
    const teacherSheetName = sanitizeSheetName('Danh Sach Giao Vien', existingSheetNames);
    XLSX.utils.book_append_sheet(wb, wsTeachers, teacherSheetName);
  }

  // ==========================================
  // SHEET: ALL STUDENTS SUMMARY
  // ==========================================
  const allStudentRows: (string | number)[][] = [
    ['TONG HOP TAT CA HOC VIEN TRUNG TAM - IELTS DUONG VU'],
    [`Ngay xuat: ${currentDateStr}`, `Tong so: ${students.length} hoc vien`],
    [],
    [
      'STT',
      'Ma HV',
      'Ho va Ten',
      'Lop Hoc',
      'Khoa Hoc',
      'Trang Thai Hoc',
      'SDT Hoc Sinh',
      'Ho Ten Phu Huynh',
      'SDT Phu Huynh',
      'Hoc Phi Phai Nop',
      'Da Nop',
      'Con No',
      'Han Dong',
      'Trang Thai Phi',
    ],
  ];

  students.forEach((st, sIdx) => {
    const payable = st.tuitionPayable ?? st.courseTuitionFee ?? 0;
    const paid = st.tuitionAmountPaid ?? (payable - (st.balanceOwed || 0));
    const debt = st.balanceOwed ?? 0;

    allStudentRows.push([
      sIdx + 1,
      st.code || st.id,
      st.name,
      st.className || '',
      st.courseName || '',
      st.status || 'Đang học',
      st.phone || '',
      st.parentName || '',
      st.parentPhone || '',
      payable ? formatVND(payable) : '0 VNĐ',
      paid ? formatVND(paid) : '0 VNĐ',
      debt ? formatVND(debt) : '0 VNĐ',
      st.tuitionDeadlineDate || '',
      st.tuitionStatus || (debt > 0 ? 'Còn nợ' : 'Đã đóng đủ'),
    ]);
  });

  const wsAllStudents = XLSX.utils.aoa_to_sheet(allStudentRows);
  const allStudentsSheetName = sanitizeSheetName('Tat Ca Hoc Vien', existingSheetNames);
  XLSX.utils.book_append_sheet(wb, wsAllStudents, allStudentsSheetName);

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `IELTS_DUONG_VU_FULL_DATA_${timestamp}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
