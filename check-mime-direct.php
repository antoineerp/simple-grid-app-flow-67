
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Direct des JavaScript</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; }
    </style>
</head>
<body>
    <h1>Test Direct de Chargement JavaScript</h1>
    
    <h2>1. Test JavaScript basique inline</h2>
    <div id="test1">Test en cours...</div>
    <script>
        document.getElementById('test1').innerHTML = '<span class="success">JavaScript inline fonctionne!</span>';
    </script>
    
    <h2>2. Test JavaScript externe (non-module)</h2>
    <div id="test2">Test en cours...</div>
    <script src="assets/check-mime.js"></script>
    <script>
        setTimeout(function() {
            if (typeof window.checkMimeTypeStatus === 'function') {
                document.getElementById('test2').innerHTML = '<span class="success">Script externe chargé avec succès!</span>';
            } else {
                document.getElementById('test2').innerHTML = '<span class="error">Échec du chargement du script externe!</span>';
            }
        }, 500);
    </script>
    
    <h2>3. Test JavaScript modules</h2>
    <div id="test3">Test en cours...</div>
    <script type="module">
        try {
            import { checkMimeTypeLoading } from './assets/check-mime.js';
            document.getElementById('test3').innerHTML = '<span class="success">Module JavaScript chargé avec succès!</span>';
        } catch (e) {
            document.getElementById('test3').innerHTML = '<span class="error">Échec du chargement du module! Erreur: ' + e.message + '</span>';
            console.error(e);
        }
    </script>
    
    <h2>En-têtes HTTP pour assets/check-mime.js</h2>
    <pre id="headers">Vérification des en-têtes...</pre>
    
    <script>
    fetch('assets/check-mime.js')
        .then(response => {
            const headers = Array.from(response.headers.entries())
                .map(([name, value]) => name + ': ' + value)
                .join('\n');
            document.getElementById('headers').textContent = headers;
        })
        .catch(error => {
            document.getElementById('headers').textContent = 'Erreur: ' + error.message;
        });
    </script>
</body>
</html>
