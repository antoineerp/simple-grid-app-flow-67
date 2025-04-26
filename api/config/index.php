
<?php
// Bloquer l'accès direct
header("HTTP/1.1 403 Forbidden");
header("Content-Type: application/json");
echo json_encode([
  "error" => "Accès direct interdit",
  "status" => 403
]);
exit;
?>
