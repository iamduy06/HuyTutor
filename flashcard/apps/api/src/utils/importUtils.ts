/**
 * Normalizes date strings (dd/mm/yyyy or dd-mm-yyyy or yyyy-mm-dd or ISO) to ISO 8601 at UTC 23:59:59.
 * Returns null if invalid format.
 */
export function parseDateToISO(dateStr: any): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 23, 59, 59));
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 23, 59, 59));
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  // Fallback for valid ISO or RFC strings
  const date = new Date(trimmed);
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
