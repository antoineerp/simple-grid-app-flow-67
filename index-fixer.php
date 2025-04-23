
<?php
// Script simple pour vérifier/corriger les références d'assets dans index.html
header('Content-Type: text/html; charset=utf-8');

// Chercher les assets compilés réels
$js_files = glob('./assets/*.js');
$css_files = glob('./assets/*.css');

// Trouver les fichiers principaux
$main_js = '';
foreach ($js_files as $file) {
    if (strpos(basename($file), 'main-') === 0) {
        $main_js = '/assets/' . basename($file);
        break;
    }
}

// Si aucun main-*.js trouvé, prendre le premier
if (empty($main_js) && !empty($js_files)) {
    $main_js = '/assets/' . basename($js_files[0]);
}

$main_css = '';
foreach ($css_files as $file) {
    if (strpos(basename($file), 'main-') === 0 || strpos(basename($file), 'index-') === 0) {
        $main_css = '/assets/' . basename($file);
        break;
    }
}

// Si aucun css spécifique trouvé, prendre le premier
if (empty($main_css) && !empty($css_files)) {
    $main_css = '/assets/' . basename($css_files[0]);
}

echo "<h1>Analyse d'assets</h1>";
echo "<p>Fichiers JS trouvés: " . implode(", ", array_map('basename', $js_files)) . "</p>";
echo "<p>Fichiers CSS trouvés: " . implode(", ", array_map('basename', $css_files)) . "</p>";
echo "<p>JS principal détecté: " . $main_js . "</p>";
echo "<p>CSS principal détecté: " . $main_css . "</p>";

// Lire index.html
$index_content = file_get_contents('./index.html');

echo "<h2>Contenu actuel de index.html:</h2>";
echo "<pre>" . htmlspecialchars(substr($index_content, 0, 500)) . "...</pre>";

// Vérifier si index.html a besoin d'être mis à jour
$needs_update = false;
if (strpos($index_content, './src/') !== false) {
    $needs_update = true;
    echo "<p style='color:red'>Références à './src/' trouvées - index.html doit être mis à jour!</p>";
}

if ($needs_update && !empty($main_js) && !empty($main_css)) {
    echo "<h2>Appliquer les corrections?</h2>";
    echo "<form method='post'>";
    echo "<input type='submit' name='fix' value='Corriger index.html' style='padding:10px; background:#4CAF50; color:white; border:none; cursor:pointer;'>";
    echo "</form>";

    if (isset($_POST['fix'])) {
        // Faire une sauvegarde
        copy('./index.html', './index.html.bak');
        
        // Remplacer les références
        $new_index = preg_replace(
            '/<link[^>]*href=["\']\.\/?src\/index\.css["\'][^>]*>/',
            '<link rel="stylesheet" href="' . $main_css . '">',
            $index_content
        );
        
        $new_index = preg_replace(
            '/<script[^>]*src=["\']\.\/?src\/main\.tsx["\'][^>]*>/',
            '<script type="module" src="' . $main_js . '"></script>',
            $new_index
        );
        
        file_put_contents('./index.html', $new_index);
        
        echo "<p style='color:green'>index.html a été mis à jour!</p>";
        echo "<p>Référence CSS: " . $main_css . "</p>";
        echo "<p>Référence JS: " . $main_js . "</p>";
        echo "<p><a href='/' style='padding:10px; background:#2196F3; color:white; text-decoration:none;'>Tester l'application</a></p>";
    }
} else if (!$needs_update) {
    echo "<p style='color:green'>index.html semble déjà utiliser les bons chemins.</p>";
}
?>
