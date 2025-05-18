
<?php
// Script pour corriger automatiquement les routes en double dans App.tsx
header('Content-Type: text/html; charset=utf-8');

echo "<h1>Correction automatique des routes en double dans App.tsx</h1>";

// Chemin vers App.tsx
$appTsxPath = "src/App.tsx";

if (!file_exists($appTsxPath)) {
    die("<p style='color: red;'>Erreur: Fichier App.tsx introuvable.</p>");
}

// Lire le contenu actuel
$content = file_get_contents($appTsxPath);

// Sauvegarder une copie avant modification
$backupPath = "src/App.tsx.backup-" . date("YmdHis");
file_put_contents($backupPath, $content);
echo "<p>Sauvegarde créée: " . htmlspecialchars($backupPath) . "</p>";

// Analyser le contenu pour trouver toutes les définitions de route
preg_match_all('/<Route\s+path=[\'"]([^\'"]*)[\'"].*?>.*?<\/Route>|<Route\s+path=[\'"]([^\'"]*)[\'"].*?\/>/s', $content, $matches, PREG_OFFSET_CAPTURE);

// Collecter les routes et leurs positions
$routes = [];
$allMatches = [];

foreach ($matches[0] as $index => $match) {
    $routeContent = $match[0];
    $position = $match[1];
    
    // Extraire le chemin de la route
    if (!empty($matches[1][$index][0])) {
        $path = $matches[1][$index][0];
    } elseif (!empty($matches[2][$index][0])) {
        $path = $matches[2][$index][0];
    } else {
        continue;
    }
    
    if (!isset($routes[$path])) {
        $routes[$path] = [];
    }
    
    $routes[$path][] = [
        'content' => $routeContent,
        'position' => $position,
        'length' => strlen($routeContent),
    ];
    
    $allMatches[] = [
        'path' => $path,
        'content' => $routeContent,
        'position' => $position,
        'length' => strlen($routeContent),
    ];
}

// Trier les matches par position (de la fin vers le début pour éviter les décalages lors de la suppression)
usort($allMatches, function($a, $b) {
    return $b['position'] - $a['position'];
});

// Identifier et supprimer les doublons
$duplicatesRemoved = false;
$newContent = $content;

foreach ($routes as $path => $occurrences) {
    if (count($occurrences) > 1) {
        echo "<p>Route en double trouvée: <strong>" . htmlspecialchars($path) . "</strong> (" . count($occurrences) . " occurrences)</p>";
        
        // Garder la première occurrence, supprimer les autres
        for ($i = 1; $i < count($occurrences); $i++) {
            $start = $occurrences[$i]['position'];
            $length = $occurrences[$i]['length'];
            
            // Supprimer cette occurrence
            $newContent = substr_replace($newContent, '', $start, $length);
            $duplicatesRemoved = true;
            echo "<p>Suppression d'une occurrence en double à la position " . $start . "</p>";
        }
    }
}

if ($duplicatesRemoved) {
    // Écrire le nouveau contenu
    file_put_contents($appTsxPath, $newContent);
    echo "<p style='color: green; font-weight: bold;'>Les routes en double ont été supprimées avec succès. Veuillez vérifier le fichier App.tsx.</p>";
} else {
    echo "<p style='color: green;'>Aucune route en double trouvée. Aucune modification n'a été effectuée.</p>";
}

echo "<div style='margin-top: 20px;'>";
echo "<h3>Étapes suivantes</h3>";
echo "<p>Après la correction, vous devriez:</p>";
echo "<ol>";
echo "<li>Vérifier le fichier App.tsx pour vous assurer que toutes les routes sont correctement définies</li>";
echo "<li>Exécuter à nouveau le script check-routes.php pour confirmer qu'il n'y a plus de routes en double</li>";
echo "<li>Redéployer l'application pour appliquer les modifications</li>";
echo "<li>Tester la navigation dans l'application pour vous assurer que toutes les routes fonctionnent correctement</li>";
echo "</ol>";

echo "<div style='margin-top: 15px;'>";
echo "<a href='check-routes.php' style='display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin-right: 10px;'>Vérifier les routes</a>";
echo "<a href='/' style='display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;'>Tester l'application</a>";
echo "</div>";
echo "</div>";
?>
