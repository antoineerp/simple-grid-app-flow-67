
<?php
header('Content-Type: text/html; charset=utf-8');

function findLatestAsset($pattern) {
    $files = glob($pattern);
    if (empty($files)) return null;
    
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    
    return $files[0];
}

// Find the latest JS and CSS files in the assets directory
$jsFile = findLatestAsset('./assets/main-*.js') ?: findLatestAsset('./assets/*.js');
$cssFile = findLatestAsset('./assets/index-*.css') ?: findLatestAsset('./assets/*.css');

// Alternative search in dist directory if assets are not found
if (!$jsFile) {
    $jsFile = findLatestAsset('./dist/assets/main-*.js') ?: findLatestAsset('./dist/assets/*.js');
    if ($jsFile) {
        // Create assets directory if it doesn't exist
        if (!is_dir('./assets')) {
            mkdir('./assets', 0755, true);
        }
        // Copy file to assets directory
        $newJsFile = './assets/' . basename($jsFile);
        copy($jsFile, $newJsFile);
        $jsFile = $newJsFile;
        echo "JS file copied from dist to assets: " . basename($jsFile) . "<br>";
    }
}

if (!$cssFile) {
    $cssFile = findLatestAsset('./dist/assets/index-*.css') ?: findLatestAsset('./dist/assets/*.css');
    if ($cssFile) {
        // Create assets directory if it doesn't exist
        if (!is_dir('./assets')) {
            mkdir('./assets', 0755, true);
        }
        // Copy file to assets directory
        $newCssFile = './assets/' . basename($cssFile);
        copy($cssFile, $newCssFile);
        $cssFile = $newCssFile;
        echo "CSS file copied from dist to assets: " . basename($cssFile) . "<br>";
    }
}

// Path to index.html
$indexPath = './index.html';

// Check if index.html exists
if (!file_exists($indexPath)) {
    die("Error: index.html file not found.");
}

// Create a backup of the original file
copy($indexPath, $indexPath . '.bak');

// Get the content of index.html
$content = file_get_contents($indexPath);

$updated = false;

// Replace JavaScript reference
if ($jsFile) {
    $jsPath = str_replace('./', '/', $jsFile);
    echo "Found JavaScript file: " . $jsPath . "<br>";
    
    // Try both src="..." and src='...' patterns
    $patterns = [
        '/<script[^>]*src=["\'](\.\/)?\/?src\/[^"\']*\.tsx?["\'][^>]*>/',
        '/<script[^>]*src=["\'](\.\/)?\/?src\/[^"\']*\.js["\'][^>]*>/',
        '/<script[^>]*src=["\'][^"\']*main[^"\']*\.js["\'][^>]*>/' // This will match any main*.js
    ];
    
    foreach ($patterns as $pattern) {
        $newContent = preg_replace(
            $pattern,
            '<script type="module" src="' . $jsPath . '">',
            $content
        );
        
        if ($newContent !== $content) {
            $content = $newContent;
            $updated = true;
            echo "Updated JavaScript reference to: " . $jsPath . "<br>";
            break;
        }
    }
    
    // If no replacement was made but we found a JS file, try to add it
    if (!$updated && $jsFile) {
        // Check if there's no script tag with our JS file
        if (!strpos($content, basename($jsFile))) {
            $content = preg_replace(
                '/<\/head>/',
                '  <script type="module" src="' . $jsPath . '"></script>' . PHP_EOL . '</head>',
                $content
            );
            $updated = true;
            echo "Added new JavaScript reference to: " . $jsPath . "<br>";
        }
    }
}

// Replace CSS reference
if ($cssFile) {
    $cssPath = str_replace('./', '/', $cssFile);
    echo "Found CSS file: " . $cssPath . "<br>";
    
    // Try both href="..." and href='...' patterns
    $patterns = [
        '/<link[^>]*href=["\'](\.\/)?\/?src\/[^"\']*\.css["\'][^>]*>/',
        '/<link[^>]*href=["\'][^"\']*index[^"\']*\.css["\'][^>]*>/' // This will match any index*.css
    ];
    
    foreach ($patterns as $pattern) {
        $newContent = preg_replace(
            $pattern,
            '<link rel="stylesheet" href="' . $cssPath . '">',
            $content
        );
        
        if ($newContent !== $content) {
            $content = $newContent;
            $updated = true;
            echo "Updated CSS reference to: " . $cssPath . "<br>";
            break;
        }
    }
    
    // If no replacement was made but we found a CSS file, try to add it
    if (!$updated && $cssFile) {
        // Check if there's no link tag with our CSS file
        if (!strpos($content, basename($cssFile))) {
            $content = preg_replace(
                '/<\/head>/',
                '  <link rel="stylesheet" href="' . $cssPath . '">' . PHP_EOL . '</head>',
                $content
            );
            $updated = true;
            echo "Added new CSS reference to: " . $cssPath . "<br>";
        }
    }
}

// Ensure the GPT Engineer script tag is present
if (!strpos($content, 'cdn.gpteng.co/gptengineer.js')) {
    $content = preg_replace(
        '/<\/body>/',
        '  <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>' . PHP_EOL . '</body>',
        $content
    );
    $updated = true;
    echo "Added GPT Engineer script tag<br>";
}

// Save the updated content back to index.html
if ($updated) {
    file_put_contents($indexPath, $content);
    echo "<br>Successfully updated index.html with correct asset references!<br>";
    echo "A backup of the original file has been saved as index.html.bak<br>";
} else {
    echo "<br>No updates needed or no asset files found.<br>";
    if (!$jsFile) echo "No JavaScript file found in assets directory.<br>";
    if (!$cssFile) echo "No CSS file found in assets directory.<br>";
}

// Display new content for verification
echo "<br><strong>Updated index.html content:</strong><br>";
echo "<pre>" . htmlspecialchars($content) . "</pre>";

// Check if assets directory has a .htaccess file to ensure proper MIME types
$assetsHtaccess = './assets/.htaccess';
if (!file_exists($assetsHtaccess)) {
    $htaccessContent = <<<EOT
# Définition des types MIME pour les assets
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css

# Force les types MIME corrects
<FilesMatch "\.js$">
    ForceType application/javascript
    Header set Content-Type "application/javascript; charset=utf-8"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

<FilesMatch "\.css$">
    ForceType text/css
    Header set Content-Type "text/css; charset=utf-8"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>
EOT;

    // Create assets directory if it doesn't exist
    if (!is_dir('./assets')) {
        mkdir('./assets', 0755, true);
    }

    file_put_contents($assetsHtaccess, $htaccessContent);
    echo "<br>Created .htaccess file in assets directory to ensure proper MIME types.<br>";
}
?>

<p><a href="test-assets-routes.php">Retour à la vérification des routes</a></p>
