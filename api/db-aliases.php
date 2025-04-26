
<?php
// Fichier pour gérer toutes les redirections et alias pour les points d'entrée liés à la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Définir la constante d'accès direct
define('DIRECT_ACCESS_CHECK', true);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Détecter quelle route a été appelée
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($requestUri, PHP_URL_PATH);
$baseName = basename($path);

error_log("db-aliases.php: Traitement de la route {$baseName}");

// Déterminer la cible de redirection
$targetFile = '';

// Routes liées à la configuration de base de données
if (preg_match('/(db-config|base-de-donnees-config|base-donnees-config|donnees-config)/i', $baseName)) {
    $targetFile = 'database-config.php';
}
// Routes liées au diagnostic de base de données
elseif (preg_match('/(db-diagnostique|db-diagnostics|diagnostique-db|diagnostique-database|diagnostique-base-de-donnees|diagnostique-base-donnees|diagnostique-donnees)/i', $baseName)) {
    $targetFile = 'db-diagnostic.php';
}
// Routes liées aux informations de base de données
elseif (preg_match('/(info-db|db-info)/i', $baseName)) {
    $targetFile = 'db-info.php';
}
// Routes liées aux tests de base de données
elseif (preg_match('/(db-test|base-de-donnees-test|base-donnees-test|donnees-test)/i', $baseName)) {
    $targetFile = 'database-test.php';
}
else {
    // Par défaut, renvoyer vers le diagnostic général
    $targetFile = 'db-diagnostic.php';
}

error_log("db-aliases.php: Redirection vers {$targetFile}");

// Effectuer la redirection
if (file_exists(__DIR__ . '/' . $targetFile)) {
    require_once __DIR__ . '/' . $targetFile;
    exit;
} else {
    // Si le fichier cible n'existe pas, renvoyer une erreur
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => "Erreur interne: fichier cible non trouvé {$targetFile}",
        'request_path' => $path
    ]);
    exit;
}
?>
