"use client";

import { useEffect, useMemo, useState } from "react";

type Employee = {
  employee_id?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
};

type Transaction = {
  id: string;
  period_year: number;
  transaction_date: string;
  detail: string;
  total_leaves: number | string;
  used_leaves: number | string;
};

type PeriodSummary = {
  periodYear: number;
  total: number;
  used: number;
  balance: number;
};

type FormMode = "add" | "encash" | null;

export default function AnnualLeaveRegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [formMode, setFormMode] = useState<FormMode>(null);

  const [form, setForm] = useState({
    period_year: String(new Date().getFullYear()),
    transaction_date: new Date().toISOString().slice(0, 10),
    days: "",
    detail: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadRegister(id: string) {
    try {
      setLoading(true);
      setErrorMessage("");

      const [employeeResponse, registerResponse] =
        await Promise.all([
          fetch(`/api/employees/${id}`, {
            cache: "no-store",
          }),
          fetch(
            `/api/maternity-leave-transactions?employee_id=${encodeURIComponent(
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
            "Unable to load Maternity Leave Register."
        );
      }

      setEmployee(employeeData);
      setTransactions(
        Array.isArray(registerData) ? registerData : []
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Maternity Leave Register."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    params.then(({ id }) => {
      setEmployeeId(id);
      loadRegister(id);
    });
  }, [params]);

  const periods = useMemo<PeriodSummary[]>(() => {
    const map = new Map<number, PeriodSummary>();

    transactions.forEach((transaction) => {
      const year = Number(transaction.period_year);

      const current = map.get(year) || {
        periodYear: year,
        total: 0,
        used: 0,
        balance: 0,
      };

      current.total += Number(transaction.total_leaves || 0);
      current.used += Number(transaction.used_leaves || 0);
      current.balance = current.total - current.used;

      map.set(year, current);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.periodYear - a.periodYear
    );
  }, [transactions]);

  const total = periods.reduce(
    (sum, period) => sum + period.total,
    0
  );

  const used = periods.reduce(
    (sum, period) => sum + period.used,
    0
  );

  const balance = total - used;

  const employeeName = employee
    ? `${employee.first_name || ""} ${
        employee.middle_name || ""
      } ${employee.last_name || ""}`
        .replace(/\s+/g, " ")
        .trim()
    : "";

  function openForm(mode: Exclude<FormMode, null>) {
    setFormMode(mode);
    setErrorMessage("");
    setSuccessMessage("");

    setForm({
      period_year: String(new Date().getFullYear()),
      transaction_date: new Date().toISOString().slice(0, 10),
      days: "",
      detail:
        mode === "add"
          ? "Maternity Leave Entitlement"
          : "Maternity Leave Encashment",
    });
  }

  async function saveTransaction() {
    const year = Number(form.period_year);
    const days = Number(form.days);

    if (!Number.isInteger(year) || year < 1900) {
      setErrorMessage("Please enter a valid period year.");
      return;
    }

    if (!form.transaction_date) {
      setErrorMessage("Please select the transaction date.");
      return;
    }

    if (!Number.isFinite(days) || days <= 0) {
      setErrorMessage("Days must be greater than zero.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const isAdd = formMode === "add";

      const response = await fetch(
        "/api/maternity-leave-transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_id: employeeId,
            period_year: year,
            transaction_date: form.transaction_date,
            detail:
              form.detail ||
              (isAdd
                ? `Maternity Leave Entitlement - ${year}`
                : `Maternity Leave Encashment - ${year}`),
            total_leaves: isAdd ? days : 0,
            used_leaves: isAdd ? 0 : days,
            entry_type: isAdd
              ? "ENTITLEMENT"
              : "ENCASHMENT",
            remarks: form.detail || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to save Maternity Leave transaction."
        );
      }

      await loadRegister(employeeId);

      setSuccessMessage(
        isAdd
          ? `Maternity Leave period ${year} added successfully.`
          : `${days} Maternity Leave day(s) encashed from period ${year}.`
      );

      setFormMode(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save Maternity Leave transaction."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] p-8">
        Loading Maternity Leave Register...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <a
          href={`/employees/${employeeId}`}
          className="text-[#b59628] font-bold hover:underline"
        >
          ← Back to Employee Profile
        </a>

        <div className="mt-6 mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold text-[#3f4447]">
              Maternity Leave Register
            </h1>

            <p className="text-gray-500 mt-2">
              {employeeName || "Employee"}
              {employee?.employee_id
                ? ` — ${employee.employee_id}`
                : ""}
            </p>
          </div>

          {!(
            typeof window !== "undefined" &&
            new URLSearchParams(window.location.search).get("portal") ===
              "staff"
          ) ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => openForm("add")}
                className="bg-[#d2b241] text-white px-5 py-3 rounded-xl font-bold"
              >
                + Add Leave Period
              </button>

              <label className="flex items-center gap-2 px-5 py-3 border rounded-xl font-semibold">
  <input type="checkbox" />
  <span>Not Applicable</span>
</label>
            </div>
          ) : (
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-3 text-blue-700 font-semibold">
              Read-only Maternity Leave Register
            </div>
          )}
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            {successMessage}
          </div>
        ) : null}

        {formMode &&
        !(
          typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("portal") ===
            "staff"
        ) ? (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-[#3f4447] mb-5">
              {formMode === "add"
                ? "Add Maternity Leave Period"
                : "Encash Maternity Leave"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <Field
                label="Period"
                type="number"
                value={form.period_year}
                onChange={(value) =>
                  setForm({
                    ...form,
                    period_year: value,
                  })
                }
              />

              <Field
                label="Date"
                type="date"
                value={form.transaction_date}
                onChange={(value) =>
                  setForm({
                    ...form,
                    transaction_date: value,
                  })
                }
              />

              <Field
                label={
                  formMode === "add"
                    ? "Total Leaves"
                    : "Days Encashed"
                }
                type="number"
                value={form.days}
                onChange={(value) =>
                  setForm({
                    ...form,
                    days: value,
                  })
                }
              />

              <Field
                label="Detail"
                type="text"
                value={form.detail}
                onChange={(value) =>
                  setForm({
                    ...form,
                    detail: value,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setFormMode(null)}
                className="bg-gray-200 text-[#3f4447] px-5 py-3 rounded-xl font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveTransaction}
                disabled={saving}
                className="bg-[#3f4447] text-white px-6 py-3 rounded-xl font-bold disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <SummaryCard
            title="Total Maternity Leaves"
            value={`${total} Days`}
          />

          <SummaryCard
            title="Total Used"
            value={`${used} Days`}
          />

          <SummaryCard
            title="Current Balance"
            value={`${balance} Days`}
          />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">
            Maternity Leave Period Summary
          </h2>

          <div className="overflow-x-auto border rounded-xl">
            <table className="min-w-[800px] w-full text-sm">
              <thead>
                <tr className="bg-[#d2b241] text-white">
                  <th className="p-4 text-left">Period</th>
                  <th className="p-4 text-center">Total</th>
                  <th className="p-4 text-center">Used</th>
                  <th className="p-4 text-center">Balance</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {periods.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-gray-500"
                    >
                      No Maternity Leave periods have been added.
                    </td>
                  </tr>
                ) : (
                  periods.map((period) => (
                    <tr
                      key={period.periodYear}
                      className="border-b"
                    >
                      <td className="p-4 font-bold">
                        {period.periodYear}
                      </td>

                      <td className="p-4 text-center">
                        {period.total} Days
                      </td>

                      <td className="p-4 text-center">
                        {period.used} Days
                      </td>

                      <td className="p-4 text-center font-bold">
                        {period.balance} Days
                      </td>

                      <td className="p-4 text-center">
                        <a
                          href={
                          typeof window !== "undefined" &&
                          new URLSearchParams(window.location.search).get("portal") ===
                            "staff"
                            ? `/staff/profile/${employeeId}/maternity-leave-register/${period.periodYear}?portal=staff`
                            : `/employees/${employeeId}/maternity-leave-register/${period.periodYear}`
                        }
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
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl border-t-4 border-[#d2b241] shadow-sm p-6 text-center">
      <p className="text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-[#3f4447] mt-2">
        {value}
      </h3>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.5" : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border rounded-xl px-4 py-3"
      />
    </div>
  );
}
