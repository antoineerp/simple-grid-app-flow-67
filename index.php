
<?php
// Point d'entrée minimaliste
header('Content-Type: text/html; charset=utf-8');

// Servir le contenu HTML
echo '<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FormaCert</title>
    <link rel="icon" href="/lovable-uploads/formacert-logo.png" type="image/png">
    
    <script>
    // Auto-détection du fichier CSS (index.css ou main.css)
    function loadCSS() {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      
      // Essayer d\'abord index.css
      var xhr = new XMLHttpRequest();
      xhr.open("HEAD", "/dist/assets/index.css", true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            link.href = "/dist/assets/index.css";
          } else {
            // Fallback à main.css
            link.href = "/dist/assets/main.css";
          }
          document.head.appendChild(link);
        }
      };
      xhr.send();
    }
    
    window.addEventListener("DOMContentLoaded", loadCSS);
    </script>
</head>
<body>
    <div id="root"></div>
    
    <!-- Script Lovable -->
    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
    
    <!-- Script principal avec détection auto -->
    <script>
    // Auto-détection du fichier JS (index.js ou main.js)
    function loadScript() {
      var script = document.createElement("script");
      script.type = "module";
      
      // Essayer d\'abord index.js
      var xhr = new XMLHttpRequest();
      xhr.open("HEAD", "/dist/assets/index.js", true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            script.src = "/dist/assets/index.js";
          } else {
            // Fallback à main.js
            script.src = "/dist/assets/main.js";
          }
          document.body.appendChild(script);
        }
      };
      xhr.send();
    }
    
    window.addEventListener("DOMContentLoaded", loadScript);
    
    // Afficher un message d\'erreur après 5 secondes si l\'application n\'a pas chargé
    setTimeout(function() {
      if (document.getElementById("root").childElementCount === 0) {
        document.getElementById("root").innerHTML = `
          <div style="max-width:800px; margin:50px auto; padding:20px; font-family:sans-serif; line-height:1.5; color:#333; background:#f9f9f9; border:1px solid #ddd; border-radius:8px;">
            <h1 style="color:#d33;">Erreur de chargement de l\'application</h1>
            <p>L\'application n\'a pas pu être chargée correctement. Cela peut être dû à un problème avec les fichiers statiques.</p>
            <h3>Diagnostics recommandés:</h3>
            <ul>
              <li>Visitez <a href="/assets-check.php" style="color:#0066cc;">la page de diagnostic des assets</a></li>
              <li>Vérifiez que le dossier <code>dist/assets</code> contient les fichiers <code>index.js</code> et <code>index.css</code></li>
              <li>Vérifiez si le serveur a besoin d\'exécuter <code>npm run build</code></li>
            </ul>
          </div>
        `;
      }
    }, 5000);
    </script>
</body>
</html>';
?>
