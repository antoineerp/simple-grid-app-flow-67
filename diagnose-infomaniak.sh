
#!/bin/bash
# Script de diagnostic et correction pour les fichiers PHP sur Infomaniak
# Exécuter via SSH: bash diagnose-infomaniak.sh

echo "==================================================="
echo "Diagnostic PHP sur Infomaniak - $(date)"
echo "==================================================="

# Vérifier l'emplacement
CURRENT_PATH=$(pwd)
echo "Chemin actuel: $CURRENT_PATH"

# Vérifier les fichiers PHP essentiels
echo -e "\n--- Fichiers PHP essentiels ---"
for file in index.php api/index.php api/config/env.php api/config/db_config.json; do
  if [ -f "$file" ]; then
    echo "✓ $file: EXISTE ($(stat -c %s "$file" 2>/dev/null || ls -l "$file" | awk '{print $5}') octets)"
  else
    echo "✗ $file: MANQUANT"
  fi
done

# Vérifier la structure des dossiers API
echo -e "\n--- Structure des dossiers API ---"
for dir in api api/config api/controllers api/models api/utils; do
  if [ -d "$dir" ]; then
    echo "✓ $dir: EXISTE ($(ls -la "$dir" | wc -l) éléments)"
  else
    echo "✗ $dir: MANQUANT"
    mkdir -p "$dir"
    echo "  → Dossier $dir créé"
  fi
done

# Tester le workflow de GitHub Actions
echo -e "\n--- Configuration du déploiement GitHub ---"
if [ -f ".github/workflows/deploy.yml" ]; then
  echo "✓ Fichier workflow GitHub trouvé"
  
  # Vérifier si le workflow exclut les fichiers PHP
  if grep -q "exclude:" ".github/workflows/deploy.yml" && grep -q "\*.php" ".github/workflows/deploy.yml"; then
    echo "⚠️ ATTENTION: Le workflow semble exclure les fichiers PHP"
    echo "  Voici les lignes concernées:"
    grep -A 5 "exclude:" ".github/workflows/deploy.yml"
  fi
else
  echo "✗ Fichier workflow GitHub non trouvé"
fi

# Créer le fichier index.php si nécessaire
if [ ! -f "index.php" ]; then
  echo -e "\n--- Création du fichier index.php ---"
  echo "<?php
// Redirection vers index.html
header('Location: index.html');
exit;
?>" > index.php
  echo "✓ Fichier index.php créé"
else
  echo -e "\n--- Le fichier index.php existe déjà ---"
fi

# Créer un fichier env.php minimal si nécessaire
if [ ! -f "api/config/env.php" ]; then
  echo -e "\n--- Création du fichier env.php ---"
  mkdir -p api/config
  echo "<?php
// Configuration des variables d'environnement pour Infomaniak
define(\"DB_HOST\", \"p71x6d.myd.infomaniak.com\");
define(\"DB_NAME\", \"p71x6d_richard\");
define(\"DB_USER\", \"p71x6d_richard\");
define(\"DB_PASS\", \"Trottinette43!\");
define(\"API_BASE_URL\", \"/api\");
define(\"APP_ENV\", \"production\");

// Fonction d'aide pour récupérer les variables d'environnement
function get_env(\$key, \$default = null) {
    \$const_name = strtoupper(\$key);
    if (defined(\$const_name)) {
        return constant(\$const_name);
    }
    return \$default;
}
?>" > api/config/env.php
  echo "✓ Fichier api/config/env.php créé"
else
  echo -e "\n--- Le fichier env.php existe déjà ---"
fi

# Créer un .htaccess pour l'API si nécessaire
if [ ! -f "api/.htaccess" ]; then
  echo -e "\n--- Création de api/.htaccess ---"
  echo "# Configuration pour le dossier API
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Traiter les fichiers PHP directement
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule \.(php)$ - [L]
    
    # Rediriger les autres requêtes vers index.php
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>

# Configuration CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin \"*\"
    Header set Access-Control-Allow-Methods \"GET, POST, OPTIONS, PUT, DELETE\"
    Header set Access-Control-Allow-Headers \"Content-Type, Authorization, X-Requested-With\"
</IfModule>

# Configuration des types MIME
AddType application/json .json
AddType application/javascript .js
AddType text/css .css" > api/.htaccess
  echo "✓ Fichier api/.htaccess créé"
else
  echo -e "\n--- Le fichier api/.htaccess existe déjà ---"
fi

# Créer un fichier simple pour tester MySQL via SSH
echo -e "\n--- Création d'un script de test MySQL ---"
cat > test-mysql-ssh.sh << 'EOL'
#!/bin/bash
# Test de connexion MySQL via SSH
DB_HOST="p71x6d.myd.infomaniak.com"
DB_USER="p71x6d_richard"
DB_PASS="Trottinette43!"
DB_NAME="p71x6d_richard"

echo "=== Test de connexion MySQL via SSH ==="
echo "Tentative de connexion à $DB_HOST avec l'utilisateur $DB_USER..."

# Utilisation de l'option -e pour exécuter une commande
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2> /dev/null

if [ $? -eq 0 ]; then
  echo "✅ Connexion MySQL réussie!"
  echo "Tables disponibles:"
  mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;"
else
  echo "❌ Échec de la connexion MySQL."
  echo "Vérifiez les paramètres de connexion et assurez-vous que votre adresse IP est autorisée."
fi
EOL

chmod +x test-mysql-ssh.sh
echo "✓ Script test-mysql-ssh.sh créé. Exécutez-le avec: bash test-mysql-ssh.sh"

# Instructions finales
echo -e "\n==================================================="
echo "INSTRUCTIONS POUR RÉSOUDRE LES PROBLÈMES DE DÉPLOIEMENT:"
echo "==================================================="
echo "1. MODIFIEZ LE FICHIER DE WORKFLOW GITHUB:"
echo "   - Assurez-vous que 'exclude:' NE CONTIENT PAS '*.php'"
echo "   - Ajoutez une étape pour copier explicitement tous les fichiers PHP"
echo ""
echo "2. VÉRIFIEZ LA CONNEXION MYSQL:"
echo "   - Exécutez: bash test-mysql-ssh.sh"
echo ""
echo "3. POUR UN DÉPLOIEMENT MANUEL SSH:"
echo "   - Utilisez: scp -r api/* user@votre-serveur:/path/to/site/api/"
echo ""
echo "Les fichiers essentiels ont été créés ou vérifiés."
echo "==================================================="
