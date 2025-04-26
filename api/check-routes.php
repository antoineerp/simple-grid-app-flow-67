
<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight request successful']);
    exit;
}

function get_url_domain($url) {
    $urlParts = parse_url($url);
    return isset($urlParts['host']) ? $urlParts['host'] : '';
}

function checkRoute($path, $options = []) {
    // Paramètres par défaut
    $defaults = [
        'useCurrentDomain' => false,   // Utiliser le domaine courant au lieu d'une URL spécifique
        'timeout' => 5,                // Timeout en secondes
        'verifySSL' => false,          // Vérifier les certificats SSL
        'followRedirects' => true,     // Suivre les redirections
        'maxRedirects' => 3,           // Maximum de redirections à suivre
        'baseUrl' => null              // URL de base personnalisée
    ];
    
    $options = array_merge($defaults, $options);
    
    // Déterminer l'URL de base à utiliser
    if ($options['baseUrl']) {
        $baseUrl = $options['baseUrl'];
    } elseif ($options['useCurrentDomain']) {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $domain = $_SERVER['HTTP_HOST'];
        $baseUrl = $protocol . "://" . $domain;
    } else {
        // URL par défaut (peut être modifiée selon les besoins)
        $baseUrl = "https://qualiopi.ch";
    }
    
    $fullUrl = $baseUrl . "/api/" . $path;
    $domain = get_url_domain($fullUrl);
    
    // Vérifier si cURL est disponible
    if (!function_exists('curl_init')) {
        return [
            'url' => $fullUrl,
            'domain' => $domain,
            'status' => null,
            'exists' => false,
            'response_code' => 0,
            'error' => 'cURL n\'est pas disponible sur ce serveur',
            'response_sample' => null
        ];
    }
    
    // Initialiser une session cURL
    $ch = curl_init();
    
    // Configurer les options cURL
    curl_setopt($ch, CURLOPT_URL, $fullUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, $options['timeout']);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $options['timeout']);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, false);
    
    // Configuration SSL
    if (!$options['verifySSL']) {
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    }
    
    // Suivre les redirections si demandé
    if ($options['followRedirects']) {
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, $options['maxRedirects']);
    }
    
    // Exécuter la requête cURL
    $response = curl_exec($ch);
    $errorMessage = null;
    
    // Vérifier s'il y a eu une erreur cURL
    if ($response === false) {
        $errorMessage = curl_error($ch);
        $responseCode = 0;
        $exists = false;
        $status = null;
        $responseSample = null;
    } else {
        // Obtenir le code de réponse HTTP
        $responseCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $exists = $responseCode >= 200 && $responseCode < 400;
        $status = "HTTP/1.1 " . $responseCode . " " . getHttpStatusText($responseCode);
        
        // Séparer les en-têtes et le corps de la réponse
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $responseBody = substr($response, $headerSize);
        $responseSample = substr($responseBody, 0, 150) . (strlen($responseBody) > 150 ? '...' : '');
    }
    
    // Fermer la session cURL
    curl_close($ch);
    
    // Formater le message d'erreur pour l'uniformité avec la version précédente
    if ($errorMessage) {
        if (strpos($errorMessage, "Could not resolve host") !== false) {
            $errorDetail = "Nom de domaine non résolu";
        } elseif (strpos($errorMessage, "Connection refused") !== false) {
            $errorDetail = "Connexion refusée";
        } elseif (strpos($errorMessage, "Operation timed out") !== false) {
            $errorDetail = "Délai de connexion dépassé";
        } elseif (strpos($errorMessage, "SSL certificate") !== false) {
            $errorDetail = "Problème de certificat SSL";
        } else {
            $errorDetail = "Erreur de connexion: " . $errorMessage;
        }
    } else {
        $errorDetail = null;
    }
    
    return [
        'url' => $fullUrl,
        'domain' => $domain,
        'status' => $status,
        'exists' => $exists,
        'response_code' => $responseCode,
        'error' => $errorDetail,
        'response_sample' => $responseSample
    ];
}

// Fonction pour obtenir le texte du statut HTTP basé sur le code
function getHttpStatusText($code) {
    $statusTexts = [
        100 => 'Continue',
        101 => 'Switching Protocols',
        200 => 'OK',
        201 => 'Created',
        202 => 'Accepted',
        203 => 'Non-Authoritative Information',
        204 => 'No Content',
        205 => 'Reset Content',
        206 => 'Partial Content',
        300 => 'Multiple Choices',
        301 => 'Moved Permanently',
        302 => 'Found',
        303 => 'See Other',
        304 => 'Not Modified',
        305 => 'Use Proxy',
        307 => 'Temporary Redirect',
        308 => 'Permanent Redirect',
        400 => 'Bad Request',
        401 => 'Unauthorized',
        402 => 'Payment Required',
        403 => 'Forbidden',
        404 => 'Not Found',
        405 => 'Method Not Allowed',
        406 => 'Not Acceptable',
        407 => 'Proxy Authentication Required',
        408 => 'Request Timeout',
        409 => 'Conflict',
        410 => 'Gone',
        411 => 'Length Required',
        412 => 'Precondition Failed',
        413 => 'Payload Too Large',
        414 => 'URI Too Long',
        415 => 'Unsupported Media Type',
        416 => 'Range Not Satisfiable',
        417 => 'Expectation Failed',
        418 => 'I\'m a teapot',
        422 => 'Unprocessable Entity',
        425 => 'Too Early',
        426 => 'Upgrade Required',
        428 => 'Precondition Required',
        429 => 'Too Many Requests',
        431 => 'Request Header Fields Too Large',
        451 => 'Unavailable For Legal Reasons',
        500 => 'Internal Server Error',
        501 => 'Not Implemented',
        502 => 'Bad Gateway',
        503 => 'Service Unavailable',
        504 => 'Gateway Timeout',
        505 => 'HTTP Version Not Supported',
        506 => 'Variant Also Negotiates',
        507 => 'Insufficient Storage',
        508 => 'Loop Detected',
        510 => 'Not Extended',
        511 => 'Network Authentication Required',
    ];
    
    return isset($statusTexts[$code]) ? $statusTexts[$code] : 'Unknown Status';
}

try {
    // Vérifier si cURL est disponible
    if (!function_exists('curl_init')) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'cURL n\'est pas disponible sur ce serveur, impossible de vérifier les routes'
        ], JSON_PRETTY_PRINT);
        exit;
    }
    
    // Récupérer les paramètres de requête
    $useCurrentDomain = isset($_GET['use_current_domain']) && ($_GET['use_current_domain'] === '1' || $_GET['use_current_domain'] === 'true');
    $customBaseUrl = isset($_GET['base_url']) ? $_GET['base_url'] : null;
    $timeout = isset($_GET['timeout']) ? intval($_GET['timeout']) : 5;
    $verifySSL = isset($_GET['verify_ssl']) && ($_GET['verify_ssl'] === '1' || $_GET['verify_ssl'] === 'true');
    
    // Options pour la vérification des routes
    $checkOptions = [
        'useCurrentDomain' => $useCurrentDomain,
        'timeout' => $timeout,
        'verifySSL' => $verifySSL,
        'baseUrl' => $customBaseUrl
    ];
    
    // Liste des chemins API à vérifier
    $apiPaths = [
        '',
        'diagnose',
        'diagnostic-complet',
        'diagnostic',
        'config',
        'config-test',
        'database-diagnostic',
        'db-diagnostic',
        'database-diagnostics',
        'db-info',
        'database-config',
        'users',
        'utilisateurs',
        'database-test',
        'db-connection-test',
        'check-users',
        'user-diagnostic',
        'check-permissions',
        'advanced-diagnostic',
        'diagnostic-avance',
        // Chemins traduits potentiellement problématiques
        'diagnostic-avancé',
        'diagnostique',
        'diagnostique-complet',
        'diagnostique-avance',
        'diagnostique-avancé',
        'configuration',
        'test-config',
        'diagnostique-database',
        'verifier-utilisateurs',
        'info-db',
        'permissions'
    ];
    
    $results = [];
    foreach ($apiPaths as $path) {
        $results[] = checkRoute($path, $checkOptions);
    }
    
    // Vérifier les variations typographiques avec et sans accents
    $variationsToCheck = [
        'diagnostic' => ['diagnostique', 'diagnostics'],
        'avance' => ['avancé', 'avancer', 'avanc'],
        'complet' => ['complète', 'complete'],
        'utilisateurs' => ['users', 'user', 'utilisateur'],
        'permissions' => ['permission', 'droits'],
        'configuration' => ['config'],
        'database' => ['db', 'base-de-donnees', 'base-donnees', 'donnees']
    ];
    
    $additionalRoutes = [];
    foreach ($apiPaths as $path) {
        foreach ($variationsToCheck as $original => $variations) {
            foreach ($variations as $variant) {
                if (strpos($path, $original) !== false) {
                    $newPath = str_replace($original, $variant, $path);
                    if (!in_array($newPath, $apiPaths) && !in_array($newPath, $additionalRoutes)) {
                        $additionalRoutes[] = $newPath;
                    }
                }
            }
        }
    }
    
    // Vérifier les routes supplémentaires dérivées
    foreach ($additionalRoutes as $path) {
        $results[] = checkRoute($path, $checkOptions);
    }
    
    // Trier les résultats : problématiques d'abord, puis existants, puis le reste
    usort($results, function($a, $b) {
        // Donner la priorité aux routes qui répondent avec erreur 404
        if ($a['response_code'] === 404 && $b['response_code'] !== 404) {
            return -1;
        }
        if ($a['response_code'] !== 404 && $b['response_code'] === 404) {
            return 1;
        }
        
        // Ensuite, prioriser les routes qui existent
        if ($a['exists'] && !$b['exists']) {
            return -1;
        }
        if (!$a['exists'] && $b['exists']) {
            return 1;
        }
        
        // Ensuite, prioriser par type d'erreur
        if ($a['error'] && !$b['error']) {
            return -1;
        }
        if (!$a['error'] && $b['error']) {
            return 1;
        }
        
        return 0;
    });
    
    // Analyser les résultats pour les regrouper par type d'erreur
    $errorGroups = [];
    foreach ($results as $result) {
        if ($result['error']) {
            if (!isset($errorGroups[$result['error']])) {
                $errorGroups[$result['error']] = 0;
            }
            $errorGroups[$result['error']]++;
        }
    }
    
    // Regrouper les résultats par code de réponse
    $responseCodeGroups = [];
    foreach ($results as $result) {
        $code = $result['response_code'];
        if (!isset($responseCodeGroups[$code])) {
            $responseCodeGroups[$code] = 0;
        }
        $responseCodeGroups[$code]++;
    }
    
    // Calculer les métriques
    $problematicRoutes = count(array_filter($results, function($r) { return $r['response_code'] === 404; }));
    $existingRoutes = count(array_filter($results, function($r) { return $r['exists']; }));
    $connectionErrors = count(array_filter($results, function($r) { return $r['error'] !== null; }));

    echo json_encode([
        'status' => 'success',
        'message' => 'Vérification des routes terminée',
        'timestamp' => date('Y-m-d H:i:s'),
        'request_info' => [
            'use_current_domain' => $useCurrentDomain,
            'custom_base_url' => $customBaseUrl,
            'timeout' => $timeout,
            'verify_ssl' => $verifySSL
        ],
        'total_routes' => count($results),
        'problematic_routes' => $problematicRoutes,
        'existing_routes' => $existingRoutes,
        'connection_errors' => $connectionErrors,
        'error_summary' => $errorGroups,
        'response_codes_summary' => $responseCodeGroups,
        'results' => $results
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la vérification des routes',
        'error_details' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
