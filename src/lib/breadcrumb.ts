import { SITE_URL } from '../consts';

export interface Crumb { name: string; url: string }

/** 麵包屑的 BreadcrumbList JSON-LD。url 用站內路徑，這裡轉成完整網址。 */
export function breadcrumbLd(items: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: new URL(c.url, SITE_URL).href,
    })),
  };
}
