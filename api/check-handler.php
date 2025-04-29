
<?php
// Script pour vérifier les gestionnaires PHP et Apache
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Tester que PHP est exécuté
$results = [
    "php_execution" => true,
    "timestamp" => date("Y-m-d H:i:s"),
    "php_version" => phpversion(),
    "sapi" => php_sapi_name(),
    "server_software" => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    "document_root" => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
    "script_path" => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
    "modules" => get_loaded_extensions()
];

// Vérifier les fichiers de configuration spécifiques à Apache
$results["apache_config"] = [
    "htaccess_root" => file_exists(__DIR__ . '/../.htaccess') ? "Présent" : "Manquant",
    "htaccess_api" => file_exists(__DIR__ . '/.htaccess') ? "Présent" : "Manquant",
    "user_ini_api" => file_exists(__DIR__ . '/.user.ini') ? "Présent" : "Manquant"
];

// Tester si les handlers sont correctement configurés
if (function_exists('apache_get_modules')) {
    $results["apache_modules"] = apache_get_modules();
    $results["mod_php"] = in_array('mod_php', $results["apache_modules"]);
    $results["mod_rewrite"] = in_array('mod_rewrite', $results["apache_modules"]);
} else {
    $results["apache_modules"] = "Non disponible (fonction apache_get_modules non disponible)";
    $results["is_apache"] = strpos($_SERVER['SERVER_SOFTWARE'] ?? '', 'Apache') !== false;
}

// Résultat final
echo json_encode($results, JSON_PRETTY_PRINT);
?>
