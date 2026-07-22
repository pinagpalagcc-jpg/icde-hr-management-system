"use client";

import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    async function logout() {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("Logout request failed:", error);
      } finally {
        localStorage.removeItem("icde_user_id");
        localStorage.removeItem("icde_user_role");

        document.cookie =
          "icde_auth=; path=/; max-age=0";

        window.location.replace("/login");
      }
    }

    logout();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="rounded-2xl bg-white px-8 py-6 shadow">
        <p className="font-semibold text-slate-700">
          Signing out securely...
        </p>
      </div>
    </main>
  );
}
