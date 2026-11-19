#!/usr/bin/env node
// 文章宣稱自動檢查（test:claims）。移植自 golfer-tw（docs/CROSS-SITE-PLAYBOOK.md），改成本站規則：
// 來源一律放文末「資料來源」，內文不放來源括號、規則條號、查證日期（站主 2026-11-15、2026-11-19）。
//
// 抓「說法的語氣」，不核對事實本身：
//   superlative        「最常見／最重要／最容易」這類排序最高級，同一行沒有掛名
//   comparative        「比 X 更重要／更有效」比較句，同一行沒有掛名
//   absolute           「保證／絕對／百分之百／一定會」這類絕對說法
//   unsourced-percent  百分比或「九成」，同一行沒有掛名、也沒登記在選題卡來源表
//   unsourced-multiple 「快 5 倍」這類倍數，同一行沒有掛名、也沒登記在選題卡來源表
//   injury-guarantee   「不會受傷／根治」這類受傷保證
//   injury-no-doctor   全文提到受傷／疼痛，卻沒有任何就醫提醒（每篇最多 1 筆）
//   timeline-promise   「3 個月見效／兩週變強」這類成效時程
//   inline-citation    內文出現來源括號、查證日期、規則條號（這些只能放文末資料來源與選題卡）
//
// 「有掛名」＝同一行在文字裡寫出是誰說的：規則與協會（USA Pickleball、DUPR…）、品牌、
// 研究機構、本站引用的教練與頻道，或影片／知識卡元件。不認來源括號與網址，那些不該出現在內文。
// 數字的來源登記在 docs/briefs/<slug>.md 的「來源表」，由 test:sources 檢查。
// 「資料來源」「這篇怎麼整理的」「延伸閱讀」三段不檢查。
//
// 舊文寬限：config/article-claims-baseline.json 逐句列出允許的舊命中（規則＋句子指紋）。
// 新句子、改寫過但沒修的舊句子都不在清單內；清單只能變少（CI 的 claims-guard 會擋調高）。
//
// 用法：
//   node scripts/check-article-claims.mjs              檢查（有寬限清單以外的命中就 exit 1）
//   node scripts/check-article-claims.mjs --report     列出所有命中，標出寬限外的新命中
//   node scripts/check-article-claims.mjs --report --file=<slug>   只看一篇
//   node scripts/check-article-claims.mjs --baseline   只往下收緊寬限清單（修掉的句子移除）
//   node scripts/check-article-claims.mjs --baseline --allow-increase
//       重新產生整份清單，允許調高。只有站主同意時才可以用，CI 會要求標籤。
//   node scripts/check-article-claims.mjs --compare-baseline=<base.json>
//       CI 用：寬限清單比 base 分支多就 exit 1
//   --blog-dir=<dir> --baseline-file=<file> --briefs-dir=<dir>   測試用

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findBrief, sourceTableSection } from './check-article-sources.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const RULES = {
  superlative: '排序最高級（最常見／最重要…）沒有標來源',
  comparative: '比較句（比 X 更重要…）沒有標來源',
  absolute: '絕對說法（保證／絕對／百分之百／一定會）',
  'unsourced-percent': '百分比或「幾成」沒有標來源',
  'unsourced-multiple': '倍數沒有標來源',
  'injury-guarantee': '受傷保證（不會受傷／根治）',
  'injury-no-doctor': '全文提到受傷或疼痛，卻沒有就醫提醒',
  'timeline-promise': '成效時程（3 個月見效／兩週變強）',
  'inline-citation': '內文有來源括號、查證日期或規則條號（只能放文末資料來源）',
};

// 同一行出現這些就當作「有掛名」。只認寫在文字裡的歸屬：規則與協會、研究機構、品牌、
// 本站實際引用的教練與頻道、站內影片與知識卡元件。不認網址與來源括號（內文不放）。
const SOURCE_MARKERS = [
  /<VideoEmbed|<VideoRef|<KnowledgeCard|\/knowledge\//,
  // 規則、協會、分級
  /USA Pickleball|USAP\b|UPA-A|\bGPF\b|全球匹克球總會|\bIFP\b|國際匹克球聯合會|亞洲匹克球|匹克球總會|匹克球協會|\bDUPR\b|\bPPA\b|\bMLP\b|\bAPP\b|Pickleball Canada|規則書|規則寫|規則規定|競賽規程|簡章/,
  // 研究、醫學與調查單位
  /\bCDC\b|\bAAOS\b|美國骨科|\bJAMA\b|眼科醫學會|\bNEISS\b|\bSFIA\b|研究(?:者|整理|發現|指出|統計|提醒)|調查(?:發現|指出)|急診資料|Physical Activity Council/,
  // 品牌
  /JOOLA|Selkirk|Franklin|Onix|\bDura\b|\bHEAD\b|Head |Gearbox|Paddletek|Engage|CRBN|Six Zero|Vatic|Diadem|Babolat|Wilson|DECATHLON|迪卡儂|KUIKMA|ASICS|Skechers|K-Swiss|New Balance|adidas|Nike|Penn|Gamma|Core\b/,
  // 本站引用的教練／頻道
  /Better Pickleball|\bCJ\b|\bTony\b|\bSarah\b|Coach [A-Z][a-z]+|教練(?:說|認為|建議|提醒|表示|示範)/,
];

// 內文不該出現的引用寫法：來源括號、查證日期、規則條號、PMID、網址當文字
const INLINE_CITATION_RE = /(?:20\d{2}-\d{2}\s*查證)|查證）|查證\)|[（(]\s*來源|來源[:：]|出處[:：]|PMID|規則\s*\d+\.[0-9A-Za-z]|(?:Rule|rule)\s*\d+\.[0-9A-Za-z]|第\s*\d+\.\d+\s*條/g;

// 這幾段本來就是放來源與連結的地方，不檢查
const SKIP_SECTION_RE = /^##\s*(?:資料來源|這篇怎麼整理的|延伸閱讀)/;

const LINE_RULES = [
  {
    id: 'superlative',
    re: /最(?:常見|常犯|常|容易|普遍|重要|關鍵|有效|主要|根本|致命|嚴重|適合|推薦|佳(?!化|成績|\s*\d)|穩定|快)/g,
    needsSource: true,
  },
  {
    id: 'comparative',
    re: /比[^，。；\n]{1,15}?更(?:重要|關鍵|有效|容易|適合|好用|準)/g,
    needsSource: true,
  },
  {
    id: 'absolute',
    re: /保證(?!金)|絕對(?!值|的)|百分之百|一定會|必定|肯定會|永遠不會/g,
    needsSource: false,
    skipNegated: true,
  },
  {
    id: 'unsourced-percent',
    numeric: true,
    // 「用七成力揮」「80% 力道」是用力程度的教學說法，不是統計，排除
    re: /\d+(?:\.\d+)?\s*[%％](?!\s*(?:的)?\s*(?:力|揮|速度))|[一二三四五六七八九]成(?!不變|功|熟|立|為|員|長|績|本|果|形|就|力|的力)/g,
    needsSource: true,
  },
  {
    id: 'unsourced-multiple',
    numeric: true,
    re: /\d+(?:\.\d+)?\s*倍|(?<![一-龥])[兩二三四五六七八九十]倍/g,
    needsSource: true,
  },
  {
    id: 'injury-guarantee',
    re: /不會受傷|零受傷|杜絕(?:運動)?傷害|根治|完全避免(?:受傷|傷害)/g,
    needsSource: false,
    skipNegated: true,
  },
  {
    id: 'timeline-promise',
    re: /(?:\d+|[一二兩三四五六七八九十幾])\s*(?:天|週|周|星期|個月|堂課)(?:內|之內|後|就)?[^。，\n]{0,6}?(?:見效|看到效果|看到成效|變強|升級|上\s*\d(?:\.\d)?\s*分?|突破\s*\d(?:\.\d)?|保證)/g,
    needsSource: false,
    skipNegated: true,
  },
];

const INJURY_RE = /受傷|運動傷害|疼痛|痠痛|酸痛|下背痛|網球肘|匹克球肘|高爾夫球肘|肌腱炎|阿基里斯腱|椎間盤|扭傷|拉傷|發炎|骨折/;
const DOCTOR_RE = /就醫|醫師|醫生|物理治療|復健科|骨科|看診|專業醫療/;

// frontmatter 裡只看會被讀者讀到的欄位
const FRONTMATTER_SKIP = /^\s*(?:cover\w*|pubDate|updatedDate|category|kind|tags|draft|slug|order|image\w*|related\w*|sources?)\s*:/;

function stripForMatch(line) {
  return line
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 圖片
    .replace(/\]\([^)]*\)/g, ']') // 連結網址（保留連結文字）
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/(?:topic|slug|id|href|src|cards?)=["'{][^"'}]*["'}]/g, ' ')
    .replace(/href:\s*["'][^"']*["']/g, ' ');
}

// 命中所在的句子（句號、問號、驚嘆號之間），用來產生指紋
export function sentenceAt(line, index) {
  const BREAK = /[。！？!?]/;
  let start = index;
  while (start > 0 && !BREAK.test(line[start - 1])) start--;
  let end = index;
  while (end < line.length && !BREAK.test(line[end])) end++;
  return line.slice(start, end + 1).replace(/\s+/g, ' ').trim();
}

// 指紋＝規則＋句子文字。句子只要改過一個字，指紋就變，舊文寬限就不再適用（碰到就修）
export function fingerprint(rule, sentence) {
  return createHash('sha1').update(`${rule}\n${sentence}`).digest('hex').slice(0, 12);
}

const NEGATION_RE = /不|沒|無|非|別|未|難|嗎|？|\?/;
const CLAUSE_BREAK = /[。，；！!、：:]/;

// 同一個子句（逗號、句號之間）有否定詞或是問句，就當作是在否定或質疑這個說法
export function isNegated(line, index, length = 0) {
  let start = index;
  while (start > 0 && !CLAUSE_BREAK.test(line[start - 1])) start--;
  let end = index + length;
  while (end < line.length && !CLAUSE_BREAK.test(line[end])) end++;
  // 比對字串本身不算（「不會受傷」自己就帶「不」）
  const clause = line.slice(start, index) + line.slice(index + length, end + 1);
  return NEGATION_RE.test(clause);
}

// 跟 check-article-sources.mjs 同一套正規化
export function normalizeNumber(s) {
  return s.replace(/\s+/g, '').replace(/(\d),(?=\d{3})/g, '$1').replace(/[–~～至到]/g, '-').replace(/％/g, '%');
}

export function hasSource(line) {
  return SOURCE_MARKERS.some((re) => re.test(line));
}

// opts.registered：選題卡來源表正規化後的字串；百分比、倍數原樣登記在表裡就算有來源
export function scanText(text, opts = {}) {
  const registered = opts.registered ?? '';
  const hits = [];
  const lines = text.split(/\r?\n/);
  let inFrontmatter = lines[0]?.trim() === '---';
  let inFence = false;
  let mentionsInjury = null;
  let mentionsDoctor = false;
  let inSkipSection = false;

  lines.forEach((raw, idx) => {
    const lineNo = idx + 1;
    if (idx === 0 && inFrontmatter) return;
    if (inFrontmatter) {
      if (raw.trim() === '---') {
        inFrontmatter = false;
        return;
      }
      if (FRONTMATTER_SKIP.test(raw)) return;
    } else {
      if (/^\s*```/.test(raw)) {
        inFence = !inFence;
        return;
      }
      if (inFence) return;
      if (/^\s*(?:import|export)\s/.test(raw)) return;
      if (/^##\s/.test(raw)) inSkipSection = SKIP_SECTION_RE.test(raw);
      if (inSkipSection) return;
    }
    const line = stripForMatch(raw);
    if (!line.trim()) return;

    if (DOCTOR_RE.test(raw)) mentionsDoctor = true;
    if (mentionsInjury === null && INJURY_RE.test(line)) mentionsInjury = lineNo;

    const sourced = hasSource(raw);
    for (const m of raw.matchAll(INLINE_CITATION_RE)) {
      const sentence = sentenceAt(raw, m.index);
      hits.push({ rule: 'inline-citation', line: lineNo, match: m[0], text: raw.trim().slice(0, 160), sentence, fp: fingerprint('inline-citation', sentence) });
    }
    for (const rule of LINE_RULES) {
      if (rule.needsSource && sourced) continue;
      rule.re.lastIndex = 0;
      for (const m of line.matchAll(rule.re)) {
        if (rule.numeric && registered && /\d/.test(m[0]) && registered.includes(normalizeNumber(m[0]))) continue;
        // 「不一定會」「不能根治」「不是三個月保證」這類否定句是好的寫法，不算
        if (rule.skipNegated && isNegated(line, m.index, m[0].length)) continue;
        const sentence = sentenceAt(line, m.index);
        hits.push({ rule: rule.id, line: lineNo, match: m[0], text: raw.trim().slice(0, 160), sentence, fp: fingerprint(rule.id, sentence) });
      }
    }
  });

  if (mentionsInjury !== null && !mentionsDoctor) {
    hits.push({
      rule: 'injury-no-doctor',
      line: mentionsInjury,
      match: '（全文無就醫提醒）',
      text: lines[mentionsInjury - 1].trim().slice(0, 160),
      sentence: '（全文）',
      // 全文層級的規則：補上就醫提醒就會消失，不綁特定句子
      fp: fingerprint('injury-no-doctor', '（全文）'),
    });
  }
  return hits;
}

export function listArticles(blogDir) {
  return readdirSync(blogDir)
    .filter((f) => /\.mdx?$/.test(f))
    .sort()
    .map((f) => ({ slug: f.replace(/\.mdx?$/, ''), path: join(blogDir, f) }));
}

export function countByRule(hits) {
  const counts = {};
  for (const h of hits) counts[h.rule] = (counts[h.rule] ?? 0) + 1;
  return counts;
}

export function scanAll(blogDir, briefsDir) {
  const result = {};
  for (const { slug, path } of listArticles(blogDir)) {
    const brief = briefsDir ? findBrief(briefsDir, slug) : null;
    const registered = brief ? normalizeNumber(sourceTableSection(readFileSync(brief, 'utf8'))) : '';
    result[slug] = scanText(readFileSync(path, 'utf8'), { registered });
  }
  return result;
}

// 同一句同一條規則可能命中多次（例：一句兩個「最常見」），用 n 記次數
function groupByFingerprint(hits) {
  const groups = {};
  for (const h of hits) {
    const key = `${h.rule}:${h.fp}`;
    groups[key] ??= { rule: h.rule, n: 0, text: h.sentence.slice(0, 80), hits: [] };
    groups[key].n += 1;
    groups[key].hits.push(h);
  }
  return groups;
}

// 回傳不在寬限清單裡的命中：{slug, rule, allowed, actual, hits}
// 寬限是逐句的：新句子一律不在清單裡；舊句子改寫後指紋會變，也不在清單裡
export function compareToBaseline(scan, baseline) {
  const over = [];
  for (const [slug, hits] of Object.entries(scan)) {
    const allowedForFile = baseline.files?.[slug] ?? {};
    for (const [key, g] of Object.entries(groupByFingerprint(hits))) {
      const allowed = allowedForFile[key]?.n ?? 0;
      if (g.n > allowed) over.push({ slug, rule: g.rule, key, allowed, actual: g.n, hits: g.hits });
    }
  }
  return over;
}

export function buildBaseline(scan, previous = null, { allowIncrease = false } = {}) {
  const files = {};
  for (const [slug, hits] of Object.entries(scan)) {
    const prev = previous?.files?.[slug] ?? {};
    const out = {};
    for (const [key, g] of Object.entries(groupByFingerprint(hits))) {
      // 只收緊：取「現況」與「舊寬限」較小的值；不在舊清單的句子不給寬限
      const n = allowIncrease || !previous ? g.n : Math.min(g.n, prev[key]?.n ?? 0);
      if (n > 0) out[key] = { rule: g.rule, n, text: g.text };
    }
    if (Object.keys(out).length) files[slug] = Object.fromEntries(Object.entries(out).sort());
  }
  const totals = {};
  for (const entries of Object.values(files)) {
    for (const e of Object.values(entries)) totals[e.rule] = (totals[e.rule] ?? 0) + e.n;
  }
  return {
    _comment:
      '舊文寬限：逐句列出允許的舊命中（鍵＝規則:句子指紋），只能變少。新句子、改寫過的舊句子都不在清單內。' +
      '不得為了讓檢查通過而調高；調高需站主同意，CI 會擋（claims-guard，需站主加 claims-baseline-ok 標籤）。見 docs/ARTICLE_WORKFLOW.md「自動檢查」。',
    generated: new Date().toISOString().slice(0, 10),
    totals: Object.fromEntries(Object.entries(totals).sort()),
    files: Object.fromEntries(Object.entries(files).sort()),
  };
}

// 比較兩份寬限清單：回傳 next 比 base 多出來的寬限（新的句子或次數變高）
export function baselineIncreases(base, next) {
  const out = [];
  for (const [slug, entries] of Object.entries(next.files ?? {})) {
    for (const [key, e] of Object.entries(entries)) {
      const before = base.files?.[slug]?.[key]?.n ?? 0;
      if (e.n > before) out.push({ slug, key, rule: e.rule, before, after: e.n, text: e.text });
    }
  }
  return out;
}

function parseArgs(argv) {
  const args = { mode: 'check', blogDir: join(ROOT, 'src/content/articles'), briefsDir: join(ROOT, 'docs/briefs'), baselineFile: join(ROOT, 'config/article-claims-baseline.json') };
  for (const a of argv) {
    if (a === '--report') args.mode = 'report';
    else if (a === '--baseline') args.mode = 'baseline';
    else if (a === '--allow-increase') args.allowIncrease = true;
    else if (a.startsWith('--compare-baseline=')) {
      args.mode = 'compare';
      args.baseBaseline = resolve(a.slice(19));
    } else if (a.startsWith('--file=')) args.file = a.slice(7).replace(/\.mdx?$/, '');
    else if (a.startsWith('--blog-dir=')) args.blogDir = resolve(a.slice(11));
    else if (a.startsWith('--baseline-file=')) args.baselineFile = resolve(a.slice(16));
    else if (a.startsWith('--briefs-dir=')) args.briefsDir = resolve(a.slice(13));
  }
  return args;
}

function loadBaseline(file) {
  if (!existsSync(file)) return { files: {} };
  return JSON.parse(readFileSync(file, 'utf8'));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseline = loadBaseline(args.baselineFile);

  if (args.mode === 'compare') {
    // CI 用：這個 PR 的寬限清單有沒有比 base 分支多
    if (!existsSync(args.baseBaseline)) {
      console.log('base 分支還沒有寬限清單，略過比對。');
      return;
    }
    const inc = baselineIncreases(loadBaseline(args.baseBaseline), baseline);
    if (!inc.length) {
      console.log('寬限清單沒有變多。');
      return;
    }
    console.error(`寬限清單比 base 多了 ${inc.length} 項（調高寬限需站主同意，由站主在 PR 加上 claims-baseline-ok 標籤）：`);
    for (const i of inc) console.error(`  ${i.slug} [${i.rule}] ${i.before}→${i.after} 「${i.text}」`);
    process.exitCode = 1;
    return;
  }

  let scan = scanAll(args.blogDir, args.briefsDir);

  if (args.mode === 'baseline') {
    const hadBaseline = existsSync(args.baselineFile);
    const next = buildBaseline(scan, hadBaseline ? baseline : null, { allowIncrease: args.allowIncrease });
    writeFileSync(args.baselineFile, JSON.stringify(next, null, 2) + '\n');
    const total = Object.values(next.totals).reduce((a, b) => a + b, 0);
    console.log(`寬限清單已寫入 ${basename(args.baselineFile)}：${Object.keys(next.files).length} 篇、${total} 筆`);
    console.log(next.totals);
    const stillOver = compareToBaseline(scan, next);
    if (stillOver.length) {
      console.log(`\n仍有 ${stillOver.length} 句不在寬限清單（只收緊模式不會替新句子開寬限），要改寫：`);
      for (const o of stillOver) console.log(`  ${o.slug} L${o.hits[0].line} [${o.rule}] 「${o.hits[0].match}」`);
      process.exitCode = 1;
    }
    return;
  }

  if (args.file) scan = { [args.file]: scan[args.file] ?? [] };

  if (args.mode === 'report') {
    const totals = {};
    let newCount = 0;
    for (const [slug, hits] of Object.entries(scan)) {
      if (!hits.length) continue;
      const overKeys = new Set(compareToBaseline({ [slug]: hits }, baseline).map((o) => o.key));
      console.log(`\n## ${slug}（${hits.length} 筆）`);
      for (const h of hits) {
        totals[h.rule] = (totals[h.rule] ?? 0) + 1;
        const isNew = overKeys.has(`${h.rule}:${h.fp}`);
        if (isNew) newCount += 1;
        console.log(`  ${isNew ? '✗ 新' : '  舊'} L${h.line} [${h.rule}] 「${h.match}」 ${h.text}`);
      }
    }
    console.log('\n合計：', totals);
    console.log(`其中不在寬限清單（要改）：${newCount} 筆`);
    return;
  }

  const over = compareToBaseline(scan, baseline);
  if (!over.length) {
    console.log(`test:claims 通過：${Object.keys(scan).length} 篇，沒有寬限清單以外的命中。`);
    return;
  }
  const n = over.reduce((a, o) => a + o.actual - o.allowed, 0);
  console.error(`test:claims 失敗：${n} 筆命中不在寬限清單（新寫的句子，或改寫過但沒修掉的舊句子）。\n`);
  for (const o of over) {
    for (const h of o.hits) console.error(`${o.slug}  L${h.line} [${o.rule}] ${RULES[o.rule]}：「${h.match}」 ${h.text}`);
  }
  console.error(
    '\n修法：改寫成有條件的說法、在句子裡寫出是誰說的（USA Pickleball、DUPR、教練名…），數字登記到選題卡來源表，或刪掉。' +
      '\n不要在內文加來源括號或查證日期（只放文末資料來源）。舊句子只要動到，就要順便修好。不要用調高寬限過關；見 docs/ARTICLE_WORKFLOW.md。',
  );
  process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
