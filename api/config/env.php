
<?php
// Configuration des variables d'environnement pour Infomaniak
define('DB_HOST', 'p71x6d.myd.infomaniak.com');
define('DB_NAME', 'p71x6d_richard'); // Changé de p71x6d_system à p71x6d_richard
define('DB_USER', 'p71x6d_richard'); // Changé pour correspondre
define('DB_PASS', 'Trottinette43!');
define('API_BASE_URL', '/api');
define('APP_ENV', 'production');

// Fonction d'aide pour récupérer les variables d'environnement
function get_env($key, $default = null) {
    $const_name = strtoupper($key);
    if (defined($const_name)) {
        return constant($const_name);
    }
    return $default;
}
?>
