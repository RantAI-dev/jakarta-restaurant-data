import type { Metadata } from "next";
import { DocsClient } from "./docs-client";

export const metadata: Metadata = {
  title: "Dokumentasi API — Platform Data Pariwisata & Ekraf DKI Jakarta",
  description:
    "Referensi REST API Platform Data Dinas Pariwisata & Ekonomi Kreatif Provinsi DKI Jakarta: katalog dataset, detail & baris data, ekspor CSV/XLSX, serta endpoint admin.",
};

export default function DocsPage() {
  return <DocsClient />;
}
