
// Fichier pont pour la compatibilité avec les scripts de diagnostic
// Ce fichier charge le fichier principal généré par Vite
console.log("Chargement du fichier pont index.js");

// En mode développement, importer depuis src
// En mode production, on utilisera le fichier hashé
try {
  // Tenter d'importer depuis src (développement)
  import('/src/main.tsx')
    .catch(e => {
      console.log("Tentative d'import depuis src échouée, essai avec main.js:", e);
      // Fallback pour la production
      import('/src/main.js').catch(err => {
        console.error("Impossible de charger le fichier JavaScript principal:", err);
        document.body.innerHTML += `
          <div style="color: red; padding: 20px; text-align: center;">
            <h2>Erreur de chargement</h2>
            <p>Impossible de charger le fichier JavaScript principal.</p>
          </div>
        `;
      });
    });
} catch (e) {
  console.error("Erreur lors du chargement du script:", e);
}
