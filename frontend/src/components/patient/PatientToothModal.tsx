"use client";

import React from "react";
import { ToothRecord } from "@/types/dental";
import { X, ShieldCheck, AlertCircle, HeartPulse, Calendar, Check } from "lucide-react";

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
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
          description: "This tooth is healthy with intact enamel and no detected signs of decay or pathology.",
          careAdvice: "Maintain twice-daily brushing with fluoride toothpaste and daily interdental flossing.",
        };
      case "CARIES":
        return {
          title: "Active Decay Detected",
          badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
          icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
          description: "Your dentist noted active surface decay requiring a restorative composite filling.",
          careAdvice: "Schedule a restorative consultation with your dentist to prevent decay reaching the inner pulp.",
        };
      case "FILLING":
        return {
          title: "Treated with Filling",
          badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
          icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
          description: "This tooth was previously treated with a durable dental restoration (filling).",
          careAdvice: "Keep the restoration clean with regular hygiene visits every 6 months.",
        };
      case "CROWN":
        return {
          title: "Protected with Dental Crown",
          badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <ShieldCheck className="w-5 h-5 text-amber-600" />,
          description: "A full-coverage ceramic/porcelain crown is protecting this tooth.",
          careAdvice: "Avoid biting exceptionally hard objects to preserve the crown margin.",
        };
      case "ROOT_CANAL":
        return {
          title: "Endodontic (Root Canal) Therapy",
          badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
          icon: <HeartPulse className="w-5 h-5 text-purple-600" />,
          description: "The inner root canal chamber was cleaned, disinfected, and sealed by your dental specialist.",
          careAdvice: "Ensure this tooth has an intact permanent restoration or crown to prevent fracture.",
        };
      case "IMPLANT":
        return {
          title: "Dental Implant",
          badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
          icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />,
          description: "An integrated titanium dental implant restoring root and crown function.",
          careAdvice: "Use an interdental brush around the implant post to maintain healthy surrounding gum tissue.",
        };
      case "MISSING":
        return {
          title: "Extracted or Missing Tooth",
          badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
          icon: <Calendar className="w-5 h-5 text-slate-500" />,
          description: "This tooth has been extracted (e.g. wisdom tooth removal or prior dental treatment).",
          careAdvice: "Consult your dentist if you wish to discuss tooth replacement options (implant or bridge).",
        };
      default:
        return {
          title: "Observation Needed",
          badgeColor: "bg-red-50 text-red-800 border-red-200",
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          description: "Your dentist has scheduled this tooth for clinical evaluation.",
          careAdvice: "Discuss treatment options during your next scheduled appointment.",
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 transition-opacity">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 space-y-4 p-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono text-slate-500">
              Tooth #{tooth.tooth_number}
            </span>
            <h3 className="text-base font-semibold text-slate-900 mt-0.5">{toothName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge */}
        <div className={`p-3.5 rounded-lg border flex items-start gap-3 ${status.badgeColor}`}>
          <div className="shrink-0 mt-0.5">{status.icon}</div>
          <div>
            <h4 className="font-medium text-sm">{status.title}</h4>
            <p className="text-xs mt-0.5 leading-relaxed opacity-90">{status.description}</p>
          </div>
        </div>

        {/* Doctor's Clinical Note (if any) */}
        {tooth.notes && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-medium text-slate-700">Doctor Note:</span>
            <p className="text-slate-600">&ldquo;{tooth.notes}&rdquo;</p>
          </div>
        )}

        {/* Oral Hygiene Advice */}
        <div className="space-y-1 text-xs">
          <p className="font-medium text-slate-700 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-slate-500" />
            Home Oral Care Guidance:
          </p>
          <p className="text-slate-500 leading-relaxed pl-5">{status.careAdvice}</p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
