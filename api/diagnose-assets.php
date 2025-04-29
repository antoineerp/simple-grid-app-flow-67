
<?php
// Script pour diagnostiquer les assets (fichiers JS et CSS)
// Ce script vérifie la présence de fichiers JS et CSS et les références dans index.html

// En-têtes pour éviter la mise en cache et permettre les accès CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Vérifier l'existence du dossier assets
$assetsDir = __DIR__ . '/../assets';
$assets = [
    'status' => 'success',
    'message' => 'Tous les assets sont correctement configurés',
    'js_files' => [],
    'css_files' => [],
    'html_references' => [
        'js' => false,
        'css' => false
    ]
];

// Vérifier le répertoire assets
if (!is_dir($assetsDir)) {
    $assets['status'] = 'error';
    $assets['message'] = "Le répertoire assets n'existe pas";
    echo json_encode($assets, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Liste des fichiers JS
$js_files = glob($assetsDir . '/*.js');
if (!empty($js_files)) {
    foreach ($js_files as $file) {
        $assets['js_files'][] = basename($file);
    }
} else {
    $assets['status'] = 'error';
    $assets['message'] = "Aucun fichier JavaScript trouvé dans le dossier assets";
}

// Liste des fichiers CSS
$css_files = glob($assetsDir . '/*.css');
if (!empty($css_files)) {
    foreach ($css_files as $file) {
        $assets['css_files'][] = basename($file);
    }
} else {
    $assets['status'] = 'error';
    $assets['message'] = "Aucun fichier CSS trouvé dans le dossier assets";
}

// Vérifier les références dans index.html
$indexHtmlPath = __DIR__ . '/../index.html';
if (file_exists($indexHtmlPath)) {
    $indexContent = file_get_contents($indexHtmlPath);
    
    // Vérifier les références JS
    $jsReferenced = preg_match('/<script[^>]*src="[^"]*\.(js|mjs)"[^>]*>/i', $indexContent);
    $assets['html_references']['js'] = (bool)$jsReferenced;
    
    // Vérifier les références CSS
    $cssReferenced = preg_match('/<link[^>]*href="[^"]*\.css"[^>]*>/i', $indexContent);
    $assets['html_references']['css'] = (bool)$cssReferenced;
    
    // Si des références sont manquantes
    if (!$jsReferenced || !$cssReferenced) {
        $assets['status'] = 'error';
        $assets['message'] = "Des références aux assets sont manquantes dans index.html";
    }
} else {
    $assets['status'] = 'error';
    $assets['message'] = "Le fichier index.html est introuvable";
}

// Si les vérifications précédentes n'ont pas trouvé d'erreur mais qu'il n'y a pas de fichiers
if ($assets['status'] === 'success' && (empty($assets['js_files']) || empty($assets['css_files']))) {
    $assets['status'] = 'error';
    $assets['message'] = "Des fichiers JS ou CSS sont manquants";
}

// Générer des recommandations
if ($assets['status'] === 'error') {
    $recommendations = [];
    
    if (!is_dir($assetsDir)) {
        $recommendations[] = "Créer le répertoire assets à la racine de l'application";
    }
    
    if (empty($assets['js_files'])) {
        $recommendations[] = "Exécuter 'npm run build' pour générer les fichiers JavaScript";
    }
    
    if (empty($assets['css_files'])) {
        $recommendations[] = "Exécuter 'npm run build' pour générer les fichiers CSS";
    }
    
    if (!$assets['html_references']['js'] || !$assets['html_references']['css']) {
        $recommendations[] = "Utiliser le script fix-index-references.php pour corriger les références dans index.html";
    }
    
    $assets['recommendations'] = $recommendations;
}

// Ajouter un timestamp
$assets['timestamp'] = date('Y-m-d H:i:s');

// Retourner les résultats au format JSON
echo json_encode($assets, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
