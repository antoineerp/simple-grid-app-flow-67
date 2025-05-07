
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
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <h1>SFTP Connection Diagnostic</h1>
        
        <div class="card">
            <h2>FTP Error Analysis</h2>
            <p class="error">Your GitHub workflow reported a "530 Login incorrect" error</p>
            
            <h3>Common Causes for "530 Login incorrect":</h3>
            <ol>
                <li><strong>Incorrect Username/Password</strong> - The most common cause is simply that the credentials are incorrect</li>
                <li><strong>FTP Access Disabled</strong> - Some hosts disable FTP and only allow SFTP</li>
                <li><strong>Incorrect Port</strong> - Default FTP port is 21, but your server might use a different port</li>
                <li><strong>Connection Type Mismatch</strong> - You may need FTPS (FTP over SSL) or SFTP instead of regular FTP</li>
            </ol>
            
            <h3>Actions to Take:</h3>
            <ol>
                <li>Verify your FTP credentials directly with your Infomaniak admin panel</li>
                <li>Test a manual FTP connection using an FTP client like FileZilla</li>
                <li>Check if your host requires SFTP instead of FTP</li>
                <li>Verify there are no special characters in your password that might need escaping</li>
            </ol>
            
            <p>Use the test forms below to diagnose the issue:</p>
        </div>
        
        <div class="card">
            <h2>Server Information</h2>
            <pre>
Server: <?php echo $_SERVER['SERVER_NAME']; ?>
PHP Version: <?php echo phpversion(); ?>
Operating System: <?php echo php_uname(); ?>
            </pre>
        </div>
        
        <div class="card">
            <h2>SFTP Test</h2>
            <p>Test SFTP connection (recommended for Infomaniak):</p>
            <form method="post" action="">
                <div style="margin-bottom: 15px;">
                    <label for="sftp_server" style="display: block; margin-bottom: 5px;">Server:</label>
                    <input type="text" id="sftp_server" name="sftp_server" 
                           value="<?php echo htmlspecialchars($_POST['sftp_server'] ?? ''); ?>" 
                           style="width: 100%; padding: 8px; box-sizing: border-box;" 
                           placeholder="yourdomain.ftp.infomaniak.com">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="sftp_username" style="display: block; margin-bottom: 5px;">Username:</label>
                    <input type="text" id="sftp_username" name="sftp_username" 
                           value="<?php echo htmlspecialchars($_POST['sftp_username'] ?? ''); ?>" 
                           style="width: 100%; padding: 8px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="sftp_password" style="display: block; margin-bottom: 5px;">Password:</label>
                    <input type="password" id="sftp_password" name="sftp_password" 
                           value="<?php echo htmlspecialchars($_POST['sftp_password'] ?? ''); ?>" 
                           style="width: 100%; padding: 8px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="sftp_port" style="display: block; margin-bottom: 5px;">Port:</label>
                    <input type="text" id="sftp_port" name="sftp_port" 
                           value="<?php echo htmlspecialchars($_POST['sftp_port'] ?? '22'); ?>" 
                           style="width: 100%; padding: 8px; box-sizing: border-box;">
                </div>
                <div style="text-align: center;">
                    <input type="hidden" name="test_type" value="sftp">
                    <input type="submit" value="Test SFTP Connection" 
                           style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                </div>
            </form>
            
            <?php
            if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['test_type']) && $_POST['test_type'] === 'sftp') {
                $sftp_server = $_POST['sftp_server'] ?? '';
                $sftp_username = $_POST['sftp_username'] ?? '';
                $sftp_password = $_POST['sftp_password'] ?? '';
                $sftp_port = intval($_POST['sftp_port'] ?? 22);
                
                if (empty($sftp_server) || empty($sftp_username) || empty($sftp_password)) {
                    echo "<p class='error'>Please fill in all fields</p>";
                } else {
                    echo "<h3>SFTP Connection Test Results:</h3>";
                    
                    if (function_exists('ssh2_connect')) {
                        echo "<p>Testing connection to $sftp_server:$sftp_port...</p>";
                        $connection = @ssh2_connect($sftp_server, $sftp_port);
                        
                        if ($connection) {
                            echo "<p class='success'>SSH Connection successful!</p>";
                            
                            $auth_result = @ssh2_auth_password($connection, $sftp_username, $sftp_password);
                            if ($auth_result) {
                                echo "<p class='success'>Authentication successful!</p>";
                                
                                $sftp = @ssh2_sftp($connection);
                                if ($sftp) {
                                    echo "<p class='success'>SFTP subsystem initialized successfully!</p>";
                                    echo "<p class='success'>✅ Your SFTP credentials are valid!</p>";
                                    
                                    // Try to list directories
                                    $handle = @opendir("ssh2.sftp://$sftp/");
                                    if ($handle) {
                                        echo "<p>Directory listing:</p><ul>";
                                        while (false !== ($entry = readdir($handle))) {
                                            echo "<li>$entry</li>";
                                        }
                                        echo "</ul>";
                                        closedir($handle);
                                    } else {
                                        echo "<p class='warning'>Could not list directory contents.</p>";
                                    }
                                    
                                    echo "<div style='background-color: #f0fff0; padding: 15px; border-radius: 5px; margin-top: 15px;'>";
                                    echo "<h4>GitHub Workflow Update</h4>";
                                    echo "<p>Since SFTP works, update your GitHub workflow:</p>";
                                    echo "<pre style='background-color: #f8f8f8; padding: 10px;'>";
                                    echo "- name: Deploy to Infomaniak using SFTP\n";
                                    echo "  uses: wlixcc/SFTP-Deploy-Action@v1.2.4\n";
                                    echo "  with:\n";
                                    echo "    server: $sftp_server\n";
                                    echo "    username: $sftp_username\n";
                                    echo "    password: \${{ secrets.FTP_PASSWORD }}\n";
                                    echo "    port: $sftp_port\n";
                                    echo "    local_path: './dist/'\n";
                                    echo "    remote_path: '/sites/qualiopi.ch/'\n";
                                    echo "</pre>";
                                    echo "</div>";
                                } else {
                                    echo "<p class='error'>Failed to initialize SFTP subsystem.</p>";
                                }
                            } else {
                                echo "<p class='error'>Authentication failed. Check your username and password.</p>";
                            }
                        } else {
                            echo "<p class='error'>Failed to connect to $sftp_server:$sftp_port. Verify the server address and port.</p>";
                        }
                    } else {
                        echo "<p class='error'>SSH2 extension not installed on this server. Cannot test SFTP connection.</p>";
                        echo "<p>This doesn't mean your credentials are invalid - it just means this server can't test them.</p>";
                        echo "<p>Try testing with an FTP client like FileZilla.</p>";
                    }
                }
            }
            ?>
        </div>
        
        <div class="card">
            <h2>FTP Test</h2>
            <p>Test standard FTP connection:</p>
            <form method="post" action="">
                <div style="margin-bottom: 15px;">
                    <label for="ftp_server" style="display: block; margin-bottom: 5px;">Server:</label>
                    <input type="text" id="ftp_server" name="ftp_server" 
                           value="<?php echo htmlspecialchars($_POST['ftp_server'] ?? ''); ?>" 
                           style="width: 100%; padding: 8px; box-sizing: border-box;" 
                           placeholder="yourdomain.ftp.infomaniak.com">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="ftp_username" style="display: block; margin-bottom: 5px;">Username:</label>
                    <input type="text" id="ftp_username" name="ftp_username" 
                           value="<?php echo htmlspecialchars($_POST['ftp_username'] ?? ''); ?>" 
                           style="width: 100%; padding: 8px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="ftp_password" style="display: block; margin-bottom: 5px;">Password:</label>
                    <input type="password" id="ftp_password" name="ftp_password" 
                           value="<?php echo htmlspecialchars($_POST['ftp_password'] ?? ''); ?>" 
                           style="width: 100%; padding: 8px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="ftp_port" style="display: block; margin-bottom: 5px;">Port:</label>
                    <input type="text" id="ftp_port" name="ftp_port" 
                           value="<?php echo htmlspecialchars($_POST['ftp_port'] ?? '21'); ?>" 
                           style="width: 100%; padding: 8px; box-sizing: border-box;">
                </div>
                <div style="text-align: center;">
                    <input type="hidden" name="test_type" value="ftp">
                    <input type="submit" value="Test FTP Connection" 
                           style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                </div>
            </form>
            
            <?php
            if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['test_type']) && $_POST['test_type'] === 'ftp') {
                $ftp_server = $_POST['ftp_server'] ?? '';
                $ftp_username = $_POST['ftp_username'] ?? '';
                $ftp_password = $_POST['ftp_password'] ?? '';
                $ftp_port = intval($_POST['ftp_port'] ?? 21);
                
                if (empty($ftp_server) || empty($ftp_username) || empty($ftp_password)) {
                    echo "<p class='error'>Please fill in all fields</p>";
                } else {
                    echo "<h3>FTP Connection Test Results:</h3>";
                    
                    $timeout = 30;
                    $conn_id = @ftp_connect($ftp_server, $ftp_port, $timeout);
                    
                    if ($conn_id) {
                        echo "<p class='success'>Connected to FTP server!</p>";
                        
                        $login_result = @ftp_login($conn_id, $ftp_username, $ftp_password);
                        if ($login_result) {
                            echo "<p class='success'>Login successful!</p>";
                            echo "<p class='success'>✅ Your FTP credentials are valid!</p>";
                            
                            ftp_pasv($conn_id, true);
                            echo "<p>Passive mode enabled</p>";
                            
                            // Try to list directories
                            $contents = @ftp_nlist($conn_id, ".");
                            if ($contents !== false) {
                                echo "<p>Directory listing:</p><ul>";
                                foreach ($contents as $file) {
                                    echo "<li>$file</li>";
                                }
                                echo "</ul>";
                            } else {
                                echo "<p class='warning'>Could not list directory contents.</p>";
                            }
                            
                            echo "<div style='background-color: #f0fff0; padding: 15px; border-radius: 5px; margin-top: 15px;'>";
                            echo "<h4>GitHub Workflow Update</h4>";
                            echo "<p>Your FTP credentials are working! Update your GitHub workflow:</p>";
                            echo "<pre style='background-color: #f8f8f8; padding: 10px;'>";
                            echo "- name: Deploy to Infomaniak using FTP\n";
                            echo "  uses: SamKirkland/FTP-Deploy-Action@4.3.3\n";
                            echo "  with:\n";
                            echo "    server: $ftp_server\n";
                            echo "    username: $ftp_username\n";
                            echo "    password: \${{ secrets.FTP_PASSWORD }}\n";
                            echo "    local-dir: ./dist/\n";
                            echo "    server-dir: /sites/qualiopi.ch/\n";
                            echo "    dangerous-clean-slate: false\n";
                            echo "</pre>";
                            echo "</div>";
                        } else {
                            echo "<p class='error'>Login failed! Error code: " . error_get_last()['message'] . "</p>";
                            echo "<p>Double check your username and password.</p>";
                        }
                        
                        ftp_close($conn_id);
                    } else {
                        echo "<p class='error'>Could not connect to FTP server! Error code: " . error_get_last()['message'] . "</p>";
                        echo "<p>Possible reasons:</p>";
                        echo "<ul>";
                        echo "<li>The server address is incorrect</li>";
                        echo "<li>The port is incorrect (standard is 21)</li>";
                        echo "<li>The server doesn't support FTP (might require SFTP)</li>";
                        echo "<li>A firewall is blocking the connection</li>";
                        echo "</ul>";
                    }
                }
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Update GitHub Workflow</h2>
            <p>Based on your test results, you'll need to update your GitHub workflow file.</p>
            
            <h3>For FTP:</h3>
            <pre>
- name: Deploy to Infomaniak using FTP
  uses: SamKirkland/FTP-Deploy-Action@4.3.3
  with:
    server: ${{ secrets.FTP_SERVER }}
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    local-dir: ./dist/
    server-dir: /sites/qualiopi.ch/
    dangerous-clean-slate: false
            </pre>
            
            <h3>For SFTP:</h3>
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
            </pre>
            
            <h3>Important Notes:</h3>
            <ul>
                <li>Make sure your GitHub secrets match exactly what worked in the tests above</li>
                <li>Double-check for any special characters in passwords</li>
                <li>Most hosting providers now prefer SFTP over FTP for security reasons</li>
            </ul>
        </div>
    </div>
</body>
</html>
