
<?php
// Script pour diagnostiquer les assets (fichiers JS et CSS) et la configuration PHP
// Ce script vérifie la présence de fichiers JS et CSS, les références dans index.html, et le bon fonctionnement de PHP

// En-têtes pour éviter la mise en cache et permettre les accès CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Vérifier l'existence du dossier assets
$assetsDir = __DIR__ . '/../assets';
$result = [
    'status' => 'success',
    'message' => 'Tous les assets sont correctement configurés',
    'js_files' => [],
    'css_files' => [],
    'html_references' => [
        'js' => false,
        'css' => false
    ],
    'php_info' => [
        'version' => phpversion(),
        'sapi' => php_sapi_name(),
        'modules' => get_loaded_extensions(),
        'display_errors' => ini_get('display_errors'),
        'error_reporting' => ini_get('error_reporting'),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
        'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown'
    ]
];

// Test spécifique pour vérifier l'exécution PHP
$result['php_execution'] = [
    'status' => 'success',
    'message' => 'PHP est exécuté correctement dans ce fichier'
];

// Vérifier le répertoire assets
if (!is_dir($assetsDir)) {
    $result['status'] = 'error';
    $result['message'] = "Le répertoire assets n'existe pas";
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Liste des fichiers JS
$js_files = glob($assetsDir . '/*.js');
if (!empty($js_files)) {
    foreach ($js_files as $file) {
        $result['js_files'][] = basename($file);
    }
} else {
    $result['status'] = 'error';
    $result['message'] = "Aucun fichier JavaScript trouvé dans le dossier assets";
}

// Liste des fichiers CSS
$css_files = glob($assetsDir . '/*.css');
if (!empty($css_files)) {
    foreach ($css_files as $file) {
        $result['css_files'][] = basename($file);
    }
} else {
    $result['status'] = 'error';
    $result['message'] = "Aucun fichier CSS trouvé dans le dossier assets";
}

// Vérifier les références dans index.html
$indexHtmlPath = __DIR__ . '/../index.html';
if (file_exists($indexHtmlPath)) {
    $indexContent = file_get_contents($indexHtmlPath);
    
    // Vérifier les références JS
    $jsReferenced = preg_match('/<script[^>]*src="[^"]*\.(js|mjs)"[^>]*>/i', $indexContent);
    $result['html_references']['js'] = (bool)$jsReferenced;
    
    // Vérifier les références CSS
    $cssReferenced = preg_match('/<link[^>]*href="[^"]*\.css"[^>]*>/i', $indexContent);
    $result['html_references']['css'] = (bool)$cssReferenced;
    
    // Si des références sont manquantes
    if (!$jsReferenced || !$cssReferenced) {
        $result['status'] = 'error';
        $result['message'] = "Des références aux assets sont manquantes dans index.html";
    }
} else {
    $result['status'] = 'error';
    $result['message'] = "Le fichier index.html est introuvable";
}

// Si les vérifications précédentes n'ont pas trouvé d'erreur mais qu'il n'y a pas de fichiers
if ($result['status'] === 'success' && (empty($result['js_files']) || empty($result['css_files']))) {
    $result['status'] = 'error';
    $result['message'] = "Des fichiers JS ou CSS sont manquants";
}

// Vérifier la configuration PHP spécifique d'Infomaniak
if (strpos($_SERVER['SERVER_SOFTWARE'] ?? '', 'infomaniak') !== false || 
    strpos($_SERVER['HTTP_HOST'] ?? '', 'infomaniak') !== false || 
    strpos($_SERVER['HTTP_HOST'] ?? '', 'qualiopi.ch') !== false) {
    
    $result['infomaniak_config'] = [
        'detected' => true,
        'htaccess_api' => file_exists(__DIR__ . '/.htaccess') ? 'Présent' : 'Manquant',
        'htaccess_root' => file_exists(__DIR__ . '/../.htaccess') ? 'Présent' : 'Manquant',
        'user_ini_api' => file_exists(__DIR__ . '/.user.ini') ? 'Présent' : 'Manquant',
        'user_ini_root' => file_exists(__DIR__ . '/../.user.ini') ? 'Présent' : 'Manquant',
        'api_folder_readable' => is_readable(__DIR__) ? 'Oui' : 'Non',
        'api_folder_writable' => is_writable(__DIR__) ? 'Oui' : 'Non'
    ];
}

// Vérifier les permissions des fichiers dans /api
$apiFiles = glob(__DIR__ . '/*.php');
$permissions = [];

foreach ($apiFiles as $file) {
    $basename = basename($file);
    $perms = fileperms($file);
    $permissions[$basename] = [
        'readable' => is_readable($file) ? 'Oui' : 'Non',
        'writable' => is_writable($file) ? 'Oui' : 'Non',
        'executable' => is_executable($file) ? 'Oui' : 'Non',
        'octal_perms' => substr(sprintf('%o', $perms), -4)
    ];
}

$result['file_permissions'] = $permissions;

// Test de configuration avec phpinfo
$result['phpinfo_test'] = [
    'available' => function_exists('phpinfo') ? 'Oui' : 'Non',
    'url' => '/api/phpinfo.php'
];

// Tester les fichiers PHP courants pour vérifier l'exécution
$phpTestFiles = [
    'index.php', 'info.php', 'check-php.php', 'check-system.php'
];

$fileTests = [];
foreach ($phpTestFiles as $file) {
    $filePath = __DIR__ . '/' . $file;
    $fileTests[$file] = [
        'exists' => file_exists($filePath) ? 'Oui' : 'Non',
        'readable' => file_exists($filePath) && is_readable($filePath) ? 'Oui' : 'Non',
        'url' => '/api/' . $file
    ];
}

$result['php_file_tests'] = $fileTests;

// Générer des recommandations
if ($result['status'] === 'error') {
    $recommendations = [];
    
    if (!is_dir($assetsDir)) {
        $recommendations[] = "Créer le répertoire assets à la racine de l'application";
    }
    
    if (empty($result['js_files'])) {
        $recommendations[] = "Exécuter 'npm run build' pour générer les fichiers JavaScript";
    }
    
    if (empty($result['css_files'])) {
        $recommendations[] = "Exécuter 'npm run build' pour générer les fichiers CSS";
    }
    
    if (!$result['html_references']['js'] || !$result['html_references']['css']) {
        $recommendations[] = "Utiliser le script fix-index-references.php pour corriger les références dans index.html";
    }
    
    if (isset($result['infomaniak_config']) && $result['infomaniak_config']['detected']) {
        if ($result['infomaniak_config']['htaccess_api'] === 'Manquant') {
            $recommendations[] = "Créer un fichier .htaccess dans le dossier /api avec les bonnes directives PHP";
        }
        if ($result['infomaniak_config']['user_ini_api'] === 'Manquant') {
            $recommendations[] = "Créer un fichier .user.ini dans le dossier /api pour configurer PHP";
        }
        $recommendations[] = "Vérifier dans le panneau de configuration d'Infomaniak que PHP est activé pour le dossier /api";
    }
    
    $result['recommendations'] = $recommendations;
}

// Suggestions Infomaniak
if (isset($result['infomaniak_config']) && $result['infomaniak_config']['detected']) {
    $result['infomaniak_help'] = [
        "Accédez au Manager Infomaniak et naviguez vers votre hébergement web",
        "Dans la section 'Configuration' -> 'Générales', assurez-vous que PHP est activé",
        "Vérifiez la section 'Configuration' -> 'Domaines et SSL' pour s'assurer que le domaine est bien configuré",
        "Dans les paramètres PHP, vérifiez que la version PHP est suffisante (7.4+ recommandée)",
        "Si nécessaire, ajoutez un .htaccess dans le dossier /api avec le contenu approprié"
    ];
}

// Ajouter un timestamp
$result['timestamp'] = date('Y-m-d H:i:s');

// Retourner les résultats au format JSON
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
