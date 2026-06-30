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
    const hasCookie = document.cookie.includes("icde_auth=");

    if (!userId && !hasCookie) {
      window.location.href = "/login";
      return;
    }

    setReady(true);
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
