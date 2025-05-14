
#!/bin/bash
# Script de diagnostic amélioré pour exécution via SSH

echo "==================================================="
echo "Diagnostic SSH pour Qualiopi.ch - $(date)"
echo "==================================================="

# Définir le chemin de base correct pour Infomaniak
BASE_PATH="/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch"
echo "Utilisation du chemin de base: $BASE_PATH"
echo "Chemin actuel: $(pwd)"

# Se déplacer dans le répertoire de l'application si nécessaire
if [ "$(pwd)" != "$BASE_PATH" ]; then
    echo "Changement vers le répertoire $BASE_PATH pour le diagnostic..."
    cd "$BASE_PATH" || echo "⚠️ Impossible d'accéder au répertoire $BASE_PATH"
    echo "Nouveau répertoire courant: $(pwd)"
fi

# Vérifier les commandes disponibles
echo -e "\n== Commandes disponibles =="
for cmd in ls find grep cat mkdir chmod; do
    if command -v $cmd &> /dev/null; then
        echo "✓ $cmd: disponible"
    else
        echo "✗ $cmd: non disponible"
    fi
done

# Vérification de la structure des dossiers
echo -e "\n== Structure des dossiers =="
for dir in . ./api ./api/config ./assets ./public ./public/lovable-uploads; do
    if [ -d "$dir" ]; then
        echo "✓ $dir: existe"
        ls -la "$dir" | head -n 5
    else
        echo "✗ $dir: n'existe pas"
        # Création automatique si nécessaire
        mkdir -p "$dir" && echo "  → Dossier créé" || echo "  → Impossible de créer le dossier"
    fi
done

# Vérification des fichiers clés
echo -e "\n== Fichiers clés =="
for file in index.php .htaccess api/index.php api/.htaccess api/config/db_config.json; do
    if [ -f "$file" ]; then
        echo "✓ $file: existe ($(wc -l < "$file") lignes, $(stat -c %s "$file" 2>/dev/null || ls -l "$file" | awk '{print $5}') octets)"
    else
        echo "✗ $file: n'existe pas"
    fi
done

# Trouver les assets compilés
echo -e "\n== Recherche d'assets =="
find . -name "*.js" -o -name "*.css" | grep -v "node_modules" | head -n 10

# Vérifier les permissions du répertoire web
echo -e "\n== Permissions des répertoires principaux =="
for dir in . ./api ./assets ./public; do
    if [ -d "$dir" ]; then
        echo "$dir: $(ls -ld "$dir" | awk '{print $1, $3, $4}')"
    fi
done

# Vérifier les journaux d'erreurs si disponibles
echo -e "\n== Logs d'erreurs =="
for log in ./error_log ./api/error_log /var/log/apache2/error.log; do
    if [ -f "$log" ] && [ -r "$log" ]; then
        echo "✓ $log existe, dernières lignes:"
        tail -n 10 "$log"
    fi
done

# Vérifier la configuration du déploiement GitHub
echo -e "\n== Configuration GitHub Actions =="
if [ -d "./.github/workflows" ]; then
    echo "✓ Dossier workflows trouvé"
    ls -la ./.github/workflows/
    
    # Afficher le contenu du workflow de déploiement s'il existe
    if [ -f "./.github/workflows/deploy.yml" ]; then
        echo "✓ Fichier deploy.yml trouvé:"
        grep -A 5 "server-dir:" ./.github/workflows/deploy.yml || echo "  Aucune directive server-dir trouvée"
    else
        echo "✗ Fichier deploy.yml non trouvé"
    fi
else
    echo "✗ Dossier .github/workflows non trouvé"
fi

echo -e "\n== Diagnostic terminé =="
echo "Pour créer les dossiers manquants, exécutez: bash mkdir_script.sh"
echo "==================================================="
