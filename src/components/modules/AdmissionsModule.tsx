import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Kanban,
  List,
  Plus,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Share2,
  Clock
} from 'lucide-react';
import { LeadAdmission } from '../../types';

interface AdmissionsModuleProps {
  leads: LeadAdmission[];
  onAddLead: () => void;
  onUpdateLeadStage: (leadId: string, newStage: LeadAdmission['stage']) => void;
  onConvertToStudent: (lead: LeadAdmission) => void;
}

export const AdmissionsModule: React.FC<AdmissionsModuleProps> = ({
  leads,
  onAddLead,
  onUpdateLeadStage,
  onConvertToStudent,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const stages: LeadAdmission['stage'][] = [
    'Tiếp cận mới',
    'Đã liên hệ',
    'Hẹn test đầu vào',
    'Hẹn học thử',
    'Chờ đóng phí',
    'Đã nhập học',
  ];

  const stageColors: Record<LeadAdmission['stage'], string> = {
    'Tiếp cận mới': 'bg-blue-50 text-blue-700 border-blue-200',
    'Đã liên hệ': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Hẹn test đầu vào': 'bg-purple-50 text-purple-700 border-purple-200',
    'Hẹn học thử': 'bg-amber-50 text-amber-700 border-amber-200',
    'Chờ đóng phí': 'bg-orange-50 text-orange-700 border-orange-200',
    'Đã nhập học': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Hủy tư vấn': 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.targetCourse.toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === 'all' || l.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Quản Lý Tuyển Sinh (CRM)</h2>
            <p className="text-xs text-slate-500">Phễu tư vấn khách hàng tiềm năng, lịch hẹn test & chuyển đổi học viên</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === 'kanban' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
          </div>

          <button
            onClick={onAddLead}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Lead mới</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên khách, SĐT, khóa học mong muốn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Nguồn khách:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="all">Tất cả nguồn kênh</option>
            <option value="Facebook Ads">Facebook Ads</option>
            <option value="Google">Google Search</option>
            <option value="Giới thiệu">Người quen giới thiệu</option>
            <option value="TikTok">TikTok</option>
            <option value="Trực tiếp tại cơ sở">Trực tiếp tại cơ sở</option>
          </select>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage);
            return (
              <div
                key={stage}
                className="bg-slate-50/70 rounded-2xl p-3 border border-slate-200/80 min-w-[240px] flex flex-col h-full"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 tracking-tight truncate">{stage}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards in Column */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-slate-900 line-clamp-1">{lead.name}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                          {lead.source}
                        </span>
                      </div>

                      <div className="text-[11px] text-purple-700 font-semibold mb-2 line-clamp-1">
                        {lead.targetCourse}
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 mb-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{lead.phone}</span>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100 mb-2">
                        {lead.notes}
                      </p>

                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                        <span>TV: {lead.consultantName}</span>
                        <span className="font-semibold text-slate-700">{formatVND(lead.expectedRevenue)}</span>
                      </div>

                      {/* Quick stage advance */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                        <select
                          value={lead.stage}
                          onChange={(e) => onUpdateLeadStage(lead.id, e.target.value as LeadAdmission['stage'])}
                          className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 focus:outline-none w-full"
                        >
                          {stages.map((s) => (
                            <option key={s} value={s}>
                              Chuyển: {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {lead.stage === 'Chờ đóng phí' && (
                        <button
                          onClick={() => onConvertToStudent(lead)}
                          className="w-full mt-2 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Nhập học & Tạo mã HV</span>
                        </button>
                      )}
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="h-20 flex items-center justify-center text-[11px] text-slate-400 italic">
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Số điện thoại</th>
                  <th className="py-3 px-4">Khóa học quan tâm</th>
                  <th className="py-3 px-4">Kênh nguồn</th>
                  <th className="py-3 px-4">Chuyên viên tư vấn</th>
                  <th className="py-3 px-4">Giai đoạn phễu</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{lead.name}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono">{lead.phone}</td>
                    <td className="py-3.5 px-4 font-medium text-purple-700">{lead.targetCourse}</td>
                    <td className="py-3.5 px-4 text-slate-500">{lead.source}</td>
                    <td className="py-3.5 px-4 text-slate-700">{lead.consultantName}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${stageColors[lead.stage]}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {lead.stage === 'Chờ đóng phí' ? (
                        <button
                          onClick={() => onConvertToStudent(lead)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                        >
                          Nhập học
                        </button>
                      ) : (
                        <select
                          value={lead.stage}
                          onChange={(e) => onUpdateLeadStage(lead.id, e.target.value as LeadAdmission['stage'])}
                          className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700"
                        >
                          {stages.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
