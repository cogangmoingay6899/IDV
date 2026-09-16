import React, { useState } from 'react';
import {
  Target,
  TrendingUp,
  Award,
  Users,
  DollarSign,
  Plus,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { KPITarget } from '../../types';

interface KPIModuleProps {
  kpis: KPITarget[];
  onAddKPI?: (kpi: KPITarget) => void;
}

export const KPIModule: React.FC<KPIModuleProps> = ({ kpis }) => {
  const [selectedMonth, setSelectedMonth] = useState('Tháng 09/2026');

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const totalTarget = kpis.reduce((sum, k) => sum + k.revenueTarget, 0);
  const totalAchieved = kpis.reduce((sum, k) => sum + k.revenueAchieved, 0);
  const overallRate = Math.round((totalAchieved / totalTarget) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Quản Lý Chỉ Tiêu (KPIs)</h2>
            <p className="text-xs text-slate-500">Theo dõi định ngạch doanh số tuyển sinh và hiệu suất chuyên viên tư vấn</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Kỳ chỉ tiêu:</span>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
            {selectedMonth}
          </span>
        </div>
      </div>

      {/* Overall KPI Progress Card */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-purple-200 font-semibold uppercase tracking-wider">
              Tổng tiến độ hoàn thành KPI Trung tâm
            </span>
            <div className="text-3xl font-black mt-1">
              {formatVND(totalAchieved)} / <span className="text-purple-300 text-xl">{formatVND(totalTarget)}</span>
            </div>
            <p className="text-xs text-purple-200 mt-1">
              Đạt <strong className="text-yellow-300 font-extrabold">{overallRate}%</strong> kế hoạch tháng. Còn 8 ngày làm việc để về đích.
            </p>
          </div>

          <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-yellow-400 flex items-center justify-center shrink-0">
            <div className="text-center">
              <span className="text-2xl font-black text-yellow-300">{overallRate}%</span>
              <span className="text-[10px] text-slate-200 block">Đạt mốc</span>
            </div>
          </div>
        </div>

        <div className="w-full bg-white/10 rounded-full h-2.5 mt-6 overflow-hidden">
          <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${Math.min(overallRate, 100)}%` }}></div>
        </div>
      </div>

      {/* Consultant KPI Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((k) => {
          const rate = Math.round((k.revenueAchieved / k.revenueTarget) * 100);
          const leadsRate = Math.round((k.leadsConverted / k.leadsTarget) * 100);

          return (
            <div
              key={k.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{k.staffName}</h3>
                    <span className="text-xs text-purple-700 font-medium">{k.role}</span>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    {rate}%
                  </span>
                </div>

                {/* Target vs Achieved */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Doanh thu đạt được:</span>
                    <strong className="text-slate-900">{formatVND(k.revenueAchieved)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Chỉ tiêu giao:</span>
                    <span className="text-slate-500">{formatVND(k.revenueTarget)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden my-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(rate, 100)}%` }}></div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600">
                    <span>Học viên mới chốt:</span>
                    <strong className="text-emerald-700">{k.leadsConverted}/{k.leadsTarget} học viên ({leadsRate}%)</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400 block text-[10px]">Chế độ thưởng mốc:</span>
                <span className="text-purple-700 font-bold text-[11px]">{k.bonusRate}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
