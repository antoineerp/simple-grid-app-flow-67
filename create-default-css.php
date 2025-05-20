
<?php
header('Content-Type: text/html; charset=utf-8');

// Contenu CSS par défaut pour l'application
$default_css_content = <<<CSS
/* CSS par défaut pour l'application FormaCert */
:root {
  --primary-color: #0056b3;
  --secondary-color: #f8f9fa;
  --text-color: #212529;
  --border-color: #dee2e6;
  --hover-color: #0069d9;
  --app-blue: #0056b3;
  --app-light-blue: #e6f2ff;
}

body {
  font-family: sans-serif;
  color: var(--text-color);
  margin: 0;
  padding: 0;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Styles de base pour la navigation */
.sidebar {
  background-color: var(--secondary-color);
  padding: 1rem;
  border-right: 1px solid var(--border-color);
}

.main-content {
  padding: 1rem;
}

/* Styles de base pour les tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

th, td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

th {
  text-align: left;
  font-weight: bold;
}

/* Styles de base pour les boutons */
.btn {
  display: inline-block;
  font-weight: 400;
  text-align: center;
  vertical-align: middle;
  user-select: none;
  background-color: transparent;
  border: 1px solid transparent;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  transition: all 0.15s ease-in-out;
  cursor: pointer;
}

.btn-primary {
  color: #fff;
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-primary:hover {
  background-color: var(--hover-color);
  border-color: var(--hover-color);
}

/* Styles spécifiques à FormaCert */
.active-sidebar-item {
  background-color: var(--app-light-blue);
  border-left: 4px solid var(--app-blue);
  color: var(--app-blue);
  font-weight: 600;
}

/* Styles de formulaire */
input, select, textarea {
  display: block;
  width: 100%;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-color);
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  transition: border-color 0.15s ease-in-out;
}

/* Responsive Layout */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
}
CSS;

// Vérifier si le dossier assets existe
if (!is_dir('./assets')) {
    // Créer le dossier
    if (mkdir('./assets', 0755, true)) {
        echo "<p>Dossier assets créé avec succès.</p>";
    } else {
        echo "<p>Impossible de créer le dossier assets.</p>";
        exit;
    }
}

// Chemin du fichier CSS
$css_path = './assets/main.css';

// Écrire le contenu CSS dans le fichier
if (file_put_contents($css_path, $default_css_content)) {
    echo "<h1>Fichier CSS par défaut créé</h1>";
    echo "<p>Le fichier <strong>$css_path</strong> a été créé avec succès.</p>";
    echo "<p>Ce fichier CSS contient des styles de base pour l'application FormaCert.</p>";
    echo "<p>Vous pouvez maintenant utiliser <a href='fix-missing-references.php'>fix-missing-references.php</a> pour mettre à jour index.html.</p>";
} else {
    echo "<h1>Erreur</h1>";
    echo "<p>Impossible de créer le fichier CSS.</p>";
}
?>
