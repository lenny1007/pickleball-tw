import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { CATEGORIES, ZONES } from './consts';

const categorySlugs = CATEGORIES.map((c) => c.slug) as [string, ...string[]];
const zoneKeys = Object.keys(ZONES) as [string, ...string[]];

// 長文：規則、球拍、入門、哪裡打。上線前要通過查證（見 AGENTS.md）。
const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    /** 開頭情境圖（AI 生成，只當情境、不示範動作）：src/assets/covers/<slug>.webp。沒有就用 ArticleCover 的 SVG。 */
    cover: image().optional(),
    cover_alt: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(categorySlugs),
    takeaways: z.array(z.string()).min(3).max(5).optional(),
    related_knowledge: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
  }),
});

// 知識卡：影片萃取的 5W 卡，欄位沿用 badminton-tw 的萃取格式，拿掉兒童與課程欄位。
const knowledge = defineCollection({
  loader: file('src/content/knowledge/cards.json'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    zone: z.enum(zoneKeys),
    type: z.enum(['drill', 'principle', 'problem', 'tactic', 'rule', 'equipment']).optional(),
    what: z.string(),
    why: z.string().nullable().optional(),
    how: z.array(z.string()).default([]),
    check: z.string().nullable().optional(),
    source_channel: z.string(),
    source_title: z.string(),
    source_video_id: z.string(),
    timestamp: z.string(), // "mm:ss"
    /**
     * 這張卡的說法是什麼性質（沿用 golfer-tw 的萃取欄位，舊卡沒有）：
     * physics 規則或物理共識，可當事實寫；coach_method 這位教練的做法，站上標「一種教法」；
     * screen_data 影片畫面上的數據；coach_example 教練的假設舉例，站上標「示範舉例」。
     */
    claim_basis: z.enum(['physics', 'coach_method', 'screen_data', 'coach_example']).nullable().optional(),
    /** 教練講這一點的英文原話，用來對字幕機檢（scripts/coach-system/check_quotes.py --cards）。 */
    source_quote: z.string().nullable().optional(),
    /** 進 sitemap 與否。預設不進，有搜尋需求再開。 */
    index: z.boolean().default(false),
  }),
});

export const collections = { articles, knowledge };
