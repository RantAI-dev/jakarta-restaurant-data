import { redirect } from "next/navigation";

/**
 * /readiness dipensiunkan setelah Plan 6 — readiness dipisah per framework:
 * GCI di /gci, GPCI di /gpci.
 */
export default function Page() {
  redirect("/gci");
}