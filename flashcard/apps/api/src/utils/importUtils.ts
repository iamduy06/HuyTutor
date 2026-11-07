/**
 * Normalizes date strings (dd/mm/yyyy or dd-mm-yyyy or yyyy-mm-dd) to ISO 8601 at 23:59:59.
 * Returns null if invalid format.
 */
export function parseDateToISO(dateStr: any): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split(/[/-]/);
  if (parts.length !== 3) return null;

  // Handle yyyy-mm-dd format
  if (parts[0].length === 4) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day, 23, 59, 59);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  // Handle dd/mm/yyyy format
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  const date = new Date(year, month, day, 23, 59, 59);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Normalizes strings like '"id1", "id2"' or 'id1, id2' or raw arrays into clean string arrays.
 */
export function parseStringArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(v => String(v).trim().replace(/^["']|["']$/g, ''));

  if (typeof val === 'string') {
    return val
      .split(',')
      .map(v => v.trim().replace(/^["']|["']$/g, ''))
      .filter(v => v !== '');
  }

  return [];
}

/**
 * Robust CSV to Object array parser handling commas inside quotes, escaped quotes, and empty fields.
 */
export function csvToObjects(csv: string): any[] {
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim().replace(/^["']|["']$/g, ''));
    return fields;
  }

  const headers = parseLine(lines[0]);
  const results: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = (values[index] ?? '').trim().replace(/^["']|["']$/g, '');
    });
    results.push(obj);
  }

  return results;
}
