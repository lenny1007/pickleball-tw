import type { APIRoute } from 'astro';

// Google Search Console 與多數工具預設找 /sitemap.xml，
// 但 @astrojs/sitemap 只產出 /sitemap-index.xml。這裡提供同內容的別名，
// 實際網址清單（與「知識卡預設不進 sitemap」的過濾）仍由 @astrojs/sitemap 產生在 sitemap-0.xml。
export const GET: APIRoute = ({ site }) => {
  const loc = new URL('/sitemap-0.xml', site).href;
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    `<sitemap><loc>${loc}</loc></sitemap>` +
    '</sitemapindex>';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
