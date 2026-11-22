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

  const roleLabel = role === "DENTIST" ? "Doctor" : role === "PATIENT" ? "Patient" : role === "ADMIN" ? "Admin" : "";

  return (
    <header className="sticky top-0 z-40 bg-[#070a12]/90 backdrop-blur-xl border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => router.push(getHomeRoute())}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-white text-slate-950 flex items-center justify-center font-bold shadow-md transition-transform duration-200 group-hover:scale-105">
            <HeartPulse className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white tracking-tight">
              Dental Connect
            </span>
            {role && (
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-lg">
                {roleLabel}
              </span>
            )}
          </div>
        </div>

        {/* Minimal Context Navigation */}
        {tabs && onTabChange && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`h-8 px-3.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* User Identity & Logout */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono flex items-center justify-center text-[11px] font-bold">
                  {user.full_name?.charAt(0) || "U"}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-semibold text-white leading-tight text-xs">{user.full_name}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="h-9 px-4 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="h-9 px-4 text-xs font-bold text-slate-950 bg-white hover:bg-slate-200 rounded-xl transition-all duration-200 flex items-center gap-1.5"
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
