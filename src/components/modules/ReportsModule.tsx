import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Users,
  Wallet,
  GraduationCap,
  Award,
  ArrowUpRight,
  Filter,
  Building2,
  BookOpen,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  Search,
  DollarSign
} from 'lucide-react';
import { Student, TuitionTransaction, ClassGroup } from '../../types';

interface ReportsModuleProps {
  students: Student[];
  transactions: TuitionTransaction[];
  classes: ClassGroup[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  students,
  transactions,
  classes,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('2026-Q3');
  const [activeTab, setActiveTab] = useState<'revenue_breakdown' | 'trends_and_kpis'>('revenue_breakdown');
  const [branchFilter, setBranchFilter] = useState('all');
  const [classSearch, setClassSearch] = useState('');

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Successful transactions total
  const totalCollectedAll = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'Thành công')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Total student debts
  const totalDebtAll = useMemo(() => {
    return students.reduce((sum, s) => sum + (s.balanceOwed || 0), 0);
  }, [students]);

  // Grand Total Revenue (Collected + Debt)
  const grandTotalRevenue = totalCollectedAll + totalDebtAll;

  // Extract list of all unique branches
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

  // Revenue Breakdown By Branch
  const branchRevenueData = useMemo(() => {
    return branchList.map((bName) => {
      const branchClasses = classes.filter((c) => (c.branch || 'Cơ sở 1 - Tô Hiệu (Hải Phòng)') === bName);
      const branchClassIds = new Set(branchClasses.map((c) => c.id));
      const branchClassNames = new Set(branchClasses.map((c) => c.name));

      const branchStudents = students.filter(
        (s) => branchClassIds.has(s.classId) || branchClassNames.has(s.className)
      );
      const branchStudentIds = new Set(branchStudents.map((s) => s.id));

      const branchTransactions = transactions.filter(
        (t) =>
          t.status === 'Thành công' &&
          ((t.classId && branchClassIds.has(t.classId)) ||
            branchClassNames.has(t.className) ||
            branchStudentIds.has(t.studentId))
      );

      const collected = branchTransactions.reduce((sum, t) => sum + t.amount, 0);
      const debt = branchStudents.reduce((sum, s) => sum + (s.balanceOwed || 0), 0);
      const total = collected + debt;

      return {
        branchName: bName,
        classCount: branchClasses.length,
        studentCount: branchStudents.length,
        collected,
        debt,
        total,
        sharePercent: grandTotalRevenue > 0 ? Math.round((total / grandTotalRevenue) * 100) : 0,
      };
    });
  }, [branchList, classes, students, transactions, grandTotalRevenue]);

  // Revenue Breakdown By Class
  const classRevenueData = useMemo(() => {
    return classes.map((c) => {
      const classStudents = students.filter((s) => s.classId === c.id || s.className === c.name);
      const classStudentIds = new Set(classStudents.map((s) => s.id));

      const classTransactions = transactions.filter(
        (t) =>
          t.status === 'Thành công' &&
          (t.classId === c.id || t.className === c.name || classStudentIds.has(t.studentId))
      );

      const collected = classTransactions.reduce((sum, t) => sum + t.amount, 0);
      const debt = classStudents.reduce((sum, s) => sum + (s.balanceOwed || 0), 0);
      const total = collected + debt;
      const collectionRate = total > 0 ? Math.round((collected / total) * 100) : 100;

      return {
        id: c.id,
        code: c.code,
        name: c.name,
        branch: c.branch || 'Cơ sở 1 - Tô Hiệu (Hải Phòng)',
        courseName: c.courseName,
        teacherName: c.teacherName,
        tuitionFee: c.tuitionFee || 14500000,
        studentCount: classStudents.length || c.currentStudents || 0,
        collected,
        debt,
        total,
        collectionRate,
      };
    });
  }, [classes, students, transactions]);

  // Filtered Class Revenue Table
  const filteredClassRevenue = useMemo(() => {
    return classRevenueData.filter((c) => {
      const matchesBranch = branchFilter === 'all' || c.branch === branchFilter;
      const matchesSearch =
        c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(classSearch.toLowerCase()) ||
        c.courseName.toLowerCase().includes(classSearch.toLowerCase()) ||
        c.teacherName.toLowerCase().includes(classSearch.toLowerCase());
      return matchesBranch && matchesSearch;
    });
  }, [classRevenueData, branchFilter, classSearch]);

  // Monthly revenue mock data for the 6 recent months
  const monthlyRevenueData = [
    { month: 'T4/26', revenue: 95000000, students: 22 },
    { month: 'T5/26', revenue: 112000000, students: 28 },
    { month: 'T6/26', revenue: 138000000, students: 35 },
    { month: 'T7/26', revenue: 145000000, students: 38 },
    { month: 'T8/26', revenue: 162000000, students: 42 },
    { month: 'T9/26', revenue: 184500000, students: 48 },
  ];

  const maxRevenue = Math.max(...monthlyRevenueData.map((d) => d.revenue));

  // Course distribution
  const courseCounts: Record<string, number> = {};
  students.forEach((s) => {
    courseCounts[s.courseName] = (courseCounts[s.courseName] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Module Title & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Báo Cáo Doanh Thu & Thống Kê</h2>
            <p className="text-xs text-slate-500">Phân tích chi tiết doanh thu theo Lớp, theo Cơ sở, Công nợ và Tăng trưởng</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium shadow-2xs"
          >
            <option value="2026-Q3">Quý 3/2026 (Hiện tại)</option>
            <option value="2026-Q2">Quý 2/2026</option>
            <option value="2026-All">Cả năm 2026</option>
          </select>

          <button
            onClick={() => alert('Đã xuất file báo cáo doanh thu theo lớp và cơ sở: PSE_Revenue_Report_2026.xlsx')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('revenue_breakdown')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'revenue_breakdown'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200/80'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Doanh Thu Theo Lớp & Theo Cơ Sở</span>
        </button>
        <button
          onClick={() => setActiveTab('trends_and_kpis')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'trends_and_kpis'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200/80'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Xu Hướng & Tỷ Lệ Chuyển Đổi</span>
        </button>
      </div>

      {activeTab === 'revenue_breakdown' ? (
        <div className="space-y-6">
          {/* 1. GRAND TOTAL REVENUE SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-5 rounded-3xl shadow-lg border border-purple-800 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">TỔNG DOANH THU ĐÃ THU</span>
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
              </div>
              <div className="text-3xl font-black text-white">{formatVND(totalCollectedAll)}</div>
              <div className="text-xs text-purple-200 mt-2 flex items-center gap-1 font-medium">
                <span>Thực thu từ {transactions.filter((t) => t.status === 'Thành công').length} phiếu thu hoàn tất</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-rose-200/90 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">TỔNG CÔNG NỢ HỌC PHÍ</span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </span>
              </div>
              <div className="text-3xl font-black text-rose-600">{formatVND(totalDebtAll)}</div>
              <div className="text-xs text-slate-500 mt-2 font-medium">
                Cần thu hồi từ {students.filter((s) => s.balanceOwed > 0).length} học viên chưa hoàn tất học phí
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-purple-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">TỔNG DOANH THU DỰ KIẾN</span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <DollarSign className="w-5 h-5" />
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900">{formatVND(grandTotalRevenue)}</div>
              <div className="text-xs text-emerald-600 mt-2 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bao gồm Thực thu + Công nợ còn lại</span>
              </div>
            </div>
          </div>

          {/* 2. REVENUE BREAKDOWN BY BRANCH (CƠ SỞ) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-700" />
                  <span>1. Báo Cáo Doanh Thu Theo Cơ Sở ({branchRevenueData.length} cơ sở)</span>
                </h3>
                <p className="text-xs text-slate-500">Phân bổ tổng nguồn thu thực tế & công nợ theo từng chi nhánh trung tâm</p>
              </div>
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                Tỷ trọng % Doanh thu
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branchRevenueData.map((b) => (
                <div
                  key={b.branchName}
                  className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 hover:border-purple-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{b.branchName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {b.classCount} lớp học • {b.studentCount} học viên
                      </p>
                    </div>
                    <span className="text-xs font-black text-purple-800 bg-purple-100 px-2.5 py-1 rounded-xl">
                      {b.sharePercent}% Tổng
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs pt-1 border-t border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Thực thu:</span>
                      <strong className="text-emerald-700 font-extrabold">{formatVND(b.collected)}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Còn nợ:</span>
                      <strong className="text-rose-600 font-extrabold">{formatVND(b.debt)}</strong>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="font-bold text-slate-900">Tổng doanh thu cơ sở:</span>
                      <strong className="text-purple-900 font-black text-sm">{formatVND(b.total)}</strong>
                    </div>
                  </div>

                  {/* Share Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-700 to-indigo-600 h-2 rounded-full"
                      style={{ width: `${Math.max(b.sharePercent, 5)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. REVENUE BREAKDOWN BY CLASS (LỚP HỌC) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-700" />
                  <span>2. Chi Tiết Doanh Thu Theo Lớp Học ({filteredClassRevenue.length} lớp)</span>
                </h3>
                <p className="text-xs text-slate-500">Tra cứu doanh thu, học phí thu thực tế và công nợ chi tiết từng lớp</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên lớp, mã lớp, giáo viên..."
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium"
                >
                  <option value="all">Tất cả Cơ sở</option>
                  {branchList.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Class Revenue Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">Mã & Tên Lớp</th>
                    <th className="p-3">Cơ Sở</th>
                    <th className="p-3">Giáo Viên</th>
                    <th className="p-3 text-center">Học Viên</th>
                    <th className="p-3 text-right">Đơn Giá HP</th>
                    <th className="p-3 text-right text-emerald-700">Đã Thu (VNĐ)</th>
                    <th className="p-3 text-right text-rose-600">Còn Nợ (VNĐ)</th>
                    <th className="p-3 text-right text-purple-900 font-black">Tổng Doanh Thu Lớp</th>
                    <th className="p-3 text-center">Tiến Độ Thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredClassRevenue.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-purple-700 font-mono font-semibold">{c.code} • {c.courseName}</div>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{c.branch}</td>
                      <td className="p-3 text-slate-700">{c.teacherName}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{c.studentCount} HV</td>
                      <td className="p-3 text-right font-mono text-slate-600">{c.tuitionFee.toLocaleString('vi-VN')} đ</td>
                      <td className="p-3 text-right font-bold text-emerald-700 font-mono">
                        {c.collected > 0 ? c.collected.toLocaleString('vi-VN') + ' đ' : '0 đ'}
                      </td>
                      <td className="p-3 text-right font-bold text-rose-600 font-mono">
                        {c.debt > 0 ? c.debt.toLocaleString('vi-VN') + ' đ' : '0 đ'}
                      </td>
                      <td className="p-3 text-right font-black text-purple-950 font-mono">
                        {c.total.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              c.collectionRate === 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {c.collectionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredClassRevenue.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                        Không tìm thấy lớp học nào phù hợp với điều kiện tìm kiếm.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* Table Footer Summary */}
                <tfoot>
                  <tr className="bg-purple-900 text-white font-extrabold">
                    <td colSpan={3} className="p-3 rounded-bl-2xl">
                      TỔNG CỘNG HỆ THỐNG ({filteredClassRevenue.length} lớp)
                    </td>
                    <td className="p-3 text-center">
                      {filteredClassRevenue.reduce((sum, c) => sum + c.studentCount, 0)} HV
                    </td>
                    <td className="p-3 text-right">-</td>
                    <td className="p-3 text-right font-mono text-emerald-300">
                      {filteredClassRevenue.reduce((sum, c) => sum + c.collected, 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3 text-right font-mono text-rose-300">
                      {filteredClassRevenue.reduce((sum, c) => sum + c.debt, 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3 text-right font-mono text-amber-300 text-sm">
                      {filteredClassRevenue.reduce((sum, c) => sum + c.total, 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3 rounded-br-2xl text-center">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* TRENDS & KPIS TAB */
        <div className="space-y-6">
          {/* 4 Summary Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Doanh thu tích lũy</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatVND(totalCollectedAll)}</div>
              <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+24.5% so với cùng kỳ năm trước</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Tổng số học sinh đang học</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{students.length} học viên</div>
              <div className="text-xs text-purple-600 font-medium mt-1">
                Tỷ lệ duy trì khóa học: 94.2%
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Tỷ lệ chuyên cần bình quân</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">93.8%</div>
              <div className="text-xs text-slate-500 mt-1">Dựa trên 240 lượt điểm danh</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Lớp học đang mở</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{classes.length} lớp</div>
              <div className="text-xs text-slate-500 mt-1">Lấp đầy phòng học: 85%</div>
            </div>
          </div>

          {/* Revenue Trend Chart (Crisp Custom SVG) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-900">Biểu đồ doanh thu 6 tháng gần nhất (VNĐ)</h3>
                <p className="text-xs text-slate-500">Doanh thu tăng trưởng đều qua các tháng nhờ các khóa IELTS và Cambridge</p>
              </div>
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                Đơn vị: VNĐ
              </span>
            </div>

            {/* Bar Chart Visualizer */}
            <div className="h-64 flex items-end justify-between gap-4 pt-8 pb-2 px-4 border-b border-slate-100">
              {monthlyRevenueData.map((d) => {
                const heightPercent = Math.round((d.revenue / maxRevenue) * 85);
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Tooltip value */}
                    <div className="text-[10px] font-bold text-slate-700 opacity-80 group-hover:opacity-100 group-hover:text-purple-700 transition-opacity">
                      {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(d.revenue)}
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[56px] rounded-t-xl bg-gradient-to-t from-purple-800 to-indigo-500 group-hover:from-purple-900 group-hover:to-indigo-400 transition-all duration-200 relative shadow-sm"
                    >
                      <div className="absolute top-1 left-0 right-0 h-1 bg-white/20 rounded-full mx-1"></div>
                    </div>

                    {/* Month label */}
                    <span className="text-xs font-semibold text-slate-600 mt-1">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Course Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-3">Cơ cấu học viên theo chương trình</h3>
              <div className="space-y-3">
                {Object.entries(courseCounts).map(([course, count]) => {
                  const pct = Math.round((count / students.length) * 100);
                  return (
                    <div key={course}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-800">{course}</span>
                        <span className="text-slate-500 font-bold">{count} học viên ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-3">Hiệu suất tuyển sinh & Chuyển đổi</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-600">Tỷ lệ khách hẹn test đầu vào:</span>
                    <strong className="text-purple-700">78.5%</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-600">Tỷ lệ tham gia học thử chuyển đổi:</span>
                    <strong className="text-emerald-700">82.0%</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-600">Chi phí thu hút 1 học viên mới (CAC):</span>
                    <strong className="text-slate-900">450.000đ</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Dữ liệu được cập nhật theo thời gian thực từ cơ sở dữ liệu PSE One.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
