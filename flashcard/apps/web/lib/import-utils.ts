/**
 * Normalizes date strings (dd/mm/yyyy or dd-mm-yyyy) to ISO 8601 at 23:59:59.
 * Returns null if invalid format.
 */
export function parseDateToISO(dateStr: any): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const parts = dateStr.split(/[/-]/);
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const year = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day, 23, 59, 59);
  if (isNaN(date.getTime())) return null;
  
  return date.toISOString();
}

/**
 * Normalizes strings like '"id1", "id2"' or 'id1, id2' or raw arrays into clean string arrays.
 */
export function parseStringArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(v => String(v).trim().replace(/^["']|["']$/g, ""));
  
  if (typeof val === "string") {
    // Split by comma, then trim and remove quotes
    return val.split(",").map(v => v.trim().replace(/^["']|["']$/g, "")).filter(v => v !== "");
  }
  
  return [];
}

/**
 * Simple CSV to Object array parser.
 * Handles basic quoted values and different delimiters.
 */
export function csvToObjects(csv: string): any[] {
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    // This is a naive split that doesn't handle commas inside quotes well.
    // For a production app, we'd use a library like PapaParse, but here we can try a slightly better regex.
    const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    
    // Fallback if match fails
    const finalValues = values.length === headers.length ? values : row.split(",");

    const obj: any = {};
    headers.forEach((header, index) => {
      let val = (finalValues[index] || "").trim().replace(/^["']|["']$/g, "");
      obj[header] = val;
    });
    results.push(obj);
  }

  return results;
}
