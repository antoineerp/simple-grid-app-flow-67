
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

// Démarrer un buffer de sortie
ob_start();

try {
    // Créer le dossier operations s'il n'existe pas
    if (!is_dir(__DIR__ . '/operations')) {
        mkdir(__DIR__ . '/operations', 0755, true);
        error_log("Dossier operations créé");
    }
    
    $result = [
        'status' => 'success',
        'message' => 'Diagnostic utilisateur exécuté avec succès',
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
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
    
    // 2. Test simple pour vérifier que l'API fonctionne
    $result['api_check'] = [
        'status' => 'success',
        'message' => 'API accessible'
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

// Fin du script : vidage du buffer
ob_end_flush();
?>
