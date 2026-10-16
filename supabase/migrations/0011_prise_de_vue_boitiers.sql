-- Retours des bêta-testeurs (suite)
-- « séance » remplacé par « prise de vue » là où le mot excluait les photographes sans studio,
-- et nombre de boîtiers (7.3) calculé automatiquement d'après la liste de matériel (7.1).
update questions set libelle = 'Partagez trois galeries complètes de séances ou reportages récents (moins de 24 mois), telles que livrées à vos clients' where version_id = 'V3' and code = '4.1';
update questions set libelle = 'Comment préparez-vous vos clients avant la prise de vue ?' where version_id = 'V3' and code = '5.9';
update questions set libelle = 'Quelle solution avez-vous en cas de panne de matériel pendant une prise de vue ?' where version_id = 'V3' and code = '7.2';
update questions set libelle = 'Combien de copies de vos fichiers conservez-vous après la prise de vue, et où ?' where version_id = 'V3' and code = '7.4';
update questions set libelle = 'Avez-vous prévu une solution en cas d''incident (perte de fichiers, empêchement le jour de la prise de vue) ?' where version_id = 'V3' and code = '7.5';
update questions set complements = '[{"key":"nb_boitiers","label":"Nombre de boîtiers","type":"compte","source":"7.1","filtre":"Boîtier"},{"key":"nb_double_slot","label":"Parmi eux, combien ont un double emplacement de carte ?","type":"number"},{"key":"description","label":"Description","type":"text"}]'::jsonb where version_id = 'V3' and code = '7.3';
