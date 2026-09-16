import React, { useState } from 'react';
import { X, Plus, Check, RotateCcw, Sparkles, BookOpen, Layers, Trash2 } from 'lucide-react';

interface HomeworkConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeworkItems?: string[];
  currentItems?: string[];
  onSave?: (items: string[]) => void;
  onSaveHomeworkItems?: (items: string[]) => void;
  onApplyAndSetAllDone?: () => void;
}

const PRESET_BUNDLES = [
  {
    name: 'Đầy đủ (6 mục tiêu chuẩn)',
    desc: 'Nghe, Nói, Đọc, Viết, Chép phạt, Chữa bài',
    items: ['Nghe', 'Nói', 'Đọc', 'Viết', 'Chép phạt', 'Chữa bài'],
    icon: '🎯',
  },
  {
    name: '4 Kỹ năng IELTS',
    desc: 'Listening, Speaking, Reading, Writing',
    items: ['Nghe', 'Nói', 'Đọc', 'Viết'],
    icon: '📚',
  },
  {
    name: 'Luyện đề & Chữa bài',
    desc: 'Luyện đề, Chữa bài, Chép phạt, Từ vựng',
    items: ['Luyện đề', 'Chữa bài', 'Chép phạt', 'Từ vựng'],
    icon: '📝',
  },
  {
    name: 'Kỷ luật & Nền tảng',
    desc: 'Từ vựng, Ngữ pháp, Chép phạt, Chữa bài',
    items: ['Từ vựng', 'Ngữ pháp', 'Chép phạt', 'Chữa bài'],
    icon: '⚡',
  },
];

const SUGGESTED_ITEMS = [
  'Nghe',
  'Nói',
  'Đọc',
  'Viết',
  'Chép phạt',
  'Chữa bài',
  'Từ vựng',
  'Ngữ pháp',
  'Luyện đề',
  'Dịch bài',
  'Phát âm',
  'Mini Test',
];

export const HomeworkConfigModal: React.FC<HomeworkConfigModalProps> = ({
  isOpen,
  onClose,
  homeworkItems,
  currentItems,
  onSave,
  onSaveHomeworkItems,
  onApplyAndSetAllDone,
}) => {
  const initialList = homeworkItems || currentItems || ['Nghe', 'Nói', 'Đọc', 'Viết', 'Chép phạt', 'Chữa bài'];
  const [items, setItems] = useState<string[]>(initialList);
  const [customInput, setCustomInput] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      setItems(homeworkItems || currentItems || ['Nghe', 'Nói', 'Đọc', 'Viết', 'Chép phạt', 'Chữa bài']);
    }
  }, [isOpen, homeworkItems, currentItems]);

  if (!isOpen) return null;

  const handleAddItem = (itemToAdd: string) => {
    const trimmed = itemToAdd.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) return;
    setItems((prev) => [...prev, trimmed]);
    setCustomInput('');
  };

  const handleRemoveItem = (itemToRemove: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i !== itemToRemove));
  };

  const handleSave = () => {
    if (items.length === 0) return;
    if (onSave) onSave(items);
    if (onSaveHomeworkItems) onSaveHomeworkItems(items);
    onClose();
  };

  const handleApplyAndSetAll = () => {
    if (items.length === 0) return;
    if (onSave) onSave(items);
    if (onSaveHomeworkItems) onSaveHomeworkItems(items);
    if (onApplyAndSetAllDone) {
      onApplyAndSetAllDone();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Thiết lập đề mục Bài tập về nhà (BTVN)</h3>
              <p className="text-xs text-slate-500">
                Cấu hình danh sách các phần bài tập được giao trong buổi học
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Homework Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>Đề mục BTVN buổi học hiện tại:</span>
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px] font-mono">
                {items.length} đề mục
              </span>
            </label>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 min-h-[58px] flex flex-wrap gap-2 items-center">
            {items.map((it) => (
              <span
                key={it}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs group"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{it}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(it)}
                  disabled={items.length <= 1}
                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors disabled:opacity-30 disabled:hover:text-slate-400"
                  title="Xóa đề mục này"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Add Custom Item Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Thêm đề mục tùy chỉnh mới:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="VD: Chữa bài Listening Cam 18, Viết Task 2..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem(customInput);
                }
              }}
              className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
            />
            <button
              type="button"
              onClick={() => handleAddItem(customInput)}
              disabled={!customInput.trim()}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-colors shadow-2xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm</span>
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
            Gợi ý nhanh (nhấp để thêm vào danh sách):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_ITEMS.map((sug) => {
              const isSelected = items.includes(sug);
              return (
                <button
                  key={sug}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      handleRemoveItem(sug);
                    } else {
                      handleAddItem(sug);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-800'
                  }`}
                >
                  {isSelected ? `✓ ${sug}` : `+ ${sug}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Presets */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
            Bộ đề mục mẫu có sẵn:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_BUNDLES.map((bundle) => (
              <button
                key={bundle.name}
                type="button"
                onClick={() => setItems(bundle.items)}
                className="p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-amber-50 hover:border-amber-300 transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 group-hover:text-amber-900">
                  <span>{bundle.icon}</span>
                  <span>{bundle.name}</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {bundle.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Hủy
          </button>

          <div className="flex items-center gap-2">
            {onApplyAndSetAllDone && (
              <button
                type="button"
                onClick={handleApplyAndSetAll}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Lưu các đề mục và đặt tất cả học sinh làm ĐỦ 100%"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Lưu & Đặt ĐỦ cả lớp</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Lưu danh sách đề mục</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
