
#!/bin/bash
# Script de déploiement manuel pour Infomaniak

echo "=== Déploiement manuel vers Infomaniak ==="
echo "Date: $(date)"

# Vérification du chemin de déploiement
DEPLOY_PATH=$(pwd)
echo "Déploiement dans: $DEPLOY_PATH"

# Création de la structure de base si nécessaire
bash mkdir_script.sh

# Créer un fichier de déploiement GitHub Actions basique
if [ ! -f ".github/workflows/deploy.yml" ]; then
    echo "Création du fichier de workflow GitHub Actions..."
    mkdir -p .github/workflows
    
    cat > .github/workflows/deploy.yml <<EOF
name: Deploy to Infomaniak

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Prepare deployment directory
      run: |
        mkdir -p deploy/assets
        mkdir -p deploy/api
        mkdir -p deploy/api/config
        
        # Copier les fichiers principaux
        cp index.php deploy/
        cp .htaccess deploy/
        cp -r api/* deploy/api/
        cp -r public deploy/
        cp -r assets/* deploy/assets/
        
        # Créer config/env.php avec les variables d'environnement
        echo '<?php
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
?>' > deploy/api/config/env.php
    
    - name: Deploy via FTP
      uses: SamKirkland/FTP-Deploy-Action@4.0.0
      with:
        server: \${{ secrets.FTP_SERVER }}
        username: \${{ secrets.FTP_USERNAME }}
        password: \${{ secrets.FTP_PASSWORD }}
        local-dir: ./deploy/
        server-dir: ./
EOF
    
    echo "✅ Fichier de workflow GitHub créé"
fi

echo "=== Déploiement manuel terminé ==="
