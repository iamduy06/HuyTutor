import dynamicImport from "next/dynamic";
import { getUserGameDecks } from "../_getUserGameDecks";

export const dynamic = "force-dynamic";

const SynAntGame = dynamicImport(
  () => import("@/components/game/SynAntGame").then(m => m.SynAntGame),
  { ssr: false }
);

export default async function SynAntPage() {
  const userDecks = await getUserGameDecks();
  return <SynAntGame userDecks={userDecks} />;
}
