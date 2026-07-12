"use client";

import { useEffect, useMemo, useState } from "react";

type Employee = {
  id?: string;
  employee_id?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
};

type AnnualLeaveTransaction = {
  id: string;
  employee_id: string;
  period_year: number;
  transaction_date: string;
  detail: string;
  total_leaves: number | string;
  used_leaves: number | string;
  calculated_balance?: number | string;
  entry_type?: string;
  created_at?: string;
};

type PeriodSummary = {
  periodYear: number;
  total: number;
  used: number;
  balance: number;
};

export default function AnnualLeaveRegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [transactions, setTransactions] = useState<
    AnnualLeaveTransaction[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRegister() {
      try {
        setLoading(true);
        setErrorMessage("");

        const { id } = await params;

        if (!active) return;

        setEmployeeId(id);

        const [employeeResponse, registerResponse] =
          await Promise.all([
            fetch(`/api/employees/${id}`, {
              cache: "no-store",
            }),
            fetch(
              `/api/annual-leave-transactions?employee_id=${encodeURIComponent(
                id
              )}`,
              {
                cache: "no-store",
              }
            ),
          ]);

        const employeeData = await employeeResponse.json();
        const registerData = await registerResponse.json();

        if (!employeeResponse.ok) {
          throw new Error(
            employeeData?.error ||
              "Unable to load employee information."
          );
        }

        if (!registerResponse.ok) {
          throw new Error(
            registerData?.error ||
              "Unable to load Annual Leave Register."
          );
        }

        if (!active) return;

        setEmployee(employeeData);
        setTransactions(
          Array.isArray(registerData) ? registerData : []
        );
      } catch (error) {
        if (!active) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load Annual Leave Register."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRegister();

    return () => {
      active = false;
    };
  }, [params]);

  const periodSummary = useMemo<PeriodSummary[]>(() => {
    const periods = new Map<number, PeriodSummary>();

    transactions.forEach((transaction) => {
      const periodYear = Number(transaction.period_year);

      if (!Number.isFinite(periodYear)) return;

      const current = periods.get(periodYear) || {
        periodYear,
        total: 0,
        used: 0,
        balance: 0,
      };

      current.total += Number(transaction.total_leaves || 0);
      current.used += Number(transaction.used_leaves || 0);
      current.balance = current.total - current.used;

      periods.set(periodYear, current);
    });

    return Array.from(periods.values()).sort(
      (a, b) => b.periodYear - a.periodYear
    );
  }, [transactions]);

  const grandTotal = periodSummary.reduce(
    (sum, period) => sum + period.total,
    0
  );

  const grandUsed = periodSummary.reduce(
    (sum, period) => sum + period.used,
    0
  );

  const grandBalance = grandTotal - grandUsed;

  const employeeName = employee
    ? `${employee.first_name || ""} ${
        employee.middle_name || ""
      } ${employee.last_name || ""}`
        .replace(/\s+/g, " ")
        .trim()
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] p-8">
        Loading Annual Leave Register...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <a
          href={`/employees/${employeeId}`}
          className="inline-flex items-center text-[#b59628] font-bold hover:underline"
        >
          ← Back to Employee Profile
        </a>

        <div className="mt-6 mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold text-[#3f4447]">
              Annual Leave Register
            </h1>

            <p className="text-gray-500 mt-2">
              {employeeName || "Employee"}
              {employee?.employee_id
                ? ` — ${employee.employee_id}`
                : ""}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() =>
                alert(
                  "Add Leave Period form will be connected in the next step."
                )
              }
              className="bg-[#d2b241] text-white px-5 py-3 rounded-xl font-bold"
            >
              + Add Leave Period
            </button>

            <button
              type="button"
              onClick={() =>
                alert(
                  "Encash Leave form will be connected after Add Leave Period."
                )
              }
              className="bg-[#3f4447] text-white px-5 py-3 rounded-xl font-bold"
            >
              − Encash Leave
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <SummaryCard
            title="Total Annual Leaves"
            value={`${grandTotal} Days`}
            subtitle="All leave periods combined"
          />

          <SummaryCard
            title="Total Used"
            value={`${grandUsed} Days`}
            subtitle="Leave taken and encashed"
          />

          <SummaryCard
            title="Current Balance"
            value={`${grandBalance} Days`}
            subtitle="Unused leave carried forward"
          />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#3f4447]">
                Annual Leave Period Summary
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Click View to open transactions for a specific
                leave period.
              </p>
            </div>

            <div className="text-sm font-semibold text-[#3f4447]">
              {periodSummary.length} Period
              {periodSummary.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="overflow-x-auto border rounded-xl">
            <table className="min-w-[800px] w-full text-sm">
              <thead>
                <tr className="bg-[#d2b241] text-white">
                  <th className="p-4 text-left">
                    Period
                  </th>

                  <th className="p-4 text-center">
                    Total
                  </th>

                  <th className="p-4 text-center">
                    Used
                  </th>

                  <th className="p-4 text-center">
                    Balance
                  </th>

                  <th className="p-4 text-center">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {periodSummary.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-gray-500"
                    >
                      No Annual Leave periods have been added
                      yet.
                    </td>
                  </tr>
                ) : (
                  periodSummary.map((period) => (
                    <tr
                      key={period.periodYear}
                      className="border-b hover:bg-[#f7f4ec]"
                    >
                      <td className="p-4 font-bold text-[#3f4447]">
                        {period.periodYear}
                      </td>

                      <td className="p-4 text-center font-semibold">
                        {period.total} Days
                      </td>

                      <td className="p-4 text-center font-semibold">
                        {period.used} Days
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full font-bold ${
                            period.balance > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {period.balance} Days
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <a
                          href={`/employees/${employeeId}/annual-leave-register/${period.periodYear}`}
                          className="text-[#b59628] font-bold hover:underline"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-2xl border-t-4 border-[#d2b241] shadow-sm p-6 text-center">
      <p className="text-gray-500">{title}</p>

      <h3 className="text-2xl font-bold text-[#3f4447] mt-2">
        {value}
      </h3>

      <p className="text-xs text-gray-400 mt-2">
        {subtitle}
      </p>
    </div>
  );
}
