
<?php
// Utility: Directory structure checks and helpers

// Checks if a directory exists, returns count of files or false
function check_directory($dir) {
    if (is_dir($dir)) {
        $files = glob($dir . '/*');
        return count($files);
    }
    return false;
}

// Returns an array of found JavaScript or CSS assets in a directory
function find_assets_in_dir($dir, $type = 'js') {
    $pattern = rtrim($dir, '/') . '/*.' . ($type === 'css' ? 'css' : 'js');
    return glob($pattern);
}

// Helper to print a list of files, limited by $max
function print_file_list($files, $max = 5) {
    $output = '';
    $count = count($files);
    for ($i = 0; $i < min($count, $max); $i++) {
        $output .= "<li>" . basename($files[$i]) . "</li>";
    }
    if ($count > $max) {
        $output .= "<li>... et " . ($count - $max) . " autres fichiers</li>";
    }
    return $output;
}
