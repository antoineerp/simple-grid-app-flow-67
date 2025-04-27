
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
    $newContent = preg_replace(
        '/<script[^>]*src=["\'](\.\/|\/)?src\/[^"\']*\.tsx?["\'][^>]*>/',
        '<script type="module" src="' . $jsPath . '">',
        $content
    );
    
    if ($newContent !== $content) {
        $content = $newContent;
        $updated = true;
        echo "Updated JavaScript reference to: " . $jsPath . "<br>";
    }
}

// Replace CSS reference
if ($cssFile) {
    $cssPath = str_replace('./', '/', $cssFile);
    $newContent = preg_replace(
        '/<link[^>]*href=["\'](\.\/|\/)?src\/[^"\']*\.css["\'][^>]*>/',
        '<link rel="stylesheet" href="' . $cssPath . '">',
        $content
    );
    
    if ($newContent !== $content) {
        $content = $newContent;
        $updated = true;
        echo "Updated CSS reference to: " . $cssPath . "<br>";
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
?>
