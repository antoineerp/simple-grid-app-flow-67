
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// En-têtes CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'appel
error_log("API users.php - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - Requête: " . $_SERVER['REQUEST_URI']);

// Nettoyer tout buffer de sortie existant
if (ob_get_level()) ob_clean();

try {
    // Utilisation du point d'entrée plus simple en attendant que l'architecture MVC complète soit fonctionnelle
    // Utilisation du endpoint de diagnostic check-users.php qui est fonctionnel
    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        // Redirection interne vers le script de vérification des utilisateurs
        require_once __DIR__ . '/check-users.php';
        // Le script check-users.php se charge de produire la sortie JSON
        exit;
    } elseif ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
        // Traitement de la suppression d'un utilisateur
        $data = json_decode(file_get_contents("php://input"), true);
        $userId = isset($data['id']) ? (int)$data['id'] : 0;
        
        if ($userId <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID d\'utilisateur invalide']);
            exit;
        }
        
        try {
            // Connexion à la base de données
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
            
            $pdo = new PDO($dsn, $username, $password, $options);
            
            // Vérifier si l'utilisateur existe
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM utilisateurs WHERE id = :id");
            $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            if ($stmt->fetchColumn() == 0) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Utilisateur non trouvé']);
                exit;
            }
            
            // Supprimer l'utilisateur
            $stmt = $pdo->prepare("DELETE FROM utilisateurs WHERE id = :id");
            $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Utilisateur supprimé avec succès']);
            exit;
        } catch (PDOException $e) {
            error_log("Erreur PDO lors de la suppression d'un utilisateur: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
            exit;
        }
    } else {
        // Pour les autres méthodes, renvoyer une erreur 501 Not Implemented
        http_response_code(501);
        echo json_encode(['status' => 'error', 'message' => 'Méthode non implémentée: ' . $_SERVER['REQUEST_METHOD']]);
        exit;
    }
} catch (Exception $e) {
    // Nettoyer le buffer en cas d'erreur
    if (ob_get_level()) ob_clean();
    
    // En cas d'erreur, envoyer une réponse JSON propre
    error_log("Erreur dans users.php: " . $e->getMessage());
    
    // S'assurer que les en-têtes sont correctement définis
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code(500);
    }
    
    echo json_encode([
        'status' => 'error',
        'message' => "Erreur interne du serveur: " . $e->getMessage()
    ]);
    exit;
}

// S'assurer que tout buffer est vidé
if (ob_get_level()) ob_end_flush();
?>
