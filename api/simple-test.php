
<?php
// Test PHP simple qui renvoie un JSON
header("Content-Type: application/json");

$data = array(
    "status" => "success",
    "message" => "PHP fonctionne correctement!",
    "php_version" => phpversion(),
    "server_software" => $_SERVER['SERVER_SOFTWARE'],
    "timestamp" => date("Y-m-d H:i:s")
);

echo json_encode($data);
?>
