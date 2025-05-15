
<?php
header('Content-Type: text/plain');
echo "=== Création des fichiers API essentiels ===\n";
echo "Date d'exécution: " . date('Y-m-d H:i:s') . "\n\n";

// Fonction pour créer un répertoire s'il n'existe pas
function create_dir($path) {
    if (!is_dir($path)) {
        if (mkdir($path, 0755, true)) {
            echo "✓ Répertoire $path créé\n";
        } else {
            echo "✗ ERREUR: Impossible de créer $path\n";
            return false;
        }
    } else {
        echo "• Répertoire $path existe déjà\n";
    }
    return true;
}

// Fonction pour créer un fichier
function create_file($path, $content) {
    if (file_put_contents($path, $content)) {
        echo "✓ Fichier $path créé (" . strlen($content) . " octets)\n";
        chmod($path, 0644);
        return true;
    } else {
        echo "✗ ERREUR: Impossible de créer $path\n";
        return false;
    }
}

echo "Création des répertoires nécessaires...\n";
create_dir('api');
create_dir('api/config');
create_dir('api/controllers');
create_dir('api/models');
create_dir('api/utils');

echo "\nCréation des fichiers de base...\n";

// Fichier index.php racine
create_file('index.php', '<?php
// Redirection vers index.html
header("Location: index.html");
exit;
?>');

// Fichier phpinfo.php racine
create_file('phpinfo.php', '<?php
// Afficher les informations sur PHP
phpinfo();
?>');

// Fichier api/index.php
create_file('api/index.php', '<?php
// Point d\'entrée principal de l\'API
header("Content-Type: application/json");

// Vérifier si le fichier de configuration existe
if (!file_exists(__DIR__ . "/config/env.php")) {
    echo json_encode([
        "status" => "error",
        "message" => "Configuration file not found",
        "path" => __DIR__ . "/config/env.php"
    ]);
    exit;
}

// Charger la configuration
require_once __DIR__ . "/config/env.php";

// Traiter la requête
$method = $_SERVER["REQUEST_METHOD"];
$uri = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$uri = str_replace("/api/", "", $uri);
$uri = trim($uri, "/");

// Réponse par défaut
echo json_encode([
    "status" => "ok",
    "message" => "API works correctly",
    "endpoint" => $uri,
    "method" => $method,
    "timestamp" => date("Y-m-d H:i:s")
]);
?>');

// Fichier api/check.php
create_file('api/check.php', '<?php
header("Content-Type: application/json");
echo json_encode([
    "status" => "ok",
    "api" => "functional",
    "version" => "1.0",
    "time" => date("Y-m-d H:i:s"),
    "environment" => $_SERVER["SERVER_SOFTWARE"] ?? "unknown"
]);
?>');

// Fichier api/config/env.php
create_file('api/config/env.php', '<?php
// Configuration des variables d\'environnement pour Infomaniak
define("DB_HOST", "p71x6d.myd.infomaniak.com");
define("DB_NAME", "p71x6d_richard");
define("DB_USER", "p71x6d_richard");
define("DB_PASS", "Trottinette43!");
define("API_BASE_URL", "/api");
define("APP_ENV", "production");

// Fonction d\'aide pour récupérer les variables d\'environnement
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
?>');

// Fichier api/config/db_config.json
create_file('api/config/db_config.json', '{
    "host": "p71x6d.myd.infomaniak.com",
    "db_name": "p71x6d_richard",
    "username": "p71x6d_richard",
    "password": "Trottinette43!"
}');

// Fichier api/phpinfo.php
create_file('api/phpinfo.php', '<?php
// Afficher les informations sur PHP pour le dossier API
phpinfo();
?>');

// Fichier api/test.php
create_file('api/test.php', '<?php
header("Content-Type: application/json");

// Tester la connexion à la base de données
$db_success = false;
$db_message = "";

// Charger la configuration
if (file_exists(__DIR__ . "/config/env.php")) {
    require_once __DIR__ . "/config/env.php";
    
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        $db_success = true;
        $db_message = "Connected successfully to database";
    } catch (PDOException $e) {
        $db_message = "Database connection failed: " . $e->getMessage();
    }
} else {
    $db_message = "Config file not found";
}

echo json_encode([
    "status" => "ok",
    "message" => "API test successful",
    "timestamp" => date("Y-m-d H:i:s"),
    "db_connection" => [
        "success" => $db_success,
        "message" => $db_message
    ]
]);
?>');

echo "\n=== RÉCAPITULATIF ===\n";
$files = [
    'index.php',
    'phpinfo.php',
    'api/index.php',
    'api/check.php',
    'api/test.php',
    'api/phpinfo.php',
    'api/config/env.php',
    'api/config/db_config.json'
];

foreach ($files as $file) {
    if (file_exists($file)) {
        echo "✓ $file: PRÉSENT (" . filesize($file) . " octets)\n";
    } else {
        echo "✗ $file: MANQUANT\n";
    }
}

echo "\nPour tester l'API, accédez à http://votre-domaine.com/api/check.php\n";
echo "Pour vérifier PHP, accédez à http://votre-domaine.com/phpinfo.php\n";

echo "\nScript terminé le " . date('Y-m-d H:i:s') . "\n";
?>
