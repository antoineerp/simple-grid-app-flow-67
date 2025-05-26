
<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

if ($method === 'POST') {
    // Connexion utilisateur
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['username']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Nom d\'utilisateur et mot de passe requis']);
        exit;
    }
    
    try {
        // Vérifier dans la table des utilisateurs
        $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE identifiant_technique = ? OR email = ?");
        $stmt->execute([$input['username'], $input['username']]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($input['password'], $user['mot_de_passe'])) {
            echo json_encode([
                'success' => true,
                'token' => base64_encode($user['identifiant_technique']),
                'user' => [
                    'id' => $user['id'],
                    'nom' => $user['nom'],
                    'prenom' => $user['prenom'],
                    'email' => $user['email'],
                    'identifiant_technique' => $user['identifiant_technique'],
                    'role' => $user['role']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Identifiants invalides']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la connexion']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>
