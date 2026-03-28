export const DEMO_LIMIT = 10;
export const SESSION_DAYS = 3;
export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Mixed"] as const;

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  profile: "/profile",
  decks: "/decks",
  learning: (id: string) => `/learning/${id}`,
  admin: "/admin",
  adminUsers: "/admin/users",
  adminDecks: "/admin/decks",
  adminAnalytics: "/admin/analytics",
} as const;
