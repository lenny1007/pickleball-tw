export const SITE_NAME = '匹克球 TW';
export const SITE_URL = 'https://pickleball-tw.com';
export const SITE_DESCRIPTION =
  '匹克球規則、球拍怎麼挑、網前小球怎麼打。把國內外教學影片整理成繁體中文知識卡，每張都附原片時間點。';

/** 文章分類。順序就是導覽列順序，依台灣搜尋需求排（規則、球拍最多人找）。 */
export const CATEGORIES = [
  { slug: 'rules', name: '規則', intro: '發球、計分、非截擊區、場地尺寸，對照 USA Pickleball 官方規則整理。' },
  { slug: 'paddles', name: '球拍與裝備', intro: '球拍怎麼挑、握把、球、鞋，規格與核可清單都對照過廠商和官方資料。' },
  { slug: 'beginner', name: '入門', intro: '匹克球是什麼、第一次去打要準備什麼、怎麼打一分、新手常犯的錯。' },
  { slug: 'where-to-play', name: '哪裡打', intro: '台灣各地可以打匹克球的地方，以及怎麼找到臨打。' },
  { slug: 'technique', name: '技術', intro: '發球、接發、第三拍、dink、截擊、正反手，整理自國內外教練的教學影片。' },
] as const;

/** 球場分區：首頁球場圖與知識卡共用。 */
export const ZONES = {
  kitchen: { name: '非截擊區', note: '非截擊區（廚房區）規則、dink 小球、網前對抽、腳踩線算不算違規。' },
  backcourt: { name: '後場', note: '第三拍、雙打站位、什麼時候往前、怎麼守底線。' },
  serve: { name: '發球與計分', note: '低手發球、落地發球、報分三個數字、換發規則。' },
  gear: { name: '裝備', note: '球拍、球、鞋。' },
} as const;
export type ZoneKey = keyof typeof ZONES;

/** 知識卡 claim_basis 要在站上標出來的兩種；physics、screen_data 不標。 */
export const CLAIM_LABELS: Record<string, { text: string; hint: string }> = {
  coach_method: { text: '一種教法', hint: '這是這位教練的做法或偏好，不是唯一標準' },
  coach_example: { text: '示範舉例', hint: '教練舉的假設例子，不是實測數據' },
};
