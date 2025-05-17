
<?php
// Script pour vérifier et corriger le chemin SSH dans les workflows GitHub Actions
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des chemins SSH pour GitHub Actions</title>
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
        <h1>Vérification des chemins SSH pour GitHub Actions</h1>
        
        <div class="card">
            <h2>Vérification du chemin actuel</h2>
            <?php
            $current_dir = getcwd();
            $expected_path = "/sites/qualiopi.ch";
            $home_path = getenv("HOME");
            
            echo "<p>Chemin actuel: <code>$current_dir</code></p>";
            echo "<p>Chemin attendu: <code>$expected_path</code></p>";
            echo "<p>Dossier HOME: <code>$home_path</code></p>";
            
            if (strpos($current_dir, $expected_path) !== false) {
                echo "<div class='success'>Le chemin actuel contient le chemin attendu.</div>";
            } else {
                echo "<div class='warning'>Le chemin actuel ne contient pas le chemin attendu.</div>";
            }
            
            // Vérifier si le dossier existe
            if (is_dir($expected_path)) {
                echo "<div class='success'>Le dossier $expected_path existe.</div>";
            } else {
                echo "<div class='error'>Le dossier $expected_path n'existe pas.</div>";
                
                // Proposer de créer le dossier
                if (isset($_POST['create_dir'])) {
                    if (mkdir($expected_path, 0755, true)) {
                        echo "<div class='success'>Le dossier $expected_path a été créé avec succès.</div>";
                    } else {
                        echo "<div class='error'>Impossible de créer le dossier $expected_path.</div>";
                    }
                } else {
                    echo "<form method='post'>";
                    echo "<button type='submit' name='create_dir'>Créer le dossier $expected_path</button>";
                    echo "</form>";
                }
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Workflows GitHub Actions</h2>
            <?php
            $workflow_dir = './.github/workflows';
            $files = [];
            
            if (is_dir($workflow_dir)) {
                $files = scandir($workflow_dir);
                $files = array_filter($files, function($file) {
                    return pathinfo($file, PATHINFO_EXTENSION) === 'yml';
                });
            }
            
            if (empty($files)) {
                echo "<div class='warning'>Aucun fichier de workflow trouvé dans $workflow_dir</div>";
            } else {
                echo "<p>Fichiers de workflow trouvés:</p>";
                echo "<ul>";
                foreach ($files as $file) {
                    echo "<li><code>$file</code></li>";
                    
                    // Vérifier si le fichier contient des configurations SSH
                    $content = file_get_contents("$workflow_dir/$file");
                    $has_ssh_action = strpos($content, 'appleboy/ssh-action') !== false;
                    $has_cd_command = strpos($content, 'cd /sites/qualiopi.ch') !== false;
                    
                    if ($has_ssh_action) {
                        echo " - <span class='warning'>Utilise appleboy/ssh-action</span>";
                        
                        if ($has_cd_command) {
                            echo " - <span class='warning'>Contient une commande 'cd /sites/qualiopi.ch'</span>";
                        }
                        
                        // Proposer de corriger le workflow
                        echo "<form method='post'>";
                        echo "<input type='hidden' name='fix_workflow' value='$file'>";
                        echo "<button type='submit'>Corriger le chemin dans $file</button>";
                        echo "</form>";
                    }
                }
                echo "</ul>";
                
                // Si on demande de corriger un workflow
                if (isset($_POST['fix_workflow'])) {
                    $file_to_fix = $_POST['fix_workflow'];
                    $file_path = "$workflow_dir/$file_to_fix";
                    
                    if (file_exists($file_path)) {
                        // Faire une sauvegarde
                        copy($file_path, "$file_path.bak");
                        
                        $content = file_get_contents($file_path);
                        $fixed_content = preg_replace(
                            '/cd \/sites\/qualiopi\.ch\//m',
                            "echo \"Chemin actuel: \$(pwd)\"\ncd ~ && cd sites/qualiopi.ch/",
                            $content
                        );
                        
                        if ($content !== $fixed_content) {
                            file_put_contents($file_path, $fixed_content);
                            echo "<div class='success'>Le workflow $file_to_fix a été corrigé. Une sauvegarde a été créée: $file_to_fix.bak</div>";
                        } else {
                            echo "<div class='warning'>Aucune modification n'a été apportée à $file_to_fix</div>";
                        }
                    }
                }
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Script de correction du chemin SSH</h2>
            <p>Ce script peut être ajouté à vos workflows pour corriger automatiquement le problème de chemin:</p>
            <pre>
- name: Fix SSH Path Issue
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.FTP_SERVER }}
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    script: |
      echo "Chemin actuel: $(pwd)"
      if [ ! -d "/sites/qualiopi.ch" ]; then
        echo "Le dossier /sites/qualiopi.ch n'existe pas"
        # Essayer des chemins alternatifs
        for DIR in ~/sites/qualiopi.ch ~/www/qualiopi.ch ~/qualiopi.ch; do
          if [ -d "$DIR" ]; then
            echo "Trouvé: $DIR"
            cd "$DIR"
            break
          fi
        done
      else
        cd /sites/qualiopi.ch
      fi
      echo "Nouveau chemin: $(pwd)"
      ls -la
            </pre>
            
            <h3>Créer un workflow unifié</h3>
            <form method="post">
                <button type="submit" name="create_unified_workflow">Créer un workflow unifié optimisé</button>
            </form>
            
            <?php
            if (isset($_POST['create_unified_workflow'])) {
                if (!is_dir('./.github/workflows')) {
                    mkdir('./.github/workflows', 0755, true);
                }
                
                $unified_workflow = <<<EOL
name: Unified Deploy to Infomaniak

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
        
        # Copier les scripts de correction
        cp fix-php-web-execution.php deploy/ || echo "Création du script de correction PHP..."
        cp fix-index-assets.php deploy/ || echo "Création du script de correction des assets..."
        
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
        
        # Permissions
        find deploy -type d -exec chmod 755 {} \\;
        find deploy -type f -exec chmod 644 {} \\;
        
    - name: FTP Deploy to Infomaniak
      uses: SamKirkland/FTP-Deploy-Action@v4.3.4
      with:
        server: \${{ secrets.FTP_SERVER }}
        username: \${{ secrets.FTP_USERNAME }}
        password: \${{ secrets.FTP_PASSWORD }}
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
        
    - name: Fix SSH Path Issue
      uses: appleboy/ssh-action@master
      with:
        host: \${{ secrets.FTP_SERVER }}
        username: \${{ secrets.FTP_USERNAME }}
        password: \${{ secrets.FTP_PASSWORD }}
        script: |
          # Trouver le bon chemin
          echo "Chemin actuel: \$(pwd)"
          
          # Vérifier si le chemin /sites/qualiopi.ch existe
          if [ ! -d "/sites/qualiopi.ch" ]; then
            echo "Le dossier /sites/qualiopi.ch n'existe pas"
            
            # Essayer plusieurs chemins possibles
            FOUND=0
            for DIR in ~/sites/qualiopi.ch ~/www/qualiopi.ch ~/qualiopi.ch ~/www ~/sites ~; do
              if [ -d "\$DIR" ]; then
                echo "Trouvé: \$DIR"
                cd "\$DIR"
                FOUND=1
                break
              fi
            done
            
            if [ \$FOUND -eq 0 ]; then
              echo "Aucun dossier de déploiement trouvé"
              ls -la ~/ # Lister les dossiers dans le répertoire home
              exit 1
            fi
          else
            cd /sites/qualiopi.ch
          fi
          
          echo "Nouveau chemin: \$(pwd)"
          ls -la
          
          # Vérifier les fichiers critiques
          echo "=== Vérification post-déploiement ==="
          [ -f "assets/main.css" ] && echo "✅ assets/main.css: PRÉSENT" || echo "❌ assets/main.css: MANQUANT"
          [ -f "index.html" ] && echo "✅ index.html: PRÉSENT" || echo "❌ index.html: MANQUANT"
          [ -f "api/.htaccess" ] && echo "✅ api/.htaccess: PRÉSENT" || echo "❌ api/.htaccess: MANQUANT"
          [ -f "api/config/env.php" ] && echo "✅ api/config/env.php: PRÉSENT" || echo "❌ api/config/env.php: MANQUANT"
          [ -f "assets/index.js" ] && echo "✅ assets/index.js: PRÉSENT" || echo "❌ assets/index.js: MANQUANT"
          [ -f "assets/main.js" ] && echo "✅ assets/main.js: PRÉSENT" || echo "❌ assets/main.js: MANQUANT"
          
          # Exécuter les scripts de correction si PHP est disponible
          if command -v php &> /dev/null; then
            echo "PHP disponible, exécution des scripts de correction..."
            [ -f "fix-index-assets.php" ] && php -f fix-index-assets.php
            [ -f "fix-php-web-execution.php" ] && php -f fix-php-web-execution.php
          else
            echo "PHP n'est pas disponible en ligne de commande"
          fi
EOL;
                
                file_put_contents('./.github/workflows/deploy-unified.yml', $unified_workflow);
                echo "<div class='success'>Le workflow unifié a été créé avec succès: <code>.github/workflows/deploy-unified.yml</code></div>";
                echo "<p>Ce workflow utilise une approche plus robuste pour la détection du chemin de déploiement.</p>";
            }
            ?>
        </div>
    </div>
</body>
</html>
