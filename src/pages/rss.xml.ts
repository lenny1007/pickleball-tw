import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { CATEGORIES, SITE_DESCRIPTION, SITE_NAME } from '../consts';

// 文章的 RSS。不用 @astrojs/rss，少一個套件；欄位只放標題、連結、日期、摘要、分類。
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site }) => {
  const articles = (await getCollection('articles', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  const home = new URL('/', site).href;
  const items = articles.map((a) => {
    const link = new URL(`/articles/${a.id}/`, site).href;
    const cat = CATEGORIES.find((c) => c.slug === a.data.category)?.name ?? '';
    return (
      '<item>' +
      `<title>${esc(a.data.title)}</title>` +
      `<link>${link}</link><guid isPermaLink="true">${link}</guid>` +
      `<pubDate>${a.data.pubDate.toUTCString()}</pubDate>` +
      `<description>${esc(a.data.description)}</description>` +
      (cat ? `<category>${esc(cat)}</category>` : '') +
      '</item>'
    );
  });
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>' +
    `<title>${esc(SITE_NAME)}</title><link>${home}</link>` +
    `<description>${esc(SITE_DESCRIPTION)}</description><language>zh-TW</language>` +
    `<atom:link href="${new URL('/rss.xml', site).href}" rel="self" type="application/rss+xml" />` +
    items.join('') +
    '</channel></rss>';
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
