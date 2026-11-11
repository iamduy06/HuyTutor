export interface UniversalBlockItem {
  id: string;
  type: string;
  is_active: boolean;
  sort_order: number;
  config: Record<string, any>;
}

export interface CustomHtmlBlockConfig {
  html_content: string;
  container_mode: 'boxed' | 'full_width';
  no_padding?: boolean;
  admin_label?: string;
}

export interface CustomPageBlock {
  id: string;
  type: string;
  is_active: boolean;
  sort_order?: number;
  config: Record<string, any>;
}

export type RenderMode = 'legacy' | 'hybrid' | 'blocks';

export interface BaseUtilityPageConfig {
  title: string;
  description?: string;
  render_mode?: RenderMode;
  blocks?: CustomPageBlock[];
  [key: string]: any;
}

export function createDefaultUniversalBlock(type: string, sortOrder = 0): UniversalBlockItem {
  const id = `block_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  if (type === 'custom_html') {
    return {
      id,
      type: 'custom_html',
      is_active: true,
      sort_order: sortOrder,
      config: {
        html_content: '',
        container_mode: 'boxed',
        no_padding: false,
        admin_label: '',
      },
    };
  }

  return {
    id,
    type,
    is_active: true,
    sort_order: sortOrder,
    config: {},
  };
}

export function validateUniversalBlock(block: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!block || typeof block !== 'object') {
    return { valid: false, errors: ['Block must be an object'] };
  }
  if (!block.id || typeof block.id !== 'string') errors.push('Missing or invalid block.id');
  if (!block.type || typeof block.type !== 'string') errors.push('Missing or invalid block.type');
  if (typeof block.is_active !== 'boolean') errors.push('block.is_active must be boolean');
  if (typeof block.sort_order !== 'number') errors.push('block.sort_order must be number');
  if (!block.config || typeof block.config !== 'object') errors.push('Missing block.config');

  if (block.type === 'custom_html') {
    const cfg = block.config || {};
    if (typeof cfg.html_content !== 'string') errors.push('custom_html config.html_content must be string');
    if (cfg.container_mode && !['boxed', 'full_width'].includes(cfg.container_mode)) {
      errors.push('custom_html config.container_mode must be "boxed" or "full_width"');
    }
    if (cfg.no_padding !== undefined && typeof cfg.no_padding !== 'boolean') {
      errors.push('custom_html config.no_padding must be boolean if present');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateUtilityPageConfig(
  config: BaseUtilityPageConfig
): { valid: boolean; effectiveMode: RenderMode; errors: string[] } {
  const errors: string[] = [];
  if (!config || typeof config !== 'object') {
    return { valid: false, effectiveMode: 'legacy', errors: ['Config must be an object'] };
  }

  const rawMode = config.render_mode;
  let effectiveMode: RenderMode = 'legacy';
  if (rawMode === 'hybrid' || rawMode === 'blocks' || rawMode === 'legacy') {
    effectiveMode = rawMode;
  } else if (rawMode !== undefined) {
    errors.push(`Invalid render_mode: "${rawMode}". Expected 'legacy' | 'hybrid' | 'blocks'`);
  }

  if (config.blocks !== undefined) {
    if (!Array.isArray(config.blocks)) {
      errors.push('blocks must be an array of CustomPageBlock if present');
    } else {
      config.blocks.forEach((blk, idx) => {
        if (!blk.id) errors.push(`Block at index ${idx} missing id`);
        if (!blk.type) errors.push(`Block at index ${idx} missing type`);
      });
    }
  }

  return { valid: errors.length === 0, effectiveMode, errors };
}

export function simulateSingleSegmentRedirect(
  slug: string,
  customPages: Array<{ slug: string; is_active: boolean; [key: string]: any }>
) {
  const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
  const matched = customPages.find((p) => p.slug === cleanSlug);
  if (!matched) {
    return { status: 404, matchedPage: null };
  }
  if (!matched.is_active) {
    return { status: 404, matchedPage: null };
  }
  return { status: 200, matchedPage: matched };
}
