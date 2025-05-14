
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification de la Content Security Policy (CSP)</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .section { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Vérification et correction de la Content Security Policy</h1>
    
    <div class="section">
        <h2>Analyse de la CSP actuelle</h2>
        <?php
        // Vérifier si le fichier .htaccess est présent et contient une CSP
        $htaccess = file_exists('.htaccess') ? file_get_contents('.htaccess') : '';
        $hasCSP = preg_match('/Content-Security-Policy["\s:]+([^"]+)/i', $htaccess, $matches);
        
        if ($hasCSP) {
            echo "<p>CSP trouvée dans .htaccess: <span class='success'>OUI</span></p>";
            echo "<pre>" . htmlspecialchars($matches[0]) . "</pre>";
            
            // Vérifier si cdn.gpteng.co est inclus
            $hasGptEng = strpos($matches[0], 'cdn.gpteng.co') !== false;
            if ($hasGptEng) {
                echo "<p>cdn.gpteng.co inclus dans script-src: <span class='success'>OUI</span></p>";
            } else {
                echo "<p>cdn.gpteng.co inclus dans script-src: <span class='error'>NON</span></p>";
            }
        } else {
            echo "<p>CSP trouvée dans .htaccess: <span class='error'>NON</span></p>";
        }
        ?>
    </div>
    
    <?php
    if (isset($_POST['fix_csp'])) {
        // Correction de la CSP
        $new_htaccess = $htaccess;
        $csp = "Header set Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self'; frame-ancestors 'self'; form-action 'self';\"";
        
        if ($hasCSP) {
            // Remplacer la CSP existante
            $new_htaccess = preg_replace('/Header set Content-Security-Policy[^"]*"[^"]+"/i', $csp, $htaccess);
        } else {
            // Ajouter la CSP
            $position = strpos($htaccess, "# En-têtes de sécurité");
            if ($position !== false) {
                $new_htaccess = substr_replace($htaccess, "# En-têtes de sécurité\n$csp\n", $position, strlen("# En-têtes de sécurité"));
            } else {
                $new_htaccess = $htaccess . "\n# En-têtes de sécurité\n" . $csp . "\n";
            }
        }
        
        if (file_put_contents('.htaccess', $new_htaccess) !== false) {
            echo "<div class='section'>";
            echo "<h2>Résultat</h2>";
            echo "<p><span class='success'>Content Security Policy mise à jour avec succès!</span></p>";
            echo "<p>La nouvelle politique autorise l'accès à cdn.gpteng.co pour les scripts.</p>";
            echo "</div>";
        } else {
            echo "<div class='section'>";
            echo "<h2>Résultat</h2>";
            echo "<p><span class='error'>Erreur lors de la mise à jour du fichier .htaccess.</span></p>";
            echo "<p>Assurez-vous que le serveur web a les permissions d'écriture sur ce fichier.</p>";
            echo "</div>";
        }
    }
    ?>
    
    <div class="section">
        <h2>Corriger la Content Security Policy</h2>
        <form method="post">
            <p>Cliquez sur le bouton ci-dessous pour mettre à jour la CSP dans le fichier .htaccess afin d'autoriser cdn.gpteng.co :</p>
            <p>Une CSP correcte devrait inclure :</p>
            <pre>script-src 'self' 'unsafe-inline' https://cdn.gpteng.co;</pre>
            <button type="submit" name="fix_csp" style="padding: 10px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Mettre à jour la Content Security Policy</button>
        </form>
    </div>
    
    <div class="section">
        <h2>Tester la page</h2>
        <p>Après avoir mis à jour la CSP, vous pouvez vérifier si elle fonctionne correctement avec les outils suivants :</p>
        <ul>
            <li><a href="https://csp-evaluator.withgoogle.com/" target="_blank">Google CSP Evaluator</a></li>
            <li><a href="https://securityheaders.com/" target="_blank">Security Headers</a></li>
        </ul>
    </div>
    
    <p>
        <a href="/" style="display: inline-block; background: #607D8B; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Retour à la page d'accueil</a>
    </p>
</body>
</html>
