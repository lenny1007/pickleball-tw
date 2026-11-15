// 文章上線前檢查：好讀、好檢索、不踩已知的坑。
// 用法：npm run check:articles [-- slug ...]（不給 slug 就檢查全部）
// ✗ 是一定要修的（會讓頁面壞掉或違反寫作規則），結束碼 1；△ 是建議，自己判斷。
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/content/articles';
const slugs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(DIR).filter((f) => /\.mdx?$/.test(f)).map((f) => f.replace(/\.mdx?$/, ''));

const len = (s) => [...s].length;
let hard = 0;

for (const slug of slugs) {
  const file = [`${slug}.mdx`, `${slug}.md`].map((f) => join(DIR, f)).find(existsSync);
  if (!file) { console.log(`✗ 找不到 ${slug}`); hard++; continue; }
  const raw = readFileSync(file, 'utf8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const body = raw.slice(fm.length + 8);
  const get = (k) => fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^['"]|['"]$/g, '') ?? '';
  const out = [];
  const err = (m) => { out.push(`  ✗ ${m}`); hard++; };
  const warn = (m) => out.push(`  △ ${m}`);

  // 檢索：標題、說明、重點
  const title = get('title');
  if (len(title) > 32) warn(`標題 ${len(title)} 字，搜尋結果會被截斷，建議 32 字內`);
  const desc = get('description');
  if (len(desc) < 50 || len(desc) > 120) warn(`description ${len(desc)} 字，建議 50 到 120 字`);
  const takeaways = (fm.match(/^takeaways:\n((?:\s+-.*\n?)+)/m)?.[1].match(/^\s+-/gm) ?? []).length;
  if (takeaways < 3) warn('takeaways 少於 3 條（文章頂端的重點框）');

  // 結構：H2 數量與長度
  const prose = body.replace(/```[\s\S]*?```/g, '');
  const h2 = [...prose.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  const mainH2 = h2.filter((h) => !['延伸閱讀', '參考影片', '參考資料', '資料來源', '這篇怎麼整理的'].includes(h));
  if (mainH2.length < 3) warn(`正文 H2 只有 ${mainH2.length} 個，右側段落軌不會出現`);
  if (mainH2.length > 9) warn(`正文 H2 有 ${mainH2.length} 個，考慮合併或拆成兩篇`);
  for (const h of mainH2) if (len(h.split('：')[0]) > 16) warn(`H2 冒號前超過 16 字，段落軌會很擠：「${h}」`);

  // 好讀：段落長度、視覺間隔
  const paras = prose.split(/\n{2,}/).map((p) => p.trim())
    .filter((p) => p && !/^(#|-|\d+\.|<|import |\||>|\{)/.test(p));
  for (const p of paras) if (len(p) > 220) warn(`段落 ${len(p)} 字，建議拆開：「${p.slice(0, 24)}…」`);
  const chars = len(prose.replace(/\s/g, ''));
  const tables = (prose.match(/^\|.*\|\s*\n\|[\s:|-]+\|/gm) ?? []).length;
  const visualCount = (prose.match(/<(?!details|summary)[A-Z]\w+[\s/>]/g) ?? []).length + tables;
  if (visualCount < Math.ceil(mainH2.length / 2)) warn(`正文 ${mainH2.length} 個 H2 只有 ${visualCount} 個圖、表或影片卡，建議每 2 個 H2 至少一個`);
  // 封面：沒有專屬封面會用預設的球場一角
  const cover = readFileSync('src/components/fig/ArticleCover.astro', 'utf8');
  const keys = [...cover.matchAll(/slug\.includes\('([^']+)'\)/g)].map((m) => m[1]);
  if (!keys.some((k) => slug.includes(k))) warn('沒有專屬封面，在 ArticleCover 加一種 kind');

  // 內部連結
  const internal = new Set([...prose.matchAll(/\]\((\/[^)\s#]*)/g)].map((m) => m[1]));
  if (internal.size < 2) warn(`站內連結只有 ${internal.size} 個，建議至少 2 個`);
  for (const href of internal) {
    const m = href.match(/^\/articles\/([^/]+)\/?$/);
    if (m && !readdirSync(DIR).some((f) => f.startsWith(m[1] + '.'))) err(`站內連結指向不存在的文章：${href}`);
  }
  const inbound = readdirSync(DIR).filter((f) => !f.startsWith(slug + '.'))
    .filter((f) => readFileSync(join(DIR, f), 'utf8').includes(`/articles/${slug}/`));
  if (!inbound.length) warn('沒有其他文章連到這篇，記得從相關舊文加一個連結進來');

  // 開頭（第一個 H2 之前）不放資料來源、查證、條號說明這類文字，放到文末「資料來源」（站主 2026-11-15 定）
  const intro = prose.split(/^## /m)[0].replace(/^import .*$/gm, '');
  const meta = intro.match(/[^\n。]*(查證）|條號|規則書|依 .{0,40}整理|整理自|下文統稱)[^\n。]*/);
  if (meta) err(`開頭有資料來源或查證說明，移到文末「資料來源」：「${meta[0].trim().slice(0, 40)}」`);

  // 內文不放規則條號、查證日期、來源括號（站主 2026-11-15）。文末「資料來源」「這篇怎麼整理的」段除外。
  const bodyOnly = prose.split(/^## (?:資料來源|這篇怎麼整理的)\s*$/m)[0];
  for (const m of bodyOnly.matchAll(/（[^（）]*(?:\d+\.[A-Z]|規則第\s*\d+\s*節|查證|官方部落格)[^（）]*）/g)) err(`內文有條號或查證括號，移到文末「資料來源」：「${m[0].slice(0, 30)}」`);

  // 已知的坑
  for (const m of prose.matchAll(/^.*[）」』】。，、：；！？]\*\*(?=[^\s*\p{P}]).*$/gmu)) {
    // 只抓結尾的 **：同一行前面要有開頭的 **
    const before = m[0].slice(0, m[0].search(/[）」』】。，、：；！？]\*\*(?=[^\s*\p{P}])/u) + 1);
    if ((before.match(/\*\*/g) ?? []).length % 2 === 1) err(`粗體結尾的 ** 前面是全形標點，會顯示成字面星號：「${m[0].trim().slice(0, 40)}」`);
  }
  if (/（影片\s*\d{1,2}:\d{2}）|\(\d{1,2}:\d{2}\)/.test(prose)) err('內文還有影片時間點，改用 VideoRef 卡');
  for (const line of prose.split('\n')) {
    if (/\d\s*(?:ft|英尺|呎)/.test(line) && !/公分|公尺/.test(line)) warn(`英制單位沒附公制換算：「${line.trim().slice(0, 30)}…」`);
  }

  console.log(`${out.length ? '' : '✓ '}${slug}`);
  out.forEach((l) => console.log(l));
}
process.exit(hard ? 1 : 0);
