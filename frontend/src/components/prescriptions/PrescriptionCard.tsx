"use client";

import React from "react";
import { Prescription } from "@/types/dental";
import { Pill, Calendar, CheckCircle2 } from "lucide-react";

interface PrescriptionCardProps {
  prescription: Prescription;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ prescription }) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-4 text-white">
      <div className="flex items-start justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Prescription by {prescription.dentist_name || "Practitioner"}
            </h3>
            <p className="text-xs text-slate-400">
              Patient: {prescription.patient_name || "Patient"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-white/5 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span className="tabular-nums">{new Date(prescription.issued_at).toLocaleDateString()}</span>
        </div>
      </div>

      {prescription.clinical_notes && (
        <div className="p-2.5 bg-slate-950/70 rounded-xl border border-white/5 text-xs text-slate-300">
          <span className="font-semibold text-slate-400">Clinical Advice: </span>
          {prescription.clinical_notes}
        </div>
      )}

      {/* Medications List */}
      <div className="space-y-2">
        {prescription.items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="flex items-start justify-between p-3 bg-slate-950/70 rounded-xl border border-white/5"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{item.medication_name}</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                  {item.dosage}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {item.frequency} • {item.duration}
              </p>
              {item.instructions && (
                <p className="text-[11px] text-slate-400 pt-0.5">
                  {item.instructions}
                </p>
              )}
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
};
