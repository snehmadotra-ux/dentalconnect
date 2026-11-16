"use client";

import React, { useState } from "react";
import { ToothRecord, ToothCondition } from "@/types/dental";
import { ToothModal } from "./ToothModal";
import { Info } from "lucide-react";

interface DentalChartProps {
  teeth: ToothRecord[];
  patientId: string;
  isDentist: boolean;
  onToothUpdated?: (tooth: ToothRecord) => void;
}

// FDI conversion lookup
const UNIVERSAL_TO_FDI: Record<number, number> = {
  1: 18, 2: 17, 3: 16, 4: 15, 5: 14, 6: 13, 7: 12, 8: 11,
  9: 21, 10: 22, 11: 23, 12: 24, 13: 25, 14: 26, 15: 27, 16: 28,
  17: 38, 18: 37, 19: 36, 20: 35, 21: 34, 22: 33, 23: 32, 24: 31,
  25: 41, 26: 42, 27: 43, 28: 44, 29: 45, 30: 46, 31: 47, 32: 48,
};

const CONDITION_COLORS: Record<ToothCondition, { bg: string; border: string; text: string; fill: string }> = {
  HEALTHY: { bg: "bg-white", border: "border-slate-300", text: "text-slate-600", fill: "#ffffff" },
  CARIES: { bg: "bg-rose-50", border: "border-rose-400", text: "text-rose-700", fill: "#f43f5e" },
  FILLING: { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-700", fill: "#3b82f6" },
  CROWN: { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-700", fill: "#f59e0b" },
  ROOT_CANAL: { bg: "bg-purple-50", border: "border-purple-400", text: "text-purple-700", fill: "#8b5cf6" },
  IMPLANT: { bg: "bg-indigo-50", border: "border-indigo-400", text: "text-indigo-700", fill: "#4f46e5" },
  MISSING: { bg: "bg-slate-100", border: "border-dashed border-slate-300", text: "text-slate-400", fill: "#e2e8f0" },
  EXTRACTION_NEEDED: { bg: "bg-red-50", border: "border-red-500", text: "text-red-700", fill: "#b91c1c" },
};

export const DentalChart: React.FC<DentalChartProps> = ({
  teeth,
  patientId,
  isDentist,
  onToothUpdated,
}) => {
  const [selectedTooth, setSelectedTooth] = useState<ToothRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [useFDI, setUseFDI] = useState(false);

  const teethMap = new Map<number, ToothRecord>();
  teeth.forEach((t) => teethMap.set(t.tooth_number, t));

  const handleToothClick = (toothNumber: number) => {
    const record = teethMap.get(toothNumber) || {
      id: `temp-${toothNumber}`,
      chart_id: "",
      tooth_number: toothNumber,
      condition: "HEALTHY",
      surfaces: null,
      notes: null,
      updated_at: new Date().toISOString(),
    };
    setSelectedTooth(record);
    setIsModalOpen(true);
  };

  const handleSaveTooth = async (
    toothNumber: number,
    condition: ToothCondition,
    surfaces: string,
    notes: string
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/charts/patients/${patientId}/teeth/${toothNumber}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("dc_token") || ""}`,
          },
          body: JSON.stringify({ condition, surfaces, notes }),
        }
      );
      if (response.ok) {
        const updated = await response.json();
        if (onToothUpdated) onToothUpdated(updated);
      }
    } catch (err) {
      console.error("Failed to save tooth update", err);
    }
  };

  const renderToothCell = (toothNum: number) => {
    const record = teethMap.get(toothNum);
    const cond = record?.condition || "HEALTHY";
    const colors = CONDITION_COLORS[cond];
    const displayNum = useFDI ? UNIVERSAL_TO_FDI[toothNum] : toothNum;
    const isMissing = cond === "MISSING";

    return (
      <button
        key={toothNum}
        type="button"
        onClick={() => handleToothClick(toothNum)}
        className={`group relative flex flex-col items-center justify-between p-1.5 rounded-lg border transition-colors cursor-pointer ${colors.bg} ${colors.border} hover:border-slate-500`}
        style={{ minWidth: "48px", minHeight: "76px" }}
      >
        <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-900 transition-colors">
          #{displayNum}
        </span>

        {/* Anatomical SVG representation of Tooth Crown & Roots */}
        <div className="my-1">
          <svg width="28" height="34" viewBox="0 0 32 38" fill="none">
            {isMissing ? (
              <path d="M6 6L26 32M26 6L6 32" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <>
                {/* Tooth Roots */}
                <path
                  d="M9 16 C8 26, 11 34, 12 36 C13 34, 14 26, 16 18 C18 26, 19 34, 20 36 C21 34, 24 26, 23 16"
                  fill={cond === "ROOT_CANAL" ? "#ddd6fe" : "#f8fafc"}
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                />
                {/* Tooth Crown */}
                <rect
                  x="5"
                  y="4"
                  width="22"
                  height="14"
                  rx="3"
                  fill={colors.fill}
                  stroke="#64748b"
                  strokeWidth="1.2"
                />
                {/* Surface quadrant lines */}
                <path d="M16 4V18M5 11H27" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
              </>
            )}
          </svg>
        </div>

        {/* Surface notation / condition badge */}
        <div className="h-3.5 flex items-center">
          {record?.surfaces ? (
            <span className="text-[9px] font-mono font-medium bg-slate-900 text-white px-1 rounded">
              {record.surfaces}
            </span>
          ) : (
            <span className={`text-[9px] font-mono ${colors.text}`}>
              {cond === "HEALTHY" ? "OK" : cond.slice(0, 3)}
            </span>
          )}
        </div>
      </button>
    );
  };

  // Adult 32 Teeth Layout:
  const upperRight = [1, 2, 3, 4, 5, 6, 7, 8];
  const upperLeft = [9, 10, 11, 12, 13, 14, 15, 16];
  const lowerRight = [32, 31, 30, 29, 28, 27, 26, 25];
  const lowerLeft = [24, 23, 22, 21, 20, 19, 18, 17];

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 space-y-5">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">Adult Odontogram (32 Teeth)</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Chairside Charting
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any tooth to edit diagnostic condition, surface notations (M, D, O, B, L), or clinical notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Notation Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setUseFDI(false)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                !useFDI ? "bg-white text-slate-900 shadow-2xs font-medium" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Universal (1–32)
            </button>
            <button
              type="button"
              onClick={() => setUseFDI(true)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                useFDI ? "bg-white text-slate-900 shadow-2xs font-medium" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              FDI (11–48)
            </button>
          </div>
        </div>
      </div>

      {/* Odontogram Mouth Diagram */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[840px] flex flex-col items-center gap-4">
          {/* Upper Jaw (Maxillary Arch) */}
          <div className="w-full">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 px-2">
              <span>Upper Maxilla — Patient Right</span>
              <span>Patient Left</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
              <div className="flex items-center gap-1">
                {upperRight.map(renderToothCell)}
              </div>
              <div className="w-px h-16 bg-slate-300 mx-2" />
              <div className="flex items-center gap-1">
                {upperLeft.map(renderToothCell)}
              </div>
            </div>
          </div>

          {/* Occlusal Plane Guideline */}
          <div className="w-full flex items-center gap-3 text-[10px] text-slate-400 font-mono px-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span>Midline and occlusal plane</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Lower Jaw (Mandibular Arch) */}
          <div className="w-full">
            <div className="flex items-center justify-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
              <div className="flex items-center gap-1">
                {lowerRight.map(renderToothCell)}
              </div>
              <div className="w-px h-16 bg-slate-300 mx-2" />
              <div className="flex items-center gap-1">
                {lowerLeft.map(renderToothCell)}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 px-2">
              <span>Lower Mandible — Patient Right</span>
              <span>Patient Left</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Legend */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Info className="w-3.5 h-3.5" />
          <span className="font-medium">Condition Legend</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-white" />
            <span className="text-xs text-slate-600">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-xs text-slate-600">Caries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs text-slate-600">Restored</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-600">Crown</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-xs text-slate-600">Endo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span className="text-xs text-slate-600">Implant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-600">Missing</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-700" />
            <span className="text-xs text-slate-600">Extraction</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ToothModal
        tooth={selectedTooth}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTooth}
        isDentist={isDentist}
        fdiNumber={selectedTooth ? UNIVERSAL_TO_FDI[selectedTooth.tooth_number] : 0}
      />
    </div>
  );
};
