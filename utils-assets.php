
<?php
// Fonctions utilitaires pour la gestion des assets compilés

// Trouver tous les assets d'un type donné dans un répertoire
function find_assets_in_dir($directory, $type) {
    if (!is_dir($directory)) {
        return [];
    }
    
    if ($type === 'js') {
        return glob("$directory/*.js");
    } else if ($type === 'css') {
        return glob("$directory/*.css");
    }
    
    return [];
}

// Trouver le dernier asset créé correspondant à un pattern
function find_latest_asset($files, $prefix = '') {
    $latest_time = 0;
    $latest_file = '';
    
    foreach ($files as $file) {
        $basename = basename($file);
        if (empty($prefix) || strpos($basename, $prefix) === 0) {
            $mtime = filemtime($file);
            if ($mtime > $latest_time) {
                $latest_time = $mtime;
                $latest_file = $basename;
            }
        }
    }
    
    return [$latest_file, $latest_time];
}

// Liste les assets trouvés avec leurs dates de modification
function list_assets($files) {
    $output = '';
    foreach ($files as $file) {
        $basename = basename($file);
        $mtime = filemtime($file);
        $output .= "<li>{$basename} <small class='text-gray-500'>(" . date('Y-m-d H:i:s', $mtime) . ")</small></li>";
    }
    return $output;
}
