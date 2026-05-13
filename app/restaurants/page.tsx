import { RESTAURANTS } from "@/lib/restaurants";
import { Dashboard } from "@/components/Dashboard";

export default function RestaurantsPage() {
  return <Dashboard restaurants={RESTAURANTS} />;
}
