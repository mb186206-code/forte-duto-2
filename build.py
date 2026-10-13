#!/usr/bin/env python3
"""Build de produção do site Forte Duto.

Uso:  python3 build.py            -> gera dist/ (site para hospedar)
      python3 build.py --preview  -> também gera preview/ (versão para Artifact do Claude)

Lê site.config.json. Sem site_url, não gera canonical, og:url, og:image, twitter:image nem sitemap.xml.
"""
import json, re, shutil, sys, base64
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).parent
SRC, DIST = ROOT / 'src', ROOT / 'dist'
cfg = json.loads((ROOT / 'site.config.json').read_text(encoding='utf-8'))
site = cfg['site_url'].rstrip('/')


def min_css(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'\s*([{};:,>])\s*', r'\1', css)
    return css.replace(';}', '}').strip()


def min_js(js):
    js = re.sub(r'/\*.*?\*/', '', js, flags=re.S)
    return '\n'.join(l.strip() for l in js.splitlines() if l.strip())


def wa(msg):
    return f"https://wa.me/{cfg['whatsapp_number']}?text={quote(msg, safe='')}"


def json_ld():
    biz = {
        '@context': 'https://schema.org',
        '@type': 'Plumber',
        'name': cfg['name'],
        'description': 'Desentupimento e hidráulica: desentupimento de pias, ralos, vasos, tubulações e redes de esgoto, limpeza de caixa de gordura e reparos hidráulicos.',
        'telephone': cfg['phone_e164'],
        'knowsAbout': ['Desentupimento', 'Hidráulica', 'Limpeza de caixa de gordura', 'Reparos hidráulicos'],
    }
    if site:
        biz.update({'@id': site + '/#empresa', 'url': site + '/', 'logo': site + '/icon-512.png', 'image': site + '/og-image.webp'})
    if cfg.get('email'): biz['email'] = cfg['email']
    if cfg.get('address'): biz['address'] = cfg['address']
    if cfg.get('area_served'): biz['areaServed'] = cfg['area_served']
    if cfg.get('opening_hours'): biz['openingHoursSpecification'] = cfg['opening_hours']
    if cfg.get('same_as'): biz['sameAs'] = cfg['same_as']
    return '<script type="application/ld+json">' + json.dumps(biz, ensure_ascii=False, separators=(',', ':')) + '</script>'


def render(html, css, js=''):
    html = re.sub(r'\{\{wa:(.*?)\}\}', lambda m: wa(m.group(1)), html)
    if site:
        html = html.replace('<!--IF_SITE_URL-->', '').replace('<!--/IF_SITE_URL-->', '')
    else:
        html = re.sub(r'<!--IF_SITE_URL-->.*?<!--/IF_SITE_URL-->\n?', '', html, flags=re.S)
    rep = {
        '{{SITE_URL}}': site, '{{PHONE_E164}}': cfg['phone_e164'], '{{PHONE_DISPLAY}}': cfg['phone_display'],
        '{{WHATSAPP_NUMBER}}': cfg['whatsapp_number'], '{{FORM_ENDPOINT}}': cfg.get('form_endpoint', ''),
        '<!--INLINE_CSS-->': f'<style>{css}</style>', '<!--JSON_LD-->': json_ld(),
        '<!--INLINE_JS-->': f'<script>{js}</script>' if js else '',
    }
    for k, v in rep.items():
        html = html.replace(k, v)
    # remove comentários HTML de desenvolvimento (mantém o conteúdo de <template>)
    html = re.sub(r'<!--(?!\[).*?-->\s*', '', html, flags=re.S)
    html = re.sub(r'\n\s*\n', '\n', html)
    assert '{{' not in html, re.findall(r'\{\{.*?\}\}', html)
    return html


def main():
    if DIST.exists(): shutil.rmtree(DIST)
    DIST.mkdir()
    css = min_css((SRC / 'css/site.css').read_text(encoding='utf-8'))
    js = min_js((SRC / 'js/site.js').read_text(encoding='utf-8'))
    (DIST / 'index.html').write_text(render((SRC / 'index.html').read_text(encoding='utf-8'), css, js), encoding='utf-8')
    (DIST / 'privacidade.html').write_text(render((SRC / 'privacidade.html').read_text(encoding='utf-8'), css), encoding='utf-8')

    shutil.copytree(SRC / 'fonts', DIST / 'fonts')
    (DIST / 'img').mkdir()
    for f in (SRC / 'img').glob('*.webp'): shutil.copy(f, DIST / 'img' / f.name)
    for name in ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'icon-512.png', 'og-image.webp', 'site.webmanifest']:
        if (SRC / name).exists(): shutil.copy(SRC / name, DIST / name)

    robots = 'User-agent: *\nAllow: /\n'
    if site:
        robots += f'\nSitemap: {site}/sitemap.xml\n'
        urls = ['/', '/privacidade.html']
        (DIST / 'sitemap.xml').write_text(
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + ''.join(f'  <url><loc>{site}{u}</loc></url>\n' for u in urls) + '</urlset>\n', encoding='utf-8')
    (DIST / 'robots.txt').write_text(robots, encoding='utf-8')
    print('dist/ gerado' + ('' if site else ' (sem site_url: canonical, OG absoluto e sitemap pendentes)'))

    if '--preview' in sys.argv:
        build_preview(css, js)


def build_preview(css, js):
    """Versão para Artifact: sem <head> próprio (o Artifact adiciona), fonte embutida e caminhos relativos."""
    out = ROOT / 'preview'
    if out.exists(): shutil.rmtree(out)
    (out / 'img').mkdir(parents=True)
    font = base64.b64encode((SRC / 'fonts/barlow-condensed-latin-700-normal.woff2').read_bytes()).decode()
    pcss = css.replace('url("/fonts/barlow-condensed-latin-700-normal.woff2")', f'url(data:font/woff2;base64,{font})')
    page = render((SRC / 'index.html').read_text(encoding='utf-8'), pcss, js)
    title = '<title>Site Forte Duto</title>'
    style = re.search(r'<style>.*?</style>', page, flags=re.S).group(0)
    ld = re.search(r'<script type="application/ld\+json">.*?</script>', page).group(0)
    body = re.search(r'<body>(.*)</body>', page, flags=re.S).group(1)
    body = body.replace('src="/img/', 'src="img/').replace(' /img/', ' img/').replace('srcset="/img/', 'srcset="img/')
    body = body.replace('href="/privacidade.html"', 'href="#privacidade-preview"')
    note = ('<div style="background:#FFD32A;color:#071A3D;padding:.6rem 16px;font:600 14px/1.4 system-ui,sans-serif;text-align:center">'
            'Pré-visualização do site Forte Duto. Os links de WhatsApp funcionam; a Política de privacidade está em privacidade.html no projeto.</div>')
    (out / 'index.html').write_text(f'{title}\n{style}\n{ld}\n{note}\n{body}', encoding='utf-8')
    for f in (SRC / 'img').glob('*.webp'): shutil.copy(f, out / 'img' / f.name)
    print('preview/ gerado')


if __name__ == '__main__':
    main()
