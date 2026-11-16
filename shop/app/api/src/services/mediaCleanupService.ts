import fs from 'fs';
import path from 'path';
import { extractR2ObjectKey } from './r2Service';
import { isSupabaseConfigured, supabaseAdmin } from '../config/supabase';

export interface CleanupReport {
  totalCleaned: number;
  details: Record<string, number>;
}

export interface MatcherTarget {
  key: string;
  cleanKey: string;
  filename: string;
  exactPatterns: Set<string>;
  urlSubstrings: string[];
}

export function createMediaMatchers(keys: string[]): {
  isMatch: (value: string) => boolean;
  replaceInText: (text: string) => { replaced: string; count: number };
  targets: MatcherTarget[];
} {
  const r2Domain = (process.env.R2_DOMAIN || '').replace(/\/+$/, '');
  let r2Host = '';
  try {
    if (r2Domain) {
      r2Host = new URL(r2Domain).host;
    }
  } catch {
    // Invalid domain URL in env, proceed without host variants
  }

  const exactSet = new Set<string>();
  const substringPatterns: string[] = [];
  const targets: MatcherTarget[] = [];

  for (const rawKey of keys) {
    if (!rawKey || typeof rawKey !== 'string') continue;
    const trimmed = rawKey.trim();
    if (!trimmed) continue;

    const cleanKey = (extractR2ObjectKey(trimmed) || trimmed.replace(/^\/+/, '')).trim();
    if (!cleanKey) continue;

    const filename = path.basename(cleanKey);

    const patterns = new Set<string>();
    patterns.add(trimmed);
    patterns.add(cleanKey);
    patterns.add(`/${cleanKey}`);
    patterns.add(encodeURI(cleanKey));
    patterns.add(`/${encodeURI(cleanKey)}`);
    patterns.add(decodeURIComponent(cleanKey));
    patterns.add(`/${decodeURIComponent(cleanKey)}`);

    if (r2Domain) {
      patterns.add(`${r2Domain}/${cleanKey}`);
      patterns.add(`${r2Domain}/${encodeURI(cleanKey)}`);
      patterns.add(`${r2Domain}/${decodeURIComponent(cleanKey)}`);
    }

    if (r2Host) {
      patterns.add(`https://${r2Host}/${cleanKey}`);
      patterns.add(`http://${r2Host}/${cleanKey}`);
      patterns.add(`//${r2Host}/${cleanKey}`);
      patterns.add(`${r2Host}/${cleanKey}`);
      patterns.add(`https://${r2Host}/${encodeURI(cleanKey)}`);
      patterns.add(`http://${r2Host}/${encodeURI(cleanKey)}`);
      patterns.add(`//${r2Host}/${encodeURI(cleanKey)}`);
    }

    for (const p of patterns) {
      exactSet.add(p);
      substringPatterns.push(p);
    }

    if (filename.length >= 10 && (/^\d{12}/.test(filename) || filename.includes('.'))) {
      exactSet.add(filename);
      exactSet.add(encodeURI(filename));
      exactSet.add(decodeURIComponent(filename));
      substringPatterns.push(filename);
    }

    targets.push({
      key: trimmed,
      cleanKey,
      filename,
      exactPatterns: patterns,
      urlSubstrings: Array.from(patterns),
    });
  }

  // Sort substring patterns descending by length to replace longest matches first
  substringPatterns.sort((a, b) => b.length - a.length);

  const isMatch = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;

    const baseVal = trimmed.split('?')[0].split('#')[0];
    if (exactSet.has(trimmed) || exactSet.has(baseVal)) return true;

    const unslashed = baseVal.replace(/^\/+/, '');
    if (exactSet.has(unslashed)) return true;

    for (const target of targets) {
      if (baseVal === target.cleanKey || baseVal.endsWith('/' + target.cleanKey)) {
        return true;
      }
      if (baseVal === target.filename || baseVal.endsWith('/' + target.filename)) {
        return true;
      }
    }

    return false;
  };

  const replaceInText = (text: string): { replaced: string; count: number } => {
    if (!text || typeof text !== 'string') return { replaced: text, count: 0 };
    let current = text;
    let count = 0;

    for (const pattern of substringPatterns) {
      if (!pattern || pattern.length < 5) continue;
      if (current.includes(pattern)) {
        const parts = current.split(pattern);
        count += parts.length - 1;
        current = parts.join('');
      }
    }

    return { replaced: current, count };
  };

  return { isMatch, replaceInText, targets };
}

export interface TraversalResult<T> {
  value: T;
  hasChanged: boolean;
  cleanedCount: number;
}

export function cleanValueRecursive(
  val: any,
  isMatch: (str: string) => boolean,
  replaceInText: (str: string) => { replaced: string; count: number }
): TraversalResult<any> {
  if (val === null || val === undefined) {
    return { value: val, hasChanged: false, cleanedCount: 0 };
  }

  // String field
  if (typeof val === 'string') {
    if (isMatch(val)) {
      return { value: '', hasChanged: true, cleanedCount: 1 };
    }
    // Large text or HTML containing embedded media URLs
    if (val.includes('<') || val.length > 200) {
      const rep = replaceInText(val);
      if (rep.count > 0) {
        return { value: rep.replaced, hasChanged: true, cleanedCount: rep.count };
      }
    }
    return { value: val, hasChanged: false, cleanedCount: 0 };
  }

  // Array field
  if (Array.isArray(val)) {
    let hasChanged = false;
    let cleanedCount = 0;
    const newArr: any[] = [];

    for (const item of val) {
      if (item === null || item === undefined) {
        newArr.push(item);
        continue;
      }

      if (typeof item === 'string') {
        if (isMatch(item)) {
          // Pure string URL in array -> filter out of array to prevent blank preview/read entries
          hasChanged = true;
          cleanedCount += 1;
          continue;
        }
        if (item.includes('<') || item.length > 200) {
          const rep = replaceInText(item);
          if (rep.count > 0) {
            hasChanged = true;
            cleanedCount += rep.count;
            newArr.push(rep.replaced);
            continue;
          }
        }
        newArr.push(item);
      } else {
        // Object or nested array -> recurse without deleting parent block
        const childRes = cleanValueRecursive(item, isMatch, replaceInText);
        if (childRes.hasChanged) {
          hasChanged = true;
          cleanedCount += childRes.cleanedCount;
        }
        newArr.push(childRes.value);
      }
    }

    return {
      value: hasChanged ? newArr : val,
      hasChanged,
      cleanedCount,
    };
  }

  // Object field
  if (typeof val === 'object') {
    if (val instanceof Date) {
      return { value: val, hasChanged: false, cleanedCount: 0 };
    }

    let hasChanged = false;
    let cleanedCount = 0;
    const newObj: Record<string, any> = {};

    for (const [k, v] of Object.entries(val)) {
      if (k === 'password_hash' || k === 'session_token' || k === 'rawBody') {
        newObj[k] = v;
        continue;
      }
      const childRes = cleanValueRecursive(v, isMatch, replaceInText);
      if (childRes.hasChanged) {
        hasChanged = true;
        cleanedCount += childRes.cleanedCount;
      }
      newObj[k] = childRes.value;
    }

    return {
      value: hasChanged ? newObj : val,
      hasChanged,
      cleanedCount,
    };
  }

  // Numbers, booleans, and other primitives
  return { value: val, hasChanged: false, cleanedCount: 0 };
}

export async function cleanDatabaseReferences(keys: string[]): Promise<CleanupReport> {
  const report: CleanupReport = {
    totalCleaned: 0,
    details: {},
  };

  if (!Array.isArray(keys) || keys.length === 0) {
    return report;
  }

  const { isMatch, replaceInText } = createMediaMatchers(keys);

  // 1. Supabase PostgreSQL Execution
  if (isSupabaseConfigured && supabaseAdmin) {
    // 1.1 Products
    try {
      const { data: prods } = await supabaseAdmin.from('products').select('*');

      if (Array.isArray(prods)) {
        for (const prod of prods) {
          let rowChanged = false;
          let rowCleaned = 0;
          const updates: Record<string, any> = {};

          for (const col of [
            'thumbnail_url',
            'r2_thumbnail_url',
            'sample_pdf_url',
            'custom_campaign_frame_url',
          ]) {
            if (typeof prod[col] === 'string' && prod[col]) {
              const res = cleanValueRecursive(prod[col], isMatch, replaceInText);
              if (res.hasChanged) {
                updates[col] = res.value;
                rowChanged = true;
                rowCleaned += res.cleanedCount;
              }
            }
          }

          for (const col of [
            'preview_images',
            'r2_demo_images_urls',
            'detail_blocks',
            'specs',
            'topics',
            'features',
          ]) {
            if (prod[col] !== undefined && prod[col] !== null) {
              const res = cleanValueRecursive(prod[col], isMatch, replaceInText);
              if (res.hasChanged) {
                updates[col] = res.value;
                rowChanged = true;
                rowCleaned += res.cleanedCount;
              }
            }
          }

          if (rowChanged) {
            updates.updated_at = new Date().toISOString();
            await supabaseAdmin.from('products').update(updates).eq('id', prod.id);
            report.details.products = (report.details.products || 0) + rowCleaned;
            report.totalCleaned += rowCleaned;
          }
        }
      }
    } catch (err) {
      console.error('[mediaCleanupService] Error scanning products:', err);
    }

    // 1.2 Categories
    try {
      const { data: cats } = await supabaseAdmin.from('categories').select('*');
      if (Array.isArray(cats)) {
        for (const cat of cats) {
          let rowChanged = false;
          let rowCleaned = 0;
          const updates: Record<string, any> = {};

          if (cat.blocks) {
            const res = cleanValueRecursive(cat.blocks, isMatch, replaceInText);
            if (res.hasChanged) {
              updates.blocks = res.value;
              rowChanged = true;
              rowCleaned += res.cleanedCount;
            }
          }

          for (const col of ['image_url', 'banner_url']) {
            if (typeof cat[col] === 'string' && cat[col]) {
              const res = cleanValueRecursive(cat[col], isMatch, replaceInText);
              if (res.hasChanged) {
                updates[col] = res.value;
                rowChanged = true;
                rowCleaned += res.cleanedCount;
              }
            }
          }

          if (rowChanged) {
            updates.updated_at = new Date().toISOString();
            await supabaseAdmin.from('categories').update(updates).eq('id', cat.id);
            if (updates.blocks && cat.slug) {
              await supabaseAdmin.from('site_configs').upsert({
                key: `category_blocks:${cat.slug}`,
                value: updates.blocks,
                updated_at: new Date().toISOString(),
              });
            }
            report.details.categories = (report.details.categories || 0) + rowCleaned;
            report.totalCleaned += rowCleaned;
          }
        }
      }
    } catch (err) {
      console.error('[mediaCleanupService] Error scanning categories:', err);
    }

    // 1.3 Site Configs (covers homepage_blocks, hero, banner, campaign_frame, etc.)
    try {
      const { data: configs } = await supabaseAdmin.from('site_configs').select('key, value');
      if (Array.isArray(configs)) {
        for (const cfg of configs) {
          const res = cleanValueRecursive(cfg.value, isMatch, replaceInText);
          if (res.hasChanged) {
            await supabaseAdmin
              .from('site_configs')
              .update({ value: res.value, updated_at: new Date().toISOString() })
              .eq('key', cfg.key);
            report.details.site_configs = (report.details.site_configs || 0) + res.cleanedCount;
            report.totalCleaned += res.cleanedCount;
          }
        }
      }
    } catch (err) {
      console.error('[mediaCleanupService] Error scanning site_configs:', err);
    }

    // 1.4 Safe Auxiliary Tables: menus, homepage_blocks, groups, flashcards
    const auxiliaryTables = [
      { name: 'menus', cols: ['items', 'children'] },
      { name: 'homepage_blocks', cols: ['content', 'config'] },
      { name: 'groups', cols: ['branding'] },
      { name: 'flashcards', cols: ['content'] },
    ];

    for (const aux of auxiliaryTables) {
      try {
        const { data: rows, error: selErr } = await supabaseAdmin.from(aux.name).select('*');
        if (!selErr && Array.isArray(rows)) {
          for (const row of rows) {
            let rowChanged = false;
            let rowCleaned = 0;
            const updates: Record<string, any> = {};

            for (const col of aux.cols) {
              if (row[col] !== undefined && row[col] !== null) {
                const res = cleanValueRecursive(row[col], isMatch, replaceInText);
                if (res.hasChanged) {
                  updates[col] = res.value;
                  rowChanged = true;
                  rowCleaned += res.cleanedCount;
                }
              }
            }

            if (rowChanged) {
              await supabaseAdmin.from(aux.name).update(updates).eq('id', row.id);
              report.details[aux.name] = (report.details[aux.name] || 0) + rowCleaned;
              report.totalCleaned += rowCleaned;
            }
          }
        }
      } catch {
        // Table not present in current schema, ignore safely
      }
    }
  }

  // 2. Local JSON DB Fallback Execution
  try {
    const localDbPath = path.resolve(__dirname, '../../data/local_db.json');
    if (fs.existsSync(localDbPath)) {
      const raw = fs.readFileSync(localDbPath, 'utf-8');
      const db = JSON.parse(raw);
      let localChanged = false;
      let localCleaned = 0;

      if (Array.isArray(db.products)) {
        const pRes = cleanValueRecursive(db.products, isMatch, replaceInText);
        if (pRes.hasChanged) {
          db.products = pRes.value;
          localChanged = true;
          localCleaned += pRes.cleanedCount;
        }
      }

      if (Array.isArray(db.categories)) {
        const cRes = cleanValueRecursive(db.categories, isMatch, replaceInText);
        if (cRes.hasChanged) {
          db.categories = cRes.value;
          localChanged = true;
          localCleaned += cRes.cleanedCount;
        }
      }

      if (db.site_configs && typeof db.site_configs === 'object') {
        const sRes = cleanValueRecursive(db.site_configs, isMatch, replaceInText);
        if (sRes.hasChanged) {
          db.site_configs = sRes.value;
          localChanged = true;
          localCleaned += sRes.cleanedCount;
        }
      }

      if (Array.isArray(db.menus)) {
        const mRes = cleanValueRecursive(db.menus, isMatch, replaceInText);
        if (mRes.hasChanged) {
          db.menus = mRes.value;
          localChanged = true;
          localCleaned += mRes.cleanedCount;
        }
      }

      if (localChanged) {
        fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2), 'utf-8');
        report.details.local_db = (report.details.local_db || 0) + localCleaned;
        if (!isSupabaseConfigured || !supabaseAdmin) {
          report.totalCleaned += localCleaned;
        }
      }
    }
  } catch (err) {
    console.error('[mediaCleanupService] Error cleaning local_db.json:', err);
  }

  return report;
}

export const mediaCleanupService = {
  createMediaMatchers,
  cleanValueRecursive,
  cleanDatabaseReferences,
};

export default mediaCleanupService;
