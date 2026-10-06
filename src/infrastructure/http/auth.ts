const ACCESS_TOKEN_KEY = "accessToken";
const SURPLUS_QUOTES = /^"|"$/g;

export function readAccessToken(): string | null {
  const fromEnv = import.meta.env.VITE_ACCESS_TOKEN?.trim();
  if (fromEnv) return fromEnv;

  if (typeof localStorage === "undefined") return null;
  const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!stored) return null;
  return stored.replace(SURPLUS_QUOTES, "");
}
