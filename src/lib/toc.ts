import type { MarkdownHeading } from 'astro';

/** 文章目錄只列正文的 H2；附錄段落不列。段落軌（寬螢幕）與手機目錄共用。 */
const SKIP = new Set(['延伸閱讀', '參考影片', '資料來源', '這篇怎麼整理的']);
const NUM: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

export interface TocItem { id: string; title: string; step?: number }

export function tocItems(headings: MarkdownHeading[]): TocItem[] {
  return headings
    .filter((h) => h.depth === 2 && !SKIP.has(h.text))
    .map((h) => {
      const m = h.text.match(/^第([一二三四五六七八九])步[：:]\s*(.+)$/);
      return { id: h.slug, title: m ? m[2] : h.text.split('：')[0], step: m ? NUM[m[1]] : undefined };
    });
}
