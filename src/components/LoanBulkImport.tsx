"use client";

import { useRef, useState } from "react";

type ImportRow = {
  transaction_date: string;
  detail: string;
  received: number;
  paid: number;
  balance: number;
};

function formatExcelDate(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const date = new Date(
      Math.round((value - 25569) * 86400 * 1000)
    );

    return date.toISOString().slice(0, 10);
  }

  const text = String(value || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsed = new Date(text);

  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toISOString().slice(0, 10);
}

function numberValue(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

export default function LoanBulkImport({
  employeeId,
  currentBalance,
  latestDate,
  onImported,
}: {
  employeeId: string;
  currentBalance: number;
  latestDate: string;
  onImported: () => Promise<void> | void;
}) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [rows, setRows] =
    useState<ImportRow[]>([]);

  const [fileName, setFileName] =
    useState("");

  const [importing, setImporting] =
    useState(false);

  const [errors, setErrors] =
    useState<string[]>([]);

  async function downloadTemplate() {
    const XLSX = await import("xlsx");

    const sampleDate =
      latestDate ||
      new Date().toISOString().slice(0, 10);

    const worksheet =
      XLSX.utils.json_to_sheet([
        {
          Date: sampleDate,
          Description: "Loan Received",
          Received: 5000,
          Paid: 0,
          Balance:
            Number(currentBalance || 0) +
            5000,
        },
        {
          Date: sampleDate,
          Description:
            "Installment Deduction",
          Received: 0,
          Paid: 500,
          Balance:
            Number(currentBalance || 0) +
            4500,
        },
      ]);

    worksheet["!cols"] = [
      { wch: 16 },
      { wch: 32 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Loan Entries"
    );

    XLSX.writeFile(
      workbook,
      "Loan-Ledger-Import-Template.xlsx"
    );
  }

  async function readExcelFile(
    file: File | null
  ) {
    if (!file) return;

    setFileName(file.name);
    setErrors([]);

    try {
      const XLSX = await import("xlsx");
      const buffer =
        await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      const firstSheet =
        workbook.Sheets[
          workbook.SheetNames[0]
        ];

      const rawRows =
        XLSX.utils.sheet_to_json<any>(
          firstSheet,
          { defval: "" }
        );

      const parsedRows = rawRows.map(
        (row: any) => ({
          transaction_date:
            formatExcelDate(
              row.Date ?? row.date
            ),
          detail: String(
            row.Description ??
              row.description ??
              ""
          ).trim(),
          received: numberValue(
            row.Received ?? row.received
          ),
          paid: numberValue(
            row.Paid ?? row.paid
          ),
          balance: numberValue(
            row.Balance ?? row.balance
          ),
        })
      );

      setRows(parsedRows);
    } catch {
      setRows([]);
      setErrors([
        "Unable to read the Excel file.",
      ]);
    }
  }

  async function importRows() {
    if (!rows.length) {
      setErrors([
        "Please upload an Excel file first.",
      ]);
      return;
    }

    const confirmed = window.confirm(
      `Import ${rows.length} loan entries?`
    );

    if (!confirmed) return;

    try {
      setImporting(true);
      setErrors([]);

      const response = await fetch(
        "/api/employee-loan-ledger/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            employee_id: employeeId,
            rows,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        setErrors(
          Array.isArray(result.errors)
            ? result.errors
            : [
                result.error ||
                  "Unable to import entries.",
              ]
        );
        return;
      }

      alert(
        `${result.imported} loan entries imported successfully.`
      );

      setRows([]);
      setFileName("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await onImported();
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="border border-[#d2b241] rounded-2xl p-5 mb-6 bg-[#fffdf7]">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="font-bold text-[#3f4447]">
            Bulk Loan Excel Import
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Template: Date | Description |
            Received | Paid | Balance
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadTemplate}
            className="bg-green-600 text-white px-5 py-3 rounded-xl font-bold"
          >
            Download Excel Template
          </button>

          <label className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold cursor-pointer">
            Upload Excel
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) =>
                readExcelFile(
                  event.target.files?.[0] ||
                    null
                )
              }
              className="hidden"
            />
          </label>
        </div>
      </div>

      {fileName ? (
        <p className="text-sm text-green-700 mt-4">
          Selected: {fileName}
        </p>
      ) : null}

      {errors.length ? (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="font-bold text-red-700 mb-2">
            Please correct these errors:
          </p>

          {errors.map((error, index) => (
            <p
              key={`${error}-${index}`}
              className="text-sm text-red-700"
            >
              • {error}
            </p>
          ))}
        </div>
      ) : null}

      {rows.length ? (
        <div className="mt-5">
          <div className="overflow-x-auto border rounded-xl bg-white">
            <table className="min-w-[850px] w-full text-sm">
              <thead>
                <tr className="bg-[#3f4447] text-white">
                  <th className="p-3 text-left">
                    Date
                  </th>
                  <th className="p-3 text-left">
                    Description
                  </th>
                  <th className="p-3 text-right">
                    Received
                  </th>
                  <th className="p-3 text-right">
                    Paid
                  </th>
                  <th className="p-3 text-right">
                    Balance
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b"
                  >
                    <td className="p-3">
                      {row.transaction_date ||
                        "Invalid Date"}
                    </td>
                    <td className="p-3">
                      {row.detail || "-"}
                    </td>
                    <td className="p-3 text-right">
                      {row.received}
                    </td>
                    <td className="p-3 text-right">
                      {row.paid}
                    </td>
                    <td className="p-3 text-right font-bold">
                      {row.balance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={importRows}
              disabled={importing}
              className="bg-[#d2b241] text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
            >
              {importing
                ? "Importing..."
                : `Import ${rows.length} Entries`}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
