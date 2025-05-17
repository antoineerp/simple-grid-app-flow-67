
<?php
header('Content-Type: text/html; charset=UTF-8');

// Fonction pour analyser un fichier TypeScript et extraire les routes
function extractRoutes($filePath) {
    if (!file_exists($filePath)) {
        return ['error' => "Fichier non trouvé: $filePath"];
    }
    
    $content = file_get_contents($filePath);
    $routes = [];
    
    // Recherche des déclarations de route dans les fichiers React Router
    preg_match_all('/<Route\s+[^>]*path=["\']([^"\']*)["\'][^>]*>/', $content, $matches);
    
    if (isset($matches[1]) && count($matches[1]) > 0) {
        foreach ($matches[1] as $route) {
            if ($route !== '*' && $route !== '') { // Ignorer les routes wildcard
                $routes[] = $route;
            }
        }
    }
    
    return $routes;
}

// Fonction pour trouver tous les fichiers TypeScript/JSX dans un répertoire récursivement
function findTsFiles($dir) {
    $results = [];
    $files = scandir($dir);
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        $path = $dir . '/' . $file;
        
        if (is_dir($path)) {
            $results = array_merge($results, findTsFiles($path));
        } else {
            if (preg_match('/\.(tsx|ts|jsx|js)$/', $file)) {
                $results[] = $path;
            }
        }
    }
    
    return $results;
}

// Fonction pour vérifier si un tableau contient des doublons
function findDuplicates($array) {
    $counts = array_count_values($array);
    $duplicates = [];
    
    foreach ($counts as $value => $count) {
        if ($count > 1) {
            $duplicates[$value] = $count;
        }
    }
    
    return $duplicates;
}

// Analyse le fichier App.tsx principal pour les routes
$appRoutes = extractRoutes(__DIR__ . '/src/App.tsx');

echo "<h1>Analyse des routes de l'application</h1>";

// Afficher les routes trouvées dans App.tsx
echo "<h2>Routes dans App.tsx</h2>";
if (isset($appRoutes['error'])) {
    echo "<p>Erreur: {$appRoutes['error']}</p>";
} else {
    echo "<ul>";
    foreach ($appRoutes as $route) {
        echo "<li>$route</li>";
    }
    echo "</ul>";
    
    // Vérifier les doublons dans App.tsx
    $duplicates = findDuplicates($appRoutes);
    if (count($duplicates) > 0) {
        echo "<h3>Routes en double dans App.tsx:</h3>";
        echo "<ul class='duplicates'>";
        foreach ($duplicates as $route => $count) {
            echo "<li>$route (apparaît $count fois)</li>";
        }
        echo "</ul>";
    } else {
        echo "<p>Aucune route en double trouvée dans App.tsx.</p>";
    }
}

// Rechercher les routes dans tous les fichiers TypeScript/JSX
echo "<h2>Routes dans tous les fichiers du projet</h2>";

$allRoutes = [];
$routesByFile = [];
$tsFiles = findTsFiles(__DIR__ . '/src');

foreach ($tsFiles as $file) {
    $routes = extractRoutes($file);
    
    if (!isset($routes['error']) && count($routes) > 0) {
        $shortPath = str_replace(__DIR__ . '/', '', $file);
        $routesByFile[$shortPath] = $routes;
        $allRoutes = array_merge($allRoutes, $routes);
    }
}

// Afficher les routes par fichier
if (count($routesByFile) > 0) {
    echo "<h3>Routes par fichier</h3>";
    foreach ($routesByFile as $file => $routes) {
        echo "<h4>$file</h4>";
        echo "<ul>";
        foreach ($routes as $route) {
            echo "<li>$route</li>";
        }
        echo "</ul>";
    }
} else {
    echo "<p>Aucune autre route trouvée dans les fichiers du projet.</p>";
}

// Vérifier les doublons dans toutes les routes
if (count($allRoutes) > 0) {
    $allDuplicates = findDuplicates($allRoutes);
    
    if (count($allDuplicates) > 0) {
        echo "<h3>Routes en double dans l'application:</h3>";
        echo "<ul class='duplicates'>";
        foreach ($allDuplicates as $route => $count) {
            echo "<li>$route (apparaît $count fois dans le projet)</li>";
        }
        echo "</ul>";
    } else {
        echo "<p>Aucune route en double trouvée dans l'ensemble de l'application.</p>";
    }
}

// Analyser les liens dans les composants de navigation
echo "<h2>Analyse des liens de navigation</h2>";

// Recherche des liens dans les composants React
function findLinks($dir) {
    $allLinks = [];
    $files = findTsFiles($dir);
    
    foreach ($files as $file) {
        $content = file_get_contents($file);
        
        // Recherche des liens avec Link de React Router
        preg_match_all('/<Link\s+[^>]*to=["\']([^"\']*)["\'][^>]*>/', $content, $links);
        if (isset($links[1]) && count($links[1]) > 0) {
            $shortPath = str_replace($dir . '/', '', $file);
            $allLinks[$shortPath] = $links[1];
        }
        
        // Recherche des navigate dans useNavigate
        preg_match_all('/navigate\([\'"]([^\'"]*)[\'"]/', $content, $navigates);
        if (isset($navigates[1]) && count($navigates[1]) > 0) {
            $shortPath = str_replace($dir . '/', '', $file);
            if (!isset($allLinks[$shortPath])) {
                $allLinks[$shortPath] = [];
            }
            $allLinks[$shortPath] = array_merge($allLinks[$shortPath], $navigates[1]);
        }
    }
    
    return $allLinks;
}

$links = findLinks(__DIR__ . '/src');

if (count($links) > 0) {
    echo "<h3>Liens trouvés dans les composants:</h3>";
    
    foreach ($links as $file => $fileLinks) {
        if (count($fileLinks) > 0) {
            echo "<h4>$file</h4>";
            echo "<ul>";
            foreach ($fileLinks as $link) {
                $class = '';
                $status = '';
                
                // Vérifier si le lien correspond à une route définie
                if (in_array($link, $allRoutes)) {
                    $class = 'valid-link';
                    $status = ' ✓';
                } else if ($link[0] === '/' && !in_array($link, $allRoutes)) {
                    $class = 'invalid-link';
                    $status = ' ✗';
                }
                
                echo "<li class='$class'>$link$status</li>";
            }
            echo "</ul>";
        }
    }
    
    // Afficher les liens qui ne correspondent pas à des routes définies
    $allLinksFlat = [];
    foreach ($links as $fileLinks) {
        foreach ($fileLinks as $link) {
            if ($link[0] === '/') { // Ne considérer que les liens absolus
                $allLinksFlat[] = $link;
            }
        }
    }
    
    $missingRoutes = array_diff($allLinksFlat, $allRoutes);
    $unusedRoutes = array_diff($allRoutes, $allLinksFlat);
    
    if (count($missingRoutes) > 0) {
        echo "<h3>Liens sans route correspondante:</h3>";
        echo "<ul class='missing'>";
        foreach (array_unique($missingRoutes) as $route) {
            echo "<li>$route</li>";
        }
        echo "</ul>";
    }
    
    if (count($unusedRoutes) > 0) {
        echo "<h3>Routes sans lien correspondant:</h3>";
        echo "<ul class='unused'>";
        foreach (array_unique($unusedRoutes) as $route) {
            echo "<li>$route</li>";
        }
        echo "</ul>";
    }
} else {
    echo "<p>Aucun lien trouvé dans les composants.</p>";
}
?>

<style>
    body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }
    h1, h2, h3, h4 {
        color: #333;
    }
    h1 {
        border-bottom: 2px solid #eee;
        padding-bottom: 10px;
    }
    h2 {
        margin-top: 30px;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
    }
    ul {
        margin-bottom: 20px;
    }
    li {
        margin-bottom: 5px;
    }
    .duplicates {
        color: #d9534f;
        font-weight: bold;
    }
    .valid-link {
        color: #5cb85c;
    }
    .invalid-link {
        color: #d9534f;
    }
    .missing, .unused {
        color: #f0ad4e;
    }
    .file-path {
        font-family: monospace;
        color: #666;
        font-size: 0.9em;
    }
</style>
