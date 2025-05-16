
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
        .tab-container { border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
        .tab-buttons { display: flex; background: #f5f5f5; }
        .tab-button { padding: 10px 20px; cursor: pointer; border: none; background: none; font-size: 16px; }
        .tab-button.active { background: white; border-bottom: 2px solid #4CAF50; font-weight: bold; }
        .tab-content { padding: 15px; display: none; }
        .tab-content.active { display: block; }
        .copy-btn { background: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; float: right; }
        .copy-btn:hover { background: #5a6268; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Connection Diagnostic Tool</h1>
        
        <div class="card">
            <h2>System Information</h2>
            <pre>
Server: <?php echo $_SERVER['SERVER_NAME']; ?>
PHP Version: <?php echo phpversion(); ?>
Operating System: <?php echo php_uname(); ?>
            </pre>
        </div>
        
        <div class="tab-container">
            <div class="tab-buttons">
                <button class="tab-button active" onclick="openTab(event, 'sftp-tab')">SFTP Test</button>
                <button class="tab-button" onclick="openTab(event, 'ftp-tab')">FTP Test</button>
                <button class="tab-button" onclick="openTab(event, 'node-tab')">Node.js Version</button>
                <button class="tab-button" onclick="openTab(event, 'workflow-tab')">GitHub Workflow</button>
            </div>
            
            <div id="sftp-tab" class="tab-content active">
                <h2>SFTP Connection Test</h2>
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
            
            <div id="ftp-tab" class="tab-content">
                <h2>FTP Connection Test</h2>
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
            
            <div id="node-tab" class="tab-content">
                <h2>Node.js Version Check</h2>
                <p>Many packages require Node.js v18 or higher. This tool will help diagnose Node.js compatibility issues.</p>
                
                <h3>Node Version Script</h3>
                <div style="position: relative;">
                    <button class="copy-btn" onclick="copyToClipboard('node-script')">Copy</button>
                    <pre id="node-script">
#!/usr/bin/env node

// Simple script to check Node.js compatibility
const requiredVersion = '18.0.0';
const currentVersion = process.version;

console.log('Node Version Check');
console.log('-----------------');
console.log(`Current Node.js version: ${currentVersion}`);
console.log(`Required Node.js version: >= ${requiredVersion}`);

// Parse versions
const parseVersion = (versionString) => {
  const parts = versionString.replace('v', '').split('.').map(Number);
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
    raw: parts
  };
};

const current = parseVersion(currentVersion);
const required = parseVersion(requiredVersion);

// Check major version
const isCompatible = current.major >= required.major;

console.log(`\nCompatibility check: ${isCompatible ? 'PASSED ✅' : 'FAILED ❌'}`);

if (!isCompatible) {
  console.log('\nYour Node.js version is too old for some dependencies.');
  console.log('Options:');
  console.log('1. Update Node.js to version 18 or higher');
  console.log('   - Using NVM: "nvm install 18 && nvm use 18"');
  console.log('   - Direct download: https://nodejs.org/');
  console.log('\n2. If updating locally is not possible, use GitHub Actions with Node 20');
  console.log('   - The workflow has been updated to use Node.js 20');
}

// Check for NPM
try {
  const { execSync } = require('child_process');
  const npmVersion = execSync('npm --version').toString().trim();
  console.log(`NPM version: ${npmVersion}`);
} catch (error) {
  console.log('Could not detect NPM version');
}

// Exit with code 0 to not break build pipelines
process.exit(0);
                    </pre>
                </div>
                
                <h3>How to use</h3>
                <ol>
                    <li>Save this script as <code>node-version-check.js</code></li>
                    <li>Make it executable: <code>chmod +x node-version-check.js</code></li>
                    <li>Run it: <code>./node-version-check.js</code></li>
                </ol>
                
                <h3>Common Node.js Version Issues</h3>
                <ul>
                    <li><strong>esbuild errors:</strong> esbuild v0.25.0 requires Node.js 18+</li>
                    <li><strong>ESLint errors:</strong> ESLint v9+ requires Node.js 18+</li>
                    <li><strong>Vite errors:</strong> Vite v5+ requires Node.js 18+</li>
                </ul>
            </div>
            
            <div id="workflow-tab" class="tab-content">
                <h2>GitHub Workflow Configuration</h2>
                
                <h3>Updated Workflow for Node.js 20</h3>
                <div style="position: relative;">
                    <button class="copy-btn" onclick="copyToClipboard('github-workflow')">Copy</button>
                    <pre id="github-workflow">
name: Deploy to Infomaniak

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install Dependencies
      run: npm install
      
    - name: Build React App
      run: npm run build
      env:
        NODE_OPTIONS: --max-old-space-size=4096
      
    # ... rest of your workflow ...
    
    - name: Try SFTP deployment first
      id: sftp-deploy
      uses: wlixcc/SFTP-Deploy-Action@v1.2.4
      continue-on-error: true
      with:
        server: ${{ secrets.FTP_SERVER }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        port: 22
        local_path: './dist/'
        remote_path: '/sites/qualiopi.ch/'
    
    - name: Deploy using FTP if SFTP failed
      if: steps.sftp-deploy.outcome == 'failure'
      uses: SamKirkland/FTP-Deploy-Action@4.3.3
      with:
        server: ${{ secrets.FTP_SERVER }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        local-dir: ./dist/
        server-dir: /sites/qualiopi.ch/
        dangerous-clean-slate: false
        timeout: 120000
        protocol: ftp
                    </pre>
                </div>
            </div>
        </div>
        
        <div class="card" style="margin-top: 20px;">
            <h2>More Help</h2>
            <p>For more help with deployment issues:</p>
            <ul>
                <li>Check GitHub Actions logs for detailed error messages</li>
                <li>Test your FTP/SFTP credentials with FileZilla or another client</li>
                <li>Verify that your secrets are correctly set in GitHub repository settings</li>
                <li>Try manually running the build process before deployment</li>
            </ul>
        </div>
    </div>
    
    <script>
        function openTab(evt, tabName) {
            let i, tabContent, tabButtons;
            
            // Hide all tab content
            tabContent = document.getElementsByClassName("tab-content");
            for (i = 0; i < tabContent.length; i++) {
                tabContent[i].style.display = "none";
                tabContent[i].className = tabContent[i].className.replace(" active", "");
            }
            
            // Remove "active" class from tab buttons
            tabButtons = document.getElementsByClassName("tab-button");
            for (i = 0; i < tabButtons.length; i++) {
                tabButtons[i].className = tabButtons[i].className.replace(" active", "");
            }
            
            // Show current tab and add "active" class to button
            document.getElementById(tabName).style.display = "block";
            document.getElementById(tabName).className += " active";
            evt.currentTarget.className += " active";
        }
        
        function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            const text = element.textContent;
            
            navigator.clipboard.writeText(text).then(function() {
                alert('Copied to clipboard!');
            }, function(err) {
                console.error('Could not copy text: ', err);
            });
        }
    </script>
</body>
</html>
