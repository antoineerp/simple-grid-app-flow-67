
<?php
// Utility functions for handling assets

// Find all assets of a specific type in a directory
function find_assets_in_dir($dir_path, $type) {
    $files = [];
    
    if (is_dir($dir_path)) {
        $all_files = scandir($dir_path);
        foreach ($all_files as $file) {
            if ($file != '.' && $file != '..' && pathinfo($file, PATHINFO_EXTENSION) === $type) {
                $files[] = $file;
            }
        }
    }
    
    return $files;
}

// List assets with modification time for display
function list_assets($files) {
    $output = '';
    foreach ($files as $file) {
        $mtime = file_exists('../assets/' . $file) ? filemtime('../assets/' . $file) : 0;
        $output .= "<li>$file <small class='text-gray-500'>(" . date('Y-m-d H:i:s', $mtime) . ")</small></li>";
    }
    return $output;
}

// Find the latest asset matching a pattern
function find_latest_asset($files, $pattern = '') {
    $latest_file = null;
    $latest_time = 0;
    
    foreach ($files as $file) {
        if (empty($pattern) || strpos($file, $pattern) !== false || preg_match('/-[a-zA-Z0-9]{8}\./', $file)) {
            $filepath = '../assets/' . $file;
            if (file_exists($filepath)) {
                $mtime = filemtime($filepath);
                if ($mtime > $latest_time) {
                    $latest_time = $mtime;
                    $latest_file = $file;
                }
            }
        }
    }
    
    return [$latest_file, $latest_time];
}

// Find a main JS file, prioritizing hashed versions
function find_main_js() {
    $assets_dir = '../assets/';
    $files = glob($assets_dir . '*.js');
    
    // D'abord chercher index.js (non-hashé)
    if (file_exists($assets_dir . 'index.js')) {
        return 'index.js';
    }
    
    // Chercher main-[hash].js (version hashée)
    $main_pattern = '/main-[a-zA-Z0-9]{8,}\.js$/';
    foreach ($files as $file) {
        if (preg_match($main_pattern, $file)) {
            return basename($file);
        }
    }
    
    // Si aucun fichier spécifique trouvé, retourner le premier .js
    if (!empty($files)) {
        return basename($files[0]);
    }
    
    return null;
}

// Find a main CSS file, prioritizing hashed versions
function find_main_css() {
    $assets_dir = '../assets/';
    $files = glob($assets_dir . '*.css');
    
    // D'abord chercher index.css (non-hashé)
    if (file_exists($assets_dir . 'index.css')) {
        return 'index.css';
    }
    
    // Chercher index-[hash].css ou style-[hash].css (versions hashées)
    $patterns = ['/index-[a-zA-Z0-9]{8,}\.css$/', '/style-[a-zA-Z0-9]{8,}\.css$/'];
    
    foreach ($patterns as $pattern) {
        foreach ($files as $file) {
            if (preg_match($pattern, $file)) {
                return basename($file);
            }
        }
    }
    
    // Si aucun fichier spécifique trouvé, retourner le premier .css
    if (!empty($files)) {
        return basename($files[0]);
    }
    
    return null;
}
