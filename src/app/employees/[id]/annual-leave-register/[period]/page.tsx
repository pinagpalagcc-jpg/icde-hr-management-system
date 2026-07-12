"use client";

import { useEffect, useMemo, useState } from "react";

type Transaction = {
  id: string;
  period_year: number;
  transaction_date: string;
  detail: string;
  total_leaves: number | string;
  used_leaves: number | string;
  entry_type?: string;
  created_at?: string;
};

type FormMode = "usage" | "encash" | null;

export default function AnnualLeavePeriodPage({
  params,
}: {
  params: Promise<{ id: string; period: string }>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [period, setPeriod] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [formMode, setFormMode] = useState<FormMode>(null);
  const [form, setForm] = useState({
    transaction_date: new Date().toISOString().slice(0, 10),
    days: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadPeriod(id: string, selectedPeriod: string) {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `/api/annual-leave-transactions?employee_id=${encodeURIComponent(
          id
        )}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load Annual Leave Period."
        );
      }

      const filtered = Array.isArray(data)
        ? data.filter(
            (item: Transaction) =>
              String(item.period_year) === String(selectedPeriod)
          )
        : [];

      setTransactions(filtered);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Annual Leave Period."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    params.then(({ id, period }) => {
      setEmployeeId(id);
      setPeriod(period);
      loadPeriod(id, period);
    });
  }, [params]);

  const rows = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const dateA = new Date(
        a.transaction_date || a.created_at || 0
      ).getTime();

      const dateB = new Date(
        b.transaction_date || b.created_at || 0
      ).getTime();

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      return new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime();
    });

    let runningBalance = 0;

    return sorted.map((transaction) => {
      const added = Number(transaction.total_leaves || 0);
      const used = Number(transaction.used_leaves || 0);

      runningBalance = runningBalance + added - used;

      return {
        ...transaction,
        added,
        used,
        runningBalance,
      };
    });
  }, [transactions]);

  const totalLeaves = rows.reduce(
    (sum, transaction) => sum + transaction.added,
    0
  );

  const totalUsed = rows.reduce(
    (sum, transaction) => sum + transaction.used,
    0
  );

  const balance = totalLeaves - totalUsed;

  function openForm(mode: Exclude<FormMode, null>) {
    setFormMode(mode);
    setErrorMessage("");
    setSuccessMessage("");

    setForm({
      transaction_date: new Date().toISOString().slice(0, 10),
      days: "",
      remarks:
        mode === "usage"
          ? "Annual Leave Used"
          : "Annual Leave Encashment",
    });
  }

  async function saveTransaction() {
    const days = Number(form.days);

    if (!form.transaction_date) {
      setErrorMessage("Please select the transaction date.");
      return;
    }

    if (!Number.isFinite(days) || days <= 0) {
      setErrorMessage("Days must be greater than zero.");
      return;
    }

    if (days > balance) {
      setErrorMessage(
        `Period ${period} has only ${balance} day(s) available.`
      );
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const isUsage = formMode === "usage";

      const response = await fetch(
        "/api/annual-leave-transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_id: employeeId,
            period_year: Number(period),
            transaction_date: form.transaction_date,
            detail:
              form.remarks ||
              (isUsage
                ? "Annual Leave Used"
                : "Annual Leave Encashment"),
            total_leaves: 0,
            used_leaves: days,
            entry_type: isUsage
              ? "LEAVE_USED"
              : "ENCASHMENT",
            remarks: form.remarks || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to save Annual Leave transaction."
        );
      }

      await loadPeriod(employeeId, period);

      setSuccessMessage(
        isUsage
          ? `${days} Annual Leave day(s) recorded as used from period ${period}.`
          : `${days} Annual Leave day(s) encashed from period ${period}.`
      );

      setFormMode(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save Annual Leave transaction."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] p-8">
        Loading Annual Leave Period...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <a
          href={`/employees/${employeeId}/annual-leave-register`}
          className="text-[#b59628] font-bold hover:underline"
        >
          ← Back to Annual Leave Register
        </a>

        <div className="mt-6 mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold text-[#3f4447]">
              Annual Leave Register — Period {period}
            </h1>

            <p className="text-gray-500 mt-2">
              Complete Annual Leave history for this period.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => openForm("usage")}
              className="bg-[#d2b241] text-white px-5 py-3 rounded-xl font-bold"
            >
              + Record Leave Usage
            </button>

            <button
              type="button"
              onClick={() => openForm("encash")}
              className="bg-[#3f4447] text-white px-5 py-3 rounded-xl font-bold"
            >
              − Encash Leave
            </button>
          </div>
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

        {formMode ? (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-[#3f4447] mb-5">
              {formMode === "usage"
                ? "Record Annual Leave Usage"
                : "Encash Annual Leave"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                  formMode === "usage"
                    ? "Days Used"
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
                label="Remarks"
                type="text"
                value={form.remarks}
                onChange={(value) =>
                  setForm({
                    ...form,
                    remarks: value,
                  })
                }
              />
            </div>

            <div className="mt-4 rounded-xl bg-[#f7f4ec] p-4 text-sm text-[#3f4447]">
              Available balance for period {period}:{" "}
              <strong>{balance} Days</strong>
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
                {saving ? "Saving..." : "Save Transaction"}
              </button>
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <SummaryCard
            title="Period Total"
            value={`${totalLeaves} Days`}
          />

          <SummaryCard
            title="Period Used"
            value={`${totalUsed} Days`}
          />

          <SummaryCard
            title="Period Balance"
            value={`${balance} Days`}
          />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="overflow-x-auto border rounded-xl">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="bg-[#d2b241] text-white">
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Detail</th>
                  <th className="p-4 text-center">
                    Total Leaves
                  </th>
                  <th className="p-4 text-center">Used</th>
                  <th className="p-4 text-center">Balance</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-gray-500"
                    >
                      No transactions found for period {period}.
                    </td>
                  </tr>
                ) : (
                  rows.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b"
                    >
                      <td className="p-4">
                        {formatDate(
                          transaction.transaction_date
                        )}
                      </td>

                      <td className="p-4 font-medium">
                        {transaction.detail}
                      </td>

                      <td className="p-4 text-center text-green-700 font-bold">
                        {transaction.added}
                      </td>

                      <td className="p-4 text-center text-red-700 font-bold">
                        {transaction.used}
                      </td>

                      <td className="p-4 text-center font-bold">
                        {transaction.runningBalance}
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
        min={type === "number" ? "0.5" : undefined}
        step={type === "number" ? "0.5" : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border rounded-xl px-4 py-3"
      />
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
