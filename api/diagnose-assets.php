
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
        
        // Vérifier spécifiquement pour main.js
        $main_js_exists = file_exists($assets_dir . '/main.js');
        $diagnostics['main_js_exists'] = $main_js_exists;
        
        // Si main.js n'existe pas mais qu'index.js existe, suggérer de renommer
        if (!$main_js_exists && file_exists($assets_dir . '/index.js')) {
            $diagnostics['suggestion'] = "Le fichier main.js est manquant mais index.js existe. Votre index.html cherche main.js.";
            $diagnostics['possible_solution'] = "Modifier index.html pour utiliser index.js au lieu de main.js, ou renommer index.js en main.js.";
        }
    } else {
        // Suggest creating assets directory
        $diagnostics['suggestion'] = "Le dossier assets n'existe pas. L'application n'a probablement pas été construite correctement. Exécutez 'npm run build'.";
        
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
    
    // Vérifier index.html
    $index_html_path = $root_dir . '/index.html';
    if (file_exists($index_html_path) && is_readable($index_html_path)) {
        $index_html_content = file_get_contents($index_html_path);
        $diagnostics['index_html_check'] = [
            'references_main_js' => strpos($index_html_content, 'main.js') !== false,
            'references_index_js' => strpos($index_html_content, 'index.js') !== false
        ];
    }
    
    // Vérifier les éventuels problèmes et fournir des suggestions
    $diagnostics['build_status'] = [
        'need_npm_build' => !is_dir($assets_dir) || (is_dir($assets_dir) && count(scandir($assets_dir)) <= 2),
        'actions_required' => []
    ];
    
    if (!is_dir($assets_dir) || (is_dir($assets_dir) && count(scandir($assets_dir)) <= 2)) {
        $diagnostics['build_status']['actions_required'][] = "Exécutez 'npm run build' pour générer les fichiers d'assets";
    }
    
    // Configuration de Vite
    $vite_config_path = $root_dir . '/vite.config.ts';
    if (file_exists($vite_config_path) && is_readable($vite_config_path)) {
        $vite_config_content = file_get_contents($vite_config_path);
        $diagnostics['vite_config'] = [
            'output_config' => strpos($vite_config_content, 'entryFileNames:') !== false,
            'custom_entry_name' => strpos($vite_config_content, 'entryFileNames: \'assets/[name].js\'') !== false
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
