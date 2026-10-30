import { getUserGameDecks } from "../_getUserGameDecks";
import { SynAntGameClient } from "@/components/game/GameClientWrappers";

export const dynamic = "force-dynamic";

export default async function SynAntPage() {
  const userDecks = await getUserGameDecks();
  return <SynAntGameClient userDecks={userDecks} />;
}
