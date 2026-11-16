"use client";

import React, { useState } from "react";
import { ToothRecord, ToothCondition } from "@/types/dental";
import { PatientToothModal } from "./PatientToothModal";
import { Info, ShieldCheck, Sparkles } from "lucide-react";

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

const CONDITION_STYLES: Record<ToothCondition, { bg: string; border: string; label: string }> = {
  HEALTHY: { bg: "bg-white", border: "border-slate-300", label: "Sound & Healthy" },
  CARIES: { bg: "bg-rose-50", border: "border-rose-400", label: "Active Decay" },
  FILLING: { bg: "bg-blue-50", border: "border-blue-400", label: "Filled / Restored" },
  CROWN: { bg: "bg-amber-50", border: "border-amber-400", label: "Dental Crown" },
  ROOT_CANAL: { bg: "bg-purple-50", border: "border-purple-400", label: "Root Canal" },
  IMPLANT: { bg: "bg-indigo-50", border: "border-indigo-400", label: "Implant" },
  MISSING: { bg: "bg-slate-100", border: "border-dashed border-slate-300", label: "Extracted" },
  EXTRACTION_NEEDED: { bg: "bg-red-50", border: "border-red-500", label: "Evaluation Needed" },
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
        className={`w-9 h-14 sm:w-11 sm:h-16 rounded-lg border ${style.border} ${style.bg} flex flex-col items-center justify-between p-1 shadow-2xs hover:border-slate-400 transition-colors cursor-pointer group`}
      >
        <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-800">
          #{num}
        </span>
        <div
          className={`w-3 h-3 rounded-full ${
            cond === "HEALTHY"
              ? "bg-emerald-500"
              : cond === "CARIES"
              ? "bg-rose-500"
              : cond === "FILLING"
              ? "bg-blue-500"
              : cond === "CROWN"
              ? "bg-amber-500"
              : cond === "ROOT_CANAL"
              ? "bg-purple-500"
              : cond === "IMPLANT"
              ? "bg-indigo-600"
              : "bg-slate-300"
          }`}
        />
        <span className="text-[9px] font-medium text-slate-500 truncate max-w-full">
          {cond === "HEALTHY" ? "Sound" : cond.toLowerCase()}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              32-Tooth Dental Health Chart
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
              Patient Record
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Select any tooth to view condition status, notes, and oral hygiene guidance.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Sound</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Decay</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Filling</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Crown</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Root Canal</span>
          </div>
        </div>
      </div>

      {/* 32-Tooth Anatomical Layout */}
      <div className="space-y-6 py-4">
        {/* Upper Arch (Maxilla): Teeth 1 to 16 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Upper Dental Arch (Maxillary)
            </span>
            <span className="text-[10px] text-slate-400">Right → Left</span>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center justify-center gap-1.5 min-w-[700px] p-4 bg-slate-50 rounded-2xl border border-slate-100">
              {Array.from({ length: 16 }, (_, i) => renderTooth(i + 1))}
            </div>
          </div>
        </div>

        {/* Lower Arch (Mandible): Teeth 32 to 17 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Lower Dental Arch (Mandibular)
            </span>
            <span className="text-[10px] text-slate-400">Right → Left</span>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center justify-center gap-1.5 min-w-[700px] p-4 bg-slate-50 rounded-2xl border border-slate-100">
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
