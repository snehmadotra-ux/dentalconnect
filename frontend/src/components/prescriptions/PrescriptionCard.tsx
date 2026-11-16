"use client";

import React from "react";
import { Prescription } from "@/types/dental";
import { Pill, Calendar, CheckCircle2 } from "lucide-react";

interface PrescriptionCardProps {
  prescription: Prescription;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ prescription }) => {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 space-y-4">
      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Prescription from {prescription.dentist_name || "Practitioner"}
            </h3>
            <p className="text-xs text-slate-500">
              For {prescription.patient_name || "Patient"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          <Calendar className="w-3.5 h-3.5" />
          <span className="tabular-nums">{new Date(prescription.issued_at).toLocaleDateString()}</span>
        </div>
      </div>

      {prescription.clinical_notes && (
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 text-xs text-slate-600">
          <span className="font-medium text-slate-700">Clinical Advice: </span>
          {prescription.clinical_notes}
        </div>
      )}

      {/* Medications List */}
      <div className="space-y-2">
        {prescription.items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/60"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900">{item.medication_name}</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-200/60 px-1.5 py-0.5 rounded">
                  {item.dosage}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                <span>Frequency:</span> {item.frequency} • <span>Duration:</span> {item.duration}
              </p>
              {item.instructions && (
                <p className="text-[11px] text-slate-500 italic pt-0.5">
                  Instructions: {item.instructions}
                </p>
              )}
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
};
