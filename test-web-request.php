
<?php
// Script pour tester une requête web et analyser les en-têtes HTTP
// Exécutez-le uniquement en SSH: php test-web-request.php

if (php_sapi_name() !== 'cli') {
    die("Ce script doit être exécuté uniquement en mode CLI (SSH).\n");
}

echo "=== TEST DE REQUÊTE WEB DEPUIS SSH ===\n";
echo "Date et heure: " . date('Y-m-d H:i:s') . "\n";

// Préparation du fichier de test
$test_filename = 'web-request-test-' . time() . '.php';
$test_content = <<<'PHP'
<?php
header('Content-Type: text/plain');
echo "SUCCESS: Le script PHP s'exécute correctement!\n";
echo "Timestamp: " . time() . "\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n";
echo "PHP Version: " . phpversion() . "\n";
?>
PHP;

// Écrire le fichier de test
file_put_contents($test_filename, $test_content);
chmod($test_filename, 0644);
echo "Fichier de test créé: $test_filename\n\n";

// Configurer l'URL pour le test
$domain = 'qualiopi.ch';
$test_url = "https://$domain/$test_filename";
echo "URL de test: $test_url\n\n";

// Fonction pour afficher les résultats d'une manière lisible
function display_response($headers, $body, $info) {
    echo "CODE HTTP: " . $info['http_code'] . "\n";
    echo "CONTENT TYPE: " . ($info['content_type'] ?? 'Non spécifié') . "\n";
    echo "TAILLE: " . strlen($body) . " octets\n";
    
    echo "\nEN-TÊTES HTTP:\n";
    echo "------------\n";
    echo $headers;
    
    echo "\nCONTENU DE LA RÉPONSE:\n";
    echo "--------------------\n";
    echo $body . "\n";
    
    // Analyse spécifique
    if (strpos($body, 'SUCCESS') !== false) {
        echo "\n✓ PHP s'exécute correctement sur le serveur web!\n";
    } else if (strpos($body, '<?php') !== false) {
        echo "\n✗ Le code PHP est retourné en texte brut - PHP n'est pas exécuté!\n";
    } else if (strpos(strtolower($headers), 'content-type: application/octet-stream') !== false) {
        echo "\n✗ Le serveur propose le téléchargement du fichier PHP au lieu de l'exécuter!\n";
    }
}

// Test avec cURL si disponible
if (function_exists('curl_init')) {
    echo "=== TEST AVEC CURL ===\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $test_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Apache PHP Test Script');
    
    $response = curl_exec($ch);
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $header_size);
    $body = substr($response, $header_size);
    $info = curl_getinfo($ch);
    
    if (curl_errno($ch)) {
        echo "ERREUR CURL: " . curl_error($ch) . "\n";
    }
    
    curl_close($ch);
    display_response($headers, $body, $info);
} else {
    echo "✗ CURL n'est pas disponible sur ce serveur\n";
}

// Test avec les streams natifs PHP
echo "\n\n=== TEST AVEC FILE_GET_CONTENTS ===\n";
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'User-Agent: Apache PHP Test Script',
        'timeout' => 10,
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false,
    ],
]);

$stream_info = [];
$headers = [];

try {
    $http_response_header = null;
    $body = @file_get_contents($test_url, false, $context);
    
    if ($body !== false) {
        // Extraire les informations de l'en-tête
        foreach ($http_response_header as $header) {
            $headers[] = $header;
            if (strpos($header, 'HTTP/') === 0) {
                $parts = explode(' ', $header);
                $stream_info['http_code'] = $parts[1] ?? 0;
            } else if (strpos(strtolower($header), 'content-type:') === 0) {
                $parts = explode(':', $header, 2);
                $stream_info['content_type'] = trim($parts[1]);
            }
        }
        
        display_response(implode("\n", $headers), $body, $stream_info);
    } else {
        echo "ERREUR: Impossible de récupérer le contenu de l'URL\n";
        if (isset($http_response_header)) {
            echo "EN-TÊTES REÇUS:\n";
            foreach ($http_response_header as $header) {
                echo $header . "\n";
            }
        }
    }
} catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
}

// Nettoyage
@unlink($test_filename);
echo "\n=== TEST TERMINÉ ===\n";
?>
