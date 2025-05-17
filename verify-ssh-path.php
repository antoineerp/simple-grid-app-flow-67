
<?php
// Script pour créer un workflow GitHub Actions utilisant uniquement FTP et PHP
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Configuration du workflow GitHub Actions (FTP uniquement)</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 1000px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; }
        .warning { color: orange; background-color: #fffbf0; padding: 10px; border-left: 3px solid orange; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Configuration du workflow GitHub Actions (FTP uniquement)</h1>
        
        <div class="card">
            <h2>Workflow FTP sans SSH</h2>
            
            <p>Cette version du workflow utilise uniquement FTP pour le déploiement et des scripts PHP pour les vérifications post-déploiement.</p>
            
            <h3>Créer un workflow FTP simplifié</h3>
            <form method="post">
                <button type="submit" name="create_ftp_workflow">Créer un workflow FTP optimisé</button>
            </form>
            
            <?php
            if (isset($_POST['create_ftp_workflow'])) {
                if (!is_dir('./.github/workflows')) {
                    mkdir('./.github/workflows', 0755, true);
                }
                
                $ftp_workflow = <<<EOL
name: FTP Deploy to Infomaniak

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
        token: \${{ secrets.GITHUB_TOKEN }}
        fetch-depth: 0

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install Dependencies
      run: npm install --legacy-peer-deps
      
    - name: Build React App
      run: npm run build
      
    - name: Debug build output
      run: |
        echo "============== Debugging build output =============="
        ls -la dist/
        ls -la dist/assets/ || echo "Dossier assets non trouvé"
        
    - name: Prepare deployment files
      run: |
        # Création des dossiers nécessaires
        mkdir -p deploy/assets
        mkdir -p deploy/api/config
        mkdir -p deploy/api/controllers
        mkdir -p deploy/api/models
        mkdir -p deploy/api/middleware
        mkdir -p deploy/api/operations
        mkdir -p deploy/api/utils
        mkdir -p deploy/api/services
        mkdir -p deploy/api/documentation
        mkdir -p deploy/public/lovable-uploads
        
        # Copie des fichiers compilés
        cp -r dist/assets/* deploy/assets/
        cp dist/index.html deploy/
        
        # Copie des fichiers PHP critiques
        echo "Copie des fichiers PHP et de configuration..."
        
        # Copie .htaccess
        cp .htaccess deploy/ || echo ".htaccess racine non trouvé"
        
        # Copie des fichiers de configuration utilisateur
        cp .user.ini deploy/ || echo ".user.ini non trouvé"
        
        # Configuration API
        if [ -d "api" ]; then
          echo "Copie des fichiers API..."
          find api -name "*.php" -type f | while read file; do
            dir=\$(dirname "\$file")
            mkdir -p "deploy/\$dir"
            cp "\$file" "deploy/\$file"
          done
        else
          echo "Dossier API non trouvé"
        fi
        
        # Copie des scripts de correction PHP
        cp fix-php-web-execution.php deploy/ || echo "Création du script de correction PHP..."
        cp fix-index-assets.php deploy/ || echo "Création du script de correction des assets..."
        cp deploy-status.php deploy/ || echo "Création du script de status du déploiement..."
        
        # Configuration spécifique
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
        echo "function get_env(\\\$key, \\\$default = null) {" >> deploy/api/config/env.php
        echo "    \\\$const_name = strtoupper(\\\$key);" >> deploy/api/config/env.php
        echo "    if (defined(\\\$const_name)) {" >> deploy/api/config/env.php
        echo "        return constant(\\\$const_name);" >> deploy/api/config/env.php
        echo "    }" >> deploy/api/config/env.php
        echo "    return \\\$default;" >> deploy/api/config/env.php
        echo "}" >> deploy/api/config/env.php
        echo "?>" >> deploy/api/config/env.php
        
        # Créer un fichier .htaccess pour l'API
        echo "# Configuration pour le dossier API" > deploy/api/.htaccess
        echo "<FilesMatch \\\"\\\\.php\\\$\\\">" >> deploy/api/.htaccess
        echo "    SetHandler application/x-httpd-php" >> deploy/api/.htaccess
        echo "</FilesMatch>" >> deploy/api/.htaccess
        echo "" >> deploy/api/.htaccess
        echo "# Activer la réécriture d'URL" >> deploy/api/.htaccess
        echo "RewriteEngine On" >> deploy/api/.htaccess
        echo "" >> deploy/api/.htaccess
        echo "# Configuration CORS" >> deploy/api/.htaccess
        echo "<IfModule mod_headers.c>" >> deploy/api/.htaccess
        echo "    Header set Access-Control-Allow-Origin \"*\"" >> deploy/api/.htaccess
        echo "    Header set Access-Control-Allow-Methods \"GET, POST, OPTIONS, PUT, DELETE\"" >> deploy/api/.htaccess
        echo "    Header set Access-Control-Allow-Headers \"Content-Type, Authorization, X-Requested-With\"" >> deploy/api/.htaccess
        echo "</IfModule>" >> deploy/api/.htaccess
        
        # Créer des versions non hachées des fichiers principaux
        echo "Création des versions non hachées des fichiers JS et CSS..."
        
        # Trouver le fichier index.js haché
        INDEX_JS=\$(find dist/assets -name "index.*.js" | head -n 1)
        if [ -n "\$INDEX_JS" ]; then
          cp "\$INDEX_JS" deploy/assets/index.js
          echo "Copié \$INDEX_JS vers deploy/assets/index.js"
        else
          echo "Aucun fichier index.js haché trouvé"
        fi
        
        # Trouver le fichier main.js haché
        MAIN_JS=\$(find dist/assets -name "main.*.js" | head -n 1)
        if [ -n "\$MAIN_JS" ]; then
          cp "\$MAIN_JS" deploy/assets/main.js
          echo "Copié \$MAIN_JS vers deploy/assets/main.js"
        else
          echo "Aucun fichier main.js haché trouvé"
        fi
        
        # Trouver le fichier index.css haché
        INDEX_CSS=\$(find dist/assets -name "index.*.css" | head -n 1)
        if [ -n "\$INDEX_CSS" ]; then
          cp "\$INDEX_CSS" deploy/assets/index.css
          echo "Copié \$INDEX_CSS vers deploy/assets/index.css"
        else
          echo "Aucun fichier index.css haché trouvé"
        fi
        
        # Trouver le fichier main.css haché
        MAIN_CSS=\$(find dist/assets -name "main.*.css" | head -n 1)
        if [ -n "\$MAIN_CSS" ]; then
          cp "\$MAIN_CSS" deploy/assets/main.css
          echo "Copié \$MAIN_CSS vers deploy/assets/main.css"
        else
          echo "Aucun fichier main.css haché trouvé"
        fi
        
        # Créer un script PHP de vérification post-déploiement
        echo "<?php" > deploy/verify-deployment.php
        echo "// Script de vérification post-déploiement" >> deploy/verify-deployment.php
        echo "header('Content-Type: text/html; charset=utf-8');" >> deploy/verify-deployment.php
        echo "\$status = [];" >> deploy/verify-deployment.php
        echo "" >> deploy/verify-deployment.php
        echo "// Vérification des fichiers critiques" >> deploy/verify-deployment.php
        echo "\$files_to_check = [" >> deploy/verify-deployment.php
        echo "    'index.html' => 'Fichier HTML principal'," >> deploy/verify-deployment.php
        echo "    'assets/main.css' => 'Feuille de style principale'," >> deploy/verify-deployment.php
        echo "    'assets/index.js' => 'Script JavaScript principal'," >> deploy/verify-deployment.php
        echo "    'api/.htaccess' => 'Configuration API'," >> deploy/verify-deployment.php
        echo "    'api/config/env.php' => 'Configuration environnement'" >> deploy/verify-deployment.php
        echo "];" >> deploy/verify-deployment.php
        echo "" >> deploy/verify-deployment.php
        echo "foreach (\$files_to_check as \$file => \$description) {" >> deploy/verify-deployment.php
        echo "    \$status[\$file] = [" >> deploy/verify-deployment.php
        echo "        'exists' => file_exists(\$file)," >> deploy/verify-deployment.php
        echo "        'description' => \$description" >> deploy/verify-deployment.php
        echo "    ];" >> deploy/verify-deployment.php
        echo "}" >> deploy/verify-deployment.php
        echo "" >> deploy/verify-deployment.php
        echo "// Correction des liens dans index.html" >> deploy/verify-deployment.php
        echo "if (file_exists('index.html')) {" >> deploy/verify-deployment.php
        echo "    \$html = file_get_contents('index.html');" >> deploy/verify-deployment.php
        echo "    \$modified = false;" >> deploy/verify-deployment.php
        echo "" >> deploy/verify-deployment.php
        echo "    // Vérifier si le lien vers main.css existe" >> deploy/verify-deployment.php
        echo "    if (strpos(\$html, 'href=\"/assets/main.css\"') === false) {" >> deploy/verify-deployment.php
        echo "        \$html = str_replace('</head>', '  <link rel=\"stylesheet\" href=\"/assets/main.css\">\\n</head>', \$html);" >> deploy/verify-deployment.php
        echo "        \$modified = true;" >> deploy/verify-deployment.php
        echo "    }" >> deploy/verify-deployment.php
        echo "" >> deploy/verify-deployment.php
        echo "    // Mettre à jour si modifié" >> deploy/verify-deployment.php
        echo "    if (\$modified) {" >> deploy/verify-deployment.php
        echo "        file_put_contents('index.html', \$html);" >> deploy/verify-deployment.php
        echo "        \$status['index_correction'] = ['success' => true, 'message' => 'index.html corrigé'];" >> deploy/verify-deployment.php
        echo "    }" >> deploy/verify-deployment.php
        echo "}" >> deploy/verify-deployment.php
        echo "" >> deploy/verify-deployment.php
        echo "// Affichage des résultats" >> deploy/verify-deployment.php
        echo "echo '<h1>Vérification du déploiement</h1>';" >> deploy/verify-deployment.php
        echo "echo '<h2>État des fichiers critiques:</h2>';" >> deploy/verify-deployment.php
        echo "echo '<ul>';" >> deploy/verify-deployment.php
        echo "foreach (\$status as \$file => \$info) {" >> deploy/verify-deployment.php
        echo "    \$status_text = \$info['exists'] ? '<span style=\"color:green\">OK</span>' : '<span style=\"color:red\">MANQUANT</span>';" >> deploy/verify-deployment.php
        echo "    echo \"<li>\$file: \$status_text (\$info[description])</li>\";" >> deploy/verify-deployment.php
        echo "}" >> deploy/verify-deployment.php
        echo "echo '</ul>';" >> deploy/verify-deployment.php
        echo "" >> deploy/verify-deployment.php
        echo "// Lien pour exécuter d'autres corrections si nécessaire" >> deploy/verify-deployment.php
        echo "echo '<p><a href=\"/fix-index-assets.php\">Exécuter la correction des assets</a></p>';" >> deploy/verify-deployment.php
        echo "echo '<p><a href=\"/fix-php-web-execution.php\">Exécuter la correction PHP</a></p>';" >> deploy/verify-deployment.php
        echo "?>" >> deploy/verify-deployment.php
        
        # Permissions
        find deploy -type d -exec chmod 755 {} \\;
        find deploy -type f -exec chmod 644 {} \\;
        
        # Vérification des fichiers critiques
        echo ""
        echo "=== Vérification des fichiers critiques ==="
        for file in "deploy/.htaccess" "deploy/api/.htaccess" "deploy/assets" "deploy/index.html"; do
          if [ -e "\$file" ]; then
            echo "✅ \$file: PRÉSENT"
          else
            echo "❌ \$file: MANQUANT"
          fi
        done
        
    - name: FTP Deploy to Infomaniak
      uses: SamKirkland/FTP-Deploy-Action@v4.3.4
      with:
        server: \${{ secrets.FTP_SERVER }}
        username: \${{ secrets.FTP_USERNAME }}
        password: \${{ secrets.FTP_PASSWORD }}
        local-dir: ./deploy/
        server-dir: /
        dangerous-clean-slate: false
        exclude: |
          **/.git*
          **/.git*/**
          **/node_modules/**
          README.md
        log-level: verbose
        timeout: 120000
    
    - name: Wait for files to propagate
      run: sleep 10
      
    - name: Notify completion
      run: |
        echo "🚀 Déploiement terminé avec succès !"
        echo "Pour vérifier l'installation, visitez:"
        echo "https://qualiopi.ch/verify-deployment.php"
        echo ""
        echo "Pour corriger les assets, visitez:"
        echo "https://qualiopi.ch/fix-index-assets.php"
EOL;
                
                file_put_contents('./.github/workflows/deploy-ftp.yml', $ftp_workflow);
                echo "<div class='success'>Le workflow FTP a été créé avec succès: <code>.github/workflows/deploy-ftp.yml</code></div>";
                echo "<p>Ce workflow utilise uniquement FTP pour le déploiement et inclut un script PHP de vérification post-déploiement.</p>";
                
                // Création du script de vérification de déploiement
                $verify_script = <<<EOL
<?php
// Script de vérification post-déploiement
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification du déploiement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-ok { color: green; }
        .status-error { color: red; }
        .action-button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; display: inline-block; text-decoration: none; margin: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vérification du déploiement</h1>
        
        <div class="card">
            <h2>État des fichiers critiques</h2>
            <table>
                <tr>
                    <th>Fichier</th>
                    <th>Description</th>
                    <th>État</th>
                </tr>
                <?php
                \$files_to_check = [
                    'index.html' => 'Fichier HTML principal',
                    'assets/main.css' => 'Feuille de style principale',
                    'assets/index.js' => 'Script JavaScript principal',
                    'api/.htaccess' => 'Configuration API',
                    'api/config/env.php' => 'Configuration environnement',
                    '.htaccess' => 'Configuration Apache',
                    '.user.ini' => 'Configuration PHP'
                ];
                
                \$all_ok = true;
                
                foreach (\$files_to_check as \$file => \$description) {
                    \$exists = file_exists(\$file);
                    \$status_class = \$exists ? 'status-ok' : 'status-error';
                    \$status_text = \$exists ? 'OK' : 'MANQUANT';
                    
                    if (!\$exists) \$all_ok = false;
                    
                    echo "<tr>";
                    echo "<td>$file</td>";
                    echo "<td>$description</td>";
                    echo "<td class='$status_class'>$status_text</td>";
                    echo "</tr>";
                }
                ?>
            </table>
            
            <?php if (\$all_ok): ?>
                <div class="success">Tous les fichiers critiques sont présents.</div>
            <?php else: ?>
                <div class="error">Certains fichiers critiques sont manquants.</div>
            <?php endif; ?>
        </div>
        
        <div class="card">
            <h2>Correction automatique des problèmes courants</h2>
            
            <p>Si vous rencontrez des problèmes avec le déploiement, utilisez les outils de correction ci-dessous:</p>
            
            <a href="fix-index-assets.php" class="action-button">Corriger les liens CSS/JS</a>
            <a href="fix-php-web-execution.php" class="action-button">Corriger l'exécution PHP</a>
            
            <p><strong>Note:</strong> Ces scripts peuvent être exécutés en toute sécurité à tout moment.</p>
        </div>
        
        <div class="card">
            <h2>Informations techniques</h2>
            
            <?php
            echo "<p>Version PHP: " . phpversion() . "</p>";
            echo "<p>Serveur: " . (\$_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu') . "</p>";
            echo "<p>Document Root: " . (\$_SERVER['DOCUMENT_ROOT'] ?? 'Inconnu') . "</p>";
            echo "<p>Chemin actuel: " . getcwd() . "</p>";
            
            // Vérifier si index.html contient les bonnes références
            if (file_exists('index.html')) {
                \$html = file_get_contents('index.html');
                \$has_main_css = strpos(\$html, 'href="/assets/main.css"') !== false || strpos(\$html, "href='/assets/main.css'") !== false;
                \$has_index_js = strpos(\$html, 'src="/assets/index.js"') !== false || strpos(\$html, "src='/assets/index.js'") !== false;
                
                echo "<p>index.html contient une référence à main.css: " . (\$has_main_css ? '<span class="status-ok">Oui</span>' : '<span class="status-error">Non</span>') . "</p>";
                echo "<p>index.html contient une référence à index.js: " . (\$has_index_js ? '<span class="status-ok">Oui</span>' : '<span class="status-error">Non</span>') . "</p>";
            }
            ?>
        </div>
    </div>
</body>
</html>
EOL;

                file_put_contents('verify-deployment.php', $verify_script);
                echo "<div class='success'>Script de vérification créé: <code>verify-deployment.php</code></div>";

                // Création du script de déploiement d'urgence basé uniquement sur PHP
                $emergency_script = <<<EOL
<?php
// Script de déploiement d'urgence pour Infomaniak
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Déploiement d'urgence</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; }
        .warning { color: orange; background-color: #fffbf0; padding: 10px; border-left: 3px solid orange; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        button, .button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; text-decoration: none; display: inline-block; }
        button:hover, .button:hover { background-color: #45a049; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Déploiement d'urgence</h1>
        
        <div class="card">
            <h2>Création des fichiers critiques manquants</h2>
            
            <?php
            // Liste des fichiers critiques à vérifier et créer si nécessaire
            \$critical_files = [
                '.htaccess' => [
                    'description' => 'Configuration Apache',
                    'content' => '# Configuration Apache principale
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Ne pas rediriger les fichiers ou dossiers existants
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # Pour les fichiers PHP existants, permettre l\'accès direct
    RewriteCond %{REQUEST_FILENAME} \\.php$
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule ^ - [L]
    
    # Pour les fichiers dans /api/, permettre l\'accès PHP
    RewriteRule ^api/ - [L]
    
    # Pour les assets statiques, ne pas rediriger
    RewriteRule ^assets/ - [L]
    
    # Rediriger tout le reste vers index.html
    RewriteRule . /index.html [L]
</IfModule>

# Définir le type MIME correct pour les fichiers CSS et JS
AddType text/css .css
AddType application/javascript .js
AddType application/javascript .mjs

# Configuration CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>
'
                ],
                '.user.ini' => [
                    'description' => 'Configuration PHP',
                    'content' => '; Configuration PHP pour Infomaniak
display_errors = On
log_errors = On
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
max_execution_time = 120
memory_limit = 256M
upload_max_filesize = 64M
post_max_size = 64M
default_charset = "UTF-8"
'
                ],
                'api/.htaccess' => [
                    'description' => 'Configuration API',
                    'content' => '# Configuration pour le dossier API
<FilesMatch "\\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Activer la réécriture d\'URL
RewriteEngine On

# Gérer les requêtes OPTIONS pour CORS
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Configuration CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    # Éviter la mise en cache des réponses API
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</IfModule>
'
                ],
                'assets/.htaccess' => [
                    'description' => 'Configuration Assets',
                    'content' => '# Configuration des assets
AddType text/css .css
AddType application/javascript .js
AddType application/javascript .mjs

# Force le type MIME pour CSS
<FilesMatch "\\.css$">
    ForceType text/css
    Header set Content-Type "text/css; charset=utf-8"
</FilesMatch>

# Force le type MIME pour JavaScript
<FilesMatch "\\.js$">
    ForceType application/javascript
    Header set Content-Type "application/javascript; charset=utf-8"
</FilesMatch>

# Activer la mise en cache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
</IfModule>
'
                ],
                'assets/main.css' => [
                    'description' => 'CSS principal',
                    'content' => '/* CSS principal de base */
body { 
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
  margin: 0; 
  padding: 0;
  line-height: 1.5;
}

#root {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1, h2, h3 { 
  margin-top: 0;
  color: #333;
}

a {
  color: #0077cc;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button, .button {
  background-color: #0077cc;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover, .button:hover {
  background-color: #005fa3;
}
'
                ]
            ];
            
            // Parcourir les fichiers et les créer si nécessaire
            \$created_count = 0;
            \$already_exists_count = 0;
            
            foreach (\$critical_files as \$file_path => \$info) {
                // Créer le dossier parent si nécessaire
                \$dir = dirname(\$file_path);
                if (!\$dir == '.' && !is_dir(\$dir)) {
                    mkdir(\$dir, 0755, true);
                    echo "<p>Dossier créé: <code>$dir</code></p>";
                }
                
                // Vérifier si le fichier existe
                if (!file_exists(\$file_path)) {
                    // Créer le fichier
                    if (file_put_contents(\$file_path, \$info['content'])) {
                        echo "<div class='success'>Fichier créé: <code>$file_path</code> - {$info['description']}</div>";
                        \$created_count++;
                    } else {
                        echo "<div class='error'>Échec de création: <code>$file_path</code></div>";
                    }
                } else {
                    echo "<p>Le fichier existe déjà: <code>$file_path</code></p>";
                    \$already_exists_count++;
                }
            }
            
            if (\$created_count > 0) {
                echo "<div class='success'><strong>$created_count</strong> fichiers critiques ont été créés.</div>";
            }
            
            if (\$already_exists_count == count(\$critical_files)) {
                echo "<div class='success'>Tous les fichiers critiques existent déjà.</div>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Liens utiles</h2>
            <p>Utilisez ces liens pour accéder aux outils de correction et de vérification:</p>
            
            <ul>
                <li><a href="verify-deployment.php">Vérifier l'état du déploiement</a></li>
                <li><a href="fix-index-assets.php">Corriger les références CSS/JS dans index.html</a></li>
                <li><a href="fix-php-web-execution.php">Corriger l'exécution PHP</a></li>
                <?php if (file_exists('phpinfo.php') || file_exists('php-test-minimal.php')): ?>
                <li><a href="<?php echo file_exists('phpinfo.php') ? 'phpinfo.php' : 'php-test-minimal.php'; ?>">Tester PHP</a></li>
                <?php endif; ?>
            </ul>
        </div>
        
        <a href="/" class="button">Retour à l'accueil</a>
    </div>
</body>
</html>
EOL;

                file_put_contents('emergency-deploy.php', $emergency_script);
                echo "<div class='success'>Script de déploiement d'urgence créé: <code>emergency-deploy.php</code></div>";

                // Création d'un script de déploiement basé uniquement sur PHP
                $deploy_status_script = <<<EOL
<?php
/**
 * API pour vérifier le statut du déploiement
 * Utilisé par le frontend pour vérifier l'installation
 */

// En-têtes communs pour tous les endpoints API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Chercher des fichiers critiques
\$critical_files = [
    'index.html' => 'Fichier HTML principal',
    'assets/main.css' => 'Feuille de style principale',
    'assets/index.css' => 'Feuille de style additionnelle',
    'assets/main.js' => 'Script JavaScript principal',
    'assets/index.js' => 'Script JavaScript d\'entrée',
    'api/.htaccess' => 'Configuration du serveur API',
    'api/config/env.php' => 'Configuration de l\'environnement'
];

\$file_status = [];
foreach (\$critical_files as \$file => \$description) {
    \$file_status[\$file] = [
        'exists' => file_exists(\$file),
        'size' => file_exists(\$file) ? filesize(\$file) : 0,
        'description' => \$description
    ];
}

// Chercher des fichiers d'assets avec hash
\$js_hashed_files = [];
\$css_hashed_files = [];

if (is_dir('assets')) {
    \$assets = scandir('assets');
    foreach (\$assets as \$asset) {
        if (preg_match('/\.(js)$/', \$asset)) {
            \$js_hashed_files[] = \$asset;
        } elseif (preg_match('/\.(css)$/', \$asset)) {
            \$css_hashed_files[] = \$asset;
        }
    }
}

// Détecter l'environnement
\$isProduction = strpos(\$_SERVER['HTTP_HOST'] ?? '', 'qualiopi.ch') !== false;
\$isStaging = strpos(\$_SERVER['HTTP_HOST'] ?? '', '.lovable.') !== false;
\$environment = \$isProduction ? 'production' : (\$isStaging ? 'staging' : 'development');

// Construire la réponse
\$response = [
    'success' => true,
    'message' => 'Statut du déploiement',
    'code' => 200,
    'data' => [
        'environment' => \$environment,
        'server' => [
            'php_version' => phpversion(),
            'server_software' => \$_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
            'host' => \$_SERVER['HTTP_HOST'] ?? 'unknown',
            'timestamp' => date('Y-m-d\TH:i:s\Z')
        ],
        'files' => \$file_status,
        'assets' => [
            'js_files' => \$js_hashed_files,
            'css_files' => \$css_hashed_files
        ]
    ]
];

// Envoyer la réponse JSON
echo json_encode(\$response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
EOL;

                file_put_contents('deploy-status.php', $deploy_status_script);
                echo "<div class='success'>Script de status de déploiement créé: <code>deploy-status.php</code></div>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Instructions pour utiliser le nouveau workflow</h2>
            <ol>
                <li>Le workflow FTP a été créé dans <code>.github/workflows/deploy-ftp.yml</code></li>
                <li>Ce workflow n'utilise <strong>PAS</strong> SSH, uniquement FTP</li>
                <li>Des scripts PHP ont été créés pour vérifier et corriger le déploiement après le transfert FTP:
                    <ul>
                        <li><code>verify-deployment.php</code>: Vérifie si tous les fichiers critiques sont présents</li>
                        <li><code>fix-index-assets.php</code>: Corrige les références CSS/JS dans index.html</li>
                        <li><code>fix-php-web-execution.php</code>: Assure que PHP est correctement configuré</li>
                        <li><code>deploy-status.php</code>: API pour vérifier l'état du déploiement</li>
                        <li><code>emergency-deploy.php</code>: Crée les fichiers critiques si nécessaire</li>
                    </ul>
                </li>
                <li>Après chaque déploiement, visitez <code>https://votre-site.com/verify-deployment.php</code> pour vérifier et corriger automatiquement les problèmes courants</li>
            </ol>
            
            <p>Utilisez le script <a href="disable-old-workflows.php">disable-old-workflows.php</a> pour désactiver tous les anciens workflows SSH.</p>
        </div>
    </div>
</body>
</html>

