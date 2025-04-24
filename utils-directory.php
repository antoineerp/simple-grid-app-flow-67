
<?php
// Utility functions for directory operations

// Get a list of all files in a directory recursively
function list_files_recursive($dir, $base = '') {
    $files = [];
    
    if (empty($base)) {
        $base = $dir;
    }
    
    if (is_dir($dir)) {
        $items = scandir($dir);
        
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            
            $path = $dir . '/' . $item;
            
            if (is_dir($path)) {
                $files = array_merge($files, list_files_recursive($path, $base));
            } else {
                $relative_path = substr($path, strlen($base) + 1);
                $files[] = $relative_path;
            }
        }
    }
    
    return $files;
}

// Create directory if it doesn't exist
function ensure_directory($path) {
    if (!file_exists($path)) {
        return mkdir($path, 0755, true);
    }
    return is_dir($path);
}

// Check if a file exists in multiple possible locations
function find_file($filename, $possible_paths) {
    foreach ($possible_paths as $path) {
        $full_path = rtrim($path, '/') . '/' . $filename;
        if (file_exists($full_path)) {
            return $full_path;
        }
    }
    return false;
}

// Count files by extension in a directory
function count_files_by_extension($dir) {
    $extensions = [];
    
    if (is_dir($dir)) {
        $files = scandir($dir);
        
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            
            if (is_file($dir . '/' . $file)) {
                $ext = pathinfo($file, PATHINFO_EXTENSION);
                if (!isset($extensions[$ext])) {
                    $extensions[$ext] = 0;
                }
                $extensions[$ext]++;
            }
        }
    }
    
    return $extensions;
}
