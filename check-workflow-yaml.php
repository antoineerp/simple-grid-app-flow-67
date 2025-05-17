
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification de la syntaxe YAML</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 1000px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; }
        .warning { color: orange; background-color: #fffbf0; padding: 10px; border-left: 3px solid orange; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vérification de la syntaxe YAML des workflows GitHub</h1>
        
        <div class="card">
            <h2>Résultats de l'analyse</h2>
            
            <?php
            $workflows = [
                '.github/workflows/deploy-unified.yml' => 'Workflow unifié',
                '.github/workflows/deploy-simple.yml' => 'Workflow simple',
                '.github/workflows/deploy.yml' => 'Workflow principal'
            ];
            
            foreach ($workflows as $path => $name) {
                echo "<h3>$name ($path)</h3>";
                
                if (!file_exists($path)) {
                    echo "<div class='warning'>Le fichier n'existe pas.</div>";
                    continue;
                }
                
                $content = file_get_contents($path);
                $lines = explode("\n", $content);
                $problematicLines = [];
                
                // Analyse simple pour détecter les erreurs courantes
                for ($i = 0; $i < count($lines); $i++) {
                    $line = $lines[$i];
                    $lineNumber = $i + 1;
                    
                    // Vérifier les problèmes courants de syntaxe YAML
                    if (strpos($line, "<<") !== false && strpos($line, "EOL") !== false) {
                        // Chercher si la syntaxe de heredoc est correcte
                        if (preg_match('/<<\s*[\'"]?(\w+)[\'"]?/', $line, $matches)) {
                            $eolMarker = $matches[1];
                            
                            // Chercher la fin du bloc heredoc
                            $foundEnd = false;
                            for ($j = $i + 1; $j < count($lines); $j++) {
                                if (trim($lines[$j]) === $eolMarker) {
                                    $foundEnd = true;
                                    break;
                                }
                            }
                            
                            if (!$foundEnd) {
                                $problematicLines[] = [
                                    'line' => $lineNumber,
                                    'content' => $line,
                                    'issue' => "Bloc heredoc ouvert avec '$eolMarker' n'est pas fermé correctement."
                                ];
                            }
                        }
                    }
                    
                    // Vérifier les indentations incohérentes
                    if (preg_match('/^\s+/', $line, $indentMatches)) {
                        $indentation = strlen($indentMatches[0]);
                        if ($indentation % 2 !== 0) {
                            $problematicLines[] = [
                                'line' => $lineNumber,
                                'content' => $line,
                                'issue' => "Indentation irrégulière (utilise $indentation espaces au lieu d'un multiple de 2)"
                            ];
                        }
                    }
                }
                
                if (empty($problematicLines)) {
                    echo "<div class='success'>Aucun problème de syntaxe YAML détecté.</div>";
                } else {
                    echo "<div class='error'>" . count($problematicLines) . " problèmes potentiels détectés:</div>";
                    echo "<ul>";
                    foreach ($problematicLines as $issue) {
                        echo "<li>Ligne {$issue['line']}: {$issue['issue']}<br><code>" . htmlspecialchars($issue['content']) . "</code></li>";
                    }
                    echo "</ul>";
                    
                    if (isset($_POST['fix_' . md5($path)])) {
                        // Tenter de corriger automatiquement
                        $fixedContent = corrigerProblemsHeredoc($content);
                        if ($fixedContent !== $content) {
                            // Sauvegarder l'original
                            copy($path, $path . '.bak.' . time());
                            file_put_contents($path, $fixedContent);
                            echo "<div class='success'>Tentative de correction automatique effectuée. Veuillez rafraîchir la page pour vérifier.</div>";
                        }
                    } else {
                        echo "<form method='post'>";
                        echo "<button type='submit' name='fix_" . md5($path) . "'>Tenter une correction automatique</button>";
                        echo "</form>";
                    }
                }
                
                echo "<details>";
                echo "<summary>Voir le contenu complet</summary>";
                echo "<pre>" . htmlspecialchars($content) . "</pre>";
                echo "</details>";
            }
            
            function corrigerProblemsHeredoc($content) {
                $lines = explode("\n", $content);
                $result = [];
                $inHeredoc = false;
                $heredocMarker = '';
                
                foreach ($lines as $line) {
                    // Détecter le début d'un heredoc
                    if (!$inHeredoc && preg_match('/<<\s*[\'"]?(\w+)[\'"]?/', $line, $matches)) {
                        $heredocMarker = $matches[1];
                        $inHeredoc = true;
                        
                        // Remplacer le heredoc par une syntaxe plus fiable
                        if (strpos($line, "cat >") !== false || strpos($line, "echo") !== false) {
                            // Identifier le fichier de sortie
                            if (preg_match('/cat\s+>\s+([^\s]+)\s+<</', $line, $fileMatches)) {
                                $outputFile = $fileMatches[1];
                                $result[] = "        echo '# Contenu généré automatiquement' > $outputFile";
                            } else {
                                $result[] = $line;
                            }
                        } else {
                            $result[] = $line;
                        }
                    } 
                    // Détecter la fin d'un heredoc
                    elseif ($inHeredoc && trim($line) === $heredocMarker) {
                        $inHeredoc = false;
                        $heredocMarker = '';
                        $result[] = $line;
                    }
                    // Lignes dans le heredoc
                    elseif ($inHeredoc) {
                        // Échapper correctement les lignes dans le heredoc
                        $result[] = $line;
                    }
                    // Lignes normales
                    else {
                        $result[] = $line;
                    }
                }
                
                return implode("\n", $result);
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Conseils pour résoudre les problèmes de syntaxe YAML</h2>
            <ol>
                <li><strong>Indentation</strong>: Utilisez toujours des multiples de 2 espaces pour l'indentation dans les fichiers YAML.</li>
                <li><strong>Heredoc/Multiline strings</strong>: Utilisez des syntaxes plus simples comme la concaténation de lignes avec des commandes <code>echo</code> individuelles.</li>
                <li><strong>Caractères spéciaux</strong>: Échappez correctement les caractères spéciaux ou utilisez des guillemets.</li>
                <li><strong>Espaces</strong>: Faites attention aux espaces autour des deux-points et des tirets.</li>
            </ol>
            
            <h3>Exemple de correction pour un bloc heredoc problématique:</h3>
            <pre>
# Au lieu de:
cat > file.php << EOL
ligne1
ligne2
EOL

# Utilisez:
echo 'ligne1' > file.php
echo 'ligne2' >> file.php
</pre>
        </div>
        
        <p><a href="check-github-workflow.php">Retour à la vérification de workflow</a></p>
    </div>
</body>
</html>
