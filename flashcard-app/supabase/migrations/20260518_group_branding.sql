-- Migration: Add branding JSONB column to groups table
-- Structure: { allow_custom_branding: bool, show_header: bool, show_footer: bool, header_logo_text: string|null }

ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS branding JSONB NOT NULL DEFAULT '{
  "allow_custom_branding": false,
  "show_header": true,
  "show_footer": true,
  "header_logo_text": null
}'::jsonb;
