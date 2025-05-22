
<?php
header('Content-Type: text/html; charset=utf-8');

// Basic server information
$server_info = [
    'PHP Version' => phpversion(),
    'Server Software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'Document Root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
    'Script Path' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
    'Request URI' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
];

// Check if PHP is working
$php_working = true;

// Check if files exist
$files_to_check = [
    'diagnose-assets.php' => 'File you mentioned',
    'index.html' => 'Main index file',
    'deploy.sh' => 'Deployment script',
    'run-deploy.php' => 'Deployment runner',
    'api/index.php' => 'API entry point',
    '.htaccess' => 'Apache configuration'
];

$file_status = [];
foreach ($files_to_check as $file => $description) {
    $file_status[$file] = [
        'exists' => file_exists($file),
        'readable' => is_readable($file),
        'type' => file_exists($file) ? filetype($file) : 'not found',
        'description' => $description
    ];
}

// Check for .htaccess issues
$htaccess_content = file_exists('.htaccess') ? file_get_contents('.htaccess') : 'File not found';
?>

<!DOCTYPE html>
<html>
<head>
    <title>PHP Server Diagnostic</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
        table { border-collapse: collapse; width: 100%; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 10px; text-align: left; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>PHP Server Diagnostic</h1>
    
    <div class="section">
        <h2>PHP Status</h2>
        <?php if ($php_working): ?>
            <p class="success">PHP is working correctly on this server!</p>
        <?php else: ?>
            <p class="error">PHP may not be working correctly on this server.</p>
        <?php endif; ?>
        
        <h3>Server Information:</h3>
        <table>
            <?php foreach ($server_info as $key => $value): ?>
                <tr>
                    <th><?php echo htmlspecialchars($key); ?></th>
                    <td><?php echo htmlspecialchars($value); ?></td>
                </tr>
            <?php endforeach; ?>
        </table>
    </div>
    
    <div class="section">
        <h2>File Accessibility Check</h2>
        <table>
            <tr>
                <th>File</th>
                <th>Description</th>
                <th>Exists</th>
                <th>Readable</th>
                <th>Type</th>
            </tr>
            <?php foreach ($file_status as $file => $status): ?>
                <tr>
                    <td><?php echo htmlspecialchars($file); ?></td>
                    <td><?php echo htmlspecialchars($status['description']); ?></td>
                    <td class="<?php echo $status['exists'] ? 'success' : 'error'; ?>">
                        <?php echo $status['exists'] ? 'Yes' : 'No'; ?>
                    </td>
                    <td class="<?php echo $status['readable'] ? 'success' : 'error'; ?>">
                        <?php echo $status['readable'] ? 'Yes' : 'No'; ?>
                    </td>
                    <td><?php echo htmlspecialchars($status['type']); ?></td>
                </tr>
            <?php endforeach; ?>
        </table>
    </div>
    
    <div class="section">
        <h2>.htaccess Analysis</h2>
        <pre><?php echo htmlspecialchars($htaccess_content); ?></pre>
        
        <h3>Recommendations:</h3>
        <ul>
            <li>Make sure your server has PHP enabled</li>
            <li>Ensure .htaccess is properly configured and allowed (AllowOverride All)</li>
            <li>Check file permissions (usually 644 for files, 755 for directories)</li>
            <li>Verify that your web server is configured to handle PHP files</li>
            <li>Try moving diagnose-assets.php to the api/ directory if it still doesn't work at root level</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Try Direct Access to API</h2>
        <p>Click these links to test direct access to your API endpoints:</p>
        <ul>
            <li><a href="api/phpinfo-test.php" target="_blank">PHP Info Test</a></li>
            <li><a href="api/server-status.php" target="_blank">Server Status</a></li>
            <li><a href="api/diagnose-assets.php" target="_blank">API Assets Diagnostic</a></li>
        </ul>
    </div>
    
    <p><a href="/">Return to application</a></p>
</body>
</html>
