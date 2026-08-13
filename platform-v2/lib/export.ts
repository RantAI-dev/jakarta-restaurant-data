/**
 * Spreadsheet export — CSV native (zero dep), XLS and XLSX via lazy-loaded
 * SheetJS so the ~700 KB library only enters the bundle on the first
 * export click.
 */

export type CsvColumn<T> = {
  header: string;
  value: (row: T, index: number) => string | number | undefined | null;
};

export type ExportFormat = "csv" | "xls" | "xlsx";

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
  // UTF-8 BOM so Excel opens with proper encoding.
  return "﻿" + header + "\r\n" + body;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, content: string) {
  downloadBlob(filename, new Blob([content], { type: "text/csv;charset=utf-8" }));
}

export function dateStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * One entry point that dispatches by format. SheetJS is dynamically
 * imported — keeps the initial JS bundle small for users who never click
 * the export button.
 */
export async function downloadSpreadsheet<T>(
  baseFilename: string,
  rows: T[],
  columns: CsvColumn<T>[],
  format: ExportFormat,
  sheetName = "Sheet1"
) {
  if (format === "csv") {
    downloadCsv(`${baseFilename}.csv`, toCsv(rows, columns));
    return;
  }

  const XLSX = await import("xlsx");
  // Build an array-of-arrays so column types are inferred per row.
  const aoa: (string | number)[][] = [
    columns.map((c) => c.header),
    ...rows.map((row, i) =>
      columns.map((c) => {
        const v = c.value(row, i);
        if (v === undefined || v === null) return "";
        return v;
      })
    ),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Auto-fit column widths from the longest cell per column (best-effort).
  const widths = columns.map((c, idx) => {
    const headerLen = c.header.length;
    let max = headerLen;
    for (const row of rows) {
      const v = c.value(row, idx);
      const len = v === undefined || v === null ? 0 : String(v).length;
      if (len > max) max = len;
    }
    return { wch: Math.min(Math.max(max + 2, 8), 50) };
  });
  ws["!cols"] = widths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${baseFilename}.${format}`, { bookType: format });
}
