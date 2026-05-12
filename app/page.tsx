import { RESTAURANTS } from "@/lib/restaurants";
import { Dashboard } from "@/components/Dashboard";

export default function HomePage() {
  return <Dashboard restaurants={RESTAURANTS} />;
}
