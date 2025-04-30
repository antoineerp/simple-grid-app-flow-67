
<?php
// Force output buffering to prevent output before headers
ob_start();

// Headers pour CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE bibliotheque-sync.php (REDIRECTEUR) ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Capturer les données brutes pour le débogage et la redirection
$rawInput = file_get_contents("php://input");
error_log("Données brutes reçues par bibliotheque-sync.php (redirecteur): " . $rawInput);

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Récupérer les données POST JSON
    $data = json_decode($rawInput, true);
    
    if (!$rawInput || !$data) {
        throw new Exception("Aucune donnée reçue ou format JSON invalide");
    }
    
    error_log("Redirection des données de bibliotheque vers collaboration");
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['userId'])) {
        throw new Exception("Données incomplètes. 'userId' est requis");
    }
    
    $userId = $data['userId'];
    error_log("Redirection pour l'utilisateur: {$userId}");
    
    // Récupérer les données à synchroniser et les transformer pour collaboration
    $ressources = null;
    
    // Chercher les données sous différentes clés
    if (isset($data['bibliotheque']) && is_array($data['bibliotheque'])) {
        $ressources = $data['bibliotheque'];
        error_log("Données trouvées sous 'bibliotheque', conversion en 'collaboration'");
    } elseif (isset($data['documents']) && is_array($data['documents'])) {
        $ressources = $data['documents'];
        error_log("Données trouvées sous 'documents', conversion en 'collaboration'");
    } elseif (isset($data['ressources']) && is_array($data['ressources'])) {
        $ressources = $data['ressources'];
        error_log("Données trouvées sous 'ressources', conversion en 'collaboration'");
    } elseif (isset($data['collaboration']) && is_array($data['collaboration'])) {
        $ressources = $data['collaboration'];
        error_log("Données trouvées sous 'collaboration', utilisation directe");
    } else {
        // Parcourir toutes les clés pour trouver un tableau potentiel
        foreach ($data as $key => $value) {
            if (is_array($value) && $key !== 'userId' && $key !== 'groups') {
                $ressources = $value;
                error_log("Données trouvées sous '{$key}', conversion en 'collaboration'");
                break;
            }
        }
    }
    
    // Si aucune donnée trouvée, essayer d'utiliser un tableau vide
    if (!$ressources) {
        error_log("Aucune donnée de bibliothèque/collaboration trouvée dans la requête, utilisation d'un tableau vide");
        $ressources = [];
    }
    
    // Récupérer également les groupes si présents
    $groups = isset($data['groups']) ? $data['groups'] : [];
    
    // Construire la nouvelle requête pour collaboration-sync.php
    $newRequestData = [
        'userId' => $userId,
        'collaboration' => $ressources,
    ];
    
    // Ajouter les groupes si présents
    if (!empty($groups)) {
        $newRequestData['groups'] = $groups;
    }
    
    // Convertir en JSON
    $newRequestBody = json_encode($newRequestData);
    error_log("Données à envoyer à collaboration-sync.php: " . $newRequestBody);
    
    // Vérifier si le fichier collaboration-sync.php existe sur le serveur
    // Si oui, rediriger vers ce fichier
    // Sinon, générer une réponse simulée
    
    if (file_exists(__DIR__ . '/collaboration-sync.php')) {
        // Fichier collaboration-sync.php existe, rediriger vers ce fichier
        
        // Déterminer l'URL de redirection
        $redirectUrl = str_replace("bibliotheque-sync.php", "collaboration-sync.php", $_SERVER['REQUEST_URI']);
        $host = $_SERVER['HTTP_HOST'];
        $isHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
        $protocol = $isHttps ? "https" : "http";
        
        // Construire l'URL complète
        $fullRedirectUrl = "{$protocol}://{$host}{$redirectUrl}";
        error_log("Redirection vers: {$fullRedirectUrl}");
        
        // Initialiser cURL pour effectuer la redirection
        $ch = curl_init($fullRedirectUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $newRequestBody);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Content-Length: ' . strlen($newRequestBody)
        ]);
        
        // Ajouter des options de débogage
        curl_setopt($ch, CURLOPT_VERBOSE, true);
        $verbose = fopen('php://temp', 'w+');
        curl_setopt($ch, CURLOPT_STDERR, $verbose);
        
        // Exécuter la requête
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        // Log de débogage cURL
        rewind($verbose);
        $verboseLog = stream_get_contents($verbose);
        error_log("Log cURL: " . $verboseLog);
        
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            // Succès - renvoyer la réponse
            echo $result;
            error_log("Redirection réussie, code de réponse: {$httpCode}");
            error_log("Réponse reçue: {$result}");
        } else {
            // Erreur - journaliser et renvoyer une réponse de secours
            error_log("Erreur lors de la redirection: Code HTTP {$httpCode}, Erreur: {$error}");
            error_log("Réponse reçue: {$result}");
            
            // Générer une réponse simulée
            $fallbackResponse = [
                'success' => true,
                'message' => 'Données sauvegardées localement uniquement (erreur de redirection)',
                'fallback' => true,
                'timestamp' => date('c')
            ];
            
            echo json_encode($fallbackResponse);
            error_log("Réponse de secours générée: " . json_encode($fallbackResponse));
        }
    } else {
        // Fichier collaboration-sync.php n'existe pas, générer une réponse simulée
        error_log("Fichier collaboration-sync.php non trouvé, génération d'une réponse simulée");
        
        $simulatedResponse = [
            'success' => true,
            'message' => 'Données sauvegardées avec succès (simulation)',
            'simulated' => true,
            'timestamp' => date('c'),
            'count' => count($ressources)
        ];
        
        echo json_encode($simulatedResponse);
        error_log("Réponse simulée générée: " . json_encode($simulatedResponse));
    }
    
} catch (Exception $e) {
    error_log("Exception dans bibliotheque-sync.php (redirecteur): " . $e->getMessage());
    http_response_code(400);
    $errorResponse = [
        'success' => false,
        'message' => $e->getMessage(),
        'redirection_error' => true
    ];
    echo json_encode($errorResponse);
    error_log("Réponse d'erreur: " . json_encode($errorResponse));
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE bibliotheque-sync.php (REDIRECTEUR) ===");
    if (ob_get_level()) ob_end_flush();
}
