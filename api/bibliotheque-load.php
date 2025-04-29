
<?php
// Force output buffering to prevent output before headers
ob_start();

// Headers pour CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE bibliotheque-load.php (REDIRECTEUR) ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    error_log("Redirection vers collaboration-load.php");
    
    // Vérifier si l'userId est présent
    if (!isset($_GET['userId'])) {
        throw new Exception("ID utilisateur manquant");
    }
    
    $userId = $_GET['userId'];
    error_log("UserId reçu: " . $userId);
    
    // Construire l'URL de redirection
    $redirectUrl = str_replace("bibliotheque-load.php", "collaboration-load.php", $_SERVER['REQUEST_URI']);
    $host = $_SERVER['HTTP_HOST'];
    $isHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    $protocol = $isHttps ? "https" : "http";
    
    // Construire l'URL complète
    $fullRedirectUrl = "{$protocol}://{$host}{$redirectUrl}";
    error_log("Redirection vers: {$fullRedirectUrl}");
    
    // Initialiser cURL pour effectuer la redirection
    $ch = curl_init($fullRedirectUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
    ]);
    
    // Exécuter la requête
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        // Succès - renvoyer la réponse
        echo $result;
        error_log("Redirection réussie, code de réponse: {$httpCode}");
    } else {
        // Erreur - journaliser et renvoyer un message d'erreur
        error_log("Erreur lors de la redirection: Code HTTP {$httpCode}, Erreur: {$error}");
        error_log("Réponse reçue: {$result}");
        throw new Exception("Erreur lors de la redirection vers collaboration-load.php: Code {$httpCode}");
    }
    
} catch (Exception $e) {
    error_log("Exception dans bibliotheque-load.php (redirecteur): " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'redirection_error' => true
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE bibliotheque-load.php (REDIRECTEUR) ===");
    if (ob_get_level()) ob_end_flush();
}
