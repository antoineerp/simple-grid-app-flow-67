
<?php
// Point d'entrée pour la configuration de l'API
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 0); // Désactiver l'affichage HTML des erreurs
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// Fonction pour nettoyer les données UTF-8
if (!function_exists('cleanUTF8')) {
    function cleanUTF8($input) {
        if (is_string($input)) {
            return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
        } elseif (is_array($input)) {
            foreach ($input as $key => $value) {
                $input[$key] = cleanUTF8($value);
            }
        }
        return $input;
    }
}

// Gestionnaire d'erreurs personnalisé pour convertir les erreurs PHP en JSON
function jsonErrorHandler($errno, $errstr, $errfile, $errline) {
    // Journaliser l'erreur
    error_log("Erreur PHP [$errno]: $errstr dans $errfile ligne $errline");
    
    // Pour les erreurs fatales, convertir en JSON
    if ($errno == E_ERROR || $errno == E_USER_ERROR) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Erreur serveur: ' . $errstr,
            'details' => [
                'file' => basename($errfile),
                'line' => $errline
            ]
        ]);
        exit(1);
    }
    
    // Laisser PHP gérer les autres types d'erreurs
    return false;
}

// Définir notre gestionnaire d'erreurs
set_error_handler("jsonErrorHandler", E_ALL);

// Gestionnaire d'exceptions non capturées
function jsonExceptionHandler($e) {
    // Journaliser l'exception
    error_log("Exception non capturée: " . $e->getMessage() . " dans " . $e->getFile() . " ligne " . $e->getLine());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Exception: ' . $e->getMessage(),
        'details' => [
            'file' => basename($e->getFile()),
            'line' => $e->getLine()
        ]
    ]);
    exit(1);
}

// Définir notre gestionnaire d'exceptions
set_exception_handler("jsonExceptionHandler");

// Journaliser la requête pour débogage
error_log("Config API - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Lancer un buffer de sortie pour capturer toute sortie non-JSON
ob_start(function($buffer) {
    // Si le buffer ne commence pas par { ou [ (JSON), le convertir en JSON
    $trimmed = trim($buffer);
    if ($trimmed && !preg_match('/^[\{\[]/', $trimmed)) {
        // Journaliser le buffer non-JSON
        error_log("Output non-JSON détecté: " . substr($trimmed, 0, 100));
        
        http_response_code(500);
        return json_encode([
            'status' => 'error',
            'message' => 'La réponse du serveur n\'est pas au format JSON',
            'output' => substr($trimmed, 0, 300) // Limiter à 300 caractères
        ]);
    }
    return $buffer;
});

// Inclure le contrôleur de configuration
try {
    require_once 'controllers/ConfigController.php';
} catch (Exception $e) {
    // Déjà géré par notre gestionnaire d'exceptions
}

// Vider le tampon de sortie
ob_end_flush();
?>
