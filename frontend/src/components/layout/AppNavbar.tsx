"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  HeartPulse,
  LogOut,
  ArrowRight,
} from "lucide-react";

interface AppNavbarProps {
  activeTab?: string;
  onTabChange?: (tab: any) => void;
  tabs?: { id: string; label: string; icon?: React.ReactNode }[];
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  activeTab,
  onTabChange,
  tabs,
}) => {
  const { user, role, logout } = useAuth();
  const router = useRouter();

  const getHomeRoute = () => {
    if (role === "ADMIN") return "/admin";
    if (role === "DENTIST") return "/doctor";
    if (role === "PATIENT") return "/patient";
    return "/";
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => router.push(getHomeRoute())}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-900">
                Dental<span className="text-sky-600">Connect</span>
              </span>
              {role && (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    role === "ADMIN"
                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                      : role === "DENTIST"
                      ? "bg-sky-100 text-sky-800 border border-sky-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {role === "DENTIST" ? "CLINICAL DOCTOR" : role}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {role === "ADMIN"
                ? "Practice Administration & Governance"
                : role === "DENTIST"
                ? "Clinical Practice & Diagnostic Odontogram"
                : "Personal Dental Health Portal"}
            </p>
          </div>
        </div>

        {/* Dynamic Context Tabs (Only relevant to active view) */}
        {tabs && onTabChange && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* User Identity & Logout */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                    role === "ADMIN"
                      ? "bg-purple-600"
                      : role === "DENTIST"
                      ? "bg-sky-600"
                      : "bg-emerald-600"
                  }`}
                >
                  {user.full_name?.charAt(0) || "U"}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-bold text-slate-900 leading-tight">{user.full_name}</p>
                  <p className="text-[10px] text-slate-500">{user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-sky-600 transition"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <span>Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
