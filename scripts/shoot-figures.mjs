#!/usr/bin/env node
// 版面檢查：把文章的封面和每張圖解截下來（桌機、手機、手機深色），順便抓兩種常見問題：
//   1. 手機有橫向捲動
//   2. 圖上的字在手機上縮到太小（實際顯示小於 11px）
// 用法：npm run build && npm run shoot -- pickleball-scoring non-volley-zone
// 截圖放在 .tmp/shots/<slug>/，看完就可以刪。需要 Playwright（雲端 session 已內建）。
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  console.error('找不到 Playwright。雲端 session 內建；本機要先 npm i -D playwright 並 npx playwright install chromium。');
  process.exit(1);
}

const slugs = process.argv.slice(2);
if (!slugs.length) { console.error('用法：npm run shoot -- <slug> [slug…]'); process.exit(1); }

const PORT = 4399;
const MIN_PX = 11;
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: 'ignore' });
const base = `http://localhost:${PORT}`;

async function waitUp() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview 沒有起來，先跑 npm run build');
}

let problems = 0;
try {
  await waitUp();
  const browser = await chromium.launch();
  for (const slug of slugs) {
    const dir = `.tmp/shots/${slug}`;
    mkdirSync(dir, { recursive: true });
    for (const [w, name, dark] of [[1280, 'desk', false], [390, 'mob', false], [390, 'mobdark', true]]) {
      const page = await browser.newPage({ viewport: { width: w, height: 900 }, colorScheme: dark ? 'dark' : 'light' });
      const res = await page.goto(`${base}/articles/${slug}/`);
      if (!res?.ok()) { console.log(`✗ ${slug}：頁面打不開（${res?.status()}）`); problems++; break; }
      const figs = await page.$$('figure.fig, svg.cover');
      for (let i = 0; i < figs.length; i++) await figs[i].screenshot({ path: `${dir}/${name}-${i}.png` });

      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      if (sw > w) { console.log(`✗ ${slug} ${name}：橫向捲動（頁寬 ${sw}px）`); problems++; }

      if (name === 'mob') {
        const small = await page.evaluate((min) => {
          const out = [];
          document.querySelectorAll('figure.fig svg, svg.cover').forEach((svg, i) => {
            const vb = svg.viewBox?.baseVal;
            if (!vb?.width) return;
            const scale = svg.getBoundingClientRect().width / vb.width;
            svg.querySelectorAll('text').forEach((t) => {
              const px = parseFloat(getComputedStyle(t).fontSize) * scale;
              if (px < min && t.textContent.trim()) out.push(`圖 ${i}「${t.textContent.trim().slice(0, 12)}」${px.toFixed(1)}px`);
            });
          });
          return out;
        }, MIN_PX);
        for (const s of small) { console.log(`△ ${slug} 手機字太小：${s}`); problems++; }
      }
      await page.close();
    }
    console.log(`${slug}：截圖在 ${dir}/`);
  }
  await browser.close();
} finally {
  server.kill();
}
console.log(problems ? `\n共 ${problems} 個問題，看截圖確認。` : '\n沒有發現橫向捲動或太小的字，再用眼睛看一次截圖。');
