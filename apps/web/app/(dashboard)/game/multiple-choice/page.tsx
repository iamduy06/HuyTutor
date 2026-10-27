import { getUserGameDecks } from "../_getUserGameDecks";
import { MultipleChoiceGameClient } from "@/components/game/GameClientWrappers";

export const dynamic = "force-dynamic";

export default async function MultipleChoicePage() {
  const userDecks = await getUserGameDecks();
  return <MultipleChoiceGameClient userDecks={userDecks} />;
}
