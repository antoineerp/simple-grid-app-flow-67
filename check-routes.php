
<?php
// Script pour vérifier les routes dans App.tsx et détecter les doublons
header('Content-Type: text/html; charset=utf-8');

echo "<h1>Vérification des routes dans App.tsx</h1>";

// Fonction pour analyser App.tsx et extraire les routes
function analyzeRoutes($filePath) {
    if (!file_exists($filePath)) {
        return ["error" => "Fichier non trouvé: $filePath"];
    }
    
    $content = file_get_contents($filePath);
    $routes = [];
    
    // Rechercher les définitions de route <Route path="..." 
    preg_match_all('/<Route\s+path=[\'"]([^\'"]*)[\'"]/', $content, $matches);
    
    if (!empty($matches[1])) {
        foreach ($matches[1] as $route) {
            if (!isset($routes[$route])) {
                $routes[$route] = 1;
            } else {
                $routes[$route]++;
            }
        }
    }
    
    return $routes;
}

// Analyser le fichier App.tsx
$appRoutes = analyzeRoutes("src/App.tsx");

if (isset($appRoutes["error"])) {
    echo "<p>Erreur: " . htmlspecialchars($appRoutes["error"]) . "</p>";
} else {
    echo "<h2>Routes définies dans App.tsx</h2>";
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>Route</th><th>Occurrences</th><th>Statut</th></tr>";
    
    $duplicatesFound = false;
    
    foreach ($appRoutes as $route => $count) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($route) . "</td>";
        echo "<td>" . $count . "</td>";
        if ($count > 1) {
            echo "<td style='color: red; font-weight: bold;'>DOUBLON DÉTECTÉ</td>";
            $duplicatesFound = true;
        } else {
            echo "<td style='color: green;'>OK</td>";
        }
        echo "</tr>";
    }
    
    echo "</table>";
    
    if ($duplicatesFound) {
        echo "<p style='color: red; font-weight: bold;'>Des routes en double ont été détectées. Veuillez corriger App.tsx.</p>";
    } else {
        echo "<p style='color: green; font-weight: bold;'>Aucune route en double détectée. La configuration des routes est correcte.</p>";
    }
}

// Ajouter un bouton pour tester l'application
echo "<div style='margin-top: 20px;'>";
echo "<h3>Tester l'application</h3>";
echo "<p>Cliquez sur le bouton ci-dessous pour ouvrir l'application:</p>";
echo "<a href='/' style='display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;'>Ouvrir l'application</a>";
echo "</div>";

// Ajouter une section d'aide au dépannage
echo "<div style='margin-top: 30px; border: 1px solid #ddd; padding: 15px; background-color: #f9f9f9;'>";
echo "<h3>Aide au dépannage</h3>";
echo "<p>Si l'application ne se charge toujours pas après la correction des routes en double, vérifiez les points suivants:</p>";
echo "<ul>";
echo "<li>Assurez-vous que tous les fichiers JS et CSS sont correctement chargés (vérifiez la console du navigateur pour les erreurs)</li>";
echo "<li>Vérifiez que les composants importés dans App.tsx existent bien dans les chemins spécifiés</li>";
echo "<li>Vérifiez que tous les imports dans les composants sont corrects</li>";
echo "<li>Vérifiez que le service d'authentification fonctionne correctement</li>";
echo "<li>Essayez de vider le cache du navigateur ou d'utiliser une navigation privée</li>";
echo "</ul>";
echo "</div>";
?>
