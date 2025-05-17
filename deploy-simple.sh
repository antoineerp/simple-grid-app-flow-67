
#!/bin/bash
# Script de déploiement simplifié pour Infomaniak
# Avec vérification des fichiers critiques

echo "=== Déploiement simple vers Infomaniak ==="
echo "Date: $(date)"

# Construction du projet si le dossier dist n'existe pas
if [ ! -d "dist" ]; then
  echo "Le dossier dist n'existe pas. Construction du projet..."
  npm run build
  if [ ! -d "dist" ]; then
    echo "ERREUR: La construction du projet a échoué. Dossier dist non créé."
    exit 1
  else
    echo "✅ Construction du projet réussie"
  fi
fi

# Création des dossiers nécessaires
echo "Création des dossiers de base..."
mkdir -p deploy/assets
mkdir -p deploy/api/config
mkdir -p deploy/api/controllers
mkdir -p deploy/api/models
mkdir -p deploy/api/middleware
mkdir -p deploy/api/operations
mkdir -p deploy/api/utils
mkdir -p deploy/api/documentation
mkdir -p deploy/public/lovable-uploads
mkdir -p deploy/public/error-pages
mkdir -p deploy/.github/workflows

# Copie des fichiers de l'application
echo "Copie des fichiers de l'application..."

# Copie des fichiers principaux
cp index.php deploy/
cp index.html deploy/ 2>/dev/null || echo "index.html non trouvé"
cp .htaccess deploy/ 2>/dev/null || echo ".htaccess racine non trouvé"
cp .user.ini deploy/ 2>/dev/null || echo ".user.ini racine non trouvé"
cp error-handler.php deploy/ 2>/dev/null || echo "error-handler.php non trouvé"

# Copie des assets
if [ -d "assets" ]; then
  echo "Copie des assets depuis ./assets/"
  cp -r assets/* deploy/assets/
elif [ -d "dist/assets" ]; then
  echo "Copie des assets depuis ./dist/assets/"
  cp -r dist/assets/* deploy/assets/
else
  echo "ERREUR: Aucun dossier assets trouvé!"
fi

# Copier les fichiers du dossier dist s'il existe
if [ -d "dist" ]; then
  echo "Copie des fichiers du dossier dist..."
  # Copier index.html de dist s'il existe
  if [ -f "dist/index.html" ]; then
    cp dist/index.html deploy/
    echo "✅ index.html copié depuis dist/"
  fi
  
  # Copier les autres fichiers de dist (sauf assets qui sont déjà copiés)
  find dist -maxdepth 1 -type f -not -name "index.html" -exec cp {} deploy/ \;
  echo "✅ Fichiers du dossier dist copiés"
fi

# Copie explicite et vérification de l'API htaccess
echo "Configuration de l'API..."
mkdir -p deploy/api

# Création d'un nouveau .htaccess pour l'API (CRUCIAL)
echo "Création du fichier .htaccess pour l'API..."
cat > deploy/api/.htaccess <<'EOL'
# Activer la réécriture d'URL
RewriteEngine On

# Définir les types MIME corrects
AddType application/javascript .js
AddType application/javascript .mjs
AddType application/javascript .es.js
AddType text/css .css
AddType application/json .json

# Gérer les requêtes OPTIONS pour CORS
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Configuration CORS et types MIME
<IfModule mod_headers.c>
    # Force le bon type MIME pour les JavaScript modules
    <FilesMatch "\.(m?js|es\.js)$">
        Header set Content-Type "application/javascript"
        Header set X-Content-Type-Options "nosniff"
    </FilesMatch>
    
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    # Eviter la mise en cache
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</IfModule>

# Permettre l'accès direct aux fichiers PHP spécifiques
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule \.(php)$ - [L]

# Rediriger toutes les requêtes vers l'index.php sauf pour les fichiers existants
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
EOL

chmod 644 deploy/api/.htaccess
echo "✅ Fichier api/.htaccess créé avec succès"

# Copie des fichiers de configuration
echo "Configuration de la base de données..."
if [ -f "api/config/db_config.json" ]; then
  cp api/config/db_config.json deploy/api/config/
  echo "✅ Fichier de configuration DB copié"
else
  # Création du fichier de configuration DB
  cat > deploy/api/config/db_config.json <<'EOL'
{
    "host": "p71x6d.myd.infomaniak.com",
    "db_name": "p71x6d_richard",
    "username": "p71x6d_richard",
    "password": "Trottinette43!"
}
EOL
  echo "✅ Fichier de configuration DB créé"
fi

# Création de env.php
echo "Création du fichier env.php..."
cat > deploy/api/config/env.php <<'EOL'
<?php
// Configuration des variables d'environnement pour Infomaniak
define("DB_HOST", "p71x6d.myd.infomaniak.com");
define("DB_NAME", "p71x6d_richard");
define("DB_USER", "p71x6d_richard");
define("DB_PASS", "Trottinette43!");
define("API_BASE_URL", "/api");
define("APP_ENV", "production");

// Fonction d'aide pour récupérer les variables d'environnement
function get_env($key, $default = null) {
    $const_name = strtoupper($key);
    if (defined($const_name)) {
        return constant($const_name);
    }
    return $default;
}
EOL
echo "✅ Fichier env.php créé"

# Copie de tous les autres fichiers PHP de l'API
echo "Copie des fichiers PHP de l'API..."
if [ -d "api" ]; then
  find api -name "*.php" | while read file; do
    # Créer le dossier de destination si nécessaire
    dir_name=$(dirname "$file")
    target_dir="deploy/$dir_name"
    mkdir -p "$target_dir"
    
    # Copier le fichier
    cp "$file" "deploy/$file"
    echo "Copié: $file"
  done
  echo "✅ Fichiers PHP de l'API copiés"
else
  echo "ERREUR: Dossier API non trouvé!"
fi

# Créer un fichier README dans le dossier documentation
echo "Création du fichier README dans api/documentation..."
mkdir -p deploy/api/documentation
cat > deploy/api/documentation/README.md <<'EOL'
# Documentation API

Ce dossier contient la documentation de l'API.
EOL
echo "✅ Fichier README.md créé dans api/documentation"

# Copie des uploads
if [ -d "public/lovable-uploads" ]; then
  echo "Copie des uploads..."
  cp -r public/lovable-uploads/* deploy/public/lovable-uploads/
  echo "✅ Uploads copiés"
else
  echo "Aucun upload à copier"
  mkdir -p deploy/public/lovable-uploads
fi

# Vérification des fichiers critiques
echo ""
echo "=== Vérification des fichiers critiques ==="
critical_files=(
  "deploy/api/.htaccess"
  "deploy/api/config/db_config.json"
  "deploy/api/config/env.php"
  "deploy/index.php"
  "deploy/index.html"
  "deploy/.htaccess"
  "deploy/error-handler.php"
)

all_ok=true
for file in "${critical_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file: PRÉSENT"
  else
    echo "❌ $file: MANQUANT"
    all_ok=false
  fi
done

# Permissions
echo ""
echo "=== Application des permissions ==="
find deploy -type d -exec chmod 755 {} \;
find deploy -type f -exec chmod 644 {} \;
echo "✅ Permissions appliquées"

if [ "$all_ok" = true ]; then
  echo ""
  echo "=== DÉPLOIEMENT PRÊT ==="
  echo "Tous les fichiers critiques sont présents."
  echo "Pour déployer via FTP, utilisez: deploy/username password"
else
  echo ""
  echo "=== ATTENTION: FICHIERS MANQUANTS ==="
  echo "Certains fichiers critiques sont manquants. Vérifiez les erreurs ci-dessus."
  exit 1
fi

echo ""
echo "=== Structure du déploiement ==="
find deploy -type f | sort

