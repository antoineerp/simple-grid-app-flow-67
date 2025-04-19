
<?php
header('Content-Type: application/json');

// Enable error reporting in the response for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $root_dir = __DIR__ . '/..';
    $dist_dir = $root_dir . '/dist';
    $assets_dir = $dist_dir . '/assets';
    $src_dir = $root_dir . '/src';
    
    $diagnostics = [
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => [
            'php_version' => phpversion(),
            'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
            'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
        ],
        'directory_check' => [
            'dist_exists' => is_dir($dist_dir),
            'assets_exists' => is_dir($assets_dir),
            'src_exists' => is_dir($src_dir)
        ]
    ];
    
    // Check directory contents
    if (is_dir($dist_dir)) {
        $diagnostics['dist_contents'] = scandir($dist_dir);
    }
    
    if (is_dir($assets_dir)) {
        $diagnostics['assets_contents'] = scandir($assets_dir);
    } else {
        // Suggest creating assets directory
        $diagnostics['suggestion'] = "The assets directory doesn't exist. The app may not have been built properly.";
        
        // Check if we can create these directories
        $diagnostics['can_create_dist'] = is_writable($root_dir);
        if (!is_dir($dist_dir) && is_writable($root_dir)) {
            mkdir($dist_dir, 0755, true);
            $diagnostics['dist_created'] = true;
        }
        
        if (is_dir($dist_dir) && is_writable($dist_dir)) {
            mkdir($assets_dir, 0755, true);
            $diagnostics['assets_created'] = true;
        }
    }
    
    // Check .htaccess configuration
    $htaccess_path = $root_dir . '/.htaccess';
    if (file_exists($htaccess_path) && is_readable($htaccess_path)) {
        $htaccess_content = file_get_contents($htaccess_path);
        $diagnostics['htaccess_check'] = [
            'has_assets_rule' => strpos($htaccess_content, 'RewriteRule ^assets/') !== false,
            'has_dist_rule' => strpos($htaccess_content, 'RewriteRule ^dist/') !== false
        ];
    }
    
    echo json_encode($diagnostics, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_PRETTY_PRINT);
}
