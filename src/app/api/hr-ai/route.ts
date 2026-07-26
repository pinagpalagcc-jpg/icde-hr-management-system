import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

function securityError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Please log in." },
      { status: 401 }
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      {
        error:
          "Admin access is required.",
      },
      { status: 403 }
    );
  }

  console.error(
    "HR AI Gemini error:",
    error
  );

  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Unable to answer the HR question.",
    },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  const requestStart = Date.now();

  try {
    await requireAdmin();

    const body = await request.json();

    const question = String(
      body.message || ""
    ).trim();

    const history = Array.isArray(
      body.history
    )
      ? body.history
          .slice(-10)
          .map(
            (
              item: {
                role?: unknown;
                text?: unknown;
              }
            ) => ({
              role:
                item.role === "assistant"
                  ? "assistant"
                  : "user",
              text: String(
                item.text || ""
              ).slice(0, 8000),
            })
          )
          .filter(
            (item: {
              role: string;
              text: string;
            }) => item.text.trim()
          )
      : [];

    if (!question) {
      return NextResponse.json(
        {
          error:
            "Please enter an HR question.",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is missing."
      );
    }

    const supabase = getSupabaseServer();

    const employeeQueryStart = Date.now();

    const { data: employees, error: employeeError } =
      await supabase
        .from("employees")
        .select(
          `
            employee_code,
            first_name,
            middle_name,
            last_name,
            department,
            position,
            status,
            joining_date,
            mobile_number,
            email,
            basic_salary,
            accommodation_allowance,
            transportation_allowance
          `
        )
        .order("first_name", {
          ascending: true,
        });

    if (employeeError) {
      throw new Error(employeeError.message);
    }

    const employeeContext =
      (employees || []).map((employee) => ({
        employee_id:
          employee.employee_code || "-",
        employee_name: [
          employee.first_name,
          employee.middle_name,
          employee.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
        department:
          employee.department || "-",
        position:
          employee.position || "-",
        status:
          employee.status || "Available",
        joining_date:
          employee.joining_date || "-",
        mobile:
          employee.mobile_number || "-",
        email:
          employee.email || "-",
        basic_salary:
          employee.basic_salary ?? "-",
        accommodation_allowance:
          employee.accommodation_allowance ?? "-",
        transportation_allowance:
          employee.transportation_allowance ?? "-",
      }));

    const ai = new GoogleGenAI({
      apiKey,
    });

    const geminiStart = Date.now();

    const response =
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
You are the private HR AI Assistant for the ICDE HR Management System.

Rules:
- Answer only from the connected Employees data below.
- Do not invent employee names, counts, salaries, departments, dates, contact details or other information.
- Answer briefly and directly.
- When asked for a count, give the count directly.
- When asked for a table, return only a valid Markdown table.
- Use friendly column headings such as Employee ID, Employee Name, Department, Designation, Status, Joining Date, Phone Number and Email.
- Return exactly the columns requested by the Admin.
- Do not add salary, allowances, contact details, dates or any other columns unless specifically requested.
- Preserve the same employee rows when the Admin asks a follow-up such as add a column, remove a column, reorder columns or recreate the table.
- When adding a column to a previous table, rebuild the full table from the connected live Employees data.
- Do not add a title, introduction, summary, notes or explanation before or after a requested table.
- Treat statuses containing inactive, deactivated or terminated as inactive.
- All other statuses are active.
- For employee searches, match Employee ID or employee name.
- Use position as the source for Designation.
- Use mobile as the source for Phone Number.
- If information is not available, show - in the relevant table cell.
- If requested information is not available at all, say it is not available in the connected Employees data.

CONVERSATION RULES:
- Use the recent conversation to understand follow-up instructions.
- Remember references such as "same employees", "that table", "add a column", "remove the phone number", "show it again", or "create table format".
- The current Admin question has priority.
- Recreate the answer from the connected live Employees data.
- Do not copy an old answer when it conflicts with current Employees data.

RECENT CONVERSATION — LAST 10 MESSAGES:
${
  history.length
    ? history
        .map(
          (
            item: {
              role: string;
              text: string;
            }
          ) =>
            `${
              item.role === "user"
                ? "ADMIN"
                : "GEMINI"
            }: ${item.text}`
        )
        .join("\n\n")
    : "No previous conversation."
}

CONNECTED EMPLOYEES:
${JSON.stringify(employeeContext)}

CURRENT ADMIN QUESTION:
${question}
        `.trim(),
      });

    console.log(
      "HR AI EMPLOYEE QUERY:",
      Date.now() - employeeQueryStart,
      "ms"
    );

    const answer =
      response.text?.trim();

    console.log(
      "HR AI TIMING:",
      {
        gemini_ms:
          Date.now() - geminiStart,
        total_ms:
          Date.now() - requestStart,
      }
    );

    if (!answer) {
      throw new Error(
        "Gemini returned an empty answer."
      );
    }

    return NextResponse.json({
      answer,
      module: "employees",
    });
  } catch (error) {
    return securityError(error);
  }
}
