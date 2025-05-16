
<?php
header('Content-Type: text/html; charset=utf-8');

// Configuration
$workflow_dir = './.github/workflows';
$selective_workflow_file = "$workflow_dir/deploy-selective.yml";

// Vérification du dossier de workflow
if (!is_dir($workflow_dir)) {
    if (!mkdir($workflow_dir, 0755, true)) {
        die("Impossible de créer le dossier .github/workflows");
    }
}

// Récupérer le contenu du workflow sélectif depuis cette page
$current_file = __FILE__;
if (!file_exists($current_file)) {
    die("Impossible de trouver le fichier courant");
}

$content = file_get_contents($current_file);
if ($content === false) {
    die("Impossible de lire le contenu du fichier courant");
}

// Extraire le contenu du workflow entre les balises
$workflow_start = "name: Selective Deploy to Infomaniak";
$workflow_end = "        rm changed_files.txt";

$start_pos = strpos($content, $workflow_start);
$end_pos = strpos($content, $workflow_end);

if ($start_pos === false || $end_pos === false) {
    die("Impossible de trouver le contenu du workflow dans le fichier");
}

$workflow_content = substr($content, $start_pos, $end_pos - $start_pos + strlen($workflow_end));

// Écrire le fichier de workflow
if (file_put_contents($selective_workflow_file, $workflow_content)) {
    echo "<h1>Installation du workflow GitHub sélectif réussie</h1>";
    echo "<p>Le workflow a été installé dans <code>$selective_workflow_file</code></p>";
    echo "<p>Ce workflow ne déploiera que les fichiers nouveaux et modifiés sur votre serveur.</p>";
    
    // Vérifier les autres workflows existants
    $existing_workflows = glob("$workflow_dir/*.yml");
    if (count($existing_workflows) > 1) {
        echo "<h2>Autres workflows existants</h2>";
        echo "<p>Les workflows suivants existent également dans votre dossier .github/workflows :</p>";
        echo "<ul>";
        foreach ($existing_workflows as $workflow) {
            if ($workflow !== $selective_workflow_file) {
                echo "<li>" . basename($workflow) . "</li>";
            }
        }
        echo "</ul>";
        echo "<p><strong>Note:</strong> Vous pouvez désactiver ces workflows en les renommant avec une extension .disabled ou en les supprimant si vous préférez n'utiliser que le workflow sélectif.</p>";
    }
} else {
    echo "<h1>Erreur lors de l'installation du workflow GitHub</h1>";
    echo "<p>Impossible d'écrire le fichier de workflow dans <code>$selective_workflow_file</code></p>";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Installation du workflow GitHub sélectif</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; }
        code { background-color: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Comment utiliser le workflow sélectif</h2>
        <p>Le workflow sélectif que vous venez d'installer fonctionne comme suit :</p>
        <ol>
            <li>À chaque push sur la branche main, le workflow est déclenché</li>
            <li>Il compare le commit actuel avec le commit précédent pour déterminer les fichiers modifiés</li>
            <li>Seuls les fichiers nouveaux et modifiés sont transférés vers votre serveur</li>
            <li>Les fichiers compilés (assets, index.html) sont toujours transférés</li>
            <li>Les fichiers de configuration critiques sont également toujours mis à jour</li>
        </ol>
        
        <h2>Vérification manuelle</h2>
        <p>Pour vérifier que votre workflow est correctement configuré, allez sur GitHub :</p>
        <ol>
            <li>Accédez à votre dépôt</li>
            <li>Cliquez sur "Actions" dans la barre de navigation</li>
            <li>Vous devriez voir le workflow "Selective Deploy to Infomaniak" listé</li>
            <li>Vous pouvez le déclencher manuellement en cliquant sur "Run workflow"</li>
        </ol>
        
        <h2>Tests de connectivité</h2>
        <p>Pour vérifier que votre serveur peut bien communiquer avec GitHub :</p>
        <p>
            <a href="github-connectivity-test.php" style="display: inline-block; margin-right: 10px; padding: 8px 16px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
                Exécuter les tests de connectivité
            </a>
        </p>
    </div>
</body>
</html>

name: Selective Deploy to Infomaniak

on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      reason:
        description: 'Raison du déploiement manuel'
        required: false
        default: 'Déploiement manuel'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        fetch-depth: 0  # Permet d'accéder à l'historique complet pour les comparaisons

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install Dependencies
      run: npm install --legacy-peer-deps
      
    - name: Build React App
      run: npm run build
      
    - name: Get changed files
      id: changed-files
      run: |
        # Récupérer le commit précédent
        PREVIOUS_COMMIT=$(git rev-parse HEAD~1)
        CURRENT_COMMIT=$(git rev-parse HEAD)
        
        echo "Comparaison entre $PREVIOUS_COMMIT et $CURRENT_COMMIT"
        
        # Créer un fichier temporaire pour la liste des fichiers modifiés
        git diff --name-status $PREVIOUS_COMMIT $CURRENT_COMMIT > changed_files.txt
        
        # Afficher les fichiers changés pour le log
        echo "Fichiers modifiés:"
        cat changed_files.txt
        
        # Comptage des fichiers modifiés
        MODIFIED_COUNT=$(grep -c "^M" changed_files.txt)
        ADDED_COUNT=$(grep -c "^A" changed_files.txt)
        DELETED_COUNT=$(grep -c "^D" changed_files.txt)
        
        echo "Fichiers modifiés: $MODIFIED_COUNT"
        echo "Fichiers ajoutés: $ADDED_COUNT"
        echo "Fichiers supprimés: $DELETED_COUNT"
        
    - name: Prepare deployment directory
      run: |
        # Créer le répertoire de déploiement
        mkdir -p deploy
        
        # Copier les fichiers de build compilés (ces fichiers sont toujours à envoyer)
        echo "Copie des fichiers compilés..."
        mkdir -p deploy/assets
        cp -r dist/assets/* deploy/assets/
        cp dist/index.html deploy/ || echo "index.html non trouvé dans dist/"
        
        # Créer les dossiers nécessaires pour éviter les erreurs FTP
        mkdir -p deploy/api/config
        mkdir -p deploy/api/controllers
        mkdir -p deploy/api/models
        
        # Traiter les fichiers modifiés et ajoutés depuis le dernier commit
        echo "Traitement des fichiers changés..."
        while IFS= read -r line; do
          # Extraire le statut (M pour modifié, A pour ajouté, D pour supprimé) et le chemin du fichier
          STATUS=$(echo "$line" | cut -c1)
          FILEPATH=$(echo "$line" | cut -c3-)
          
          # Ignorer certains fichiers et dossiers
          if [[ "$FILEPATH" == "node_modules/"* ]] || [[ "$FILEPATH" == ".git/"* ]]; then
            echo "Ignoré: $FILEPATH"
            continue
          fi
          
          # Pour les fichiers modifiés ou ajoutés
          if [[ "$STATUS" == "M" ]] || [[ "$STATUS" == "A" ]]; then
            # Vérifier si le fichier existe
            if [ -f "$FILEPATH" ]; then
              # Créer le répertoire parent dans deploy si nécessaire
              PARENT_DIR=$(dirname "deploy/$FILEPATH")
              mkdir -p "$PARENT_DIR"
              
              # Copier le fichier
              cp "$FILEPATH" "deploy/$FILEPATH"
              echo "Copié: $FILEPATH"
            fi
          fi
          
          # Pour les fichiers supprimés, on peut éventuellement générer un script de nettoyage
          # mais nous ne le supprimons pas directement via FTP pour éviter des problèmes
          
        done < changed_files.txt
        
        # Ajouter les fichiers critiques qui doivent toujours être présents
        cp .htaccess deploy/ || echo ".htaccess non trouvé"
        
        # Créer/mettre à jour les fichiers de configuration dans tous les cas
        echo "<?php" > deploy/api/config/env.php
        echo "// Configuration des variables d'environnement pour Infomaniak" >> deploy/api/config/env.php
        echo "define(\"DB_HOST\", \"p71x6d.myd.infomaniak.com\");" >> deploy/api/config/env.php
        echo "define(\"DB_NAME\", \"p71x6d_richard\");" >> deploy/api/config/env.php
        echo "define(\"DB_USER\", \"p71x6d_richard\");" >> deploy/api/config/env.php
        echo "define(\"DB_PASS\", \"Trottinette43!\");" >> deploy/api/config/env.php
        echo "define(\"API_BASE_URL\", \"/api\");" >> deploy/api/config/env.php
        echo "define(\"APP_ENV\", \"production\");" >> deploy/api/config/env.php
        echo "" >> deploy/api/config/env.php
        echo "// Fonction d'aide pour récupérer les variables d'environnement" >> deploy/api/config/env.php
        echo "function get_env(\$key, \$default = null) {" >> deploy/api/config/env.php
        echo "    \$const_name = strtoupper(\$key);" >> deploy/api/config/env.php
        echo "    if (defined(\$const_name)) {" >> deploy/api/config/env.php
        echo "        return constant(\$const_name);" >> deploy/api/config/env.php
        echo "    }" >> deploy/api/config/env.php
        echo "    return \$default;" >> deploy/api/config/env.php
        echo "}" >> deploy/api/config/env.php
        echo "?>" >> deploy/api/config/env.php
        
        echo '{' > deploy/api/config/db_config.json
        echo '    "host": "p71x6d.myd.infomaniak.com",' >> deploy/api/config/db_config.json
        echo '    "db_name": "p71x6d_richard",' >> deploy/api/config/db_config.json
        echo '    "username": "p71x6d_richard",' >> deploy/api/config/db_config.json
        echo '    "password": "Trottinette43!"' >> deploy/api/config/db_config.json
        echo '}' >> deploy/api/config/db_config.json
        
        # Assurer que le fichier .htaccess de l'API existe
        if [ ! -f "deploy/api/.htaccess" ]; then
          echo "# Activer la réécriture d'URL" > deploy/api/.htaccess
          echo "RewriteEngine On" >> deploy/api/.htaccess
          echo "" >> deploy/api/.htaccess
          echo "# Définir les types MIME corrects" >> deploy/api/.htaccess
          echo "AddType application/javascript .js" >> deploy/api/.htaccess
          echo "AddType application/javascript .mjs" >> deploy/api/.htaccess
          echo "AddType text/css .css" >> deploy/api/.htaccess
          echo "AddType application/json .json" >> deploy/api/.htaccess
          echo "" >> deploy/api/.htaccess
          echo "# Gérer les requêtes OPTIONS pour CORS" >> deploy/api/.htaccess
          echo "RewriteCond %{REQUEST_METHOD} OPTIONS" >> deploy/api/.htaccess
          echo "RewriteRule ^(.*)$ \$1 [R=200,L]" >> deploy/api/.htaccess
          echo "" >> deploy/api/.htaccess
          echo "# Configuration CORS" >> deploy/api/.htaccess
          echo "<IfModule mod_headers.c>" >> deploy/api/.htaccess
          echo "    Header set Access-Control-Allow-Origin \"*\"" >> deploy/api/.htaccess
          echo "    Header set Access-Control-Allow-Methods \"GET, POST, OPTIONS, PUT, DELETE\"" >> deploy/api/.htaccess
          echo "    Header set Access-Control-Allow-Headers \"Content-Type, Authorization, X-Requested-With\"" >> deploy/api/.htaccess
          echo "</IfModule>" >> deploy/api/.htaccess
        fi
        
        # Ajouter les scripts de diagnostic importants
        cp fix-index-html.php deploy/ || echo "Création de fix-index-html.php..."
        cp check-deployment-issues.php deploy/ || echo "Création de check-deployment-issues.php..."
        cp github-connectivity-test.php deploy/ || echo "Copie de github-connectivity-test.php..."
        
        # Afficher le rapport
        echo "=== Rapport de déploiement ==="
        echo "Fichiers prêts pour le déploiement:"
        find deploy -type f | wc -l
        echo "Top 10 fichiers:"
        find deploy -type f | head -10

    - name: FTP Deploy to Infomaniak
      uses: SamKirkland/FTP-Deploy-Action@v4.3.4
      with:
        server: ${{ secrets.FTP_SERVER }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        local-dir: ./deploy/
        server-dir: /sites/qualiopi.ch/
        dangerous-clean-slate: false
        exclude: |
          **/.git*
          **/.git*/**
          **/node_modules/**
          README.md
        log-level: verbose
        timeout: 120000
        
    - name: Clean up
      run: |
        rm -rf deploy
        rm changed_files.txt
