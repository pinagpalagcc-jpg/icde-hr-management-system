"use client";

import { useEffect, useState } from "react";

type LoanEntry = {
  id: string;
  transaction_date: string;
  detail: string;
  entry_type: "LOAN_RECEIVED" | "INSTALLMENT_DEDUCTION";
  loan_received: number | string;
  amount_paid: number | string;
  balance_after: number | string;
  remarks?: string | null;
};

const EMPTY_FORM = {
  transaction_date: new Date().toISOString().slice(0, 10),
  detail: "Loan Received",
  entry_type: "LOAN_RECEIVED",
  amount: "",
  remarks: "",
};

export default function EmployeeLoanLedger({
  employeeId,
  readOnly = false,
}: {
  employeeId: string;
  readOnly?: boolean;
}) {
  const [entries, setEntries] = useState<LoanEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadEntries() {
    if (!employeeId) return;

    const response = await fetch(
      `/api/employee-loan-ledger?employee_id=${encodeURIComponent(
        employeeId
      )}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data?.error || "Unable to load Loan Ledger.");
      return;
    }

    setEntries(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadEntries();
  }, [employeeId]);

  function openAddForm() {
    setEditingId("");
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(entry: LoanEntry) {
    setEditingId(entry.id);

    setForm({
      transaction_date: entry.transaction_date?.slice(0, 10) || "",
      detail: entry.detail || "",
      entry_type: entry.entry_type,
      amount: String(
        entry.entry_type === "LOAN_RECEIVED"
          ? Number(entry.loan_received || 0)
          : Number(entry.amount_paid || 0)
      ),
      remarks: entry.remarks || "",
    });

    setShowForm(true);
  }

  async function saveEntry() {
    try {
      setSaving(true);

      const response = await fetch(
        "/api/employee-loan-ledger",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingId || undefined,
            employee_id: employeeId,
            transaction_date: form.transaction_date,
            detail: form.detail,
            entry_type: form.entry_type,
            amount: Number(form.amount || 0),
            remarks: form.remarks,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to save Loan Ledger entry."
        );
      }

      setShowForm(false);
      setEditingId("");
      await loadEntries();

      alert(
        editingId
          ? "Loan Ledger entry updated successfully."
          : "Loan Ledger entry added successfully."
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save Loan Ledger entry."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(entry: LoanEntry) {
    const confirmed = window.confirm(
      `Delete this Loan Ledger entry: ${entry.detail}?`
    );

    if (!confirmed) return;

    const response = await fetch(
      `/api/employee-loan-ledger?id=${encodeURIComponent(
        entry.id
      )}&employee_id=${encodeURIComponent(employeeId)}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data?.error || "Unable to delete Loan Ledger entry.");
      return;
    }

    await loadEntries();
    alert("Loan Ledger entry deleted successfully.");
  }

  const filteredEntries = entries.filter((entry) => {
    const entryDate =
      entry.transaction_date?.slice(0, 10) || "";

    const matchesFrom =
      fromDate ? entryDate >= fromDate : true;

    const matchesTo =
      toDate ? entryDate <= toDate : true;

    return matchesFrom && matchesTo;
  });

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-[#3f4447]">
            Loan & Deduction Ledger
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Loan received increases the balance. Installment deduction reduces it.
          </p>
        </div>

        {!readOnly ? (
          <button
            type="button"
            onClick={openAddForm}
            className="bg-[#d2b241] text-white px-5 py-3 rounded-xl font-bold"
          >
            + Add Entry
          </button>
        ) : null}
      </div>

      {!readOnly && showForm ? (
        <div className="border rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
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

            <Select
              label="Entry Type"
              value={form.entry_type}
              options={[
                {
                  value: "LOAN_RECEIVED",
                  label: "Loan Received",
                },
                {
                  value: "INSTALLMENT_DEDUCTION",
                  label: "Installment Deduction",
                },
              ]}
              onChange={(value) =>
                setForm({
                  ...form,
                  entry_type: value,
                  detail:
                    value === "LOAN_RECEIVED"
                      ? "Loan Received"
                      : "Installment Deduction",
                })
              }
            />

            <Input
              label="Detail"
              value={form.detail}
              onChange={(value) =>
                setForm({
                  ...form,
                  detail: value,
                })
              }
            />

            <Input
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(value) =>
                setForm({
                  ...form,
                  amount: value,
                })
              }
            />

            <Input
              label="Remarks"
              value={form.remarks}
              onChange={(value) =>
                setForm({
                  ...form,
                  remarks: value,
                })
              }
            />
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId("");
              }}
              className="bg-gray-200 text-[#3f4447] px-5 py-3 rounded-xl font-bold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveEntry}
              disabled={saving}
              className="bg-[#3f4447] text-white px-5 py-3 rounded-xl font-bold disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Entry"
                : "Save Entry"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <Input
          label="From Date"
          type="date"
          value={fromDate}
          onChange={setFromDate}
        />

        <Input
          label="To Date"
          type="date"
          value={toDate}
          onChange={setToDate}
        />

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="w-full bg-gray-200 text-[#3f4447] px-5 py-3 rounded-xl font-bold"
          >
            Clear Filter
          </button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto border rounded-xl">
        <table className="min-w-[950px] w-full text-sm">
          <thead>
            <tr className="bg-[#d2b241] text-white">
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Detail</th>
              <th className="p-4 text-center">Loan Received</th>
              <th className="p-4 text-center">Amount Paid</th>
              <th className="p-4 text-center">Balance</th>
              {!readOnly ? (
                <th className="p-4 text-center">Action</th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td
                  colSpan={readOnly ? 5 : 6}
                  className="p-8 text-center text-gray-500"
                >
                  No Loan Ledger entries found.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b hover:bg-[#faf8f1]"
                >
                  <td className="p-4 whitespace-nowrap">
                    {formatDate(entry.transaction_date)}
                  </td>

                  <td className="p-4">
                    {entry.detail}
                  </td>

                  <td className="p-4 text-center font-bold text-green-700">
                    {Number(entry.loan_received || 0) > 0
                      ? `AED ${Number(
                          entry.loan_received
                        ).toLocaleString()}`
                      : "-"}
                  </td>

                  <td className="p-4 text-center font-bold text-red-700">
                    {Number(entry.amount_paid || 0) > 0
                      ? `AED ${Number(
                          entry.amount_paid
                        ).toLocaleString()}`
                      : "-"}
                  </td>

                  <td className="p-4 text-center font-bold">
                    AED{" "}
                    {Number(
                      entry.balance_after || 0
                    ).toLocaleString()}
                  </td>

                  {!readOnly ? (
                    <td className="p-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditForm(entry)}
                        className="text-blue-700 font-bold mr-4 hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteEntry(entry)}
                        className="text-red-700 font-bold hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
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
        step={type === "number" ? "0.01" : undefined}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full border rounded-xl px-4 py-3"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full border rounded-xl px-4 py-3"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
