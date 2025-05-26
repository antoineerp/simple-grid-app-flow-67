
<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

if ($method === 'GET') {
    // Récupérer tous les utilisateurs
    try {
        $stmt = $pdo->query("SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs");
        $users = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'data' => $users
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération des utilisateurs']);
    }
    
} elseif ($method === 'POST') {
    // Créer un nouvel utilisateur
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['nom', 'prenom', 'email', 'role', 'mot_de_passe'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Le champ {$field} est requis"]);
            exit;
        }
    }
    
    try {
        // Générer un identifiant technique unique
        $identifiant_technique = strtolower($input['prenom'] . '_' . $input['nom'] . '_' . substr(uniqid(), -4));
        $identifiant_technique = preg_replace('/[^a-z0-9_]/', '_', $identifiant_technique);
        
        $stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, prenom, email, identifiant_technique, mot_de_passe, role) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $input['nom'],
            $input['prenom'],
            $input['email'],
            $identifiant_technique,
            password_hash($input['mot_de_passe'], PASSWORD_DEFAULT),
            $input['role']
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Créer les tables pour cet utilisateur
        createUserTables($pdo, $identifiant_technique);
        
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $userId,
                'nom' => $input['nom'],
                'prenom' => $input['prenom'],
                'email' => $input['email'],
                'identifiant_technique' => $identifiant_technique,
                'role' => $input['role']
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la création de l\'utilisateur: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}

function createUserTables($pdo, $userId) {
    $tables = [
        "documents_{$userId}" => "
            CREATE TABLE documents_{$userId} (
                id VARCHAR(36) PRIMARY KEY,
                nom VARCHAR(255) NOT NULL,
                description TEXT,
                responsabilites JSON,
                etat VARCHAR(20),
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )",
        "exigences_{$userId}" => "
            CREATE TABLE exigences_{$userId} (
                id VARCHAR(36) PRIMARY KEY,
                nom VARCHAR(255) NOT NULL,
                description TEXT,
                responsabilites JSON,
                exclusion BOOLEAN DEFAULT FALSE,
                atteinte VARCHAR(20),
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )",
        "groupes_documents_{$userId}" => "
            CREATE TABLE groupes_documents_{$userId} (
                id VARCHAR(36) PRIMARY KEY,
                nom VARCHAR(255) NOT NULL,
                items JSON,
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
        "groupes_exigences_{$userId}" => "
            CREATE TABLE groupes_exigences_{$userId} (
                id VARCHAR(36) PRIMARY KEY,
                nom VARCHAR(255) NOT NULL,
                items JSON,
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
            )"
    ];
    
    foreach ($tables as $tableName => $sql) {
        try {
            $pdo->exec($sql);
        } catch (Exception $e) {
            error_log("Erreur création table {$tableName}: " . $e->getMessage());
        }
    }
}
?>
