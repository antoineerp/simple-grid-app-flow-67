
<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();
$userId = getUserId();
$tableName = "exigences_{$userId}";

// Vérifier que la table existe
try {
    $pdo->query("SELECT 1 FROM {$tableName} LIMIT 1");
} catch (Exception $e) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Table utilisateur non trouvée']);
    exit;
}

if ($method === 'GET') {
    // Récupérer toutes les exigences
    try {
        $stmt = $pdo->query("SELECT * FROM {$tableName} ORDER BY date_creation DESC");
        $exigences = $stmt->fetchAll();
        
        // Décoder les JSON
        foreach ($exigences as &$ex) {
            $ex['responsabilites'] = json_decode($ex['responsabilites'], true) ?: ['r' => [], 'a' => [], 'c' => [], 'i' => []];
            $ex['exclusion'] = (bool)$ex['exclusion'];
        }
        
        echo json_encode(['success' => true, 'data' => $exigences]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération']);
    }
    
} elseif ($method === 'POST') {
    // Créer une nouvelle exigence
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        $id = $input['id'] ?? uniqid();
        $stmt = $pdo->prepare("INSERT INTO {$tableName} (id, nom, description, responsabilites, exclusion, atteinte) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $input['nom'],
            $input['description'] ?? '',
            json_encode($input['responsabilites'] ?? ['r' => [], 'a' => [], 'c' => [], 'i' => []]),
            $input['exclusion'] ?? false,
            $input['atteinte'] ?? null
        ]);
        
        echo json_encode(['success' => true, 'id' => $id]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la création']);
    }
    
} elseif ($method === 'PUT') {
    // Mettre à jour une exigence
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        $stmt = $pdo->prepare("UPDATE {$tableName} SET nom = ?, description = ?, responsabilites = ?, exclusion = ?, atteinte = ? WHERE id = ?");
        $stmt->execute([
            $input['nom'],
            $input['description'] ?? '',
            json_encode($input['responsabilites'] ?? ['r' => [], 'a' => [], 'c' => [], 'i' => []]),
            $input['exclusion'] ?? false,
            $input['atteinte'] ?? null,
            $input['id']
        ]);
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
    }
    
} elseif ($method === 'DELETE') {
    // Supprimer une exigence
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID requis']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM {$tableName} WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>
