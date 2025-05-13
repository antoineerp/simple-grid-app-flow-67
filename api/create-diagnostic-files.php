
<?php
// Script pour créer automatiquement les fichiers de diagnostic
header("Content-Type: text/html; charset=UTF-8");

// Activer l'affichage des erreurs pour le diagnostic
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Contenu du fichier php-diagnostic.html
$php_diagnostic_content = <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnostic Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
        button { padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #45a049; }
    </style>
</head>
<body>
    <h1>Diagnostic du serveur Infomaniak</h1>
    
    <div class="section">
        <h2>1. Test simple PHP (via AJAX)</h2>
        <p>Ce test essaie de charger un fichier PHP simple et vérifie s'il est exécuté ou affiché comme texte.</p>
        <button onclick="testPhpExecution()">Exécuter le test</button>
        <div id="phpResult">Résultat: en attente...</div>
    </div>
    
    <div class="section">
        <h2>2. Instructions .htaccess</h2>
        <p>Créez un fichier .htaccess à la racine de votre site avec le contenu suivant:</p>
        <pre>
AddHandler application/x-httpd-php .php
AddHandler fcgid-script .php
AddHandler php8-fcgi .php

&lt;FilesMatch "\.php$"&gt;
    SetHandler application/x-httpd-php
&lt;/FilesMatch&gt;

Options +ExecCGI
        </pre>
        <button onclick="downloadHtaccess()">Télécharger ce .htaccess</button>
    </div>
    
    <div class="section">
        <h2>3. Informations Infomaniak</h2>
        <p>Si rien ne fonctionne, contactez le support Infomaniak avec les informations suivantes:</p>
        <ul>
            <li>Le module PHP ne s'exécute pas sur votre hébergement</li>
            <li>Les fichiers PHP sont affichés comme du texte au lieu d'être exécutés</li>
            <li>Vous avez déjà essayé d'ajouter un fichier .htaccess avec les configurations appropriées</li>
            <li>Demandez-leur de vérifier si PHP est correctement activé sur votre hébergement</li>
        </ul>
    </div>
    
    <script>
        // Test si PHP s'exécute
        function testPhpExecution() {
            const resultDiv = document.getElementById('phpResult');
            resultDiv.innerHTML = "Test en cours...";
            
            // Créer un fichier PHP de test unique pour éviter la mise en cache
            const testFile = "test-" + Math.random().toString(36).substring(2, 15) + ".php";
            
            // Première requête pour créer le fichier via fetch
            fetch('create-test-php.html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'filename=' + testFile
            })
            .then(response => {
                // Maintenant essayer de charger le fichier PHP
                setTimeout(() => {
                    fetch(testFile + '?nocache=' + new Date().getTime())
                    .then(response => response.text())
                    .then(data => {
                        // Analyser la réponse
                        if (data.includes('<?php')) {
                            resultDiv.innerHTML = "<p class='error'>ERREUR: PHP n'est PAS exécuté. Le code PHP est affiché comme du texte.</p>";
                        } else if (data.includes('PHP fonctionne')) {
                            resultDiv.innerHTML = "<p class='success'>SUCCÈS: PHP s'exécute correctement!</p>";
                        } else {
                            resultDiv.innerHTML = "<p class='error'>Résultat indéterminé. Voici la réponse:</p><pre>" + escapeHtml(data) + "</pre>";
                        }
                    })
                    .catch(error => {
                        resultDiv.innerHTML = "<p class='error'>Erreur lors du test: " + error.message + "</p>";
                    });
                }, 500);
            })
            .catch(error => {
                resultDiv.innerHTML = "<p class='error'>Erreur lors de la création du fichier de test: " + error.message + "</p>";
            });
        }

        // Fonction pour échapper le HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Télécharger le fichier .htaccess
        function downloadHtaccess() {
            const htaccessContent = `AddHandler application/x-httpd-php .php
AddHandler fcgid-script .php
AddHandler php8-fcgi .php

<FilesMatch "\\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

Options +ExecCGI`;
            
            const blob = new Blob([htaccessContent], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = '.htaccess';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    </script>
</body>
</html>
HTML;

// Contenu du fichier create-test-php.html
$create_test_php_content = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <title>Création de fichier PHP de test</title>
</head>
<body>
    <h1>Création d'un fichier PHP de test</h1>
    
    <script>
        // Cette page crée un fichier PHP de test via JavaScript
        window.onload = function() {
            const url = new URLSearchParams(window.location.search);
            const filename = url.get('filename') || 'test-php-file.php';
            
            // Créer un élément pour afficher l'état
            const status = document.createElement('div');
            document.body.appendChild(status);
            status.innerHTML = "Tentative de création du fichier " + filename + "...";
            
            // Créer le fichier de test à l'aide d'un iframe
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            // Contenu du fichier PHP en HTML
            const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Test PHP</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .code { background: #f5f5f5; padding: 10px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <h1>Test d'exécution PHP</h1>
                
                <div class="code">
                <?php
                // Ce code devrait s'exécuter si PHP fonctionne
                echo "PHP fonctionne! Heure serveur: " . date('Y-m-d H:i:s');
                ?>
                </div>
                
                <p>Si vous voyez du code PHP brut ci-dessus (commençant par &lt;?php), alors PHP n'est pas exécuté sur votre serveur.</p>
            </body>
            </html>
            `;
            
            // Essayer de créer le fichier en le téléchargeant
            try {
                const blob = new Blob([content], { type: 'text/html' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                
                status.innerHTML = "Fichier " + filename + " créé et téléchargé. <br>Veuillez le téléverser manuellement sur votre serveur, puis revenir à la page précédente pour continuer le test.";
            } catch (e) {
                status.innerHTML = "Erreur lors de la création du fichier: " + e.message;
            }
        }
    </script>
</body>
</html>
HTML;

// Contenu du fichier de diagnostic simple directement en PHP
$php_simple_diagnostic = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic PHP Rapide</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Diagnostic PHP Rapide</h1>
    
    <div>
        <h2>Test PHP</h2>
        <div class="success">PHP fonctionne! Ce message est généré par PHP.</div>
        <p>Version PHP: <strong><?php echo phpversion(); ?></strong></p>
        <p>Serveur: <strong><?php echo $_SERVER['SERVER_SOFTWARE']; ?></strong></p>
        <p>Date et heure: <strong><?php echo date('Y-m-d H:i:s'); ?></strong></p>
    </div>
    
    <div>
        <h2>Informations serveur</h2>
        <p>Document Root: <strong><?php echo $_SERVER['DOCUMENT_ROOT']; ?></strong></p>
        <p>Chemin script: <strong><?php echo $_SERVER['SCRIPT_FILENAME']; ?></strong></p>
        <p>URL: <strong><?php echo $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']; ?></strong></p>
    </div>
    
    <div>
        <h2>Test .htaccess</h2>
        <?php
        // Tenter de créer un fichier .htaccess dans le dossier actuel
        $htaccess_content = "
# Forcer PHP à s'exécuter
AddHandler application/x-httpd-php .php
AddHandler fcgid-script .php
AddHandler php8-fcgi .php

<FilesMatch \"\\.php$\">
    SetHandler application/x-httpd-php
</FilesMatch>

Options +ExecCGI
";

        $success = file_put_contents('.htaccess-test', $htaccess_content);
        
        if ($success !== false) {
            echo "<p class='success'>Fichier .htaccess-test créé avec succès. Renommez-le en .htaccess</p>";
        } else {
            echo "<p class='error'>Impossible de créer le fichier .htaccess-test</p>";
        }
        ?>
    </div>
    
    <div>
        <h2>Prochaines étapes</h2>
        <ol>
            <li>Si vous voyez ce message, PHP fonctionne correctement sur ce fichier.</li>
            <li>Essayez de renommer le fichier .htaccess-test en .htaccess à la racine de votre site pour activer PHP sur tous les fichiers.</li>
            <li>Si vous rencontrez toujours des problèmes, contactez le support Infomaniak.</li>
        </ol>
    </div>
</body>
</html>
HTML;

// Fonctions pour créer les fichiers
function createFile($path, $content) {
    $result = file_put_contents($path, $content);
    return [
        'path' => $path,
        'success' => ($result !== false),
        'size' => $result
    ];
}

// Créer les fichiers
$results = [];
$results[] = createFile('../php-diagnostic.html', $php_diagnostic_content);
$results[] = createFile('../create-test-php.html', $create_test_php_content);
$results[] = createFile('simple-diagnostic.php', $php_simple_diagnostic);

// Page de résultat
?>
<!DOCTYPE html>
<html>
<head>
    <title>Création des fichiers de diagnostic</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .file-list { margin: 20px 0; }
        .file-item { margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Création des fichiers de diagnostic</h1>
    
    <div>
        <h2>Résultats</h2>
        <div class="file-list">
            <?php foreach ($results as $result): ?>
            <div class="file-item">
                <strong>Fichier:</strong> <?php echo htmlspecialchars($result['path']); ?>
                <br>
                <strong>Statut:</strong> 
                <?php if ($result['success']): ?>
                    <span class="success">Créé avec succès (<?php echo $result['size']; ?> octets)</span>
                <?php else: ?>
                    <span class="error">Échec de création</span>
                <?php endif; ?>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
    
    <div>
        <h2>Fichiers créés</h2>
        <ul>
            <li><a href="../php-diagnostic.html">php-diagnostic.html</a> - Page principale de diagnostic</li>
            <li><a href="../create-test-php.html">create-test-php.html</a> - Utilitaire pour créer des fichiers de test PHP</li>
            <li><a href="simple-diagnostic.php">simple-diagnostic.php</a> - Diagnostic PHP rapide (si PHP fonctionne)</li>
        </ul>
    </div>
    
    <div>
        <h2>Instructions</h2>
        <p>Si PHP fonctionne correctement, vous devriez voir les fichiers listés ci-dessus. Cliquez sur chaque lien pour accéder aux fichiers.</p>
        <p>Si vous voyez cette page, cela signifie que PHP fonctionne au moins sur ce fichier particulier.</p>
        <p>Utilisez ces outils pour diagnostiquer les problèmes de configuration PHP sur votre serveur Infomaniak.</p>
    </div>
</body>
</html>
