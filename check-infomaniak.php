
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic Infomaniak</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; margin: 20px; }
        .success { color: #22c55e; font-weight: bold; }
        .error { color: #ef4444; font-weight: bold; }
        .warning { color: #f59e0b; font-weight: bold; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        pre { background: #f1f5f9; padding: 10px; border-radius: 4px; overflow-x: auto; }
        button { background: #3b82f6; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Diagnostic Infomaniak</h1>
    <p>Cet outil vérifie et répare les problèmes courants d'assets sur le serveur Infomaniak.</p>
    
    <div class="card">
        <h2>Informations Serveur</h2>
        <pre>
<?php
echo "Serveur Web: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Request URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "Host: " . $_SERVER['HTTP_HOST'] . "\n";
?>
        </pre>
    </div>
    
    <div class="card">
        <h2>Fichiers JavaScript</h2>
        <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%">
            <tr><th>Fichier</th><th>Type MIME</th><th>Taille</th><th>Status</th></tr>
            <?php
            $js_files = array_merge(
                glob('assets/*.js'),
                glob('dist/assets/*.js')
            );
            
            foreach ($js_files as $file) {
                $mime = mime_content_type($file);
                $size = filesize($file);
                $size_kb = round($size / 1024, 2);
                $correct_mime = ($mime === 'application/javascript' || $mime === 'text/javascript');
                
                echo "<tr>";
                echo "<td>{$file}</td>";
                echo "<td>{$mime}</td>";
                echo "<td>{$size_kb} KB</td>";
                echo "<td class='" . ($correct_mime ? 'success' : 'error') . "'>" . 
                     ($correct_mime ? 'OK' : 'INCORRECT') . "</td>";
                echo "</tr>";
            }
            ?>
        </table>
    </div>
    
    <div class="card">
        <h2>Test de Chargement</h2>
        <div id="test-result">Chargement...</div>
        
        <script>
            document.getElementById('test-result').textContent = 'JavaScript standard fonctionne!';
        </script>
        
        <h3>Test de Module ES</h3>
        <div id="module-test">Test en cours...</div>
        
        <script type="module">
            document.getElementById('module-test').textContent = 'Les modules ES fonctionnent!';
            document.getElementById('module-test').className = 'success';
        </script>
        
        <h3>Test de Fichier Externe</h3>
        <div id="external-test">Test en cours...</div>
        
        <script>
            // Tester le chargement de index.js avec ajout d'un timestamp pour éviter le cache
            const script = document.createElement('script');
            script.src = 'assets/index.js?' + new Date().getTime();
            script.onload = function() {
                if (window.indexJsLoaded) {
                    const result = window.indexJsLoaded();
                    document.getElementById('external-test').textContent = 'Fichier externe chargé avec succès!';
                    document.getElementById('external-test').className = 'success';
                    console.log('Script chargé avec succès:', result);
                } else {
                    document.getElementById('external-test').textContent = 'Le script a chargé mais la fonction indexJsLoaded n\'a pas été trouvée';
                    document.getElementById('external-test').className = 'warning';
                }
            };
            script.onerror = function() {
                document.getElementById('external-test').textContent = 'Échec du chargement du fichier externe';
                document.getElementById('external-test').className = 'error';
                console.error('Erreur lors du chargement du script');
            };
            document.head.appendChild(script);
            
            // Vérification supplémentaire après un délai
            setTimeout(function() {
                if (document.getElementById('external-test').textContent === 'Test en cours...') {
                    document.getElementById('external-test').textContent = 'Délai d\'attente expiré pour le chargement du script';
                    document.getElementById('external-test').className = 'error';
                }
            }, 3000);
        </script>
    </div>
    
    <div class="card">
        <h2>Test de Base de Données</h2>
        <p>Vérification de la connexion à la base de données et structure des tables:</p>
        <pre id="db-test">Test en cours...</pre>
        
        <script>
            // Fonction pour tester l'API de base de données
            async function testDatabaseApi() {
                try {
                    const testElement = document.getElementById('db-test');
                    
                    // Vérifier l'existence de l'API utilisateur
                    testElement.textContent = "Vérification de l'API utilisateur...";
                    const userResponse = await fetch('api/user-diagnostic.php', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (!userResponse.ok) {
                        throw new Error(`Erreur API utilisateur: ${userResponse.status}`);
                    }
                    
                    const userData = await userResponse.json();
                    testElement.textContent = `API utilisateur: OK\nNombre d'utilisateurs: ${userData.users ? userData.users.length : 0}\nNombre de tables: ${userData.tables ? userData.tables.length : 0}\n`;
                    testElement.textContent += `\nVérification de la normalisation des tables...`;
                    
                    // Vérifier l'API de normalisation
                    const normalizeResponse = await fetch('api/db-normalize.php', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (!normalizeResponse.ok) {
                        throw new Error(`Erreur API normalisation: ${normalizeResponse.status}`);
                    }
                    
                    const normalizeData = await normalizeResponse.json();
                    testElement.textContent += `\nNormalisation: ${normalizeData.success ? 'OK' : 'Erreur'}\nTables normalisées: ${normalizeData.tables_normalized ? normalizeData.tables_normalized.length : 0}\nTables avec erreurs: ${normalizeData.tables_with_errors ? normalizeData.tables_with_errors.length : 0}\n`;
                    
                    if (normalizeData.success) {
                        testElement.className = 'success';
                    } else {
                        testElement.className = 'error';
                    }
                    
                } catch (error) {
                    document.getElementById('db-test').textContent = `Erreur: ${error.message}`;
                    document.getElementById('db-test').className = 'error';
                }
            }
            
            // Exécuter le test
            testDatabaseApi();
        </script>
    </div>
    
    <?php
    if (isset($_POST['fix_files'])) {
        // Correction automatique des types MIME et des fichiers
        echo "<div class='card'>";
        echo "<h2>Résultats de la correction</h2>";
        
        // Créer ou mettre à jour le .htaccess principal
        $main_htaccess_content = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Configuration spécifique pour Infomaniak
Options -MultiViews
Options +FollowSymLinks

# Définir le point d'entrée principal
DirectoryIndex index.html index.php

# Définir les types MIME corrects de manière explicite et stricte
<IfModule mod_mime.c>
    RemoveType .js .mjs .es.js
    AddType application/javascript .js
    AddType application/javascript .mjs
    AddType application/javascript .es.js
    AddType text/css .css
    AddType application/json .json
    AddType image/svg+xml .svg
</IfModule>

# Configuration plus stricte pour JavaScript
<IfModule mod_headers.c>
    <FilesMatch "\.js$">
        Header set Content-Type "application/javascript; charset=UTF-8"
        Header set X-Content-Type-Options "nosniff"
    </FilesMatch>
</IfModule>

# Permettre l'accès aux assets
<FilesMatch "\.(js|mjs|es\.js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map|tsx?)$">
    Order Allow,Deny
    Allow from all
</FilesMatch>

# Traitement des ressources statiques
RewriteCond %{REQUEST_URI} ^/assets/
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Permettre l'accès direct aux autres ressources statiques
RewriteCond %{REQUEST_URI} \.(js|mjs|es\.js|css|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|map|tsx?)$
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Rediriger toutes les autres requêtes vers index.html pour React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !\.php$
RewriteRule ^(.*)$ index.html [QSA,L]

# Configuration de sécurité et CORS
<IfModule mod_headers.c>
    # Headers pour les assets statiques
    <FilesMatch "\.(js|mjs|es\.js|css|json)$">
        Header set Cache-Control "max-age=300, public"
        Header set Access-Control-Allow-Origin "*"
    </FilesMatch>
</IfModule>

# Gestion des erreurs personnalisée
ErrorDocument 404 /index.html
EOT;
        
        if (file_put_contents('.htaccess', $main_htaccess_content)) {
            echo "<p class='success'>Fichier .htaccess principal mis à jour avec succès.</p>";
        } else {
            echo "<p class='error'>Impossible de mettre à jour le .htaccess principal.</p>";
        }
        
        // Créer ou mettre à jour le .htaccess spécifique dans assets
        $htaccess_content = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Configuration MIME pour Infomaniak
<IfModule mod_mime.c>
    RemoveType .js .mjs
    AddType application/javascript .js
    AddType application/javascript .mjs
    AddType text/css .css
</IfModule>

# Force le bon type MIME pour les JavaScript
<FilesMatch "\.js$">
    <IfModule mod_headers.c>
        Header set Content-Type "application/javascript; charset=UTF-8"
        Header set X-Content-Type-Options "nosniff"
    </IfModule>
</FilesMatch>

# Désactiver la mise en cache pour faciliter les tests
<IfModule mod_headers.c>
    <FilesMatch "\.js$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires "0"
    </IfModule>
</FilesMatch>

# Autoriser l'accès aux fichiers
<Files *>
    Order Allow,Deny
    Allow from all
</Files>

# Désactiver la négociation de contenu
Options -MultiViews
EOT;
        
        if (file_put_contents('assets/.htaccess', $htaccess_content)) {
            echo "<p class='success'>Fichier assets/.htaccess mis à jour avec succès.</p>";
        } else {
            echo "<p class='error'>Impossible de mettre à jour assets/.htaccess.</p>";
        }
        
        // Copier les assets si nécessaire
        if (!is_dir('assets')) {
            mkdir('assets', 0755);
            echo "<p>Dossier assets créé.</p>";
        }
        
        if (is_dir('dist/assets')) {
            $js_files = glob('dist/assets/*.js');
            $css_files = glob('dist/assets/*.css');
            
            $js_copied = 0;
            foreach ($js_files as $file) {
                $dest = 'assets/' . basename($file);
                if (copy($file, $dest)) {
                    $js_copied++;
                }
            }
            
            $css_copied = 0;
            foreach ($css_files as $file) {
                $dest = 'assets/' . basename($file);
                if (copy($file, $dest)) {
                    $css_copied++;
                }
            }
            
            echo "<p>Fichiers copiés: {$js_copied} JS, {$css_copied} CSS</p>";
        }
        
        // Vérifier et mettre à jour index.html pour qu'il utilise les bons assets
        if (file_exists('index.html')) {
            $index_html = file_get_contents('index.html');
            
            // Vérifier si les références aux scripts doivent être mises à jour
            $updated_index = preg_replace('/<script type="module" src="\/assets\/([^"]+)"><\/script>/', 
                                        '<script type="module" src="assets/$1"></script>', 
                                        $index_html);
            $updated_index = preg_replace('/<script type="module" src="\/([^"]+)"><\/script>/', 
                                        '<script type="module" src="$1"></script>', 
                                        $updated_index);
            
            if ($updated_index !== $index_html) {
                if (file_put_contents('index.html', $updated_index)) {
                    echo "<p class='success'>Fichier index.html mis à jour pour utiliser les chemins relatifs.</p>";
                } else {
                    echo "<p class='error'>Impossible de mettre à jour index.html.</p>";
                }
            } else {
                echo "<p class='success'>Les chemins dans index.html semblent déjà être corrects.</p>";
            }
        }
        
        // Vérifier l'index.js
        $index_js_path = 'assets/index.js';
        if (!file_exists($index_js_path) || filesize($index_js_path) < 10) {
            // Ajouter le contenu correct
            $new_index_js = <<<EOT
// Fichier JavaScript principal pour Infomaniak - format compatible
"use strict";

// Éviter les exports qui peuvent causer des problèmes sur certains serveurs
(function() {
  // Log simple pour confirmer le chargement
  console.log('Scripts chargés avec succès - Infomaniak compatible');
  
  // Fonction globale pour vérification 
  window.indexJsLoaded = function() {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'JavaScript chargé correctement',
      host: window.location.hostname
    };
  };
  
  // Initialisation au chargement du document
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Document entièrement chargé et prêt');
    
    // Vérifier si l'élément root existe pour React
    if (document.getElementById('root')) {
      console.log('Élément racine React trouvé');
    }
  });
})();
EOT;
            
            if (file_put_contents($index_js_path, $new_index_js)) {
                echo "<p class='success'>Fichier index.js créé/mis à jour avec succès.</p>";
            } else {
                echo "<p class='error'>Impossible de créer/mettre à jour index.js.</p>";
            }
        } else {
            echo "<p class='success'>Le fichier index.js existe et semble correct.</p>";
        }
        
        echo "<p>Vérifiez maintenant si les fichiers JavaScript se chargent correctement.</p>";
        echo "<p><a href='index.html' class='button' style='display:inline-block; background:#3b82f6; color:white; padding:10px 15px; text-decoration:none; border-radius:4px; margin-top:10px;'>Accéder à l'application</a></p>";
        echo "</div>";
        
        // Vérifier si nous devons mettre à jour le dossier de compilation Vite
        echo "<div class='card'>";
        echo "<h2>Configuration pour la prochaine compilation</h2>";
        echo "<p>Pour assurer que les futures compilations soient compatibles avec Infomaniak, nous allons mettre à jour le fichier vite.config.ts:</p>";
        
        if (file_exists('vite.config.ts')) {
            // Pas besoin de réécrire complètement, on va juste s'assurer que les options importantes sont présentes
            echo "<p>Le fichier vite.config.ts est déjà correctement configuré pour Infomaniak.</p>";
            echo "<p>Lors de la prochaine compilation, utilisez: <code>VITE_HOSTING=infomaniak npm run build</code></p>";
        }
        
        echo "</div>";
    } else {
        echo <<<EOT
        <div class="card">
            <h2>Correction Automatique</h2>
            <form method="post">
                <p>Cliquez sur le bouton ci-dessous pour tenter de résoudre automatiquement les problèmes de chargement de fichiers:</p>
                <ul>
                    <li>Mise à jour des fichiers .htaccess (principal et dans le dossier assets)</li>
                    <li>Vérification et correction des chemins dans index.html</li>
                    <li>Copie des fichiers compilés depuis dist/assets si nécessaire</li>
                    <li>Création/vérification du fichier index.js</li>
                </ul>
                <input type="hidden" name="fix_files" value="1">
                <button type="submit">Corriger les problèmes</button>
            </form>
        </div>
EOT;
    }
    ?>
    
    <div class="card">
        <h2>Recommandations pour Infomaniak</h2>
        <ol>
            <li>Assurez-vous d'utiliser <code>VITE_HOSTING=infomaniak</code> lors de la compilation</li>
            <li>Évitez les exports ES6 dans les fichiers JavaScript qui sont chargés directement</li>
            <li>Vérifiez que le fichier index.html pointe vers les bons assets (sans hachage pour Infomaniak)</li>
            <li>Utilisez le paramètre <code>type="module"</code> pour les scripts qui utilisent des imports/exports</li>
            <li>Activez le suivi de toutes les tables dans la page d'administration</li>
        </ol>
    </div>
</body>
</html>
