import dynamicImport from "next/dynamic";
import { getUserGameDecks } from "../_getUserGameDecks";

export const dynamic = "force-dynamic";

const ListeningGame = dynamicImport(
  () => import("@/components/game/ListeningGame").then(m => m.ListeningGame),
  { ssr: false }
);

export default async function ListeningPage() {
  const userDecks = await getUserGameDecks();
  return <ListeningGame userDecks={userDecks} />;
}
