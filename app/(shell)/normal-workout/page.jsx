import { requirePlan } from "@/lib/guards";
import Client from "./Client";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requirePlan(["normal-workouts"], "normal-workouts");
  return <Client />;
}
