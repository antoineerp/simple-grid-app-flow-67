
<?php
// Configuration directe pour la connexion à Infomaniak
// Ce fichier est utilisé pour se connecter directement à la base de données Infomaniak

// Paramètres de connexion à la base de données Infomaniak
$infomaniakHost = "p71x6d.myd.infomaniak.com";
$infomaniakDbName = "p71x6d_system";
$infomaniakUsername = "p71x6d_system";
$infomaniakPassword = "Trottinette43!";

// Fonction pour obtenir une connexion PDO
function getInfomaniakConnection() {
    global $infomaniakHost, $infomaniakDbName, $infomaniakUsername, $infomaniakPassword;
    
    try {
        $dsn = "mysql:host={$infomaniakHost};dbname={$infomaniakDbName};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $conn = new PDO($dsn, $infomaniakUsername, $infomaniakPassword, $options);
        error_log("Connexion directe à la base de données Infomaniak établie avec succès");
        return $conn;
    } catch (PDOException $e) {
        error_log("Erreur de connexion directe à la base de données Infomaniak: " . $e->getMessage());
        throw $e;
    }
}

// Test simple de la connexion
function testInfomaniakConnection() {
    try {
        $conn = getInfomaniakConnection();
        $result = $conn->query("SELECT 1");
        return true;
    } catch (Exception $e) {
        error_log("Test de la connexion Infomaniak échoué: " . $e->getMessage());
        return false;
    }
}
?>
