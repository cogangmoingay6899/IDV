import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  Search,
  Receipt,
  Plus,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Download,
  Copy,
  FolderArchive,
  ShieldCheck,
  Building2,
  Users,
  Clock,
  Sparkles,
  Layers,
  Database
} from 'lucide-react';
import { TuitionTransaction, Student, ClassGroup } from '../../types';
import {
  buildMonthlyArchiveData,
  exportMonthlyTuitionToCSV,
  copyMonthlyTuitionToGoogleSheets,
  exportFullSystemBackup,
  ClassArchiveGroup,
} from '../../utils/monthlyTuitionArchive';
import { formatDateVN } from '../../utils/courseSchedule';

interface FinanceModuleProps {
  transactions: TuitionTransaction[];
  students: Student[];
  classes?: ClassGroup[];
  onOpenQuickTuition?: () => void;
  onOpenCollectModal?: () => void;
  onViewReceipt: (tx: TuitionTransaction) => void;
  allBackupData?: Record<string, any>;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  transactions,
  students,
  classes = [],
  onOpenQuickTuition,
  onOpenCollectModal,
  onViewReceipt,
  allBackupData,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'monthly_archive' | 'transactions' | 'debts'>('monthly_archive');

  // Monthly Archive Filter State
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [archiveBranch, setArchiveBranch] = useState<string>('all');
  const [archiveClassId, setArchiveClassId] = useState<string>('all');
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [viewGrouping, setViewGrouping] = useState<'by_class' | 'flat'>('by_class');
  const [copySuccessToast, setCopySuccessToast] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  const handleOpenTuition = onOpenCollectModal || onOpenQuickTuition || (() => {});

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const totalCollected = transactions
    .filter((t) => t.status === 'Thành công')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebt = students.reduce((sum, s) => sum + (s.balanceOwed || 0), 0);
  const indebtedStudents = students.filter((s) => (s.balanceOwed || 0) > 0);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.studentName.toLowerCase().includes(search.toLowerCase()) ||
      t.receiptCode.toLowerCase().includes(search.toLowerCase()) ||
      t.className.toLowerCase().includes(search.toLowerCase());

    if (filterType === 'all') return matchesSearch;
    return matchesSearch && t.paymentMethod === filterType;
  });

  // Calculate Available Months from transactions and default dates
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add('2026-09');
    months.add('2026-08');
    months.add('2026-07');
    months.add('2026-06');
    months.add('2026-05');

    transactions.forEach((tx) => {
      if (tx.date.includes('/')) {
        const parts = tx.date.split(' ')[0].split('/');
        if (parts.length === 3) {
          months.add(`${parts[2]}-${parts[1].padStart(2, '0')}`);
        }
      } else if (tx.date.includes('-')) {
        const parts = tx.date.split('-');
        if (parts.length >= 2) {
          months.add(`${parts[0]}-${parts[1].padStart(2, '0')}`);
        }
      }
    });

    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Extract unique branches
  const branchList = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => {
      if (c.branch) set.add(c.branch);
    });
    if (set.size === 0) {
      set.add('Cơ sở 1 - Tô Hiệu (Hải Phòng)');
      set.add('Cơ sở 2 - Kiến An (Hải Phòng)');
    }
    return Array.from(set);
  }, [classes]);

  // Build Monthly Archive Data
  const archiveData = useMemo(() => {
    return buildMonthlyArchiveData(
      students,
      classes,
      transactions,
      selectedMonth,
      archiveBranch,
      archiveClassId
    );
  }, [students, classes, transactions, selectedMonth, archiveBranch, archiveClassId]);

  // Filter archive rows by search
  const filteredArchiveRows = useMemo(() => {
    if (!archiveSearch.trim()) return archiveData.rows;
    const q = archiveSearch.toLowerCase();
    return archiveData.rows.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.studentCode.toLowerCase().includes(q) ||
        r.className.toLowerCase().includes(q) ||
        r.classCode.toLowerCase().includes(q) ||
        r.studentPhone.includes(q) ||
        r.parentName.toLowerCase().includes(q) ||
        r.paymentReceipts.toLowerCase().includes(q)
    );
  }, [archiveData.rows, archiveSearch]);

  const monthLabel =
    selectedMonth === 'all'
      ? 'Toàn bộ thời gian'
      : `Tháng ${selectedMonth.split('-')[1]}/${selectedMonth.split('-')[0]}`;

  const handleExportCSV = () => {
    exportMonthlyTuitionToCSV(filteredArchiveRows, selectedMonth);
  };

  const handleCopySheets = async () => {
    const ok = await copyMonthlyTuitionToGoogleSheets(filteredArchiveRows);
    if (ok) {
      setCopySuccessToast(true);
      setTimeout(() => setCopySuccessToast(false), 3000);
    }
  };

  const handleBackupAllJSON = () => {
    exportFullSystemBackup({
      students,
      classes,
      transactions,
      backupDate: new Date().toISOString(),
      ...(allBackupData || {}),
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {copySuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Đã sao chép toàn bộ dữ liệu bảng học phí! Bạn có thể dán (Ctrl+V) vào Google Sheets.</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-md">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Quản Lý Tài Chính &amp; Học Phí
              </h2>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Cloud Sync + Lưu Trữ An Toàn</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Kiểm soát học phí theo lớp, theo dõi lịch sử ngày đóng tiền và xuất lưu trữ hàng tháng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleBackupAllJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all hover:scale-105 active:scale-95"
            title="Tải snapshot sao lưu toàn bộ dữ liệu hệ thống đề phòng rủi ro"
          >
            <Database className="w-4 h-4 text-purple-600" />
            <span>Sao lưu dữ liệu (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenTuition}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Lập phiếu thu tiền</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng thu thực tế (Kỳ này)</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{formatVND(totalCollected)}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{transactions.length} giao dịch đã ghi nhận ngày thu</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng công nợ học phí</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{formatVND(totalDebt)}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {indebtedStudents.length} học viên cần nhắc nộp học phí
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Lưu trữ &amp; Đồng bộ</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg font-bold text-slate-800 mt-2">Đồng bộ Cloud Realtime</div>
          <div className="text-xs text-slate-500 mt-1">Hỗ trợ xuất Excel, PDF &amp; Google Sheets</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => setSelectedTab('monthly_archive')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${
            selectedTab === 'monthly_archive'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderArchive className="w-4 h-4 text-amber-300" />
          <span>Xuất Lưu Trữ Học Phí Theo Tháng</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-black">
            Mới &amp; Đầy đủ
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('transactions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            selectedTab === 'transactions'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Sổ cái phiếu thu ({transactions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('debts')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            selectedTab === 'debts'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Danh sách còn nợ ({indebtedStudents.length})</span>
        </button>
      </div>

      {/* TAB 1: XUẤT LƯU TRỮ HỌC PHÍ THEO THÁNG */}
      {selectedTab === 'monthly_archive' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Selectors: Month, Branch, Class */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Month Picker */}
                <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl">
                  <Calendar className="w-4 h-4 text-purple-700 shrink-0" />
                  <span className="text-xs font-extrabold text-purple-900">Kỳ lưu trữ:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-950 px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">🌟 Toàn bộ các tháng / Tất cả khóa</option>
                    {availableMonths.map((m) => {
                      const [y, mm] = m.split('-');
                      return (
                        <option key={m} value={m}>
                          Tháng {mm}/{y} {m === '2026-09' ? '(Hiện tại)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Branch Picker */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <select
                    value={archiveBranch}
                    onChange={(e) => setArchiveBranch(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="all">🏢 Tất cả cơ sở</option>
                    {branchList.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Picker */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <Layers className="w-4 h-4 text-slate-500 shrink-0" />
                  <select
                    value={archiveClassId}
                    onChange={(e) => setArchiveClassId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="all">📚 Tất cả các lớp ({classes.length})</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons: Export CSV, Copy Sheets, Print PDF */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
                  title="Tải file Excel / CSV UTF-8 chứa đầy đủ danh sách học sinh và ngày đóng học phí"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Xuất Excel / CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySheets}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
                  title="Sao chép toàn bộ bảng dữ liệu để dán trực tiếp vào Google Sheets"
                >
                  <Copy className="w-4 h-4" />
                  <span>Sao chép Google Sheets</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
                  title="Xem và in báo cáo lưu trữ tháng đóng dấu trung tâm"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Báo Cáo / Lưu PDF</span>
                </button>
              </div>
            </div>

            {/* Sub-bar: Search & View Mode */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm học viên, mã HV, lớp, số điện thoại, phiếu thu..."
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewGrouping('by_class')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    viewGrouping === 'by_class'
                      ? 'bg-white text-purple-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Gom nhóm theo lớp
                </button>
                <button
                  type="button"
                  onClick={() => setViewGrouping('flat')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    viewGrouping === 'flat'
                      ? 'bg-white text-purple-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bảng tổng hợp tất cả ({filteredArchiveRows.length})
                </button>
              </div>
            </div>
          </div>

          {/* Monthly Summary Statistics Banner */}
          <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">
                📊 BÁO CÁO LƯU TRỮ HỌC PHÍ {monthLabel.toUpperCase()}
              </span>
              <h3 className="text-base font-black mt-0.5">
                Tổng hợp {filteredArchiveRows.length} học viên • {Object.keys(archiveData.classGrouped).length} lớp học
              </h3>
            </div>

            <div className="flex items-center gap-4 flex-wrap text-xs">
              <div className="bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs border border-white/10">
                <span className="text-purple-200 block text-[10px]">Học phí quy định:</span>
                <strong className="text-sm font-black">{formatVND(archiveData.totalExpectedTuition)}</strong>
              </div>

              <div className="bg-emerald-500/20 px-3 py-1.5 rounded-xl backdrop-blur-xs border border-emerald-400/30">
                <span className="text-emerald-200 block text-[10px]">Đã thu thực tế:</span>
                <strong className="text-sm font-black text-emerald-300">
                  {formatVND(archiveData.totalPaidTuition)}
                </strong>
              </div>

              <div className="bg-rose-500/20 px-3 py-1.5 rounded-xl backdrop-blur-xs border border-rose-400/30">
                <span className="text-rose-200 block text-[10px]">Còn nợ:</span>
                <strong className="text-sm font-black text-rose-300">
                  {formatVND(archiveData.totalDebt)}
                </strong>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: GOM NHÓM THEO TỪNG LỚP HỌC */}
          {viewGrouping === 'by_class' ? (
            <div className="space-y-4">
              {(Object.entries(archiveData.classGrouped) as [string, ClassArchiveGroup][]).map(([clsId, group]) => {
                const cls = group.classInfo;
                const clsStudents = archiveSearch.trim()
                  ? group.students.filter(
                      (r) =>
                        r.studentName.toLowerCase().includes(archiveSearch.toLowerCase()) ||
                        r.studentCode.toLowerCase().includes(archiveSearch.toLowerCase()) ||
                        r.studentPhone.includes(archiveSearch)
                    )
                  : group.students;

                if (clsStudents.length === 0 && archiveSearch.trim()) return null;

                const clsTotalExpected = clsStudents.reduce((sum, s) => sum + s.courseTuitionFee, 0);
                const clsTotalPaid = clsStudents.reduce((sum, s) => sum + s.tuitionPaid, 0);
                const clsTotalDebt = clsStudents.reduce((sum, s) => sum + s.balanceOwed, 0);

                return (
                  <div
                    key={clsId}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                  >
                    {/* Class Header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center">
                          {cls.code.slice(0, 4)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-900 text-sm">{cls.name}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                              {cls.code}
                            </span>
                            <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              {cls.branch || 'Cơ sở 1 - Tô Hiệu'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Giáo viên: <strong>{cls.teacherName || 'Chưa phân công'}</strong> • Lịch học: {cls.schedule || 'Thứ 2 - Thứ 5'}
                          </p>
                        </div>
                      </div>

                      {/* Class Quick Totals */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px]">Sĩ số:</span>
                          <strong className="text-slate-800">{clsStudents.length} học viên</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px]">Đã thu:</span>
                          <strong className="text-emerald-600 font-bold">{formatVND(clsTotalPaid)}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px]">Còn nợ:</span>
                          <strong className={clsTotalDebt > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                            {formatVND(clsTotalDebt)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Class Students Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 w-10 text-center">STT</th>
                            <th className="py-2.5 px-3">Mã &amp; Tên Học Viên</th>
                            <th className="py-2.5 px-3">Phụ huynh / SĐT</th>
                            <th className="py-2.5 px-3 text-right">Mức học phí</th>
                            <th className="py-2.5 px-3 text-right">Đã nộp</th>
                            <th className="py-2.5 px-3 text-right">Còn nợ</th>
                            <th className="py-2.5 px-3">Lịch Sử &amp; Ngày Đóng Học Phí</th>
                            <th className="py-2.5 px-3 text-center">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {clsStudents.map((row, idx) => (
                            <tr key={row.studentCode + idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="py-3 px-3">
                                <div className="font-extrabold text-slate-900">{row.studentName}</div>
                                <div className="text-[11px] text-purple-700 font-mono font-bold">
                                  {row.studentCode} • {row.studentPhone}
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="text-slate-800 font-medium">{row.parentName}</div>
                                <div className="text-slate-400 text-[11px]">{row.parentPhone}</div>
                              </td>
                              <td className="py-3 px-3 text-right font-medium text-slate-700">
                                {formatVND(row.courseTuitionFee)}
                              </td>
                              <td className="py-3 px-3 text-right font-black text-emerald-600">
                                {formatVND(row.tuitionPaid)}
                              </td>
                              <td className="py-3 px-3 text-right font-black">
                                {row.balanceOwed > 0 ? (
                                  <span className="text-rose-600">{formatVND(row.balanceOwed)}</span>
                                ) : (
                                  <span className="text-slate-400">0đ</span>
                                )}
                              </td>
                              <td className="py-3 px-3 min-w-[240px]">
                                {row.paymentDates !== 'Chưa có giao dịch' ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-900">
                                      <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>{row.paymentDates}</span>
                                    </div>
                                    {row.paymentReceipts && (
                                      <div className="text-[10px] text-slate-500 font-mono">
                                        Mã phiếu: {row.paymentReceipts} ({row.collectorName})
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-rose-500 font-medium italic">
                                    ⚠️ Chưa ghi nhận ngày đóng tiền
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    row.balanceOwed === 0
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                                  }`}
                                >
                                  {row.tuitionStatus}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {clsStudents.length === 0 && (
                            <tr>
                              <td colSpan={8} className="py-4 text-center text-slate-400 italic">
                                Lớp chưa có học viên đăng ký.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VIEW MODE 2: BẢNG TỔNG HỢP PHẲNG (FLAT TABLE) */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">STT</th>
                      <th className="py-3 px-3">Lớp &amp; Cơ Sở</th>
                      <th className="py-3 px-3">Mã &amp; Tên Học Viên</th>
                      <th className="py-3 px-3">Phụ Huynh</th>
                      <th className="py-3 px-3 text-right">Mức học phí</th>
                      <th className="py-3 px-3 text-right">Đã nộp</th>
                      <th className="py-3 px-3 text-right">Còn nợ</th>
                      <th className="py-3 px-3">Lịch Sử &amp; Ngày Đóng Học Phí</th>
                      <th className="py-3 px-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredArchiveRows.map((row) => (
                      <tr key={row.stt} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-400">{row.stt}</td>
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900">{row.className}</div>
                          <div className="text-[10px] text-purple-700 font-bold">
                            {row.classCode} • {row.branch}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900">{row.studentName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {row.studentCode} • {row.studentPhone}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-800">{row.parentName}</div>
                          <div className="text-slate-400 text-[11px]">{row.parentPhone}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-700">
                          {formatVND(row.courseTuitionFee)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-600">
                          {formatVND(row.tuitionPaid)}
                        </td>
                        <td className="py-3 px-3 text-right font-black">
                          {row.balanceOwed > 0 ? (
                            <span className="text-rose-600">{formatVND(row.balanceOwed)}</span>
                          ) : (
                            <span className="text-slate-400">0đ</span>
                          )}
                        </td>
                        <td className="py-3 px-3 min-w-[220px]">
                          {row.paymentDates !== 'Chưa có giao dịch' ? (
                            <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{row.paymentDates}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-rose-500 font-medium italic">
                              ⚠️ Chưa đóng
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              row.balanceOwed === 0
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {row.tuitionStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SỔ CÁI PHIẾU THU TIỀN */}
      {selectedTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Filter / Search Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã phiếu thu, học viên, lớp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
              >
                <option value="all">Tất cả phương thức</option>
                <option value="Chuyển khoản QR">Chuyển khoản QR</option>
                <option value="Tiền mặt">Tiền mặt</option>
                <option value="Thẻ tín dụng (POS)">Thẻ tín dụng (POS)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Mã phiếu thu</th>
                  <th className="py-3 px-4">Học viên</th>
                  <th className="py-3 px-4">Lớp học</th>
                  <th className="py-3 px-4">Số tiền</th>
                  <th className="py-3 px-4">Hình thức</th>
                  <th className="py-3 px-4">Ngày thu</th>
                  <th className="py-3 px-4">Người thu</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{tx.receiptCode}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{tx.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{tx.studentCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{tx.className}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatVND(tx.amount)}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        {tx.paymentMethod === 'Chuyển khoản QR' && <QrCode className="w-3 h-3 text-purple-600" />}
                        {tx.paymentMethod === 'Tiền mặt' && <Banknote className="w-3 h-3 text-emerald-600" />}
                        {tx.paymentMethod.includes('Thẻ') && <CreditCard className="w-3 h-3 text-blue-600" />}
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-bold">{formatDateVN(tx.date)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{tx.collectorName}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Xem và in biên lai thu học phí"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>In biên lai</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DANH SÁCH CÒN NỢ */}
      {selectedTab === 'debts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Hệ thống tự động nhắc nợ qua SMS và thông báo ứng dụng sổ liên lạc trước ngày đến hạn.</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Học viên</th>
                  <th className="py-3 px-4">Lớp học</th>
                  <th className="py-3 px-4">Phụ huynh / SĐT</th>
                  <th className="py-3 px-4">Số tiền còn nợ</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {indebtedStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{s.code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{s.className}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800">{s.parentName}</div>
                      <div className="text-slate-400 text-[11px]">{s.parentPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-600 text-sm">
                      {formatVND(s.balanceOwed)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {s.tuitionStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={handleOpenTuition}
                        className="px-3 py-1 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors"
                      >
                        Thu nợ ngay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: IN BÁO CÁO LƯU TRỮ HỌC PHÍ THÁNG (PRINTABLE MODAL)
         ========================================================= */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200">
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-black text-slate-900">
                  Xem Trước &amp; In Báo Cáo Lưu Trữ Học Phí
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Xác nhận In / Lưu PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Printable Document Paper */}
            <div className="border border-slate-300 p-6 rounded-2xl bg-white space-y-5 text-slate-900 font-sans text-xs">
              {/* Header Info */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-lg font-black text-purple-900 uppercase">
                    IELTS DƯƠNG VŨ - HỆ THỐNG ĐÀO TẠO IELTS CHUYÊN SÂU
                  </h2>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    • CS1: 51 Tô Hiệu (Tầng 4), Lê Chân, Hải Phòng • Hotline: 0798 934 698
                  </p>
                  <p className="text-[11px] text-slate-600">
                    • CS2: 15/9 Hòa Bình, Kiến An, Hải Phòng (gần cấp 3 Kiến An)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Mã lưu trữ:</span>
                  <span className="font-mono font-black text-xs text-purple-800">
                    ARC-TUITION-{selectedMonth}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Ngày xuất: {new Date().toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-2">
                <h1 className="text-base font-black uppercase text-slate-900">
                  BÁO CÁO TỔNG HỢP DANH SÁCH LỚP &amp; HỌC PHÍ ĐÃ ĐÓNG
                </h1>
                <p className="text-xs font-bold text-purple-800 mt-0.5">
                  Kỳ lưu trữ: {monthLabel.toUpperCase()}
                </p>
              </div>

              {/* Summary Stats Table */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block">Tổng mức học phí quy định:</span>
                  <strong className="text-sm font-black text-slate-900">
                    {formatVND(archiveData.totalExpectedTuition)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold block">Tổng tiền thực thu đã đóng:</span>
                  <strong className="text-sm font-black text-emerald-700">
                    {formatVND(archiveData.totalPaidTuition)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-rose-700 font-bold block">Tổng công nợ còn lại:</span>
                  <strong className="text-sm font-black text-rose-700">
                    {formatVND(archiveData.totalDebt)}
                  </strong>
                </div>
              </div>

              {/* Student Rows Table */}
              <table className="w-full border-collapse border border-slate-300 text-[11px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-300 p-1.5 text-center w-8">STT</th>
                    <th className="border border-slate-300 p-1.5">Lớp học</th>
                    <th className="border border-slate-300 p-1.5">Mã &amp; Tên học viên</th>
                    <th className="border border-slate-300 p-1.5">SĐT</th>
                    <th className="border border-slate-300 p-1.5 text-right">Mức học phí</th>
                    <th className="border border-slate-300 p-1.5 text-right">Đã nộp</th>
                    <th className="border border-slate-300 p-1.5 text-right">Còn nợ</th>
                    <th className="border border-slate-300 p-1.5">Lịch sử &amp; Ngày đóng tiền</th>
                    <th className="border border-slate-300 p-1.5 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArchiveRows.map((r) => (
                    <tr key={r.stt}>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{r.stt}</td>
                      <td className="border border-slate-300 p-1.5">
                        <div className="font-bold">{r.className}</div>
                        <div className="text-[10px] text-slate-500">{r.branch}</div>
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        <div className="font-bold">{r.studentName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{r.studentCode}</div>
                      </td>
                      <td className="border border-slate-300 p-1.5 font-mono">{r.studentPhone}</td>
                      <td className="border border-slate-300 p-1.5 text-right">
                        {formatVND(r.courseTuitionFee)}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-bold text-emerald-700">
                        {formatVND(r.tuitionPaid)}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-bold text-rose-700">
                        {r.balanceOwed > 0 ? formatVND(r.balanceOwed) : '0đ'}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-[10px]">
                        {r.paymentDates}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">
                        {r.tuitionStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 pt-8 text-center">
                <div>
                  <p className="font-bold uppercase text-xs">Người lập báo cáo / Kế toán</p>
                  <p className="text-[10px] text-slate-500 italic mt-1">(Ký và ghi rõ họ tên)</p>
                  <div className="h-14"></div>
                  <p className="font-bold">Ban Kế Toán IDV</p>
                </div>
                <div>
                  <p className="font-bold uppercase text-xs">Ban Giám Đốc Trung Tâm</p>
                  <p className="text-[10px] text-slate-500 italic mt-1">(Ký, đóng dấu)</p>
                  <div className="h-14"></div>
                  <p className="font-bold text-purple-900">Thầy Dương Vũ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
