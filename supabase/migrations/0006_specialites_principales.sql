-- Question 2.2 : jusqu'à 4 spécialités principales
update questions
   set libelle = 'Quelles spécialités pratiquez-vous régulièrement ? Indiquez jusqu''à 4 spécialités principales.',
       aide = 'Vos spécialités principales sont celles qui représentent l''essentiel de votre activité. La commission choisit ses experts en fonction d''elles.'
 where version_id = 'V3' and code = '2.2';
