
<?php
// Script pour vérifier et tenter de corriger les problèmes d'exécution PHP
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic et correction de l'exécution PHP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; max-width: 900px; margin: 0 auto; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .fix-button { background: #4CAF50; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
        .info-block { background: #e6f7ff; padding: 10px; border-left: 4px solid #1890ff; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Diagnostic et correction de l'exécution PHP</h1>
    
    <div class="section">
        <h2>Test d'exécution PHP</h2>
        <?php if(function_exists('phpversion')): ?>
            <p><span class="success">✅ PHP est exécuté correctement dans ce fichier!</span></p>
            <p>Version PHP: <?php echo phpversion(); ?></p>
            <p>API SAPI: <?php echo php_sapi_name(); ?></p>
            <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'; ?></p>
        <?php else: ?>
            <p><span class="error">❌ PHP ne semble pas s'exécuter correctement. Ce message ne devrait pas apparaître.</span></p>
        <?php endif; ?>
    </div>

    <div class="section">
        <h2>Configuration serveur pour Infomaniak</h2>
        
        <div class="info-block">
            <p><strong>Note importante:</strong> Sur Infomaniak, vous devez configurer PHP pour chaque dossier via le Manager.</p>
        </div>

        <h3>1. Actions dans l'interface Manager Infomaniak</h3>
        <ol>
            <li>Connectez-vous au <a href="https://manager.infomaniak.com" target="_blank">Manager Infomaniak</a></li>
            <li>Accédez à votre hébergement web</li>
            <li>Allez dans "Configuration > PHP"</li>
            <li>Vérifiez que PHP est activé pour le site et le dossier <code>/api</code></li>
            <li>Sélectionnez une version PHP récente (7.4+ recommandé)</li>
            <li>Enregistrez les modifications</li>
        </ol>

        <h3>2. Vérification des fichiers de configuration</h3>
        <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
            <tr><th>Fichier</th><th>Statut</th><th>Détails</th></tr>
            <tr>
                <td>/api/.htaccess</td>
                <td><?php echo file_exists('../api/.htaccess') ? '<span class="success">Présent</span>' : '<span class="error">Manquant</span>'; ?></td>
                <td>Configure Apache pour traiter les fichiers PHP</td>
            </tr>
            <tr>
                <td>/api/.user.ini</td>
                <td><?php echo file_exists('../api/.user.ini') ? '<span class="success">Présent</span>' : '<span class="error">Manquant</span>'; ?></td>
                <td>Configure PHP lorsque PHP-FPM est utilisé</td>
            </tr>
            <tr>
                <td>/.htaccess (racine)</td>
                <td><?php echo file_exists('../.htaccess') ? '<span class="success">Présent</span>' : '<span class="error">Manquant</span>'; ?></td>
                <td>Configuration Apache générale</td>
            </tr>
        </table>

        <?php
        // Vérifier si les directives essentielles sont dans .htaccess
        $htaccess_content = file_exists('../api/.htaccess') ? file_get_contents('../api/.htaccess') : '';
        $has_php_handler = strpos($htaccess_content, 'SetHandler application/x-httpd-php') !== false;
        $has_php_engine = strpos($htaccess_content, 'php_flag engine on') !== false;
        ?>
        
        <h3>3. Vérification du contenu .htaccess</h3>
        <ul>
            <li>Directive SetHandler: <?php echo $has_php_handler ? '<span class="success">Présente</span>' : '<span class="error">Manquante</span>'; ?></li>
            <li>Directive php_flag engine: <?php echo $has_php_engine ? '<span class="success">Présente</span>' : '<span class="error">Manquante</span>'; ?></li>
        </ul>
    </div>

    <div class="section">
        <h2>Actions recommandées</h2>
        
        <h3>1. Vérifier la configuration PHP dans le Manager Infomaniak</h3>
        <p>Assurez-vous que PHP est activé pour le dossier <code>/api</code> dans votre configuration d'hébergement.</p>
        
        <div class="info-block">
            <p><strong>Instructions spécifiques pour Infomaniak:</strong></p>
            <ol>
                <li>Dans le Manager, allez dans "Hébergement Web > [votre site] > Configuration > PHP"</li>
                <li>Activez PHP pour le dossier racine et les sous-répertoires</li>
                <li>Vérifiez la section "Restrictions par répertoire" et assurez-vous que le dossier API n'est pas restreint</li>
            </ol>
        </div>
        
        <h3>2. Utilisez cette liste de contrôle:</h3>
        <ul>
            <li>✅ PHP est-il activé sur votre hébergement?</li>
            <li>✅ Avez-vous sélectionné une version PHP récente (7.4+)?</li>
            <li>✅ Les fichiers .htaccess et .user.ini sont-ils présents et correctement configurés?</li>
            <li>✅ Avez-vous attendu quelques minutes après les modifications pour qu'elles soient prises en compte?</li>
        </ul>
        
        <h3>3. Test des fichiers PHP</h3>
        <p>Testez ces URL pour vérifier l'exécution PHP:</p>
        <ul>
            <li><a href="/api/info.php" target="_blank">/api/info.php</a> - Doit afficher des informations JSON</li>
            <li><a href="/api/test.php" target="_blank">/api/test.php</a> - Test simple</li>
            <li><a href="/api/index.php" target="_blank">/api/index.php</a> - Point d'entrée principal</li>
        </ul>
    </div>

    <div class="section">
        <h2>Exemples de configuration</h2>
        
        <h3>Exemple de .htaccess pour le dossier /api</h3>
        <pre>
# Activer le moteur de réécriture
RewriteEngine On

# Force PHP pour tous les fichiers .php
&lt;FilesMatch "\.php$"&gt;
    SetHandler application/x-httpd-php
&lt;/FilesMatch&gt;

# Assurer que PHP est activé
&lt;IfModule mod_php.c&gt;
    php_flag engine on
    php_value default_charset "UTF-8"
    php_flag display_errors on
&lt;/IfModule&gt;

# Support pour FPM
&lt;IfModule mod_proxy_fcgi.c&gt;
    &lt;FilesMatch "\.php$"&gt;
        SetHandler "proxy:unix:/var/run/php-fpm.sock|fcgi://localhost"
    &lt;/FilesMatch&gt;
&lt;/IfModule&gt;

# Définir les types MIME corrects
AddType application/javascript .js
AddType text/css .css

# Configuration CORS
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
        </pre>
        
        <h3>Exemple de .user.ini</h3>
        <pre>
; Configuration PHP via .user.ini pour les hébergements qui supportent PHP-FPM
display_errors = on
error_log = php_errors.log
log_errors = on
engine = on
        </pre>
    </div>

    <div class="section">
        <h2>Contact support Infomaniak</h2>
        <p>Si les solutions ci-dessus ne fonctionnent pas, contactez le support Infomaniak:</p>
        <ul>
            <li>Support: <a href="https://support.infomaniak.com" target="_blank">support.infomaniak.com</a></li>
            <li>Téléphone: 0848 777 899</li>
        </ul>
        <p>Mentionnez spécifiquement que:</p>
        <ol>
            <li>PHP ne s'exécute pas dans votre dossier /api</li>
            <li>Les fichiers PHP sont renvoyés en texte brut plutôt qu'exécutés</li>
            <li>Vous avez déjà vérifié la configuration PHP dans le Manager</li>
        </ol>
    </div>

    <footer style="margin-top: 30px; text-align: center; font-size: 0.8em;">
        Diagnostic PHP généré le <?php echo date('Y-m-d H:i:s'); ?>
    </footer>
</body>
</html>
