
<?php
// Script de test simple pour vérifier la connexion sans passer par les contrôleurs complexes
// Forcer le type de contenu JSON et le charset UTF-8
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Activer la journalisation
ini_set('display_errors', 0); // Désactiver l'affichage des erreurs pour éviter des réponses non-JSON
error_reporting(E_ALL);

// Fonction pour envoyer une réponse JSON et sortir
function json_response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

error_log("=== EXÉCUTION DE login-test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
error_log("Chemin complet du script: " . __FILE__);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    json_response(['status' => 200, 'message' => 'Preflight OK']);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Récupérer les données POST
    $json_input = file_get_contents("php://input");
    error_log("Données reçues: " . $json_input);
    
    if (empty($json_input)) {
        json_response(['message' => 'Aucune donnée reçue'], 400);
    }
    
    $data = json_decode($json_input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        json_response(['message' => 'Format JSON invalide: ' . json_last_error_msg()], 400);
    }
    
    // Vérifier des identifiants simples
    if (isset($data['username']) && isset($data['password'])) {
        // Vérifier d'abord si on peut se connecter à la base de données
        $db_connect = false;
        
        try {
            $db = new PDO('mysql:host=p71x6d.myd.infomaniak.com;dbname=p71x6d_system;charset=utf8mb4', 'p71x6d_system', 'votre_mot_de_passe_ici');
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $db_connect = true;
            error_log("Connexion à la base de données Infomaniak réussie");
        } catch (PDOException $e) {
            error_log("Erreur de connexion à la base de données: " . $e->getMessage());
            // Continuer avec les identifiants hardcodés même si la BD échoue
        }
        
        // Authentifications hardcodées pour test
        $valid_users = [
            'p71x6d_system' => ['password' => 'admin123', 'role' => 'admin'],
            'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
            'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur'],
            'admin' => ['password' => 'admin123', 'role' => 'admin'],
            'antcirier@gmail.com' => ['password' => 'password123', 'role' => 'admin']
        ];
        
        if (isset($valid_users[$data['username']]) && $valid_users[$data['username']]['password'] === $data['password']) {
            // Générer un token simple pour le test
            $token = md5($data['username'] . time());
            
            error_log("Authentification réussie pour: " . $data['username']);
            
            $response = [
                'message' => 'Connexion réussie (mode test)',
                'token' => $token,
                'user' => [
                    'id' => 1,
                    'nom' => 'Test',
                    'prenom' => 'User',
                    'email' => $data['username'] . '@test.com',
                    'identifiant_technique' => $data['username'],
                    'role' => $valid_users[$data['username']]['role']
                ],
                'db_connection' => $db_connect ? 'réussie' : 'échec'
            ];
            
            if ($db_connect) {
                $response['database_info'] = [
                    'host' => 'p71x6d.myd.infomaniak.com',
                    'database' => 'p71x6d_system',
                    'encoding' => 'utf8mb4',
                    'tables' => ['utilisateurs', 'documents', 'indicateurs', 'qualiopi_criteres', 'qualiopi_indicateurs', 'ressources_humaines']
                ];
            }
            
            json_response($response);
        } else {
            error_log("Identifiants invalides pour: " . $data['username']);
            
            json_response(['message' => 'Identifiants invalides'], 401);
        }
    } else {
        error_log("Données incomplètes");
        
        json_response(['message' => 'Données incomplètes. Username et password requis.'], 400);
    }
} else {
    error_log("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    
    json_response(['message' => 'Méthode non autorisée. Utilisez POST.'], 405);
}
