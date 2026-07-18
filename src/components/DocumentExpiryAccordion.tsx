"use client";

import { Fragment, useState } from "react";

type AlertItem = {
  employee_id: string;
  employee: string;
  department: string;
  document: string;
  category: string;
  expiry: string;
  remaining: number;
};

type EmployeeAlertGroup = {
  employee_id: string;
  employee: string;
  department: string;
  nearestExpiry: string;
  nearestRemaining: number;
  documents: AlertItem[];
};

export default function DocumentExpiryAccordion({
  groups,
}: {
  groups: EmployeeAlertGroup[];
}) {
  const [expandedEmployee, setExpandedEmployee] =
    useState<string | null>(null);

  function toggleEmployee(employeeId: string) {
    setExpandedEmployee((current) =>
      current === employeeId ? null : employeeId
    );
  }

  if (groups.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No upcoming document expiry alerts.
      </div>
    );
  }

  return (
    <div className="max-h-[440px] overflow-auto border rounded-xl">
      <table className="min-w-[950px] w-full text-sm">
        <thead>
          <tr className="bg-[#3f4447] text-white">
            <th className="p-4 text-left">Employee</th>
            <th className="p-4 text-left">Department</th>
            <th className="p-4 text-left">
              Expiring Documents
            </th>
            <th className="p-4 text-left">
              Nearest Expiry
            </th>
            <th className="p-4 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {groups.map((group) => {
            const isExpanded =
              expandedEmployee === group.employee_id;

            return (
              <Fragment key={group.employee_id}>
                <tr
                  className="border-b hover:bg-[#faf8f1] cursor-pointer"
                  onClick={() =>
                    toggleEmployee(group.employee_id)
                  }
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-[#d2b241]">
                        {isExpanded ? "⌄" : "›"}
                      </span>

                      <span className="text-[#d2b241] font-bold">
                        {group.employee}
                      </span>
                    </div>
                  </td>

                  <td className="p-4">
                    {group.department}
                  </td>

                  <td className="p-4 font-semibold text-[#b58f12]">
                    {group.documents.length}{" "}
                    {group.documents.length === 1
                      ? "document"
                      : "documents"}
                  </td>

                  <td className="p-4">
                    {group.nearestExpiry}
                  </td>

                  <td className="p-4">
                    <span
                      className={`${expiryBadgeClass(
                        group.nearestRemaining
                      )} px-3 py-1 rounded-full font-semibold`}
                    >
                      {formatRemaining(
                        group.nearestRemaining
                      )}
                    </span>
                  </td>
                </tr>

                {isExpanded ? (
                  <tr className="bg-[#fcfbf7]">
                    <td colSpan={5} className="p-4">
                      <div className="ml-8 overflow-x-auto border rounded-xl bg-white">
                        <table className="min-w-[750px] w-full text-sm">
                          <thead>
                            <tr className="bg-[#f4f1e8] text-[#3f4447]">
                              <th className="p-3 text-left">
                                Document
                              </th>
                              <th className="p-3 text-left">
                                Expiry Date
                              </th>
                              <th className="p-3 text-left">
                                Remaining Days
                              </th>
                              <th className="p-3 text-left">
                                Status
                              </th>
                              <th className="p-3 text-left">
                                Profile
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {group.documents.map(
                              (document, index) => (
                                <tr
                                  key={`${document.employee_id}-${document.document}-${index}`}
                                  className="border-b"
                                >
                                  <td className="p-3 font-semibold">
                                    {document.document}
                                  </td>

                                  <td className="p-3">
                                    {document.expiry}
                                  </td>

                                  <td className="p-3">
                                    <span
                                      className={`${expiryBadgeClass(
                                        document.remaining
                                      )} px-3 py-1 rounded-full font-semibold`}
                                    >
                                      {formatRemaining(
                                        document.remaining
                                      )}
                                    </span>
                                  </td>

                                  <td className="p-3">
                                    {document.remaining < 0
                                      ? "Expired"
                                      : "Expiring Soon"}
                                  </td>

                                  <td className="p-3">
                                    <a
                                      href={`/employees/${document.employee_id}?tab=${encodeURIComponent(
                                        document.category || "Personal Documents"
                                      )}`}
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                      className="text-[#d2b241] font-bold hover:underline"
                                    >
                                      Open Document Tab
                                    </a>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatRemaining(days: number) {
  return days < 0
    ? `${Math.abs(days)} days expired`
    : `${days} days`;
}

function expiryBadgeClass(days: number) {
  if (days <= 30) {
    return "bg-red-100 text-red-700";
  }

  if (days <= 60) {
    return "bg-orange-100 text-orange-700";
  }

  return "bg-purple-100 text-purple-700";
}
