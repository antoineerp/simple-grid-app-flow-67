
<?php
// Script de diagnostic pour les problèmes d'assets
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Diagnostic des Assets</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #333; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <h1>Diagnostic des Assets</h1>
    
    <h2>Informations sur le serveur</h2>
    <ul>
        <li>Serveur Web: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu'; ?></li>
        <li>PHP Version: <?php echo phpversion(); ?></li>
        <li>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non défini'; ?></li>
        <li>URI Demandée: <?php echo $_SERVER['REQUEST_URI'] ?? 'Non définie'; ?></li>
    </ul>
    
    <h2>Configuration des Assets</h2>
    <?php
    // Vérifier le dossier des assets
    $assetsDir = '../assets';
    $distAssetsDir = '../dist/assets';
    
    echo '<h3>Recherche des fichiers Javascript et CSS</h3>';
    echo '<table>';
    echo '<tr><th>Type</th><th>Chemin</th><th>Existe</th><th>Taille</th><th>Modifié le</th></tr>';
    
    // Fonction pour scanner et afficher les fichiers
    function scanAndDisplayFiles($directory, $pattern) {
        if (!file_exists($directory)) {
            echo "<tr><td colspan='5' class='error'>Le dossier $directory n'existe pas!</td></tr>";
            return;
        }
        
        $files = glob($directory . '/' . $pattern);
        if (empty($files)) {
            echo "<tr><td colspan='5' class='info'>Aucun fichier correspondant à $pattern trouvé dans $directory</td></tr>";
            return;
        }
        
        foreach ($files as $file) {
            $type = pathinfo($file, PATHINFO_EXTENSION);
            $exists = file_exists($file) ? '<span class="success">Oui</span>' : '<span class="error">Non</span>';
            $size = file_exists($file) ? round(filesize($file) / 1024, 2) . ' KB' : 'N/A';
            $modified = file_exists($file) ? date("Y-m-d H:i:s", filemtime($file)) : 'N/A';
            
            echo "<tr>
                <td>$type</td>
                <td>$file</td>
                <td>$exists</td>
                <td>$size</td>
                <td>$modified</td>
            </tr>";
        }
    }
    
    // Vérifier les assets dans différents chemins possibles
    scanAndDisplayFiles($assetsDir, '*.{js,css}');
    scanAndDisplayFiles($distAssetsDir, '*.{js,css}');
    scanAndDisplayFiles('..', 'assets/*.{js,css}');
    
    echo '</table>';
    
    // Vérifier le fichier index.html
    echo '<h3>Contenu du fichier index.html</h3>';
    $indexFile = '../index.html';
    if (file_exists($indexFile)) {
        $indexContent = file_get_contents($indexFile);
        echo '<pre>' . htmlspecialchars($indexContent) . '</pre>';
        
        // Extraire les scripts et les CSS de index.html
        preg_match_all('/<script[^>]*src="([^"]*)"[^>]*>/i', $indexContent, $scripts);
        preg_match_all('/<link[^>]*href="([^"]*)"[^>]*rel="stylesheet"/i', $indexContent, $styles);
        
        echo '<h4>Scripts détectés dans index.html:</h4>';
        if (!empty($scripts[1])) {
            echo '<ul>';
            foreach ($scripts[1] as $script) {
                $scriptFile = '..' . parse_url($script, PHP_URL_PATH);
                $exists = file_exists($scriptFile) ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>';
                echo "<li>$script - $exists</li>";
            }
            echo '</ul>';
        } else {
            echo '<p class="error">Aucun script détecté dans index.html</p>';
        }
        
        echo '<h4>Feuilles de style détectées dans index.html:</h4>';
        if (!empty($styles[1])) {
            echo '<ul>';
            foreach ($styles[1] as $style) {
                $styleFile = '..' . parse_url($style, PHP_URL_PATH);
                $exists = file_exists($styleFile) ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>';
                echo "<li>$style - $exists</li>";
            }
            echo '</ul>';
        } else {
            echo '<p class="error">Aucune feuille de style détectée dans index.html</p>';
        }
    } else {
        echo '<p class="error">Le fichier index.html n\'existe pas!</p>';
    }
    
    // Vérifier la configuration .htaccess
    echo '<h3>Contenu du fichier .htaccess</h3>';
    $htaccessFile = '../.htaccess';
    if (file_exists($htaccessFile)) {
        $htaccessContent = file_get_contents($htaccessFile);
        echo '<pre>' . htmlspecialchars($htaccessContent) . '</pre>';
    } else {
        echo '<p class="error">Le fichier .htaccess n\'existe pas!</p>';
    }
    ?>
    
    <h2>Tests d'accès aux assets</h2>
    <div id="jsTest">Test de JavaScript...</div>
    <div id="cssTest">Test de CSS...</div>
    
    <script>
        document.getElementById('jsTest').textContent = 'JavaScript fonctionne correctement!';
        document.getElementById('jsTest').style.color = 'green';
        
        // Créer un élément de style pour tester le CSS
        const style = document.createElement('style');
        style.textContent = '#cssTest { color: green; }';
        document.head.appendChild(style);
        document.getElementById('cssTest').textContent = 'CSS fonctionne correctement!';
    </script>
</body>
</html>
