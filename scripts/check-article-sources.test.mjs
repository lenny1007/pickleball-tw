import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkArticle, extractNumbers, normalizeNumber } from './check-article-sources.mjs';

const scriptPath = resolve(dirname(fileURLToPath(import.meta.url)), 'check-article-sources.mjs');

const article = `---
title: "測試"
description: "球直徑 2.87 到 2.97 吋，重 0.78-0.935 盎司"
pubDate: 2026-12-01
cover: ../../assets/covers/x.webp
---

非截擊區從網子往後 7 呎，網高中間 34 吋、兩邊 36 吋。

第 3 步：練 3 個重點。報名費每隊 NT$1,600。
`;

function spec(rows, { dontWrite = true, slug = 'new-post' } = {}) {
  return `# 選題卡：x

- slug：${slug}
- 狀態：寫作中

## 來源表

| 數字或說法 | 一手來源 | 查證日 |
|---|---|---|
${rows}

${dontWrite ? '## 刻意不寫\n\n無\n' : ''}
## 大綱
`;
}

const fullRows = [
  '| 直徑 2.87 到 2.97 吋、0.78-0.935 盎司 | USA Pickleball 規則 2.F | 2026-11 |',
  '| 7 呎、34 吋、36 吋 | https://example.com/rules | 2026-11 |',
  '| NT$1,600 | https://example.com/b.pdf | 2026-11 |',
].join('\n');

test('只抓帶單位的數字；序號與 frontmatter 非讀者欄位不算', () => {
  const raws = extractNumbers(article).map((n) => n.raw);
  assert.deepEqual(raws, ['2.87 到 2.97 吋', '0.78-0.935 盎司', '7 呎', '34 吋', '36 吋', 'NT$1,600']);
});

test('正規化：千分位、空白、範圍符號、英尺與英吋', () => {
  assert.equal(normalizeNumber('NT$ 1,600'), 'NT$1600');
  assert.equal(normalizeNumber('2.87～2.97 吋'), '2.87-2.97吋');
  assert.equal(normalizeNumber('7 英尺'), '7呎');
});

test('數字都在來源表就通過；少一個就列出來', () => {
  assert.deepEqual(checkArticle(article, spec(fullRows)), { problems: [], missing: [] });
  const partial = checkArticle(article, spec(fullRows.split('\n').slice(0, 2).join('\n')));
  assert.deepEqual(partial.missing.map((n) => n.raw), ['NT$1,600']);
});

test('數字寫在來源表以外的段落不算', () => {
  const s = spec(fullRows.split('\n').slice(0, 2).join('\n')).replace('無\n', '無。另外 NT$1,600 我記得是對的。\n');
  assert.equal(checkArticle(article, s).missing.length, 1);
});

test('選題卡結構：找不到卡、來源表沒填一手來源、沒有刻意不寫', () => {
  assert.match(checkArticle(article, null).problems.join(), /找不到選題卡/);
  const noSource = spec('| 7 呎 | 記得是這樣 | 2026-11 |');
  assert.match(checkArticle(article, noSource).problems.join(), /一手來源/);
  assert.match(checkArticle(article, spec(fullRows, { dontWrite: false })).problems.join(), /刻意不寫/);
});

test('CLI：舊文略過、新文沒選題卡就失敗、選題卡檔名不必等於 slug', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sources-'));
  try {
    const blog = join(dir, 'articles');
    const briefs = join(dir, 'briefs');
    mkdirSync(blog);
    mkdirSync(briefs);
    const legacy = join(dir, 'legacy.json');
    writeFileSync(legacy, JSON.stringify({ slugs: ['old'] }));
    writeFileSync(join(blog, 'old.mdx'), article);
    const run = (...a) =>
      spawnSync(process.execPath, [scriptPath, `--blog-dir=${blog}`, `--briefs-dir=${briefs}`, `--legacy-file=${legacy}`, ...a], {
        encoding: 'utf8',
      });
    assert.equal(run().status, 0, '只有舊文');

    writeFileSync(join(blog, 'new-post.mdx'), article);
    const fail = run();
    assert.equal(fail.status, 1);
    assert.match(fail.stderr, /new-post[\s\S]*找不到選題卡/);

    writeFileSync(join(briefs, 'post.md'), spec(fullRows));
    assert.equal(run().status, 0);
    assert.match(run('--file=old').stdout, /舊文/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
