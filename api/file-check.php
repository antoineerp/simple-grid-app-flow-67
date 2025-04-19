
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des Fichiers FormaCert</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2 { color: #334155; }
        .section { margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc; }
        .success { color: #15803d; font-weight: 600; }
        .error { color: #b91c1c; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        table, th, td { border: 1px solid #e2e8f0; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f1f5f9; }
    </style>
</head>
<body>
    <h1>Vérification des Fichiers FormaCert</h1>
    <p>Cet outil liste les fichiers présents sur le serveur et vérifie la structure du projet.</p>
    
    <div class="section">
        <h2>Environnement Serveur</h2>
        <table>
            <tr><th>Information</th><th>Valeur</th></tr>
            <tr><td>Serveur Web</td><td><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'; ?></td></tr>
            <tr><td>PHP Version</td><td><?php echo phpversion(); ?></td></tr>
            <tr><td>Document Root</td><td><?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible'; ?></td></tr>
            <tr><td>Script Filename</td><td><?php echo $_SERVER['SCRIPT_FILENAME']; ?></td></tr>
        </table>
    </div>

    <div class="section">
        <h2>Structure du Projet</h2>
        <?php
        // Répertoires à vérifier
        $directories = ['/', '/src', '/dist', '/dist/assets', '/api', '/public', '/public/lovable-uploads'];
        
        echo '<table>';
        echo '<tr><th>Répertoire</th><th>Existe</th><th>Nombre de fichiers</th></tr>';
        
        foreach ($directories as $dir) {
            $fullPath = $_SERVER['DOCUMENT_ROOT'] . $dir;
            $exists = file_exists($fullPath) && is_dir($fullPath);
            $fileCount = $exists ? count(scandir($fullPath)) - 2 : 0; // Moins . et ..
            
            echo '<tr>';
            echo '<td>' . htmlspecialchars($dir) . '</td>';
            echo '<td class="' . ($exists ? 'success' : 'error') . '">' . ($exists ? 'Oui' : 'Non') . '</td>';
            echo '<td>' . $fileCount . '</td>';
            echo '</tr>';
        }
        
        echo '</table>';
        ?>
    </div>
    
    <div class="section">
        <h2>Fichiers Clés</h2>
        <?php
        // Fichiers à vérifier
        $files = [
            '/.htaccess' => 'Configuration Apache',
            '/index.html' => 'Page principale',
            '/src/main.js' => 'Script JS principal',
            '/src/main.tsx' => 'Script TSX principal',
            '/dist/assets/main.js' => 'Script compilé',
            '/dist/assets/index.js' => 'Index compilé',
            '/dist/assets/index.css' => 'CSS compilé'
        ];
        
        echo '<table>';
        echo '<tr><th>Fichier</th><th>Description</th><th>Existe</th><th>Taille</th><th>Date de modification</th></tr>';
        
        foreach ($files as $file => $description) {
            $fullPath = $_SERVER['DOCUMENT_ROOT'] . $file;
            $exists = file_exists($fullPath);
            $size = $exists ? filesize($fullPath) : 0;
            $modTime = $exists ? date('Y-m-d H:i:s', filemtime($fullPath)) : 'N/A';
            
            echo '<tr>';
            echo '<td>' . htmlspecialchars($file) . '</td>';
            echo '<td>' . htmlspecialchars($description) . '</td>';
            echo '<td class="' . ($exists ? 'success' : 'error') . '">' . ($exists ? 'Oui' : 'Non') . '</td>';
            echo '<td>' . ($exists ? formatSize($size) : 'N/A') . '</td>';
            echo '<td>' . $modTime . '</td>';
            echo '</tr>';
        }
        
        function formatSize($bytes) {
            if ($bytes < 1024) return $bytes . ' B';
            else if ($bytes < 1048576) return round($bytes / 1024, 2) . ' KB';
            else return round($bytes / 1048576, 2) . ' MB';
        }
        
        echo '</table>';
        ?>
    </div>
    
    <div class="section">
        <h2>Liste des Fichiers du Projet</h2>
        <p>Voici la liste des fichiers trouvés dans les répertoires principaux :</p>
        
        <?php
        // Répertoires à analyser
        $dirsToAnalyze = ['/src', '/dist/assets', '/api'];
        
        foreach ($dirsToAnalyze as $dir) {
            $fullPath = $_SERVER['DOCUMENT_ROOT'] . $dir;
            
            echo '<h3>Répertoire : ' . htmlspecialchars($dir) . '</h3>';
            
            if (file_exists($fullPath) && is_dir($fullPath)) {
                $files = scandir($fullPath);
                $files = array_diff($files, array('.', '..'));
                
                if (count($files) > 0) {
                    echo '<table>';
                    echo '<tr><th>Nom du fichier</th><th>Taille</th><th>Date de modification</th></tr>';
                    
                    foreach ($files as $file) {
                        $filePath = $fullPath . '/' . $file;
                        $isDir = is_dir($filePath);
                        $size = $isDir ? '-' : formatSize(filesize($filePath));
                        $modTime = date('Y-m-d H:i:s', filemtime($filePath));
                        
                        echo '<tr>';
                        echo '<td>' . ($isDir ? '[DIR] ' : '') . htmlspecialchars($file) . '</td>';
                        echo '<td>' . $size . '</td>';
                        echo '<td>' . $modTime . '</td>';
                        echo '</tr>';
                    }
                    
                    echo '</table>';
                } else {
                    echo '<p class="error">Aucun fichier trouvé dans ce répertoire.</p>';
                }
            } else {
                echo '<p class="error">Le répertoire n\'existe pas.</p>';
            }
        }
        ?>
    </div>
</body>
</html>
