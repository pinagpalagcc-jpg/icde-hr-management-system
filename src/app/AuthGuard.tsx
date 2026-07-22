"use client";

import { useEffect, useState } from "react";

type SessionData = {
  id?: string;
  userId?: string;
  role?: string;
  mustChangePassword?: boolean;
};

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const path = window.location.pathname;

    const publicPages = [
      "/login",
      "/logout",
      "/change-password",
    ];

    if (
      publicPages.some((page) =>
        path.startsWith(page)
      )
    ) {
      setReady(true);
      return;
    }

    async function verifySession() {
      const adminPages = [
        "/dashboard",
        "/employees",
        "/leave-requests",
        "/document-expiry",
        "/reports",
        "/departments",
      ];

      try {
        const response = await fetch(
          "/api/auth/session",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          window.location.replace("/login");
          return;
        }

        const session: SessionData =
          await response.json();

        const userId =
          session.userId || session.id || "";
        const role = session.role || "";

        if (!userId || !role) {
          window.location.replace("/login");
          return;
        }

        localStorage.setItem(
          "icde_user_id",
          userId
        );
        localStorage.setItem(
          "icde_user_role",
          role
        );

        if (
          role === "Staff" &&
          adminPages.some((page) =>
            path.startsWith(page)
          )
        ) {
          window.location.replace("/staff");
          return;
        }

        if (
          role === "Admin" &&
          path.startsWith("/staff")
        ) {
          window.location.replace(
            "/dashboard"
          );
          return;
        }

        if (active) setReady(true);
      } catch {
        window.location.replace("/login");
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="font-semibold text-slate-700">
          Verifying secure session...
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
