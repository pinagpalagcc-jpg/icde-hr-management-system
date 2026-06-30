"use client";

import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const publicPages = ["/login", "/change-password"];

    if (publicPages.includes(path)) {
      setReady(true);
      return;
    }

    const userId = localStorage.getItem("icde_user_id");
    const role = localStorage.getItem("icde_user_role");

    if (!userId) {
      window.location.href = "/login";
      return;
    }

    if (role === "Staff" && !path.startsWith("/staff")) {
      window.location.href = "/staff";
      return;
    }

    setReady(true);
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
