import dynamicImport from "next/dynamic";
import { getUserGameDecks } from "../_getUserGameDecks";

export const dynamic = "force-dynamic";

const MultipleChoiceGame = dynamicImport(
  () => import("@/components/game/MultipleChoiceGame").then(m => m.MultipleChoiceGame),
  { ssr: false }
);

export default async function MultipleChoicePage() {
  const userDecks = await getUserGameDecks();
  return <MultipleChoiceGame userDecks={userDecks} />;
}
