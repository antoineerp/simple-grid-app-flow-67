
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>FTP/SFTP Connection Tester</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .step { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 15px; }
        .tabs { display: flex; margin-bottom: 15px; }
        .tab { padding: 10px 20px; cursor: pointer; border: 1px solid #ddd; border-bottom: none; }
        .tab.active { background-color: #f9f9f9; font-weight: bold; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
    <script>
        function switchTab(evt, tabName) {
            const tabs = document.getElementsByClassName("tab-content");
            for (let i = 0; i < tabs.length; i++) {
                tabs[i].style.display = "none";
            }
            
            const tabLinks = document.getElementsByClassName("tab");
            for (let i = 0; i < tabLinks.length; i++) {
                tabLinks[i].className = tabLinks[i].className.replace(" active", "");
            }
            
            document.getElementById(tabName).style.display = "block";
            evt.currentTarget.className += " active";
        }
        
        window.onload = function() {
            document.getElementById("defaultTab").click();
        };
    </script>
</head>
<body>
    <div class="container">
        <h1>FTP/SFTP Connection Troubleshooter</h1>
        
        <div class="card">
            <h2>GitHub Workflow Error Analysis</h2>
            <p class="error">"530 Login incorrect" error detected in deployment</p>
            
            <div class="step">
                <h3>What this error means:</h3>
                <p>The "530 Login incorrect" error indicates that your FTP server rejected the login credentials. This could be due to:</p>
                <ul>
                    <li>Incorrect username or password</li>
                    <li>The server only accepts SFTP connections (not FTP)</li>
                    <li>Special characters in credentials that need proper escaping</li>
                </ul>
            </div>
            
            <div class="tabs">
                <button class="tab active" id="defaultTab" onclick="switchTab(event, 'ftpTest')">Test FTP Connection</button>
                <button class="tab" onclick="switchTab(event, 'sftpTest')">Test SFTP Connection</button>
                <button class="tab" onclick="switchTab(event, 'instructions')">Deployment Instructions</button>
            </div>
        </div>
        
        <div id="ftpTest" class="tab-content active">
            <div class="card">
                <h2>FTP Connection Test</h2>
                <p>Use this form to test your FTP credentials:</p>
                
                <form method="post" action="">
                    <div style="margin-bottom: 15px;">
                        <label for="ftp_server" style="display: block; margin-bottom: 5px;">FTP Server:</label>
                        <input type="text" id="ftp_server" name="ftp_server" value="<?php echo htmlspecialchars($_POST['ftp_server'] ?? ''); ?>" style="width: 100%; padding: 8px; box-sizing: border-box;" placeholder="exemple.ftp.infomaniak.com">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="ftp_username" style="display: block; margin-bottom: 5px;">FTP Username:</label>
                        <input type="text" id="ftp_username" name="ftp_username" value="<?php echo htmlspecialchars($_POST['ftp_username'] ?? ''); ?>" style="width: 100%; padding: 8px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="ftp_password" style="display: block; margin-bottom: 5px;">FTP Password:</label>
                        <input type="password" id="ftp_password" name="ftp_password" value="<?php echo htmlspecialchars($_POST['ftp_password'] ?? ''); ?>" style="width: 100%; padding: 8px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="ftp_mode" style="display: block; margin-bottom: 5px;">Connection Type:</label>
                        <select id="ftp_mode" name="ftp_mode" style="width: 100%; padding: 8px; box-sizing: border-box;">
                            <option value="ftp" <?php echo (isset($_POST['ftp_mode']) && $_POST['ftp_mode'] === 'ftp') ? 'selected' : ''; ?>>FTP (standard)</option>
                            <option value="ftps" <?php echo (isset($_POST['ftp_mode']) && $_POST['ftp_mode'] === 'ftps') ? 'selected' : ''; ?>>FTPS (FTP over SSL)</option>
                        </select>
                    </div>
                    <div style="text-align: center;">
                        <input type="hidden" name="test_type" value="ftp">
                        <input type="submit" value="Test FTP Connection" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    </div>
                </form>

                <?php
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['test_type']) && $_POST['test_type'] === 'ftp') {
                    $ftp_server = $_POST['ftp_server'] ?? '';
                    $ftp_username = $_POST['ftp_username'] ?? '';
                    $ftp_password = $_POST['ftp_password'] ?? '';
                    $ftp_mode = $_POST['ftp_mode'] ?? 'ftp';
                    
                    echo '<h3>FTP Test Results</h3>';
                    echo "<p><strong>Testing connection to:</strong> " . htmlspecialchars($ftp_server) . "</p>";
                    echo "<p><strong>Username:</strong> " . htmlspecialchars($ftp_username) . "</p>";
                    echo "<p><strong>Connection type:</strong> " . htmlspecialchars($ftp_mode) . "</p>";
                    
                    // Standard FTP Test
                    if ($ftp_mode === 'ftp') {
                        echo '<h4>Standard FTP Connection Test</h4>';
                        
                        // Try to connect with a 10 second timeout
                        $conn_id = @ftp_connect($ftp_server, 21, 10);
                        
                        if ($conn_id) {
                            echo "<p class='success'>Connected to FTP server successfully</p>";
                            
                            // Try logging in
                            $login_result = @ftp_login($conn_id, $ftp_username, $ftp_password);
                            
                            if ($login_result) {
                                echo "<p class='success'>FTP Authentication successful!</p>";
                                
                                // Enable passive mode
                                ftp_pasv($conn_id, true);
                                
                                // Try to get current directory
                                try {
                                    $dir = ftp_pwd($conn_id);
                                    echo "<p>Current directory: " . htmlspecialchars($dir) . "</p>";
                                    
                                    // List files
                                    echo "<h4>Files in current directory:</h4>";
                                    echo "<pre>";
                                    $files = ftp_nlist($conn_id, ".");
                                    if ($files) {
                                        foreach ($files as $file) {
                                            echo htmlspecialchars($file) . "\n";
                                        }
                                    } else {
                                        echo "No files found or unable to list files\n";
                                    }
                                    echo "</pre>";
                                } catch (Exception $e) {
                                    echo "<p class='error'>Error listing directory: " . $e->getMessage() . "</p>";
                                }
                                
                                echo "<div style='background-color: #efffef; padding: 15px; border: 1px solid #d0f0d0; border-radius: 5px; margin-top: 15px;'>";
                                echo "<h3>✅ FTP Connection Successful!</h3>";
                                echo "<p>Your FTP credentials are working correctly. Use these settings in your GitHub workflow:</p>";
                                echo "<pre>";
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
                                echo "<p class='error'>FTP Login failed.</p>";
                                echo "<p>Error message: " . error_get_last()['message'] . "</p>";
                                echo "<p class='warning'>This is the same error you're getting in GitHub Actions.</p>";
                                echo "<p>Try testing SFTP instead - Infomaniak often requires SFTP rather than FTP.</p>";
                            }
                            
                            // Close FTP connection
                            ftp_close($conn_id);
                            echo "<p>FTP connection closed</p>";
                        } else {
                            echo "<p class='error'>Could not connect to FTP server</p>";
                            echo "<p>Error message: " . error_get_last()['message'] . "</p>";
                            echo "<p>Possible causes:</p>";
                            echo "<ul>";
                            echo "<li>FTP service is not running on the server</li>";
                            echo "<li>Firewall blocking connection</li>";
                            echo "<li>Incorrect hostname</li>";
                            echo "<li>The server might only support SFTP</li>";
                            echo "</ul>";
                            
                            echo "<p class='warning'>Try the SFTP test instead - many hosting providers now disable regular FTP.</p>";
                        }
                    }
                    
                    // FTPS Test
                    if ($ftp_mode === 'ftps') {
                        echo '<h4>FTPS (Secure FTP) Connection Test</h4>';
                        
                        if (function_exists('ftp_ssl_connect')) {
                            // Try to connect with a 10 second timeout
                            $conn_id = @ftp_ssl_connect($ftp_server, 21, 10);
                            
                            if ($conn_id) {
                                echo "<p class='success'>Connected to FTPS server successfully</p>";
                                
                                // Try logging in
                                $login_result = @ftp_login($conn_id, $ftp_username, $ftp_password);
                                
                                if ($login_result) {
                                    echo "<p class='success'>FTPS Authentication successful!</p>";
                                    
                                    // Enable passive mode
                                    ftp_pasv($conn_id, true);
                                    
                                    // Try to get current directory
                                    try {
                                        $dir = ftp_pwd($conn_id);
                                        echo "<p>Current directory: " . htmlspecialchars($dir) . "</p>";
                                        
                                        // List files
                                        echo "<h4>Files in current directory:</h4>";
                                        echo "<pre>";
                                        $files = ftp_nlist($conn_id, ".");
                                        if ($files) {
                                            foreach ($files as $file) {
                                                echo htmlspecialchars($file) . "\n";
                                            }
                                        } else {
                                            echo "No files found or unable to list files\n";
                                        }
                                        echo "</pre>";
                                    } catch (Exception $e) {
                                        echo "<p class='error'>Error listing directory: " . $e->getMessage() . "</p>";
                                    }
                                    
                                    echo "<div style='background-color: #efffef; padding: 15px; border: 1px solid #d0f0d0; border-radius: 5px; margin-top: 15px;'>";
                                    echo "<h3>✅ FTPS Connection Successful!</h3>";
                                    echo "<p>Your FTPS credentials are working correctly. Use these settings in your GitHub workflow:</p>";
                                    echo "<pre>";
                                    echo "- name: Deploy to Infomaniak using FTPS\n";
                                    echo "  uses: SamKirkland/FTP-Deploy-Action@4.3.3\n";
                                    echo "  with:\n";
                                    echo "    server: $ftp_server\n";
                                    echo "    username: $ftp_username\n";
                                    echo "    password: \${{ secrets.FTP_PASSWORD }}\n";
                                    echo "    local-dir: ./dist/\n";
                                    echo "    server-dir: /sites/qualiopi.ch/\n";
                                    echo "    protocol: ftps  # Use FTPS protocol\n";
                                    echo "    dangerous-clean-slate: false\n";
                                    echo "</pre>";
                                    echo "</div>";
                                } else {
                                    echo "<p class='error'>FTPS Login failed.</p>";
                                    echo "<p>Error message: " . error_get_last()['message'] . "</p>";
                                    echo "<p class='warning'>Try the SFTP test instead.</p>";
                                }
                                
                                // Close FTPS connection
                                ftp_close($conn_id);
                                echo "<p>FTPS connection closed</p>";
                            } else {
                                echo "<p class='error'>Could not connect to FTPS server</p>";
                                echo "<p>Error message: " . error_get_last()['message'] . "</p>";
                                echo "<p>Possible causes:</p>";
                                echo "<ul>";
                                echo "<li>FTPS service is not running on the server</li>";
                                echo "<li>Firewall blocking connection</li>";
                                echo "<li>Incorrect hostname</li>";
                                echo "<li>The server might only support SFTP</li>";
                                echo "</ul>";
                                
                                echo "<p class='warning'>Try the SFTP test instead - many hosting providers now use SFTP instead of FTPS.</p>";
                            }
                        } else {
                            echo "<p class='error'>The ftp_ssl_connect() function is not available on this server.</p>";
                            echo "<p>Your server doesn't have the necessary extensions to test FTPS connections.</p>";
                        }
                    }
                }
                ?>
            </div>
        </div>
        
        <div id="sftpTest" class="tab-content">
            <div class="card">
                <h2>SFTP Connection Test</h2>
                <p>Use this form to test your SFTP credentials:</p>
                
                <form method="post" action="">
                    <div style="margin-bottom: 15px;">
                        <label for="sftp_server" style="display: block; margin-bottom: 5px;">SFTP Server:</label>
                        <input type="text" id="sftp_server" name="sftp_server" value="<?php echo htmlspecialchars($_POST['sftp_server'] ?? ''); ?>" style="width: 100%; padding: 8px; box-sizing: border-box;" placeholder="exemple.ftp.infomaniak.com">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="sftp_username" style="display: block; margin-bottom: 5px;">SFTP Username:</label>
                        <input type="text" id="sftp_username" name="sftp_username" value="<?php echo htmlspecialchars($_POST['sftp_username'] ?? ''); ?>" style="width: 100%; padding: 8px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="sftp_password" style="display: block; margin-bottom: 5px;">SFTP Password:</label>
                        <input type="password" id="sftp_password" name="sftp_password" value="<?php echo htmlspecialchars($_POST['sftp_password'] ?? ''); ?>" style="width: 100%; padding: 8px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="sftp_port" style="display: block; margin-bottom: 5px;">SFTP Port:</label>
                        <input type="text" id="sftp_port" name="sftp_port" value="<?php echo htmlspecialchars($_POST['sftp_port'] ?? '22'); ?>" style="width: 100%; padding: 8px; box-sizing: border-box;" placeholder="22">
                    </div>
                    <div style="text-align: center;">
                        <input type="hidden" name="test_type" value="sftp">
                        <input type="submit" value="Test SFTP Connection" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    </div>
                </form>

                <?php
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['test_type']) && $_POST['test_type'] === 'sftp') {
                    $sftp_server = $_POST['sftp_server'] ?? '';
                    $sftp_username = $_POST['sftp_username'] ?? '';
                    $sftp_password = $_POST['sftp_password'] ?? '';
                    $sftp_port = intval($_POST['sftp_port'] ?? 22);
                    
                    echo '<h3>SFTP Test Results</h3>';
                    echo "<p><strong>Testing connection to:</strong> " . htmlspecialchars($sftp_server) . ":" . $sftp_port . "</p>";
                    echo "<p><strong>Username:</strong> " . htmlspecialchars($sftp_username) . "</p>";
                    
                    if (function_exists('ssh2_connect')) {
                        // Try to establish connection
                        $connection = @ssh2_connect($sftp_server, $sftp_port);
                        
                        if ($connection) {
                            echo "<p class='success'>SSH connection established</p>";
                            
                            // Try to authenticate
                            $auth_result = @ssh2_auth_password($connection, $sftp_username, $sftp_password);
                            
                            if ($auth_result) {
                                echo "<p class='success'>SFTP Authentication successful!</p>";
                                
                                // Initialize SFTP subsystem
                                $sftp = @ssh2_sftp($connection);
                                
                                if ($sftp) {
                                    echo "<p class='success'>SFTP subsystem initialized</p>";
                                    
                                    // Try to list directory contents
                                    $dir = "ssh2.sftp://$sftp/";
                                    $handle = @opendir($dir);
                                    
                                    if ($handle) {
                                        echo "<h4>Files in home directory:</h4>";
                                        echo "<pre>";
                                        while (false !== ($entry = readdir($handle))) {
                                            echo htmlspecialchars($entry) . "\n";
                                        }
                                        closedir($handle);
                                        echo "</pre>";
                                    } else {
                                        echo "<p class='warning'>Could not list directory contents.</p>";
                                        echo "<p>This might be due to permissions but authentication was successful.</p>";
                                    }
                                    
                                    echo "<div style='background-color: #efffef; padding: 15px; border: 1px solid #d0f0d0; border-radius: 5px; margin-top: 15px;'>";
                                    echo "<h3>✅ SFTP Connection Successful!</h3>";
                                    echo "<p>Your SFTP credentials are working correctly. Use these settings in your GitHub workflow:</p>";
                                    echo "<pre>";
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
                                    echo "<p class='error'>Failed to initialize SFTP subsystem</p>";
                                    echo "<p>This could be due to server configuration or permissions issues.</p>";
                                }
                            } else {
                                echo "<p class='error'>SFTP Authentication failed</p>";
                                echo "<p>Please check your username and password.</p>";
                            }
                        } else {
                            echo "<p class='error'>Could not connect to SFTP server</p>";
                            echo "<p>Error message: " . error_get_last()['message'] . "</p>";
                            echo "<p>Possible causes:</p>";
                            echo "<ul>";
                            echo "<li>SFTP service is not running on port $sftp_port</li>";
                            echo "<li>Firewall blocking connection</li>";
                            echo "<li>Incorrect hostname</li>";
                            echo "</ul>";
                        }
                    } else {
                        echo "<p class='error'>SSH2 extension is not installed on this server.</p>";
                        echo "<p>This server cannot perform SFTP tests because the required PHP extension is missing.</p>";
                        echo "<p>You can test using an SFTP client like FileZilla instead.</p>";
                    }
                }
                ?>
            </div>
        </div>
        
        <div id="instructions" class="tab-content">
            <div class="card">
                <h2>Deployment Instructions</h2>
                
                <div class="step">
                    <h3>Step 1: Verify Your Credentials</h3>
                    <p>First, make sure you have the correct credentials from Infomaniak:</p>
                    <ul>
                        <li>Host: Usually in format <code>yoursite.ftp.infomaniak.com</code></li>
                        <li>Username: Your FTP/SFTP username</li>
                        <li>Password: Your FTP/SFTP password</li>
                        <li>Port: 21 for FTP, 22 for SFTP</li>
                    </ul>
                    <p class="warning">Infomaniak typically uses SFTP (port 22) rather than traditional FTP.</p>
                </div>
                
                <div class="step">
                    <h3>Step 2: Update GitHub Secrets</h3>
                    <p>Make sure your GitHub repository has the following secrets configured:</p>
                    <ul>
                        <li><code>FTP_SERVER</code> - Your server hostname (e.g. yoursite.ftp.infomaniak.com)</li>
                        <li><code>FTP_USERNAME</code> - Your username</li>
                        <li><code>FTP_PASSWORD</code> - Your password</li>
                    </ul>
                    <p>These must match exactly what works in the connection tests above.</p>
                </div>
                
                <div class="step">
                    <h3>Step 3: Update GitHub Workflow</h3>
                    <p>Update your <code>.github/workflows/deploy.yml</code> file to use the correct protocol:</p>
                    
                    <p><strong>For FTP:</strong></p>
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
                    
                    <p><strong>For SFTP:</strong></p>
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
                </div>
            </div>
        </div>
    </div>
</body>
</html>
