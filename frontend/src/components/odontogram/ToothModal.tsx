"use client";

import React, { useState } from "react";
import { ToothRecord, ToothCondition } from "@/types/dental";
import { X, Check } from "lucide-react";

interface ToothModalProps {
  tooth: ToothRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (toothNumber: number, condition: ToothCondition, surfaces: string, notes: string) => Promise<void>;
  isDentist: boolean;
  fdiNumber: number;
}

const CONDITION_OPTIONS: { value: ToothCondition; label: string; color: string; desc: string }[] = [
  { value: "HEALTHY", label: "Sound / Healthy", color: "bg-emerald-500", desc: "No active decay or pathology" },
  { value: "CARIES", label: "Caries (Cavity)", color: "bg-rose-500", desc: "Active decay requiring restoration" },
  { value: "FILLING", label: "Restored / Filling", color: "bg-blue-500", desc: "Composite resin or amalgam filling" },
  { value: "CROWN", label: "Crown / Cap", color: "bg-amber-500", desc: "Full coverage porcelain or ceramic crown" },
  { value: "ROOT_CANAL", label: "Root Canal (Endo)", color: "bg-purple-500", desc: "Pulp chamber treated and obturated" },
  { value: "IMPLANT", label: "Dental Implant", color: "bg-indigo-600", desc: "Titanium fixture integrated in bone" },
  { value: "MISSING", label: "Missing / Extracted", color: "bg-slate-400", desc: "Tooth absent from dental arch" },
  { value: "EXTRACTION_NEEDED", label: "Extraction Indicated", color: "bg-red-700", desc: "Severe infection or unrestorable" },
];

const SURFACES = [
  { code: "O", label: "Occlusal (Chewing)" },
  { code: "M", label: "Mesial (Midline)" },
  { code: "D", label: "Distal (Away)" },
  { code: "B", label: "Buccal (Cheek)" },
  { code: "L", label: "Lingual (Tongue)" },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Universal #{tooth.tooth_number} • FDI #{fdiNumber}
              </span>
              <span className="text-xs text-slate-500">Operatory Diagnostic</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Clinical Tooth Record</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Condition Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Diagnostic Condition
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONDITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={!isDentist}
                  onClick={() => setCondition(opt.value)}
                  className={`p-2.5 rounded-lg border text-left transition-colors flex items-center justify-between text-xs ${
                    condition === opt.value
                      ? "border-slate-900 bg-slate-50 font-medium text-slate-900"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                    <span>{opt.label}</span>
                  </div>
                  {condition === opt.value && <Check className="w-3.5 h-3.5 text-slate-900" />}
                </button>
              ))}
            </div>
          </div>

          {/* Surface Notation (M, D, O, B, L) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700">
                Involved Surfaces
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {selectedSurfaces.join("") || "None"}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {SURFACES.map((s) => {
                const isSelected = selectedSurfaces.includes(s.code);
                return (
                  <button
                    key={s.code}
                    type="button"
                    disabled={!isDentist}
                    onClick={() => toggleSurface(s.code)}
                    className={`py-2 px-1 text-center rounded-lg border text-xs transition-colors ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 font-medium"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-mono font-bold block">{s.code}</span>
                    <span className="text-[9px] block text-slate-400 truncate">{s.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-medium text-slate-700">
              Clinical Findings & Operative Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isDentist}
              placeholder="e.g., Small occlusal pit caries. Restored with shade A2 nano-hybrid composite..."
              rows={3}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors resize-none disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {isDentist && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-8 px-4 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Tooth Record"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
