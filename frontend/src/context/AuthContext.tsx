"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, PatientProfile } from "@/lib/api";

export interface UserSession {
  id: string;
  email: string;
  full_name: string;
  role: "ADMIN" | "DENTIST" | "PATIENT" | "STAFF";
  phone?: string;
  patient_profile?: PatientProfile;
  dentist_profile?: Record<string, any>;
}

interface AuthContextType {
  user: UserSession | null;
  role: "ADMIN" | "DENTIST" | "PATIENT" | "STAFF" | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<UserSession>;
  logout: () => void;
  setManualSession: (token: string, user: UserSession) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchSession = async () => {
    const storedToken = api.getToken();
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      setToken(storedToken);
      const userData = await api.getCurrentUser();
      setUser(userData as unknown as UserSession);
    } catch (err) {
      console.warn("Session restore failed:", err);
      api.clearToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, pass: string): Promise<UserSession> => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      setToken(res.access_token);
      const userData = (await api.getCurrentUser()) as unknown as UserSession;
      setUser(userData);
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    setToken(null);
    router.push("/login");
  };

  const setManualSession = (newToken: string, newUser: UserSession) => {
    api.setToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const userData = (await api.getCurrentUser()) as unknown as UserSession;
      setUser(userData);
    } catch (err) {
      console.error("Failed to refresh user profile", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isLoading,
        login,
        logout,
        setManualSession,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
