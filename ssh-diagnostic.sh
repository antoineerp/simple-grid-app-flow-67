
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

# Résoudre le problème MIME CSS
echo -e "\n== Correction des types MIME =="
ASSETS_HTACCESS="$BASE_PATH/assets/.htaccess"

echo "Création/Mise à jour du fichier .htaccess pour les assets..."
cat > "$ASSETS_HTACCESS" << 'EOF'
# Définir les types MIME corrects
<IfModule mod_mime.c>
    AddType text/css .css
    AddType application/javascript .js
</IfModule>

# Forcer le type MIME pour les fichiers CSS
<FilesMatch "\.css$">
    ForceType text/css
</FilesMatch>

# Désactiver tout filtrage de type pour les fichiers statiques
<IfModule mod_filter.c>
    FilterDeclare COMPRESS
    <FilesMatch "\.(css|js)$">
        FilterProvider COMPRESS DEFLATE "%{CONTENT_TYPE} = 'text/css' or %{CONTENT_TYPE} = 'application/javascript'"
        FilterChain COMPRESS
    </FilesMatch>
</IfModule>
EOF

# S'assurer que le fichier est accessible
chmod 644 "$ASSETS_HTACCESS"
echo "✓ Fichier .htaccess créé dans assets/"
echo "  Contenu:"
cat "$ASSETS_HTACCESS" | sed 's/^/  /'

# Vérifier si un test CSS existe
TEST_CSS="$BASE_PATH/assets/test-style.css"
if [ ! -f "$TEST_CSS" ]; then
    echo "Création d'un fichier CSS de test..."
    echo "/* Fichier CSS de test pour vérifier le type MIME */
body { 
  background-color: #f0f8ff; 
  font-family: Arial, sans-serif;
}" > "$TEST_CSS"
    chmod 644 "$TEST_CSS"
    echo "✓ Fichier CSS de test créé: $TEST_CSS"
fi

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
echo "Pour tester si les corrections ont été appliquées, accédez à:"
echo "https://qualiopi.ch/assets/test-style.css"
echo "Le type MIME dans les en-têtes de réponse devrait être 'text/css'"
echo "==================================================="
