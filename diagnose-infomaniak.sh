
#!/bin/bash
# Script de diagnostic spécifique pour l'hébergement Infomaniak

echo "==========================================="
echo "Diagnostic Infomaniak - $(date)"
echo "==========================================="

# Configuration de la connexion MySQL
DB_HOST="p71x6d.myd.infomaniak.com"
DB_NAME="p71x6d_richard"
DB_USER="p71x6d_richard"
DB_PASSWORD="Trottinette43!"

# Vérifier si mysql est disponible
if ! command -v mysql &> /dev/null; then
    echo "ERROR: Client MySQL non disponible. Installation requise."
    exit 1
fi

# Créer un fichier temporaire pour le diagnostic SQL
TEMP_SQL=$(mktemp)
cat > $TEMP_SQL << 'EOF'
-- Vérifier les informations de la base de données
SELECT 
    VERSION() AS mysql_version,
    DATABASE() AS current_database,
    USER() AS current_user;

-- Vérifier les tables existantes
SHOW TABLES;

-- Vérifier la structure de la table utilisateurs si elle existe
SELECT COUNT(*) INTO @table_exists FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'utilisateurs';

SELECT IF(@table_exists > 0, 'La table utilisateurs existe', 'La table utilisateurs n\'existe pas') AS user_table_status;

-- Si la table utilisateurs existe, vérifier sa structure
SELECT IF(@table_exists > 0, 
    (SELECT GROUP_CONCAT(COLUMN_NAME) FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'utilisateurs'),
    'Table non disponible') AS utilisateurs_columns;

-- Vérifier l'encodage de la base de données
SELECT 
    DEFAULT_CHARACTER_SET_NAME AS charset,
    DEFAULT_COLLATION_NAME AS collation
FROM 
    information_schema.SCHEMATA 
WHERE 
    SCHEMA_NAME = DATABASE();
EOF

echo -e "\n== Test de connexion MySQL =="
echo "Connexion à $DB_HOST avec l'utilisateur $DB_USER..."

# Exécuter le diagnostic SQL et capturer la sortie
MYSQL_RESULT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$TEMP_SQL" 2>&1)
MYSQL_STATUS=$?

# Vérifier si la commande a réussi
if [ $MYSQL_STATUS -eq 0 ]; then
    echo "✓ Connexion MySQL réussie"
    echo -e "\nRésultats du diagnostic SQL:"
    echo "$MYSQL_RESULT" | sed 's/^/  /'
else
    echo "✗ Échec de la connexion MySQL: $MYSQL_RESULT"
fi

# Supprimer le fichier temporaire
rm -f "$TEMP_SQL"

# Vérifier les problèmes de fichiers CSS
echo -e "\n== Vérification des problèmes CSS =="
# Obtenir le chemin du site
SITE_PATH="/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch"

echo "Vérification des fichiers .htaccess pour les directives MIME..."
if [ -f "$SITE_PATH/.htaccess" ]; then
    echo "Contenu de .htaccess principal:"
    grep -i "AddType\|ForceType\|content-type" "$SITE_PATH/.htaccess" || echo "  Aucune directive MIME trouvée"
fi

if [ -f "$SITE_PATH/assets/.htaccess" ]; then
    echo "Contenu de assets/.htaccess:"
    grep -i "AddType\|ForceType\|content-type" "$SITE_PATH/assets/.htaccess" || echo "  Aucune directive MIME trouvée"
fi

echo -e "\nSolution pour les problèmes CSS:"
echo "Créez ou modifiez le fichier assets/.htaccess avec:"
echo "AddType text/css .css"
echo "AddType application/javascript .js"

echo -e "\nDiagnostic terminé."
