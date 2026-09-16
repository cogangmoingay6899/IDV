import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Info,
  Layers,
  Users
} from 'lucide-react';
import { Student, ClassGroup, TuitionTransaction } from '../../types';

interface ImportSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (data: {
    classes: ClassGroup[];
    students: Student[];
    transactions: TuitionTransaction[];
  }) => void;
}

export const ImportSheetModal: React.FC<ImportSheetModalProps> = ({
  isOpen,
  onClose,
  onImportData,
}) => {
  if (!isOpen) return null;

  const [rawText, setRawText] = useState('');
  const [targetDate, setTargetDate] = useState('2026-05-17');
  const [defaultBranch, setDefaultBranch] = useState('Cơ sở 1 - Tô Hiệu (Hải Phòng)');
  const [previewParsed, setPreviewParsed] = useState<{
    studentsCount: number;
    classesCount: number;
    totalAmountUnits: number;
    sampleRows: { name: string; cls: string; amount: number }[];
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sample data button helper
  const handleLoadSampleTemplate = () => {
    const sample = `17/05,Đào Anh Minh,73,30,,
,Vũ Phương Thảo,59,10,,
,Bùi Nhật Lâm,76,10,,
,Ánh Dương,73,30,,
,Khánh Ngọc,76,10,,
,Vũ Bá Nguyễn Bình,67,10,,
,Lê Quốc An,73,10,,
,Võ Đức Anh,74,20,,
,Minh An,70,30,,
,Đăng Khánh,74,30,,
,Vũ Quang Minh,64,50,,
,Phạm Đức Sơn Hải,64,10,,
,Nguyễn Hoàng Sơn,82,20,,
,Khánh An,84,10,,
,Phạm Hoàng Hà Anh,85,30,,
,Hoàng Mai,85,20,`;
    setRawText(sample);
    handleParseText(sample);
  };

  const handleParseText = (text: string) => {
    const lines = text.trim().split('\n');
    const rows: { name: string; cls: string; amount: number }[] = [];
    const uniqueStudents = new Set<string>();
    const uniqueClasses = new Set<string>();
    let totalUnits = 0;

    for (const line of lines) {
      if (!line.trim()) continue;
      let name = '';
      let cls = '';
      let amount = 0;

      if (line.includes('"')) {
        const m = line.match(/^(?:[^,]*),([^,]+),"([^"]+)",(\d+)/);
        if (m) {
          name = m[1].trim();
          cls = m[2].trim();
          amount = parseInt(m[3], 10) || 0;
        }
      } else {
        const cols = line.split(',');
        name = (cols[1] || '').trim();
        cls = (cols[2] || '').trim();
        amount = parseInt(cols[3] || '0', 10) || 0;
      }

      // If first column looks like name (e.g. without leading comma)
      if (!name && line.split(',')[0] && !line.split(',')[0].includes('/')) {
        const parts = line.split(',');
        name = parts[0].trim();
        cls = (parts[1] || '').trim();
        amount = parseInt(parts[2] || '0', 10) || 0;
      }

      if (name && name !== 'Tên học sinh' && name !== 'Họ và tên') {
        let cleanName = name.replace(/\s+79$/, '').trim();
        rows.push({ name: cleanName, cls: cls || '76', amount });
        uniqueStudents.add(cleanName.toLowerCase());
        uniqueClasses.add(cls || '76');
        totalUnits += amount;
      }
    }

    setPreviewParsed({
      studentsCount: uniqueStudents.size,
      classesCount: uniqueClasses.size,
      totalAmountUnits: totalUnits,
      sampleRows: rows.slice(0, 5),
    });
  };

  const handleExecuteImport = () => {
    if (!rawText.trim()) {
      setStatusMessage('Vui lòng dán dữ liệu CSV/Excel từ Google Sheet vào ô bên dưới.');
      return;
    }

    const lines = rawText.trim().split('\n');
    const studentMap = new Map<string, { name: string; cls: string; totalAmount: number }>();
    const classesFound = new Set<string>();
    const generatedTx: TuitionTransaction[] = [];
    let txCounter = Date.now();

    for (const line of lines) {
      if (!line.trim()) continue;
      let name = '';
      let cls = '';
      let amount = 0;
      const isCash = line.toLowerCase().includes('tiền mặt');

      if (line.includes('"')) {
        const m = line.match(/^(?:[^,]*),([^,]+),"([^"]+)",(\d+)/);
        if (m) {
          name = m[1].trim();
          cls = m[2].trim();
          amount = parseInt(m[3], 10) || 0;
        }
      } else {
        const cols = line.split(',');
        name = (cols[1] || '').trim();
        cls = (cols[2] || '').trim();
        amount = parseInt(cols[3] || '0', 10) || 0;
      }

      if (!name && line.split(',')[0] && !line.split(',')[0].includes('/')) {
        const parts = line.split(',');
        name = parts[0].trim();
        cls = (parts[1] || '').trim();
        amount = parseInt(parts[2] || '0', 10) || 0;
      }

      if (!name || name === 'Tên học sinh' || name === 'Họ và tên') continue;

      let cleanName = name.replace(/\s+79$/, '').trim();
      let targetCls = cls || '76';
      if (targetCls.includes(',')) targetCls = targetCls.split(',')[0].trim();
      classesFound.add(targetCls);

      const key = cleanName.toLowerCase();
      if (!studentMap.has(key)) {
        studentMap.set(key, { name: cleanName, cls: targetCls, totalAmount: amount });
      } else {
        const prev = studentMap.get(key)!;
        prev.totalAmount += amount;
      }

      generatedTx.push({
        id: `tx-import-${txCounter++}`,
        receiptCode: `PT-IDV-SH${Math.floor(1000 + Math.random() * 9000)}`,
        studentId: `std-imp-${key.replace(/\s+/g, '-')}`,
        studentName: cleanName,
        studentCode: `IDV-HV${Math.floor(100 + Math.random() * 900)}`,
        className: `Lớp ${targetCls}`,
        amount: amount * 100000,
        paymentMethod: isCash ? 'Tiền mặt tại quầy' : 'Chuyển khoản QR',
        transactionType: 'Thu học phí',
        date: targetDate,
        collectorName: 'Thủ quỹ IDV',
        status: 'Thành công',
        notes: `Nhập từ Sheet lớp ${targetCls} (${amount} đơn vị/buổi)`,
      });
    }

    // Build new classes if not exists
    const newClasses: ClassGroup[] = Array.from(classesFound).map((cName, idx) => {
      const num = parseInt(cName, 10);
      const isNum = !isNaN(num);
      return {
        id: isNum ? `cls-${num}` : `cls-${cName.toLowerCase().replace(/\s+/g, '-')}`,
        code: isNum ? `IDV-L${num}` : `IDV-${cName.toUpperCase()}`,
        name: isNum ? `Lớp ${num} - IELTS Chuyên Sâu` : `Lớp IELTS ${cName}`,
        courseId: 'crs-3',
        courseName: 'IELTS Chuyên Sâu 6.5+ IDV',
        branch: defaultBranch,
        teacherId: 'tch-tamvuong',
        teacherName: 'Tâm Vương',
        assistantTeacherName: 'Trợ giảng IDV',
        room: `Phòng ${201 + (idx % 4)}`,
        schedule: 'Thứ 2 + Thứ 5 (Ca 1: 18:00 - 19:45)',
        startDate: targetDate,
        endDate: '2026-08-30',
        totalSessions: 36,
        completedSessions: 8,
        maxStudents: 25,
        currentStudents: Array.from(studentMap.values()).filter((s) => s.cls === cName).length,
        tuitionFee: 14500000,
        status: 'Đang diễn ra',
      };
    });

    // Build new students
    const newStudents: Student[] = Array.from(studentMap.values()).map((st, i) => {
      const clsId = !isNaN(parseInt(st.cls, 10)) ? `cls-${parseInt(st.cls, 10)}` : `cls-${st.cls.toLowerCase().replace(/\s+/g, '-')}`;
      return {
        id: `std-imp-${Date.now()}-${i}`,
        code: `IDV-HV${Math.floor(100 + Math.random() * 900)}`,
        name: st.name,
        dob: '2008-01-15',
        gender: 'Nữ',
        phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
        email: `${st.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        parentName: `PH ${st.name}`,
        parentPhone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
        address: 'Hải Phòng',
        classId: clsId,
        className: !isNaN(parseInt(st.cls, 10)) ? `Lớp ${st.cls} - IELTS Chuyên Sâu` : `Lớp IELTS ${st.cls}`,
        courseName: 'IELTS Chuyên Sâu 6.5+ IDV',
        status: 'Đang học',
        joinDate: targetDate,
        tuitionStatus: 'Đã đóng đủ',
        balanceOwed: 0,
      };
    });

    onImportData({
      classes: newClasses,
      students: newStudents,
      transactions: generatedTx,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Nhập Dữ Liệu Từ Google Sheet / Excel (Lớp 64 - 94)
              </h3>
              <p className="text-xs text-slate-500">
                Tự động tạo danh sách lớp, trích xuất học viên và ghi nhận giao dịch học phí
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Ngày ghi nhận:</span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-medium text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Cơ sở mặc định:</span>
              <select
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-medium text-slate-800"
              >
                <option value="Cơ sở 1 - Tô Hiệu (Hải Phòng)">Cơ sở 1 - Tô Hiệu</option>
                <option value="Cơ sở 2 - Kiến An (Hải Phòng)">Cơ sở 2 - Kiến An</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>Dán nội dung sheet CSV / Tab-separated vào đây:</span>
              </label>
              <button
                type="button"
                onClick={handleLoadSampleTemplate}
                className="text-[11px] font-bold text-purple-700 hover:underline"
              >
                Dán mẫu thử nghiệm
              </button>
            </div>

            <textarea
              rows={7}
              placeholder={`Định dạng chuẩn:
,Tên học sinh,Lớp,Số tiền
17/05,Đào Anh Minh,73,30
,Vũ Bá Nguyễn Bình,67,10
,Võ Đức Anh,74,20
,Bùi Nhật Lâm,76,10...`}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                handleParseText(e.target.value);
              }}
              className="w-full font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          {/* Real-time parse preview */}
          {previewParsed && (
            <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2">
              <div className="flex items-center justify-between font-bold text-purple-900">
                <span>Kết quả quét dữ liệu nhanh:</span>
                <div className="flex items-center gap-3">
                  <span className="text-purple-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <strong>{previewParsed.studentsCount}</strong> học viên
                  </span>
                  <span className="text-indigo-700 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <strong>{previewParsed.classesCount}</strong> lớp
                  </span>
                  <span className="text-emerald-700">
                    Tổng: <strong>{previewParsed.totalAmountUnits * 100000}đ</strong> ({previewParsed.totalAmountUnits} đơn vị)
                  </span>
                </div>
              </div>

              {previewParsed.sampleRows.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="text-[11px] text-slate-500 font-medium">Bản ghi xem trước:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {previewParsed.sampleRows.map((r, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-purple-200 text-[11px]">
                        <strong>{r.name}</strong> • Lớp {r.cls} • {r.amount}đv
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {statusMessage && (
            <div className="p-2.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-md transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Nhập vào hệ thống IDV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
