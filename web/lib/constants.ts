export const APP_NAME     = "Huy Tutor Flashcard";
export const APP_URL      = "https://www.huytutor.io.vn/";
export const FACEBOOK_URL = "https://web.facebook.com/huytutor";
export const DEMO_LIMIT   = 10;

export const ROUTES = {
  HOME:      "/",
  DECKS:     "/decks",
  LOGIN:     "/login",
  REGISTER:  "/register",
  DASHBOARD: "/dashboard",
  PROFILE:   "/profile",
  LEARNING:  (id: string) => `/learning/${id}`,
  ADMIN: {
    ROOT:      "/admin",
    USERS:     "/admin/users",
    DECKS:     "/admin/decks",
    ANALYTICS: "/admin/analytics",
  },
} as const;


export const CEFR_LEVELS  = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const DECK_LEVELS  = ["Beginner","Elementary","Intermediate","Upper-Intermediate","Advanced","Proficiency"];
