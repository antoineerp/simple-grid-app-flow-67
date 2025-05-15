
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Validateur de fichier YAML</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 1000px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { 
            background-color: #4CAF50; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 16px; 
            text-decoration: none;
            display: inline-block;
            margin-right: 10px;
        }
        .back { background-color: #607D8B; }
        .success { color: green; padding: 10px; background-color: #f0fff0; border-left: 4px solid green; }
        .error { color: red; padding: 10px; background-color: #fff0f0; border-left: 4px solid red; }
        .warning { color: orange; padding: 10px; background-color: #fffaf0; border-left: 4px solid orange; }
        .info { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #17a2b8; margin: 10px 0; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
        code { font-family: monospace; background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
        .highlight { background-color: yellow; }
        .line-numbers { 
            user-select: none;
            counter-reset: line;
            float: left;
            margin-right: 10px;
            color: #999;
            text-align: right;
            padding-right: 10px;
            border-right: 1px solid #ddd;
        }
        .line-number::before {
            counter-increment: line;
            content: counter(line);
            display: block;
        }
        .code-block {
            display: flex;
        }
        .code-content {
            flex-grow: 1;
            white-space: pre;
            overflow-x: auto;
            font-family: monospace;
        }
        .highlighted-line {
            background-color: #ffdddd;
            display: inline-block;
            width: 100%;
        }
        .form-group { margin-bottom: 15px; }
        .tab {
            overflow: hidden;
            border: 1px solid #ccc;
            background-color: #f1f1f1;
            margin-bottom: 20px;
        }
        .tab button {
            background-color: inherit;
            float: left;
            border: none;
            outline: none;
            cursor: pointer;
            padding: 14px 16px;
            transition: 0.3s;
        }
        .tab button:hover {
            background-color: #ddd;
        }
        .tab button.active {
            background-color: #4CAF50;
            color: white;
        }
        .tabcontent {
            display: none;
            padding: 6px 12px;
            border: 1px solid #ccc;
            border-top: none;
            animation: fadeEffect 1s;
        }
        @keyframes fadeEffect {
            from {opacity: 0;}
            to {opacity: 1;}
        }
        textarea {
            width: 100%;
            height: 300px;
            padding: 8px;
            box-sizing: border-box;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
        }
        .tips-list li {
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Validateur de fichiers YAML pour GitHub Actions</h1>
        
        <div class="tab">
            <button class="tablinks active" onclick="openTab(event, 'Validator')">Validateur YAML</button>
            <button class="tablinks" onclick="openTab(event, 'Tips')">Conseils YAML</button>
            <button class="tablinks" onclick="openTab(event, 'Trigger')">Déclencher Workflow</button>
        </div>
        
        <div id="Validator" class="tabcontent" style="display: block;">
            <div class="card">
                <h2>Valider la syntaxe YAML</h2>
                
                <?php
                // Détecter si nous avons un fichier YAML à analyser
                $yaml_content = "";
                $yaml_error = "";
                $yaml_success = "";
                
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_yaml'])) {
                    // Récupérer le contenu YAML
                    if (isset($_POST['yaml_content']) && !empty($_POST['yaml_content'])) {
                        $yaml_content = $_POST['yaml_content'];
                        
                        // Valider la syntaxe YAML
                        if (function_exists('yaml_parse')) {
                            try {
                                $parsed_yaml = @yaml_parse($yaml_content);
                                if ($parsed_yaml !== false) {
                                    $yaml_success = "La syntaxe YAML est valide!";
                                } else {
                                    $yaml_error = "Erreur de syntaxe YAML détectée. Vérifiez l'indentation et la structure.";
                                }
                            } catch (Exception $e) {
                                $yaml_error = "Erreur lors de l'analyse YAML: " . $e->getMessage();
                            }
                        } else {
                            // Analyse alternative si l'extension YAML n'est pas disponible
                            // Vérification basique de la structure et de l'indentation
                            $lines = explode("\n", $yaml_content);
                            $errors = [];
                            $current_indent = 0;
                            $line_number = 0;
                            
                            foreach ($lines as $line) {
                                $line_number++;
                                
                                // Ignorer les lignes vides ou les commentaires
                                if (trim($line) === '' || strpos(trim($line), '#') === 0) {
                                    continue;
                                }
                                
                                // Vérifier la présence de tabulations
                                if (strpos($line, "\t") !== false) {
                                    $errors[] = "Ligne $line_number: Tabulation détectée. Utilisez des espaces à la place.";
                                }
                                
                                // Vérifier les caractères spéciaux mal échappés
                                $special_chars = [':', '-', '[', ']', '{', '}'];
                                foreach ($special_chars as $char) {
                                    if (substr(trim($line), -1) === $char || (strpos($line, $char) !== false && strpos($line, " $char ") === false && strpos($line, "$char ") === false && strpos($line, " $char") === false)) {
                                        // C'est une heuristique très basique et peut générer des faux positifs
                                        if (!strpos($line, "<<") && !strpos($line, ">>") && !strpos(trim($line), "- name:") && substr(trim($line), 0, 1) !== "-") {
                                            $errors[] = "Ligne $line_number: Caractère '$char' potentiellement mal formaté.";
                                        }
                                    }
                                }
                                
                                // Vérifier la cohérence de l'indentation
                                $indent = strlen($line) - strlen(ltrim($line));
                                
                                // Détecter les problèmes d'indentation
                                if ($indent % 2 !== 0) {
                                    $errors[] = "Ligne $line_number: L'indentation ($indent espaces) n'est pas un multiple de 2.";
                                }
                            }
                            
                            if (!empty($errors)) {
                                $yaml_error = implode("<br>", $errors);
                            } else {
                                $yaml_success = "Aucune erreur évidente détectée dans la syntaxe YAML. Notez que cette vérification est limitée sans l'extension PHP YAML.";
                            }
                        }
                    } else {
                        $yaml_error = "Veuillez fournir un contenu YAML à valider.";
                    }
                } else if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['check_workflow'])) {
                    // Vérifier le fichier de workflow GitHub
                    $workflow_file = './.github/workflows/deploy.yml';
                    
                    if (file_exists($workflow_file)) {
                        $yaml_content = file_get_contents($workflow_file);
                        
                        if (function_exists('yaml_parse')) {
                            try {
                                $parsed_yaml = @yaml_parse($yaml_content);
                                if ($parsed_yaml !== false) {
                                    $yaml_success = "Le fichier de workflow GitHub est valide!";
                                } else {
                                    $yaml_error = "Erreur de syntaxe YAML détectée dans votre fichier de workflow GitHub. Vérifiez l'indentation et la structure.";
                                }
                            } catch (Exception $e) {
                                $yaml_error = "Erreur lors de l'analyse du fichier de workflow GitHub: " . $e->getMessage();
                            }
                        } else {
                            // Message informatif si l'extension YAML n'est pas disponible
                            $yaml_content = file_get_contents($workflow_file);
                            $yaml_success = "Fichier de workflow chargé, mais l'extension PHP YAML n'est pas disponible pour une validation complète.";
                        }
                    } else {
                        $yaml_error = "Fichier de workflow '.github/workflows/deploy.yml' non trouvé.";
                    }
                }
                ?>
                
                <?php if ($yaml_error): ?>
                <div class="error"><?php echo $yaml_error; ?></div>
                <?php endif; ?>
                
                <?php if ($yaml_success): ?>
                <div class="success"><?php echo $yaml_success; ?></div>
                <?php endif; ?>
                
                <form method="post">
                    <div class="form-group">
                        <label for="yaml_content">Collez votre code YAML ici :</label>
                        <textarea id="yaml_content" name="yaml_content" placeholder="Collez votre YAML ici..."><?php echo htmlspecialchars($yaml_content); ?></textarea>
                    </div>
                    
                    <div class="form-group">
                        <button type="submit" name="submit_yaml" class="button">Valider le YAML</button>
                        <button type="submit" name="check_workflow" class="button">Charger le workflow GitHub</button>
                    </div>
                </form>
                
                <?php if (!function_exists('yaml_parse')): ?>
                <div class="warning">
                    <p><strong>Note:</strong> L'extension PHP YAML n'est pas installée sur ce serveur. La validation est limitée à des vérifications basiques d'indentation et de structure.</p>
                    <p>Pour une validation plus précise, utilisez un service en ligne comme <a href="https://www.yamllint.com/" target="_blank">yamllint.com</a> ou <a href="http://www.yamllint.org/" target="_blank">yamllint.org</a>.</p>
                </div>
                <?php endif; ?>
            </div>
            
            <?php if (!empty($yaml_content)): ?>
            <div class="card">
                <h2>Analyse ligne par ligne</h2>
                
                <div class="code-block">
                    <div class="line-numbers">
                        <?php
                        $lines = explode("\n", $yaml_content);
                        foreach ($lines as $i => $line) {
                            echo '<div class="line-number"></div>';
                        }
                        ?>
                    </div>
                    <div class="code-content">
                        <?php
                        $lines = explode("\n", $yaml_content);
                        foreach ($lines as $i => $line) {
                            $line_num = $i + 1;
                            $class = "";
                            if (strpos($yaml_error, "Ligne $line_num:") !== false) {
                                $class = "highlighted-line";
                            }
                            echo '<div class="' . $class . '">' . htmlspecialchars($line) . '</div>';
                        }
                        ?>
                    </div>
                </div>
            </div>
            <?php endif; ?>
            
            <div class="card">
                <h2>Vérification spécifique du problème de here-doc (EOL)</h2>
                <p>Cette section analyse spécifiquement les blocs <code>cat &lt;&lt; 'EOL'</code> dans votre YAML pour détecter d'éventuels problèmes:</p>
                
                <?php
                if (!empty($yaml_content)) {
                    $lines = explode("\n", $yaml_content);
                    $in_eol_block = false;
                    $eol_marker = "";
                    $eol_start_line = 0;
                    $eol_problems = [];
                    
                    foreach ($lines as $i => $line) {
                        $line_num = $i + 1;
                        $trimmed_line = trim($line);
                        
                        // Détection du début d'un bloc EOL
                        if (!$in_eol_block && preg_match('/cat\s+>\s+.*<<\s*[\'"]?(EOL|EOF)[\'"]?/', $trimmed_line)) {
                            $in_eol_block = true;
                            $eol_start_line = $line_num;
                            
                            // Extraire le marqueur EOL
                            if (preg_match('/<<\s*[\'"]?(EOL|EOF)[\'"]?/', $trimmed_line, $matches)) {
                                $eol_marker = trim(str_replace(['<<', "'", '"'], '', $matches[0]));
                            }
                            
                            // Vérifier si le marqueur EOL est sur sa propre ligne
                            if (preg_match('/<<\s*[\'"]?(EOL|EOF)[\'"]?\s+/', $trimmed_line)) {
                                $eol_problems[] = "Ligne $line_num: Le marqueur de début '$eol_marker' devrait idéalement être sur sa propre ligne.";
                            }
                        } 
                        // Détection de la fin d'un bloc EOL
                        else if ($in_eol_block && $trimmed_line === $eol_marker) {
                            $in_eol_block = false;
                            
                            // Vérifier l'indentation du marqueur de fin
                            $indent = strlen($line) - strlen(ltrim($line));
                            if ($indent > 0) {
                                $eol_problems[] = "Ligne $line_num: Le marqueur de fin '$eol_marker' ne doit pas être indenté.";
                            }
                        }
                    }
                    
                    if ($in_eol_block) {
                        $eol_problems[] = "ERREUR CRITIQUE: Bloc '$eol_marker' commencé à la ligne $eol_start_line mais jamais terminé.";
                    }
                    
                    if (!empty($eol_problems)) {
                        echo '<div class="error">';
                        echo '<strong>Problèmes détectés dans les blocs here-doc:</strong><br>';
                        echo implode('<br>', $eol_problems);
                        echo '</div>';
                    } else if (strpos($yaml_content, "<<") !== false) {
                        echo '<div class="success">Aucun problème évident détecté dans les blocs here-doc.</div>';
                    } else {
                        echo '<div class="info">Aucun bloc here-doc (EOL) détecté dans le code YAML analysé.</div>';
                    }
                }
                ?>
                
                <div class="info">
                    <h3>À propos des blocs here-doc en YAML</h3>
                    <p>Les blocs here-doc (comme <code>cat &lt;&lt; EOL</code>) dans les scripts shell inclus dans le YAML doivent suivre ces règles:</p>
                    <ol>
                        <li>Le marqueur de fermeture (EOL) doit être exactement le même que le marqueur d'ouverture.</li>
                        <li>Le marqueur de fermeture doit être seul sur sa ligne sans aucune indentation.</li>
                        <li>Le contenu à l'intérieur du here-doc est préservé tel quel, y compris l'indentation.</li>
                    </ol>
                    <p><strong>Exemple correct:</strong></p>
                    <pre>
cat &lt;&lt; 'EOL' > fichier.txt
Contenu
  avec indentation
    préservée
EOL</pre>
                </div>
            </div>
            
            <a href="deploy-on-infomaniak.php" class="button back">Retour à la page de déploiement</a>
        </div>
        
        <div id="Tips" class="tabcontent">
            <div class="card">
                <h2>Conseils pour résoudre les problèmes YAML</h2>
                
                <ul class="tips-list">
                    <li>
                        <strong>Indentation:</strong> YAML est sensible à l'indentation. Utilisez toujours 2 espaces pour l'indentation, jamais de tabulations.
                    </li>
                    <li>
                        <strong>Chaînes de caractères:</strong> Les chaînes contenant des caractères spéciaux devraient être entre guillemets simples ou doubles.
                    </li>
                    <li>
                        <strong>Blocs multilignes:</strong> 
                        <ul>
                            <li>Utilisez <code>|</code> pour préserver les sauts de ligne</li>
                            <li>Utilisez <code>&gt;</code> pour transformer les sauts de ligne en espaces</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Blocs here-doc (EOL):</strong> 
                        <ul>
                            <li>Le marqueur de fin (EOL) doit être seul sur sa ligne</li>
                            <li>Le marqueur de fin ne doit PAS être indenté</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Guillemets:</strong> 
                        <ul>
                            <li>Simples (<code>'</code>) : Interprètent tout littéralement</li>
                            <li>Doubles (<code>"</code>) : Permettent les séquences d'échappement</li>
                        </ul>
                    </li>
                </ul>
                
                <h3>Solution pour les blocs here-doc dans GitHub Actions</h3>
                
                <p>Si vous rencontrez des problèmes persistants avec les blocs here-doc (EOL), voici une alternative:</p>
                
                <div class="info">
                    <h4>Option 1: Utiliser l'écriture ligne par ligne</h4>
                    <pre>
- name: Créer config/env.php
  run: |
    mkdir -p deploy/api/config/
    echo '&lt;?php' > deploy/api/config/env.php
    echo '// Configuration des variables d'environnement' >> deploy/api/config/env.php
    echo 'define("DB_HOST", "p71x6d.myd.infomaniak.com");' >> deploy/api/config/env.php
    echo 'define("DB_NAME", "p71x6d_richard");' >> deploy/api/config/env.php
    # etc.</pre>
                    
                    <h4>Option 2: Utiliser une variable d'environnement avec écho direct</h4>
                    <pre>
- name: Créer config/env.php
  env:
    ENV_PHP_CONTENT: |
      &lt;?php
      // Configuration des variables d'environnement
      define('DB_HOST', 'p71x6d.myd.infomaniak.com');
      define('DB_NAME', 'p71x6d_richard');
      define('DB_USER', 'p71x6d_richard');
      define('DB_PASS', 'Trottinette43!');
  run: |
    mkdir -p deploy/api/config/
    echo "$ENV_PHP_CONTENT" > deploy/api/config/env.php</pre>
                </div>
            </div>
        </div>
        
        <div id="Trigger" class="tabcontent">
            <div class="card">
                <h2>Déclencher le workflow GitHub manuellement</h2>
                
                <p>Si vous ne voyez pas le bouton "Run workflow" dans l'interface GitHub Actions, vous pouvez utiliser l'une des méthodes ci-dessous pour déclencher votre workflow:</p>
                
                <h3>1. Via l'API GitHub (curl)</h3>
                <pre>
curl -X POST \
-H "Accept: application/vnd.github.v3+json" \
-H "Authorization: token VOTRE_TOKEN_GITHUB" \
https://api.github.com/repos/antoineerp/simple-grid-app-flow-67/actions/workflows/deploy.yml/dispatches \
-d '{"ref":"main"}'</pre>

                <div class="form-group">
                    <a href="trigger-github-workflow.php" class="button" target="_blank">Ouvrir l'outil de déclenchement</a>
                </div>
                
                <h3>2. Via un commit vide</h3>
                <pre>
git commit --allow-empty -m "Force deployment"
git push origin main</pre>

                <h3>3. Passer à un format YAML plus simple</h3>
                <p>Si le problème persiste, vous pourriez vouloir simplifier la structure de votre workflow. Voici un exemple pour le bloc problématique:</p>
                
                <pre>
- name: Créer env.php
  run: |
    mkdir -p deploy/api/config/
    echo '&lt;?php
// Configuration des variables d'environnement pour Infomaniak
define("DB_HOST", "p71x6d.myd.infomaniak.com");
define("DB_NAME", "p71x6d_richard");
define("DB_USER", "p71x6d_richard");
define("DB_PASS", "Trottinette43!");
define("API_BASE_URL", "/api");
define("APP_ENV", "production");

function get_env($key, $default = null) {
    $const_name = strtoupper($key);
    if (defined($const_name)) {
        return constant($const_name);
    }
    return $default;
}
?>' > deploy/api/config/env.php</pre>
                
                <div class="info">
                    <p><strong>Note:</strong> YAML est extrêmement sensible au formatage. Si les solutions ci-dessus ne fonctionnent pas, envisagez d'utiliser un outil de validation YAML en ligne professionnel.</p>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function openTab(evt, tabName) {
            var i, tabcontent, tablinks;
            
            // Masquer tous les contenus d'onglets
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            
            // Désactiver tous les boutons d'onglets
            tablinks = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            
            // Afficher l'onglet actuel et activer le bouton
            document.getElementById(tabName).style.display = "block";
            evt.currentTarget.className += " active";
        }
    </script>
</body>
</html>
