
#!/bin/bash
# Script de diagnostic spécifique pour l'hébergement Infomaniak

echo "==========================================="
echo "Diagnostic Infomaniak - $(date)"
echo "==========================================="

# Vérifier les chemins spécifiques à Infomaniak
echo -e "\n== Chemins Infomaniak =="
infomaniak_paths=(
  "/home/customers/"
  "/sites/"
  "/tmp/"
  "/var/log/"
)

for path in "${infomaniak_paths[@]}"; do
  if [ -d "$path" ]; then
    echo "✓ $path: Existe"
    ls -la "$path" 2>/dev/null | head -n 3 || echo "  (Accès refusé)"
  else
    echo "✗ $path: N'existe pas"
  fi
done

# Vérifier les logs d'erreur Apache/PHP
echo -e "\n== Logs d'erreur =="
log_paths=(
  "./api/php_errors.log"
  "./php_errors.log"
  "/tmp/php-errors.log"
)

for log in "${log_paths[@]}"; do
  if [ -f "$log" ]; then
    echo "✓ Log trouvé: $log (dernières lignes)"
    tail -n 10 "$log" | sed 's/^/  /'
  else
    echo "✗ Log non trouvé: $log"
  fi
done

# Vérifier les processus PHP en cours
echo -e "\n== Processus PHP =="
ps aux | grep -E 'php|apache|httpd' | grep -v grep || echo "Aucun processus PHP/Apache trouvé"

# Vérifier la mémoire et l'espace disque
echo -e "\n== Ressources système =="
echo "Mémoire:"
free -h || echo "Commande 'free' non disponible"

echo -e "\nEspace disque:"
df -h | grep -E '/$|/home' || echo "Commande 'df' non disponible"

# Vérifier la connectivité à la base de données
echo -e "\n== Test connectivité MySQL =="
if [ -f "./api/config/db_config.json" ]; then
  db_host=$(cat ./api/config/db_config.json | grep -o '"host": "[^"]*"' | cut -d'"' -f4)
  echo "Host: $db_host"
  
  # Test ping
  ping -c 3 $db_host || echo "Ping vers $db_host échoué"
  
  # Test telnet
  echo "Test telnet vers $db_host:3306..."
  (echo > /dev/tcp/$db_host/3306) >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✓ Port MySQL accessible"
  else
    echo "✗ Port MySQL inaccessible"
  fi
else
  echo "Fichier de configuration de base de données non trouvé"
fi

echo -e "\nDiagnostic Infomaniak terminé"
