-- Migration pour ajouter les champs des offres d'emploi
-- À exécuter sur la base de données de production

ALTER TABLE projects 
ADD COLUMN "startDate" timestamp NULL,
ADD COLUMN "endDate" timestamp NULL, 
ADD COLUMN "offerDescription" text NULL,
ADD COLUMN "offerDocumentUrl" varchar NULL,
ADD COLUMN "offerDocumentFileName" varchar NULL;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('startDate', 'endDate', 'offerDescription', 'offerDocumentUrl', 'offerDocumentFileName');