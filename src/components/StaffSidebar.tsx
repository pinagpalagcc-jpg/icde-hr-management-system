"use client";

type StaffSidebarProps = {
  active: string;
  employeeId: string;
};

export default function StaffSidebar({
  active,
  employeeId,
}: StaffSidebarProps) {
  const profileUrl = employeeId
    ? `/staff/profile/${employeeId}`
    : "/staff";

  const applyLeaveUrl = employeeId
    ? `/staff/apply-leave?employee_id=${employeeId}`
    : "/staff";

  const leaveRequestsUrl = employeeId
    ? `/staff/my-leave-requests?employee_id=${employeeId}`
    : "/staff";

  const items = [
    ["Dashboard", "/staff"],
    ["My Profile", profileUrl],
    ["Messenger", "/staff/messenger"],
    ["Apply Leave", applyLeaveUrl],
    ["My Leave Requests", leaveRequestsUrl],
  ];

  function signOut() {
    localStorage.clear();

    document.cookie =
      "icde_auth=; path=/; max-age=0";

    window.location.href = "/logout";
  }

  return (
    <aside className="hidden w-72 shrink-0 flex-col justify-between bg-[#3f4447] p-6 text-white md:flex">
      <div>
        <div className="mb-10">
          <div className="text-4xl font-black tracking-widest">
            <span className="text-white">
              IC
            </span>

            <span className="text-[#d2b241]">
              D
            </span>

            <span className="text-white">
              E
            </span>
          </div>

          <div className="mt-3 text-sm text-white/90">
            HR Management Portal
          </div>

          <div className="mt-3 h-[3px] w-24 rounded-full bg-[#d2b241]" />

          <div className="mt-3 text-xs text-white/60">
            @2026 V.1.1
          </div>
        </div>

        <nav className="space-y-3">
          {items.map(([name, href]) => (
            <a
              key={name}
              href={href}
              className={`block rounded-xl px-4 py-3 ${
                active === name
                  ? "bg-[#d2b241] font-semibold"
                  : "hover:bg-white/10"
              }`}
            >
              {name}
            </a>
          ))}
        </nav>
      </div>

      <button
        type="button"
        onClick={signOut}
        className="w-full rounded-2xl border border-white/25 py-4 font-semibold text-white hover:bg-white/10"
      >
        Sign Out
      </button>
    </aside>
  );
}
