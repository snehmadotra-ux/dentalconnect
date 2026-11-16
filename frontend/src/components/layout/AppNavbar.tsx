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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => router.push(getHomeRoute())}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <HeartPulse className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 tracking-tight">
              DentalConnect
            </span>
            {role && (
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                {roleLabel}
              </span>
            )}
          </div>
        </div>

        {/* Quiet Context Navigation */}
        {tabs && onTabChange && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`h-7 px-3 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-2xs"
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
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-white font-mono text-[11px]">
                  {user.full_name?.charAt(0) || "U"}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-medium text-slate-900 leading-tight text-xs">{user.full_name}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="h-8 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="h-8 px-3 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
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
