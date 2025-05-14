
#!/bin/bash
# Script pour trouver les chemins importants sur Infomaniak

echo "==== Diagnostic des chemins sur Infomaniak ===="
echo "Date: $(date)"
echo "Utilisateur: $(whoami)"
echo "Répertoire actuel: $(pwd)"

echo -e "\n== Recherche des répertoires sites =="
echo "Recherche du répertoire /sites/ :"
if [ -d "/sites" ]; then
    echo "✓ Répertoire /sites/ trouvé"
    ls -la /sites/ | head -n 5
else
    echo "✗ Répertoire /sites/ non trouvé"
fi

echo -e "\n== Recherche des répertoires clients =="
if [ -d "/home/customers" ]; then
    echo "✓ Répertoire /home/customers/ trouvé"
    ls -la /home/customers/ | head -n 5
else
    echo "✗ Répertoire /home/customers/ non trouvé"
fi

echo -e "\n== Recherche de votre identifiant client =="
# Rechercher les répertoires clients qui vous appartiennent
client_dirs=$(find /home/customers -maxdepth 1 -type d -user $(whoami) 2>/dev/null)
if [ -n "$client_dirs" ]; then
    echo "✓ Répertoires clients trouvés pour votre utilisateur:"
    for dir in $client_dirs; do
        echo "  - $dir"
        # Afficher les sites dans ce répertoire client
        sites_dir="$dir/sites"
        if [ -d "$sites_dir" ]; then
            echo "    Sites dans ce répertoire:"
            ls -la "$sites_dir" | grep "^d" | awk '{print $9}'
        fi
    done
else
    echo "✗ Aucun répertoire client trouvé pour votre utilisateur"
fi

echo -e "\n== Recherche du fichier ssh-diagnostic.sh =="
# Chercher dans les endroits les plus probables
find /home/customers -name "ssh-diagnostic.sh" 2>/dev/null | while read file; do
    echo "Trouvé: $file ($(du -h $file | cut -f1))"
    echo "Permissions: $(ls -la $file | awk '{print $1,$3,$4}')"
done

echo -e "\n== Vérification des domaines configurés =="
# Chercher quels domaines sont configurés
if [ -d "/sites" ]; then
    echo "Domaines trouvés dans /sites/:"
    ls -la /sites/ | grep "^d" | awk '{print $9}'
fi

echo -e "\n== Commandes pour accéder au site =="
echo "Pour accéder à votre site, essayez:"
echo "cd /sites/qualiopi.ch  # ou le nom de votre domaine"
echo "cd /home/customers/*/sites/qualiopi.ch  # en remplaçant * par votre ID client"

echo -e "\nDiagnostic terminé."
