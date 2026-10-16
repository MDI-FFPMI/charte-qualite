-- Retours des bêta-testeurs (octobre 2026)
-- 10.2 : « Formateur indépendant certifié Qualiopi », autant de points que « Formateur pour un organisme certifié Qualiopi »
update questions
   set options = '[{"value":"qualiopi","label":"Formateur pour un organisme certifié Qualiopi","points":3},{"value":"independant-qualiopi","label":"Formateur indépendant certifié Qualiopi","points":3},{"value":"independant","label":"Formateur indépendant","points":2},{"value":"stagiaires","label":"Accueil de stagiaires ou d''alternants","points":2},{"value":"conferences","label":"Conférences ou interventions","points":1},{"value":"mentorat","label":"Mentorat","points":1},{"value":"publications","label":"Publications (livre, articles)","points":1},{"value":"aucun","label":"Non","points":0,"exclusive":true}]'::jsonb,
       justificatifs = 'Certificat Qualiopi (le vôtre ou celui de l''organisme), attestation ou contrat de l''organisme, programme, affiche, convention de stage, lien'
 where version_id = 'V3' and code = '10.2';

-- 9.2 : photographes qui reçoivent surtout en visio
update questions
   set options = '[{"value":"studio","label":"Studio ou bureau dédié","points":2},{"value":"domicile","label":"Espace aménagé à domicile","points":1},{"value":"itinerant","label":"Uniquement chez le client ou en extérieur","points":0},{"value":"visio","label":"Rendez-vous surtout en visio, prise de vue chez le client ou en extérieur","points":0}]'::jsonb
 where version_id = 'V3' and code = '9.2';
