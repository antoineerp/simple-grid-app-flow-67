
<?php
// Définir le type de contenu en texte simple
header('Content-Type: text/plain');

// Afficher des informations de base de PHP
echo "PHP Debug - FormaCert\n";
echo "===================\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Server API: " . php_sapi_name() . "\n";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Script Filename: " . $_SERVER['SCRIPT_FILENAME'] . "\n\n";

// Vérification des configurations
echo "PHP Handler Check\n";
echo "===================\n";
echo "php_sapi_name(): " . php_sapi_name() . "\n";
echo "PHP loaded .ini: " . php_ini_loaded_file() . "\n\n";

// Vérification des modules chargés
echo "Loaded Extensions\n";
echo "===================\n";
$extensions = get_loaded_extensions();
sort($extensions);
foreach ($extensions as $ext) {
    echo "- " . $ext . "\n";
}

// Information de requête
echo "\nRequest Information\n";
echo "===================\n";
echo "REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "REQUEST_URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "SCRIPT_NAME: " . $_SERVER['SCRIPT_NAME'] . "\n";
echo "QUERY_STRING: " . $_SERVER['QUERY_STRING'] . "\n\n";

// Vérification du handler PHP
echo "Handler Test\n";
echo "===================\n";
echo "Ce message confirme que le gestionnaire PHP fonctionne.\n";
?>
