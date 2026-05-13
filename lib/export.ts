/**
 * Tiny CSV exporter — outputs a UTF-8 BOM + CRLF rows so Microsoft Excel
 * imports it cleanly without any setup. Avoids a dependency on a spreadsheet
 * library while still being "Excel-compatible" in practice (Excel happily
 * opens .csv as if it were native).
 */

export type CsvColumn<T> = {
  header: string;
  value: (row: T, index: number) => string | number | undefined | null;
};

function csvEscape(v: string | number | undefined | null): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => csvEscape(c.header)).join(",");
  const body = rows
    .map((row, i) => columns.map((c) => csvEscape(c.value(row, i))).join(","))
    .join("\r\n");
  return "﻿" + header + "\r\n" + body;
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function dateStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
