
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test de Connexion FTP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test de Connexion FTP</h1>
        
        <div class="card">
            <h2>Configuration FTP pour GitHub Actions</h2>
            <p>Ce test vérifie si votre serveur est accessible via FTP standard (port 21).</p>
            
            <?php
            $server = isset($_POST['server']) ? $_POST['server'] : '';
            $username = isset($_POST['username']) ? $_POST['username'] : '';
            $password = isset($_POST['password']) ? $_POST['password'] : '';
            
            if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($server) && !empty($username) && !empty($password)) {
                echo "<h3>Résultats du test FTP</h3>";
                echo "<p>Test de connexion au serveur: <strong>{$server}</strong></p>";
                
                // Test de connexion FTP
                $conn_id = @ftp_connect($server, 21, 10);
                
                if ($conn_id) {
                    echo "<p class='success'>Connexion au serveur FTP réussie</p>";
                    
                    // Test d'authentification
                    $login_result = @ftp_login($conn_id, $username, $password);
                    
                    if ($login_result) {
                        echo "<p class='success'>Authentification FTP réussie</p>";
                        
                        // Obtenir le répertoire actuel
                        $current_dir = ftp_pwd($conn_id);
                        echo "<p>Répertoire actuel: {$current_dir}</p>";
                        
                        // Lister les fichiers
                        echo "<p>Liste des fichiers dans le répertoire actuel:</p>";
                        echo "<ul>";
                        $file_list = ftp_nlist($conn_id, ".");
                        if ($file_list && count($file_list) > 0) {
                            foreach ($file_list as $file) {
                                echo "<li>{$file}</li>";
                            }
                        } else {
                            echo "<li>Aucun fichier trouvé ou impossible de lister les fichiers</li>";
                        }
                        echo "</ul>";
                        
                        echo "<h3>✓ Votre configuration FTP fonctionne correctement</h3>";
                        echo "<p>Vous pouvez utiliser ces paramètres avec l'action GitHub <code>SamKirkland/FTP-Deploy-Action@4.3.4</code></p>";
                    } else {
                        echo "<p class='error'>Échec de l'authentification FTP. Vérifiez vos identifiants.</p>";
                    }
                    
                    // Fermer la connexion
                    ftp_close($conn_id);
                    echo "<p>Connexion FTP fermée</p>";
                } else {
                    echo "<p class='error'>Impossible de se connecter au serveur FTP sur le port 21.</p>";
                    echo "<p>Erreur: " . error_get_last()['message'] . "</p>";
                    echo "<p>Suggestions:</p>";
                    echo "<ul>";
                    echo "<li>Vérifiez que le serveur accepte les connexions FTP sur le port 21</li>";
                    echo "<li>Assurez-vous que le nom d'hôte est correct</li>";
                    echo "<li>Vérifiez qu'aucun pare-feu ne bloque les connexions FTP</li>";
                    echo "</ul>";
                }
            } else {
                // Formulaire de test
                ?>
                <form method="post" action="">
                    <div style="margin-bottom: 15px;">
                        <label for="server" style="display: block; margin-bottom: 5px;">Serveur FTP:</label>
                        <input type="text" id="server" name="server" value="" style="width: 100%; padding: 8px; box-sizing: border-box;" placeholder="exemple.ftp.infomaniak.com">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="username" style="display: block; margin-bottom: 5px;">Nom d'utilisateur:</label>
                        <input type="text" id="username" name="username" value="" style="width: 100%; padding: 8px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="password" style="display: block; margin-bottom: 5px;">Mot de passe:</label>
                        <input type="password" id="password" name="password" value="" style="width: 100%; padding: 8px; box-sizing: border-box;">
                    </div>
                    <div style="text-align: center;">
                        <input type="submit" value="Tester la connexion FTP" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    </div>
                </form>
                <?php
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Configuration GitHub Actions</h2>
            <p>Pour configurer votre workflow GitHub Actions avec FTP:</p>
            <pre>
- name: Deploy to Infomaniak using FTP
  uses: SamKirkland/FTP-Deploy-Action@4.3.4
  with:
    server: ${{ secrets.FTP_SERVER }}
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    local-dir: ./dist/
    server-dir: /sites/qualiopi.ch/
    dangerous-clean-slate: false
    timeout: 120000
            </pre>
        </div>
    </div>
</body>
</html>
