
<?php
// Vérifier si le fichier est accédé directement ou inclus
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    // Bloquer l'accès direct uniquement si ce fichier est appelé directement
    header("HTTP/1.1 403 Forbidden");
    header("Content-Type: application/json");
    echo json_encode([
      "error" => "Accès direct interdit",
      "status" => 403
    ]);
    exit;
}

// Code de configuration qui peut être inclus par d'autres fichiers
// Définir des constantes ou des variables de configuration globales ici
// Par exemple : définir le chemin racine de l'API
if (!defined('API_ROOT')) {
    define('API_ROOT', dirname(__DIR__));
}

// Configuration d'encodage pour tous les scripts
ini_set('default_charset', 'UTF-8');
?>
