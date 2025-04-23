
<?php
// Script de diagnostic des problèmes de routage
header('Content-Type: text/html; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic de Routage PHP</title>
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6; 
            color: #333;
        }
        h1, h2, h3 { color: #334155; }
        .section { 
            margin-bottom: 20px; 
            border: 1px solid #e2e8f0; 
            border-radius: 8px; 
            padding: 20px; 
            background-color: #f8fafc; 
        }
        .success { color: #15803d; font-weight: 600; }
        .error { color: #b91c1c; font-weight: 600; }
        .warning { color: #b45309; font-weight: 600; }
        .code { 
            font-family: monospace; 
            background-color: #f1f5f9; 
            padding: 10px; 
            border-radius: 4px; 
            overflow: auto;
            white-space: pre-wrap;
        }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        table, th, td { border: 1px solid #e2e8f0; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f1f5f9; }
        .btn {
            display: inline-block;
            padding: 8px 16px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <h1>Diagnostic des Problèmes de Routage PHP</h1>
    <p>Cet outil analyse les problèmes courants de routage, en particulier pour les environnements Infomaniak.</p>
    
    <div class="section">
        <h2>1. Informations Serveur</h2>
        <?php
        echo "<table>";
        echo "<tr><th>Variable</th><th>Valeur</th></tr>";
        echo "<tr><td>Serveur Web</td><td>" . ($_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible') . "</td></tr>";
        echo "<tr><td>Document Root</td><td>" . ($_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible') . "</td></tr>";
        echo "<tr><td>Script Filename</td><td>" . ($_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible') . "</td></tr>";
        echo "<tr><td>Request URI</td><td>" . ($_SERVER['REQUEST_URI'] ?? 'Non disponible') . "</td></tr>";
        echo "<tr><td>Script Name</td><td>" . ($_SERVER['SCRIPT_NAME'] ?? 'Non disponible') . "</td></tr>";
        echo "<tr><td>PHP Self</td><td>" . ($_SERVER['PHP_SELF'] ?? 'Non disponible') . "</td></tr>";
        echo "<tr><td>Host</td><td>" . ($_SERVER['HTTP_HOST'] ?? 'Non disponible') . "</td></tr>";
        echo "</table>";
        
        // Vérifier si Apache mod_rewrite est chargé
        $mod_rewrite_loaded = function_exists('apache_get_modules') ? 
            in_array('mod_rewrite', apache_get_modules()) : 
            'Impossible à vérifier (fonction apache_get_modules non disponible)';
        
        echo "<h3>État du mod_rewrite Apache :</h3>";
        echo "<p>" . (is_bool($mod_rewrite_loaded) && $mod_rewrite_loaded ? 
            "<span class='success'>mod_rewrite est chargé</span>" : 
            "<span class='warning'>" . $mod_rewrite_loaded . "</span>") . "</p>";
        
        // Vérifier si le serveur est Infomaniak
        $is_infomaniak = (strpos(strtolower($_SERVER['SERVER_SOFTWARE'] ?? ''), 'infomaniak') !== false) ||
                        (strpos(strtolower($_SERVER['HTTP_HOST'] ?? ''), 'infomaniak') !== false) ||
                        (strpos(strtolower($_SERVER['HTTP_HOST'] ?? ''), 'qualiopi.ch') !== false);
                        
        echo "<p>Détection Infomaniak : " . 
            ($is_infomaniak ? "<span class='success'>Oui</span>" : "<span class='warning'>Non</span>") . 
            "</p>";
        ?>
    </div>
    
    <div class="section">
        <h2>2. Test du Fichier .htaccess</h2>
        <?php
        // Vérifier l'existence et le contenu du fichier .htaccess principal
        $htaccess_path = $_SERVER['DOCUMENT_ROOT'] . '/.htaccess';
        $htaccess_exists = file_exists($htaccess_path);
        
        echo "<p>Fichier .htaccess : " . 
            ($htaccess_exists ? 
                "<span class='success'>Existe</span> (" . filesize($htaccess_path) . " octets)" : 
                "<span class='error'>N'existe pas</span>") . 
            "</p>";
            
        if ($htaccess_exists) {
            echo "<h3>Contenu du .htaccess :</h3>";
            echo "<div class='code'>" . htmlspecialchars(file_get_contents($htaccess_path)) . "</div>";
            
            // Vérifier les règles importantes
            $htaccess_content = file_get_contents($htaccess_path);
            $has_rewrite_engine = stripos($htaccess_content, 'RewriteEngine On') !== false;
            $has_index_redirect = stripos($htaccess_content, 'RewriteRule ^(?!api/) index.html') !== false;
            $has_api_redirect = stripos($htaccess_content, 'RewriteRule ^api') !== false;
            
            echo "<h3>Vérification des règles cruciales :</h3>";
            echo "<ul>";
            echo "<li>RewriteEngine activé : " . 
                ($has_rewrite_engine ? "<span class='success'>Oui</span>" : "<span class='error'>Non</span>") . "</li>";
            echo "<li>Redirection vers index.html : " . 
                ($has_index_redirect ? "<span class='success'>Oui</span>" : "<span class='error'>Non</span>") . "</li>";
            echo "<li>Redirection API : " . 
                ($has_api_redirect ? "<span class='success'>Oui</span>" : "<span class='error'>Non</span>") . "</li>";
            echo "</ul>";
        }
        
        // Vérifier le .htaccess du dossier API
        $api_htaccess = $_SERVER['DOCUMENT_ROOT'] . '/api/.htaccess';
        $api_htaccess_exists = file_exists($api_htaccess);
        
        echo "<h3>Fichier .htaccess du dossier API :</h3>";
        echo "<p>" . 
            ($api_htaccess_exists ? 
                "<span class='success'>Existe</span> (" . filesize($api_htaccess) . " octets)" : 
                "<span class='error'>N'existe pas</span>") . 
            "</p>";
            
        if ($api_htaccess_exists) {
            echo "<div class='code'>" . htmlspecialchars(file_get_contents($api_htaccess)) . "</div>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>3. Tests d'Accessibilité des Fichiers</h2>
        <?php
        // Tester l'accessibilité de fichiers importants
        $files_to_test = [
            '/api/test.php' => 'Test PHP simple',
            '/api/test-json.php' => 'Test JSON',
            '/api/index.php' => 'Point d\'entrée API',
            '/index.html' => 'Interface utilisateur',
            '/route-diagnostic.php' => 'Ce fichier de diagnostic'
        ];
        
        echo "<table>";
        echo "<tr><th>Fichier</th><th>Description</th><th>Existe</th><th>URL Complète</th><th>Test</th></tr>";
        
        foreach ($files_to_test as $file => $description) {
            $full_path = $_SERVER['DOCUMENT_ROOT'] . $file;
            $exists = file_exists($full_path);
            $full_url = 'https://' . $_SERVER['HTTP_HOST'] . $file;
            
            echo "<tr>";
            echo "<td>" . $file . "</td>";
            echo "<td>" . $description . "</td>";
            echo "<td>" . ($exists ? 
                "<span class='success'>Oui</span>" : 
                "<span class='error'>Non</span>") . "</td>";
            echo "<td>" . $full_url . "</td>";
            echo "<td><a href='" . $full_url . "' target='_blank' class='btn'>Tester</a></td>";
            echo "</tr>";
        }
        
        echo "</table>";
        
        // Créer un fichier de test PHP simple si nécessaire
        if (!file_exists($_SERVER['DOCUMENT_ROOT'] . '/api/test-json.php')) {
            $test_content = '<?php
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");
header("Pragma: no-cache");
header("Expires: 0");

echo json_encode([
    "status" => "success",
    "message" => "API PHP fonctionne correctement",
    "timestamp" => date("Y-m-d H:i:s"),
    "php_version" => phpversion(),
    "server" => $_SERVER["SERVER_SOFTWARE"] ?? "Unknown"
]);
?>';
            
            if (file_put_contents($_SERVER['DOCUMENT_ROOT'] . '/api/test-json.php', $test_content)) {
                echo "<p><span class='success'>Un fichier de test JSON a été créé : /api/test-json.php</span></p>";
            }
        }
        ?>
    </div>
    
    <div class="section">
        <h2>4. Analyse du Routage ReactJS</h2>
        <?php
        // Examiner index.html pour les références à ReactJS et au routage
        $index_path = $_SERVER['DOCUMENT_ROOT'] . '/index.html';
        $index_exists = file_exists($index_path);
        
        if ($index_exists) {
            $index_content = file_get_contents($index_path);
            
            echo "<p>Fichier index.html : <span class='success'>Trouvé</span></p>";
            
            // Vérifier les références clés
            $has_root_div = stripos($index_content, '<div id="root">') !== false;
            $has_react_script = stripos($index_content, 'src="./src/main') !== false || 
                               stripos($index_content, 'src="/src/main') !== false ||
                               stripos($index_content, 'src="./assets/') !== false ||
                               stripos($index_content, 'src="/assets/') !== false;
            
            echo "<h3>Points clés pour le routage React :</h3>";
            echo "<ul>";
            echo "<li>Div racine (id=\"root\") : " . 
                ($has_root_div ? "<span class='success'>Présent</span>" : "<span class='error'>Absent</span>") . "</li>";
            echo "<li>Script React : " . 
                ($has_react_script ? "<span class='success'>Présent</span>" : "<span class='error'>Absent</span>") . "</li>";
            echo "</ul>";
            
            // Vérifier si le script pointe vers le bon emplacement
            if (preg_match('/<script[^>]*src=["\'](\.?\/src\/[^"\']*)["\'][^>]*>/', $index_content, $matches)) {
                echo "<p><span class='warning'>ATTENTION : Le script pointe vers '/src/' : " . htmlspecialchars($matches[1]) . "</span></p>";
                echo "<p>Ceci peut causer des problèmes. Il devrait pointer vers '/assets/' après le build.</p>";
            }
        } else {
            echo "<p><span class='error'>Fichier index.html introuvable !</span></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>5. Test de la Redirection API</h2>
        <?php
        // Créer un script de test de redirection
        $redirect_test_path = $_SERVER['DOCUMENT_ROOT'] . '/api/redirect-test.php';
        $redirect_test_content = '<?php
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");

echo json_encode([
    "status" => "success",
    "message" => "Test de redirection API réussi",
    "timestamp" => date("Y-m-d H:i:s"),
    "request_uri" => $_SERVER["REQUEST_URI"],
    "script_name" => $_SERVER["SCRIPT_NAME"]
]);
?>';

        if (file_put_contents($redirect_test_path, $redirect_test_content)) {
            echo "<p><span class='success'>Un fichier de test de redirection a été créé : /api/redirect-test.php</span></p>";
            
            echo "<p>Testez les URLs suivantes pour vérifier le routage API :</p>";
            echo "<ul>";
            echo "<li><a href='/api/redirect-test.php' target='_blank' class='btn'>Test direct: /api/redirect-test.php</a></li>";
            echo "</ul>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>6. Recommandations pour Corriger les Problèmes de Routage</h2>
        <h3>Pour les erreurs 404 sur les fichiers PHP :</h3>
        <ol>
            <li>Vérifiez que mod_rewrite est activé sur le serveur</li>
            <li>Assurez-vous que les fichiers .htaccess sont correctement chargés (AllowOverride All dans la configuration d'Apache)</li>
            <li>Vérifiez que les chemins dans les règles de réécriture sont corrects</li>
            <li>Pour Infomaniak, assurez-vous que PHP est activé dans le gestionnaire d'hébergement</li>
        </ol>
        
        <h3>Pour les erreurs 404 sur les routes React :</h3>
        <ol>
            <li>Vérifiez que la règle de redirection vers index.html est correcte dans le .htaccess</li>
            <li>Assurez-vous que BrowserRouter est configuré correctement dans l'application React</li>
            <li>Vérifiez que les assets sont correctement référencés dans index.html</li>
            <li>Si vous utilisez un chemin de base (basename), assurez-vous qu'il est correctement défini dans le BrowserRouter</li>
        </ol>
        
        <?php
        // Proposer une correction du .htaccess si nécessaire
        if ($htaccess_exists && (!$has_rewrite_engine || !$has_index_redirect || !$has_api_redirect)) {
            echo "<h3>Correction Suggérée pour le .htaccess :</h3>";
            echo "<p>Le fichier .htaccess actuel semble manquer de règles importantes. Voici une version améliorée :</p>";
            
            $improved_htaccess = '# Activer le moteur de réécriture
RewriteEngine On
RewriteBase /

# Force execution of PHP scripts
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Add MIME type and handler for PHP files
AddType application/x-httpd-php .php
AddHandler application/x-httpd-php .php

# Rediriger les requêtes API vers le dossier API
RewriteRule ^api(/.*)?$ api$1 [L]

# Traiter explicitement les fichiers PHP
<FilesMatch "\.php$">
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule ^(.*)$ $1 [L,E=SCRIPT:$1]
</FilesMatch>

# Toutes les autres requêtes sont envoyées à index.html pour le routage React
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!api/) index.html [L]

# Fichiers index par défaut
DirectoryIndex index.html index.php

# Encodage UTF-8 par défaut
AddDefaultCharset UTF-8

# Désactiver la mise en cache pour les fichiers PHP
<FilesMatch "\.php$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
</FilesMatch>';

            echo "<div class='code'>" . htmlspecialchars($improved_htaccess) . "</div>";
            
            echo "<form method='post'>";
            echo "<input type='hidden' name='fix_htaccess' value='1'>";
            echo "<button type='submit' class='btn'>Appliquer ces corrections au .htaccess</button>";
            echo "</form>";
            
            // Traiter la soumission du formulaire
            if (isset($_POST['fix_htaccess'])) {
                // Sauvegarder l'ancien .htaccess
                copy($htaccess_path, $htaccess_path . '.backup');
                
                if (file_put_contents($htaccess_path, $improved_htaccess)) {
                    echo "<p><span class='success'>Le fichier .htaccess a été mis à jour ! Une sauvegarde a été créée : .htaccess.backup</span></p>";
                } else {
                    echo "<p><span class='error'>Impossible de mettre à jour le fichier .htaccess. Vérifiez les permissions.</span></p>";
                }
            }
        }
        ?>
    </div>
    
    <p><em>Diagnostic généré le <?php echo date('Y-m-d H:i:s'); ?></em></p>
    
    <p>
        <a href="/" class="btn">Retour à l'accueil</a>
        <a href="/check-php-assets.php" class="btn">Diagnostic des assets</a>
    </p>
</body>
</html>

