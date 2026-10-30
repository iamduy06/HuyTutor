import { getUserGameDecks } from "../_getUserGameDecks";
import { MatchingGameClient } from "@/components/game/GameClientWrappers";

export const dynamic = "force-dynamic";

export default async function MatchingPage() {
  const userDecks = await getUserGameDecks();
  return <MatchingGameClient userDecks={userDecks} />;
}
