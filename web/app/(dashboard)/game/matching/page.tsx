import dynamicImport from "next/dynamic";
import { getUserGameDecks } from "../_getUserGameDecks";

export const dynamic = "force-dynamic";

const MatchingGame = dynamicImport(
  () => import("@/components/game/MatchingGame").then(m => m.MatchingGame),
  { ssr: false }
);

export default async function MatchingPage() {
  const userDecks = await getUserGameDecks();
  return <MatchingGame userDecks={userDecks} />;
}
