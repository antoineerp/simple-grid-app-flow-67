
<?php
// Fonctions utilitaires pour la gestion des répertoires

// Vérifie si un répertoire existe et compte ses fichiers/dossiers
function check_directory($dir) {
    if (is_dir($dir)) {
        $files = scandir($dir);
        return count($files);
    }
    return false;
}

// Copie récursivement un répertoire
function copy_directory($src, $dst) {
    $dir = opendir($src);
    @mkdir($dst);
    
    while (($file = readdir($dir)) !== false) {
        if (($file != '.') && ($file != '..')) {
            if (is_dir($src . '/' . $file)) {
                copy_directory($src . '/' . $file, $dst . '/' . $file);
            } else {
                copy($src . '/' . $file, $dst . '/' . $file);
            }
        }
    }
    
    closedir($dir);
    return true;
}

// Déplace les fichiers d'un répertoire à un autre
function move_directory_contents($src, $dst) {
    if (!is_dir($src)) {
        return false;
    }
    
    if (!is_dir($dst)) {
        mkdir($dst, 0755, true);
    }
    
    $files = glob($src . '/*');
    foreach ($files as $file) {
        $dest = $dst . '/' . basename($file);
        if (is_dir($file)) {
            copy_directory($file, $dest);
        } else {
            copy($file, $dest);
        }
    }
    
    return true;
}
