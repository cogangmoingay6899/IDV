import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import {
  STANDARD_DAY_PAIRS,
  STANDARD_TIME_SHIFTS,
  SCHEDULE_PRESETS,
  checkScheduleDisallowed,
  parseScheduleComponents,
} from '../../utils/courseSchedule';

interface StandardScheduleSelectorProps {
  value: string;
  onChange: (newSchedule: string) => void;
  className?: string;
  showCustomInput?: boolean;
}

export const StandardScheduleSelector: React.FC<StandardScheduleSelectorProps> = ({
  value,
  onChange,
  className = '',
  showCustomInput = true,
}) => {
  // Parse current value
  const parsed = parseScheduleComponents(value);
  const disallowedCheck = checkScheduleDisallowed(value);

  const [selectedPair, setSelectedPair] = useState<'t2_t5' | 't3_t6' | 't4_t7'>(parsed.pairKey);
  const [selectedShift, setSelectedShift] = useState<'ca1' | 'ca2' | 'custom'>(
    parsed.shiftId || 'ca1'
  );
  const [customStartTime, setCustomStartTime] = useState('18:00');
  const [customEndTime, setCustomEndTime] = useState('19:45');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Sync internal state when external value changes
  useEffect(() => {
    const current = parseScheduleComponents(value);
    setSelectedPair(current.pairKey);
    if (current.shiftId) {
      setSelectedShift(current.shiftId);
      setIsCustomMode(false);
    } else {
      // Check if there are times in string
      const timeMatch = value.match(/(\d{1,2}[:h]\d{0,2})\s*[-~–]\s*(\d{1,2}[:h]\d{0,2})/i);
      if (timeMatch) {
        setIsCustomMode(true);
        setSelectedShift('custom');
      }
    }
  }, [value]);

  const handleSelectPair = (pairId: 't2_t5' | 't3_t6' | 't4_t7') => {
    setSelectedPair(pairId);
    const pairObj = STANDARD_DAY_PAIRS.find((p) => p.id === pairId)!;

    if (selectedShift === 'custom' || isCustomMode) {
      const timeStr = `${customStartTime} - ${customEndTime}`;
      onChange(`${pairObj.label} (${timeStr})`);
    } else {
      const shiftObj = STANDARD_TIME_SHIFTS.find((s) => s.id === selectedShift) || STANDARD_TIME_SHIFTS[0];
      onChange(`${pairObj.label} (${shiftObj.name}: ${shiftObj.timeRange})`);
    }
  };

  const handleSelectShift = (shiftId: 'ca1' | 'ca2') => {
    setSelectedShift(shiftId);
    setIsCustomMode(false);
    const pairObj = STANDARD_DAY_PAIRS.find((p) => p.id === selectedPair)!;
    const shiftObj = STANDARD_TIME_SHIFTS.find((s) => s.id === shiftId)!;
    onChange(`${pairObj.label} (${shiftObj.name}: ${shiftObj.timeRange})`);
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = SCHEDULE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPair(preset.pairKey);
      setSelectedShift(preset.shift === 'Ca 1' ? 'ca1' : 'ca2');
      setIsCustomMode(false);
      onChange(preset.name);
    }
  };

  const handleApplyCustomTime = () => {
    const pairObj = STANDARD_DAY_PAIRS.find((p) => p.id === selectedPair)!;
    const timeStr = `${customStartTime} - ${customEndTime}`;
    onChange(`${pairObj.label} (${timeStr})`);
  };

  const currentPairObj = STANDARD_DAY_PAIRS.find((p) => p.id === selectedPair)!;

  return (
    <div className={`space-y-3.5 bg-slate-50/90 p-4 rounded-3xl border border-slate-200 shadow-xs ${className}`}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-200/80">
        <div>
          <label className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
            <Clock className="w-4 h-4 text-purple-700" />
            <span>Lịch học tuần 2 buổi chuẩn IDV:</span>
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Quy định: Chỉ học 2 buổi/tuần (<strong>Thứ 2 + 5</strong>, <strong>Thứ 3 + 6</strong>, hoặc <strong>Thứ 4 + 7</strong>)
          </p>
        </div>

        {/* Current Value Tag */}
        <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-900 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
          <span>{value || 'Chưa chọn lịch'}</span>
        </div>
      </div>

      {/* Disallowed Alert (if input previously had 2-4-6 or 3-5-7) */}
      {disallowedCheck.isDisallowed && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <div className="font-bold">{disallowedCheck.message}</div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => handleSelectPreset('t2_t5_ca1')}
                className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 text-[11px] transition-colors"
              >
                Chuyển ngay sang Thứ 2 + Thứ 5 (Ca 1)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('t3_t6_ca1')}
                className="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 font-bold rounded-lg hover:bg-rose-100 text-[11px] transition-colors"
              >
                Chuyển sang Thứ 3 + Thứ 6 (Ca 1)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Click to pick the 2-day pair */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-purple-700 text-white text-[10px] flex items-center justify-center font-black">1</span>
            <span>Bấm chọn Cặp Thứ học (Chỉ 3 lựa chọn duy nhất):</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Không có 2-4-6 hay 3-5-7</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {STANDARD_DAY_PAIRS.map((pair, idx) => {
            const isSelected = selectedPair === pair.id;
            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => handleSelectPair(pair.id)}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? `${pair.colorTheme.activeBg} ${pair.colorTheme.activeBorder} ${pair.colorTheme.activeText} shadow-md ring-2 ring-purple-400/40`
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : pair.colorTheme.badge
                    }`}
                  >
                    Lựa chọn {idx + 1}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="font-extrabold text-sm">{pair.label}</div>
                <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                  {pair.shortLabel} cố định hàng tuần
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Click to pick Shift (Ca học) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-purple-700 text-white text-[10px] flex items-center justify-center font-black">2</span>
            <span>Bấm chọn Khung Giờ / Ca học ({currentPairObj.label}):</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(!isCustomMode);
              if (!isCustomMode) {
                setSelectedShift('custom');
                handleApplyCustomTime();
              } else {
                handleSelectShift('ca1');
              }
            }}
            className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>{isCustomMode ? 'Dùng Ca chuẩn' : 'Tùy chỉnh giờ khác'}</span>
          </button>
        </div>

        {!isCustomMode ? (
          <div className="grid grid-cols-2 gap-2">
            {STANDARD_TIME_SHIFTS.map((shift) => {
              const isSelected = selectedShift === shift.id;
              return (
                <button
                  key={shift.id}
                  type="button"
                  onClick={() => handleSelectShift(shift.id)}
                  className={`py-2.5 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-800 text-white border-purple-800 shadow-xs font-bold ring-2 ring-purple-300'
                      : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200 font-semibold'
                  }`}
                >
                  <div className="text-xs font-black">{shift.name}</div>
                  <div className={`text-[11px] ${isSelected ? 'text-purple-100' : 'text-slate-500'}`}>
                    {shift.timeRange}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-3 rounded-2xl border border-purple-200 space-y-2">
            <div className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
              <span>Giờ học tùy chỉnh cho cặp <strong>{currentPairObj.label}</strong>:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Giờ bắt đầu:</label>
                <input
                  type="text"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  placeholder="18:00"
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Giờ kết thúc:</label>
                <input
                  type="text"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  placeholder="19:45"
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleApplyCustomTime}
              className="w-full py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Áp dụng: {currentPairObj.label} ({customStartTime} - {customEndTime})
            </button>
          </div>
        )}
      </div>

      {/* Step 3: Fast 1-Click Cards Grid */}
      <div className="pt-2 border-t border-slate-200/80">
        <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
          Hoặc bấm chọn nhanh từ 6 lịch mẫu cho sẵn (1-Chạm):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {SCHEDULE_PRESETS.map((preset) => {
            const isCurrent = value === preset.name;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-2.5 py-1.5 rounded-xl text-left border transition-all text-[11px] flex items-center justify-between cursor-pointer ${
                  isCurrent
                    ? 'bg-purple-700 text-white border-purple-700 font-bold shadow-xs'
                    : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200 font-medium'
                }`}
              >
                <div className="truncate">
                  <div className="font-extrabold">{preset.dayLabels}</div>
                  <div className={`text-[10px] ${isCurrent ? 'text-purple-100' : 'text-slate-500'}`}>
                    {preset.shift}: {preset.time}
                  </div>
                </div>
                {isCurrent && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
