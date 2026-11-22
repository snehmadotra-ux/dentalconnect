"use client";

import React, { useState } from "react";
import { ToothRecord, ToothCondition } from "@/types/dental";
import { PatientToothModal } from "./PatientToothModal";

interface PatientOdontogramProps {
  teeth: ToothRecord[];
}

const TOOTH_NAMES: Record<number, string> = {
  1: "Upper Right 3rd Molar (Wisdom)",
  2: "Upper Right 2nd Molar",
  3: "Upper Right 1st Molar",
  4: "Upper Right 2nd Premolar",
  5: "Upper Right 1st Premolar",
  6: "Upper Right Canine",
  7: "Upper Right Lateral Incisor",
  8: "Upper Right Central Incisor",
  9: "Upper Left Central Incisor",
  10: "Upper Left Lateral Incisor",
  11: "Upper Left Canine",
  12: "Upper Left 1st Premolar",
  13: "Upper Left 2nd Premolar",
  14: "Upper Left 1st Molar",
  15: "Upper Left 2nd Molar",
  16: "Upper Left 3rd Molar (Wisdom)",
  17: "Lower Left 3rd Molar (Wisdom)",
  18: "Lower Left 2nd Molar",
  19: "Lower Left 1st Molar",
  20: "Lower Left 2nd Premolar",
  21: "Lower Left 1st Premolar",
  22: "Lower Left Canine",
  23: "Lower Left Lateral Incisor",
  24: "Lower Left Central Incisor",
  25: "Lower Right Central Incisor",
  26: "Lower Right Lateral Incisor",
  27: "Lower Right Canine",
  28: "Lower Right 1st Premolar",
  29: "Lower Right 2nd Premolar",
  30: "Lower Right 1st Molar",
  31: "Lower Right 2nd Molar",
  32: "Lower Right 3rd Molar (Wisdom)",
};

const CONDITION_STYLES: Record<ToothCondition, { bg: string; border: string; dot: string; label: string }> = {
  HEALTHY: { bg: "bg-slate-950/80", border: "border-white/10", dot: "bg-emerald-400", label: "Sound" },
  CARIES: { bg: "bg-rose-950/40", border: "border-rose-500/40", dot: "bg-rose-400", label: "Decay" },
  FILLING: { bg: "bg-sky-950/40", border: "border-sky-500/40", dot: "bg-sky-400", label: "Restored" },
  CROWN: { bg: "bg-amber-950/40", border: "border-amber-500/40", dot: "bg-amber-400", label: "Crown" },
  ROOT_CANAL: { bg: "bg-purple-950/40", border: "border-purple-500/40", dot: "bg-purple-400", label: "Root Canal" },
  IMPLANT: { bg: "bg-indigo-950/40", border: "border-indigo-500/40", dot: "bg-indigo-400", label: "Implant" },
  MISSING: { bg: "bg-slate-950/30", border: "border-dashed border-slate-700", dot: "bg-slate-600", label: "Missing" },
  EXTRACTION_NEEDED: { bg: "bg-red-950/40", border: "border-red-500/50", dot: "bg-red-400", label: "Eval Needed" },
};

export const PatientOdontogram: React.FC<PatientOdontogramProps> = ({ teeth }) => {
  const [selectedTooth, setSelectedTooth] = useState<ToothRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const teethMap = new Map<number, ToothRecord>();
  teeth.forEach((t) => teethMap.set(t.tooth_number, t));

  const handleToothClick = (num: number) => {
    const record = teethMap.get(num) || {
      id: `temp-${num}`,
      chart_id: "",
      tooth_number: num,
      condition: "HEALTHY",
      surfaces: null,
      notes: null,
      updated_at: new Date().toISOString(),
    };
    setSelectedTooth(record);
    setIsModalOpen(true);
  };

  const renderTooth = (num: number) => {
    const record = teethMap.get(num);
    const cond = record?.condition || "HEALTHY";
    const style = CONDITION_STYLES[cond] || CONDITION_STYLES.HEALTHY;

    return (
      <button
        key={num}
        type="button"
        onClick={() => handleToothClick(num)}
        title={`${TOOTH_NAMES[num]}: ${style.label}`}
        className={`w-9 h-14 sm:w-11 sm:h-16 rounded-xl border ${style.border} ${style.bg} flex flex-col items-center justify-between p-1.5 shadow-sm hover:border-cyan-400 transition-colors cursor-pointer group`}
      >
        <span className="text-[10px] font-mono text-slate-400 group-hover:text-white">
          #{num}
        </span>
        <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
        <span className="text-[9px] font-medium text-slate-400 truncate max-w-full">
          {style.label}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6 text-white">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            32-Tooth Digital Odontogram
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Universal Adult Dental Chart</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-white/5 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Sound</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span>Decay</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Restored</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Crown</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span>Root Canal</span>
          </div>
        </div>
      </div>

      {/* 32-Tooth Layout */}
      <div className="space-y-6 py-2">
        {/* Upper Arch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-400">
            <span>Upper Arch (Maxillary)</span>
            <span>#1 to #16</span>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center justify-center gap-1.5 min-w-[700px] p-4 bg-slate-950/70 rounded-2xl border border-white/5">
              {Array.from({ length: 16 }, (_, i) => renderTooth(i + 1))}
            </div>
          </div>
        </div>

        {/* Lower Arch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-400">
            <span>Lower Arch (Mandibular)</span>
            <span>#32 to #17</span>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center justify-center gap-1.5 min-w-[700px] p-4 bg-slate-950/70 rounded-2xl border border-white/5">
              {Array.from({ length: 16 }, (_, i) => renderTooth(32 - i))}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedTooth && (
        <PatientToothModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tooth={selectedTooth}
          toothName={TOOTH_NAMES[selectedTooth.tooth_number] || `Tooth #${selectedTooth.tooth_number}`}
        />
      )}
    </div>
  );
};
