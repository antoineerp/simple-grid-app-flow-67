
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

// Définir DIRECT_ACCESS_CHECK comme true pour permettre l'accès direct sans vérification
define('DIRECT_ACCESS_CHECK', true);

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

// Fichier de configuration
$configFile = __DIR__ . '/config/app_config.json';

// Détermininer la méthode de requête
$method = $_SERVER['REQUEST_METHOD'];

// Journaliser pour le débogage
error_log("ConfigController - Méthode: $method");

switch($method) {
    case 'GET':
        try {
            // Lire la configuration actuelle
            if (file_exists($configFile)) {
                $config = json_decode(file_get_contents($configFile), true);
                if ($config === null && json_last_error() !== JSON_ERROR_NONE) {
                    throw new Exception("Erreur de parsing JSON: " . json_last_error_msg());
                }
            } else {
                $config = [
                    'api_urls' => [
                        'development' => 'http://localhost:8080/api',
                        'production' => 'https://qualiopi.ch/api'
                    ],
                    'allowed_origins' => [
                        'development' => 'http://localhost:8080',
                        'production' => 'https://qualiopi.ch'
                    ]
                ];
                
                // Créer le fichier s'il n'existe pas
                if (!file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
                    throw new Exception("Impossible de créer le fichier de configuration");
                }
            }
            
            http_response_code(200);
            echo json_encode($config, JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Erreur lors de la lecture de la configuration: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        break;
        
    case 'POST':
        try {
            // Obtenir les données postées et assurer qu'elles sont en UTF-8
            $json_input = file_get_contents("php://input");
            if (!$json_input) {
                throw new Exception("Aucune donnée reçue");
            }
            
            error_log("Données reçues: " . $json_input);
            
            $data = json_decode(cleanUTF8($json_input), true);
            if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Erreur de parsing JSON: " . json_last_error_msg());
            }
            
            // Valider la structure des données
            if (!isset($data['api_urls']) || 
                !isset($data['allowed_origins']) ||
                !isset($data['api_urls']['development']) || 
                !isset($data['api_urls']['production']) || 
                !isset($data['allowed_origins']['development']) || 
                !isset($data['allowed_origins']['production'])
            ) {
                throw new Exception("Structure de données incomplète");
            }
            
            // Vérifier que le dossier config existe
            $configDir = dirname($configFile);
            if (!is_dir($configDir)) {
                if (!mkdir($configDir, 0755, true)) {
                    throw new Exception("Impossible de créer le dossier de configuration");
                }
            }
            
            // Vérifier les permissions d'écriture
            if (file_exists($configFile) && !is_writable($configFile)) {
                throw new Exception("Impossible d'écrire dans le fichier de configuration (permissions insuffisantes)");
            }
            
            // Mettre à jour la configuration
            if (!file_put_contents($configFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
                throw new Exception("Erreur lors de l'écriture du fichier");
            }
            
            http_response_code(200);
            echo json_encode(["message" => "Configuration mise à jour avec succès"], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            error_log("Erreur ConfigController: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                "message" => "Erreur lors de la mise à jour de la configuration", 
                "details" => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["message" => "Méthode non autorisée"], JSON_UNESCAPED_UNICODE);
        break;
}

// Vider le tampon de sortie
ob_end_flush();
?>
