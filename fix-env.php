
<?php
header('Content-Type: text/html; charset=utf-8');

// Chemins pour les fichiers de configuration
$env_path = './api/config/env.php';
$env_dir = dirname($env_path);

echo "<h1>Correction du fichier env.php</h1>";

// Vérifier si le dossier existe
if (!is_dir($env_dir)) {
    echo "<p>Création du dossier config...</p>";
    mkdir($env_dir, 0755, true);
}

// Contenu du fichier env.php
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

// Écrire le fichier
if (file_put_contents($env_path, $env_content)) {
    echo "<p style='color: green;'>✓ Le fichier env.php a été créé avec succès à {$env_path}</p>";
    
    // Vérifier les permissions
    chmod($env_path, 0644);
    echo "<p>Permissions du fichier définies à 0644</p>";
} else {
    echo "<p style='color: red;'>✗ Impossible de créer le fichier env.php. Vérifiez les permissions.</p>";
}

// Vérifier que le fichier est lisible
if (is_readable($env_path)) {
    echo "<p style='color: green;'>✓ Le fichier est lisible</p>";
} else {
    echo "<p style='color: red;'>✗ Le fichier n'est pas lisible. Vérifiez les permissions.</p>";
}

// Vérifier que le fichier est correctement inclus
try {
    include $env_path;
    if (defined('DB_HOST')) {
        echo "<p style='color: green;'>✓ Le fichier env.php est correctement inclus et les constantes sont définies</p>";
    } else {
        echo "<p style='color: red;'>✗ Le fichier env.php est inclus mais les constantes ne sont pas définies</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Erreur lors de l'inclusion du fichier: " . htmlspecialchars($e->getMessage()) . "</p>";
}

// Liens vers les tests
echo "<h2>Étapes suivantes</h2>";
echo "<ul>";
echo "<li><a href='test-env-paths.php'>Tester les chemins du fichier env.php</a></li>";
echo "<li><a href='api/test.php'>Tester l'API</a></li>";
echo "</ul>";
?>
