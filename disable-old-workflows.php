
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Nettoyage des workflows GitHub</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; }
        .warning { color: orange; background-color: #fffbf0; padding: 10px; border-left: 3px solid orange; }
        button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Nettoyage des workflows GitHub</h1>
        
        <div class="card">
            <h2>État actuel des workflows</h2>
            <?php
            $workflow_dir = './.github/workflows';
            $workflows = [];
            
            // Vérifier si le répertoire existe
            if (!is_dir($workflow_dir)) {
                echo "<div class='error'>Le répertoire des workflows n'existe pas. Création en cours...</div>";
                mkdir($workflow_dir, 0755, true);
                echo "<div class='success'>Répertoire créé avec succès!</div>";
            }
            
            // Lister tous les workflows existants
            if ($handle = opendir($workflow_dir)) {
                echo "<h3>Workflows détectés:</h3><ul>";
                while (false !== ($entry = readdir($handle))) {
                    if ($entry != "." && $entry != ".." && pathinfo($entry, PATHINFO_EXTENSION) === 'yml') {
                        echo "<li>$entry</li>";
                        $workflows[] = $entry;
                    }
                }
                closedir($handle);
                echo "</ul>";
                
                if (empty($workflows)) {
                    echo "<div class='warning'>Aucun workflow détecté.</div>";
                }
            }
            ?>
            
            <h3>Actions disponibles</h3>
            <form method="post">
                <button type="submit" name="disable_all">Désactiver tous les anciens workflows</button>
                <button type="submit" name="create_unified">Créer workflow unifié</button>
            </form>
            
            <?php
            // Traiter les actions
            if (isset($_POST['disable_all']) && !empty($workflows)) {
                echo "<div class='warning'>Désactivation des anciens workflows...</div>";
                foreach ($workflows as $workflow) {
                    // Ne pas désactiver le workflow unifié
                    if ($workflow !== 'deploy-unified.yml') {
                        $old_path = "$workflow_dir/$workflow";
                        $new_path = "$workflow_dir/$workflow.disabled";
                        if (rename($old_path, $new_path)) {
                            echo "<div class='success'>Workflow '$workflow' désactivé.</div>";
                        } else {
                            echo "<div class='error'>Impossible de désactiver '$workflow'.</div>";
                        }
                    }
                }
            }
            
            if (isset($_POST['create_unified'])) {
                echo "<div class='warning'>Création du workflow unifié...</div>";
                
                $unified_content = <<<EOT
name: Déploiement Unifié vers Infomaniak

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
    - name: Checkout du code source
      uses: actions/checkout@v3
      with:
        token: \${{ secrets.GITHUB_TOKEN }}

    - name: Configuration de Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Installation des dépendances
      run: npm install --legacy-peer-deps
      
    - name: Construction de l'application React
      run: npm run build
      
    - name: Préparation du déploiement (SIMPLIFIÉ)
      run: |
        echo "=== Déploiement Simplifié vers Infomaniak ==="
        echo "Date: \$(date)"
        
        # Création du dossier de déploiement
        mkdir -p deploy
        
        # Copie DIRECTE du dossier dist complet (CRUCIAL)
        cp -r dist deploy/
        echo "✅ Dossier dist/ copié entièrement"
        
        # Création des dossiers essentiels
        mkdir -p deploy/assets
        mkdir -p deploy/api/config
        mkdir -p deploy/api/utils
        mkdir -p deploy/api-tools
        mkdir -p deploy/public/lovable-uploads
        
        # Créer le fichier .gitkeep dans api-tools pour s'assurer que le dossier existe
        touch deploy/api-tools/.gitkeep
        
        # Créer index.php dans api-tools
        cat > deploy/api-tools/index.php << 'EOF'
<?php
// Redirection vers la vérification des routes
header('Location: check-routes.php');
exit;
?>
EOF
        
        # Créer check-routes.php
        cat > deploy/api-tools/check-routes.php << 'EOF'
<?php
header('Content-Type: text/html; charset=utf-8');
echo "<h1>Vérification des Routes</h1>";
echo "<p>Cet outil permet de vérifier les routes définies dans l'application.</p>";
?>
EOF
        
        # Copier les fichiers racine essentiels
        cp index.php deploy/ 2>/dev/null || echo "index.php copié depuis dist/"
        cp index.html deploy/ 2>/dev/null || cp dist/index.html deploy/ || echo "ERREUR: index.html non trouvé"
        cp .htaccess deploy/ 2>/dev/null || echo "Attention: .htaccess non trouvé"
        cp vite.config.ts deploy/ 2>/dev/null || echo "Attention: vite.config.ts non trouvé"
        
        # Copier les assets vers le dossier assets (sauvegarde)
        if [ -d "assets" ]; then
          cp -r assets/* deploy/assets/ 2>/dev/null || echo "Aucun asset à copier depuis assets/"
        fi
        
        # Copier les assets du build également
        if [ -d "dist/assets" ]; then
          cp -r dist/assets/* deploy/assets/ 2>/dev/null || echo "Aucun asset à copier depuis dist/assets/"
        fi
        
        # Configuration de la base de données
        cat > deploy/api/config/db_config.json << 'EOF'
{
    "host": "p71x6d.myd.infomaniak.com",
    "db_name": "p71x6d_richard",
    "username": "p71x6d_richard",
    "password": "Trottinette43!"
}
EOF
        
        # Configuration PHP
        cat > deploy/api/config/env.php << 'EOF'
<?php
// Configuration des variables d'environnement pour Infomaniak
define("DB_HOST", "p71x6d.myd.infomaniak.com");
define("DB_NAME", "p71x6d_richard");
define("DB_USER", "p71x6d_richard");
define("DB_PASS", "Trottinette43!");
define("API_BASE_URL", "/api");
define("APP_ENV", "production");

// Fonction d'aide pour récupérer les variables d'environnement
function get_env(\$key, \$default = null) {
    \$const_name = strtoupper(\$key);
    if (defined(\$const_name)) {
        return constant(\$const_name);
    }
    return \$default;
}
?>
EOF
        
        # Créer .htaccess pour l'API
        cat > deploy/api/.htaccess << 'EOF'
# Activer la réécriture d'URL
RewriteEngine On

# Configuration CORS
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"

# Rediriger toutes les requêtes vers index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
EOF
        
        # Vérifier les dossiers et fichiers critiques
        echo ""
        echo "=== Vérification des fichiers critiques ==="
        critical_files=(
          "deploy/dist/index.html"
          "deploy/assets"
          "deploy/api-tools/.gitkeep"
          "deploy/api-tools/index.php"
          "deploy/api-tools/check-routes.php"
          "deploy/api/config/db_config.json"
          "deploy/api/config/env.php"
          "deploy/api/.htaccess"
        )
        
        all_ok=true
        for file in "\${critical_files[@]}"; do
          if [ -e "\$file" ]; then
            echo "✅ \$file: PRÉSENT"
          else
            echo "❌ \$file: MANQUANT"
            all_ok=false
          fi
        done
        
        if [ "\$all_ok" = true ]; then
          echo "Tous les fichiers critiques sont présents!"
        else
          echo "ATTENTION: Certains fichiers critiques sont manquants!"
        fi
        
        # Liste la structure du dossier de déploiement
        echo ""
        echo "=== Structure du déploiement ==="
        find deploy -type d | sort

    - name: Synchronisation vers le serveur Infomaniak
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

    - name: Nettoyage
      run: rm -rf deploy
EOT;

                $unified_path = "$workflow_dir/deploy-unified.yml";
                if (file_put_contents($unified_path, $unified_content)) {
                    echo "<div class='success'>Workflow unifié créé avec succès!</div>";
                    echo "<p>Pour activer ce workflow, commettez et poussez ce fichier vers GitHub.</p>";
                } else {
                    echo "<div class='error'>Impossible de créer le workflow unifié.</div>";
                }
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Instructions pour utiliser le workflow unifié</h2>
            <ol>
                <li>Désactivez tous les anciens workflows en utilisant le bouton ci-dessus</li>
                <li>Créez le workflow unifié en utilisant le bouton ci-dessus</li>
                <li>Commettez et poussez les changements vers GitHub:
                    <pre>
git add .
git commit -m "Mise à jour du workflow de déploiement"
git push origin main</pre>
                </li>
                <li>Déclenchez manuellement le workflow depuis l'interface GitHub Actions ou attendez le prochain commit pour un déclenchement automatique</li>
                <li>Vérifiez les logs de déploiement pour vous assurer que tous les fichiers sont correctement copiés</li>
            </ol>
        </div>
    </div>
</body>
</html>
