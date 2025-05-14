
#!/bin/bash
# Script de diagnostic amélioré pour exécution via SSH

echo "==========================================="
echo "Diagnostic SSH avancé pour FormaCert - $(date)"
echo "==========================================="

# Vérifier la structure des dossiers
echo -e "\n== Structure des dossiers =="
for dir in "." "assets" "api" "api/config" "api/controllers" "api/models" "public" "public/lovable-uploads"
do
  if [ -d "$dir" ]; then
    file_count=$(find "$dir" -type f | wc -l)
    echo "✓ $dir: Existe ($file_count fichiers)"
    ls -la "$dir" | head -n 10
  else
    echo "✗ $dir: MANQUANT"
  fi
done

# Vérifier les fichiers PHP clés
echo -e "\n== Fichiers PHP clés =="
for file in "index.php" "phpinfo.php" "php-debug.php" "api/index.php" "api/phpinfo.php" "api/direct-db-test.php" "api/db-test.php"
do
  if [ -f "$file" ]; then
    size=$(du -h "$file" | cut -f1)
    perms=$(ls -la "$file" | awk '{print $1}')
    owner=$(ls -la "$file" | awk '{print $3":"$4}')
    echo "✓ $file: Existe (taille: $size, permissions: $perms, propriétaire: $owner)"
  else
    echo "✗ $file: MANQUANT"
  fi
done

# Vérifier la configuration PHP
echo -e "\n== Configuration PHP =="
for file in ".user.ini" "api/.user.ini" "api/php.ini"
do
  if [ -f "$file" ]; then
    echo "✓ $file: Existe"
    echo "   Contenu:"
    cat "$file" | grep -E 'display_errors|error_log|log_errors|upload_max|memory_limit|date.timezone' | sed 's/^/   /'
  else
    echo "✗ $file: MANQUANT"
  fi
done

# Vérifier les chemins d'accès
echo -e "\n== Chemins d'accès =="
echo "Chemin actuel: $(pwd)"
echo "Utilisateur: $(whoami)"
echo "Groupe: $(id -gn)"

# Tester l'exécution PHP en ligne de commande
echo -e "\n== Test PHP CLI =="
if command -v php >/dev/null 2>&1; then
  php_version=$(php -v | head -n 1)
  echo "PHP CLI disponible: $php_version"
  
  # Créer un script PHP temporaire pour tester l'exécution
  echo "<?php echo 'Test PHP CLI: OK (' . date('Y-m-d H:i:s') . ')'; ?>" > php_test_cli.php
  php_result=$(php php_test_cli.php 2>&1)
  echo "Résultat test PHP: $php_result"
  rm php_test_cli.php
else
  echo "PHP CLI non disponible ou non dans le PATH"
fi

# Vérifier la configuration de la base de données
echo -e "\n== Configuration de la base de données =="
if [ -f "api/config/db_config.json" ]; then
  echo "Fichier db_config.json trouvé"
  # Afficher le contenu sans le mot de passe
  cat api/config/db_config.json | sed 's/"password": "[^"]*"/"password": "******"/g'
else
  echo "Fichier db_config.json NON trouvé"
fi

# Vérifier la présence des logs d'erreur
echo -e "\n== Logs d'erreur PHP =="
for log in "api/php_errors.log" "php_errors.log" "/tmp/php-errors.log" "/var/log/apache2/error.log" "/var/log/httpd/error_log"
do
  if [ -f "$log" ]; then
    echo "✓ Log trouvé: $log (dernières 5 lignes)"
    tail -n 5 "$log" | sed 's/^/   /'
  fi
done

# Vérifier les routes et la configuration .htaccess
echo -e "\n== Configuration des routes =="
for htaccess in ".htaccess" "api/.htaccess"
do
  if [ -f "$htaccess" ]; then
    echo "✓ $htaccess trouvé"
    cat "$htaccess" | grep -E 'RewriteRule|RewriteCond|RewriteEngine|php_value' | head -n 10 | sed 's/^/   /'
  else
    echo "✗ $htaccess MANQUANT"
  fi
done

# Tester la résolution de connexion à la base de données
echo -e "\n== Test de connexion à la base de données =="
if [ -f "api/config/db_config.json" ]; then
  db_host=$(cat api/config/db_config.json | grep -o '"host": "[^"]*"' | cut -d'"' -f4)
  echo "Test de ping vers $db_host:"
  ping -c 3 $db_host 2>&1
else
  echo "Impossible de tester la connexion (fichier de config absent)"
fi

echo -e "\nDiagnostic terminé"
