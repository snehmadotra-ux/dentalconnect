"use client";

import React, { useState } from "react";
import { ToothRecord, ToothCondition } from "@/types/dental";
import { ToothModal } from "./ToothModal";
import { Info, Sparkles } from "lucide-react";

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
  HEALTHY: { bg: "bg-white", border: "border-slate-300", text: "text-slate-700", fill: "#ffffff" },
  CARIES: { bg: "bg-rose-50", border: "border-rose-500", text: "text-rose-700", fill: "#f43f5e" },
  FILLING: { bg: "bg-blue-50", border: "border-blue-500", text: "text-blue-700", fill: "#3b82f6" },
  CROWN: { bg: "bg-amber-50", border: "border-amber-500", text: "text-amber-700", fill: "#f59e0b" },
  ROOT_CANAL: { bg: "bg-purple-50", border: "border-purple-500", text: "text-purple-700", fill: "#8b5cf6" },
  IMPLANT: { bg: "bg-indigo-50", border: "border-indigo-600", text: "text-indigo-700", fill: "#4f46e5" },
  MISSING: { bg: "bg-slate-100", border: "border-dashed border-slate-400", text: "text-slate-400", fill: "#e2e8f0" },
  EXTRACTION_NEEDED: { bg: "bg-red-50", border: "border-red-600", text: "text-red-700", fill: "#b91c1c" },
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

  // Map teeth by number for fast access
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
        className={`group relative flex flex-col items-center justify-between p-2 rounded-xl border-2 transition-all duration-150 hover:scale-105 hover:shadow-md cursor-pointer ${colors.bg} ${colors.border}`}
        style={{ minWidth: "52px", minHeight: "80px" }}
      >
        <span className="text-[11px] font-bold text-slate-500 group-hover:text-sky-600 transition">
          #{displayNum}
        </span>

        {/* Anatomical SVG representation of Tooth Crown & Roots */}
        <div className="my-1">
          <svg width="32" height="38" viewBox="0 0 32 38" fill="none" className="transition-transform group-hover:-translate-y-0.5">
            {isMissing ? (
              <path d="M6 6L26 32M26 6L6 32" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
            ) : (
              <>
                {/* Tooth Roots */}
                <path
                  d="M9 16 C8 26, 11 34, 12 36 C13 34, 14 26, 16 18 C18 26, 19 34, 20 36 C21 34, 24 26, 23 16"
                  fill={cond === "ROOT_CANAL" ? "#ddd6fe" : "#f1f5f9"}
                  stroke={colors.border.replace("border-", "#").replace("rose-500", "#f43f5e").replace("blue-500", "#3b82f6").replace("amber-500", "#f59e0b").replace("purple-500", "#8b5cf6").replace("indigo-600", "#4f46e5").replace("slate-300", "#cbd5e1")}
                  strokeWidth="1.5"
                />
                {/* Tooth Crown (Chewing surface) */}
                <rect
                  x="5"
                  y="4"
                  width="22"
                  height="14"
                  rx="4"
                  fill={colors.fill}
                  stroke="#64748b"
                  strokeWidth="1.2"
                />
                {/* Surface cross lines for anatomical quadrant */}
                <path d="M16 4V18M5 11H27" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
              </>
            )}
          </svg>
        </div>

        {/* Surface notation / badge */}
        <div className="h-4 flex items-center">
          {record?.surfaces ? (
            <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-1 rounded">
              {record.surfaces}
            </span>
          ) : (
            <span className={`text-[9px] font-semibold uppercase ${colors.text}`}>
              {cond === "HEALTHY" ? "OK" : cond.slice(0, 3)}
            </span>
          )}
        </div>
      </button>
    );
  };

  // Adult 32 Teeth Layout:
  // Upper Maxillary: 1..8 (Right) and 9..16 (Left)
  // Lower Mandibular: 32..25 (Right) and 24..17 (Left)
  const upperRight = [1, 2, 3, 4, 5, 6, 7, 8];
  const upperLeft = [9, 10, 11, 12, 13, 14, 15, 16];
  const lowerRight = [32, 31, 30, 29, 28, 27, 26, 25];
  const lowerLeft = [24, 23, 22, 21, 20, 19, 18, 17];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      {/* Chart Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Adult Dental Chart (Odontogram)</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
              Interactive EMR
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Click any tooth to examine surfaces, inspect diagnostic history, or update clinical records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Notation Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setUseFDI(false)}
              className={`px-3 py-1.5 rounded-lg transition ${
                !useFDI ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Universal (1–32)
            </button>
            <button
              type="button"
              onClick={() => setUseFDI(true)}
              className={`px-3 py-1.5 rounded-lg transition ${
                useFDI ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              FDI (11–48)
            </button>
          </div>
        </div>
      </div>

      {/* Odontogram Mouth Diagram */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[900px] flex flex-col items-center gap-6">
          {/* Upper Jaw (Maxillary Arch) */}
          <div className="w-full">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
              <span>Patient Right (Upper Maxilla)</span>
              <span>Patient Left</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              {/* Upper Right 1-8 */}
              <div className="flex items-center gap-1.5">
                {upperRight.map(renderToothCell)}
              </div>
              <div className="w-px h-20 bg-slate-300 mx-2" />
              {/* Upper Left 9-16 */}
              <div className="flex items-center gap-1.5">
                {upperLeft.map(renderToothCell)}
              </div>
            </div>
          </div>

          {/* Occlusal Plane Guideline */}
          <div className="w-full flex items-center gap-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span>MIDLINE & OCCLUSAL PLANE</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Lower Jaw (Mandibular Arch) */}
          <div className="w-full">
            <div className="flex items-center justify-center gap-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              {/* Lower Right 32-25 */}
              <div className="flex items-center gap-1.5">
                {lowerRight.map(renderToothCell)}
              </div>
              <div className="w-px h-20 bg-slate-300 mx-2" />
              {/* Lower Left 24-17 */}
              <div className="flex items-center gap-1.5">
                {lowerLeft.map(renderToothCell)}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mt-2 px-2">
              <span>Patient Right (Lower Mandible)</span>
              <span>Patient Left</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Legend */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-400" /> Clinical Status Legend
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border border-slate-400 bg-white" />
            <span className="text-xs font-medium text-slate-700">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500" />
            <span className="text-xs font-medium text-slate-700">Caries (Cavity)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-slate-700">Restored / Filling</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500" />
            <span className="text-xs font-medium text-slate-700">Crown / Cap</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-purple-500" />
            <span className="text-xs font-medium text-slate-700">Root Canal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-600" />
            <span className="text-xs font-medium text-slate-700">Implant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-400" />
            <span className="text-xs font-medium text-slate-700">Missing</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-700" />
            <span className="text-xs font-medium text-slate-700">Extraction</span>
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
