
<?php
// Test d'API PHP simple qui renvoie un objet JSON
header("Content-Type: application/json");

// Test des fonctionnalités PHP
$date = new DateTime();
$functions_exist = function_exists('json_encode') && function_exists('date_format');

$result = array(
    "status" => "ok",
    "message" => "API PHP fonctionnelle",
    "details" => array(
        "php_version" => phpversion(),
        "server" => $_SERVER['SERVER_SOFTWARE'],
        "date" => date("Y-m-d H:i:s"),
        "functions_available" => $functions_exist
    )
);

echo json_encode($result);
?>
