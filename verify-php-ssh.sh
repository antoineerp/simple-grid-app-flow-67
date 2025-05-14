#!/bin/bash
# Script de vérification de l'exécution PHP via SSH sur Infomaniak

echo "==================================================="
echo "Vérification PHP pour Qualiopi.ch - $(date)"
echo "==================================================="

# Définir le chemin de base correct pour Infomaniak
BASE_PATH="/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch"
echo "Utilisation du chemin de base: $BASE_PATH"
echo "Chemin actuel: $(pwd)"

# Se déplacer dans le répertoire de l'application
cd "$BASE_PATH" || { echo "⚠️ Impossible d'accéder au répertoire $BASE_PATH"; exit 1; }

# Créer un fichier PHP de test temporaire
echo "Création d'un fichier PHP de test..."
cat > php-ssh-test.php << 'EOF'
<?php
echo "=== TEST D'EXÉCUTION PHP VIA SSH ===\n";
echo "Date et heure: " . date('Y-m-d H:i:s') . "\n";
echo "Version PHP: " . phpversion() . "\n";
echo "Extensions chargées: " . implode(', ', get_loaded_extensions()) . "\n";
echo "User: " . (function_exists('posix_getpwuid') ? posix_getpwuid(posix_geteuid())['name'] : 'Non disponible') . "\n";
echo "Chemin actuel: " . getcwd() . "\n";
echo "=== FIN DU TEST ===\n";
?>
EOF

chmod 755 php-ssh-test.php

# Tester l'exécution PHP en mode CLI
echo -e "\n== Test PHP en mode CLI =="
echo "Exécution de php-ssh-test.php avec l'interpréteur PHP..."
if command -v php &> /dev/null; then
    php -f php-ssh-test.php
    echo "✓ PHP CLI fonctionne correctement"
else
    echo "✗ Commande PHP non disponible"
fi

# Tester si PHP est bien configuré pour Apache/le serveur web
echo -e "\n== Vérification de la configuration PHP pour le web =="

# Vérifier le handler PHP dans .htaccess
if [ -f ".htaccess" ]; then
    echo "Contenu de .htaccess lié à PHP:"
    grep -i "php\|handler\|AddType" .htaccess || echo "  Aucune directive PHP trouvée"
fi

# Vérifier les fichiers .user.ini
if [ -f ".user.ini" ]; then
    echo "Configuration .user.ini trouvée:"
    cat .user.ini | sed 's/^/  /'
else
    echo "Aucun fichier .user.ini trouvé dans le répertoire racine"
fi

# Vérifier si php-fpm est utilisé
echo -e "\n== Vérification de PHP-FPM =="
if ps aux | grep -q "php-fpm"; then
    echo "✓ PHP-FPM est en cours d'exécution"
else
    echo "✗ PHP-FPM ne semble pas être en cours d'exécution"
fi

# Essayer des chemins PHP alternatifs
echo -e "\n== Test avec des chemins PHP alternatifs =="
for php_path in /usr/bin/php /usr/local/bin/php /opt/alt/php*/usr/bin/php; do
    if [ -x "$php_path" ]; then
        echo "Essai avec $php_path..."
        $php_path -f php-ssh-test.php
    fi
done

echo -e "\n== Vérification des droits et propriétaires =="
ls -la php-ssh-test.php
ls -la .

echo -e "\n== Test terminé =="
echo "Si PHP CLI fonctionne mais que les scripts PHP ne s'exécutent pas via le web,"
echo "cela peut être dû à une configuration du serveur web ou aux droits d'accès."
echo "==================================================="
