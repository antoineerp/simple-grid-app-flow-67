
// Fichier pont pour la compatibilité avec les scripts de diagnostic
console.log("Chargement du fichier pont index.js");

// En mode développement, importer depuis src
// En mode production, on utilisera le fichier hashé le plus récent
try {
  // Tenter d'importer depuis src (développement)
  const moduleUrl = '/src/main.tsx';
  import(moduleUrl).catch(async (e) => {
    console.log("Import depuis src échoué, recherche d'un fichier hashé:", e);
    
    // Liste des fichiers possibles dans l'ordre de préférence
    const possibleFiles = [
      '/assets/main-DyYsnb4q.js',  // Utiliser le dernier fichier hashé
      '/assets/main.js',
      '/src/main.js'
    ];
    
    // Essayer chaque fichier jusqu'à ce qu'un fonctionne
    for (const file of possibleFiles) {
      try {
        await import(file);
        console.log('Chargement réussi depuis:', file);
        break;
      } catch (err) {
        console.log('Échec du chargement depuis:', file);
      }
    }
  });
} catch (e) {
  console.error("Erreur critique lors du chargement:", e);
}
