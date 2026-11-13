import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { CATEGORIES, ZONES } from './consts';

const categorySlugs = CATEGORIES.map((c) => c.slug) as [string, ...string[]];
const zoneKeys = Object.keys(ZONES) as [string, ...string[]];

// 長文：規則、球拍、入門、哪裡打。上線前要通過查證（見 AGENTS.md）。
const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
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
    /** 進 sitemap 與否。預設不進，有搜尋需求再開。 */
    index: z.boolean().default(false),
  }),
});

export const collections = { articles, knowledge };
