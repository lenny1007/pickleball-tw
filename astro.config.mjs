import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';

// 知識卡預設不進 sitemap，只有 index: true 的卡才進。
// 教訓來自 badminton-tw：卡片頁全開時 sitemap 88% 是卡，77% 零曝光，還拖累重要頁被收錄。
let hiddenCards = new Set();
try {
  const cards = JSON.parse(readFileSync('./src/content/knowledge/cards.json', 'utf-8'));
  hiddenCards = new Set(cards.filter((c) => !c.index).map((c) => `/knowledge/${c.id}/`));
} catch {}

export default defineConfig({
  site: 'https://pickleball-tw.com',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !hiddenCards.has(new URL(page).pathname),
    }),
  ],
});
