
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>SFTP Connection Diagnostic</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <h1>SFTP Connection Diagnostic</h1>
        
        <div class="card">
            <h2>Server Information</h2>
            <pre>
Server: <?php echo $_SERVER['SERVER_NAME']; ?>
PHP Version: <?php echo phpversion(); ?>
Operating System: <?php echo php_uname(); ?>
            </pre>
        </div>
        
        <div class="card">
            <h2>Network Connectivity Test</h2>
            <?php
            // Test ability to make outbound connections
            $testHosts = [
                'github.com' => 443,
                'api.github.com' => 443
            ];
            
            foreach ($testHosts as $host => $port) {
                $startTime = microtime(true);
                $conn = @fsockopen($host, $port, $errno, $errstr, 5);
                $endTime = microtime(true);
                
                if ($conn) {
                    echo "<p class='success'>Connection to {$host}:{$port} successful (" . round(($endTime - $startTime) * 1000) . "ms)</p>";
                    fclose($conn);
                } else {
                    echo "<p class='error'>Failed to connect to {$host}:{$port} - Error {$errno}: {$errstr}</p>";
                }
            }
            ?>
        </div>
        
        <div class="card">
            <h2>SFTP Extension Status</h2>
            <?php
            if (function_exists('ssh2_connect')) {
                echo "<p class='success'>SSH2 extension is installed</p>";
                
                // Display SSH2 extension info
                if (extension_loaded('ssh2')) {
                    echo "<pre>";
                    $ssh2Info = get_extension_funcs('ssh2');
                    echo "Available SSH2 functions:\n";
                    print_r($ssh2Info);
                    echo "</pre>";
                }
            } else {
                echo "<p class='error'>SSH2 extension is NOT installed. This is required for SFTP connections directly from PHP.</p>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Infomaniak Connection Information</h2>
            <p>For Infomaniak hosting, SFTP connections typically use:</p>
            <ul>
                <li>Port: <strong>22</strong> (standard SSH/SFTP port)</li>
                <li>Server format: <code>your-site.ftp.infomaniak.com</code></li>
            </ul>
            <p>In GitHub Actions workflow file, ensure you're using:</p>
            <pre>
- name: Deploy to Infomaniak using SFTP
  uses: wlixcc/SFTP-Deploy-Action@v1.2.4
  with:
    server: ${{ secrets.FTP_SERVER }}
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    port: 22
    local_path: './dist/'
    remote_path: '/sites/qualiopi.ch/'
    delete_remote_files: false
    sftp_only: true 
    sftpArgs: '-o ConnectTimeout=60'
            </pre>
        </div>
        
        <div class="card">
            <h2>Troubleshooting Steps</h2>
            <ol>
                <li>Verify that port 22 is open on Infomaniak's server</li>
                <li>Double-check your FTP_SERVER value in GitHub secrets (format: yourdomain.ftp.infomaniak.com)</li>
                <li>Ensure your FTP_USERNAME and FTP_PASSWORD are correct</li>
                <li>Contact Infomaniak support to ensure SFTP access is enabled for your hosting account</li>
                <li>Try connecting with an SFTP client like FileZilla to test credentials manually</li>
            </ol>
        </div>
    </div>
</body>
</html>
