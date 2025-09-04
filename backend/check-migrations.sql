-- Vérifier les migrations déjà exécutées
SELECT * FROM migrations ORDER BY timestamp DESC;

-- Si vous voulez supprimer une migration spécifique pour la re-exécuter
-- DELETE FROM migrations WHERE name = 'CreateMailAutomation1700000006000';

-- Ou vider complètement la table des migrations (ATTENTION: re-exécutera TOUTES les migrations)
-- TRUNCATE TABLE migrations;

-- Vérifier si la table mail_automations existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'mail_automations'
);

-- Si la table existe mais est corrompue, la supprimer
-- DROP TABLE IF EXISTS automation_conditions CASCADE;
-- DROP TABLE IF EXISTS mail_automations CASCADE;