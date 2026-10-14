"""Gabarit PDF commun aux documents Photographe Professionnel de France.

Charte graphique : marine #29336e, rouge #d43b43, Montserrat.
En-tête : grand logo PPF, titre avec équerre rouge, sous-titre, pastille de version.
Pied de chaque page : logos FFPMI et MDI, mention de la gestion, pagination.
"""
import base64, pathlib
from playwright.sync_api import sync_playwright

RACINE = pathlib.Path(__file__).resolve().parent.parent
MARINE, ROUGE, ENCRE, DISCRET, SURFACE, TRAIT = '#29336e', '#d43b43', '#1b2140', '#5d6878', '#f4f5f9', '#dde1ea'


def b64(chemin: pathlib.Path, mime: str) -> str:
    return f'data:{mime};base64,' + base64.b64encode(chemin.read_bytes()).decode()


POLICES = ''.join(
    f"@font-face{{font-family:'Montserrat';font-style:{st};font-weight:{w};src:url({b64(RACINE / 'scripts/fonts' / f'montserrat-latin-{w}-{st}.woff2', 'font/woff2')}) format('woff2');}}"
    for w, st in [(400, 'normal'), (400, 'italic'), (600, 'normal'), (700, 'normal'), (800, 'normal')]
)
LOGO_PPF = b64(RACINE / 'public/logo-ppf.png', 'image/png')
LOGO_FFPMI = b64(RACINE / 'public/logo-ffpmi.png', 'image/png')
LOGO_MDI = b64(RACINE / 'public/logo-mdi.png', 'image/png')

CSS_BASE = f'''
{POLICES}
@page {{ size: A4; margin: 18mm 20mm 30mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: 'Montserrat', sans-serif; color: {ENCRE}; font-size: 9.6pt; line-height: 1.55; margin: 0; }}
.couverture {{ text-align: center; padding: 4mm 0 8mm; border-bottom: 2px solid {MARINE}; margin-bottom: 8mm; }}
.couverture img {{ width: 92mm; }}
.couverture h1 {{ font-size: 21pt; font-weight: 800; color: {MARINE}; margin: 9mm 0 2mm; display: inline-block; position: relative; padding-right: 7mm; }}
.couverture h1::after {{ content: ''; position: absolute; right: 0; bottom: 1.5mm; width: 5mm; height: 4mm; border-right: 2px solid {ROUGE}; border-bottom: 2px solid {ROUGE}; }}
.couverture .sous {{ color: {DISCRET}; font-size: 10pt; margin: 0 auto; max-width: 140mm; text-align: center; }}
.couverture .version {{ display: inline-block; margin-top: 4mm; background: {MARINE}; color: #fff; font-weight: 600; font-size: 8pt; letter-spacing: .06em; text-transform: uppercase; padding: 1.2mm 3mm; border-radius: 1mm; }}
h2 {{ font-size: 13pt; font-weight: 800; color: {MARINE}; margin: 7mm 0 2.5mm; padding-bottom: 1.5mm; border-bottom: 1px solid {TRAIT}; break-after: avoid; }}
h2::before {{ content: ''; display: inline-block; width: 2.5mm; height: 2.5mm; background: {ROUGE}; margin-right: 2.5mm; vertical-align: .5mm; }}
h3 {{ font-size: 10.2pt; font-weight: 700; color: {MARINE}; margin: 4.5mm 0 1.2mm; break-after: avoid; }}
p {{ margin: 0 0 2mm; text-align: justify; hyphens: auto; }}
ul, ol {{ margin: 0 0 2mm; padding-left: 6mm; }}
li {{ margin-bottom: 1mm; }}
ul li::marker {{ color: {ROUGE}; }}
ol li::marker {{ color: {MARINE}; font-weight: 700; }}
table {{ width: 100%; border-collapse: collapse; font-size: 8.4pt; margin: 2mm 0 4mm; }}
th {{ background: {MARINE}; color: #fff; text-align: left; font-weight: 600; padding: 2mm 2.5mm; }}
td {{ padding: 1.8mm 2.5mm; border-bottom: 1px solid {TRAIT}; vertical-align: top; }}
tr:nth-child(even) td {{ background: {SURFACE}; }}
tr {{ break-inside: avoid; }}
'''


def pied() -> str:
    return f'''<div style="width:100%;margin:0 20mm;font-family:Helvetica,Arial,sans-serif;font-size:7pt;color:{DISCRET};
  border-top:1px solid {TRAIT};padding-top:2.5mm;display:flex;align-items:center;justify-content:space-between;gap:6mm;-webkit-print-color-adjust:exact;">
  <div style="display:flex;align-items:center;gap:4mm;">
    <img src="{LOGO_FFPMI}" style="height:7mm;">
    <img src="{LOGO_MDI}" style="height:9mm;">
  </div>
  <div style="flex:1;line-height:1.4;">Une charte de la Fédération Française de la Photographie et des Métiers de l'Image (FFPMI),<br>
  gérée par son organisme MDI - Métiers de l'Image · charte-qualite@ffpmi.eu</div>
  <div style="white-space:nowrap;">Page <span class="pageNumber"></span> / <span class="totalPages"></span></div>
</div>'''


def couverture(titre: str, sous_titre: str, version: str) -> str:
    return f'''<header class="couverture">
  <img src="{LOGO_PPF}" alt="Photographe Professionnel de France">
  <h1>{titre}</h1>
  <p class="sous">{sous_titre}</p>
  <span class="version">{version}</span>
</header>'''


def imprimer(corps_html: str, sortie: pathlib.Path, css_en_plus: str = '') -> None:
    page_html = f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>{CSS_BASE}{css_en_plus}</style></head><body>{corps_html}</body></html>'
    with sync_playwright() as p:
        nav = p.chromium.launch()
        page = nav.new_page()
        page.set_content(page_html, wait_until='load')
        page.wait_for_timeout(300)
        page.pdf(path=str(sortie), format='A4', print_background=True, display_header_footer=True,
                 header_template='<div></div>', footer_template=pied(),
                 margin={'top': '18mm', 'bottom': '30mm', 'left': '20mm', 'right': '20mm'})
        nav.close()
    print('PDF :', sortie)
