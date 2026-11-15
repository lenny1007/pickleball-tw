#!/usr/bin/env node
// 選題登記板：列出 main 和每個 claude/* 分支上的選題卡與文章，避免兩個討論串寫同一題。
// 用法：npm run topics:status         （先 git fetch，再列表）
//       npm run topics:status -- serve （只看 slug 含 serve 的）
import { execFileSync } from 'node:child_process';

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const filter = process.argv[2] ?? '';

try { git('fetch', '--quiet', 'origin'); } catch { console.error('（git fetch 失敗，用本機已有的遠端資料）'); }

const refs = git('for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin')
  .split('\n')
  .filter((r) => r === 'origin/main' || r.startsWith('origin/claude/'));

const ls = (ref, dir) => {
  try { return git('ls-tree', '--name-only', `${ref}:${dir}`).split('\n').filter(Boolean); } catch { return []; }
};
const show = (ref, path) => { try { return git('show', `${ref}:${path}`); } catch { return ''; } };

// slug → { brief: {ref: 狀態}, article: Set(ref) }
const rows = new Map();
const row = (slug) => rows.get(slug) ?? rows.set(slug, { brief: {}, article: new Set() }).get(slug);

// main 列全部；claude/* 分支只列「跟 main 分岔後新增或改過」的檔案，才看得出各討論串正在做什麼。
const files = (ref, dir) => {
  if (ref === 'origin/main') return ls(ref, dir).map((f) => `${dir}/${f}`);
  try {
    return git('diff', '--name-only', '--diff-filter=AM', `origin/main...${ref}`, '--', dir).split('\n').filter(Boolean);
  } catch { return []; }
};

for (const ref of refs) {
  for (const path of files(ref, 'docs/briefs')) {
    const f = path.split('/').pop();
    if (!f.endsWith('.md') || f === 'README.md' || f.startsWith('_')) continue;
    const text = show(ref, path);
    const slug = text.match(/^- slug：\s*(\S+)/m)?.[1] ?? f.replace(/\.md$/, '');
    const status = text.match(/^- 狀態：\s*(.+)$/m)?.[1]?.trim() ?? '（沒寫狀態）';
    const r = row(slug);
    r.brief[ref] = status;
  }
  for (const path of files(ref, 'src/content/articles')) {
    if (!/\.mdx?$/.test(path)) continue;
    row(path.split('/').pop().replace(/\.mdx?$/, '')).article.add(ref);
  }
}

const short = (ref) => ref.replace('origin/', '');
const out = [...rows.entries()]
  .filter(([slug]) => slug.includes(filter))
  .sort(([a, x], [b, y]) => (x.article.has('origin/main') - y.article.has('origin/main')) || a.localeCompare(b));

console.log('slug\t上線\t有改動的分支\t選題卡狀態（分支）');
for (const [slug, r] of out) {
  const live = r.article.has('origin/main') ? '✓' : '';
  const arts = [...r.article].filter((x) => x !== 'origin/main').map(short).join(', ');
  const briefs = Object.entries(r.brief)
    .map(([ref, s]) => `${s}（${short(ref)}）`)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join('；');
  console.log([slug, live, arts || '-', briefs || '（沒有選題卡）'].join('\t'));
}

// 同一個 slug 在兩個以上的 claude/* 分支都有文章：多半是撞題
const clash = out.filter(([, r]) => [...r.article].filter((x) => x !== 'origin/main').length > 1);
if (clash.length) {
  console.log('\n△ 同一篇在多個分支都有文章，先確認是不是兩個討論串撞題：');
  for (const [slug, r] of clash) console.log(`  ${slug}: ${[...r.article].map(short).join(', ')}`);
}
