
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

function checkRoute($path) {
    // Construire l'URL complète
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $domain = $_SERVER['HTTP_HOST'];
    $baseUrl = $protocol . "://" . $domain;
    $fullUrl = $baseUrl . "/api/" . $path;
    
    // Créer un contexte pour ignorer les erreurs SSL (uniquement pour les tests)
    $context = stream_context_create([
        'http' => [
            'ignore_errors' => true,
            'timeout' => 3 // timeout en secondes
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ]);
    
    $response = @file_get_contents($fullUrl, false, $context);
    $status = $http_response_header[0] ?? null;
    
    return [
        'url' => $fullUrl,
        'status' => $status,
        'exists' => $response !== false && strpos($status, '200') !== false,
        'response_code' => intval(substr($status, 9, 3)),
        'response_sample' => $response !== false ? substr($response, 0, 150) . '...' : null
    ];
}

try {
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
        $results[] = checkRoute($path);
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
        $results[] = checkRoute($path);
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
        
        return 0;
    });

    echo json_encode([
        'status' => 'success',
        'message' => 'Vérification des routes terminée',
        'timestamp' => date('Y-m-d H:i:s'),
        'total_routes' => count($results),
        'problematic_routes' => count(array_filter($results, function($r) { return $r['response_code'] === 404; })),
        'existing_routes' => count(array_filter($results, function($r) { return $r['exists']; })),
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
