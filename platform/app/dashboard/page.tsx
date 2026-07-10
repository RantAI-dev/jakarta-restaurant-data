import { redirect } from "next/navigation";

/**
 * /dashboard dipensiunkan setelah Plan 6 — konten pindah ke beranda.
 */
export default function Page() {
  redirect("/");
}