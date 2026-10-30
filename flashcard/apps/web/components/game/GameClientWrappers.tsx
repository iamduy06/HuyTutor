"use client";

import dynamic from "next/dynamic";

export const ListeningGameClient = dynamic(
  () => import("./ListeningGame").then((m) => m.ListeningGame),
  { ssr: false }
);

export const MatchingGameClient = dynamic(
  () => import("./MatchingGame").then((m) => m.MatchingGame),
  { ssr: false }
);

export const MultipleChoiceGameClient = dynamic(
  () => import("./MultipleChoiceGame").then((m) => m.MultipleChoiceGame),
  { ssr: false }
);

export const SynAntGameClient = dynamic(
  () => import("./SynAntGame").then((m) => m.SynAntGame),
  { ssr: false }
);
