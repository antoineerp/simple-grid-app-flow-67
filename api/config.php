
<?php
// Configuration centralisée pour Infomaniak - DONNÉES RÉELLES
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-User-ID");

// Configuration RÉELLE de la base de données Infomaniak
define('DB_HOST', 'h2web432.infomaniak.ch');
define('DB_NAME', 'p71x6d_richard');
define('DB_USER', 'p71x6d_richard');
define('DB_PASS', 'Trottinette43!');

// Fonction pour obtenir une connexion à la base de données Infomaniak
function getDbConnection() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        error_log("Connexion réussie à la base Infomaniak: " . DB_HOST . "/" . DB_NAME);
        return $pdo;
    } catch (PDOException $e) {
        error_log("ERREUR connexion Infomaniak: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base Infomaniak: ' . $e->getMessage()]);
        exit;
    }
}

// Fonction pour obtenir l'ID utilisateur depuis les en-têtes
function getUserId() {
    $headers = getallheaders();
    if (isset($headers['X-User-ID'])) {
        return preg_replace('/[^a-zA-Z0-9_]/', '_', $headers['X-User-ID']);
    }
    return 'p71x6d_richard'; // Utilisateur par défaut
}

// Gestion des requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
?>
