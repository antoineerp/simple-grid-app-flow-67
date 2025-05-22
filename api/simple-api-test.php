
<?php
// Un fichier API simple qui génère du JSON valide
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Forcer la sortie en JSON (pas de HTML ni PHP brut)
ob_start();

// Données de test
$data = [
    'success' => true,
    'message' => 'API fonctionne correctement',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server_info' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'
];

// S'assurer qu'aucun contenu HTML n'est envoyé avant les en-têtes
$output = ob_get_clean();
if ($output) {
    // Si du contenu a été généré avant, l'inclure dans la réponse pour le débogage
    $data['unexpected_output'] = $output;
}

// Envoyer la réponse JSON
echo json_encode($data, JSON_PRETTY_PRINT);
?>
