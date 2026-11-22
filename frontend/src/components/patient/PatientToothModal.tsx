"use client";

import React from "react";
import { ToothRecord } from "@/types/dental";
import { X, ShieldCheck, AlertCircle, HeartPulse, Calendar } from "lucide-react";

interface PatientToothModalProps {
  tooth: ToothRecord | null;
  isOpen: boolean;
  onClose: () => void;
  toothName: string;
}

export const PatientToothModal: React.FC<PatientToothModalProps> = ({
  tooth,
  isOpen,
  onClose,
  toothName,
}) => {
  if (!isOpen || !tooth) return null;

  const getStatusDisplay = () => {
    switch (tooth.condition) {
      case "HEALTHY":
        return {
          title: "Sound & Healthy",
          badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          description: "Enamel intact with no detected caries or pathology.",
        };
      case "CARIES":
        return {
          title: "Active Decay",
          badgeColor: "bg-rose-500/10 text-rose-300 border-rose-500/30",
          icon: <AlertCircle className="w-5 h-5 text-rose-400" />,
          description: "Active surface decay requiring restorative treatment.",
        };
      case "FILLING":
        return {
          title: "Treated (Filling)",
          badgeColor: "bg-sky-500/10 text-sky-300 border-sky-500/30",
          icon: <ShieldCheck className="w-5 h-5 text-sky-400" />,
          description: "Treated with a dental restoration.",
        };
      case "CROWN":
        return {
          title: "Protected (Crown)",
          badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
          icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
          description: "Full coverage crown intact.",
        };
      case "ROOT_CANAL":
        return {
          title: "Root Canal Therapy",
          badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/30",
          icon: <HeartPulse className="w-5 h-5 text-purple-400" />,
          description: "Endodontic therapy completed.",
        };
      case "IMPLANT":
        return {
          title: "Dental Implant",
          badgeColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
          icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
          description: "Integrated titanium dental implant.",
        };
      case "MISSING":
        return {
          title: "Extracted or Missing",
          badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
          icon: <Calendar className="w-5 h-5 text-slate-400" />,
          description: "Tooth absent from dental arch.",
        };
      default:
        return {
          title: "Observation Needed",
          badgeColor: "bg-red-500/10 text-red-300 border-red-500/30",
          icon: <AlertCircle className="w-5 h-5 text-red-400" />,
          description: "Scheduled for clinical examination.",
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden space-y-5 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
              Tooth #{tooth.tooth_number}
            </span>
            <h3 className="text-base font-bold text-white mt-1.5">{toothName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge */}
        <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${status.badgeColor}`}>
          <div className="shrink-0 mt-0.5">{status.icon}</div>
          <div>
            <h4 className="font-bold text-sm">{status.title}</h4>
            <p className="text-xs mt-0.5 leading-relaxed opacity-90">{status.description}</p>
          </div>
        </div>

        {/* Doctor's Note */}
        {tooth.notes && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs space-y-1">
            <span className="font-semibold text-slate-400">Doctor Note:</span>
            <p className="text-slate-200">{tooth.notes}</p>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-200 text-slate-950 font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
