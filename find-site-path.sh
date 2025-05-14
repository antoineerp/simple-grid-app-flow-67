
#!/bin/bash
# Script pour trouver le chemin correct du site qualiopi.ch

echo "=== Diagnostic des chemins pour qualiopi.ch ==="
echo "Date: $(date)"
echo "Utilisateur: $(whoami)"
echo "Répertoire actuel: $(pwd)"

# Vérifier les chemins possibles
echo -e "\n== Vérification des chemins possibles =="
paths=(
  "/sites/qualiopi.ch"
  "/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch"
  "$(pwd)/sites/qualiopi.ch"
)

for path in "${paths[@]}"; do
  echo -n "Chemin $path: "
  if [ -d "$path" ]; then
    echo "EXISTE"
    echo "  Contenu:"
    ls -la "$path" | head -n 10
    echo "  Total fichiers: $(find "$path" -type f | wc -l)"
  else
    echo "N'EXISTE PAS"
  fi
done

# Vérifier la structure du dossier sites
echo -e "\n== Contenu du dossier sites =="
sites_path="$(pwd)/sites"
if [ -d "$sites_path" ]; then
  echo "Le dossier $sites_path existe"
  echo "Contenu:"
  ls -la "$sites_path"
else
  echo "Le dossier $sites_path n'existe pas"
fi

# Chercher le fichier .htaccess et index.html
echo -e "\n== Recherche des fichiers importants =="
possible_dirs=(
  "$(pwd)"
  "$(pwd)/sites/qualiopi.ch"
)

for dir in "${possible_dirs[@]}"; do
  echo "Dans $dir:"
  
  if [ -f "$dir/.htaccess" ]; then
    echo "  .htaccess: TROUVÉ ($(wc -l < "$dir/.htaccess") lignes)"
  else
    echo "  .htaccess: NON TROUVÉ"
  fi
  
  if [ -f "$dir/index.html" ]; then
    echo "  index.html: TROUVÉ ($(wc -l < "$dir/index.html") lignes)"
  else
    echo "  index.html: NON TROUVÉ"
  fi
  
  if [ -d "$dir/api" ]; then
    echo "  dossier api: TROUVÉ ($(find "$dir/api" -type f | wc -l) fichiers)"
    if [ -f "$dir/api/config/db_config.json" ]; then
      echo "  db_config.json: TROUVÉ"
      # Afficher le host sans le mot de passe
      grep -v password "$dir/api/config/db_config.json" | grep host || echo "    (impossible de lire le fichier)"
    else
      echo "  db_config.json: NON TROUVÉ"
    fi
  else
    echo "  dossier api: NON TROUVÉ"
  fi
done

echo -e "\n== Résumé =="
echo "Pour accéder à votre site, utilisez probablement: cd $(pwd)/sites/qualiopi.ch (si ce dossier existe)"
echo "Diagnostic terminé."
