"use client";

import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;

    const publicPages = ["/login", "/change-password"];

    const adminPages = [
      "/dashboard",
      "/employees",
      "/leave-requests",
      "/document-expiry",
      "/reports",
    ];

    const userId = localStorage.getItem("icde_user_id");
    const role = localStorage.getItem("icde_user_role");

    if (publicPages.some((p) => path.startsWith(p))) {
      setReady(true);
      return;
    }

    if (!userId || !role) {
      window.location.replace("/login");
      return;
    }

    if (role === "Staff" && adminPages.some((p) => path.startsWith(p))) {
      window.location.replace("/staff");
      return;
    }

    if (role === "Admin" && path.startsWith("/staff")) {
      window.location.replace("/dashboard");
      return;
    }

    setReady(true);
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
