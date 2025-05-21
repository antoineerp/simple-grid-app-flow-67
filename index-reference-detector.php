
<?php
// Script de détection des références dans index.html
function detectReferences($filePath) {
    if (!file_exists($filePath)) {
        return [
            'exists' => false,
            'message' => 'Le fichier n\'existe pas'
        ];
    }
    
    $content = file_get_contents($filePath);
    $result = [
        'exists' => true,
        'hasGptEngScript' => false,
        'hasMainScript' => false,
        'hasStylesheet' => false,
        'references' => []
    ];
    
    // Détecter le script GPT Engineer
    if (preg_match('/<script[^>]*src=[\'"]https:\/\/cdn\.gpteng\.co\/gptengineer\.js[\'"][^>]*>/', $content)) {
        $result['hasGptEngScript'] = true;
        $result['references'][] = 'GPT Engineer Script';
    }
    
    // Détecter les scripts principaux
    if (preg_match_all('/<script[^>]*src=[\'"]([^\'"]+)[\'"][^>]*>/', $content, $matches)) {
        foreach ($matches[1] as $script) {
            $result['references'][] = 'Script: ' . $script;
            
            if (strpos($script, '/src/main') !== false || 
                strpos($script, '/assets/main') !== false || 
                strpos($script, '/assets/index') !== false) {
                $result['hasMainScript'] = true;
                $result['mainScript'] = $script;
            }
        }
    }
    
    // Détecter les feuilles de style
    if (preg_match_all('/<link[^>]*href=[\'"]([^\'"]+\.css)[\'"][^>]*>/', $content, $matches)) {
        foreach ($matches[1] as $stylesheet) {
            $result['references'][] = 'Style: ' . $stylesheet;
            $result['hasStylesheet'] = true;
        }
    }
    
    if (!$result['hasMainScript']) {
        $result['mainScriptMissing'] = true;
    }
    
    return $result;
}

// Test de détection pour index.html
$indexPath = __DIR__ . '/index.html';
$results = detectReferences($indexPath);

if ($results['exists']) {
    echo "index.html trouvé avec " . count($results['references']) . " références.\n";
    echo "Script principal détecté: " . ($results['hasMainScript'] ? "OUI" : "NON") . "\n";
    echo "Script GPT Engineer: " . ($results['hasGptEngScript'] ? "OUI" : "NON") . "\n";
    echo "Feuille de style: " . ($results['hasStylesheet'] ? "OUI" : "NON") . "\n";
    
    echo "\nRéférences trouvées:\n";
    foreach ($results['references'] as $ref) {
        echo "- $ref\n";
    }
} else {
    echo "index.html non trouvé.\n";
}
