
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des Chemins Infomaniak</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: #16a34a; font-weight: bold; }
        .error { color: #dc2626; font-weight: bold; }
        .monospace { font-family: monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
        th { background: #f9fafb; }
    </style>
</head>
<body>
    <h1>Diagnostic des Chemins Infomaniak</h1>
    
    <div style="margin-bottom: 20px;">
        <h2>Informations Serveur</h2>
        <table>
            <tr><th>Variable</th><th>Valeur</th></tr>
            <tr><td>PHP Version</td><td><?php echo phpversion(); ?></td></tr>
            <tr><td>Document Root</td><td><?php echo $_SERVER['DOCUMENT_ROOT']; ?></td></tr>
            <tr><td>Script Filename</td><td><?php echo $_SERVER['SCRIPT_FILENAME']; ?></td></tr>
            <tr><td>Server Name</td><td><?php echo $_SERVER['SERVER_NAME']; ?></td></tr>
        </table>
    </div>
    
    <div style="margin-bottom: 20px;">
        <h2>Structure des Dossiers</h2>
        <?php
        // Répertoires à vérifier
        $directories = [
            '/sites' => 'Répertoire sites principal',
            '/sites/qualiopi.ch' => 'Répertoire du domaine',
            '/sites/qualiopi.ch/api' => 'Répertoire API',
            '/sites/qualiopi.ch/assets' => 'Répertoire assets',
            '/sites/qualiopi.ch/api-tools' => 'Répertoire api-tools (problématique)'
        ];
        
        echo '<table>';
        echo '<tr><th>Chemin</th><th>Description</th><th>Statut</th><th>Permissions</th></tr>';
        
        foreach ($directories as $path => $desc) {
            $fullPath = $_SERVER['DOCUMENT_ROOT'] . $path;
            $exists = is_dir($fullPath);
            
            echo '<tr>';
            echo '<td class="monospace">' . htmlspecialchars($path) . '</td>';
            echo '<td>' . htmlspecialchars($desc) . '</td>';
            
            if ($exists) {
                echo '<td class="success">Existe</td>';
                $perms = substr(sprintf('%o', fileperms($fullPath)), -4);
                echo '<td class="monospace">' . $perms . '</td>';
            } else {
                echo '<td class="error">N\'existe pas</td>';
                echo '<td>-</td>';
            }
            
            echo '</tr>';
        }
        
        echo '</table>';
        ?>
        
        <h3>Actions Disponibles</h3>
        <form method="post">
            <input type="hidden" name="create_dir" value="1">
            <button type="submit" style="background: #2563eb; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
                Créer le dossier api-tools manquant
            </button>
        </form>
        
        <?php
        // Logique pour créer le dossier manquant
        if (isset($_POST['create_dir'])) {
            $apiToolsDir = $_SERVER['DOCUMENT_ROOT'] . '/sites/qualiopi.ch/api-tools';
            
            if (!is_dir($apiToolsDir)) {
                if (mkdir($apiToolsDir, 0755, true)) {
                    echo '<p class="success">Le dossier api-tools a été créé avec succès!</p>';
                } else {
                    echo '<p class="error">Impossible de créer le dossier api-tools. Erreur: ' . error_get_last()['message'] . '</p>';
                }
            } else {
                echo '<p class="success">Le dossier api-tools existe déjà.</p>';
            }
        }
        ?>
    </div>
    
    <div style="margin-bottom: 20px;">
        <h2>Test de Création de Dossier Alternatif</h2>
        <p>Si la méthode précédente ne fonctionne pas, essayez de créer le dossier avec une approche alternative:</p>
        
        <form method="post">
            <input type="hidden" name="create_dir_alt" value="1">
            <button type="submit" style="background: #059669; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
                Méthode alternative de création
            </button>
        </form>
        
        <?php
        // Approche alternative pour créer le dossier
        if (isset($_POST['create_dir_alt'])) {
            $paths = [
                '/api-tools',
                '/sites/qualiopi.ch/api-tools',
                $_SERVER['DOCUMENT_ROOT'] . '/api-tools',
                $_SERVER['DOCUMENT_ROOT'] . '/sites/qualiopi.ch/api-tools',
                dirname($_SERVER['DOCUMENT_ROOT']) . '/api-tools',
                dirname($_SERVER['DOCUMENT_ROOT']) . '/sites/qualiopi.ch/api-tools'
            ];
            
            echo '<h3>Tentatives de création:</h3>';
            echo '<ul>';
            
            foreach ($paths as $path) {
                echo '<li>Tentative avec ' . htmlspecialchars($path) . ': ';
                if (is_dir($path)) {
                    echo '<span class="success">Existe déjà</span>';
                } else {
                    $result = @mkdir($path, 0755, true);
                    if ($result) {
                        echo '<span class="success">Créé avec succès</span>';
                    } else {
                        echo '<span class="error">Échec</span>';
                    }
                }
                echo '</li>';
            }
            
            echo '</ul>';
        }
        ?>
    </div>
</body>
</html>
