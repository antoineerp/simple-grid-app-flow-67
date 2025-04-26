
<?php
// Configuration des headers
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Activer la journalisation d'erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0); // Désactiver l'affichage HTML des erreurs
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/user_diagnostic_errors.log');

// Fonction pour nettoyer la sortie
function clean_output() {
    if (ob_get_level()) ob_clean();
}

try {
    $result = [];
    
    // 1. Vérifier la structure du répertoire
    $result['directory_structure'] = [];
    $directories = ['config', 'controllers', 'middleware', 'models', 'utils', 'operations'];
    
    foreach ($directories as $dir) {
        $path = __DIR__ . '/' . $dir;
        $result['directory_structure'][$dir] = [
            'exists' => is_dir($path),
            'readable' => is_dir($path) && is_readable($path),
            'writable' => is_dir($path) && is_writable($path)
        ];
        
        if (is_dir($path)) {
            $result['directory_structure'][$dir]['files'] = scandir($path);
        }
    }
    
    // 2. Tester la connexion à la base de données
    $result['database'] = [];
    
    // Inclure les fichiers nécessaires
    require_once __DIR__ . '/config/database.php';
    
    // Vérifier que la classe existe
    $result['database']['class_exists'] = class_exists('Database');
    
    // Créer une instance et tester la connexion
    if (class_exists('Database')) {
        $database = new Database('user-diagnostic');
        $result['database']['config'] = $database->getConfig();
        $result['database']['connected'] = $database->testConnection();
        $result['database']['error'] = $database->connection_error;
        
        // Si connexion réussie, vérifier la table utilisateurs
        if ($database->is_connected) {
            $db = $database->getConnection();
            
            // Vérifier si la table utilisateurs existe
            $query = "SHOW TABLES LIKE 'utilisateurs'";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $result['database']['table_exists'] = ($stmt->rowCount() > 0);
            
            // Si la table existe, compter les utilisateurs
            if ($result['database']['table_exists']) {
                $query = "SELECT COUNT(*) FROM utilisateurs";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $result['database']['user_count'] = $stmt->fetchColumn();
                
                // Récupérer la structure de la table
                $query = "DESCRIBE utilisateurs";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $result['database']['table_structure'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        }
    }
    
    // 3. Vérifier les fichiers clés pour la création d'utilisateurs
    $files_to_check = [
        '/controllers/UsersController.php',
        '/models/User.php',
        '/models/traits/UserQueries.php',
        '/operations/UserOperations.php',
        '/utilisateurs.php'
    ];
    
    $result['user_files'] = [];
    
    foreach ($files_to_check as $file) {
        $path = __DIR__ . $file;
        $result['user_files'][$file] = [
            'exists' => file_exists($path),
            'readable' => file_exists($path) && is_readable($path),
            'size' => file_exists($path) ? filesize($path) : 0
        ];
    }
    
    // 4. Tester spécifiquement la création d'utilisateur avec des données factices
    require_once __DIR__ . '/models/User.php';
    
    if (class_exists('User') && $database->is_connected) {
        $result['user_test'] = [];
        $testUser = new User($database->getConnection());
        
        // Générer un email unique pour éviter les conflits
        $timestamp = time();
        $testEmail = "test_user_{$timestamp}@example.com";
        
        // Définir les propriétés
        $testUser->nom = "Test";
        $testUser->prenom = "Utilisateur";
        $testUser->email = $testEmail;
        $testUser->mot_de_passe = "password123";
        $testUser->identifiant_technique = "p71x6d_test_user_{$timestamp}";
        $testUser->role = "utilisateur";
        
        // Tenter de créer l'utilisateur et capturer tout message d'erreur
        try {
            $result['user_test']['creation_attempted'] = true;
            $success = $testUser->create();
            $result['user_test']['creation_success'] = $success;
            
            // Vérifier si l'utilisateur a été créé
            if ($success) {
                $verif = $testUser->findByEmail($testEmail);
                $result['user_test']['verification'] = $verif;
                
                if ($verif) {
                    $result['user_test']['user_data'] = [
                        'id' => $testUser->id,
                        'nom' => $testUser->nom,
                        'prenom' => $testUser->prenom,
                        'email' => $testUser->email,
                        'role' => $testUser->role,
                        'identifiant_technique' => $testUser->identifiant_technique
                    ];
                }
            }
        } catch (Exception $e) {
            $result['user_test']['error'] = $e->getMessage();
            $result['user_test']['trace'] = $e->getTraceAsString();
        }
    } else {
        $result['user_test']['error'] = "Classe User introuvable ou base de données non connectée";
    }
    
    // 5. Vérifier les permissions
    $result['permissions'] = [
        'php_version' => phpversion(),
        'current_user' => get_current_user(),
        'script_owner' => function_exists('posix_getpwuid') ? posix_getpwuid(fileowner(__FILE__)) : 'Fonction posix non disponible',
        'api_dir_writable' => is_writable(__DIR__),
        'error_log_writable' => is_writable(__DIR__ . '/user_diagnostic_errors.log') || is_writable(__DIR__)
    ];
    
    // Nettoyer toute sortie précédente
    clean_output();
    
    // Renvoyer les résultats
    http_response_code(200);
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    // Nettoyer toute sortie précédente
    clean_output();
    
    // Log et renvoie l'erreur
    error_log("Erreur dans le diagnostic utilisateur: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => "Erreur lors du diagnostic: " . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>
