
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
    </style>
</head>
<body>
    <h1>Test de connexion FTP vers Infomaniak</h1>
    
    <?php
    // Paramètres de connexion FTP (remplacer par les vôtres)
    $ftp_server = "your-ftp-server.infomaniak.com";
    $ftp_username = "your-username";
    $ftp_password = "your-password";
    
    echo "<h2>Tentative de connexion FTP</h2>";
    echo "<p>Serveur: " . htmlspecialchars($ftp_server) . "</p>";
    echo "<p>Utilisateur: " . htmlspecialchars($ftp_username) . "</p>";
    
    // Tenter la connexion FTP
    $conn_id = @ftp_connect($ftp_server);
    
    if ($conn_id) {
        echo "<p class='success'>Connexion au serveur FTP réussie</p>";
        
        // Tenter l'authentification
        $login_result = @ftp_login($conn_id, $ftp_username, $ftp_password);
        
        if ($login_result) {
            echo "<p class='success'>Authentification FTP réussie</p>";
            
            // Obtenir le répertoire courant
            $current_dir = ftp_pwd($conn_id);
            echo "<p>Répertoire courant: " . htmlspecialchars($current_dir) . "</p>";
            
            // Lister les fichiers dans le répertoire courant
            echo "<h3>Liste des fichiers dans le répertoire courant:</h3>";
            echo "<pre>";
            $file_list = ftp_nlist($conn_id, ".");
            foreach ($file_list as $file) {
                echo htmlspecialchars($file) . "\n";
            }
            echo "</pre>";
            
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
    ?>
    
    <h2>Conseils pour résoudre les problèmes de connexion FTP</h2>
    <ol>
        <li>Vérifiez que le nom d'utilisateur FTP est au format correct (généralement différent du nom d'utilisateur de base de données)</li>
        <li>Confirmez que le mot de passe FTP est correct</li>
        <li>Assurez-vous que votre serveur FTP est bien *.ftp.infomaniak.com (vérifiez dans votre espace client Infomaniak)</li>
        <li>Vérifiez que votre compte a les permissions nécessaires pour accéder au répertoire cible</li>
        <li>Assurez-vous que les secrets GitHub (FTP_SERVER, FTP_USERNAME, FTP_PASSWORD) sont correctement configurés</li>
    </ol>
</body>
</html>
