/** Normalizes date strings (dd/mm/yyyy or dd-mm-yyyy) to ISO 8601. Returns null if invalid. */
export function parseDateToISO(dateStr: any): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const parts = dateStr.split(/[/-]/);
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const date = new Date(year, month, day, 23, 59, 59);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** Normalizes strings like '"id1", "id2"' or 'id1, id2' into clean string arrays. */
export function parseStringArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((v) => String(v).trim().replace(/^["']|["']$/g, ""));
  if (typeof val === "string") {
    return val.split(",").map((v) => v.trim().replace(/^["']|["']$/g, "")).filter((v) => v !== "");
  }
  return [];
}
