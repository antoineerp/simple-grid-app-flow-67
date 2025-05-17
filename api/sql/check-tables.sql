
-- Script pour vérifier les tables existantes et s'assurer que nous utilisons "utilisateurs" et non "users"
SELECT 
    table_name, 
    table_rows,
    create_time,
    engine
FROM 
    information_schema.tables
WHERE 
    table_schema = 'p71x6d_richard'
ORDER BY table_name;

-- Vérifier la structure de la table utilisateurs
SHOW CREATE TABLE utilisateurs;

-- Vérifier si une table users existe par erreur
SELECT COUNT(*) AS users_table_exists
FROM information_schema.tables 
WHERE table_schema = 'p71x6d_richard' 
  AND table_name = 'users';
  
-- Si la table users existe, vérifier les données avant de les migrer
-- SELECT * FROM users LIMIT 10;
