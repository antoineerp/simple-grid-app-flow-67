
<?php
header('Content-Type: application/json');

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
    
    $diagnostics['system_check'] = [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
        'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown'
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
