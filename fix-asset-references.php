
<?php
header('Content-Type: text/html; charset=utf-8');

// Function to find main JavaScript and CSS files with hashes
function findMainAssets($assetsDir = './assets') {
    $result = [
        'js' => null,
        'css' => null,
        'react' => null,
        'chunks' => []
    ];
    
    // Check if directory exists
    if (!is_dir($assetsDir)) {
        return $result;
    }
    
    // Look for the main JS file
    $js_files = glob("$assetsDir/main*.js");
    if (!empty($js_files)) {
        usort($js_files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        $result['js'] = '/assets/' . basename($js_files[0]);
    }
    
    // Look for CSS files
    $css_files = glob("$assetsDir/*.css");
    if (!empty($css_files)) {
        usort($css_files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        $result['css'] = '/assets/' . basename($css_files[0]);
    }
    
    // Look for React chunk
    $react_files = glob("$assetsDir/react*.js");
    if (!empty($react_files)) {
        $result['react'] = '/assets/' . basename($react_files[0]);
    }
    
    // Add other important chunks
    $important_chunks = ['index', 'ui'];
    foreach ($important_chunks as $chunk) {
        $chunk_files = glob("$assetsDir/{$chunk}*.js");
        if (!empty($chunk_files)) {
            $result['chunks'][] = '/assets/' . basename($chunk_files[0]);
        }
    }
    
    // Gather all JS files for preloading
    $all_js_files = glob("$assetsDir/*.js");
    foreach ($all_js_files as $file) {
        $filename = basename($file);
        // Skip files we've already included
        if (($result['js'] && strpos($result['js'], $filename) !== false) ||
            ($result['react'] && strpos($result['react'], $filename) !== false) ||
            (in_array('/assets/' . $filename, $result['chunks']))) {
            continue;
        }
        $result['chunks'][] = '/assets/' . $filename;
    }
    
    return $result;
}

// Function to update index.html
function updateIndexHtml($assets) {
    $indexPath = './index.html';
    
    if (!file_exists($indexPath)) {
        return "Error: index.html file not found";
    }
    
    // Create backup
    copy($indexPath, $indexPath . '.bak-' . date('YmdHis'));
    
    // Read content
    $content = file_get_contents($indexPath);
    $original = $content;
    
    // Remove existing preload links
    $content = preg_replace('/<link rel="preload"[^>]*>/i', '', $content);
    
    // Build new preload section
    $preloadLinks = '';
    
    // Add main JS
    if ($assets['js']) {
        $preloadLinks .= '  <link rel="preload" href="' . $assets['js'] . '" as="script" />' . "\n";
    }
    
    // Add CSS
    if ($assets['css']) {
        $preloadLinks .= '  <link rel="preload" href="' . $assets['css'] . '" as="stylesheet" />' . "\n";
    }
    
    // Add React
    if ($assets['react']) {
        $preloadLinks .= '  <link rel="preload" href="' . $assets['react'] . '" as="script" />' . "\n";
    }
    
    // Add other chunks (limited to most important ones)
    $chunkCount = 0;
    foreach ($assets['chunks'] as $chunk) {
        if ($chunkCount < 10) { // Limit to 10 most important chunks
            $preloadLinks .= '  <link rel="preload" href="' . $chunk . '" as="script" />' . "\n";
            $chunkCount++;
        }
    }
    
    // Insert preload links before </head>
    if (!empty($preloadLinks)) {
        $content = str_replace('</head>', $preloadLinks . '</head>', $content);
    }
    
    // Update main script reference
    if ($assets['js']) {
        // Replace existing script tag or add new one if not found
        if (preg_match('/<script[^>]*src="[^"]*main[^"]*\.js"[^>]*>/', $content)) {
            $content = preg_replace(
                '/<script[^>]*src="[^"]*main[^"]*\.js"[^>]*>/',
                '<script type="module" src="' . $assets['js'] . '">',
                $content
            );
        } else {
            // Add before closing body tag if not found
            $content = str_replace(
                '</body>',
                '  <script type="module" src="' . $assets['js'] . '"></script>' . "\n</body>",
                $content
            );
        }
    }
    
    // Update CSS reference
    if ($assets['css']) {
        // Replace existing link tag or add new one if not found
        if (preg_match('/<link[^>]*rel="stylesheet"[^>]*href="[^"]*\.css"[^>]*>/', $content)) {
            $content = preg_replace(
                '/<link[^>]*rel="stylesheet"[^>]*href="[^"]*\.css"[^>]*>/',
                '<link rel="stylesheet" href="' . $assets['css'] . '">',
                $content
            );
        } else {
            // Add before closing head tag if not found
            $content = str_replace(
                '</head>',
                '  <link rel="stylesheet" href="' . $assets['css'] . '">' . "\n</head>",
                $content
            );
        }
    }
    
    // Save changes if needed
    if ($content !== $original) {
        file_put_contents($indexPath, $content);
        return "Successfully updated index.html with correct asset references";
    }
    
    return "No changes needed in index.html";
}

// Main execution
$assets = findMainAssets();
$result = updateIndexHtml($assets);

// Output HTML page
?>
<!DOCTYPE html>
<html>
<head>
    <title>Fix Asset References</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .section { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        h1, h2 { color: #333; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        a.button { 
            display: inline-block; 
            background: #4CAF50; 
            color: white; 
            padding: 8px 16px; 
            text-decoration: none; 
            border-radius: 4px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>Fix Asset References Tool</h1>
    
    <div class="section">
        <h2>Result</h2>
        <p><?php echo $result; ?></p>
    </div>
    
    <div class="section">
        <h2>Assets Found</h2>
        <?php if ($assets['js']): ?>
            <p>Main JavaScript: <span class="success"><?php echo htmlspecialchars($assets['js']); ?></span></p>
        <?php else: ?>
            <p>Main JavaScript: <span class="error">Not found</span></p>
        <?php endif; ?>
        
        <?php if ($assets['css']): ?>
            <p>CSS: <span class="success"><?php echo htmlspecialchars($assets['css']); ?></span></p>
        <?php else: ?>
            <p>CSS: <span class="error">Not found</span></p>
        <?php endif; ?>
        
        <?php if ($assets['react']): ?>
            <p>React chunk: <span class="success"><?php echo htmlspecialchars($assets['react']); ?></span></p>
        <?php endif; ?>
        
        <?php if (!empty($assets['chunks'])): ?>
            <p>Other important chunks:</p>
            <ul>
                <?php foreach ($assets['chunks'] as $chunk): ?>
                    <li><?php echo htmlspecialchars($chunk); ?></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>Next Steps</h2>
        <p>To verify the changes:</p>
        <ol>
            <li>Check that all necessary JavaScript files are correctly referenced in your index.html</li>
            <li>Test your application by navigating to <a href="/" target="_blank">the homepage</a></li>
            <li>If issues persist, please check your browser console for errors</li>
        </ol>
        <a href="/" class="button">Go to Application</a>
    </div>
</body>
</html>
