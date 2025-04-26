
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
    
    // Créer un contexte pour la requête
    $context = stream_context_create([
        'http' => [
            'ignore_errors' => true,
            'timeout' => $options['timeout'],
            'follow_location' => $options['followRedirects'] ? 1 : 0,
            'max_redirects' => $options['maxRedirects'],
            'header' => [
                'User-Agent: RouteChecker/1.0',
                'Connection: close'
            ]
        ],
        'ssl' => [
            'verify_peer' => $options['verifySSL'],
            'verify_peer_name' => $options['verifySSL'],
            'allow_self_signed' => !$options['verifySSL']
        ]
    ]);
    
    // Capturer les erreurs avec un gestionnaire personnalisé
    $errorMessage = null;
    set_error_handler(function($severity, $message, $file, $line) use (&$errorMessage) {
        $errorMessage = $message;
        return true;
    });
    
    // Essayer d'obtenir le contenu
    $response = @file_get_contents($fullUrl, false, $context);
    
    // Restaurer le gestionnaire d'erreurs
    restore_error_handler();
    
    // Obtenir les en-têtes de réponse
    $status = isset($http_response_header[0]) ? $http_response_header[0] : null;
    $responseCode = $status ? intval(substr($status, 9, 3)) : 0;
    
    // Vérifier si une erreur s'est produite
    if ($response === false) {
        // Formater le message d'erreur
        if (strpos($errorMessage, "failed to open stream") !== false) {
            if (strpos($errorMessage, "Connection refused") !== false) {
                $errorDetail = "Connexion refusée";
            } elseif (strpos($errorMessage, "Connection timed out") !== false) {
                $errorDetail = "Délai de connexion dépassé";
            } elseif (strpos($errorMessage, "Name or service not known") !== false) {
                $errorDetail = "Nom de domaine non résolu";
            } elseif (strpos($errorMessage, "certificate") !== false) {
                $errorDetail = "Problème de certificat SSL";
            } else {
                $errorDetail = "Erreur de connexion";
            }
        } else {
            $errorDetail = $errorMessage ? $errorMessage : "Erreur inconnue";
        }
    } else {
        $errorDetail = null;
    }
    
    return [
        'url' => $fullUrl,
        'domain' => $domain,
        'status' => $status,
        'exists' => $response !== false && $responseCode >= 200 && $responseCode < 400,
        'response_code' => $responseCode,
        'error' => $errorDetail,
        'response_sample' => $response !== false ? substr($response, 0, 150) . '...' : null
    ];
}

try {
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
