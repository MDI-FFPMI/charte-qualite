-- 6.3 : le chiffre d'affaires est demandé hors taxes
update questions
   set libelle = 'Quelle est votre tranche de chiffre d''affaires annuel hors taxes (HT) ?',
       aide = 'Chiffre d''affaires hors taxes, sur votre dernier exercice complet. Utilisé uniquement pour des statistiques anonymes, jamais transmis à la commission.',
       options = '[{"value":"lt20k","label":"Moins de 20 000 € HT","points":0},{"value":"20-40k","label":"20 000 à 40 000 € HT","points":0},{"value":"40-80k","label":"40 000 à 80 000 € HT","points":0},{"value":"80-150k","label":"80 000 à 150 000 € HT","points":0},{"value":"gt150k","label":"Plus de 150 000 € HT","points":0}]'::jsonb
 where version_id = 'V3' and code = '6.3';
