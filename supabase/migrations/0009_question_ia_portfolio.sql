-- Question 8.7 remplacée : signalement des images générées ou fortement modifiées par IA
-- dans le portfolio et sur les réseaux (2 points, justificatif attendu).
-- Réponse « Non concerné » possible : ni gain ni perte, les 2 points sont retirés du calcul.
update questions
   set libelle = 'Les images de votre portfolio et de vos réseaux qui ont été générées ou fortement modifiées par IA sont-elles signalées comme telles ?',
       aide = 'Un futur client choisit son photographe sur son portfolio : il doit pouvoir distinguer ce que vous produisez à la prise de vue de ce qui a été créé ou transformé par IA. Une retouche courante (peau, lumière, couleurs) n''est pas concernée.',
       type = 'choice',
       options = '[{"value":"oui","label":"Oui, elles sont signalées","points":2},{"value":"non","label":"Non","points":0},{"value":"non-concerne","label":"Non concerné : je ne publie pas d''images générées ou fortement modifiées par IA","points":0,"neutre":true}]'::jsonb,
       justificatifs = 'Lien vers une publication ou une page de votre site où la mention apparaît',
       preuve_attendue = true,
       points_max = 2
 where version_id = 'V3' and code = '8.7';
