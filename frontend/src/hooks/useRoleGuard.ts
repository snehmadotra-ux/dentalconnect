"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export type AppRole = "ADMIN" | "DENTIST" | "PATIENT" | "STAFF";

export function useRoleGuard(allowedRoles: AppRole[]) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user || !role) {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(role)) {
      // Bounce unauthorized user to their legitimate portal
      if (role === "ADMIN") {
        router.replace("/admin");
      } else if (role === "DENTIST") {
        router.replace("/doctor");
      } else {
        router.replace("/patient");
      }
      return;
    }

    setIsAuthorized(true);
  }, [user, role, isLoading, allowedRoles, router]);

  return { isAuthorized, user, role, isLoading };
}
