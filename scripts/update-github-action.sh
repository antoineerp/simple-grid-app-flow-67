
#!/bin/bash
# Script pour mettre à jour le workflow GitHub Actions pour inclure les fichiers hachés

echo "=== Script de mise à jour du workflow GitHub Actions ==="
echo "Date: $(date)"

# Chemin du fichier de workflow
WORKFLOW_FILE=".github/workflows/deploy.yml"

if [ ! -f "$WORKFLOW_FILE" ]; then
    echo "❌ ERREUR: Fichier de workflow non trouvé: $WORKFLOW_FILE"
    exit 1
fi

# Sauvegarder le fichier original
cp "$WORKFLOW_FILE" "${WORKFLOW_FILE}.bak"
echo "✅ Sauvegarde du fichier original: ${WORKFLOW_FILE}.bak"

# Ajouter le code pour copier les fichiers hachés
cat > "$WORKFLOW_FILE.new" << 'EOL'
# Workflow de déploiement FormaCert
name: Deploy to Infomaniak

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Prepare deployment directory
      run: |
        # Création des dossiers nécessaires
        mkdir -p deploy/assets
        mkdir -p deploy/api/config
        mkdir -p deploy/api/utils
        mkdir -p deploy/api/data
        
        # Copier l'index.html dans le dossier de déploiement
        cp index.html deploy/
        
        # Copier les fichiers statiques nécessaires
        cp -r public deploy/
        
        # Copier TOUS les fichiers du dossier dist/assets vers deploy/assets
        cp -r dist/assets/* deploy/assets/
        
        # Créer des versions non hachées des fichiers principaux
        echo "Création des versions non hachées des fichiers JS et CSS..."
        
        # Trouver le fichier index.js haché
        INDEX_JS=$(find dist/assets -name "index.*.js" | head -n 1)
        if [ -n "$INDEX_JS" ]; then
          cp "$INDEX_JS" deploy/assets/index.js
          echo "Copié $INDEX_JS vers deploy/assets/index.js"
        else
          echo "Aucun fichier index.js haché trouvé"
        fi
        
        # Trouver le fichier main.js haché
        MAIN_JS=$(find dist/assets -name "main.*.js" | head -n 1)
        if [ -n "$MAIN_JS" ]; then
          cp "$MAIN_JS" deploy/assets/main.js
          echo "Copié $MAIN_JS vers deploy/assets/main.js"
        else
          echo "Aucun fichier main.js haché trouvé"
        fi
        
        # Trouver le fichier index.css haché
        INDEX_CSS=$(find dist/assets -name "index.*.css" | head -n 1)
        if [ -n "$INDEX_CSS" ]; then
          cp "$INDEX_CSS" deploy/assets/index.css
          echo "Copié $INDEX_CSS vers deploy/assets/index.css"
        else
          echo "Aucun fichier index.css haché trouvé"
        fi
        
        # Trouver le fichier main.css haché
        MAIN_CSS=$(find dist/assets -name "main.*.css" | head -n 1)
        if [ -n "$MAIN_CSS" ]; then
          cp "$MAIN_CSS" deploy/assets/main.css
          echo "Copié $MAIN_CSS vers deploy/assets/main.css"
        else
          echo "Aucun fichier main.css haché trouvé"
        fi
        
        # Copier les fichiers API nécessaires
        cp -r api/* deploy/api/
        
        # Créer config/env.php avec les variables d'environnement
        mkdir -p deploy/api/config
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

// Alias pour compatibilité avec différentes syntaxes
if (!function_exists("env")) {
    function env($key, $default = null) {
        return get_env($key, $default);
    }
}
?>' > deploy/api/config/env.php
        echo "Fichier env.php créé avec p71x6d_richard"
        
        # Créer un script de vérification post-déploiement
        cp emergency-deploy-fix.php deploy/
        cp fix-index-assets.php deploy/
        
        # Afficher le contenu du dossier de déploiement (pour débogage)
        echo "=== Contenu du dossier de déploiement ==="
        find deploy -type f | sort
    
    - name: Deploy to Infomaniak
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.INFOMANIAK_HOST }}
        username: ${{ secrets.INFOMANIAK_USERNAME }}
        key: ${{ secrets.INFOMANIAK_SSH_KEY }}
        port: 22
        script: |
          cd /sites/qualiopi.ch/
          rm -rf api assets public index.html
          
    - name: Upload files via SFTP
      uses: wlixcc/SFTP-Deploy-Action@v1.2.4
      with:
        server: ${{ secrets.INFOMANIAK_HOST }}
        username: ${{ secrets.INFOMANIAK_USERNAME }}
        ssh_private_key: ${{ secrets.INFOMANIAK_SSH_KEY }}
        local_path: './deploy/*'
        remote_path: '/sites/qualiopi.ch'
        sftpArgs: '-o ConnectTimeout=5'
    
    - name: Post-deployment verification
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.INFOMANIAK_HOST }}
        username: ${{ secrets.INFOMANIAK_USERNAME }}
        key: ${{ secrets.INFOMANIAK_SSH_KEY }}
        port: 22
        script: |
          cd /sites/qualiopi.ch/
          echo "=== Vérification post-déploiement ==="
          
          # Vérifier les fichiers critiques
          if [ -f "assets/main.css" ]; then echo "✅ assets/main.css: PRÉSENT"; else echo "❌ assets/main.css: MANQUANT"; fi
          if [ -f "index.html" ]; then echo "✅ index.html: PRÉSENT"; else echo "❌ index.html: MANQUANT"; fi
          if [ -f "api/.htaccess" ]; then echo "✅ api/.htaccess: PRÉSENT"; else echo "❌ api/.htaccess: MANQUANT"; fi
          if [ -f "api/config/env.php" ]; then echo "✅ api/config/env.php: PRÉSENT"; else echo "❌ api/config/env.php: MANQUANT"; fi
          if [ -f "assets/index.js" ]; then echo "✅ assets/index.js: PRÉSENT"; else echo "❌ assets/index.js: MANQUANT"; fi
          if [ -f "assets/main.js" ]; then echo "✅ assets/main.js: PRÉSENT"; else echo "❌ assets/main.js: MANQUANT"; fi
          
          # Vérifier les fichiers hachés
          echo "=== Fichiers hachés trouvés ==="
          find assets -name "*.*.js" | sort
          find assets -name "*.*.css" | sort
          
          # Exécuter le script de correction des fichiers statiques
          if [ -f "fix-index-assets.php" ]; then
            php fix-index-assets.php
          fi
          
          # Si des fichiers sont manquants, exécuter le script d'urgence
          if [ ! -f "assets/main.css" ] || [ ! -f "index.html" ] || [ ! -f "api/.htaccess" ] || [ ! -f "api/config/env.php" ]; then
            echo "Exécution du script d'urgence..."
            if [ -f "emergency-deploy-fix.php" ]; then
              php emergency-deploy-fix.php
            fi
          fi
EOL

# Remplacer le fichier original par la nouvelle version
mv "$WORKFLOW_FILE.new" "$WORKFLOW_FILE"
echo "✅ Fichier de workflow mis à jour: $WORKFLOW_FILE"

# Rendre le script exécutable
chmod +x "$WORKFLOW_FILE"
echo "✅ Permissions appliquées au fichier de workflow"

echo "Script terminé avec succès!"
