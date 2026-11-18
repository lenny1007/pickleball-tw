"""產生文章開頭情境圖（AI，示意用）。在站主電腦跑：需要環境變數 GOOGLE_API_KEY。

用法：python scripts/covers/generate_scenes.py [slug ...]
沒給 slug 就產 prompts.json 裡所有還沒有圖的。輸出 src/assets/covers/<slug>.webp（寬 1500）。
產完每張都要人工目檢：球拍不能有線或洞、不能有字、不能有人在揮拍。
"""
import base64, io, json, os, sys, urllib.request
from pathlib import Path
from PIL import Image

MODEL = os.environ.get('COVER_MODEL', 'gemini-3.1-flash-image-preview')
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src' / 'assets' / 'covers'


def generate(prompt: str) -> bytes:
    key = os.environ['GOOGLE_API_KEY']
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}'
    body = {
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '3:2'}},
    }
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.load(r)
    for part in data['candidates'][0]['content']['parts']:
        inline = part.get('inlineData') or part.get('inline_data')
        if inline:
            return base64.b64decode(inline['data'])
    raise RuntimeError('沒有回傳圖片：' + json.dumps(data)[:500])


def main():
    prompts = json.loads((Path(__file__).parent / 'prompts.json').read_text(encoding='utf-8'))
    suffix = prompts.pop('_suffix')
    slugs = sys.argv[1:] or [s for s in prompts if not (OUT / f'{s}.webp').exists()]
    OUT.mkdir(parents=True, exist_ok=True)
    for slug in slugs:
        img = Image.open(io.BytesIO(generate(f'{prompts[slug]} {suffix}'))).convert('RGB')
        if img.width > 1500:
            img = img.resize((1500, round(img.height * 1500 / img.width)), Image.LANCZOS)
        img.save(OUT / f'{slug}.webp', 'WEBP', quality=82)
        print('✓', slug, img.size)


if __name__ == '__main__':
    main()
