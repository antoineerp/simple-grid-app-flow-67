
<?php
// Désactiver l'affichage des erreurs - elles seraient journalisées mais pas affichées
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Nettoyer tout buffer de sortie potentiellement existant
if (ob_get_level()) ob_end_clean();

// Définir les en-têtes CORS et le type de contenu avant toute sortie
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: https://qualiopi.ch");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Traiter les requêtes preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Vérifier si la méthode est GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée']);
    exit;
}

error_log("=== EXÉCUTION DE check-users.php ===");

try {
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    error_log("Tentative de connexion PDO à la base de données");
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion PDO réussie");
    
    // Récupérer tous les utilisateurs
    $query = "SELECT id, nom, prenom, email, role, mot_de_passe, identifiant_technique, date_creation FROM utilisateurs";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Nettoyer tout output accumulé avant d'envoyer la réponse
    if (ob_get_length()) ob_clean();
    
    // Envoyer la réponse
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Utilisateurs récupérés avec succès',
        'records' => $users,
        'count' => count($users)
    ]);
    exit;
    
} catch (PDOException $e) {
    error_log("Erreur PDO: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de base de données',
        'error' => $e->getMessage()
    ]);
    exit;
} catch (Exception $e) {
    error_log("Erreur: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur serveur',
        'error' => $e->getMessage()
    ]);
    exit;
}
?>
