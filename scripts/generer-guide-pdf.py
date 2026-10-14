#!/usr/bin/env python3
"""Génère public/guide-preparation-charte-qualite.pdf depuis docs/guide-preparation.md.

Usage : python3 scripts/generer-guide-pdf.py   (Playwright, Chromium et le module markdown)
"""
import re, sys, pathlib
import markdown

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from gabarit_pdf import RACINE, MARINE, ROUGE, DISCRET, SURFACE, TRAIT, couverture, imprimer  # noqa: E402

VERSION = 'Octobre 2026'
md = (RACINE / 'docs/guide-preparation.md').read_text(encoding='utf-8')
corps = markdown.markdown(md, extensions=['tables'])

# Cases à cocher
corps = re.sub(r'<li>\[ \] ', '<li class="case">', corps)
corps = re.sub(r'<ul>\n(<li class="case">)', r'<ul class="cases">\n\1', corps)
# Étiquettes des trois volets de chaque rubrique
for etiquette, classe in [('Les questions à vous poser', 'q'), ('Ce que la commission attend', 'c'), ('Pour progresser', 'p')]:
    corps = corps.replace(f'<p><strong>{etiquette}</strong></p>', f'<p class="volet {classe}">{etiquette}</p>')
# Une étiquette reste avec son contenu (pas d'étiquette seule en bas de page)
corps = re.sub(r'(<p class="volet [qcp]">.*?</p>\s*<(ul|p)>.*?</\2>)', r'<div class="volet-bloc">\1</div>', corps, flags=re.S)
# Le plan d'action commence sur une nouvelle page
corps = corps.replace("<h2>Votre plan d'action</h2>", '<h2 class="nouvelle-page">Votre plan d\'action</h2>')
# Chaque rubrique dans un bloc
morceaux = re.split(r'(?=<h3>)', corps)
corps = morceaux[0] + ''.join(f'<div class="rubrique">{m}</div>' if m.startswith('<h3>') else m for m in morceaux[1:])
# Sommaire
titres = re.findall(r'<h2[^>]*>(.*?)</h2>', corps)
rubriques = re.findall(r'<h3>(.*?)</h3>', corps)
sommaire = '<nav class="sommaire"><p class="volet">Sommaire</p><ol>' + ''.join(
    f'<li>{t}' + ('<ul>' + ''.join(f'<li>{r}</li>' for r in rubriques) + '</ul>' if t == 'Rubrique par rubrique' else '') + '</li>'
    for t in titres) + '</ol></nav>'

css = f'''
.sommaire {{ background: {SURFACE}; border-radius: 2mm; padding: 4mm 6mm; margin-bottom: 4mm; columns: 1; }}
.sommaire ol {{ margin: 0; padding-left: 5mm; }}
.sommaire ol > li {{ font-weight: 600; color: {MARINE}; }}
.sommaire ul {{ columns: 2; column-gap: 8mm; font-weight: 400; color: inherit; padding-left: 4mm; margin: 1mm 0 1.5mm; font-size: 8.6pt; }}
.volet {{ font-size: 7.6pt; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; margin: 3mm 0 1.2mm; text-align: left; }}
.volet.q {{ color: {MARINE}; }}
.volet.c {{ color: {ROUGE}; }}
.volet.p {{ color: #2e7d5b; }}
.rubrique {{ border-left: 2px solid {TRAIT}; padding-left: 5mm; margin: 5mm 0 6mm; }}
.rubrique h3 {{ font-size: 11.5pt; margin-top: 0; }}
.rubrique h3 + p.volet {{ margin-top: 1.5mm; }}
ul.cases {{ list-style: none; padding-left: 1mm; }}
li.case {{ padding-left: 6.5mm; position: relative; }}
li.case::before {{ content: ''; position: absolute; left: 0; top: .6mm; width: 3.4mm; height: 3.4mm; border: 1.3px solid {MARINE}; border-radius: .6mm; background: #fff; }}
h2.nouvelle-page {{ break-before: page; }}
.volet-bloc {{ break-inside: avoid; }}
.rubrique h3 {{ break-after: avoid; }}
'''

html = couverture('Guide de préparation',
                  'Charte Qualité Photographe Professionnel de France. Bien préparer son dossier, et faire progresser son entreprise.',
                  VERSION) + sommaire + corps
imprimer(html, RACINE / 'public/guide-preparation-charte-qualite.pdf', css)
