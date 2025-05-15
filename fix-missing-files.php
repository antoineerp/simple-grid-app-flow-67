
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des fichiers manquants</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        .button:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <h1>Correction des fichiers manquants</h1>
    
    <div class="section">
        <h2>Diagnostic</h2>
        <?php
        // Vérification des dossiers
        $directories = [
            'assets' => 'Dossier des assets',
            'src' => 'Dossier source',
            'dist' => 'Dossier de build'
        ];
        
        $missing_dirs = [];
        foreach ($directories as $dir => $description) {
            if (!is_dir($dir)) {
                $missing_dirs[$dir] = $description;
                echo "<p>$description (<code>$dir</code>): <span class='error'>MANQUANT</span></p>";
            } else {
                echo "<p>$description (<code>$dir</code>): <span class='success'>EXISTE</span></p>";
            }
        }
        
        // Vérification des fichiers CSS
        if (is_dir('assets')) {
            $css_files = glob('assets/*.css');
            if (empty($css_files)) {
                echo "<p>Fichiers CSS dans assets: <span class='error'>MANQUANTS</span></p>";
            } else {
                echo "<p>Fichiers CSS dans assets: <span class='success'>TROUVÉS</span> (" . count($css_files) . " fichiers)</p>";
                foreach ($css_files as $file) {
                    echo "<li>" . basename($file) . " (" . filesize($file) . " octets)</li>";
                }
            }
        }
        
        // Vérification de index.html
        if (file_exists('index.html')) {
            $index_content = file_get_contents('index.html');
            $has_css_ref = strpos($index_content, '.css') !== false;
            
            echo "<p>Fichier index.html: <span class='success'>EXISTE</span></p>";
            echo "<p>Référence à un fichier CSS: " . ($has_css_ref ? "<span class='success'>OUI</span>" : "<span class='error'>NON</span>") . "</p>";
        } else {
            echo "<p>Fichier index.html: <span class='error'>MANQUANT</span></p>";
        }
        ?>
    </div>
    
    <?php
    if (isset($_POST['create_dirs'])) {
        echo "<div class='section'>";
        echo "<h2>Création des dossiers manquants</h2>";
        
        // Créer les dossiers manquants
        foreach ($missing_dirs as $dir => $description) {
            if (mkdir($dir, 0755, true)) {
                echo "<p>Création du dossier $dir: <span class='success'>SUCCÈS</span></p>";
            } else {
                echo "<p>Création du dossier $dir: <span class='error'>ÉCHEC</span></p>";
            }
        }
        
        echo "</div>";
    }
    
    if (isset($_POST['create_css'])) {
        echo "<div class='section'>";
        echo "<h2>Création du fichier CSS minimal</h2>";
        
        // Créer le dossier assets s'il n'existe pas
        if (!is_dir('assets')) {
            if (mkdir('assets', 0755, true)) {
                echo "<p>Création du dossier assets: <span class='success'>SUCCÈS</span></p>";
            } else {
                echo "<p>Création du dossier assets: <span class='error'>ÉCHEC</span></p>";
            }
        }
        
        // Créer un fichier CSS minimal
        $css_content = <<<CSS
/* Fichier CSS principal généré par fix-missing-files.php */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 210 100% 35%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}
CSS;

        if (file_put_contents('assets/index.css', $css_content)) {
            echo "<p>Création du fichier assets/index.css: <span class='success'>SUCCÈS</span></p>";
        } else {
            echo "<p>Création du fichier assets/index.css: <span class='error'>ÉCHEC</span></p>";
        }
        
        echo "</div>";
    }
    
    if (isset($_POST['update_index'])) {
        echo "<div class='section'>";
        echo "<h2>Mise à jour de index.html</h2>";
        
        if (file_exists('index.html')) {
            // Sauvegarder l'original
            copy('index.html', 'index.html.bak');
            
            $index_content = file_get_contents('index.html');
            $updated = false;
            
            // Ajouter une référence CSS si elle n'existe pas
            if (strpos($index_content, '.css') === false) {
                $index_content = str_replace('</head>', '  <link rel="stylesheet" href="/assets/index.css" />' . "\n  </head>", $index_content);
                $updated = true;
            }
            
            if ($updated) {
                if (file_put_contents('index.html', $index_content)) {
                    echo "<p>Mise à jour de index.html: <span class='success'>SUCCÈS</span></p>";
                    echo "<p>Une sauvegarde a été créée dans index.html.bak</p>";
                } else {
                    echo "<p>Mise à jour de index.html: <span class='error'>ÉCHEC</span></p>";
                }
            } else {
                echo "<p>Aucune modification nécessaire pour index.html</p>";
            }
        } else {
            echo "<p>Le fichier index.html n'existe pas</p>";
        }
        
        echo "</div>";
    }
    ?>
    
    <div class="section">
        <h2>Actions de correction</h2>
        <form method="post">
            <p><button type="submit" name="create_dirs" class="button">Créer les dossiers manquants</button></p>
            <p><button type="submit" name="create_css" class="button">Créer le fichier CSS minimal</button></p>
            <p><button type="submit" name="update_index" class="button">Mettre à jour index.html</button></p>
        </form>
    </div>
    
    <div class="section">
        <h2>Comment procéder pour un déploiement complet</h2>
        <ol>
            <li>Exécutez ce script et cliquez sur tous les boutons pour corriger les fichiers manquants</li>
            <li>Assurez-vous que le dossier <code>src</code> contient les fichiers sources de votre application</li>
            <li>Exécutez <code>npm run build</code> pour générer les fichiers compilés dans <code>dist</code></li>
            <li>Utilisez <code>copy-assets.php</code> pour copier les assets de <code>dist/assets</code> vers <code>assets</code></li>
            <li>Vérifiez que <code>index.html</code> contient les bonnes références aux fichiers CSS et JavaScript</li>
            <li>Déployez votre application en utilisant le workflow GitHub ou en transférant les fichiers manuellement</li>
        </ol>
    </div>
    
    <div class="section">
        <h2>Pour un déploiement d'urgence</h2>
        <p>Utilisez les scripts suivants pour un déploiement d'urgence:</p>
        <ul>
            <li><a href="emergency-php-fix.php">emergency-php-fix.php</a> - Crée les fichiers PHP essentiels</li>
            <li><a href="fix-infomaniak-assets.php">fix-infomaniak-assets.php</a> - Corrige spécifiquement les problèmes d'assets sur Infomaniak</li>
        </ul>
    </div>
</body>
</html>

