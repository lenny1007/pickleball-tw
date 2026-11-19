// 知識卡的長度單位：用公制，英制只能放在括號裡寫「英尺」「英寸」（docs/TERMINOLOGY.md「長度單位」）。
// 卡片由站主電腦的萃取端產生，這支測試擋住英制混進站。文章由寫作流程與查證把關，不在這裡檢查。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// 括號裡的英制換算（例：（7 英尺）、（44 × 20 英尺）、（¼ 英寸））可以留
const ALLOWED = /（[\d.¼½¾ ×到]+英[尺寸]）/g;
const BAD = /呎|吋|英尺|英寸/;

export function unitProblems(text) {
  return text.split('\n').filter((line) => BAD.test(line.replace(ALLOWED, '')));
}

test('unitProblems：括號換算可以，其他英制不行', () => {
  assert.deepEqual(unitProblems('離網 2.13 公尺（7 英尺）'), []);
  assert.deepEqual(unitProblems('（44 × 20 英尺）'), []);
  assert.equal(unitProblems('過網約 3 呎').length, 1);
  assert.equal(unitProblems('離底線約 4 英尺（約 1.2 公尺）').length, 1);
});

test('知識卡沒有括號外的英制', () => {
  const cards = JSON.parse(readFileSync('src/content/knowledge/cards.json', 'utf8'));
  const bad = [];
  for (const c of cards) {
    for (const s of [c.title, c.what, c.why, c.check, ...(c.how ?? [])]) {
      if (typeof s === 'string' && unitProblems(s).length) bad.push(`${c.id}：${s}`);
    }
  }
  assert.deepEqual(bad, []);
});
