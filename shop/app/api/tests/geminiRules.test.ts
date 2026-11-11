import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFilesRecursively(dir: string, extensions: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === '.git'
      ) {
        continue;
      }
      files.push(...getFilesRecursively(fullPath, extensions));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

describe('Feature 21: Static Audit & GEMINI.md Ecosystem Compliance', () => {
  const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const apiSrcDir = path.join(workspaceRoot, 'shop', 'app', 'api', 'src');
  const webSrcDir = path.join(workspaceRoot, 'shop', 'app', 'web', 'src');
  const apiTestsDir = path.join(workspaceRoot, 'shop', 'app', 'api', 'tests');

  const sourceFiles = [
    ...getFilesRecursively(apiSrcDir, ['.ts', '.js']),
    ...getFilesRecursively(webSrcDir, ['.ts', '.tsx', '.js']),
    ...getFilesRecursively(apiTestsDir, ['.ts', '.js']),
  ];

  it('T1-F21-03: Zero hardcoded domains/ports across frontend, backend, and test suites', () => {
    // Patterns from GEMINI.md Section 1
    const forbiddenPatterns = [
      /https?:\/\/([a-zA-Z0-9_\-\.]+\.)?huytutor\.edu\.vn/i,
      /https?:\/\/localhost:\d+/i,
      /http:\/\/localhost:\d+/i,
      /huytutor\.onrender\.com/i,
      /supabase-proxy/i,
    ];

    const violations: Array<{ file: string; line: number; match: string }> = [];

    for (const filePath of sourceFiles) {
      const isSelf = path.resolve(filePath) === path.resolve(__filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();
        // Skip comment lines
        if (
          trimmed.startsWith('//') ||
          trimmed.startsWith('/*') ||
          trimmed.startsWith('*')
        ) {
          return;
        }

        // In geminiRules.test.ts itself, skip lines defining the regex patterns
        if (isSelf && (trimmed.startsWith('/') || trimmed.includes('forbiddenPatterns'))) {
          return;
        }

        for (const pattern of forbiddenPatterns) {
          if (pattern.test(line)) {
            violations.push({
              file: path.relative(workspaceRoot, filePath),
              line: lineIndex + 1,
              match: line.trim(),
            });
          }
        }
      });
    }

    assert.strictEqual(
      violations.length,
      0,
      `Detected hardcoded domain violations:\n${violations
        .map((v) => `  ${v.file}:${v.line} -> ${v.match}`)
        .join('\n')}`
    );
  });

  it('T1-F21-04: Zero forbidden framework prefixes (VITE_, PUBLIC_, NEXT_PUBLIC_)', () => {
    const forbiddenPrefixPattern = /(?:process\.env|import\.meta\.env)\.(?:VITE_|PUBLIC_|NEXT_PUBLIC_)/;
    const violations: Array<{ file: string; line: number; match: string }> = [];

    for (const filePath of sourceFiles) {
      const isSelf = path.resolve(filePath) === path.resolve(__filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          return;
        }

        if (isSelf && trimmed.includes('forbiddenPrefixPattern')) {
          return;
        }

        if (forbiddenPrefixPattern.test(line)) {
          violations.push({
            file: path.relative(workspaceRoot, filePath),
            line: lineIndex + 1,
            match: line.trim(),
          });
        }
      });
    }

    assert.strictEqual(
      violations.length,
      0,
      `Detected forbidden env prefix violations:\n${violations
        .map((v) => `  ${v.file}:${v.line} -> ${v.match}`)
        .join('\n')}`
    );
  });

  it('T2-F21-05: Zero unsafe fallback operators (|| "http...") on domain or API env variables', () => {
    const fallbackPattern = /(?:process\.env|import\.meta\.env)\.[A-Z_]+_(?:URL|DOMAIN)\s*\|\|\s*['"`]http/i;
    const violations: Array<{ file: string; line: number; match: string }> = [];

    for (const filePath of sourceFiles) {
      const isSelf = path.resolve(filePath) === path.resolve(__filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          return;
        }

        if (isSelf && trimmed.includes('fallbackPattern')) {
          return;
        }

        if (fallbackPattern.test(line)) {
          violations.push({
            file: path.relative(workspaceRoot, filePath),
            line: lineIndex + 1,
            match: line.trim(),
          });
        }
      });
    }

    assert.strictEqual(
      violations.length,
      0,
      `Detected unsafe env fallback violations:\n${violations
        .map((v) => `  ${v.file}:${v.line} -> ${v.match}`)
        .join('\n')}`
    );
  });

  it('T2-F21-03: No documentation or markdown files staged in git status', () => {
    let stagedDocs: string[] = [];
    try {
      const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
      stagedDocs = staged
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean)
        .filter((f) => /\.(md|markdown)$/i.test(f) || /^(\.specify|specs|\.agents|docs)\//i.test(f));
    } catch {
      // Git command fallback in isolated environment
    }

    assert.strictEqual(
      stagedDocs.length,
      0,
      `GEMINI.md §7 Violation: Documentation files staged in git index: ${stagedDocs.join(', ')}`
    );

    const excludePath = path.join(workspaceRoot, '.git', 'info', 'exclude');
    if (fs.existsSync(excludePath)) {
      const content = fs.readFileSync(excludePath, 'utf-8');
      assert(content.includes('GEMINI.md'), '.git/info/exclude must protect GEMINI.md');
      assert(content.includes('.specify/'), '.git/info/exclude must protect .specify/');
      assert(content.includes('specs/'), '.git/info/exclude must protect specs/');
      assert(content.includes('.agents/'), '.git/info/exclude must protect .agents/');
    }
  });

  it('T2-F21-04: Master cookie and SSO token conform to GEMINI.md naming', () => {
    const clientTsPath = path.join(workspaceRoot, 'shop', 'app', 'web', 'src', 'api', 'client.ts');
    const clientContent = fs.readFileSync(clientTsPath, 'utf-8');
    assert(
      clientContent.includes(`SESSION_STORAGE_KEY = 'ht_session_token'`),
      'Frontend client must use ht_session_token as SESSION_STORAGE_KEY'
    );

    const authMidPath = path.join(workspaceRoot, 'shop', 'app', 'api', 'src', 'middlewares', 'authMiddleware.ts');
    const authMidContent = fs.readFileSync(authMidPath, 'utf-8');
    assert(
      authMidContent.includes('ht_sso_token'),
      'Backend auth middleware must extract ht_sso_token cookie'
    );
  });
});
