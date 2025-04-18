
// Script de secours pour les navigateurs incompatibles
(function() {
  console.log('Chargement du script de compatibilité...');

  // Vérifier si le DOM est prêt
  function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(fn, 1);
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  // Fonction qui sera exécutée une fois le DOM prêt
  domReady(function() {
    try {
      const rootElement = document.getElementById('root');
      
      if (!rootElement) {
        console.error('Élément racine introuvable!');
        return;
      }

      // Vérifier la compatibilité du navigateur
      const browserName = detectBrowser();
      console.log('Navigateur détecté:', browserName);
      
      if (!isCompatible()) {
        rootElement.innerHTML = `
          <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
            <h1>Navigateur non supporté</h1>
            <p>Votre navigateur (${browserName}) ne semble pas compatible avec cette application.</p>
            <p>Veuillez utiliser un navigateur plus récent comme Chrome, Firefox, Edge ou Safari.</p>
          </div>
        `;
        return;
      }

      // Si nous arrivons ici, c'est que le script principal n'a pas pu être chargé mais le navigateur est compatible
      rootElement.innerHTML = `
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1>Erreur de chargement</h1>
          <p>L'application n'a pas pu être chargée correctement.</p>
          <p>Veuillez vérifier votre connexion Internet et réessayer.</p>
          <button onclick="window.location.reload()" style="padding:10px 20px; margin-top:20px; cursor:pointer;">
            Réessayer
          </button>
        </div>
      `;
    } catch (error) {
      console.error('Erreur dans le script de secours:', error);
      if (document.getElementById('root')) {
        document.getElementById('root').innerHTML = `
          <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
            <h1>Erreur critique</h1>
            <p>Une erreur est survenue lors du chargement de l'application.</p>
            <p>Erreur: ${error.message || 'Erreur inconnue'}</p>
            <button onclick="window.location.reload()" style="padding:10px 20px; margin-top:20px; cursor:pointer;">
              Réessayer
            </button>
          </div>
        `;
      }
    }
  });

  // Détecter le navigateur
  function detectBrowser() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.match(/chrome|chromium|crios/i)) {
      return "Chrome";
    } else if (userAgent.match(/firefox|fxios/i)) {
      return "Firefox";
    } else if (userAgent.match(/safari/i)) {
      return "Safari";
    } else if (userAgent.match(/opr\//i)) {
      return "Opera";
    } else if (userAgent.match(/edg/i)) {
      return "Edge";
    } else if (userAgent.match(/android/i)) {
      return "Android Browser";
    } else if (userAgent.match(/iphone|ipad/i)) {
      return "iOS Browser";
    } else {
      return "Navigateur inconnu";
    }
  }

  // Vérifier si le navigateur est compatible
  function isCompatible() {
    // Vérifier les fonctionnalités de base
    const hasPromise = typeof Promise !== 'undefined';
    const hasLocalStorage = (function() {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch (e) {
        return false;
      }
    })();
    
    return hasPromise && hasLocalStorage;
  }
})();
