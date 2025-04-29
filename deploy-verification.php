
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Deployment Verification</title>
    <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
        h1, h2 { color: #2563eb; }
        .card { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
        .success { color: #16a34a; font-weight: bold; }
        .error { color: #dc2626; font-weight: bold; }
        .warning { color: #ca8a04; font-weight: bold; }
        pre { background: #f1f5f9; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 14px; }
        .btn { display: inline-block; background-color: #2563eb; color: white; padding: 10px 16px; border-radius: 6px; text-decoration: none; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>FormaCert Deployment Verification</h1>
    
    <div class="card">
        <h2>1. Server Environment</h2>
        <p>PHP Version: <strong><?php echo phpversion(); ?></strong></p>
        <p>Server Software: <strong><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></strong></p>
        <p>Document Root: <code><?php echo $_SERVER['DOCUMENT_ROOT']; ?></code></p>
        <p>Current Working Directory: <code><?php echo getcwd(); ?></code></p>
        <p>Host Name: <strong><?php echo gethostname(); ?></strong></p>
    </div>
    
    <div class="card">
        <h2>2. Critical Files Check</h2>
        <?php
        $critical_files = [
            'index.html' => 'Main HTML file',
            '.htaccess' => 'Root htaccess configuration',
            'assets/index.js' => 'Assets bridge file',
            'api/index.php' => 'API entry point',
            'api/.htaccess' => 'API htaccess configuration',
            'api/test.php' => 'API test file'
        ];
        
        foreach ($critical_files as $file => $description) {
            echo "<p>";
            if (file_exists($file)) {
                echo "$description (<code>$file</code>): <span class='success'>FOUND</span> (" . filesize($file) . " bytes)";
            } else {
                echo "$description (<code>$file</code>): <span class='error'>MISSING</span>";
            }
            echo "</p>";
        }
        ?>
    </div>
    
    <div class="card">
        <h2>3. API Test</h2>
        <p>Testing API functionality...</p>
        
        <?php
        $api_url = 'http://' . $_SERVER['HTTP_HOST'] . '/api/test.php';
        
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $api_url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            $response = curl_exec($ch);
            $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($status == 200) {
                echo "<p>API response status: <span class='success'>OK ($status)</span></p>";
                echo "<pre>" . htmlspecialchars($response) . "</pre>";
            } else {
                echo "<p>API response status: <span class='error'>ERROR ($status)</span></p>";
            }
        } else {
            // Alternative method if curl is not available
            $ctx = stream_context_create(['http' => ['timeout' => 5]]);
            $response = @file_get_contents($api_url, false, $ctx);
            
            if ($response !== false) {
                echo "<p>API response: <span class='success'>OK</span></p>";
                echo "<pre>" . htmlspecialchars($response) . "</pre>";
            } else {
                echo "<p>API response: <span class='error'>FAILED</span></p>";
                echo "<p>Attempting direct inclusion of test.php...</p>";
                
                ob_start();
                include_once('api/test.php');
                $direct_output = ob_get_clean();
                
                echo "<pre>" . htmlspecialchars($direct_output) . "</pre>";
            }
        }
        ?>
    </div>
    
    <div class="card">
        <h2>4. Assets Check</h2>
        <?php
        $assets_dir = 'assets';
        if (is_dir($assets_dir)) {
            $js_files = glob("$assets_dir/*.js");
            $css_files = glob("$assets_dir/*.css");
            
            echo "<p>JavaScript files: <strong>" . count($js_files) . "</strong> found</p>";
            echo "<p>CSS files: <strong>" . count($css_files) . "</strong> found</p>";
            
            if (count($js_files) > 0 || count($css_files) > 0) {
                echo "<p>Asset loading: <span class='success'>OK</span></p>";
            } else {
                echo "<p>Asset loading: <span class='warning'>No assets found</span></p>";
            }
        } else {
            echo "<p>Assets directory: <span class='error'>MISSING</span></p>";
        }
        ?>
    </div>
    
    <p><a href="/" class="btn">Go to Home Page</a></p>
    
    <div class="card">
        <h2>Troubleshooting</h2>
        <p>If you're experiencing issues with the deployment:</p>
        <ol>
            <li>Check that the PHP files have correct permissions (644)</li>
            <li>Verify that .htaccess files are being processed by the server</li>
            <li>Confirm that all required files were uploaded during deployment</li>
            <li>Check your server's error logs for detailed information</li>
        </ol>
    </div>
</body>
</html>
