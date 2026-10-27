import { getUserGameDecks } from "../_getUserGameDecks";
import { ListeningGameClient } from "@/components/game/GameClientWrappers";

export const dynamic = "force-dynamic";

export default async function ListeningPage() {
  const userDecks = await getUserGameDecks();
  return <ListeningGameClient userDecks={userDecks} />;
}
