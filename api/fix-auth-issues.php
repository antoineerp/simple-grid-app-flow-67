
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic et correction des problèmes d'authentification</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .card { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Diagnostic et correction des problèmes d'authentification</h1>

        <!-- Section 1: Vérification du fichier env.php -->
        <div class="card">
            <h2>1. Vérification du fichier env.php</h2>
            <?php
            $env_path = __DIR__ . '/config/env.php';
            $env_example_path = __DIR__ . '/config/env.example.php';
            $env_exists = file_exists($env_path);
            
            if ($env_exists) {
                echo "<p>Fichier env.php: <span class='success'>TROUVÉ</span></p>";
                echo "<p>Chemin: " . $env_path . "</p>";
                
                // Vérifier si le fichier est lisible
                if (is_readable($env_path)) {
                    echo "<p>Le fichier est lisible: <span class='success'>OUI</span></p>";
                    
                    // Vérifier le contenu (sans afficher les mots de passe)
                    include_once($env_path);
                    echo "<p>Variables définies:</p><ul>";
                    foreach (['DB_HOST', 'DB_NAME', 'DB_USER', 'API_BASE_URL', 'APP_ENV'] as $var) {
                        echo "<li>$var: " . (defined($var) ? "<span class='success'>DÉFINIE</span>" : "<span class='error'>NON DÉFINIE</span>") . "</li>";
                    }
                    echo "<li>DB_PASS: " . (defined('DB_PASS') ? "<span class='success'>DÉFINIE</span> (valeur masquée)" : "<span class='error'>NON DÉFINIE</span>") . "</li>";
                    echo "</ul>";
                    
                    // Vérifier les fonctions d'aide
                    echo "<p>Fonction get_env(): " . (function_exists('get_env') ? "<span class='success'>DÉFINIE</span>" : "<span class='error'>NON DÉFINIE</span>") . "</p>";
                    echo "<p>Fonction env(): " . (function_exists('env') ? "<span class='success'>DÉFINIE</span>" : "<span class='error'>NON DÉFINIE</span>") . "</p>";
                } else {
                    echo "<p>Le fichier n'est pas lisible: <span class='error'>ERREUR DE PERMISSION</span></p>";
                }
            } else {
                echo "<p>Fichier env.php: <span class='error'>MANQUANT</span></p>";
                
                if (file_exists($env_example_path)) {
                    echo "<p>Le fichier exemple (env.example.php) est présent et peut être utilisé comme base.</p>";
                } else {
                    echo "<p>Fichier exemple env.example.php également manquant.</p>";
                }
            }
            
            if (isset($_POST['fix_env_file']) && !$env_exists) {
                // Créer le fichier env.php s'il n'existe pas
                $env_content = <<<EOT
<?php
// Configuration des variables d'environnement pour Infomaniak
define('DB_HOST', 'p71x6d.myd.infomaniak.com');
define('DB_NAME', 'p71x6d_richard');
define('DB_USER', 'p71x6d_richard');
define('DB_PASS', 'Trottinette43!');
define('API_BASE_URL', '/api');
define('APP_ENV', 'production');

// Fonction d'aide pour récupérer les variables d'environnement
function get_env(\$key, \$default = null) {
    \$const_name = strtoupper(\$key);
    if (defined(\$const_name)) {
        return constant(\$const_name);
    }
    return \$default;
}

// Alias pour compatibilité avec différentes syntaxes
if (!function_exists('env')) {
    function env(\$key, \$default = null) {
        return get_env(\$key, \$default);
    }
}
?>
EOT;
                
                // S'assurer que le répertoire config existe
                $config_dir = __DIR__ . '/config';
                if (!is_dir($config_dir)) {
                    mkdir($config_dir, 0755, true);
                }
                
                // Écrire le fichier
                $result = file_put_contents($env_path, $env_content);
                if ($result !== false) {
                    echo "<p><span class='success'>Le fichier env.php a été créé avec succès!</span></p>";
                    chmod($env_path, 0644); // Permissions standard
                } else {
                    echo "<p><span class='error'>Impossible de créer le fichier env.php. Vérifiez les permissions.</span></p>";
                }
            }
            ?>
            
            <?php if (!$env_exists): ?>
            <form method="post">
                <button type="submit" name="fix_env_file" class="fix-button">Créer le fichier env.php</button>
            </form>
            <?php endif; ?>
        </div>
        
        <!-- Section 2: Vérification des types MIME -->
        <div class="card">
            <h2>2. Vérification des types MIME</h2>
            <?php
            // Vérifier les configurations des types MIME
            $htaccess_path = dirname(__DIR__) . '/.htaccess';
            $api_htaccess_path = __DIR__ . '/.htaccess';
            
            $htaccess_exists = file_exists($htaccess_path);
            $api_htaccess_exists = file_exists($api_htaccess_path);
            
            echo "<p>Fichier .htaccess principal: " . ($htaccess_exists ? "<span class='success'>TROUVÉ</span>" : "<span class='error'>MANQUANT</span>") . "</p>";
            echo "<p>Fichier .htaccess API: " . ($api_htaccess_exists ? "<span class='success'>TROUVÉ</span>" : "<span class='error'>MANQUANT</span>") . "</p>";
            
            if ($htaccess_exists) {
                $htaccess_content = file_get_contents($htaccess_path);
                $has_mime_types = strpos($htaccess_content, 'AddType application/javascript .js') !== false;
                echo "<p>Configuration des types MIME dans .htaccess: " . ($has_mime_types ? "<span class='success'>TROUVÉE</span>" : "<span class='warning'>NON TROUVÉE</span>") . "</p>";
            }
            
            if ($api_htaccess_exists) {
                $api_htaccess_content = file_get_contents($api_htaccess_path);
                $has_api_mime_types = strpos($api_htaccess_content, 'AddType application/javascript .js') !== false;
                echo "<p>Configuration des types MIME dans .htaccess API: " . ($has_api_mime_types ? "<span class='success'>TROUVÉE</span>" : "<span class='warning'>NON TROUVÉE</span>") . "</p>";
            }
            
            // Vérification des en-têtes de réponse pour les fichiers JavaScript
            $js_file = "../assets/index.js";
            $js_mime_type = "inconnu";
            
            if (file_exists($js_file)) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $js_mime_type = finfo_file($finfo, $js_file);
                finfo_close($finfo);
                
                echo "<p>Type MIME détecté pour index.js: $js_mime_type " . 
                    (($js_mime_type == 'application/javascript' || $js_mime_type == 'text/javascript') ? 
                    "<span class='success'>(CORRECT)</span>" : 
                    "<span class='warning'>(DEVRAIT ÊTRE application/javascript)</span>") . "</p>";
            } else {
                echo "<p>Fichier JavaScript index.js non trouvé pour test MIME.</p>";
            }
            
            if (isset($_POST['fix_mime_types'])) {
                // Mise à jour du .htaccess principal
                $mime_config = <<<EOT
# Configuration des types MIME pour corriger les problèmes JavaScript/CSS
AddType application/javascript .js
AddType application/json .json
AddType text/css .css

# Force le bon type MIME pour les JavaScript
<FilesMatch "\.js$">
    ForceType application/javascript
    Header set Content-Type "application/javascript"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

# Force le bon type MIME pour les CSS
<FilesMatch "\.css$">
    ForceType text/css
    Header set Content-Type "text/css"
</FilesMatch>

# Configuration CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>
EOT;

                if ($htaccess_exists) {
                    if (strpos($htaccess_content, 'AddType application/javascript .js') === false) {
                        $updated_content = $htaccess_content . "\n" . $mime_config;
                        file_put_contents($htaccess_path, $updated_content);
                        echo "<p><span class='success'>Configuration MIME ajoutée au fichier .htaccess principal</span></p>";
                    } else {
                        echo "<p><span class='success'>Le fichier .htaccess principal contient déjà la configuration MIME</span></p>";
                    }
                } else {
                    file_put_contents($htaccess_path, $mime_config);
                    echo "<p><span class='success'>Nouveau fichier .htaccess principal créé avec configuration MIME</span></p>";
                }
                
                // Mise à jour du .htaccess API
                $api_mime_config = <<<EOT
# Configuration MIME pour l'API
AddType application/javascript .js
AddType application/json .json

# Autoriser explicitement l'exécution de PHP
<Files *.php>
    SetHandler application/x-httpd-php
</Files>

# Configuration des en-têtes
<IfModule mod_headers.c>
    # Force le bon type MIME pour les JavaScript
    <FilesMatch "\.js$">
        ForceType application/javascript
        Header set Content-Type "application/javascript"
        Header set X-Content-Type-Options "nosniff"
    </FilesMatch>
    
    # Configuration CORS
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    # Éviter la mise en cache des réponses API
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</IfModule>

# Rediriger toutes les requêtes vers index.php sauf pour les fichiers existants
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
EOT;

                if ($api_htaccess_exists) {
                    if (strpos($api_htaccess_content, 'AddType application/javascript .js') === false) {
                        $updated_api_content = $api_htaccess_content . "\n" . $api_mime_config;
                        file_put_contents($api_htaccess_path, $updated_api_content);
                        echo "<p><span class='success'>Configuration MIME ajoutée au fichier .htaccess API</span></p>";
                    } else {
                        echo "<p><span class='success'>Le fichier .htaccess API contient déjà la configuration MIME</span></p>";
                    }
                } else {
                    file_put_contents($api_htaccess_path, $api_mime_config);
                    echo "<p><span class='success'>Nouveau fichier .htaccess API créé avec configuration MIME</span></p>";
                }
            }
            ?>
            
            <form method="post">
                <button type="submit" name="fix_mime_types" class="fix-button">Corriger les types MIME</button>
            </form>
        </div>
        
        <!-- Section 3: Vérification du processus d'authentification -->
        <div class="card">
            <h2>3. Test du processus d'authentification</h2>
            <?php
            function makeTestRequest($url, $data) {
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HEADER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                    'Accept: application/json'
                ]);
                
                $response = curl_exec($ch);
                $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $headers = substr($response, 0, $header_size);
                $body = substr($response, $header_size);
                
                curl_close($ch);
                return [
                    'code' => $httpCode,
                    'headers' => $headers,
                    'body' => $body
                ];
            }
            
            if (isset($_POST['test_auth'])) {
                $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
                $base_url = "$protocol://$host";
                
                echo "<h3>Test de AUTH.PHP</h3>";
                $auth_url = "$base_url/api/auth.php";
                $auth_data = [
                    'username' => 'antcirier@gmail.com',
                    'password' => 'Trottinette43!'
                ];
                
                echo "<p>URL testée: $auth_url</p>";
                
                $auth_result = makeTestRequest($auth_url, $auth_data);
                
                echo "<p>Code de réponse: {$auth_result['code']}</p>";
                echo "<pre>" . htmlspecialchars($auth_result['body']) . "</pre>";
                
                if ($auth_result['code'] >= 200 && $auth_result['code'] < 300) {
                    echo "<p><span class='success'>Le script d'authentification répond correctement!</span></p>";
                    
                    // Vérifier si la réponse est un JSON valide
                    $json_response = json_decode($auth_result['body'], true);
                    if ($json_response !== null) {
                        echo "<p>Réponse JSON valide</p>";
                        
                        if (isset($json_response['token'])) {
                            echo "<p><span class='success'>Token JWT reçu avec succès!</span></p>";
                        } else {
                            echo "<p><span class='error'>Pas de token JWT dans la réponse</span></p>";
                        }
                    } else {
                        echo "<p><span class='error'>La réponse n'est pas un JSON valide</span></p>";
                    }
                } else {
                    echo "<p><span class='error'>Erreur lors de l'appel à auth.php</span></p>";
                }
                
                echo "<h3>Test des redirections</h3>";
                echo "<p>Vérification si /api/login.php redirige correctement vers auth.php</p>";
                
                $login_url = "$base_url/api/login.php";
                $login_result = makeTestRequest($login_url, $auth_data);
                
                echo "<p>URL testée: $login_url</p>";
                echo "<p>Code de réponse: {$login_result['code']}</p>";
                echo "<pre>" . htmlspecialchars($login_result['body']) . "</pre>";
                
                if ($login_result['code'] >= 200 && $login_result['code'] < 300) {
                    echo "<p><span class='success'>Le script login.php répond correctement!</span></p>";
                    
                    // Vérifier si les réponses sont identiques (redirection fonctionnelle)
                    $login_json = json_decode($login_result['body'], true);
                    $auth_json = json_decode($auth_result['body'], true);
                    
                    if ($login_json && $auth_json && isset($login_json['token']) && isset($auth_json['token'])) {
                        echo "<p><span class='success'>La redirection vers auth.php fonctionne correctement!</span></p>";
                    } else {
                        echo "<p><span class='warning'>Les réponses de login.php et auth.php sont différentes</span></p>";
                    }
                } else {
                    echo "<p><span class='error'>Erreur lors de l'appel à login.php</span></p>";
                }
            }
            ?>
            
            <form method="post">
                <button type="submit" name="test_auth" class="fix-button">Tester l'authentification</button>
            </form>
        </div>
        
        <!-- Section 4: Recommandations -->
        <div class="card">
            <h2>4. Recommandations</h2>
            <p>Pour résoudre les problèmes d'authentification:</p>
            <ol>
                <li>Assurez-vous que le fichier <code>env.php</code> existe dans le dossier <code>api/config/</code></li>
                <li>Vérifiez que les types MIME sont correctement configurés dans les fichiers <code>.htaccess</code></li>
                <li>Testez l'authentification en utilisant l'utilisateur <code>antcirier@gmail.com</code> avec le mot de passe <code>Trottinette43!</code></li>
                <li>Vérifiez les logs d'erreur du serveur pour plus d'informations</li>
                <li>Si les problèmes persistent, essayez le script <code>api/login-test.php</code> qui contient une implémentation simplifiée de l'authentification</li>
            </ol>
        </div>
    </div>
</body>
</html>
