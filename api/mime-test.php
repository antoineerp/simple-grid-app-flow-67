
<?php
// Script de diagnostic pour vérifier les MIME types
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Vérifier les types MIME configurés
function checkMimeType($extension) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $tempFile = tempnam(sys_get_temp_dir(), 'test') . ".$extension";
    file_put_contents($tempFile, "// test content");
    $mimeType = finfo_file($finfo, $tempFile);
    unlink($tempFile);
    finfo_close($finfo);
    return $mimeType;
}

// Tester les types MIME importants
$mimeTypes = [
    'js' => checkMimeType('js'),
    'mjs' => checkMimeType('mjs'),
    'css' => checkMimeType('css'),
    'json' => checkMimeType('json'),
    'html' => checkMimeType('html'),
    'php' => checkMimeType('php')
];

// Vérifier les directives Apache
$apacheModules = function_exists('apache_get_modules') ? apache_get_modules() : 'Non disponible';
$hasModMime = is_array($apacheModules) ? in_array('mod_mime', $apacheModules) : 'Inconnu';
$hasModHeaders = is_array($apacheModules) ? in_array('mod_headers', $apacheModules) : 'Inconnu';

// Vérifier les fichiers .htaccess
$htaccessRoot = file_exists($_SERVER['DOCUMENT_ROOT'] . '/.htaccess') ? 'Présent' : 'Manquant';
$htaccessAPI = file_exists($_SERVER['DOCUMENT_ROOT'] . '/api/.htaccess') ? 'Présent' : 'Manquant';
$htaccessAssets = file_exists($_SERVER['DOCUMENT_ROOT'] . '/assets/.htaccess') ? 'Présent' : 'Manquant';

// Résultat
$result = [
    'mime_types' => $mimeTypes,
    'server_software' => $_SERVER['SERVER_SOFTWARE'],
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'script_filename' => $_SERVER['SCRIPT_FILENAME'],
    'server_modules' => [
        'apache_modules' => $apacheModules,
        'mod_mime' => $hasModMime,
        'mod_headers' => $hasModHeaders
    ],
    'htaccess_files' => [
        'root' => $htaccessRoot,
        'api' => $htaccessAPI,
        'assets' => $htaccessAssets
    ],
    'php_version' => phpversion(),
    'timestamp' => date('Y-m-d H:i:s')
];

echo json_encode($result, JSON_PRETTY_PRINT);
?>
