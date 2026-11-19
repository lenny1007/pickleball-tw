#!/usr/bin/env node
// 數字對來源（test:sources）。移植自 golfer-tw（docs/CROSS-SITE-PLAYBOOK.md），規格檔改用本站的選題卡。
//
// 新文章（不在 config/article-sources-legacy.json 的）必須有選題卡 docs/briefs/<名稱>.md
//（卡裡「- slug：<slug>」那行對得上；範本 docs/briefs/_TEMPLATE.md），並且：
//   1. 選題卡的「來源表」至少有一列填了一手來源（網址、規則條號或影片秒數）
//   2. 選題卡有「刻意不寫」段落（沒有就寫「無」）
//   3. 文章裡每個帶單位的數字（%、呎、公分、克、mph、NT$、元、倍、歲…）都要原樣出現在來源表裡
//
// 來源、條號、查證日期都記在選題卡，文章內文不放（站主 2026-11-15、2026-11-19），讀者在文末「資料來源」看。
// 它只確認「數字有登記來源」，不確認來源真的這樣說；那是獨立查證（docs/ARTICLE_WORKFLOW.md 第 5 步）的工作。
//
// 用法：
//   node scripts/check-article-sources.mjs                 檢查全部新文章
//   node scripts/check-article-sources.mjs --file=<slug>   只看一篇（寫文時用）
//   --blog-dir=<dir> --briefs-dir=<dir> --legacy-file=<file>   測試用

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// 帶單位的數字。純序號（第 3 步、3 個重點）不算，因為沒有單位。
const UNIT = String.raw`(?:%|％|呎|英尺|feet|ft\b|吋|英吋|inch(?:es)?|公分|cm|mm|公尺|m\b|mph|km\/h|公里|公克|克|g\b|盎司|oz|磅|lbs?|°|度|倍|歲|秒|分鐘|小時|元|萬|億|洞|顆|盒)`;
const NUM = String.raw`\d[\d,]*(?:\.\d+)?`;
const NUMBER_RE = new RegExp(
  String.raw`(?:(?:NT|US|HK)?\$\s*${NUM}(?:\s*[-–~～至到]\s*(?:(?:NT|US)?\$\s*)?${NUM})?\s*(?:萬|元)?)` +
    String.raw`|(?:${NUM}(?:\s*[-–~～至到]\s*${NUM})?\s*${UNIT})`,
  'g',
);

const FRONTMATTER_SKIP = /^\s*(?:cover\w*|pubDate|updatedDate|category|kind|tags|draft|slug|order|image\w*|related\w*|sources?)\s*:/;

// 數字比對時的正規化：去空白、千分位逗號，範圍符號統一
export function normalizeNumber(s) {
  return s
    .replace(/\s+/g, '')
    .replace(/(\d),(?=\d{3})/g, '$1')
    .replace(/[–~～至到]/g, '-')
    .replace(/％/g, '%')
    .replace(/英尺|feet|ft\b/gi, '呎')
    .replace(/英吋|inch(?:es)?/gi, '吋');
}

export function extractNumbers(text) {
  const lines = text.split(/\r?\n/);
  let inFrontmatter = lines[0]?.trim() === '---';
  let inFence = false;
  const out = [];
  lines.forEach((raw, idx) => {
    if (idx === 0 && inFrontmatter) return;
    if (inFrontmatter) {
      if (raw.trim() === '---') inFrontmatter = false;
      else if (!FRONTMATTER_SKIP.test(raw)) collect(raw, idx + 1);
      return;
    }
    if (/^\s*```/.test(raw)) {
      inFence = !inFence;
      return;
    }
    if (inFence || /^\s*(?:import|export)\s/.test(raw)) return;
    collect(raw, idx + 1);
  });
  function collect(raw, lineNo) {
    const line = raw
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\]\([^)]*\)/g, ']')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/(?:topic|slug|id|href|src|cards?|class|width|height)=["'{][^"'}]*["'}]/g, ' ');
    for (const m of line.matchAll(NUMBER_RE)) {
      out.push({ line: lineNo, raw: m[0].trim(), norm: normalizeNumber(m[0]) });
    }
  }
  return out;
}

// 選題卡的「來源表」段落：從標題含「來源表」的 ## 到下一個 ##
export function sourceTableSection(spec) {
  const m = spec.match(/^##[^\n]*來源表[^\n]*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  return m ? m[1] : '';
}

export function checkSpec(spec) {
  const problems = [];
  const table = sourceTableSection(spec);
  if (!table) problems.push('選題卡沒有「來源表」段落');
  const filledRows = table
    .split('\n')
    .filter((l) => /^\|/.test(l) && !/^\|\s*[-:|\s]+\|?\s*$/.test(l) && !/^\|\s*#\s*\|/.test(l))
    .filter((l) => /https?:\/\/|PMID|PMC\d|t=\d+|\d{1,2}:\d{2}|規則\s*\d|Rule\s*\d/i.test(l));
  if (table && !filledRows.length) problems.push('來源表沒有任何一列填了一手來源（網址、規則條號或影片秒數）');
  if (!/^##[^\n]*刻意不寫/m.test(spec)) problems.push('選題卡沒有「刻意不寫」段落（沒有就寫「無」）');
  return { problems, tableNorm: normalizeNumber(table) };
}

// 選題卡檔名不一定等於 slug（balls.md ↔ pickleball-balls），以卡裡「- slug：」那行為準
export function findBrief(briefsDir, slug) {
  if (!existsSync(briefsDir)) return null;
  for (const f of readdirSync(briefsDir).filter((n) => n.endsWith('.md') && !n.startsWith('_')).sort()) {
    const path = join(briefsDir, f);
    const m = readFileSync(path, 'utf8').match(/^-\s*slug\s*[:：]\s*`?([\w-]+)`?/m);
    if (m && m[1] === slug) return path;
  }
  return null;
}

export function checkArticle(articleText, specText) {
  if (specText == null) return { problems: ['找不到選題卡（docs/briefs/ 裡沒有「- slug：<slug>」的卡）'], missing: [] };
  const { problems, tableNorm } = checkSpec(specText);
  const seen = new Set();
  const missing = [];
  for (const n of extractNumbers(articleText)) {
    if (seen.has(n.norm)) continue;
    seen.add(n.norm);
    if (!tableNorm.includes(n.norm)) missing.push(n);
  }
  return { problems, missing };
}

function parseArgs(argv) {
  const args = {
    blogDir: join(ROOT, 'src/content/articles'),
    briefsDir: join(ROOT, 'docs/briefs'),
    legacyFile: join(ROOT, 'config/article-sources-legacy.json'),
  };
  for (const a of argv) {
    if (a.startsWith('--file=')) args.file = a.slice(7).replace(/\.mdx?$/, '');
    else if (a.startsWith('--blog-dir=')) args.blogDir = resolve(a.slice(11));
    else if (a.startsWith('--briefs-dir=')) args.briefsDir = resolve(a.slice(13));
    else if (a.startsWith('--legacy-file=')) args.legacyFile = resolve(a.slice(14));
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const legacy = new Set(existsSync(args.legacyFile) ? JSON.parse(readFileSync(args.legacyFile, 'utf8')).slugs : []);
  let articles = readdirSync(args.blogDir)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => ({ slug: f.replace(/\.mdx?$/, ''), path: join(args.blogDir, f) }));
  if (args.file) articles = articles.filter((a) => a.slug === args.file);
  const targets = articles.filter((a) => !legacy.has(a.slug));

  let failed = 0;
  for (const a of targets) {
    const specPath = findBrief(args.briefsDir, a.slug);
    const { problems, missing } = checkArticle(readFileSync(a.path, 'utf8'), specPath ? readFileSync(specPath, 'utf8') : null);
    if (!problems.length && !missing.length) {
      console.log(`✓ ${a.slug}`);
      continue;
    }
    failed += 1;
    console.error(`✗ ${a.slug}${specPath ? `（選題卡：${specPath.replace(ROOT + '/', '')}）` : ''}`);
    for (const p of problems) console.error(`    ${p}`);
    for (const n of missing) console.error(`    L${n.line} 「${n.raw}」不在選題卡來源表`);
  }

  if (args.file && !targets.length) {
    console.log(`${args.file} 是舊文（legacy 清單內），不跑數字對來源檢查。`);
    return;
  }
  if (!failed) {
    console.log(`test:sources 通過：${targets.length} 篇新文章的數字都登記在選題卡來源表。`);
    return;
  }
  console.error(
    `\ntest:sources 失敗：${failed} 篇。新文章的選題卡（docs/briefs/，範本 _TEMPLATE.md）要有「來源表」與「刻意不寫」，` +
      '\n文中每個帶單位的數字都要原樣寫進來源表、附一手來源。查不到來源的數字不要寫。來源不放進文章內文。',
  );
  process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
