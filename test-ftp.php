
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test FTP Connection</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .step { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test de connexion FTP vers Infomaniak</h1>
        
        <div class="card">
            <h2>Paramètres FTP</h2>
            <p>Pour tester votre connexion FTP, veuillez entrer vos informations ci-dessous.</p>
            <p><strong>Note:</strong> Ces informations ne sont utilisées que pour ce test et ne sont pas stockées.</p>
            
            <form method="post" action="">
                <div style="margin-bottom: 15px;">
                    <label for="ftp_server" style="display: block; margin-bottom: 5px;">Serveur FTP:</label>
                    <input type="text" id="ftp_server" name="ftp_server" value="<?php echo htmlspecialchars($_POST['ftp_server'] ?? ''); ?>" style="width: 100%; padding: 8px; box-sizing: border-box;" placeholder="exemple.ftp.infomaniak.com">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="ftp_username" style="display: block; margin-bottom: 5px;">Nom d'utilisateur FTP:</label>
                    <input type="text" id="ftp_username" name="ftp_username" value="<?php echo htmlspecialchars($_POST['ftp_username'] ?? ''); ?>" style="width: 100%; padding: 8px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="ftp_password" style="display: block; margin-bottom: 5px;">Mot de passe FTP:</label>
                    <input type="password" id="ftp_password" name="ftp_password" value="<?php echo htmlspecialchars($_POST['ftp_password'] ?? ''); ?>" style="width: 100%; padding: 8px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="ftp_mode" style="display: block; margin-bottom: 5px;">Mode de connexion:</label>
                    <select id="ftp_mode" name="ftp_mode" style="width: 100%; padding: 8px; box-sizing: border-box;">
                        <option value="ftp" <?php echo (isset($_POST['ftp_mode']) && $_POST['ftp_mode'] === 'ftp') ? 'selected' : ''; ?>>FTP (standard)</option>
                        <option value="ftps" <?php echo (isset($_POST['ftp_mode']) && $_POST['ftp_mode'] === 'ftps') ? 'selected' : ''; ?>>FTPS (FTP over SSL)</option>
                        <option value="sftp" <?php echo (isset($_POST['ftp_mode']) && $_POST['ftp_mode'] === 'sftp') ? 'selected' : ''; ?>>SFTP (SSH File Transfer Protocol)</option>
                    </select>
                </div>
                <div style="text-align: center;">
                    <input type="submit" value="Tester la connexion" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                </div>
            </form>
        </div>

        <?php
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['ftp_server']) && !empty($_POST['ftp_username']) && !empty($_POST['ftp_password'])) {
            $ftp_server = $_POST['ftp_server'];
            $ftp_username = $_POST['ftp_username'];
            $ftp_password = $_POST['ftp_password'];
            $ftp_mode = $_POST['ftp_mode'] ?? 'ftp';
            
            echo '<div class="card">';
            echo '<h2>Résultats du test</h2>';
            echo "<p><strong>Serveur:</strong> " . htmlspecialchars($ftp_server) . "</p>";
            echo "<p><strong>Utilisateur:</strong> " . htmlspecialchars($ftp_username) . "</p>";
            echo "<p><strong>Mode:</strong> " . htmlspecialchars($ftp_mode) . "</p>";
            
            // Test FTP standard
            if ($ftp_mode === 'ftp') {
                echo '<h3>Test de connexion FTP standard</h3>';
                $conn_id = @ftp_connect($ftp_server, 21, 30);
                
                if ($conn_id) {
                    echo "<p class='success'>Connexion au serveur FTP réussie</p>";
                    
                    // Tenter l'authentification
                    $login_result = @ftp_login($conn_id, $ftp_username, $ftp_password);
                    
                    if ($login_result) {
                        echo "<p class='success'>Authentification FTP réussie</p>";
                        
                        // Obtenir le répertoire courant
                        try {
                            $current_dir = ftp_pwd($conn_id);
                            echo "<p>Répertoire courant: " . htmlspecialchars($current_dir) . "</p>";
                            
                            // Lister les fichiers dans le répertoire courant
                            echo "<h4>Liste des fichiers dans le répertoire courant:</h4>";
                            echo "<pre>";
                            $file_list = ftp_nlist($conn_id, ".");
                            if ($file_list) {
                                foreach ($file_list as $file) {
                                    echo htmlspecialchars($file) . "\n";
                                }
                            } else {
                                echo "Impossible de lister les fichiers\n";
                            }
                            echo "</pre>";
                            
                            // Information pour GitHub Actions
                            echo "<div class='step'>";
                            echo "<h3>Configuration pour GitHub Actions</h3>";
                            echo "<p>Pour configurer GitHub Actions avec ces paramètres FTP, utilisez:</p>";
                            echo "<pre>
FTP_SERVER: $ftp_server
FTP_USERNAME: $ftp_username
FTP_PASSWORD: [Votre mot de passe]
</pre>";
                            echo "</div>";
                            
                        } catch (Exception $e) {
                            echo "<p class='error'>Erreur lors de l'exécution des commandes FTP: " . $e->getMessage() . "</p>";
                        }
                        
                    } else {
                        echo "<p class='error'>Échec de l'authentification FTP. Vérifiez vos identifiants.</p>";
                        echo "<p>Message d'erreur: " . error_get_last()['message'] . "</p>";
                    }
                    
                    // Fermer la connexion
                    ftp_close($conn_id);
                    echo "<p>Connexion FTP fermée</p>";
                } else {
                    echo "<p class='error'>Impossible de se connecter au serveur FTP</p>";
                    echo "<p>Message d'erreur: " . error_get_last()['message'] . "</p>";
                }
            }
            
            // Test FTPS
            if ($ftp_mode === 'ftps') {
                echo '<h3>Test de connexion FTPS (FTP over SSL)</h3>';
                
                if (function_exists('ftp_ssl_connect')) {
                    $conn_id = @ftp_ssl_connect($ftp_server, 21, 30);
                    
                    if ($conn_id) {
                        echo "<p class='success'>Connexion au serveur FTPS réussie</p>";
                        
                        // Tenter l'authentification
                        $login_result = @ftp_login($conn_id, $ftp_username, $ftp_password);
                        
                        if ($login_result) {
                            echo "<p class='success'>Authentification FTPS réussie</p>";
                            
                            // Information pour GitHub Actions
                            echo "<div class='step'>";
                            echo "<h3>Configuration pour GitHub Actions</h3>";
                            echo "<p>Pour configurer GitHub Actions avec ces paramètres FTPS, utilisez:</p>";
                            echo "<pre>
FTP_SERVER: $ftp_server
FTP_USERNAME: $ftp_username
FTP_PASSWORD: [Votre mot de passe]
</pre>";
                            echo "<p>Et assurez-vous d'activer l'option FTPS dans votre workflow:</p>";
                            echo "<pre>
with:
  server: \${{ secrets.FTP_SERVER }}
  username: \${{ secrets.FTP_USERNAME }}
  password: \${{ secrets.FTP_PASSWORD }}
  protocol: ftps
</pre>";
                            echo "</div>";
                            
                        } else {
                            echo "<p class='error'>Échec de l'authentification FTPS. Vérifiez vos identifiants.</p>";
                        }
                        
                        // Fermer la connexion
                        ftp_close($conn_id);
                        echo "<p>Connexion FTPS fermée</p>";
                    } else {
                        echo "<p class='error'>Impossible de se connecter au serveur FTPS</p>";
                    }
                } else {
                    echo "<p class='error'>La fonction ftp_ssl_connect() n'est pas disponible sur ce serveur</p>";
                }
            }
            
            // Test SFTP
            if ($ftp_mode === 'sftp') {
                echo '<h3>Test de connexion SFTP (SSH File Transfer Protocol)</h3>';
                
                if (function_exists('ssh2_connect')) {
                    $conn = @ssh2_connect($ftp_server, 22);
                    
                    if ($conn) {
                        echo "<p class='success'>Connexion SSH établie</p>";
                        
                        // Authentification
                        if (@ssh2_auth_password($conn, $ftp_username, $ftp_password)) {
                            echo "<p class='success'>Authentification SFTP réussie</p>";
                            
                            // Initialiser SFTP
                            $sftp = @ssh2_sftp($conn);
                            if ($sftp) {
                                echo "<p class='success'>Sous-système SFTP initialisé</p>";
                                
                                // Information pour GitHub Actions
                                echo "<div class='step'>";
                                echo "<h3>Important: GitHub Actions ne supporte pas nativement SFTP</h3>";
                                echo "<p>Le GitHub Action 'SamKirkland/FTP-Deploy-Action' ne supporte pas SFTP. Pour SFTP, vous devrez utiliser une action différente comme:</p>";
                                echo "<pre>
- name: SFTP Deploy
  uses: wlixcc/SFTP-Deploy-Action@v1.2.4
  with:
    server: $ftp_server
    username: $ftp_username
    password: \${{ secrets.SFTP_PASSWORD }}
    port: 22
    local_path: './dist/'
    remote_path: '/sites/qualiopi.ch/'
</pre>";
                                echo "</div>";
                            } else {
                                echo "<p class='error'>Impossible d'initialiser le sous-système SFTP</p>";
                            }
                        } else {
                            echo "<p class='error'>Échec de l'authentification SFTP</p>";
                        }
                    } else {
                        echo "<p class='error'>Impossible d'établir une connexion SSH</p>";
                        echo "<p>Assurez-vous que le port 22 est ouvert et que le serveur accepte les connexions SSH</p>";
                    }
                } else {
                    echo "<p class='error'>Les fonctions SSH2 ne sont pas disponibles sur ce serveur. Impossible de tester SFTP.</p>";
                    echo "<p>Pour utiliser SFTP, vous devez avoir l'extension PHP SSH2 installée.</p>";
                }
            }
            
            echo '</div>';
        }
        ?>

        <div class="card">
            <h2>Résolution des problèmes courants</h2>
            
            <div class="step">
                <h3>1. Infomaniak utilise généralement SFTP, pas FTP</h3>
                <p>Le message d'erreur indique que le service ne répond peut-être qu'en SFTP et non en FTP/FTPS.</p>
                <p>Pour Infomaniak, le format du serveur est généralement:</p>
                <pre>votre-site.ftp.infomaniak.com</pre>
                <p>Mais vous devez confirmer le protocole correct (SFTP vs FTP) avec votre fournisseur.</p>
            </div>
            
            <div class="step">
                <h3>2. Vérifiez les informations d'identification</h3>
                <p>Assurez-vous que les identifiants FTP dans vos secrets GitHub correspondent exactement à ceux d'Infomaniak.</p>
            </div>
            
            <div class="step">
                <h3>3. Problèmes de Timeout</h3>
                <p>L'erreur "Timeout (control socket)" pourrait indiquer:</p>
                <ul>
                    <li>Un problème réseau entre GitHub Actions et Infomaniak</li>
                    <li>Un blocage du port FTP (21) par un pare-feu</li>
                    <li>Des restrictions de connexion côté Infomaniak</li>
                </ul>
            </div>
            
            <div class="step">
                <h3>4. Modification du workflow GitHub Actions</h3>
                <p>Voici comment modifier votre workflow pour SFTP au lieu de FTP:</p>
                <pre>
- name: Sync full dist folder to Infomaniak server
  uses: wlixcc/SFTP-Deploy-Action@v1.2.4
  with:
    server: ${{ secrets.FTP_SERVER }}
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    port: 22
    local_path: './dist/'
    remote_path: '/sites/qualiopi.ch/'
    delete_remote_files: false
</pre>
            </div>
        </div>
    </div>
</body>
</html>

