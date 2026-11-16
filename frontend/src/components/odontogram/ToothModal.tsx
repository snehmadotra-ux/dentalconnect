"use client";

import React, { useState } from "react";
import { ToothRecord, ToothCondition } from "@/types/dental";
import { X, Check, AlertCircle } from "lucide-react";

interface ToothModalProps {
  tooth: ToothRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (toothNumber: number, condition: ToothCondition, surfaces: string, notes: string) => Promise<void>;
  isDentist: boolean;
  fdiNumber: number;
}

const CONDITION_OPTIONS: { value: ToothCondition; label: string; color: string; desc: string }[] = [
  { value: "HEALTHY", label: "Healthy / Sound", color: "bg-emerald-500", desc: "No active decay or pathology" },
  { value: "CARIES", label: "Caries (Cavity)", color: "bg-rose-500", desc: "Active decay requiring restoration" },
  { value: "FILLING", label: "Restored / Filling", color: "bg-blue-500", desc: "Composite resin or amalgam filling" },
  { value: "CROWN", label: "Crown / Cap", color: "bg-amber-500", desc: "Full coverage porcelain/ceramic crown" },
  { value: "ROOT_CANAL", label: "Root Canal (Endo)", color: "bg-purple-500", desc: "Pulp chamber treated and obturated" },
  { value: "IMPLANT", label: "Dental Implant", color: "bg-indigo-600", desc: "Titanium fixture integrated in bone" },
  { value: "MISSING", label: "Missing / Extracted", color: "bg-slate-400", desc: "Tooth absent from dental arch" },
  { value: "EXTRACTION_NEEDED", label: "Extraction Indicated", color: "bg-red-700", desc: "Severe infection or unrestorable" },
];

const SURFACES = [
  { code: "O", label: "Occlusal (Chewing surface)" },
  { code: "M", label: "Mesial (Towards midline)" },
  { code: "D", label: "Distal (Away from midline)" },
  { code: "B", label: "Buccal / Facial (Cheek side)" },
  { code: "L", label: "Lingual (Tongue side)" },
];

export const ToothModal: React.FC<ToothModalProps> = ({
  tooth,
  isOpen,
  onClose,
  onSave,
  isDentist,
  fdiNumber,
}) => {
  if (!isOpen || !tooth) return null;

  const [condition, setCondition] = useState<ToothCondition>(tooth.condition);
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>(
    tooth.surfaces ? tooth.surfaces.split("") : []
  );
  const [notes, setNotes] = useState<string>(tooth.notes || "");
  const [saving, setSaving] = useState(false);

  const toggleSurface = (code: string) => {
    if (!isDentist) return;
    if (selectedSurfaces.includes(code)) {
      setSelectedSurfaces(selectedSurfaces.filter((s) => s !== code));
    } else {
      setSelectedSurfaces([...selectedSurfaces, code]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(
        tooth.tooth_number,
        condition,
        selectedSurfaces.join(""),
        notes
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-cyan-600 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                Universal #{tooth.tooth_number} | FDI #{fdiNumber}
              </span>
            </div>
            <h3 className="text-xl font-bold mt-1">Tooth Clinical Record</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Condition Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Condition & Diagnosis
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONDITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={!isDentist}
                  onClick={() => setCondition(opt.value)}
                  className={`text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                    condition === opt.value
                      ? "border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  } ${!isDentist ? "cursor-default opacity-80" : ""}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 ${opt.color}`} />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{opt.label}</p>
                    <p className="text-[11px] text-slate-500 leading-tight">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Surfaces */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Affected Surfaces
            </label>
            <p className="text-xs text-slate-500 mb-2.5">
              Select anatomical surfaces involved in decay or restoration:
            </p>
            <div className="flex flex-wrap gap-2">
              {SURFACES.map((s) => {
                const isSelected = selectedSurfaces.includes(s.code);
                return (
                  <button
                    key={s.code}
                    type="button"
                    disabled={!isDentist}
                    onClick={() => toggleSurface(s.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {s.code} - {s.label.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Clinical Treatment Notes
            </label>
            <textarea
              disabled={!isDentist}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isDentist ? "Enter diagnosis notes, procedure history, or planned intervention..." : "No notes recorded."}
              rows={3}
              className="w-full text-sm rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {!isDentist && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>You are viewing this chart as a patient. Only licensed dentists can update tooth records.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
          >
            Close
          </button>
          {isDentist && (
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-5 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Record"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
