
#!/bin/bash
# Script de diagnostic pour exécution via SSH

echo "==========================================="
echo "Diagnostic SSH pour FormaCert - $(date)"
echo "==========================================="

# Vérifier la structure des dossiers
echo -e "\n== Structure des dossiers =="
for dir in "." "assets" "api" "api/config" "public" "public/lovable-uploads"
do
  if [ -d "$dir" ]; then
    file_count=$(find "$dir" -type f | wc -l)
    echo "✓ $dir: Existe ($file_count fichiers)"
  else
    echo "✗ $dir: MANQUANT"
  fi
done

# Vérifier les fichiers clés
echo -e "\n== Fichiers clés =="
for file in "index.html" ".htaccess" "api/config/db_config.json" "assets/index.js"
do
  if [ -f "$file" ]; then
    size=$(du -h "$file" | cut -f1)
    echo "✓ $file: Existe (taille: $size)"
  else
    echo "✗ $file: MANQUANT"
  fi
done

# Vérifier les droits d'accès
echo -e "\n== Droits d'accès =="
echo "Dossier courant: $(pwd)"
echo "Utilisateur: $(whoami)"
echo "Groupe: $(id -gn)"
echo "Droits dossier actuel: $(ls -ld .)"
echo "Droits assets: $(ls -ld assets 2>/dev/null || echo 'Dossier assets introuvable')"
echo "Droits api: $(ls -ld api 2>/dev/null || echo 'Dossier api introuvable')"

# Vérifier les fichiers JavaScript
echo -e "\n== Fichiers JavaScript =="
if [ -d "assets" ]; then
  echo "Liste des fichiers JS dans assets:"
  find ./assets -name "*.js" -type f | xargs ls -lh 2>/dev/null
else
  echo "Dossier assets introuvable"
fi

echo -e "\nDiagnostic terminé"
