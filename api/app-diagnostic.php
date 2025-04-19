
<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Enable error reporting in the response for debugging
$diagnostics = [];

try {
    // Check directory paths
    $root_dir = __DIR__ . '/..';
    $src_dir = $root_dir . '/src';
    $pages_dir = $src_dir . '/pages';
    $dist_dir = $root_dir . '/dist';
    $assets_dir = $dist_dir . '/assets';
    $public_dir = $root_dir . '/public';
    
    // Verify essential directories
    $diagnostics['directories'] = [
        'root' => is_dir($root_dir),
        'src' => is_dir($src_dir),
        'pages' => is_dir($pages_dir),
        'dist' => is_dir($dist_dir),
        'assets' => is_dir($assets_dir),
        'public' => is_dir($public_dir)
    ];
    
    // If dist directory doesn't exist, try to create it
    if (!is_dir($dist_dir)) {
        $diagnostics['dist_creation_attempt'] = mkdir($dist_dir, 0755, true);
    }
    
    // If assets directory doesn't exist, try to create it
    if (is_dir($dist_dir) && !is_dir($assets_dir)) {
        $diagnostics['assets_creation_attempt'] = mkdir($assets_dir, 0755, true);
    }
    
    // Test file existence with error handling
    $diagnostics['routes'] = [
        '/' => file_exists($root_dir . '/index.html'),
        '/pilotage' => file_exists($pages_dir . '/Pilotage.tsx'),
        '/exigences' => file_exists($pages_dir . '/Exigences.tsx'),
        '/gestion-documentaire' => file_exists($pages_dir . '/GestionDocumentaire.tsx'),
    ];
    
    // Check if main files exist, with both .jsx and .tsx extension possibilities
    $diagnostics['core_files'] = [
        'main.jsx' => file_exists($src_dir . '/main.jsx'),
        'main.tsx' => file_exists($src_dir . '/main.tsx'), 
        'App.tsx' => file_exists($src_dir . '/App.tsx'),
        'index.html' => file_exists($root_dir . '/index.html'),
    ];
    
    // Check if asset files exist
    $diagnostics['assets'] = [
        'index.js' => file_exists($assets_dir . '/index.js'),
        'main.js' => file_exists($assets_dir . '/main.js'),
        'index.css' => file_exists($assets_dir . '/index.css'),
        'vendor.js' => file_exists($assets_dir . '/vendor.js')
    ];
    
    // PHP configuration and server info
    $diagnostics['php_config'] = [
        'handlers' => [
            'php_handler' => ini_get('cgi.force_redirect') ? 'CGI/FastCGI' : 'Apache Module',
            'default_handler' => get_cfg_var('mime.types') ?: 'Unknown'
        ],
        'current_dir' => getcwd(),
        'app_directory' => $root_dir,
        'php.ini' => php_ini_loaded_file()
    ];
    
    $diagnostics['system_check'] = [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
        'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
        'http_host' => $_SERVER['HTTP_HOST'] ?? 'Unknown',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown'
    ];
    
    // Vérification des permissions des répertoires
    $diagnostics['permissions'] = [
        'root_writeable' => is_writable($root_dir),
        'dist_writeable' => is_dir($dist_dir) ? is_writable($dist_dir) : false,
        'assets_writeable' => is_dir($assets_dir) ? is_writable($assets_dir) : false
    ];
    
    // Instructions de débogage
    $diagnostics['debug_info'] = [
        'missing_dist' => !is_dir($dist_dir) ? 'Le dossier dist est manquant. Exécutez npm run build.' : null,
        'missing_assets' => (is_dir($dist_dir) && !is_dir($assets_dir)) ? 'Le dossier assets est manquant. Vérifiez la configuration de build.' : null,
        'build_required' => (!file_exists($assets_dir . '/main.js')) ? 'Les fichiers de build sont manquants. Exécutez npm run build.' : null
    ];
    
    echo json_encode([
        'status' => 'success',
        'diagnostics' => $diagnostics
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    // Return error information
    echo json_encode([
        'status' => 'error',
        'message' => 'Diagnostic error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_PRETTY_PRINT);
}
