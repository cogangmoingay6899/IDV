import React, { useState } from 'react';
import {
  PackageCheck,
  Search,
  Plus,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2
} from 'lucide-react';
import { InventoryItem } from '../../types';

interface InventoryModuleProps {
  inventory: InventoryItem[];
  onUpdateStock: (itemId: string, newStock: number) => void;
  onAddItem: (item: InventoryItem) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  inventory,
  onUpdateStock,
  onAddItem,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Quản Lý Kho Hàng & Học Liệu</h2>
            <p className="text-xs text-slate-500">Giáo trình sách bài tập, áo đồng phục IDV, balo và ấn phẩm trung tâm</p>
          </div>
        </div>

        <button
          onClick={() => alert('Thêm ấn phẩm mới vào kho hàng')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nhập ấn phẩm mới</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên giáo trình, áo đồng phục, balo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="Giáo trình & Sách">Giáo trình & Sách</option>
            <option value="Đồng phục áo phông">Đồng phục áo phông</option>
            <option value="Balo trung tâm">Balo trung tâm</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Mã hàng</th>
                <th className="py-3 px-4">Tên ấn phẩm / Vật phẩm</th>
                <th className="py-3 px-4">Danh mục</th>
                <th className="py-3 px-4">Đơn vị</th>
                <th className="py-3 px-4 text-center">Tồn kho</th>
                <th className="py-3 px-4">Giá bán học viên</th>
                <th className="py-3 px-4">Cảnh báo tồn</th>
                <th className="py-3 px-4 text-right">Điều chỉnh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isLow = item.inStock <= item.minAlert;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{item.code}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-400">Giá vốn: {formatVND(item.costPrice)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{item.category}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.unit}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-black text-sm text-slate-900">{item.inStock}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{formatVND(item.unitPrice)}</td>
                    <td className="py-3.5 px-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Sắp hết (Dưới {item.minAlert})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đủ cung ứng</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onUpdateStock(item.id, item.inStock + 10)}
                          className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold"
                          title="Nhập thêm 10"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => onUpdateStock(item.id, Math.max(0, item.inStock - 1))}
                          className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold"
                          title="Xuất 1"
                        >
                          -1
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
