import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { baselineIncreases, buildBaseline, compareToBaseline, countByRule, scanText } from './check-article-claims.mjs';

const scriptPath = resolve(dirname(fileURLToPath(import.meta.url)), 'check-article-claims.mjs');

function rules(text) {
  return scanText(text).map((h) => h.rule);
}

function mdx(body, fm = 'title: "測試"') {
  return `---\n${fm}\n---\n\n${body}\n`;
}

test('排序最高級：沒掛名算命中，同一行寫出是誰說的就不算', () => {
  assert.deepEqual(rules(mdx('這是新手最常見的錯誤。')), ['superlative']);
  assert.deepEqual(rules(mdx('Coach Jess 認為這是最常見的錯誤。')), []);
  assert.deepEqual(rules(mdx('教練說這是反手最常見的錯誤。')), []);
  assert.deepEqual(rules(mdx('USA Pickleball 規則寫明這是最常見的違例。')), []);
});

test('來源括號不算掛名，而且本身就是 inline-citation', () => {
  assert.deepEqual(rules(mdx('新手最常見的錯誤（Better Pickleball、2026-11 查證）。')), ['inline-citation']);
  assert.deepEqual(rules(mdx('九成球友會犯（來源：某調查）。')), ['inline-citation', 'unsourced-percent']);
  assert.deepEqual(rules(mdx('發球要低手（規則 4.A.2）。')), ['inline-citation']);
  assert.deepEqual(rules(mdx('## 資料來源\n\n- USA Pickleball 規則 4.A.2（2026-11 查證）')), [], '資料來源段不檢查');
  assert.deepEqual(rules(mdx('## 延伸閱讀\n\n- 最常見的錯誤')), []);
});

test('比較句與絕對說法', () => {
  assert.deepEqual(rules(mdx('站位比揮拍更重要。')), ['comparative']);
  assert.deepEqual(rules(mdx('這樣做保證有效。')), ['absolute']);
  assert.deepEqual(rules(mdx('改了也不一定會變好。')), [], '否定句不算');
  assert.deepEqual(rules(mdx('教練可以保證我升級嗎？')), [], '問句不算');
});

test('百分比與倍數：沒掛名、沒登記在選題卡來源表算命中', () => {
  assert.deepEqual(rules(mdx('九成的新手都打太高。')), ['unsourced-percent']);
  assert.deepEqual(rules(mdx('新手裡 92% 會把球打太高。')), ['unsourced-percent']);
  assert.deepEqual(scanText(mdx('新手裡 92% 會把球打太高。'), { registered: '|新手打太高|92%|https://x|' }), [], '登記在來源表');
  assert.deepEqual(rules(mdx('研究發現 92% 的新手會把球打太高。')), []);
  assert.deepEqual(rules(mdx('用 70% 力道揮拍。')), []);
  assert.deepEqual(rules(mdx('這樣練快 5 倍。')), ['unsourced-multiple']);
});

test('受傷：保證算命中；提到受傷卻全文沒就醫提醒算一筆', () => {
  assert.deepEqual(rules(mdx('照做就不會受傷。\n\n有疑慮請就醫。')), ['injury-guarantee']);
  assert.deepEqual(rules(mdx('匹克球肘常見於握太緊。\n\n手腕疼痛也是。')), ['injury-no-doctor']);
  assert.deepEqual(rules(mdx('匹克球肘常見於握太緊。\n\n持續疼痛請找醫師評估。')), []);
});

test('成效時程', () => {
  assert.deepEqual(rules(mdx('照這樣練 3 個月見效。')), ['timeline-promise']);
  assert.deepEqual(rules(mdx('兩週就升級。')), ['timeline-promise']);
  assert.deepEqual(rules(mdx('不要期待幾週見效。')), []);
});

test('略過程式碼區塊、import、網址與 frontmatter 的非讀者欄位', () => {
  const text = mdx(
    "import X from './x';\n\n```\n九成 最常見\n```\n\n[連結](https://example.com/?a=50%25)",
    'title: "x"\ncover_alt: "最常見"\ndescription: "九成球友打太高"',
  );
  assert.deepEqual(rules(text), ['unsourced-percent'], '只剩 description 的九成');
});

test('寬限是逐句的：拿新句子換掉舊句子也擋', () => {
  const old = { a: scanText(mdx('最常見的錯誤。\n\n握桿最重要。')) };
  const baseline = buildBaseline(old);
  assert.equal(compareToBaseline(old, baseline).length, 0);

  const swapped = { a: scanText(mdx('最常見的錯誤。\n\n站姿最關鍵。')) };
  const over = compareToBaseline(swapped, baseline);
  assert.equal(over.length, 1, '筆數一樣，但新句子不在清單');
  assert.equal(over[0].hits[0].match, '最關鍵');

  const edited = { a: scanText(mdx('最常見的錯誤之一。\n\n握桿最重要。')) };
  assert.equal(compareToBaseline(edited, baseline).length, 1, '改寫過的舊句子沒修掉也擋');

  const moved = { a: scanText(mdx('前面加一段。\n\n握桿最重要。\n\n最常見的錯誤。')) };
  assert.equal(compareToBaseline(moved, baseline).length, 0, '句子沒改、只是移位置不擋');

  assert.equal(compareToBaseline({ b: scanText(mdx('九成。')) }, baseline).length, 1, '新文章沒有寬限');
});

test('只收緊模式不會替新句子開寬限；baselineIncreases 抓出調高', () => {
  const previous = buildBaseline({ a: scanText(mdx('最常見。')) });
  const scan = { a: scanText(mdx('最常見。最重要。九成。')) };
  assert.deepEqual(countByRule(scan.a), { superlative: 2, 'unsourced-percent': 1 });
  const tightened = buildBaseline(scan, previous);
  assert.deepEqual(tightened.totals, { superlative: 1 });
  assert.equal(baselineIncreases(previous, tightened).length, 0);
  const loosened = buildBaseline(scan, previous, { allowIncrease: true });
  assert.equal(baselineIncreases(previous, loosened).length, 2);
});

test('CLI：清單外命中 exit 1；--baseline 只往下收；--compare-baseline 擋調高', () => {
  const dir = mkdtempSync(join(tmpdir(), 'claims-'));
  try {
    const blog = join(dir, 'blog');
    mkdirSync(blog);
    const bl = join(dir, 'baseline.json');
    const run = (...args) =>
      spawnSync(process.execPath, [scriptPath, `--blog-dir=${blog}`, `--baseline-file=${bl}`, ...args], { encoding: 'utf8' });

    writeFileSync(join(blog, 'a.mdx'), mdx('最常見。最重要。'));
    assert.equal(run('--baseline').status, 0, '沒有舊清單時建立首版');
    const first = readFileSync(bl, 'utf8');
    assert.equal(run().status, 0);

    writeFileSync(join(blog, 'a.mdx'), mdx('最常見。'));
    assert.equal(run('--baseline').status, 0);
    assert.equal(JSON.parse(readFileSync(bl, 'utf8')).totals.superlative, 1, '收緊到現況');

    writeFileSync(join(blog, 'b.mdx'), mdx('保證有效。'));
    const fail = run();
    assert.equal(fail.status, 1);
    assert.match(fail.stderr, /b\s+L\d+ \[absolute\]/);
    assert.equal(run('--baseline').status, 1, '只收緊模式不替新文章開寬限');

    const base = join(dir, 'base.json');
    writeFileSync(base, readFileSync(bl, 'utf8'));
    assert.equal(run(`--compare-baseline=${base}`).status, 0);
    writeFileSync(bl, first);
    const grew = run(`--compare-baseline=${base}`);
    assert.equal(grew.status, 1, '寬限比 base 多就擋');
    assert.match(grew.stderr, /claims-baseline-ok/);
    assert.equal(run(`--compare-baseline=${join(dir, 'missing.json')}`).status, 0, 'base 沒有清單時略過');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
