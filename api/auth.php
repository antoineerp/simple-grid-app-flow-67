
<?php
// Activer la journalisation d'erreurs plus détaillée
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Enregistrer le début de l'exécution
error_log("=== DÉBUT DE L'EXÉCUTION DE auth.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Définir explicitement le type de contenu JSON et les en-têtes CORS
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Vérifier si la méthode est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée. Utilisez POST pour l\'authentification.', 'status' => 405]);
    exit;
}

// Créer un gestionnaire d'exceptions global
function exception_handler($exception) {
    error_log("Exception globale attrapée dans auth.php: " . $exception->getMessage());
    error_log("Trace: " . $exception->getTraceAsString());
    
    // Envoyer une réponse JSON en cas d'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'message' => 'Erreur serveur interne',
        'error' => $exception->getMessage(),
        'trace' => $exception->getTraceAsString()
    ]);
}

// Définir le gestionnaire d'exceptions
set_exception_handler('exception_handler');

// Fonction de diagnostic pour vérifier l'existence et l'accessibilité des fichiers
function check_file($path) {
    if (!file_exists($path)) {
        error_log("ERREUR: Fichier introuvable: $path");
        return false;
    }
    if (!is_readable($path)) {
        error_log("ERREUR: Fichier non lisible: $path");
        return false;
    }
    error_log("OK: Fichier trouvé et lisible: $path");
    return true;
}

try {
    // Journaliser la structure des dossiers
    error_log("Structure du dossier API:");
    error_log("__DIR__: " . __DIR__);
    error_log("DOCUMENT_ROOT: " . $_SERVER['DOCUMENT_ROOT']);
    
    // Vérifier l'existence des dossiers nécessaires
    $controllers_dir = __DIR__ . '/controllers';
    if (!is_dir($controllers_dir)) {
        error_log("ERREUR CRITIQUE: Le dossier controllers n'existe pas: $controllers_dir");
        throw new Exception("Dossier controllers introuvable");
    } else {
        error_log("Contenu du dossier controllers:");
        $controllers_files = scandir($controllers_dir);
        error_log(print_r($controllers_files, true));
    }
    
    // Vérifier l'absence de fonctions dupliquées
    $check_duplication = true;
    
    if ($check_duplication) {
        // Vérifier si config/env.php contient une déclaration conditionnelle pour cleanUTF8
        $env_file = __DIR__ . '/config/env.php';
        if (file_exists($env_file)) {
            $env_content = file_get_contents($env_file);
            $has_conditional_declaration = strpos($env_content, "if (!function_exists('cleanUTF8'))") !== false;
            
            if (!$has_conditional_declaration) {
                error_log("AVERTISSEMENT: Le fichier env.php ne contient pas de déclaration conditionnelle pour cleanUTF8");
            } else {
                error_log("OK: Le fichier env.php contient une déclaration conditionnelle pour cleanUTF8");
            }
        }
        
        // Vérifier si AuthController.php contient une déclaration conditionnelle pour cleanUTF8
        $auth_controller = __DIR__ . '/controllers/AuthController.php';
        if (file_exists($auth_controller)) {
            $auth_content = file_get_contents($auth_controller);
            $has_conditional_declaration = strpos($auth_content, "if (!function_exists('cleanUTF8'))") !== false;
            
            if (!$has_conditional_declaration) {
                error_log("AVERTISSEMENT: Le fichier AuthController.php ne contient pas de déclaration conditionnelle pour cleanUTF8");
            } else {
                error_log("OK: Le fichier AuthController.php contient une déclaration conditionnelle pour cleanUTF8");
            }
        }
    }
    
    // Vérifier l'existence et la lisibilité du contrôleur d'authentification
    $auth_controller = __DIR__ . '/controllers/AuthController.php';
    if (!check_file($auth_controller)) {
        throw new Exception("Contrôleur d'authentification introuvable ou non lisible");
    }
    
    // Inclure le contrôleur d'authentification
    error_log("Tentative d'inclusion du contrôleur d'authentification...");
    include_once $auth_controller;
    error_log("Contrôleur d'authentification inclus avec succès");
    
} catch (Exception $e) {
    // Log l'erreur
    error_log("Erreur critique dans auth.php: " . $e->getMessage());
    error_log("Trace: " . $e->getTraceAsString());
    
    // Si l'erreur est liée à la duplication de la fonction cleanUTF8, essayer d'utiliser le script de secours
    if (strpos($e->getMessage(), 'Cannot redeclare function cleanUTF8') !== false || 
        strpos($e->getMessage(), 'Erreur de connexion à la base de données') !== false) {
        error_log("Tentative d'utilisation du script de secours pour l'authentification...");
        try {
            $fallback_script = __DIR__ . '/login-test.php';
            if (file_exists($fallback_script) && is_readable($fallback_script)) {
                error_log("Redirection vers le script de secours: $fallback_script");
                include_once $fallback_script;
                exit;
            } else {
                error_log("ERREUR: Script de secours introuvable ou non lisible: $fallback_script");
            }
        } catch (Exception $fallback_error) {
            error_log("Erreur dans le script de secours: " . $fallback_error->getMessage());
        }
    }
    
    // Envoyer une réponse JSON en cas d'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'message' => 'Erreur serveur interne',
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE auth.php ===");
}
?>
