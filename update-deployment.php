
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Deployment Update Tools</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .tool-box { 
            border: 1px solid #ddd; 
            padding: 15px; 
            margin-bottom: 20px; 
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        .button { 
            background: #4CAF50; 
            color: white; 
            padding: 10px 15px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 16px;
        }
        .button:hover { background-color: #45a049; }
        h1, h2 { color: #333; }
        .info { padding: 10px; background-color: #e7f3fe; border-left: 6px solid #2196F3; margin-bottom: 15px; }
    </style>
</head>
<body>
    <h1>Deployment Update Tools</h1>
    
    <div class="info">
        <p>This page provides access to deployment and maintenance tools. Use these tools to fix issues with your application after deployment.</p>
    </div>
    
    <div class="tool-box">
        <h2>Fix Asset References</h2>
        <p>Use this tool to update index.html with the correct references to your JavaScript and CSS files.</p>
        <p>This is useful when you see hashed files in the assets directory that aren't referenced in index.html.</p>
        <a href="fix-asset-references.php" class="button">Fix Asset References</a>
    </div>
    
    <div class="tool-box">
        <h2>Verify Files</h2>
        <p>Check which files are available in the assets directory and whether they're referenced correctly.</p>
        <a href="verify-hash-files.php" class="button">Verify Hashed Files</a>
    </div>
    
    <div class="tool-box">
        <h2>Fix Index HTML</h2>
        <p>Comprehensive tool to fix index.html including replacing src references with compiled assets.</p>
        <a href="fix-index-html.php" class="button">Fix Index HTML</a>
    </div>
    
    <div class="tool-box">
        <h2>Manual Deployment</h2>
        <p>Trigger a manual deployment from GitHub if needed.</p>
        <a href="trigger-github-workflow.php" class="button">Manual Deployment</a>
    </div>
    
    <div class="tool-box">
        <h2>Return to Application</h2>
        <p>Go back to the main application.</p>
        <a href="/" class="button" style="background-color: #2196F3;">Go to Application</a>
    </div>
</body>
</html>
