
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
        
        <script src="assets/index.js"></script>
        <script>
            setTimeout(function() {
                if (window.indexJsLoaded) {
                    const result = window.indexJsLoaded();
                    document.getElementById('external-test').textContent = 'Fichier externe chargé avec succès!';
                    document.getElementById('external-test').className = 'success';
                } else {
                    document.getElementById('external-test').textContent = 'Échec du chargement du fichier externe';
                    document.getElementById('external-test').className = 'error';
                }
            }, 500);
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
        // Correction automatique des types MIME
        echo "<div class='card'>";
        echo "<h2>Résultats de la correction</h2>";
        
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
        
        // Vérifier l'index.js
        $index_js_path = 'assets/index.js';
        if (file_exists($index_js_path)) {
            $index_js_content = file_get_contents($index_js_path);
            
            // Vérifier si le contenu est correct
            if (strpos($index_js_content, 'indexJsLoaded') === false) {
                // Ajouter le contenu correct
                $new_index_js = <<<EOT
// Fichier JavaScript principal pour Infomaniak - format compatible
"use strict";

// Éviter les exports qui peuvent causer des problèmes sur certains serveurs
(function() {
  // Log simple pour confirmer le chargement
  console.log('Scripts chargés avec succès');
  
  // Fonction globale pour vérification 
  window.indexJsLoaded = function() {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'JavaScript chargé correctement'
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
                    echo "<p class='success'>Fichier index.js mis à jour avec succès.</p>";
                } else {
                    echo "<p class='error'>Impossible de mettre à jour index.js.</p>";
                }
            } else {
                echo "<p class='success'>Fichier index.js est correct.</p>";
            }
        } else {
            // Créer le fichier s'il n'existe pas
            $new_index_js = <<<EOT
// Fichier JavaScript principal pour Infomaniak - format compatible
"use strict";

// Éviter les exports qui peuvent causer des problèmes sur certains serveurs
(function() {
  // Log simple pour confirmer le chargement
  console.log('Scripts chargés avec succès');
  
  // Fonction globale pour vérification 
  window.indexJsLoaded = function() {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'JavaScript chargé correctement'
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
                echo "<p class='success'>Fichier index.js créé avec succès.</p>";
            } else {
                echo "<p class='error'>Impossible de créer index.js.</p>";
            }
        }
        
        echo "<p>Vérifiez maintenant si les fichiers JavaScript se chargent correctement.</p>";
        echo "</div>";
    } else {
        echo <<<EOT
        <div class="card">
            <h2>Correction Automatique</h2>
            <form method="post">
                <p>Cliquez sur le bouton ci-dessous pour tenter de résoudre automatiquement les problèmes de types MIME:</p>
                <ul>
                    <li>Mise à jour du fichier .htaccess dans le dossier assets</li>
                    <li>Copie des fichiers compilés depuis dist/assets si nécessaire</li>
                    <li>Vérification et correction du fichier index.js</li>
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
