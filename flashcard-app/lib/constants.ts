export const DEMO_CARD_LIMIT = 10;
export const SESSION_DURATION_DAYS = 3;
export const COOKIE_NAME = "sb-session";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  profile: "/profile",
  decks: "/decks",
  learning: (deckId: string) => `/learning/${deckId}`,
  admin: {
    root: "/admin",
    users: "/admin/users",
    decks: "/admin/decks",
    analytics: "/admin/analytics",
  },
} as const;

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Mixed"];
